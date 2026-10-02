import { useId, type ReactNode } from 'react'

/**
 * Gelişim rehberlerinin suluboya tadındaki küçük çizimleri.
 *
 * Rehber adresine (slug) göre seçilir. Yönetimden yeni bir rehber eklenirse
 * çizimi olmayacağı için `GUIDE_ART` içinde yoksa emoji gösterilir.
 */

interface Art {
  /** Kartın zemin rengi. */
  background: string
  /** `filter` adını alıp çizimi döndürür (sayfada birden çok kart olduğu için ad eşsiz olmalı). */
  draw: (filter: string) => ReactNode
}

export const GUIDE_ART: Record<string, Art> = {
  degisim: {
    background: '#e7f4dc',
    draw: (f) => (
      <>
        <path d="M38 60 h44 l-6 26 h-32z" fill="#d9825b" filter={f} />
        <rect x="34" y="56" width="52" height="9" rx="3" fill="#c46c45" filter={f} />
        <rect x="58" y="24" width="4.5" height="34" rx="2" fill="#4f8a2e" />
        <path d="M60 42 C46 42 36 32 38 22 C52 22 60 30 60 42Z" fill="#8cc95a" filter={f} />
        <path d="M61 34 C74 32 84 22 82 12 C68 12 61 22 61 34Z" fill="#6fb544" filter={f} />
        <circle cx="98" cy="20" r="9" fill="#ffd45c" opacity=".8" filter={f} />
      </>
    ),
  },
  'zor-konular': {
    background: '#e6eef8',
    draw: (f) => (
      <>
        <path
          d="M18 22 h56 a10 10 0 0 1 10 10 v20 a10 10 0 0 1 -10 10 h-30 l-12 10 v-10 h-14 a10 10 0 0 1 -10 -10 v-20 a10 10 0 0 1 10 -10z"
          fill="#9dbbe3"
          opacity=".8"
          filter={f}
        />
        <path
          d="M60 40 h40 a8 8 0 0 1 8 8 v16 a8 8 0 0 1 -8 8 h-6 v9 l-10 -9 h-24 a8 8 0 0 1 -8 -8 v-16 a8 8 0 0 1 8 -8z"
          fill="#f2b9a0"
          opacity=".85"
          filter={f}
        />
        <circle cx="72" cy="56" r="2.5" fill="#7a4a3a" />
        <circle cx="80" cy="56" r="2.5" fill="#7a4a3a" />
        <circle cx="88" cy="56" r="2.5" fill="#7a4a3a" />
      </>
    ),
  },
  duygu: {
    background: '#fbe4e6',
    draw: (f) => (
      <>
        <path
          d="M60 82 C30 62 20 46 26 34 C32 22 50 22 60 36 C70 22 88 22 94 34 C100 46 90 62 60 82Z"
          fill="#ef7f8c"
          opacity=".8"
          filter={f}
        />
        <path
          d="M44 38 C40 42 40 48 43 52"
          stroke="#fff"
          strokeWidth="3"
          fill="none"
          opacity=".7"
          strokeLinecap="round"
        />
        <circle cx="22" cy="20" r="4" fill="#f6b3bb" filter={f} />
        <circle cx="100" cy="18" r="6" fill="#f6b3bb" filter={f} />
      </>
    ),
  },
  sosyal: {
    background: '#fdf0d8',
    draw: (f) => (
      <>
        <circle cx="40" cy="34" r="12" fill="#e9b07c" filter={f} />
        <circle cx="80" cy="34" r="12" fill="#c98b5a" filter={f} />
        <path
          d="M22 84 C22 62 30 50 40 50 C50 50 56 60 58 70"
          fill="#f5c04a"
          opacity=".85"
          filter={f}
        />
        <path
          d="M98 84 C98 62 90 50 80 50 C70 50 64 60 62 70"
          fill="#7cb7d8"
          opacity=".85"
          filter={f}
        />
        <circle cx="60" cy="68" r="6" fill="#e9b07c" filter={f} />
      </>
    ),
  },
  'ozel-ilgi': {
    background: '#fff6d6',
    draw: (f) => (
      <>
        <path
          d="M60 14 L70 40 L98 41 L76 58 L84 85 L60 69 L36 85 L44 58 L22 41 L50 40Z"
          fill="#f7c843"
          opacity=".85"
          filter={f}
        />
        <circle cx="24" cy="20" r="3" fill="#f7c843" />
        <circle cx="98" cy="72" r="4" fill="#f7c843" opacity=".7" />
        <circle cx="102" cy="22" r="2.5" fill="#e8a13a" />
      </>
    ),
  },
  eglence: {
    background: '#f3e6fa',
    draw: (f) => (
      <>
        <circle cx="44" cy="38" r="16" fill="#e46b9b" opacity=".75" filter={f} />
        <circle cx="74" cy="32" r="14" fill="#6cb6e6" opacity=".75" filter={f} />
        <circle cx="62" cy="54" r="12" fill="#f5c04a" opacity=".8" filter={f} />
        <path
          d="M44 54 Q46 70 40 86 M74 46 Q72 66 80 86 M62 66 Q60 76 64 86"
          stroke="#8a7a90"
          strokeWidth="1.5"
          fill="none"
        />
      </>
    ),
  },
  okul: {
    background: '#e3f1ee',
    draw: (f) => (
      <>
        <rect
          x="34"
          y="28"
          width="52"
          height="54"
          rx="10"
          fill="#e8806a"
          opacity=".85"
          filter={f}
        />
        <path
          d="M46 28 C46 16 74 16 74 28"
          stroke="#b55a48"
          strokeWidth="5"
          fill="none"
          filter={f}
        />
        <rect x="42" y="50" width="36" height="18" rx="5" fill="#f3b3a2" filter={f} />
        <rect
          x="92"
          y="40"
          width="6"
          height="40"
          rx="2"
          fill="#f5c04a"
          transform="rotate(12 95 60)"
          filter={f}
        />
      </>
    ),
  },
  etkinlik: {
    background: '#fdeadf',
    draw: (f) => (
      <>
        <path
          d="M60 18 C90 18 104 40 98 58 C94 70 80 66 76 74 C72 84 58 86 42 80 C22 72 16 50 24 36 C32 22 46 18 60 18Z"
          fill="#f2d2a9"
          filter={f}
        />
        <circle cx="44" cy="40" r="7" fill="#e45d5d" filter={f} />
        <circle cx="62" cy="32" r="7" fill="#f5c04a" filter={f} />
        <circle cx="80" cy="42" r="7" fill="#5aa0d8" filter={f} />
        <circle cx="44" cy="60" r="7" fill="#7cc06a" filter={f} />
        <circle cx="66" cy="62" r="6" fill="#fff" opacity=".9" />
      </>
    ),
  },
}

/** Zemin rengi: çizimi olmayan rehberlerde krem. */
export function guideBackground(slug: string): string {
  return GUIDE_ART[slug]?.background ?? '#faf6ef'
}

/** Rehberin çizimi; yoksa büyük emoji. */
export function GuideArt({ slug, emoji }: { slug: string; emoji: string }) {
  const id = useId().replace(/:/g, '')
  const art = GUIDE_ART[slug]

  if (!art) {
    return (
      <span className="flex aspect-[120/92] items-center justify-center text-5xl" aria-hidden>
        {emoji}
      </span>
    )
  }

  return (
    <svg viewBox="0 0 120 92" className="block h-auto w-full" aria-hidden>
      <defs>
        {/* Kenarları hafif dalgalandırarak suluboya izlenimi verir. */}
        <filter id={id} x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves={3} seed={4} />
          <feDisplacementMap in="SourceGraphic" scale={7} />
          <feGaussianBlur stdDeviation={0.6} />
        </filter>
      </defs>
      {art.draw(`url(#${id})`)}
    </svg>
  )
}
