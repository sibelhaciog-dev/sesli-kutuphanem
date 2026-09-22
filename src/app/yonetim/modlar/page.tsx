import type { Metadata } from 'next'
import { ModeEditor } from '@/components/admin/ModeEditor'
import { getAdminModes } from '@/lib/data/admin'
import { getTaxonomy } from '@/lib/data/catalog'
import { createClient, requireStaff } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Keşif modları · Yönetim' }

export default async function AdminModesPage() {
  await requireStaff('/yonetim/modlar')
  const [modes, { areas, interests }] = await Promise.all([
    getAdminModes(await createClient()),
    getTaxonomy(),
  ])
  return <ModeEditor modes={modes} areas={areas} interests={interests} />
}
