-- ═══════════════════════════════════════════════════════════════════════════
-- 0023 — Taksonomi yönetimden düzenleniyor (ADR 0008)
--
-- 1) Anahtar kelime denetimi: `upsert_book` otomatik etiketlemede anahtar
--    kelimeleri düzenli ifade olarak kullanıyor (`~*`). Yönetimden yazılan
--    tek bir bozuk ifade ("kıskanç(") O ANDAN SONRA HER KİTAP KAYDINI
--    düşürürdü. Tetikleyici bozuk ifadeyi kayıt anında, Türkçe bir mesajla
--    reddediyor.
--
-- 2) `\b` → `\y`: Eski senkron betiği eşleştirmeyi JavaScript'te yapıyordu;
--    orada `\b` kelime sınırı. Postgres'te `\b` GERİ SİLME karakteri, kelime
--    sınırı `\y`. Eşleştirme 0022'de veritabanına taşınınca "yas" ve "ay"
--    anahtar kelimeleri sessizce hiç eşleşmez oldu. Tetikleyici `\b`'yi
--    `\y`'ye çeviriyor; var olan kayıtlar da aşağıda çevriliyor.
--
-- 3) `taxonomy_usage()`: Bir konu ya da ilgi alanı silinince kitap
--    etiketlerinden, çocuk profillerinden ve keşif modlarından da silinir
--    (cascade). Yönetici silmeden önce kaç yerde kullanıldığını görmeli.
--    Çocuk tablolarını personel RLS ile göremiyor (bilinçli, bkz. 0018);
--    fonksiyon satır değil yalnızca sayı döndürüyor.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1–2) Anahtar kelime tetikleyicisi ─────────────────────────────────────
create or replace function public.normalize_keywords()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  v_keyword text;
begin
  -- Boşlukları kırp, boşları at, tekrarları ele; sıra korunur.
  select coalesce(array_agg(cleaned.word order by cleaned.first_position), '{}')
    into new.keywords
  from (
    select replace(trim(u.raw), '\b', '\y') as word, min(u.position) as first_position
    from unnest(new.keywords) with ordinality as u (raw, position)
    where trim(u.raw) <> ''
    group by replace(trim(u.raw), '\b', '\y')
  ) as cleaned;

  foreach v_keyword in array new.keywords loop
    if char_length(v_keyword) < 2 then
      raise exception 'Anahtar kelime en az 2 karakter olmalı: "%".', v_keyword
        using errcode = '22023', hint = 'kullaniciya-goster';
    end if;

    begin
      perform '' ~* v_keyword;
    exception
      when invalid_regular_expression then
        raise exception 'Anahtar kelime okunamadı: "%". Parantez, köşeli parantez, yıldız gibi özel işaretleri kaldırın.', v_keyword
          using errcode = '22023', hint = 'kullaniciya-goster';
    end;
  end loop;

  return new;
end;
$$;

revoke execute on function public.normalize_keywords() from public, anon, authenticated;

create trigger development_topics_keywords
  before insert or update of keywords on public.development_topics
  for each row execute function public.normalize_keywords();

create trigger interests_keywords
  before insert or update of keywords on public.interests
  for each row execute function public.normalize_keywords();

-- Var olan `\b`'li kayıtlar: kendine atama tetikleyiciyi çalıştırıyor.
update public.development_topics set keywords = keywords
where position('\b' in array_to_string(keywords, ' ')) > 0;

update public.interests set keywords = keywords
where position('\b' in array_to_string(keywords, ' ')) > 0;

-- ─── 3) Kullanım sayıları ──────────────────────────────────────────────────
create or replace function public.taxonomy_usage()
returns table (kind text, slug text, books integer, children integer, modes integer)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
begin
  -- Definer olduğu için RLS'i baypas ediyor; yetkiyi elle kontrol etmek şart.
  if not public.is_staff() then
    raise exception 'yetkisiz' using errcode = '42501';
  end if;

  return query
    select 'topic'::text, t.slug,
      (select count(*)::int from public.book_topics x where x.topic_id = t.id),
      (select count(*)::int from public.child_focus_topics x where x.topic_id = t.id),
      (select count(*)::int from public.discovery_mode_topics x where x.topic_id = t.id)
    from public.development_topics t
    union all
    select 'interest'::text, i.slug,
      (select count(*)::int from public.book_interests x where x.interest_id = i.id),
      (select count(*)::int from public.child_interests x where x.interest_id = i.id),
      (select count(*)::int from public.discovery_mode_interests x where x.interest_id = i.id)
    from public.interests i;
end;
$$;

revoke execute on function public.taxonomy_usage() from public, anon;
grant execute on function public.taxonomy_usage() to authenticated;
