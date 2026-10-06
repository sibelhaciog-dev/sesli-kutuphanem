import type { SupabaseClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'
import type { BookLikeStat, SponsoredSlot } from '@/lib/featured'
import type { FeaturedSlotInput } from '@/lib/sponsorship'
import type { Database } from '@/lib/supabase/database.types'
import { createPublicClient } from '@/lib/supabase/public'

/**
 * "Ayın kitabı" vitrini ve sponsorluk (0026).
 *
 * Vitrin herkese açık; oturumsuz istemciyle okunup 5 dakika önbellekte
 * tutuluyor. Yönetimden dönem eklenip silinince `FEATURED_TAG` temizleniyor.
 * Hangi kitabın seçileceği `src/lib/featured.ts`'te (saf mantık).
 */

type Client = SupabaseClient<Database>

export const FEATURED_TAG = 'featured'
const CACHE_SECONDS = 300

export interface FeaturedSource {
  sponsored: SponsoredSlot | null
  stats: BookLikeStat[]
}

async function fetchFeaturedSource(): Promise<FeaturedSource> {
  const supabase = createPublicClient()
  // RLS ziyaretçiye yalnızca bugün yayında olan dönemi gösteriyor; tarih
  // filtresi veritabanında (Türkiye saatiyle).
  const [slot, stats] = await Promise.all([
    supabase
      .from('featured_books')
      .select('book_id, sponsor_name, sponsor_url, blurb')
      .order('starts_on', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.rpc('book_like_stats'),
  ])

  if (slot.error) throw new Error(`Ayın kitabı okunamadı: ${slot.error.message}`)
  if (stats.error) throw new Error(`Beğeniler okunamadı: ${stats.error.message}`)

  return {
    sponsored: slot.data
      ? {
          bookId: slot.data.book_id,
          sponsorName: slot.data.sponsor_name,
          sponsorUrl: slot.data.sponsor_url,
          blurb: slot.data.blurb,
        }
      : null,
    stats: (stats.data ?? []).map((row) => ({
      bookId: row.book_id,
      ratingCount: row.rating_count,
      ratingSum: row.rating_sum,
      favoriteCount: row.favorite_count,
    })),
  }
}

const cachedFeaturedSource = unstable_cache(fetchFeaturedSource, ['featured-source'], {
  revalidate: CACHE_SECONDS,
  tags: [FEATURED_TAG],
})

/**
 * Vitrin süs; okunamazsa ana sayfa düşmemeli. Hata yutulur, vitrin yalnızca
 * en yeni kitapla gösterilir. Yakalama önbelleğin dışında ki hata 5 dakika
 * önbellekte kalmasın.
 */
export async function getFeaturedSource(): Promise<FeaturedSource> {
  try {
    return await cachedFeaturedSource()
  } catch (error) {
    console.error('Ayın kitabı okunamadı, en yeni kitapla devam ediliyor:', error)
    return { sponsored: null, stats: [] }
  }
}

// ─── Yönetim ─────────────────────────────────────────────────────────────────

export interface AdminFeaturedSlot {
  id: string
  bookId: string
  bookTitle: string
  bookSlug: string
  startsOn: string
  endsOn: string
  sponsorName: string
  sponsorUrl: string | null
  blurb: string | null
}

export type SponsorApplicationStatus = Database['public']['Enums']['sponsor_application_status']

export interface AdminSponsorApplication {
  id: string
  contactName: string
  contactEmail: string
  organization: string | null
  bookTitle: string
  bookLink: string | null
  preferredMonth: string | null
  message: string | null
  status: SponsorApplicationStatus
  createdAt: string
}

export async function listFeaturedSlots(supabase: Client): Promise<AdminFeaturedSlot[]> {
  const { data, error } = await supabase
    .from('featured_books')
    .select('id, book_id, starts_on, ends_on, sponsor_name, sponsor_url, blurb, books(title, slug)')
    .order('starts_on', { ascending: false })
    .limit(100)
  if (error) throw new Error(`Vitrin dönemleri okunamadı: ${error.message}`)
  return (data ?? []).map((row) => ({
    id: row.id,
    bookId: row.book_id,
    bookTitle: row.books?.title ?? '(silinmiş kitap)',
    bookSlug: row.books?.slug ?? '',
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    sponsorName: row.sponsor_name,
    sponsorUrl: row.sponsor_url,
    blurb: row.blurb,
  }))
}

export async function listSponsorApplications(
  supabase: Client,
): Promise<AdminSponsorApplication[]> {
  const { data, error } = await supabase
    .from('sponsor_applications')
    .select(
      'id, contact_name, contact_email, organization, book_title, book_link, preferred_month, message, status, created_at',
    )
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw new Error(`Başvurular okunamadı: ${error.message}`)
  return (data ?? []).map((row) => ({
    id: row.id,
    contactName: row.contact_name,
    contactEmail: row.contact_email,
    organization: row.organization,
    bookTitle: row.book_title,
    bookLink: row.book_link,
    preferredMonth: row.preferred_month,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
  }))
}

/** Yönetim formundaki kitap seçimi için yayındaki kitaplar. */
export async function listPublishedBookOptions(
  supabase: Client,
): Promise<{ id: string; title: string }[]> {
  const { data, error } = await supabase
    .from('books')
    .select('id, title')
    .eq('status', 'published')
    .order('title')
  if (error) throw new Error(`Kitaplar okunamadı: ${error.message}`)
  return data ?? []
}

export async function saveFeaturedSlot(
  supabase: Client,
  id: string | null,
  input: FeaturedSlotInput,
): Promise<void> {
  const row = {
    book_id: input.bookId,
    starts_on: input.startsOn,
    ends_on: input.endsOn,
    sponsor_name: input.sponsorName,
    sponsor_url: input.sponsorUrl,
    blurb: input.blurb,
  }
  const { error } = id
    ? await supabase.from('featured_books').update(row).eq('id', id)
    : await supabase.from('featured_books').insert(row)
  if (error) throw error
}

export async function deleteFeaturedSlot(supabase: Client, id: string): Promise<void> {
  const { error } = await supabase.from('featured_books').delete().eq('id', id)
  if (error) throw error
}

export async function setSponsorApplicationStatus(
  supabase: Client,
  id: string,
  status: SponsorApplicationStatus,
): Promise<void> {
  const { error } = await supabase.from('sponsor_applications').update({ status }).eq('id', id)
  if (error) throw error
}
