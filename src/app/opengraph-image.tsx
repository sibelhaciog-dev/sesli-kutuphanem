import { ImageResponse } from 'next/og'
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

const BRAND = '#E8602C'
const INK = '#1c1c1e'
const INK_SOFT = '#3a3a3c'
const CREAM = '#faf8f4'
const ACCENT = '#eab23a'

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
        <svg width="112" height="112" viewBox="0 0 180 180">
          <rect width="180" height="180" rx="40" fill={BRAND} />
          <path
            d="M45 48h37c5.6 0 10.7 2.9 13.5 7.3C98.3 50.9 103.4 48 109 48h26v84h-26c-5.6 0-10.7 2.9-13.5 7.3-2.8-4.4-7.9-7.3-13.5-7.3H45V48Z"
            fill="#FFF"
          />
          <path d="M90 55v70" stroke={BRAND} strokeWidth="7" strokeLinecap="round" />
          <path
            d="M58 70h20M58 86h20M102 70h20M102 86h20"
            stroke={BRAND}
            strokeWidth="6"
            strokeLinecap="round"
            opacity=".55"
          />
        </svg>
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
