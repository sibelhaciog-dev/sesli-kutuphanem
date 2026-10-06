import { AdminNoteList } from '@/components/admin/AdminNoteList'
import { loadModerationNotes } from '@/lib/data/library'
import { createClient, requireStaff } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function AdminNotesPage() {
  await requireStaff('/yonetim/notlar')
  const supabase = await createClient()
  const items = await loadModerationNotes(supabase).catch(() => [])
  return <AdminNoteList items={items} />
}
