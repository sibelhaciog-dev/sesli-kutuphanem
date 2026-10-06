-- ═══════════════════════════════════════════════════════════════════════════
-- Herkese açık okuma notları
--
-- Önceden "Herkese açık" seçeneği yalnızca bir etiketti: RLS notları sadece
-- sahibine açıyordu ve kitap sayfasında başkalarının notları için bir alan
-- yoktu. Bu migration ile:
--
-- 1) "Aile içi" seçeneği arayüzden kalktı. Bu notlar zaten yalnızca sahibine
--    görünüyordu; anlam değişmeden `private` yapılıyor. Enum değeri, geri
--    alınması zor olduğu için yerinde bırakıldı.
-- 2) Herkese açık notlar editör onayından geçer (`approved_at`). Onaysız not
--    yalnızca sahibine görünür. Not metni ya da gizliliği değişirse onay düşer;
--    onay alanlarını yalnızca editör yazabilir (tetikleyici).
-- 3) `book_public_notes(book_id)`: giriş yapmış herkes, bir kitabın ONAYLI
--    herkese açık notlarını görür. Yazan kişi ve çocuk bilgisi döndürülmez
--    (isimsiz, "Bir veli").
-- 4) `moderation_public_notes()` + `moderate_public_note(id, approve)`:
--    editör onay bekleyen notları kitap adıyla görür; onaylar ya da notu
--    "Sadece bana"ya çevirerek yayından kaldırır (not silinmez).
--
-- Fonksiyonlar SECURITY DEFINER: personel kütüphane kayıtlarını RLS ile
-- göremiyor (bilinçli, bkz. 0018); yalnızca gereken alanlar döndürülüyor.
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1) Aile içi → Sadece bana ─────────────────────────────────────────────
update public.reading_notes set visibility = 'private' where visibility = 'family';

-- ─── 2) Onay alanları ──────────────────────────────────────────────────────
alter table public.reading_notes
  add column approved_at timestamptz,
  add column approved_by uuid references auth.users (id) on delete set null;

create index reading_notes_public_approved_idx
  on public.reading_notes (library_item_id, created_at desc)
  where visibility = 'public' and approved_at is not null;

create index reading_notes_public_pending_idx
  on public.reading_notes (created_at)
  where visibility = 'public' and approved_at is null;

create or replace function public.guard_reading_note_approval()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if tg_op = 'INSERT' then
    if not public.is_staff() then
      new.approved_at := null;
      new.approved_by := null;
    end if;
    return new;
  end if;

  if new.body is distinct from old.body or new.visibility is distinct from old.visibility then
    -- İçerik ya da gizlilik değişti: yeniden onay gerekir.
    new.approved_at := null;
    new.approved_by := null;
  elsif not public.is_staff() then
    -- Üye onay alanlarına dokunamaz.
    new.approved_at := old.approved_at;
    new.approved_by := old.approved_by;
  end if;
  return new;
end;
$$;

revoke execute on function public.guard_reading_note_approval() from public, anon, authenticated;

create trigger reading_notes_guard_approval
  before insert or update on public.reading_notes
  for each row execute function public.guard_reading_note_approval();

-- ─── 3) Kitap sayfası: onaylı herkese açık notlar ──────────────────────────
create or replace function public.book_public_notes(target_book_id uuid)
returns table (id uuid, body text, created_at timestamptz)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select n.id, n.body, n.created_at
  from public.reading_notes n
  join public.library_items li on li.id = n.library_item_id
  where li.book_id = target_book_id
    and n.visibility = 'public'
    and n.approved_at is not null
    and auth.uid() is not null
  order by n.created_at desc
  limit 100;
$$;

revoke execute on function public.book_public_notes(uuid) from public, anon;
grant execute on function public.book_public_notes(uuid) to authenticated;

-- ─── 4) Editör: onay listesi ve karar ──────────────────────────────────────
create or replace function public.moderation_public_notes()
returns table (
  id uuid,
  body text,
  created_at timestamptz,
  approved_at timestamptz,
  book_title text,
  book_slug text
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
begin
  if not public.is_staff() then
    raise exception 'yetkisiz' using errcode = '42501';
  end if;

  return query
    select n.id, n.body, n.created_at, n.approved_at,
      coalesce(b.title, cb.title), b.slug
    from public.reading_notes n
    join public.library_items li on li.id = n.library_item_id
    left join public.books b on b.id = li.book_id
    left join public.custom_books cb on cb.id = li.custom_book_id
    where n.visibility = 'public'
    -- Önce onay bekleyenler (eskiden yeniye), sonra yayındakiler.
    order by (n.approved_at is not null), n.created_at
    limit 300;
end;
$$;

revoke execute on function public.moderation_public_notes() from public, anon;
grant execute on function public.moderation_public_notes() to authenticated;

create or replace function public.moderate_public_note(note_id uuid, approve boolean)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_staff() then
    raise exception 'yetkisiz' using errcode = '42501';
  end if;

  if approve then
    update public.reading_notes
      set approved_at = now(), approved_by = auth.uid()
      where id = note_id and visibility = 'public';
  else
    -- Reddedilen not silinmez; sahibine "Sadece bana" olarak kalır.
    update public.reading_notes
      set visibility = 'private'
      where id = note_id and visibility = 'public';
  end if;
end;
$$;

revoke execute on function public.moderate_public_note(uuid, boolean) from public, anon;
grant execute on function public.moderate_public_note(uuid, boolean) to authenticated;
