/**
 * Uygulama ikonlarını üretir: `npm run icons`
 *
 * Logo `src/lib/brand.ts`'de tanımlı (üst menüdeki logoyla aynı). Logo
 * değişirse betiği yeniden çalıştırmak yeterli; çıkan dosyalar depoya
 * commit'lenir.
 *
 * Üretilenler:
 *   src/app/icon.svg                   tarayıcı sekmesindeki küçük ikon
 *   src/app/apple-icon.png             180 px — iPhone/iPad ana ekranı
 *   public/icons/icon-192.png          192 px — Android, köşeleri yuvarlak
 *   public/icons/icon-512.png          512 px — Android açılış ekranı
 *   public/icons/icon-maskable-512.png 512 px — Android'in kendi kestiği biçim
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { logoSvg } from '../src/lib/brand'

async function render(file: string, size: number, svg: string) {
  await mkdir(path.dirname(file), { recursive: true })
  await sharp(Buffer.from(svg), { density: 400 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(file)
  console.log(`✓ ${file} (${size}×${size})`)
}

async function main() {
  // Sekme ikonu küçük görünür; simge biraz büyük tutuluyor ki seçilsin.
  await writeFile('src/app/icon.svg', logoSvg({ size: 32, scale: 0.66 }) + '\n')
  console.log('✓ src/app/icon.svg')
  await render('src/app/apple-icon.png', 180, logoSvg({ rounded: false }))
  await render('public/icons/icon-192.png', 192, logoSvg())
  await render('public/icons/icon-512.png', 512, logoSvg())
  // Android'in güvenli alanı ortadaki %80'lik daire; simge onun içinde kalsın.
  await render('public/icons/icon-maskable-512.png', 512, logoSvg({ rounded: false, scale: 0.46 }))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
