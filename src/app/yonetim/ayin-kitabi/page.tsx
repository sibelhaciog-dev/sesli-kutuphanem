import type { Metadata } from 'next'
import { FeaturedAdmin } from '@/components/admin/FeaturedAdmin'
import {
  listFeaturedSlots,
  listPublishedBookOptions,
  listSponsorApplications,
} from '@/lib/data/featured'
import { istanbulToday } from '@/lib/sponsorship'
import { createClient, requireStaff } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Ayın kitabı · Yönetim' }

export default async function AdminFeaturedPage() {
  await requireStaff('/yonetim/ayin-kitabi')
  const supabase = await createClient()
  const [slots, applications, books] = await Promise.all([
    listFeaturedSlots(supabase),
    listSponsorApplications(supabase),
    listPublishedBookOptions(supabase),
  ])
  return (
    <FeaturedAdmin
      slots={slots}
      applications={applications}
      books={books}
      today={istanbulToday()}
    />
  )
}
