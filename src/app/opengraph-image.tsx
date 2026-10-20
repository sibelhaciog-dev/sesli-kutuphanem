import { ImageResponse } from 'next/og'
import { BRAND_BACKGROUND, BRAND_COLOR, BRAND_INK, logoDataUri } from '@/lib/brand'
import { OG_FONT_FAMILY, ogFonts } from '@/lib/og-fonts'
import { SITE_NAME, SITE_TAGLINE } from '@/lib/site'

/**
 * Paylaşım önizleme görseli — site bağlantısı WhatsApp, Instagram, Facebook
 * vb. yerlerde paylaşılınca çıkan kart. Derleme sırasında bir kez çizilir;
 * ad `SITE_NAME`'den geldiği için ad değişince kendiliğinden güncellenir.
 * Kitap sayfaları kendi görselini kullanır (kitap kapağı).
 */
export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const INK = BRAND_INK
const INK_SOFT = '#3a3a3c'
const CREAM = BRAND_BACKGROUND
const ACCENT = BRAND_COLOR

export default async function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 96px',
        background: CREAM,
        fontFamily: OG_FONT_FAMILY,
        position: 'relative',
      }}
    >
      {/* Sağ altta yumuşak dekor daireleri */}
      <div
        style={{
          position: 'absolute',
          right: -120,
          bottom: -160,
          width: 520,
          height: 520,
          borderRadius: 9999,
          background: '#fdf5df',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: 140,
          top: 70,
          width: 90,
          height: 90,
          borderRadius: 9999,
          background: ACCENT,
          opacity: 0.35,
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        <img src={logoDataUri({ size: 112 })} width={112} height={112} alt="" />
        <div style={{ fontSize: 34, fontWeight: 500, color: INK_SOFT }}>{SITE_TAGLINE}</div>
      </div>

      <div
        style={{
          marginTop: 40,
          fontSize: 96,
          fontWeight: 800,
          color: INK,
          lineHeight: 1.05,
          letterSpacing: -2,
        }}
      >
        {SITE_NAME}
      </div>
      <div style={{ width: 160, height: 12, borderRadius: 6, background: ACCENT, marginTop: 20 }} />

      <div
        style={{
          marginTop: 36,
          maxWidth: 820,
          fontSize: 38,
          fontWeight: 500,
          color: INK_SOFT,
          lineHeight: 1.35,
        }}
      >
        Çocuğunuzun yaşına, ilgi alanlarına ve gelişim ihtiyacına göre seçilmiş kitaplar.
      </div>
    </div>,
    { ...size, fonts: await ogFonts() },
  )
}
