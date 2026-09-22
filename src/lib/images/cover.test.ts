// @vitest-environment node
import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { CoverError, coverPaths, processCover } from './cover'

/** Rastgele dokulu bir test görseli: düz renk gerçekçi olmayacak kadar iyi sıkışır. */
async function photo(width: number, height: number, format: 'jpeg' | 'png' = 'jpeg') {
  const channels = 3
  const pixels = Buffer.alloc(width * height * channels)
  for (let i = 0; i < pixels.length; i++) pixels[i] = (i * 2654435761) % 251
  const image = sharp(pixels, { raw: { width, height, channels } })
  return format === 'png' ? image.png().toBuffer() : image.jpeg({ quality: 95 }).toBuffer()
}

describe('processCover', () => {
  it('iki WebP varyantı üretir ve sınırlara sığdırır', async () => {
    const result = await processCover(await photo(1800, 2700))

    expect(result.full.width).toBeLessThanOrEqual(900)
    expect(result.full.height).toBeLessThanOrEqual(1350)
    expect(result.thumb.width).toBeLessThanOrEqual(480)
    expect(result.thumb.height).toBeLessThanOrEqual(720)

    for (const variant of [result.full, result.thumb]) {
      expect((await sharp(variant.data).metadata()).format).toBe('webp')
    }
    expect(result.thumb.bytes).toBeLessThan(result.full.bytes)
  })

  it('küçük görseli büyütmez', async () => {
    const result = await processCover(await photo(400, 600))
    expect(result.full.width).toBe(400)
    expect(result.full.height).toBe(600)
  })

  it('en boy oranını korur', async () => {
    const result = await processCover(await photo(1200, 1600))
    expect(result.full.width / result.full.height).toBeCloseTo(1200 / 1600, 2)
  })

  // Telefon fotoğrafları çoğu zaman yan yatık kaydedilip EXIF ile işaretleniyor.
  it('EXIF yönünü uygular', async () => {
    const sideways = await sharp(await photo(1200, 800))
      .withMetadata({ orientation: 6 })
      .jpeg()
      .toBuffer()
    const result = await processCover(sideways)
    expect(result.full.height).toBeGreaterThan(result.full.width)
  })

  // Telefon fotoğraflarında konum bilgisi olabilir.
  it('EXIF bilgisini çıktıdan atar', async () => {
    const tagged = await sharp(await photo(800, 1200))
      .withMetadata({ orientation: 1 })
      .jpeg()
      .toBuffer()
    const result = await processCover(tagged)
    expect((await sharp(result.full.data).metadata()).exif).toBeUndefined()
  })

  it('PNG kabul eder', async () => {
    const result = await processCover(await photo(600, 900, 'png'))
    expect(result.full.width).toBe(600)
  })

  it('aynı girdiye aynı özeti verir (önbellek güvenli)', async () => {
    const input = await photo(600, 900)
    const [a, b] = await Promise.all([processCover(input), processCover(input)])
    expect(a.hash).toBe(b.hash)
    expect(a.hash).toMatch(/^[0-9a-f]{12}$/)
  })

  it('görsel olmayan dosyayı Türkçe hatayla reddeder', async () => {
    await expect(processCover(Buffer.from('bu bir resim değil'))).rejects.toThrow(CoverError)
    await expect(processCover(Buffer.from('bu bir resim değil'))).rejects.toThrow(/okunamadı/)
  })

  it('çok küçük görseli reddeder', async () => {
    await expect(processCover(await photo(120, 180))).rejects.toThrow(/çok küçük/)
  })
})

describe('coverPaths', () => {
  it('kitap adresine göre klasörler', () => {
    expect(coverPaths('caya-gelen-kaplan', 'abc123def456')).toEqual({
      full: 'books/caya-gelen-kaplan/abc123def456.webp',
      thumb: 'books/caya-gelen-kaplan/abc123def456-k.webp',
    })
  })
})
