import sharp from 'sharp'
import { getBookBySlug } from '@/lib/data/catalog'

/**
 * Kitap sayfası paylaşılınca çıkan önizleme görseli: kitabın kapağı, krem
 * zemin üzerinde ortalanmış.
 *
 * Kapaklar WebP olarak saklanıyor; WhatsApp gibi bazı uygulamalar önizlemede
 * WebP göstermiyor. Bu yüzden kapak burada PNG'ye çevriliyor. Yazı yok —
 * kitabın adı zaten önizleme kartının başlığında çıkıyor.
 */
export const alt = 'Kitap kapağı'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const CREAM = { r: 250, g: 248, b: 244, alpha: 1 }
const BRAND = '#E8602C'
const COVER_HEIGHT = 560

export default async function BookOpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  // Önizleme hiçbir zaman hata vermesin: kitap okunamazsa logo gösterilir.
  const book = await getBookBySlug(slug).catch(() => null)
  const layers: sharp.OverlayOptions[] = []

  const cover = book?.coverUrl ? await fetchImage(book.coverUrl) : null
  if (cover) {
    const resized = await sharp(cover)
      .resize({ height: COVER_HEIGHT, width: 1100, fit: 'inside' })
      .toBuffer()
    layers.push({ input: resized, gravity: 'center' })
  } else {
    // Kapak yoksa (ya da indirilemezse) site logosu
    layers.push({ input: logoSvg(), gravity: 'center' })
  }

  const png = await sharp({
    create: { width: size.width, height: size.height, channels: 4, background: CREAM },
  })
    .composite(layers)
    .png()
    .toBuffer()

  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': contentType,
      // Paylaşım uygulamaları görseli sık ister; bir gün önbellekte kalsın.
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}

async function fetchImage(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!response.ok) return null
    return Buffer.from(await response.arrayBuffer())
  } catch {
    return null
  }
}

function logoSvg(): Buffer {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 180 180">
  <rect width="180" height="180" rx="40" fill="${BRAND}"/>
  <path d="M45 48h37c5.6 0 10.7 2.9 13.5 7.3C98.3 50.9 103.4 48 109 48h26v84h-26c-5.6 0-10.7 2.9-13.5 7.3-2.8-4.4-7.9-7.3-13.5-7.3H45V48Z" fill="#FFF"/>
  <path d="M90 55v70" stroke="${BRAND}" stroke-width="7" stroke-linecap="round"/>
</svg>`)
}
