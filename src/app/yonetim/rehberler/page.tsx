import type { Metadata } from 'next'
import { TaxonomyEditor } from '@/components/admin/TaxonomyEditor'
import { getAdminTaxonomy } from '@/lib/data/admin'
import { createClient, requireStaff } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Rehberler · Yönetim' }

export default async function AdminTaxonomyPage() {
  await requireStaff('/yonetim/rehberler')
  const { areas, interests } = await getAdminTaxonomy(await createClient())
  return <TaxonomyEditor areas={areas} interests={interests} />
}
