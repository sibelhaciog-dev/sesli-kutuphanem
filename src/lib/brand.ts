/**
 * Uygulamanın logosu — tek kaynak.
 *
 * Üst menüdeki logoyla aynı: sarı zemin (--color-accent) üzerinde kitaplık
 * simgesi (Icon.tsx → `books`). Ana ekran ikonları (`npm run icons`),
 * tarayıcı sekmesi ikonu ve paylaşım görselleri buradan çiziliyor; logo
 * değişirse yalnızca burası değişir, sonra `npm run icons` çalıştırılır.
 */

/** Logo zemini — globals.css → --color-accent */
export const BRAND_COLOR = '#eab23a'
/** Simge rengi — globals.css → --color-ink */
export const BRAND_INK = '#1c1c1e'
/** Açılış ekranı zemini — globals.css → --color-cream */
export const BRAND_BACKGROUND = '#faf8f4'

/** Kitaplık simgesi, 24×24 birimlik alanda (Icon.tsx ile aynı çizgiler). */
const BOOKS = 'M16 6l4 14M12 6v14M8 8v12M4 4v16'

interface LogoOptions {
  /** Kenar uzunluğu (piksel). */
  size?: number
  /**
   * Köşeler yuvarlak mı. iPhone ve "maskable" ikonlar köşelerini kendisi
   * keser; onlarda saydam köşe siyah görünür, bu yüzden düz kare kullanılır.
   */
  rounded?: boolean
  /**
   * Simgenin zemine oranı. Üst menüde 20/36 ≈ 0,56. Maskable ikonda Android
   * kenarlardan keseceği için daha küçük tutulur.
   */
  scale?: number
}

/** Logonun SVG metni. */
export function logoSvg({ size = 180, rounded = true, scale = 0.56 }: LogoOptions = {}): string {
  const box = 180
  const icon = box * scale
  const unit = icon / 24
  const offset = (box - icon) / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${box} ${box}">
  <rect width="${box}" height="${box}" ${rounded ? 'rx="40"' : ''} fill="${BRAND_COLOR}"/>
  <path d="${BOOKS}" transform="translate(${offset} ${offset}) scale(${unit})" fill="none"
        stroke="${BRAND_INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`
}

/** Logo, `<img src>` içinde kullanılabilecek veri adresi olarak. */
export function logoDataUri(options?: LogoOptions): string {
  return `data:image/svg+xml;base64,${Buffer.from(logoSvg(options)).toString('base64')}`
}
