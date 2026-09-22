import { describe, expect, it } from 'vitest'
import {
  areaInputSchema,
  fieldErrors,
  interestInputSchema,
  keywordProblem,
  modeInputSchema,
  parseKeywords,
  topicInputSchema,
} from './taxonomy-input'

const AREA_ID = '3f1c2a9e-8b7d-4c6e-9a5f-1b2c3d4e5f60'

describe('parseKeywords', () => {
  it('satır ya da virgülle ayrılmış metni listeye çevirir', () => {
    expect(parseKeywords('kardeş, bebek\nkıskançl\n\n  abla ')).toEqual([
      'kardeş',
      'bebek',
      'kıskançl',
      'abla',
    ])
  })

  it('tekrarları atar, sırayı korur', () => {
    expect(parseKeywords(['okul', 'sınıf', 'okul'])).toEqual(['okul', 'sınıf'])
  })

  it('JavaScript alışkanlığı \\b’yi Postgres’in \\y’sine çevirir', () => {
    expect(parseKeywords('\\byas\\b')).toEqual(['\\yyas\\y'])
  })

  it('boş girdide boş liste döner', () => {
    expect(parseKeywords(null)).toEqual([])
    expect(parseKeywords('')).toEqual([])
  })
})

describe('keywordProblem', () => {
  it('düz kelimeyi ve \\y sınırını kabul eder', () => {
    expect(keywordProblem('kıskanç')).toBeNull()
    expect(keywordProblem('\\yay\\y')).toBeNull()
    expect(keywordProblem('okula başl')).toBeNull()
  })

  it('bozuk ifadeyi Türkçe açıklamayla reddeder', () => {
    expect(keywordProblem('kıskanç(')).toMatch(/özel işaret/)
    expect(keywordProblem('[abc')).toMatch(/özel işaret/)
  })

  it('tek harfi reddeder', () => {
    expect(keywordProblem('a')).toMatch(/en az 2/)
  })
})

describe('areaInputSchema', () => {
  it('geçerli rehberi kabul eder, boş simgeye varsayılan verir', () => {
    const result = areaInputSchema.parse({
      name: ' Duygu Rehberi ',
      description: '',
      emoji: '',
      color: '#E8602C',
      position: '3',
    })
    expect(result).toEqual({
      name: 'Duygu Rehberi',
      description: null,
      emoji: '📚',
      color: '#E8602C',
      position: 3,
    })
  })

  it('bozuk rengi alan adıyla bildirir', () => {
    const result = areaInputSchema.safeParse({ name: 'X', color: 'kırmızı', position: 1 })
    expect(result.success).toBe(false)
    if (!result.success) expect(fieldErrors(result.error).color).toMatch(/#RRGGBB/)
  })
})

describe('topicInputSchema', () => {
  it('anahtar kelimeleri ayrıştırır', () => {
    const result = topicInputSchema.parse({
      areaId: AREA_ID,
      name: 'Kardeş İlişkileri',
      keywords: 'kardeş, bebek',
      position: 1,
    })
    expect(result.keywords).toEqual(['kardeş', 'bebek'])
    expect(result.label).toBeNull()
  })

  it('bozuk anahtar kelimeyi `keywords` alanına yazar', () => {
    const result = topicInputSchema.safeParse({
      areaId: AREA_ID,
      name: 'X',
      keywords: 'iyi, kötü(',
      position: 1,
    })
    expect(result.success).toBe(false)
    if (!result.success) expect(fieldErrors(result.error).keywords).toMatch(/kötü\(/)
  })

  it('rehber seçilmemişse anlaşılır mesaj verir', () => {
    const result = topicInputSchema.safeParse({ areaId: '', name: 'X', position: 1 })
    expect(result.success).toBe(false)
    if (!result.success) expect(fieldErrors(result.error).areaId).toBe('Bir rehber seçin.')
  })
})

describe('interestInputSchema', () => {
  it('boş adı reddeder', () => {
    const result = interestInputSchema.safeParse({ name: '  ', position: 0 })
    expect(result.success).toBe(false)
    if (!result.success) expect(fieldErrors(result.error).name).toMatch(/boş olamaz/)
  })
})

describe('modeInputSchema', () => {
  it('boş dili null yapar, yinelenen eğilimde sonuncusunu tutar', () => {
    const result = modeInputSchema.parse({
      name: 'Sakinleşelim',
      language: '',
      position: 1,
      topics: [
        { slug: 'duygu-yonetimi', weight: 3 },
        { slug: 'duygu-yonetimi', weight: '5' },
      ],
    })
    expect(result.language).toBeNull()
    expect(result.topics).toEqual([{ slug: 'duygu-yonetimi', weight: 5 }])
    expect(result.interests).toEqual([])
    expect(result.isActive).toBe(true)
  })

  it('aralık dışı ağırlığı reddeder', () => {
    const result = modeInputSchema.safeParse({
      name: 'X',
      position: 1,
      topics: [{ slug: 'a', weight: 9 }],
    })
    expect(result.success).toBe(false)
  })
})
