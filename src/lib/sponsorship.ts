import { z } from 'zod'

/**
 * Sponsorluk: "Ayın kitabı sponsorluğu" başvurusu ve yönetimden girilen vitrin
 * dönemi. Sınırlar `0026_featured_book.sql` içindeki CHECK kısıtlarının
 * aynası; kısıtı değiştirirsen burayı da değiştir.
 */

const text = (max: number, label: string, min = 1) =>
  z
    .string({ message: `${label} boş olamaz.` })
    .trim()
    .min(min, min > 1 ? `${label} en az ${min} karakter olmalı.` : `${label} boş olamaz.`)
    .max(max, `${label} en fazla ${max} karakter olabilir.`)

const optionalText = (max: number, label: string) =>
  z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => value?.trim() || null)
    .refine((value) => value === null || value.length <= max, {
      message: `${label} en fazla ${max} karakter olabilir.`,
    })

const optionalUrl = (label: string) =>
  optionalText(500, label).refine((value) => value === null || /^https?:\/\/\S+$/i.test(value), {
    message: `${label} https:// ile başlayan bir adres olmalı.`,
  })

const isoDate = (label: string) =>
  z
    .string({ message: `${label} seçilmeli.` })
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${label} seçilmeli.`)
    .refine((value) => !Number.isNaN(Date.parse(`${value}T12:00:00Z`)), {
      message: `${label} geçerli bir tarih değil.`,
    })

// ─── Başvuru ─────────────────────────────────────────────────────────────────

export const sponsorApplicationSchema = z.object({
  contactName: text(120, 'Ad soyad', 2),
  contactEmail: z
    .string({ message: 'E-posta boş olamaz.' })
    .trim()
    .max(254, 'E-posta çok uzun.')
    .regex(/^[^@\s]+@[^@\s]+\.[^@\s]+$/, 'Geçerli bir e-posta adresi yazın.'),
  organization: optionalText(120, 'Yayınevi / kurum'),
  bookTitle: text(200, 'Kitap adı'),
  bookLink: optionalUrl('Kitap bağlantısı'),
  preferredMonth: z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => value?.trim() || null)
    .refine((value) => value === null || /^\d{4}-\d{2}-01$/.test(value), {
      message: 'Ay listeden seçilmeli.',
    }),
  message: optionalText(2000, 'Mesaj'),
})

export type SponsorApplicationInput = z.infer<typeof sponsorApplicationSchema>

// ─── Vitrin dönemi (yönetim) ─────────────────────────────────────────────────

export const featuredSlotSchema = z
  .object({
    bookId: z.string({ message: 'Kitap seçilmeli.' }).uuid('Kitap seçilmeli.'),
    startsOn: isoDate('Başlangıç tarihi'),
    endsOn: isoDate('Bitiş tarihi'),
    sponsorName: text(120, 'Sponsor adı'),
    sponsorUrl: optionalUrl('Sponsor bağlantısı'),
    blurb: optionalText(300, 'Sponsor mesajı'),
  })
  .refine((value) => value.endsOn >= value.startsOn, {
    path: ['endsOn'],
    message: 'Bitiş tarihi başlangıçtan önce olamaz.',
  })

export type FeaturedSlotInput = z.infer<typeof featuredSlotSchema>

// ─── Tarih yardımcıları ──────────────────────────────────────────────────────

/** Türkiye'de bugünün tarihi, `YYYY-MM-DD`. Sunucu UTC'de olsa da doğru gün. */
export function istanbulToday(now: Date = new Date()): string {
  // `en-CA` biçimi doğrudan YYYY-MM-DD veriyor.
  return now.toLocaleDateString('en-CA', { timeZone: 'Europe/Istanbul' })
}

/** Verilen tarihin ayının ilk ve son günü. */
export function monthRange(isoDay: string): { start: string; end: string } {
  const [year, month] = isoDay.split('-').map(Number) as [number, number]
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const mm = String(month).padStart(2, '0')
  return { start: `${year}-${mm}-01`, end: `${year}-${mm}-${String(last).padStart(2, '0')}` }
}

/** Bu aydan başlayarak `count` ayın ilk günü — başvuru formundaki ay listesi. */
export function upcomingMonths(isoDay: string, count: number): string[] {
  const [year, month] = isoDay.split('-').map(Number) as [number, number]
  return Array.from({ length: count }, (_, offset) => {
    const date = new Date(Date.UTC(year, month - 1 + offset, 1))
    return date.toISOString().slice(0, 10)
  })
}

/** Dönemin bugüne göre durumu. */
export function slotState(
  slot: { startsOn: string; endsOn: string },
  today: string,
): 'active' | 'upcoming' | 'past' {
  if (slot.endsOn < today) return 'past'
  if (slot.startsOn > today) return 'upcoming'
  return 'active'
}
