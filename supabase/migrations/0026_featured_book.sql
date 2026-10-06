-- ═══════════════════════════════════════════════════════════════════════════
-- 0026 — Ayın kitabı ve sponsorluk başvuruları
--
-- Ana sayfanın üstünde bir "Ayın kitabı" vitrini var. İki kaynaktan dolar:
--
-- 1) Sponsorlu dönem (`featured_books`): Yayınevi ya da yazar başvurur,
--    ekip anlaşır ve yönetimden tarih aralığı girer. O aralıkta vitrinde
--    sponsorun kitabı "Sponsorlu" etiketiyle görünür. Dönemler çakışamaz —
--    aynı gün iki sponsora söz verilmesin diye kısıt veritabanında.
--
-- 2) Sponsor yoksa en çok beğenilen kitap. Beğeni bilgisi `library_items`
--    içinde (puan + favori) ve o tablo RLS ile ebeveynle sınırlı. Toplamı
--    `book_like_stats()` veriyor: yalnızca kitap başına SAYI döner, kimin
--    neyi beğendiği görünmez (0018 ile aynı ilke). Skorlama uygulamada
--    (`src/lib/featured.ts`), testli.
--
-- 3) Başvurular (`sponsor_applications`): "Kitabını paylaş" formu. Geri
--    bildirimle aynı desen — giriş yapan gönderir, kendi başvurusunu ve
--    ekip hepsini görür. Giriş zorunlu: anonim yazmaya açık bir tablo,
--    herkese açık anahtarla dakikada binlerce sahte kayıt demek.
-- ═══════════════════════════════════════════════════════════════════════════

-- Türkiye'de bugün. Vitrin dönemleri gün olarak tutuluyor; sunucu UTC'de
-- olduğu için gece 00:00–03:00 arası "dün" sayılmasın.
create or replace function public.local_today()
returns date
language sql
stable
set search_path = public, pg_temp
as $$
  select (now() at time zone 'Europe/Istanbul')::date
$$;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'sponsor_application_status') then
    create type public.sponsor_application_status
      as enum ('new', 'in_review', 'accepted', 'declined');
  end if;
end $$;

-- ─── Sponsorluk başvuruları ────────────────────────────────────────────────
create table public.sponsor_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,

  contact_name text not null check (char_length(trim(contact_name)) between 2 and 120),
  contact_email text not null
    check (char_length(contact_email) <= 254 and contact_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  organization text check (organization is null or char_length(organization) <= 120),
  book_title text not null check (char_length(trim(book_title)) between 1 and 200),
  book_link text check (book_link is null or (char_length(book_link) <= 500 and book_link ~ '^https?://')),
  /** İstenen ayın ilk günü; boşsa "fark etmez". */
  preferred_month date check (preferred_month is null or extract(day from preferred_month) = 1),
  message text check (message is null or char_length(message) <= 2000),

  status public.sponsor_application_status not null default 'new',
  staff_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sponsor_applications_status_idx
  on public.sponsor_applications (status, created_at desc);
create index sponsor_applications_user_idx on public.sponsor_applications (user_id);

create trigger sponsor_applications_updated_at before update on public.sponsor_applications
  for each row execute function public.set_updated_at();

-- ─── Sponsorlu vitrin dönemleri ────────────────────────────────────────────
create table public.featured_books (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books (id) on delete cascade,
  starts_on date not null,
  ends_on date not null,

  sponsor_name text not null check (char_length(trim(sponsor_name)) between 1 and 120),
  sponsor_url text
    check (sponsor_url is null or (char_length(sponsor_url) <= 500 and sponsor_url ~ '^https?://')),
  /** Vitrinde kitabın altında görünen kısa sponsor mesajı. */
  blurb text check (blurb is null or char_length(blurb) <= 300),

  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint featured_books_date_order check (ends_on >= starts_on),
  -- Aynı güne iki sponsor düşemez. Aralık tipinin kendi gist sınıfı var;
  -- ek uzantı gerekmiyor.
  constraint featured_books_no_overlap
    exclude using gist (daterange(starts_on, ends_on, '[]') with &&)
);

create index featured_books_book_idx on public.featured_books (book_id);
create index featured_books_created_by_idx on public.featured_books (created_by);

create trigger featured_books_updated_at before update on public.featured_books
  for each row execute function public.set_updated_at();

-- ─── En çok beğenilenler ───────────────────────────────────────────────────
-- Satır değil sayı: kitap başına kaç çocuk puan verdi, puanların toplamı,
-- kaç çocuk favoriledi. Yalnızca yayındaki katalog kitapları.
create or replace function public.book_like_stats()
returns table (book_id uuid, rating_count integer, rating_sum integer, favorite_count integer)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    li.book_id,
    (count(*) filter (where li.rating > 0))::int,
    (coalesce(sum(li.rating) filter (where li.rating > 0), 0))::int,
    (count(*) filter (where li.is_favorite))::int
  from public.library_items li
  join public.books b on b.id = li.book_id and b.status = 'published'
  join public.children c on c.id = li.child_id and c.archived_at is null
  where li.rating > 0 or li.is_favorite
  group by li.book_id
$$;

-- ═══ RLS ═══════════════════════════════════════════════════════════════════
alter table public.sponsor_applications enable row level security;
alter table public.featured_books enable row level security;

create policy "sponsor_applications_insert_own" on public.sponsor_applications
  for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'new' and staff_note is null);
create policy "sponsor_applications_read_own" on public.sponsor_applications
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_staff()));
create policy "sponsor_applications_staff_update" on public.sponsor_applications
  for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "sponsor_applications_staff_delete" on public.sponsor_applications
  for delete to authenticated using ((select public.is_staff()));

-- Ziyaretçi yalnızca BUGÜN yayında olan dönemi görür; ileri tarihli
-- anlaşmalar (sponsor adı dahil) önceden sızmasın.
create policy "featured_books_public_read" on public.featured_books
  for select
  using (
    (starts_on <= (select public.local_today()) and ends_on >= (select public.local_today()))
    or (select public.is_staff())
  );
create policy "featured_books_staff_insert" on public.featured_books
  for insert to authenticated with check ((select public.is_staff()));
create policy "featured_books_staff_update" on public.featured_books
  for update to authenticated
  using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "featured_books_staff_delete" on public.featured_books
  for delete to authenticated using ((select public.is_staff()));

-- ═══ İzinler (0011 deseni) ═════════════════════════════════════════════════
grant select on public.featured_books to anon, authenticated;
grant insert, update, delete on public.featured_books to authenticated;
grant select, insert, update, delete on public.sponsor_applications to authenticated;

revoke execute on function public.local_today() from public;
grant execute on function public.local_today() to anon, authenticated, service_role;
revoke execute on function public.book_like_stats() from public;
grant execute on function public.book_like_stats() to anon, authenticated, service_role;
