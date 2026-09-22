import type { SupabaseClient } from '@supabase/supabase-js'
import {
  COVER_BUCKET,
  COVER_CACHE_SECONDS,
  CoverError,
  coverPaths,
  processCover,
} from '@/lib/images/cover'
import type { Database } from '@/lib/supabase/database.types'

/**
 * Kapak yükleme ve bağlama — YALNIZCA SUNUCU / BETİK (ADR 0009).
 *
 * Yönetim arayüzünün kapak ucu (kullanıcının oturumuyla, depolama RLS'i
 * editöre izin veriyor) ve `npm run book:add` betiği (gizli anahtarla) bu
 * iki fonksiyonu paylaşıyor. Hangi istemcinin verildiği yetkiyi belirliyor;
 * mantık tek.
 *
 * Bu modül `sharp` çektiği için istemci bileşenlerine girmemeli.
 */

type Client = SupabaseClient<Database>

export interface StoredCover {
  path: string
  thumbPath: string
  width: number
  height: number
  bytes: number
  thumbBytes: number
  sourceBytes: number
}

/** Kapağı işler, iki varyantı depolamaya yükler. Kitaba henüz bağlamaz. */
export async function storeCover(
  supabase: Client,
  slug: string,
  input: Buffer,
): Promise<StoredCover> {
  const processed = await processCover(input)
  const paths = coverPaths(slug, processed.hash)
  const bucket = supabase.storage.from(COVER_BUCKET)

  for (const [path, variant] of [
    [paths.full, processed.full],
    [paths.thumb, processed.thumb],
  ] as const) {
    // `upsert: true` güvenli: dosya adı içeriğin özeti, aynı ad = aynı içerik.
    const { error } = await bucket.upload(path, variant.data, {
      contentType: 'image/webp',
      cacheControl: COVER_CACHE_SECONDS,
      upsert: true,
    })
    if (error) {
      console.error(`Kapak yüklenemedi (${path}):`, error.message)
      throw new CoverError('Kapak depolamaya yüklenemedi. Biraz sonra tekrar deneyin.')
    }
  }

  return {
    path: paths.full,
    thumbPath: paths.thumb,
    width: processed.full.width,
    height: processed.full.height,
    bytes: processed.full.bytes,
    thumbBytes: processed.thumb.bytes,
    sourceBytes: processed.sourceBytes,
  }
}

/**
 * Kapağı kitaba bağlar (ya da `null` ile kaldırır) ve ESKİ dosyaları siler.
 *
 * Silme yalnızca bizim yazdığımız `books/` önekiyle sınırlı: başka bir yoldan
 * gelmiş bir kapağa dokunmayalım. Eski dosyayı silememek işlemi bozmaz —
 * yalnızca alan israf eder — o yüzden hata günlüğe yazılıp geçiliyor.
 */
export async function setBookCover(
  supabase: Client,
  bookId: string,
  cover: StoredCover | null,
): Promise<void> {
  const { data: current, error: readError } = await supabase
    .from('books')
    .select('cover_path, cover_thumb_path')
    .eq('id', bookId)
    .single()
  if (readError) throw readError

  const { error } = await supabase
    .from('books')
    .update({
      cover_path: cover?.path ?? null,
      cover_thumb_path: cover?.thumbPath ?? null,
      cover_width: cover?.width ?? null,
      cover_height: cover?.height ?? null,
    })
    .eq('id', bookId)
  if (error) throw error

  const keep = new Set([cover?.path, cover?.thumbPath])
  const stale = [current.cover_path, current.cover_thumb_path].filter(
    (path): path is string => Boolean(path) && path!.startsWith('books/') && !keep.has(path!),
  )
  if (stale.length > 0) {
    const { error: removeError } = await supabase.storage.from(COVER_BUCKET).remove(stale)
    if (removeError) console.error('Eski kapak silinemedi:', removeError.message)
  }
}
