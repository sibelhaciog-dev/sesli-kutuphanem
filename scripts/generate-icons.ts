/**
 * Uygulama ikonlarını üretir: `npm run icons`
 *
 * Telefonda "Ana ekrana ekle" denince kullanılan PNG ikonlar buradan çıkar.
 * Tarayıcı sekmesindeki küçük ikon (`src/app/icon.svg`) ayrıdır, ona
 * dokunulmaz. Logo değişirse aşağıdaki LOGO'yu güncelleyip betiği yeniden
 * çalıştırmak yeterli; çıkan PNG'ler depoya commit'lenir.
 *
 * Üretilenler:
 *   src/app/apple-icon.png             180 px — iPhone/iPad ana ekranı
 *   public/icons/icon-192.png          192 px — Android, köşeleri yuvarlak
 *   public/icons/icon-512.png          512 px — Android açılış ekranı
 *   public/icons/icon-maskable-512.png 512 px — Android'in kendi kestiği biçim
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const BRAND = '#E8602C'

/** Açık kitap logosu, 180×180 birimlik alanda (eski apple-icon.svg ile aynı). */
const LOGO = `
  <path d="M45 48h37c5.6 0 10.7 2.9 13.5 7.3C98.3 50.9 103.4 48 109 48h26v84h-26c-5.6 0-10.7 2.9-13.5 7.3-2.8-4.4-7.9-7.3-13.5-7.3H45V48Z"
        fill="#FFF" opacity=".95"/>
  <path d="M90 55v70" stroke="${BRAND}" stroke-width="7" stroke-linecap="round"/>
  <path d="M58 70h20M58 86h20M102 70h20M102 86h20"
        stroke="${BRAND}" stroke-width="6" stroke-linecap="round" opacity=".55"/>`

/**
 * @param rounded Köşeler yuvarlak mı. iPhone ve "maskable" ikonlar kendi
 *   köşelerini keser; onlarda saydam köşe siyah görünür, bu yüzden düz kare.
 * @param scale Logonun boyutu. Maskable ikonda Android kenarlardan keseceği
 *   için logo güvenli alanın (ortadaki %80'lik daire) içine küçültülür.
 */
function svg({ rounded, scale = 1 }: { rounded: boolean; scale?: number }): Buffer {
  const offset = (180 - 180 * scale) / 2
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 180">
  <rect width="180" height="180" ${rounded ? 'rx="40"' : ''} fill="${BRAND}"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})">${LOGO}</g>
</svg>`)
}

async function render(file: string, size: number, source: Buffer) {
  await mkdir(path.dirname(file), { recursive: true })
  await sharp(source, { density: 400 }).resize(size, size).png({ compressionLevel: 9 }).toFile(file)
  console.log(`✓ ${file} (${size}×${size})`)
}

async function main() {
  await render('src/app/apple-icon.png', 180, svg({ rounded: false }))
  await render('public/icons/icon-192.png', 192, svg({ rounded: true }))
  await render('public/icons/icon-512.png', 512, svg({ rounded: true }))
  await render('public/icons/icon-maskable-512.png', 512, svg({ rounded: false, scale: 0.8 }))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
