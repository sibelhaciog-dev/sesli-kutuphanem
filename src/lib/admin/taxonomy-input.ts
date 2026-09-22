import { z } from 'zod'

/**
 * Yönetimden düzenlenen taksonomi ve keşif modu kayıtlarının şemaları
 * (ADR 0008). Sınırlar `src/lib/content/schema.ts` ile aynı — dışa aktarılan
 * dosya tohum olarak yeniden okunabilsin diye.
 *
 * Adresler (slug) burada YOK: oluşturulurken addan üretiliyor, sonra
 * değişmiyor. Konu adresi kitap etiketlerinde, çocuk profillerinde ve
 * rehber sayfasının adresinde kullanılıyor; değişmesi bağlantıları kırar.
 */

const text = (max: number, label: string) =>
  z
    .string({ message: `${label} boş olamaz.` })
    .trim()
    .min(1, `${label} boş olamaz.`)
    .max(max, `${label} en fazla ${max} karakter olabilir.`)

const optionalText = (max: number, label: string) =>
  z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => value?.trim() || null)
    .refine((value) => value === null || value.length <= max, {
      message: `${label} en fazla ${max} karakter olabilir.`,
    })

const emoji = (fallback: string) =>
  z
    .union([z.string(), z.null()])
    .optional()
    .transform((value) => value?.trim() || fallback)
    .refine((value) => value.length <= 8, { message: 'Simge tek bir emoji olmalı.' })

const position = z.coerce
  .number({ message: 'Sıra bir sayı olmalı.' })
  .int('Sıra tam sayı olmalı.')
  .min(0, 'Sıra negatif olamaz.')
  .max(999, 'Sıra en fazla 999 olabilir.')

// ─── Anahtar kelimeler ───────────────────────────────────────────────────────

/**
 * Anahtar kelimeler kitabın adı, alt başlığı ve özetinde aranıyor; eşleşen
 * kitaba konu otomatik ekleniyor. Her biri bir kelime PARÇASI: "kıskanç"
 * yazılırsa "kıskançlık" da yakalanır. Tam kelime gerekiyorsa `\y` ile
 * sarılır: `\yay\y` "ay"ı yakalar, "ayakkabı"yı yakalamaz.
 *
 * Veritabanı bunları düzenli ifade olarak kullanıyor; bozuk bir ifade her
 * kitap kaydını düşürürdü. Asıl denetim veritabanında (0023), bu yalnızca
 * erken ve alan bazlı geri bildirim.
 */
export function parseKeywords(value: string | string[] | null | undefined): string[] {
  const list = Array.isArray(value) ? value : (value ?? '').split(/[\n,]/)
  const cleaned = list.map((entry) => entry.trim().replaceAll('\\b', '\\y')).filter(Boolean)
  return [...new Set(cleaned)]
}

/** Geçersiz anahtar kelimenin açıklaması; sorun yoksa null. */
export function keywordProblem(keyword: string): string | null {
  if (keyword.length < 2) return `"${keyword}" çok kısa; en az 2 karakter olmalı.`
  try {
    // Postgres'in `\y`'si JavaScript'te `\b`.
    new RegExp(keyword.replaceAll('\\y', '\\b'), 'i')
    return null
  } catch {
    return `"${keyword}" okunamadı. Parantez, köşeli parantez, yıldız gibi özel işaretleri kaldırın.`
  }
}

const keywords = z
  .union([z.string(), z.array(z.string()), z.null()])
  .optional()
  .transform((value) => parseKeywords(value))
  .superRefine((list, context) => {
    for (const keyword of list) {
      const problem = keywordProblem(keyword)
      if (problem) context.addIssue({ code: 'custom', message: problem })
    }
  })

// ─── Taksonomi ───────────────────────────────────────────────────────────────

export const areaInputSchema = z.object({
  name: text(80, 'Rehber adı'),
  description: optionalText(500, 'Açıklama'),
  emoji: emoji('📚'),
  color: z
    .string()
    .trim()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Renk #RRGGBB biçiminde olmalı (ör. #E8602C).'),
  position,
})

export const topicInputSchema = z.object({
  areaId: z.string().uuid('Bir rehber seçin.'),
  name: text(80, 'Konu adı'),
  label: optionalText(80, 'Menü adı'),
  description: optionalText(500, 'Açıklama'),
  keywords,
  position,
})

export const interestInputSchema = z.object({
  name: text(60, 'İlgi alanı adı'),
  emoji: emoji('⭐'),
  keywords,
  position,
})

export type AreaInput = z.infer<typeof areaInputSchema>
export type TopicInput = z.infer<typeof topicInputSchema>
export type InterestInput = z.infer<typeof interestInputSchema>

// ─── Keşif modları ───────────────────────────────────────────────────────────

const weights = z
  .array(
    z.object({
      slug: z.string().trim().min(1),
      weight: z.coerce.number().int().min(1).max(5),
    }),
  )
  .optional()
  .transform((list) => {
    // Aynı konu iki kez seçildiyse sonuncusu geçerli.
    const bySlug = new Map((list ?? []).map((entry) => [entry.slug, entry]))
    return [...bySlug.values()]
  })

export const modeInputSchema = z.object({
  name: text(60, 'Mod adı'),
  emoji: optionalText(8, 'Simge'),
  description: optionalText(200, 'Kısa açıklama'),
  promptHint: optionalText(400, 'Yapay zekâya not'),
  language: z
    .union([z.enum(['tr', 'en']), z.literal(''), z.null()])
    .optional()
    .transform((value) => value || null),
  position,
  isActive: z.boolean().default(true),
  topics: weights,
  interests: weights,
})

export type ModeInput = z.infer<typeof modeInputSchema>

// ─── Ortak ───────────────────────────────────────────────────────────────────

/** Zod hatalarını form alanı → ilk mesaj sözlüğüne çevirir. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {}
  for (const issue of error.issues) {
    // Dizi elemanı hataları (ör. keywords.2) alanın kendisine yazılıyor.
    const key = issue.path.filter((part) => typeof part === 'string').join('.') || '_form'
    result[key] ??= issue.message
  }
  return result
}
