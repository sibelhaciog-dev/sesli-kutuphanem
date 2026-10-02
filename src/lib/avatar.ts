/**
 * Avatar sistemi: hayvan dostları.
 *
 * Çocuk 12 hayvandan birini seçer. Eşyalar puanla değil okumayla açılır:
 * - Rehber eşyaları: o rehberden {@link GUIDE_BOOKS_NEEDED} kitap okununca.
 * - Mevsim eşyaları: o mevsim boyunca.
 * - Özel gün eşyaları: o günlerin çevresinde.
 * - Gizli hayvanlar: 50. ve 100. kitapta çocuk nesli tükenmekte olan bir
 *   hayvan seçer; seçtiği hayvan kalıcı olarak listesine eklenir.
 *
 * Veritabanında yeni alan yok: seçilen hayvan `avatar_character`,
 * takılan eşyalar ve seçilen gizli hayvanlar (`gizli:<kimlik>`)
 * `avatar_accessories` içinde tutulur.
 */

export interface AvatarAnimal {
  id: string
  name: string
  /** Gizli hayvanlarda kısa bilgi. */
  fact?: string
}

export const AVATAR_ANIMALS: readonly AvatarAnimal[] = [
  { id: 'tilki', name: 'Tilki' },
  { id: 'ayi', name: 'Ayı' },
  { id: 'baykus', name: 'Baykuş' },
  { id: 'kirpi', name: 'Kirpi' },
  { id: 'kedi', name: 'Kedi' },
  { id: 'kopek', name: 'Köpek' },
  { id: 'tavsan', name: 'Tavşan' },
  { id: 'kaplumbaga', name: 'Kaplumbağa' },
  { id: 'penguen', name: 'Penguen' },
  { id: 'ahtapot', name: 'Ahtapot' },
  { id: 'fil', name: 'Fil' },
  { id: 'zurafa', name: 'Zürafa' },
] as const

export const SECRET_ANIMALS: readonly AvatarAnimal[] = [
  {
    id: 'kelaynak',
    name: 'Kelaynak',
    fact: "Doğada çok az kelaynak kaldı. Türkiye'de Birecik'te koruma altında yaşatılıyor.",
  },
  {
    id: 'akdeniz-foku',
    name: 'Akdeniz foku',
    fact: 'Türkiye kıyılarının en nadir canlılarından. Sakin deniz mağaralarına ve temiz denize ihtiyacı var.',
  },
  {
    id: 'caretta',
    name: 'Caretta caretta',
    fact: 'Yumurtalarını kumsala bırakır. Temiz ve karanlık sahiller yavruların denize ulaşmasını sağlar.',
  },
  {
    id: 'kirmizi-panda',
    name: 'Kırmızı panda',
    fact: 'Himalayaların bambu ormanlarında yaşar. Ormanlar azaldıkça o da azalıyor.',
  },
  {
    id: 'anadolu-parsi',
    name: 'Anadolu parsı',
    fact: "Anadolu'nun büyük kedisi. O kadar az kaldı ki görenler bile çok nadir.",
  },
  {
    id: 'pangolin',
    name: 'Pangolin',
    fact: 'Pullarla kaplı tek memeli. Dünyada en çok yasa dışı avlanan hayvanlardan biri.',
  },
  {
    id: 'kar-leopari',
    name: 'Kar leoparı',
    fact: "Asya'nın karlı dağlarında yaşar. Üşüyünce kalın kuyruğuna sarınır.",
  },
] as const

export const DEFAULT_ANIMAL = 'tilki'

/** Rehber eşyası için o rehberden okunması gereken kitap sayısı. */
export const GUIDE_BOOKS_NEEDED = 3

/** Kaçıncı kitapta gizli hayvan seçme hakkı doğar. */
export const SECRET_MILESTONES = [50, 100] as const

const SECRET_PREFIX = 'gizli:'

/** Aynı yuvadaki eşyalar birlikte takılamaz (iki şapka gibi). */
export type ItemSlot = 'head' | 'neck' | 'side' | 'back'

export type ItemUnlock =
  | { kind: 'guide'; areaSlug: string; areaName: string }
  | { kind: 'season'; months: readonly number[]; label: string }
  | { kind: 'day'; from: readonly [number, number]; to: readonly [number, number]; label: string }

export interface AvatarItem {
  id: string
  name: string
  slot: ItemSlot
  unlock: ItemUnlock
}

export const AVATAR_ITEMS: readonly AvatarItem[] = [
  // Rehber eşyaları
  {
    id: 'yolculuk-cantasi',
    name: 'Yolculuk çantası',
    slot: 'side',
    unlock: { kind: 'guide', areaSlug: 'degisim', areaName: 'Değişim' },
  },
  {
    id: 'semsiye',
    name: 'Şemsiye',
    slot: 'side',
    unlock: { kind: 'guide', areaSlug: 'zor-konular', areaName: 'Zor Konular' },
  },
  {
    id: 'kalp-kolye',
    name: 'Kalp kolye',
    slot: 'neck',
    unlock: { kind: 'guide', areaSlug: 'duygu', areaName: 'Duygu ve Davranış' },
  },
  {
    id: 'arkadaslik-bayraklari',
    name: 'Arkadaşlık bayrakları',
    slot: 'back',
    unlock: { kind: 'guide', areaSlug: 'sosyal', areaName: 'Sosyal İlişkiler' },
  },
  {
    id: 'buyutec',
    name: 'Büyüteç',
    slot: 'side',
    unlock: { kind: 'guide', areaSlug: 'ozel-ilgi', areaName: 'Özel İlgi' },
  },
  {
    id: 'konfeti-sapka',
    name: 'Konfeti şapka',
    slot: 'head',
    unlock: { kind: 'guide', areaSlug: 'eglence', areaName: 'Eğlence' },
  },
  {
    id: 'mezuniyet-kepi',
    name: 'Mezuniyet kepi',
    slot: 'head',
    unlock: { kind: 'guide', areaSlug: 'okul', areaName: 'Okul' },
  },
  {
    id: 'ressam-beresi',
    name: 'Ressam beresi',
    slot: 'head',
    unlock: { kind: 'guide', areaSlug: 'etkinlik', areaName: 'Etkinlik' },
  },
  // Mevsim eşyaları
  {
    id: 'yaprak-atki',
    name: 'Yaprak atkı',
    slot: 'neck',
    unlock: { kind: 'season', months: [9, 10, 11], label: 'Sonbahar' },
  },
  {
    id: 'kis-beresi',
    name: 'Bere ve kardan adam',
    slot: 'head',
    unlock: { kind: 'season', months: [12, 1, 2], label: 'Kış' },
  },
  {
    id: 'cicek-taci',
    name: 'Çiçek tacı',
    slot: 'head',
    unlock: { kind: 'season', months: [3, 4, 5], label: 'İlkbahar' },
  },
  {
    id: 'hasir-sapka',
    name: 'Hasır şapka',
    slot: 'head',
    unlock: { kind: 'season', months: [6, 7, 8], label: 'Yaz' },
  },
  // Özel günler
  {
    id: 'balon',
    name: 'Balon',
    slot: 'side',
    unlock: { kind: 'day', from: [4, 16], to: [4, 30], label: '23 Nisan' },
  },
  {
    id: 'altin-ayrac',
    name: 'Altın kitap ayracı',
    slot: 'side',
    unlock: { kind: 'day', from: [3, 24], to: [3, 31], label: 'Kütüphaneler Haftası' },
  },
  {
    id: 'okul-cantasi',
    name: 'Okul çantası',
    slot: 'side',
    unlock: { kind: 'day', from: [9, 1], to: [9, 30], label: 'Okula dönüş' },
  },
] as const

const ITEM_BY_ID = new Map(AVATAR_ITEMS.map((item) => [item.id, item]))
const ANIMAL_IDS = new Set(AVATAR_ANIMALS.map((animal) => animal.id))
const SECRET_IDS = new Set(SECRET_ANIMALS.map((animal) => animal.id))

/** Eski insan karakterleri (k1–k8) → hayvan dostları. */
const LEGACY_CHARACTERS: Record<string, string> = {
  k1: 'tavsan',
  k2: 'kedi',
  k3: 'tilki',
  k4: 'ayi',
  k5: 'kopek',
  k6: 'tilki',
  k7: 'baykus',
  k8: 'penguen',
}

/** Kaydedilmiş karakter kimliğini çizilebilir bir hayvana çevirir. */
export function resolveAnimalId(id: string | null | undefined): string {
  if (id && (ANIMAL_IDS.has(id) || SECRET_IDS.has(id))) return id
  return (id && LEGACY_CHARACTERS[id]) ?? DEFAULT_ANIMAL
}

export function getAnimal(id: string | null | undefined): AvatarAnimal {
  const resolved = resolveAnimalId(id)
  return (
    AVATAR_ANIMALS.find((animal) => animal.id === resolved) ??
    SECRET_ANIMALS.find((animal) => animal.id === resolved) ??
    AVATAR_ANIMALS[0]!
  )
}

export function getItem(id: string): AvatarItem | undefined {
  return ITEM_BY_ID.get(id)
}

export function isSecretAnimal(id: string): boolean {
  return SECRET_IDS.has(id)
}

/** Takılı eşyalar — bilinmeyen kimlikler (eski aksesuarlar) atlanır, çizim sırasına dizilir. */
export function wornItems(accessories: readonly string[]): AvatarItem[] {
  const order: ItemSlot[] = ['back', 'side', 'neck', 'head']
  return accessories
    .map((id) => ITEM_BY_ID.get(id))
    .filter((item): item is AvatarItem => Boolean(item))
    .sort((a, b) => order.indexOf(a.slot) - order.indexOf(b.slot))
}

/** Seçilmiş gizli hayvanlar. */
export function chosenSecrets(accessories: readonly string[]): string[] {
  return accessories
    .filter((id) => id.startsWith(SECRET_PREFIX))
    .map((id) => id.slice(SECRET_PREFIX.length))
    .filter((id) => SECRET_IDS.has(id))
}

/** Okunan kitap sayısına göre toplam gizli hayvan hakkı. */
export function secretAllowance(booksRead: number): number {
  return SECRET_MILESTONES.filter((milestone) => booksRead >= milestone).length
}

/** Şu an seçilebilecek gizli hayvan sayısı. */
export function secretChoicesLeft(booksRead: number, accessories: readonly string[]): number {
  return Math.max(0, secretAllowance(booksRead) - chosenSecrets(accessories).length)
}

/** Gizli hayvanı seçer (hak varsa). */
export function chooseSecret(
  accessories: readonly string[],
  secretId: string,
  booksRead: number,
): string[] {
  if (!SECRET_IDS.has(secretId)) return [...accessories]
  if (chosenSecrets(accessories).includes(secretId)) return [...accessories]
  if (secretChoicesLeft(booksRead, accessories) === 0) return [...accessories]
  return [...accessories, `${SECRET_PREFIX}${secretId}`]
}

/** Çocuğun seçebileceği hayvanlar: 12 dost + seçtiği gizliler. */
export function availableAnimals(accessories: readonly string[]): AvatarAnimal[] {
  const secrets = new Set(chosenSecrets(accessories))
  return [...AVATAR_ANIMALS, ...SECRET_ANIMALS.filter((animal) => secrets.has(animal.id))]
}

export interface AvatarProgress {
  booksRead: number
  /** Rehber adresi → o rehberden okunan kitap sayısı. */
  readByArea: Readonly<Record<string, number>>
}

export interface ItemStatus {
  available: boolean
  /** Kilitliyse nasıl açılacağı; açıksa neden açık olduğu. */
  note: string
  /** Rehber eşyalarında ilerleme. */
  progress?: { have: number; need: number }
}

function inDayWindow(
  date: Date,
  from: readonly [number, number],
  to: readonly [number, number],
): boolean {
  const value = (date.getMonth() + 1) * 100 + date.getDate()
  return value >= from[0] * 100 + from[1] && value <= to[0] * 100 + to[1]
}

export function itemStatus(item: AvatarItem, progress: AvatarProgress, today: Date): ItemStatus {
  const { unlock } = item
  if (unlock.kind === 'guide') {
    const have = Math.min(progress.readByArea[unlock.areaSlug] ?? 0, GUIDE_BOOKS_NEEDED)
    const available = have >= GUIDE_BOOKS_NEEDED
    return {
      available,
      note: available
        ? `${unlock.areaName} rehberinden ${GUIDE_BOOKS_NEEDED} kitap okundu`
        : `${unlock.areaName} rehberinden ${GUIDE_BOOKS_NEEDED} kitap oku (${have}/${GUIDE_BOOKS_NEEDED})`,
      progress: { have, need: GUIDE_BOOKS_NEEDED },
    }
  }
  if (unlock.kind === 'season') {
    const available = unlock.months.includes(today.getMonth() + 1)
    return {
      available,
      note: available ? `${unlock.label} boyunca açık` : `${unlock.label} gelince açılır`,
    }
  }
  const available = inDayWindow(today, unlock.from, unlock.to)
  return {
    available,
    note: available ? `${unlock.label} için açık` : `${unlock.label} zamanı açılır`,
  }
}

/**
 * Eşyayı takar ya da çıkarır. Aynı yuvadaki diğer eşya çıkarılır (iki şapka
 * birlikte takılmaz). Gizli hayvan kayıtları korunur.
 */
export function toggleItem(accessories: readonly string[], itemId: string): string[] {
  const item = ITEM_BY_ID.get(itemId)
  if (!item) return [...accessories]
  if (accessories.includes(itemId)) return accessories.filter((id) => id !== itemId)
  return [
    ...accessories.filter((id) => ITEM_BY_ID.get(id)?.slot !== item.slot && !isLegacy(id)),
    itemId,
  ]
}

/** Eski puanlı aksesuarlar (s1–s12) — artık kullanılmıyor. */
function isLegacy(id: string): boolean {
  return /^s\d+$/.test(id)
}
