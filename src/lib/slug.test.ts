import { describe, expect, it } from 'vitest'
import { slugify, SLUG_PATTERN } from './slug'

// Beklenen değerler veritabanındaki `public.slugify()` çıktısıyla aynı olmalı
// (bkz. 0001). Yazar/yayınevi adresi orada, kitap adresi burada üretiliyor.
describe('slugify', () => {
  it.each([
    ['Çaya Gelen Kaplan', 'caya-gelen-kaplan'],
    ['İşte O!', 'iste-o'],
    ['Tutkal Hanım’ın Kırık Kalpleri', 'tutkal-hanim-in-kirik-kalpleri'],
    ['Şığır ÇĞİÖŞÜ çğıöşü', 'sigir-cgiosu-cgiosu'],
    ['Îstanbul Âşık', 'istanbul-asik'],
    ['  --Boşluklar  ve   tireler--  ', 'bosluklar-ve-tireler'],
    ['365 Penguen 🐧', '365-penguen'],
    ['Me… Jane 📖', 'me-jane'],
  ])('%s → %s', (input, expected) => {
    expect(slugify(input)).toBe(expected)
  })

  // Veritabanı da Türkçe dışındaki aksanları sadeleştirmiyor; ayrışmasın.
  it('Türkçe dışı aksanları veritabanıyla aynı şekilde atar', () => {
    expect(slugify('Café Émile')).toBe('caf-mile')
  })

  it('uzun başlığı keser ve sonda tire bırakmaz', () => {
    const slug = slugify('a'.repeat(95) + ' bbbbbbbbbb', 100)
    expect(slug.length).toBeLessThanOrEqual(100)
    expect(slug.endsWith('-')).toBe(false)
  })

  it('ürettiği her adres geçerli biçimde', () => {
    for (const title of ['Çaya Gelen Kaplan', '101 Tekerleme', 'BIG!', 'Kitap ♥ Kitap']) {
      expect(SLUG_PATTERN.test(slugify(title))).toBe(true)
    }
  })
})
