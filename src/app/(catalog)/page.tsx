import { CatalogView } from '@/components/books/CatalogView'
import { FeaturedBook } from '@/components/books/FeaturedBook'
import { getCatalog } from '@/lib/data/catalog'
import { loadDiscoveryModes } from '@/lib/data/discovery'
import { getFeaturedSource } from '@/lib/data/featured'
import { resolveFeatured } from '@/lib/featured'
import { istanbulToday } from '@/lib/sponsorship'
import { createPublicClient } from '@/lib/supabase/public'

export default async function HomePage() {
  // Modlar herkese açık (aktif olanlar); oturumsuz istemci yeterli ve
  // katalogla birlikte önbelleğe alınabiliyor.
  const [books, modes, featuredSource] = await Promise.all([
    getCatalog(),
    loadDiscoveryModes(createPublicClient()),
    getFeaturedSource(),
  ])
  // Vitrindeki kitap katalogdan çözülüyor: ek sorgu yok, yayında olmayan
  // kitap da vitrine çıkamıyor.
  const pick = resolveFeatured(books, featuredSource.sponsored, featuredSource.stats)
  return (
    <CatalogView
      books={books}
      modes={modes}
      featured={pick ? <FeaturedBook pick={pick} today={istanbulToday()} /> : null}
    />
  )
}
