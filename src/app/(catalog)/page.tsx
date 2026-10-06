import { CatalogView } from '@/components/books/CatalogView'
import { getCatalog } from '@/lib/data/catalog'
import { loadDiscoveryModes } from '@/lib/data/discovery'
import { createPublicClient } from '@/lib/supabase/public'

interface PageProps {
  searchParams: Promise<{ konu?: string | string[]; yayinevi?: string | string[] }>
}

export default async function HomePage({ searchParams }: PageProps) {
  // Modlar herkese açık (aktif olanlar); oturumsuz istemci yeterli ve
  // katalogla birlikte önbelleğe alınabiliyor.
  const [books, modes, { konu, yayinevi }] = await Promise.all([
    getCatalog(),
    loadDiscoveryModes(createPublicClient()),
    searchParams,
  ])
  // `?konu=` ve `?yayinevi=` doğrulaması istemci tarafında yapılıyor.
  return <CatalogView books={books} modes={modes} topicParam={konu} publisherParam={yayinevi} />
}
