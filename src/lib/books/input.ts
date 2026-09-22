import { z } from 'zod'
import { slugify, SLUG_PATTERN } from '@/lib/slug'
import { LIMITS } from '@/lib/validation'

/**
 * Kitap girdisi — yönetim formu, sunucu eylemi ve `npm run book:add` betiği
 * bu şemayı PAYLAŞIYOR (ADR 0008).
 *
 * Esnek girdi, katı çıktı: betik Instagram'dan kazınmış gevşek bir listeyi
 * de kabul edebilsin diye yazarlar virgüllü metin olabilir, konular düz slug
 * listesi olabilir, ISBN tireli yazılabilir. Şema bunları tek biçime
 * indiriyor; veritabanına her zaman aynı şekil gidiyor.
 *
 * Sınırlar veritabanı kısıtlarıyla aynı (bkz. `books_*_check`). Kısıt yine de
 * tetiklenirse `src/lib/errors.ts` Türkçeye çeviriyor.
 */

const trimmed = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => (value === '' ? null : value))

const optionalText = (max: number, label: string) =>
  z
    .union([trimmed(max, `${label} en fazla ${max} karakter olabilir.`), z.null()])
    .optional()
    .transform((value) => value ?? null)

/** Boş metin, null ya da sayı → sayı ya da null. Formdan hep metin geliyor. */
const optionalInt = (min: number, max: number, label: string) =>
  z
    .union([z.number(), z.string(), z.null()])
    .optional()
    .transform((value, context) => {
      if (value === null || value === undefined || value === '') return null
      const number = typeof value === 'number' ? value : Number(String(value).trim())
      if (!Number.isInteger(number)) {
        context.addIssue({ code: 'custom', message: `${label} tam sayı olmalı.` })
        return z.NEVER
      }
      if (number < min || number > max) {
        context.addIssue({ code: 'custom', message: `${label} ${min} ile ${max} arasında olmalı.` })
        return z.NEVER
      }
      return number
    })

/** "Ayşe, Ali" ya da ["Ayşe", "Ali"] → ["Ayşe", "Ali"] */
const nameList = z
  .union([z.array(z.string()), z.string(), z.null()])
  .optional()
  .transform((value) => {
    const list = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : []
    const names = list.map((name) => name.trim()).filter(Boolean)
    return [...new Set(names)]
  })

const topicEntry = z.union([
  z.string().trim().min(1),
  z.object({
    slug: z.string().trim().min(1),
    relevance: z
      .number({ message: 'Önem 1 ile 5 arasında olmalı.' })
      .int('Önem 1 ile 5 arasında olmalı.')
      .min(1, 'Önem 1 ile 5 arasında olmalı.')
      .max(5, 'Önem 1 ile 5 arasında olmalı.')
      .optional(),
  }),
])

/** Instagram gönderi adresinden kısa kodu çıkarır: /p/ABC123/ ya da /reel/ABC123/ */
export function instagramShortcode(url: string): string | null {
  return url.match(/instagram\.com\/(?:[^/]+\/)?(?:p|reel|tv)\/([A-Za-z0-9_-]+)/)?.[1] ?? null
}

/**
 * Gönderi adresini tek biçime indirir: `https://www.instagram.com/p/<kod>/`.
 * Tarayıcıdan kopyalanan adreslerde `?igsh=…`, `?img_index=2`, kullanıcı adı
 * öneki gibi ekler oluyor; aynı gönderi farklı adreslerle iki kez girmesin.
 * Gönderi kodu bulunamazsa adres olduğu gibi kalır.
 */
export function canonicalInstagramUrl(url: string): string {
  const match = url.match(/instagram\.com\/(?:[^/]+\/)?(p|reel|tv)\/([A-Za-z0-9_-]+)/)
  return match ? `https://www.instagram.com/${match[1]}/${match[2]}/` : url
}

const instagramSchema = z
  .object({
    url: z.string().trim().url('Instagram adresi geçerli bir bağlantı olmalı.'),
    shortcode: z.string().trim().optional(),
    postedAt: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Paylaşım tarihi YYYY-AA-GG biçiminde olmalı.')
      .optional()
      .or(z.literal('').transform(() => undefined)),
    likeCount: z
      .number({ message: 'Beğeni sayısı bir sayı olmalı.' })
      .int('Beğeni sayısı tam sayı olmalı.')
      .min(0, 'Beğeni sayısı negatif olamaz.')
      .optional(),
  })
  .transform((value) => ({
    url: canonicalInstagramUrl(value.url),
    shortcode: value.shortcode || instagramShortcode(value.url),
    postedAt: value.postedAt ?? null,
    likeCount: value.likeCount ?? 0,
  }))

export const bookInputSchema = z
  .object({
    title: z
      .string({ message: 'Kitap adı boş olamaz.' })
      .trim()
      .min(1, 'Kitap adı boş olamaz.')
      .max(LIMITS.bookTitle.max, `Kitap adı en fazla ${LIMITS.bookTitle.max} karakter olabilir.`),
    slug: z
      .string()
      .trim()
      .optional()
      .transform((value) => (value ? value : undefined))
      .refine((value) => value === undefined || SLUG_PATTERN.test(value), {
        message: 'Adres yalnızca küçük harf, rakam ve tire içerebilir.',
      }),
    subtitle: optionalText(200, 'Alt başlık'),
    originalTitle: optionalText(200, 'Özgün adı'),
    summary: z
      .string()
      .trim()
      .max(1000, 'Kısa özet en fazla 1000 karakter olabilir.')
      .optional()
      .transform((value) => value ?? ''),
    description: optionalText(5000, 'Açıklama'),
    language: z.enum(['tr', 'en'], { message: 'Dil "tr" ya da "en" olmalı.' }).default('tr'),
    ageMin: optionalInt(0, 18, 'En küçük yaş'),
    ageMax: optionalInt(0, 18, 'En büyük yaş'),
    pageCount: optionalInt(1, 2000, 'Sayfa sayısı'),
    publishedYear: optionalInt(1800, 2100, 'Basım yılı'),
    isbn13: z
      .union([z.string(), z.null()])
      .optional()
      .transform((value, context) => {
        const digits = (value ?? '').replace(/[^0-9]/g, '')
        if (!digits) return null
        if (digits.length !== 13) {
          context.addIssue({ code: 'custom', message: 'ISBN 13 haneli olmalı.' })
          return z.NEVER
        }
        return digits
      }),
    publisher: optionalText(120, 'Yayınevi'),
    series: z
      .object({
        title: z.string().trim().min(1, 'Seri adı boş olamaz.').max(200),
        position: z
          .number({ message: 'Seri sırası bir sayı olmalı.' })
          .int('Seri sırası tam sayı olmalı.')
          .min(1, 'Seri sırası 1 ile 999 arasında olmalı.')
          .max(999, 'Seri sırası 1 ile 999 arasında olmalı.')
          .optional(),
      })
      .nullable()
      .optional()
      .transform((value) => value ?? null),
    authors: nameList,
    illustrators: nameList,
    translators: nameList,
    topics: z
      .array(topicEntry)
      .optional()
      .transform((list) =>
        (list ?? []).map((entry) =>
          typeof entry === 'string'
            ? { slug: entry, relevance: 3 }
            : { slug: entry.slug, relevance: entry.relevance ?? 3 },
        ),
      ),
    interests: z
      .array(z.string().trim().min(1))
      .optional()
      .transform((list) => [...new Set(list ?? [])]),
    instagram: instagramSchema
      .nullable()
      .optional()
      .transform((value) => value ?? null),
    status: z.enum(['draft', 'published', 'archived']).default('published'),
    /** Anahtar kelimelerden ek konu/ilgi eklensin mi (veritabanında yapılıyor). */
    autoTag: z.boolean().default(true),
    /** Yalnızca betik: kapak görseli adresi ya da yerel dosya yolu. */
    cover: z.string().trim().min(1).optional(),
  })
  .superRefine((value, context) => {
    if (value.ageMin !== null && value.ageMax !== null && value.ageMin > value.ageMax) {
      context.addIssue({
        code: 'custom',
        path: ['ageMax'],
        message: 'Üst yaş sınırı alt sınırdan küçük olamaz.',
      })
    }
  })
  .transform((value) => ({
    ...value,
    slug: value.slug ?? slugify(value.title),
  }))

export type BookInput = z.infer<typeof bookInputSchema>

/** `upsert_book()` fonksiyonuna gidecek gövde (kapak hariç — o ayrı yükleniyor). */
export function toUpsertPayload(input: BookInput): Record<string, unknown> {
  const { cover: _cover, ...payload } = input
  return payload
}

export interface BookInputIssue {
  /** Listedeki sıra (1'den başlar); tek kitapta 1. */
  index: number
  title: string | null
  field: string
  message: string
}

/**
 * Tek kitap ya da liste kabul eder. Önce HEPSİNİ doğrular; herhangi birinde
 * sorun varsa hiçbirini yazmadan tüm sorunları birlikte döndürür — yarım
 * aktarılmış bir liste en kötü sonuç.
 */
export function parseBookInputs(
  raw: unknown,
): { ok: true; books: BookInput[] } | { ok: false; issues: BookInputIssue[] } {
  const list = Array.isArray(raw) ? raw : [raw]
  // Özgün sırayı ayrıca tutuyoruz: geçersiz kayıtlar atlanınca `books`
  // dizisindeki sıra listedekiyle örtüşmüyor, raporlanan numara kayardı.
  const parsed: Array<{ book: BookInput; index: number }> = []
  const issues: BookInputIssue[] = []

  list.forEach((entry, position) => {
    const result = bookInputSchema.safeParse(entry)
    if (result.success) {
      parsed.push({ book: result.data, index: position + 1 })
      return
    }
    const title =
      entry && typeof entry === 'object' && typeof (entry as { title?: unknown }).title === 'string'
        ? ((entry as { title: string }).title as string)
        : null
    for (const issue of result.error.issues) {
      issues.push({
        index: position + 1,
        title,
        field: issue.path.join('.') || '(kitap)',
        message: issue.message,
      })
    }
  })

  // Listede aynı adres iki kez geçiyorsa ikincisi birincinin üzerine yazar.
  // Aynı Instagram gönderisi de iki kitaba bağlanamaz (veritabanında benzersiz).
  const seen = new Map<string, number>()
  const seenPosts = new Map<string, number>()
  for (const { book, index } of parsed) {
    const earlier = seen.get(book.slug)
    if (earlier !== undefined) {
      issues.push({
        index,
        title: book.title,
        field: 'slug',
        message: `Aynı adres listede ${earlier}. sırada da var (${book.slug}).`,
      })
    } else {
      seen.set(book.slug, index)
    }

    const shortcode = book.instagram?.shortcode
    if (!shortcode) continue
    const earlierPost = seenPosts.get(shortcode)
    if (earlierPost !== undefined) {
      issues.push({
        index,
        title: book.title,
        field: 'instagram.url',
        message: `Aynı Instagram gönderisi listede ${earlierPost}. sırada da var; bir gönderi yalnızca bir kitaba bağlanabilir.`,
      })
    } else {
      seenPosts.set(shortcode, index)
    }
  }

  return issues.length > 0
    ? { ok: false, issues: issues.sort((a, b) => a.index - b.index) }
    : { ok: true, books: parsed.map((entry) => entry.book) }
}
