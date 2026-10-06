import { describe, expect, it } from 'vitest'
import {
  featuredSlotSchema,
  istanbulToday,
  monthRange,
  slotState,
  sponsorApplicationSchema,
  upcomingMonths,
} from './sponsorship'

const BOOK_ID = '0b9a7c4e-2f1d-4c3b-9a8e-7d6c5b4a3f21'

describe('sponsorApplicationSchema', () => {
  const valid = {
    contactName: '  Ayşe Yılmaz ',
    contactEmail: 'ayse@masal.com',
    organization: '',
    bookTitle: 'Ormandaki Ses',
    bookLink: '',
    preferredMonth: '2026-11-01',
    message: null,
  }

  it('boş isteğe bağlı alanları null yapıyor ve kırpıyor', () => {
    const parsed = sponsorApplicationSchema.parse(valid)
    expect(parsed).toMatchObject({
      contactName: 'Ayşe Yılmaz',
      organization: null,
      bookLink: null,
      message: null,
    })
  })

  it('geçersiz e-postayı ve bağlantıyı reddediyor', () => {
    const result = sponsorApplicationSchema.safeParse({
      ...valid,
      contactEmail: 'ayse',
      bookLink: 'masal.com',
    })
    expect(result.success).toBe(false)
    const paths = result.error!.issues.map((issue) => issue.path[0])
    expect(paths).toEqual(expect.arrayContaining(['contactEmail', 'bookLink']))
  })

  it('ayın ilk günü olmayan tarihi reddediyor', () => {
    expect(
      sponsorApplicationSchema.safeParse({ ...valid, preferredMonth: '2026-11-15' }).success,
    ).toBe(false)
  })
})

describe('featuredSlotSchema', () => {
  const valid = {
    bookId: BOOK_ID,
    startsOn: '2026-11-01',
    endsOn: '2026-11-30',
    sponsorName: 'Masal Yayınları',
    sponsorUrl: 'https://masal.com',
    blurb: '',
  }

  it('geçerli dönemi kabul ediyor', () => {
    expect(featuredSlotSchema.parse(valid)).toMatchObject({ blurb: null })
  })

  it('ters tarih aralığını bitiş alanında bildiriyor', () => {
    const result = featuredSlotSchema.safeParse({ ...valid, endsOn: '2026-10-31' })
    expect(result.success).toBe(false)
    expect(result.error!.issues[0]!.path).toEqual(['endsOn'])
  })

  it('kitap seçilmemişse reddediyor', () => {
    expect(featuredSlotSchema.safeParse({ ...valid, bookId: '' }).success).toBe(false)
  })
})

describe('tarih yardımcıları', () => {
  it('İstanbul gününü UTC gece yarısından önce değiştiriyor', () => {
    // UTC 22:30 = İstanbul 01:30 (ertesi gün)
    expect(istanbulToday(new Date('2026-10-31T22:30:00Z'))).toBe('2026-11-01')
  })

  it('ay aralığı artık yılı biliyor', () => {
    expect(monthRange('2028-02-10')).toEqual({ start: '2028-02-01', end: '2028-02-29' })
  })

  it('yıl dönümünde sonraki aylar', () => {
    expect(upcomingMonths('2026-11-20', 3)).toEqual(['2026-11-01', '2026-12-01', '2027-01-01'])
  })

  it('dönem durumu uç günleri içeriyor', () => {
    const slot = { startsOn: '2026-10-01', endsOn: '2026-10-31' }
    expect(slotState(slot, '2026-10-01')).toBe('active')
    expect(slotState(slot, '2026-10-31')).toBe('active')
    expect(slotState(slot, '2026-11-01')).toBe('past')
    expect(slotState(slot, '2026-09-30')).toBe('upcoming')
  })
})
