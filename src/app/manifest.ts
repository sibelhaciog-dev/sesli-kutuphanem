import type { MetadataRoute } from 'next'
import { BRAND_BACKGROUND, BRAND_COLOR } from '@/lib/brand'
import { SITE_NAME, SITE_TAGLINE } from '@/lib/site'

/**
 * Uygulama tanımı (web app manifest) — `/manifest.webmanifest` adresinde.
 *
 * Telefonda "Ana ekrana ekle" denince site bir uygulama gibi kurulur: kendi
 * ikonu, adı ve tarayıcı çubuğu olmadan tam ekran açılış. İkonlar
 * `npm run icons` ile üretilir.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: `${SITE_NAME} — ${SITE_TAGLINE}`,
    // Ana ekranda ikonun altında yazan ad; uzunsa telefon kısaltır.
    short_name: SITE_NAME,
    description:
      'Çocuğunuzun yaşına, ilgi alanlarına ve gelişim ihtiyacına göre seçilmiş çocuk kitapları.',
    lang: 'tr',
    dir: 'ltr',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    // Açılış ekranının zemini ve üst çubuk rengi (logoyla aynı, brand.ts).
    background_color: BRAND_BACKGROUND,
    theme_color: BRAND_COLOR,
    categories: ['books', 'education', 'kids'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
