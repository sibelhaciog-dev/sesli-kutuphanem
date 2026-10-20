import sharp from 'sharp'
import { BRAND_BACKGROUND, logoSvg } from '@/lib/brand'
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
    layers.push({ input: Buffer.from(logoSvg({ size: 240 })), gravity: 'center' })
  }

  const png = await sharp({
    create: { width: size.width, height: size.height, channels: 4, background: BRAND_BACKGROUND },
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
