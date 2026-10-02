/**
 * Gelişim rehberlerinin küçük fotoğrafları.
 *
 * Fotoğraflar Unsplash'ten (ücretsiz lisans, Unsplash'in önerdiği gibi kendi
 * sunucusundan küçük boyutta çağrılıyor). Yönetimden yeni bir rehber
 * eklenirse burada fotoğrafı olmayacağı için emoji gösterilir.
 */

/** Rehber adresi → Unsplash fotoğraf kimliği. */
const GUIDE_PHOTOS: Record<string, string> = {
  degisim: 'photo-1723740683543-d394ba1d4366',
  'zor-konular': 'photo-1565340419825-cd1ac212cbce',
  duygu: 'photo-1581998392741-67879e0ef04a',
  sosyal: 'photo-1627764940620-90393d0e8c34',
  'ozel-ilgi': 'photo-1484820540004-14229fe36ca4',
  eglence: 'photo-1607453998774-d533f65dac99',
  okul: 'photo-1726726192148-af52008ff663',
  etkinlik: 'photo-1607211851821-8be3cd6146f0',
}

/** Rehberin küçük kare fotoğrafı; yoksa emoji. */
export function GuideArt({ slug, emoji }: { slug: string; emoji: string }) {
  const photo = GUIDE_PHOTOS[slug]
  if (!photo) {
    return (
      <span
        className="flex h-9 w-9 items-center justify-center rounded-lg bg-cream text-xl"
        aria-hidden
      >
        {emoji}
      </span>
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://images.unsplash.com/${photo}?w=96&h=96&fit=crop&auto=format&q=70`}
      alt=""
      width={36}
      height={36}
      loading="lazy"
      className="block h-9 w-9 rounded-lg object-cover"
    />
  )
}
