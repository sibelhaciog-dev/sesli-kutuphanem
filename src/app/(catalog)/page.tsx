import { CatalogView } from '@/components/books/CatalogView'
import { FeaturedBook } from '@/components/books/FeaturedBook'
import { getCatalog } from '@/lib/data/catalog'
import { loadDiscoveryModes } from '@/lib/data/discovery'
import { getFeaturedSource } from '@/lib/data/featured'
import { resolveFeatured } from '@/lib/featured'
import { istanbulToday } from '@/lib/sponsorship'
import { createPublicClient } from '@/lib/supabase/public'

interface PageProps {
  searchParams: Promise<{ konu?: string | string[]; yayinevi?: string | string[] }>
}

export default async function HomePage({ searchParams }: PageProps) {
  // Modlar herkese açık (aktif olanlar); oturumsuz istemci yeterli ve
  // katalogla birlikte önbelleğe alınabiliyor.
  const [books, modes, featuredSource, { konu, yayinevi }] = await Promise.all([
    getCatalog(),
    loadDiscoveryModes(createPublicClient()),
    getFeaturedSource(),
    searchParams,
  ])
  // Vitrindeki kitap katalogdan çözülüyor: ek sorgu yok, yayında olmayan
  // kitap da vitrine çıkamıyor.
  const pick = resolveFeatured(books, featuredSource.sponsored, featuredSource.stats)
  // `?konu=` ve `?yayinevi=` doğrulaması istemci tarafında yapılıyor.
  return (
    <CatalogView
      books={books}
      modes={modes}
      topicParam={konu}
      publisherParam={yayinevi}
      featured={pick ? <FeaturedBook pick={pick} today={istanbulToday()} /> : null}
    />
  )
}
