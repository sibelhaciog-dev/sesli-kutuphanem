import { describe, expect, it } from 'vitest'
import { likeScore, pickMostLiked, resolveFeatured, type BookLikeStat } from './featured'

const stat = (bookId: string, ratingCount: number, ratingSum: number, favoriteCount = 0) =>
  ({ bookId, ratingCount, ratingSum, favoriteCount }) satisfies BookLikeStat

const books = [{ id: 'yeni' }, { id: 'a' }, { id: 'b' }, { id: 'c' }]

describe('likeScore', () => {
  it('tek 5 yıldız, çok oylu yüksek ortalamayı geçemiyor', () => {
    expect(likeScore(stat('tek', 1, 5))).toBeLessThan(likeScore(stat('cok', 20, 92)))
  })

  it('favori puanı yükseltiyor', () => {
    expect(likeScore(stat('x', 3, 12, 3))).toBeGreaterThan(likeScore(stat('x', 3, 12, 0)))
  })
})

describe('pickMostLiked', () => {
  it('oyu olmayanı yok sayıyor', () => {
    expect(pickMostLiked([stat('a', 0, 0, 0)])).toBeNull()
  })

  it('uygun olmayan kitabı atlıyor', () => {
    const picked = pickMostLiked([stat('a', 10, 50), stat('b', 2, 8)], (id) => id !== 'a')
    expect(picked?.bookId).toBe('b')
  })

  it('eşitlikte kararlı sonuç veriyor', () => {
    const first = pickMostLiked([stat('b', 2, 8), stat('a', 2, 8)])
    const second = pickMostLiked([stat('a', 2, 8), stat('b', 2, 8)])
    expect(first?.bookId).toBe('a')
    expect(second?.bookId).toBe('a')
  })
})

describe('resolveFeatured', () => {
  const sponsored = { bookId: 'c', sponsorName: 'Masal Yayınları', sponsorUrl: null, blurb: null }

  it('sponsor varsa onu gösteriyor', () => {
    const pick = resolveFeatured(books, sponsored, [stat('a', 30, 150)])
    expect(pick?.book.id).toBe('c')
    expect(pick?.reason).toMatchObject({ kind: 'sponsored', sponsorName: 'Masal Yayınları' })
  })

  it('sponsorun kitabı yayında değilse en beğenilene düşüyor', () => {
    const pick = resolveFeatured(books, { ...sponsored, bookId: 'taslak' }, [stat('a', 2, 9, 1)])
    expect(pick?.book.id).toBe('a')
    expect(pick?.reason).toEqual({
      kind: 'most-liked',
      averageRating: 4.5,
      ratingCount: 2,
      favoriteCount: 1,
    })
  })

  it('yalnızca favorisi olan kitapta ortalama boş', () => {
    const pick = resolveFeatured(books, null, [stat('b', 0, 0, 3)])
    expect(pick?.reason).toMatchObject({ kind: 'most-liked', averageRating: null })
  })

  it('katalogda olmayan kitabın beğenisini yok sayıyor', () => {
    const pick = resolveFeatured(books, null, [stat('silinmis', 50, 250)])
    expect(pick).toEqual({ book: { id: 'yeni' }, reason: { kind: 'newest' } })
  })

  it('katalog boşsa hiçbir şey göstermiyor', () => {
    expect(resolveFeatured([], sponsored, [])).toBeNull()
  })
})
