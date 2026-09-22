import { describe, expect, it } from 'vitest'
import { bookInputSchema, instagramShortcode, parseBookInputs, toUpsertPayload } from './input'

describe('bookInputSchema', () => {
  it('en az bilgiyle çalışır ve adresi başlıktan üretir', () => {
    const book = bookInputSchema.parse({ title: 'Çaya Gelen Kaplan' })
    expect(book.slug).toBe('caya-gelen-kaplan')
    expect(book.language).toBe('tr')
    expect(book.status).toBe('published')
    expect(book.authors).toEqual([])
    expect(book.autoTag).toBe(true)
  })

  // Instagram'dan kazınan listeler gevşek biçimli olacak.
  it('virgüllü yazar metnini listeye çevirir, tekrarları atar', () => {
    const book = bookInputSchema.parse({ title: 'X', authors: 'Judith Kerr, Ali Veli ,Judith Kerr' })
    expect(book.authors).toEqual(['Judith Kerr', 'Ali Veli'])
  })

  it('düz konu listesini ağırlıklı biçime çevirir', () => {
    const book = bookInputSchema.parse({
      title: 'X',
      topics: ['duygu-yonetimi', { slug: 'paylasma', relevance: 5 }],
    })
    expect(book.topics).toEqual([
      { slug: 'duygu-yonetimi', relevance: 3 },
      { slug: 'paylasma', relevance: 5 },
    ])
  })

  it('tireli ISBN kabul eder', () => {
    expect(bookInputSchema.parse({ title: 'X', isbn13: '978-605-4-12345-6' }).isbn13).toBe(
      '9786054123456',
    )
  })

  it('formdan gelen metin sayıları çevirir, boş metni null yapar', () => {
    const book = bookInputSchema.parse({ title: 'X', ageMin: '3', ageMax: '', pageCount: '32' })
    expect(book.ageMin).toBe(3)
    expect(book.ageMax).toBeNull()
    expect(book.pageCount).toBe(32)
  })

  it('Instagram kısa kodunu adresten çıkarır', () => {
    const book = bookInputSchema.parse({
      title: 'X',
      instagram: { url: 'https://www.instagram.com/p/DWRv15ojdg-/' },
    })
    expect(book.instagram?.shortcode).toBe('DWRv15ojdg-')
  })

  it.each([
    [{ title: '' }, 'Kitap adı boş olamaz.'],
    [{ title: 'X', ageMin: 9, ageMax: 3 }, 'Üst yaş sınırı alt sınırdan küçük olamaz.'],
    [{ title: 'X', ageMin: 25 }, 'En küçük yaş 0 ile 18 arasında olmalı.'],
    [{ title: 'X', isbn13: '12345' }, 'ISBN 13 haneli olmalı.'],
    [{ title: 'X', slug: 'Büyük Harf' }, 'Adres yalnızca küçük harf, rakam ve tire içerebilir.'],
    [{ title: 'X', language: 'de' }, 'Dil "tr" ya da "en" olmalı.'],
  ])('%j → Türkçe hata', (input, message) => {
    const result = bookInputSchema.safeParse(input)
    expect(result.success).toBe(false)
    expect(result.error?.issues.map((issue) => issue.message)).toContain(message)
  })

  it('kapak alanı veritabanına gitmez', () => {
    const book = bookInputSchema.parse({ title: 'X', cover: 'https://ornek.com/kapak.jpg' })
    expect(toUpsertPayload(book)).not.toHaveProperty('cover')
  })
})

describe('instagramShortcode', () => {
  it.each([
    ['https://www.instagram.com/p/ABC123/', 'ABC123'],
    ['https://www.instagram.com/reel/DVs9zmkE_wJ/', 'DVs9zmkE_wJ'],
    ['https://instagram.com/sesli.kutuphanem/p/XYZ-9/?img_index=1', 'XYZ-9'],
    ['https://ornek.com/p/ABC', null],
  ])('%s → %s', (url, expected) => {
    expect(instagramShortcode(url)).toBe(expected)
  })
})

describe('parseBookInputs', () => {
  it('tek kitabı da listeyi de kabul eder', () => {
    expect(parseBookInputs({ title: 'Tek' })).toMatchObject({ ok: true })
    const list = parseBookInputs([{ title: 'Bir' }, { title: 'İki' }])
    expect(list.ok && list.books.map((book) => book.slug)).toEqual(['bir', 'iki'])
  })

  // Yarım aktarılmış liste en kötü sonuç: bir hata varsa hiçbiri yazılmamalı.
  it('herhangi birinde hata varsa HİÇBİRİNİ döndürmez, tüm sorunları sıralı verir', () => {
    const result = parseBookInputs([{ title: 'Geçerli' }, { title: '' }, { title: 'X', ageMin: 30 }])
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues.map((issue) => issue.index)).toEqual([2, 3])
    }
  })

  it('listede aynı adres iki kez geçerse doğru sırayı bildirir', () => {
    // İlk kayıt geçersiz: sıra numaraları kaymamalı.
    const result = parseBookInputs([{ title: '' }, { title: 'Aynı' }, { title: 'aynı' }])
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const duplicate = result.issues.find((issue) => issue.field === 'slug')
      expect(duplicate?.index).toBe(3)
      expect(duplicate?.message).toContain('2. sırada')
    }
  })
})
