import { createHash } from 'node:crypto'
import sharp from 'sharp'

/**
 * Kitap kapağı işleme — YALNIZCA SUNUCUDA (ADR 0009).
 *
 * Her kapaktan iki WebP üretiliyor:
 *
 *   büyük (full)  en fazla 900×1350 — kitap sayfası, retina ekranda net
 *   küçük (thumb) en fazla 480×720  — ana sayfadaki kartlar
 *
 * Küçük varyantın boyutu kart genişliğinden: telefonda kartlar iki sütun,
 * ~173 CSS pikseli; 3× yoğunluklu ekranda bu ~520 fiziksel piksel. 480
 * gözle ayırt edilemeyecek kadar yakın ve 520'den belirgin biçimde küçük.
 *
 * NEDEN İKİ VARYANT: Alan değil trafik darboğaz. Ana sayfa 196 kart
 * gösteriyor; her kart büyük kapağı çekseydi tek bir ziyaret onlarca MB
 * ederdi. Kartlar küçük varyantı, `loading="lazy"` ile yalnızca görünür
 * olunca çekiyor.
 *
 * KALİTE ÖLÇÜLEREK SEÇİLDİ (ayrıntı: ADR 0009). İki gerçek, ağır grenli
 * kitap kapağı taramasında SSIM (algıya yakın benzerlik ölçüsü; ≥0,98 gözle
 * ayırt edilemez kabul edilir):
 *
 *                 kapak1   kapak2
 *   WebP q85      0,981    0,967  ✗   ← ilk tercihti, sınırın altında kaldı
 *   WebP q90      0,990    0,981  ✓
 *   AVIF q70      0,983    0,971      ← grenini düzleştiriyor, 2-3× yavaş
 *   JPEG q92      0,966    0,975
 *
 * Kapaklarda ince renkli yazı var; `smartSubsample` renk alt örneklemesinin
 * bu yazıyı bulanıklaştırmasını önlüyor.
 *
 * DOSYA ADI içeriğin özeti: aynı kapak aynı adı alır, farklı kapak farklı
 * adı. Böylece dosyalara bir yıllık önbellek verilebiliyor — kapak
 * değişince adres de değiştiği için eski kopya asla gösterilmiyor.
 */

export const COVER_BUCKET = 'catalog-covers'

const FULL = { width: 900, height: 1350, quality: 90 } as const
const THUMB = { width: 480, height: 720, quality: 82 } as const

/** Bundan küçük görseller kapak olarak işe yaramıyor (bulanık görünür). */
const MIN_EDGE = 200
/** Sıkıştırılmamış piksel sınırı — dev bir görselle bellek taşmasın. */
const MAX_INPUT_PIXELS = 60_000_000

export interface CoverVariant {
  data: Buffer
  width: number
  height: number
  bytes: number
}

export interface ProcessedCover {
  full: CoverVariant
  thumb: CoverVariant
  /** Büyük varyantın içerik özeti (12 hane). Dosya adında kullanılıyor. */
  hash: string
  sourceBytes: number
}

export class CoverError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CoverError'
  }
}

async function encode(
  image: sharp.Sharp,
  box: { width: number; height: number; quality: number },
): Promise<CoverVariant> {
  const { data, info } = await image
    .clone()
    .resize({ width: box.width, height: box.height, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: box.quality, effort: 5, smartSubsample: true })
    .toBuffer({ resolveWithObject: true })

  return { data, width: info.width, height: info.height, bytes: data.length }
}

/**
 * Görseli doğrular, yönünü düzeltir, iki varyanta çevirir.
 * EXIF (konum dahil) atılıyor: telefon fotoğraflarında GPS bilgisi olabilir.
 */
export async function processCover(input: Buffer): Promise<ProcessedCover> {
  let image: sharp.Sharp
  let metadata: sharp.Metadata
  try {
    image = sharp(input, { failOn: 'error', limitInputPixels: MAX_INPUT_PIXELS })
    metadata = await image.metadata()
  } catch {
    throw new CoverError('Dosya okunamadı. JPEG, PNG ya da WebP bir fotoğraf seçin.')
  }

  if (!metadata.width || !metadata.height) {
    throw new CoverError('Görselin boyutları okunamadı.')
  }

  // EXIF yönü: telefon fotoğrafları çoğu zaman yan yatık kaydediliyor.
  // `rotate()` argümansız çağrılınca EXIF'e göre döndürüp etiketi siliyor.
  const oriented = image.rotate()

  const shortEdge = Math.min(metadata.width, metadata.height)
  if (shortEdge < MIN_EDGE) {
    throw new CoverError(
      `Görsel çok küçük (${metadata.width}×${metadata.height}). En az ${MIN_EDGE} piksel olmalı.`,
    )
  }

  const [full, thumb] = await Promise.all([encode(oriented, FULL), encode(oriented, THUMB)])
  const hash = createHash('sha256').update(full.data).digest('hex').slice(0, 12)

  return { full, thumb, hash, sourceBytes: input.length }
}

/** Depolamadaki yollar: `books/<slug>/<özet>.webp` ve `...-k.webp` */
export function coverPaths(slug: string, hash: string): { full: string; thumb: string } {
  return { full: `books/${slug}/${hash}.webp`, thumb: `books/${slug}/${hash}-k.webp` }
}

/** İçerik özetli adlar asla değişmediği için bir yıl önbellekte kalabilir. */
export const COVER_CACHE_SECONDS = String(60 * 60 * 24 * 365)
