import type { SupabaseClient } from '@supabase/supabase-js'
import type { AreaInput, InterestInput, ModeInput, TopicInput } from '@/lib/admin/taxonomy-input'
import { toUpsertPayload, type BookInput } from '@/lib/books/input'
import { COVER_BUCKET } from '@/lib/images/cover'
import { slugify } from '@/lib/slug'
import type { Database } from '@/lib/supabase/database.types'
import { coverUrl } from './catalog'

/**
 * Yönetim arayüzünün okuma ve yazmaları (ADR 0008).
 *
 * Hepsi çağıranın oturumuyla çalışıyor: yetkiyi RLS ve `security definer`
 * fonksiyonlarındaki `can_manage_content()` denetimi veriyor. Sunucu
 * eylemleri ayrıca personel kontrolü yapıyor, ama asıl kilit veritabanında.
 */

type Client = SupabaseClient<Database>

/** Mesajı olduğu gibi kullanıcıya gösterilebilecek hata (Türkçe, iç ad yok). */
export class AdminError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AdminError'
  }
}

export type BookStatus = 'draft' | 'published' | 'archived'

// ─── Kitap listesi ───────────────────────────────────────────────────────────

export interface AdminBookRow {
  id: string
  slug: string
  title: string
  status: BookStatus
  language: 'tr' | 'en'
  ageMin: number | null
  ageMax: number | null
  postedAt: string | null
  authors: string[]
  coverThumbUrl: string | null
}

export const ADMIN_PAGE_SIZE = 40

/** PostgREST `or()` sözdizimini bozacak işaretler aramadan atılıyor. */
function sanitizeSearch(value: string): string {
  return value.replace(/[,()*%\\"]/g, ' ').trim()
}

export async function listAdminBooks(
  supabase: Client,
  options: { query?: string; status?: string; page?: number },
): Promise<{ books: AdminBookRow[]; total: number }> {
  const page = Math.max(1, options.page ?? 1)
  const from = (page - 1) * ADMIN_PAGE_SIZE

  let request = supabase
    .from('catalog_books')
    .select(
      'id, slug, title, status, language, age_min, age_max, posted_at, author_names, cover_thumb_path, cover_path',
      {
        count: 'exact',
      },
    )
    .order('posted_at', { ascending: false, nullsFirst: false })
    .order('slug')
    .range(from, from + ADMIN_PAGE_SIZE - 1)

  if (
    options.status === 'draft' ||
    options.status === 'published' ||
    options.status === 'archived'
  ) {
    request = request.eq('status', options.status)
  }

  // Başlıkta parça eşleşmesi + adreste sadeleştirilmiş eşleşme: "çaya" yazan
  // "caya-gelen-kaplan"ı da bulur, büyük/küçük harf ve Türkçe karakter fark etmez.
  const query = sanitizeSearch(options.query ?? '')
  if (query) {
    const slugQuery = slugify(query)
    request = request.or(
      slugQuery ? `title.ilike.*${query}*,slug.ilike.*${slugQuery}*` : `title.ilike.*${query}*`,
    )
  }

  const { data, error, count } = await request
  if (error) throw error

  return {
    total: count ?? 0,
    books: (data ?? []).map((row) => ({
      id: row.id!,
      slug: row.slug!,
      title: row.title!,
      status: (row.status ?? 'draft') as BookStatus,
      language: (row.language ?? 'tr') as 'tr' | 'en',
      ageMin: row.age_min,
      ageMax: row.age_max,
      postedAt: row.posted_at,
      authors: row.author_names ?? [],
      coverThumbUrl: coverUrl(row.cover_thumb_path ?? row.cover_path),
    })),
  }
}

// ─── Tek kitap (düzenleme formu) ─────────────────────────────────────────────

export interface AdminBook {
  id: string
  slug: string
  title: string
  subtitle: string | null
  originalTitle: string | null
  summary: string
  description: string | null
  language: 'tr' | 'en'
  ageMin: number | null
  ageMax: number | null
  pageCount: number | null
  isbn13: string | null
  publishedYear: number | null
  status: BookStatus
  publisher: string | null
  series: { title: string; position: number | null } | null
  authors: string[]
  illustrators: string[]
  translators: string[]
  topics: Array<{ slug: string; relevance: number; source: 'editorial' | 'auto' }>
  interests: Array<{ slug: string; source: 'editorial' | 'auto' }>
  instagram: { url: string; postedAt: string | null; likeCount: number } | null
  cover: {
    url: string
    thumbUrl: string | null
    width: number | null
    height: number | null
  } | null
}

interface ContributorJson {
  name: string
  role: string
}

export async function getAdminBook(supabase: Client, id: string): Promise<AdminBook | null> {
  const { data, error } = await supabase.from('book_details').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  if (!data) return null

  const contributors = (Array.isArray(data.contributors)
    ? data.contributors
    : []) as unknown as ContributorJson[]
  const names = (role: string) =>
    contributors.filter((person) => person.role === role).map((person) => person.name)
  const topics = (Array.isArray(data.topics) ? data.topics : []) as unknown as Array<{
    topicSlug: string
    relevance: number
    source: 'editorial' | 'auto'
  }>
  const interests = (Array.isArray(data.interests) ? data.interests : []) as unknown as Array<{
    slug: string
    source: 'editorial' | 'auto'
  }>
  const full = coverUrl(data.cover_path)

  return {
    id: data.id!,
    slug: data.slug!,
    title: data.title!,
    subtitle: data.subtitle,
    originalTitle: data.original_title,
    summary: data.summary ?? '',
    description: data.description,
    language: (data.language ?? 'tr') as 'tr' | 'en',
    ageMin: data.age_min,
    ageMax: data.age_max,
    pageCount: data.page_count,
    isbn13: data.isbn13,
    publishedYear: data.published_year,
    status: (data.status ?? 'draft') as BookStatus,
    publisher: data.publisher_name,
    series: data.series_title ? { title: data.series_title, position: data.series_position } : null,
    authors: names('author'),
    illustrators: names('illustrator'),
    translators: names('translator'),
    topics: topics.map((topic) => ({
      slug: topic.topicSlug,
      relevance: topic.relevance,
      source: topic.source,
    })),
    interests: interests.map((interest) => ({ slug: interest.slug, source: interest.source })),
    instagram: data.instagram_url
      ? { url: data.instagram_url, postedAt: data.posted_at, likeCount: data.like_count ?? 0 }
      : null,
    cover: full
      ? {
          url: full,
          thumbUrl: coverUrl(data.cover_thumb_path),
          width: data.cover_width,
          height: data.cover_height,
        }
      : null,
  }
}

export async function getBookSlug(supabase: Client, id: string): Promise<string | null> {
  const { data, error } = await supabase.from('books').select('slug').eq('id', id).maybeSingle()
  if (error) throw error
  return data?.slug ?? null
}

export interface SaveBookResult {
  id: string
  slug: string
  status: 'created' | 'updated' | 'skipped'
}

/** Formla betiğin ortak yolu: `upsert_book()` (0022). */
export async function saveBook(
  supabase: Client,
  input: BookInput,
  overwrite: boolean,
): Promise<SaveBookResult> {
  const { data, error } = await supabase.rpc('upsert_book', {
    payload: toUpsertPayload(input) as never,
    overwrite,
  })
  if (error) throw error
  return data as unknown as SaveBookResult
}

/**
 * Kitabı kalıcı olarak siler. Yalnızca TASLAK kitaplar: yayında olmuş bir
 * kitap ebeveynlerin kütüphanesinde olabilir, silinince okuma geçmişleri
 * de gider. Yayındaki kitap için doğru yol arşivlemek.
 */
export async function deleteDraftBook(supabase: Client, id: string): Promise<void> {
  const { data: book, error: readError } = await supabase
    .from('books')
    .select('status, cover_path, cover_thumb_path')
    .eq('id', id)
    .single()
  if (readError) throw readError
  if (book.status !== 'draft') {
    throw new AdminError('Yalnızca taslak kitaplar silinebilir; yayındaki kitabı arşivleyin.')
  }

  const { error } = await supabase.from('books').delete().eq('id', id)
  if (error) throw error

  const files = [book.cover_path, book.cover_thumb_path].filter((path): path is string =>
    Boolean(path?.startsWith('books/')),
  )
  if (files.length > 0) {
    const { error: removeError } = await supabase.storage.from(COVER_BUCKET).remove(files)
    if (removeError) console.error('Silinen kitabın kapağı kaldırılamadı:', removeError.message)
  }
}

// ─── Taksonomi ───────────────────────────────────────────────────────────────

export interface Usage {
  books: number
  children: number
  modes: number
}

const NO_USAGE: Usage = { books: 0, children: 0, modes: 0 }

export interface AdminTopic {
  id: string
  areaId: string
  slug: string
  name: string
  label: string | null
  description: string | null
  keywords: string[]
  position: number
  usage: Usage
}

export interface AdminArea {
  id: string
  slug: string
  name: string
  description: string | null
  emoji: string
  color: string
  position: number
  topics: AdminTopic[]
}

export interface AdminInterest {
  id: string
  slug: string
  name: string
  emoji: string
  keywords: string[]
  position: number
  usage: Usage
}

export async function getAdminTaxonomy(
  supabase: Client,
): Promise<{ areas: AdminArea[]; interests: AdminInterest[] }> {
  const [areas, topics, interests, usage] = await Promise.all([
    supabase.from('development_areas').select('*').order('position').order('slug'),
    supabase.from('development_topics').select('*').order('position').order('slug'),
    supabase.from('interests').select('*').order('position').order('slug'),
    supabase.rpc('taxonomy_usage'),
  ])
  for (const result of [areas, topics, interests, usage]) {
    if (result.error) throw result.error
  }

  const usageOf = new Map(
    (usage.data ?? []).map((row) => [
      `${row.kind}:${row.slug}`,
      { books: row.books, children: row.children, modes: row.modes },
    ]),
  )

  return {
    areas: (areas.data ?? []).map((area) => ({
      id: area.id,
      slug: area.slug,
      name: area.name,
      description: area.description,
      emoji: area.emoji,
      color: area.color,
      position: area.position,
      topics: (topics.data ?? [])
        .filter((topic) => topic.area_id === area.id)
        .map((topic) => ({
          id: topic.id,
          areaId: topic.area_id,
          slug: topic.slug,
          name: topic.name,
          label: topic.label,
          description: topic.description,
          keywords: topic.keywords,
          position: topic.position,
          usage: usageOf.get(`topic:${topic.slug}`) ?? NO_USAGE,
        })),
    })),
    interests: (interests.data ?? []).map((interest) => ({
      id: interest.id,
      slug: interest.slug,
      name: interest.name,
      emoji: interest.emoji,
      keywords: interest.keywords,
      position: interest.position,
      usage: usageOf.get(`interest:${interest.slug}`) ?? NO_USAGE,
    })),
  }
}

/**
 * Adres yalnızca OLUŞTURULURKEN addan üretiliyor; güncellemede gönderilmiyor.
 * Aynı ad başka bir kayıtta varsa benzersizlik kısıtı Türkçe mesajla döner.
 */
function newSlug(name: string): string {
  const slug = slugify(name, 60)
  if (!slug) {
    throw new AdminError('Addan adres üretilemedi; ada en az bir harf ya da rakam ekleyin.')
  }
  return slug
}

export async function saveArea(
  supabase: Client,
  id: string | null,
  input: AreaInput,
): Promise<void> {
  const { error } = id
    ? await supabase.from('development_areas').update(input).eq('id', id)
    : await supabase.from('development_areas').insert({ ...input, slug: newSlug(input.name) })
  if (error) throw error
}

export async function saveTopic(
  supabase: Client,
  id: string | null,
  input: TopicInput,
): Promise<void> {
  const row = {
    area_id: input.areaId,
    name: input.name,
    label: input.label,
    description: input.description,
    keywords: input.keywords,
    position: input.position,
  }
  const { error } = id
    ? await supabase.from('development_topics').update(row).eq('id', id)
    : await supabase.from('development_topics').insert({ ...row, slug: newSlug(input.name) })
  if (error) throw error
}

export async function saveInterest(
  supabase: Client,
  id: string | null,
  input: InterestInput,
): Promise<void> {
  const { error } = id
    ? await supabase.from('interests').update(input).eq('id', id)
    : await supabase.from('interests').insert({ ...input, slug: newSlug(input.name) })
  if (error) throw error
}

export type TaxonomyKind = 'area' | 'topic' | 'interest'

const TAXONOMY_TABLES = {
  area: 'development_areas',
  topic: 'development_topics',
  interest: 'interests',
} as const

export async function deleteTaxonomyItem(
  supabase: Client,
  kind: TaxonomyKind,
  id: string,
): Promise<void> {
  // `count` ile siliniyor: RLS satırı gizlerse hata yerine 0 döner, onu yakalıyoruz.
  const { error, count } = await supabase
    .from(TAXONOMY_TABLES[kind])
    .delete({ count: 'exact' })
    .eq('id', id)
  if (error) throw error
  if (!count) throw new AdminError('Kayıt bulunamadı ya da silme yetkiniz yok.')
}

// ─── Keşif modları ───────────────────────────────────────────────────────────

export interface AdminMode {
  id: string
  slug: string
  name: string
  emoji: string | null
  description: string | null
  promptHint: string | null
  language: 'tr' | 'en' | null
  position: number
  isActive: boolean
  topics: Array<{ slug: string; weight: number }>
  interests: Array<{ slug: string; weight: number }>
}

function readWeights(value: unknown): Array<{ slug: string; weight: number }> {
  if (!Array.isArray(value)) return []
  return value.flatMap((entry) =>
    entry && typeof entry === 'object' && typeof entry.slug === 'string'
      ? [{ slug: entry.slug as string, weight: Number(entry.weight) || 3 }]
      : [],
  )
}

/** Pasif modlar dahil — editör RLS ile hepsini görüyor. */
export async function getAdminModes(supabase: Client): Promise<AdminMode[]> {
  const { data, error } = await supabase
    .from('discovery_mode_details')
    .select('*')
    .order('position')
    .order('slug')
  if (error) throw error

  return (data ?? []).map((row) => ({
    id: row.id!,
    slug: row.slug!,
    name: row.name!,
    emoji: row.emoji,
    description: row.description,
    promptHint: row.prompt_hint,
    language: row.language as AdminMode['language'],
    position: row.position ?? 0,
    isActive: row.is_active ?? true,
    topics: readWeights(row.topics),
    interests: readWeights(row.interests),
  }))
}

/** `save_discovery_mode()` (0022): mod ve eğilimleri tek işlemde. */
export async function saveMode(
  supabase: Client,
  slug: string | null,
  input: ModeInput,
): Promise<void> {
  const payload = { ...input, slug: slug ?? newSlug(input.name) }
  const { error } = await supabase.rpc('save_discovery_mode', { payload: payload as never })
  if (error) throw error
}

export async function deleteMode(supabase: Client, id: string): Promise<void> {
  const { error, count } = await supabase
    .from('discovery_modes')
    .delete({ count: 'exact' })
    .eq('id', id)
  if (error) throw error
  if (!count) throw new AdminError('Mod bulunamadı ya da silme yetkiniz yok.')
}
