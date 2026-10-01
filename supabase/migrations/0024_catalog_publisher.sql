-- Katalog aramasında yayınevi de aransın diye `catalog_books` görünümüne
-- yayınevi adı eklendi. Yeni sütun SONA ekleniyor; `create or replace` buna
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
    '{}'::text[]
  ) as author_names,
  coalesce(
    (select array_agg(distinct dt.slug)
     from public.book_topics bt
     join public.development_topics dt on dt.id = bt.topic_id
     where bt.book_id = b.id),
    '{}'::text[]
  ) as topic_slugs,
  coalesce(
    (select array_agg(distinct da.slug)
     from public.book_topics bt
     join public.development_topics dt on dt.id = bt.topic_id
     join public.development_areas da on da.id = dt.area_id
     where bt.book_id = b.id),
    '{}'::text[]
  ) as area_slugs,
  coalesce(
    (select array_agg(distinct i.slug)
     from public.book_interests bi
     join public.interests i on i.id = bi.interest_id
     where bi.book_id = b.id),
    '{}'::text[]
  ) as interest_slugs,
  b.cover_thumb_path,
  b.cover_width,
  b.cover_height,
  (select pub.name from public.publishers pub where pub.id = b.publisher_id) as publisher_name
from public.books b;
