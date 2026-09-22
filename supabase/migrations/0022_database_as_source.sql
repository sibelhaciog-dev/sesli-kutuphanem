-- ═══════════════════════════════════════════════════════════════════════════
-- 0022 — Veritabanı yazım kaynağı (ADR 0008) ve kapak varyantları (ADR 0009)
--
-- Kitaplar, taksonomi ve keşif modları artık doğrudan veritabanında
-- yönetiliyor; `content/` klasörü yalnızca ilk kurulum tohumu ve yedek.
--
-- Bu migration üç şey kuruyor:
--
--   1. Kapak için küçük varyant ve boyut sütunları.
--   2. `upsert_book(payload)` — kitap + katkıda bulunanlar + konular + ilgi
--      alanları TEK İŞLEMDE. Yönetim formu da, Claude'un kitap ekleme betiği
--      de bunu çağırıyor; iki yol asla farklı davranmıyor ve yarım kalmış
--      kitap oluşmuyor.
--   3. `save_discovery_mode(payload)` — mod + eğilimleri tek işlemde.
--
-- YETKİ: Fonksiyonlar `security definer` (RLS'i baypas ederek birden çok
-- tabloya yazabilsin diye), dolayısıyla yetki kontrolü ELLE yapılıyor:
--   · editör/yönetici (`is_staff()`)            → yönetim arayüzü
--   · `service_role` JWT'si                     → gizli anahtarla gelen istek
--   · rol değişimi yapılmamış doğrudan bağlantı → `DATABASE_URL` betikleri
-- Son madde güvenlik açığı değil: doğrudan veritabanı bağlantısı olan biri
-- zaten her tabloya yazabiliyor. PostgREST üzerinden gelen istekler her
-- zaman `authenticated`/`anon` rolüne geçtiği için bu dala düşemez.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1) Kapak varyantları ──────────────────────────────────────────────────
-- `cover_path` büyük varyant (kitap sayfası), `cover_thumb_path` küçük
-- varyant (kartlar). Boyutlar kartta yer tutucu oranı için.
alter table public.books
  add column if not exists cover_thumb_path text,
  add column if not exists cover_width smallint
    check (cover_width is null or cover_width > 0),
  add column if not exists cover_height smallint
    check (cover_height is null or cover_height > 0);

-- ─── 2) Görünümler ─────────────────────────────────────────────────────────
-- `catalog_books`: yeni sütunlar SONA ekleniyor; `create or replace` buna
-- izin veriyor ve mevcut yetkiler korunuyor.
create or replace view public.catalog_books
with (security_invoker = on)
as
select
  b.id,
  b.slug,
  b.title,
  b.subtitle,
  b.summary,
  b.language,
  b.age_min,
  b.age_max,
  b.cover_path,
  b.instagram_url,
  b.like_count,
  b.posted_at,
  b.status,
  coalesce(
    (select array_agg(p.display_name order by bc.position, p.display_name)
     from public.book_contributors bc
     join public.people p on p.id = bc.person_id
     where bc.book_id = b.id and bc.role = 'author'),
    '{}'
  ) as author_names,
  coalesce(
    (select array_agg(distinct dt.slug)
     from public.book_topics bt
     join public.development_topics dt on dt.id = bt.topic_id
     where bt.book_id = b.id),
    '{}'
  ) as topic_slugs,
  coalesce(
    (select array_agg(distinct da.slug)
     from public.book_topics bt
     join public.development_topics dt on dt.id = bt.topic_id
     join public.development_areas da on da.id = dt.area_id
     where bt.book_id = b.id),
    '{}'
  ) as area_slugs,
  coalesce(
    (select array_agg(distinct i.slug)
     from public.book_interests bi
     join public.interests i on i.id = bi.interest_id
     where bi.book_id = b.id),
    '{}'
  ) as interest_slugs,
  b.cover_thumb_path,
  b.cover_width,
  b.cover_height
from public.books b;

-- `book_details` `b.*` kullandığı için yeni sütunlar ORTAYA düşerdi;
-- `create or replace` buna izin vermiyor. Silip yeniden kuruyoruz ve
-- yetkiyi tekrar veriyoruz. Yönetim formu için ilgi alanlarını ve konu
-- kaynağını (editoryal/otomatik) da ekliyoruz.
drop view if exists public.book_details;
create view public.book_details
with (security_invoker = on)
as
select
  b.*,
  pub.name as publisher_name,
  pub.slug as publisher_slug,
  s.title as series_title,
  s.slug as series_slug,
  coalesce(
    (select jsonb_agg(jsonb_build_object(
       'slug', p.slug, 'name', p.display_name, 'role', bc.role
     ) order by bc.role, bc.position)
     from public.book_contributors bc
     join public.people p on p.id = bc.person_id
     where bc.book_id = b.id),
    '[]'::jsonb
  ) as contributors,
  coalesce(
    (select jsonb_agg(jsonb_build_object(
       'topicSlug', dt.slug, 'topicName', dt.name,
       'areaSlug', da.slug, 'areaName', da.name,
       'emoji', da.emoji, 'color', da.color,
       'relevance', bt.relevance, 'source', bt.source
     ) order by bt.relevance desc, dt.position)
     from public.book_topics bt
     join public.development_topics dt on dt.id = bt.topic_id
     join public.development_areas da on da.id = dt.area_id
     where bt.book_id = b.id),
    '[]'::jsonb
  ) as topics,
  coalesce(
    (select jsonb_agg(jsonb_build_object(
       'slug', i.slug, 'name', i.name, 'source', bi.source
     ) order by i.position)
     from public.book_interests bi
     join public.interests i on i.id = bi.interest_id
     where bi.book_id = b.id),
    '[]'::jsonb
  ) as interests
from public.books b
left join public.publishers pub on pub.id = b.publisher_id
left join public.series s on s.id = b.series_id;

grant select on public.book_details to anon, authenticated;

-- ─── 3) Yetki yardımcısı ───────────────────────────────────────────────────
-- Yukarıdaki üç durumdan biri mi? `security definer` içinde `current_user`
-- fonksiyon sahibine döndüğü için rol bilgisi oturum ayarından okunuyor:
-- PostgREST her istekte `set role authenticated|anon|service_role` yapıyor,
-- doğrudan bağlantıda bu ayar `none` kalıyor.
create or replace function public.can_manage_content()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select public.is_staff()
      or coalesce(nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role', '')
           = 'service_role'
      or coalesce(nullif(current_setting('role', true), ''), 'none') in ('none', 'service_role');
$$;

revoke execute on function public.can_manage_content() from public, anon;
grant execute on function public.can_manage_content() to authenticated, service_role;

-- Kullanıcıya gösterilecek hatalar `hint = 'kullaniciya-goster'` taşır;
-- `src/lib/errors.ts` bunları ham veritabanı metni saymaz ve olduğu gibi
-- gösterir. Mesajlar bu yüzden Türkçe ve eksiksiz yazılıyor.

-- ─── 4) upsert_book ────────────────────────────────────────────────────────
-- payload (TypeScript'teki `BookInput` ile aynı biçim — src/lib/books/input.ts):
--   title*, slug, subtitle, originalTitle, summary, description, language,
--   ageMin, ageMax, pageCount, isbn13, publishedYear, status,
--   publisher, series { title, position },
--   authors[], illustrators[], translators[],
--   topics[{ slug, relevance }], interests[slug],
--   instagram { url, shortcode, postedAt, likeCount }, autoTag
--
-- Dönen değer: { status: created|updated|skipped, id, slug }
-- `overwrite = false` iken var olan slug'a DOKUNULMAZ ("skipped"): bir
-- listeyi ikinci kez vermek mevcut kitapları ezmesin.
--
-- Kapak alanlarına bu fonksiyon dokunmuyor; kapak ayrı yükleniyor (0009).
create or replace function public.upsert_book(payload jsonb, overwrite boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_title text := nullif(trim(payload ->> 'title'), '');
  v_slug text;
  v_existing uuid;
  v_book_id uuid;
  v_publisher_id uuid;
  v_series_id uuid;
  v_person_id uuid;
  v_ref_id uuid;
  v_name text;
  v_position integer;
  v_haystack text;
  v_contributor record;
  v_topic record;
begin
  if not public.can_manage_content() then
    raise exception 'Kitap eklemek için editör yetkisi gerekiyor.'
      using errcode = '42501', hint = 'kullaniciya-goster';
  end if;

  if v_title is null then
    raise exception 'Kitap adı boş olamaz.'
      using errcode = '22023', hint = 'kullaniciya-goster';
  end if;

  v_slug := coalesce(nullif(trim(payload ->> 'slug'), ''), public.slugify(v_title));
  if v_slug = '' then
    raise exception 'Kitap adından adres üretilemedi; adres alanını elle doldurun.'
      using errcode = '22023', hint = 'kullaniciya-goster';
  end if;

  select id into v_existing from public.books where slug = v_slug;
  if v_existing is not null and not overwrite then
    return jsonb_build_object('status', 'skipped', 'id', v_existing, 'slug', v_slug);
  end if;

  -- Yayınevi ve seri adla verilir; yoksa oluşturulur.
  v_name := nullif(trim(payload ->> 'publisher'), '');
  if v_name is not null then
    insert into public.publishers (slug, name)
    values (public.slugify(v_name), v_name)
    on conflict (slug) do update set name = excluded.name
    returning id into v_publisher_id;
  end if;

  v_name := nullif(trim(payload -> 'series' ->> 'title'), '');
  if v_name is not null then
    insert into public.series (slug, title, publisher_id)
    values (public.slugify(v_name), v_name, v_publisher_id)
    on conflict (slug) do update set title = excluded.title
    returning id into v_series_id;
  end if;

  insert into public.books (
    slug, title, subtitle, original_title, summary, description, language,
    age_min, age_max, page_count, isbn13, published_year,
    publisher_id, series_id, series_position,
    instagram_url, instagram_shortcode, like_count, posted_at, status
  ) values (
    v_slug,
    v_title,
    nullif(trim(payload ->> 'subtitle'), ''),
    nullif(trim(payload ->> 'originalTitle'), ''),
    coalesce(trim(payload ->> 'summary'), ''),
    nullif(trim(payload ->> 'description'), ''),
    coalesce(nullif(payload ->> 'language', ''), 'tr')::public.language_code,
    nullif(payload ->> 'ageMin', '')::smallint,
    nullif(payload ->> 'ageMax', '')::smallint,
    nullif(payload ->> 'pageCount', '')::smallint,
    nullif(payload ->> 'isbn13', ''),
    nullif(payload ->> 'publishedYear', '')::smallint,
    v_publisher_id,
    v_series_id,
    nullif(payload -> 'series' ->> 'position', '')::smallint,
    nullif(trim(payload -> 'instagram' ->> 'url'), ''),
    nullif(trim(payload -> 'instagram' ->> 'shortcode'), ''),
    coalesce(nullif(payload -> 'instagram' ->> 'likeCount', '')::integer, 0),
    nullif(payload -> 'instagram' ->> 'postedAt', '')::date,
    coalesce(nullif(payload ->> 'status', ''), 'published')::public.content_status
  )
  on conflict (slug) do update set
    title = excluded.title,
    subtitle = excluded.subtitle,
    original_title = excluded.original_title,
    summary = excluded.summary,
    description = excluded.description,
    language = excluded.language,
    age_min = excluded.age_min,
    age_max = excluded.age_max,
    page_count = excluded.page_count,
    isbn13 = excluded.isbn13,
    published_year = excluded.published_year,
    publisher_id = excluded.publisher_id,
    series_id = excluded.series_id,
    series_position = excluded.series_position,
    instagram_url = excluded.instagram_url,
    instagram_shortcode = excluded.instagram_shortcode,
    like_count = excluded.like_count,
    posted_at = excluded.posted_at,
    status = excluded.status
  returning id into v_book_id;

  -- ─── Katkıda bulunanlar: baştan yazılır ─────────────────────────────────
  delete from public.book_contributors where book_id = v_book_id;

  for v_contributor in
    select role, name, ordinality
    from (values ('author', 'authors'), ('illustrator', 'illustrators'),
                 ('translator', 'translators')) as roles (role, key),
         lateral jsonb_array_elements_text(coalesce(payload -> roles.key, '[]'::jsonb))
           with ordinality as names (name, ordinality)
    where trim(names.name) <> ''
  loop
    v_name := trim(v_contributor.name);
    insert into public.people (slug, display_name)
    values (public.slugify(v_name), v_name)
    on conflict (slug) do update set display_name = excluded.display_name
    returning id into v_person_id;

    insert into public.book_contributors (book_id, person_id, role, position)
    values (v_book_id, v_person_id, v_contributor.role::public.contributor_role,
            v_contributor.ordinality - 1)
    on conflict do nothing;
  end loop;

  -- ─── Konular: editoryal olanlar baştan yazılır ─────────────────────────
  delete from public.book_topics where book_id = v_book_id;

  for v_topic in
    select * from jsonb_to_recordset(coalesce(payload -> 'topics', '[]'::jsonb))
      as t (slug text, relevance integer)
  loop
    select id into v_ref_id from public.development_topics where slug = v_topic.slug;
    if v_ref_id is null then
      raise exception 'Bilinmeyen gelişim konusu: "%". Rehberler listesindeki adlardan birini kullanın.', v_topic.slug
        using errcode = '22023', hint = 'kullaniciya-goster';
    end if;

    insert into public.book_topics (book_id, topic_id, relevance, source)
    values (v_book_id, v_ref_id, coalesce(v_topic.relevance, 3), 'editorial')
    on conflict (book_id, topic_id) do update
      set relevance = excluded.relevance, source = 'editorial';
  end loop;

  -- ─── İlgi alanları ─────────────────────────────────────────────────────
  delete from public.book_interests where book_id = v_book_id;

  for v_name in
    select value from jsonb_array_elements_text(coalesce(payload -> 'interests', '[]'::jsonb))
  loop
    select id into v_ref_id from public.interests where slug = v_name;
    if v_ref_id is null then
      raise exception 'Bilinmeyen ilgi alanı: "%".', v_name
        using errcode = '22023', hint = 'kullaniciya-goster';
    end if;

    insert into public.book_interests (book_id, interest_id, source)
    values (v_book_id, v_ref_id, 'editorial')
    on conflict (book_id, interest_id) do update set source = 'editorial';
  end loop;

  -- ─── Otomatik etiketleme ──────────────────────────────────────────────
  -- Anahtar kelimeler artık veritabanında (taksonomi yönetimden düzenleniyor),
  -- dolayısıyla eşleştirme de burada. Editoryal etiketler korunur; yalnızca
  -- eksik olanlar `auto` olarak eklenir.
  if coalesce((payload ->> 'autoTag')::boolean, true) then
    v_haystack := concat_ws(' ', v_title, payload ->> 'subtitle', payload ->> 'summary');

    insert into public.book_topics (book_id, topic_id, relevance, source)
    select v_book_id, t.id, 2, 'auto'
    from public.development_topics t
    where cardinality(t.keywords) > 0
      and v_haystack ~* array_to_string(t.keywords, '|')
    on conflict (book_id, topic_id) do nothing;

    insert into public.book_interests (book_id, interest_id, source)
    select v_book_id, i.id, 'auto'
    from public.interests i
    where cardinality(i.keywords) > 0
      and v_haystack ~* array_to_string(i.keywords, '|')
    on conflict (book_id, interest_id) do nothing;
  end if;

  return jsonb_build_object(
    'status', case when v_existing is null then 'created' else 'updated' end,
    'id', v_book_id,
    'slug', v_slug
  );
end;
$$;

revoke execute on function public.upsert_book(jsonb, boolean) from public, anon;
grant execute on function public.upsert_book(jsonb, boolean) to authenticated, service_role;

-- ─── 5) save_discovery_mode ────────────────────────────────────────────────
-- payload: slug, name*, emoji, description, promptHint, language, position,
--          isActive, topics[{ slug, weight }], interests[{ slug, weight }]
create or replace function public.save_discovery_mode(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_name text := nullif(trim(payload ->> 'name'), '');
  v_slug text;
  v_mode_id uuid;
  v_ref_id uuid;
  v_weight record;
begin
  if not public.can_manage_content() then
    raise exception 'Keşif modlarını düzenlemek için editör yetkisi gerekiyor.'
      using errcode = '42501', hint = 'kullaniciya-goster';
  end if;

  if v_name is null then
    raise exception 'Mod adı boş olamaz.' using errcode = '22023', hint = 'kullaniciya-goster';
  end if;

  v_slug := coalesce(nullif(trim(payload ->> 'slug'), ''), public.slugify(v_name));

  insert into public.discovery_modes
    (slug, name, emoji, description, prompt_hint, language, position, is_active)
  values (
    v_slug,
    v_name,
    nullif(trim(payload ->> 'emoji'), ''),
    nullif(trim(payload ->> 'description'), ''),
    nullif(trim(payload ->> 'promptHint'), ''),
    nullif(payload ->> 'language', '')::public.language_code,
    coalesce(nullif(payload ->> 'position', '')::smallint, 0),
    coalesce((payload ->> 'isActive')::boolean, true)
  )
  on conflict (slug) do update set
    name = excluded.name,
    emoji = excluded.emoji,
    description = excluded.description,
    prompt_hint = excluded.prompt_hint,
    language = excluded.language,
    position = excluded.position,
    is_active = excluded.is_active
  returning id into v_mode_id;

  delete from public.discovery_mode_topics where mode_id = v_mode_id;
  for v_weight in
    select * from jsonb_to_recordset(coalesce(payload -> 'topics', '[]'::jsonb))
      as w (slug text, weight integer)
  loop
    select id into v_ref_id from public.development_topics where slug = v_weight.slug;
    if v_ref_id is null then
      raise exception 'Bilinmeyen gelişim konusu: "%".', v_weight.slug
        using errcode = '22023', hint = 'kullaniciya-goster';
    end if;
    insert into public.discovery_mode_topics (mode_id, topic_id, weight)
    values (v_mode_id, v_ref_id, coalesce(v_weight.weight, 3));
  end loop;

  delete from public.discovery_mode_interests where mode_id = v_mode_id;
  for v_weight in
    select * from jsonb_to_recordset(coalesce(payload -> 'interests', '[]'::jsonb))
      as w (slug text, weight integer)
  loop
    select id into v_ref_id from public.interests where slug = v_weight.slug;
    if v_ref_id is null then
      raise exception 'Bilinmeyen ilgi alanı: "%".', v_weight.slug
        using errcode = '22023', hint = 'kullaniciya-goster';
    end if;
    insert into public.discovery_mode_interests (mode_id, interest_id, weight)
    values (v_mode_id, v_ref_id, coalesce(v_weight.weight, 3));
  end loop;

  return v_mode_id;
end;
$$;

revoke execute on function public.save_discovery_mode(jsonb) from public, anon;
grant execute on function public.save_discovery_mode(jsonb) to authenticated, service_role;
