import { readFile } from 'node:fs/promises'
import path from 'node:path'

/**
 * Paylaşım önizleme görselleri (opengraph-image) için Poppins yazı tipi.
 *
 * Görseller sunucuda çiziliyor ve orada sitenin yazı tipi yok; dosyaları
 * `@fontsource/poppins` paketinden okuyoruz. Türkçe harflerin bir kısmı
 * (ş, ğ, İ) "latin-ext" dosyasında, geri kalanı "latin"de. Çizici (satori)
 * aynı adlı iki dosya arasında harf aramıyor; bu yüzden ikincisi ayrı adla
 * yükleniyor ve görsellerde `fontFamily: OG_FONT_FAMILY` kullanılıyor.
 */
const FILES = path.join(process.cwd(), 'node_modules/@fontsource/poppins/files')

/** Görsellerde kullanılacak yazı tipi listesi. */
export const OG_FONT_FAMILY = 'Poppins, PoppinsExt'

type Weight = 500 | 700 | 800

export async function ogFonts(weights: Weight[] = [500, 700, 800]) {
  const fonts = await Promise.all(
    weights.flatMap((weight) =>
      (['latin', 'latin-ext'] as const).map(async (subset) => ({
        name: subset === 'latin' ? 'Poppins' : 'PoppinsExt',
        weight,
        style: 'normal' as const,
        data: await readFile(path.join(FILES, `poppins-${subset}-${weight}-normal.woff`)),
      })),
    ),
  )
  return fonts
}
