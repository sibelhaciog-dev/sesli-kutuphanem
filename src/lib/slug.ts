/**
 * Türkçe metinden URL'e uygun adres (slug) üretir.
 *
 * VERİTABANINDAKİ `public.slugify()` İLE BİREBİR AYNI OLMAK ZORUNDA
 * (bkz. 0001). Kitap adresi burada, yazar/yayınevi/seri adresleri ise
 * `upsert_book()` içinde veritabanında üretiliyor. İkisi ayrışırsa aynı yazar
 * iki farklı adresle iki kez oluşur.
 *
 * Bu yüzden bilinçli olarak Türkçe dışındaki aksanları (é, ñ) sadeleştirmiyor:
 * veritabanı da sadeleştirmiyor. "Café" → "caf". Nadir ve adres elle
 * düzeltilebiliyor; tutarlılık daha önemli.
 */

const TURKISH: Record<string, string> = {
  ç: 'c',
  Ç: 'c',
  ğ: 'g',
  Ğ: 'g',
  ı: 'i',
  İ: 'i',
  î: 'i',
  Î: 'i',
  ö: 'o',
  Ö: 'o',
  ş: 's',
  Ş: 's',
  ü: 'u',
  Ü: 'u',
  â: 'a',
  Â: 'a',
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function slugify(value: string, maxLength = 100): string {
  return value
    .replace(/[çÇğĞıİîÎöÖşŞüÜâÂ]/g, (char) => TURKISH[char] ?? char)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength)
    .replace(/-+$/g, '')
}
