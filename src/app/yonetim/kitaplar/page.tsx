import { AdminBookList } from '@/components/admin/AdminBookList'
import { ADMIN_PAGE_SIZE, listAdminBooks } from '@/lib/data/admin'
import { toFriendlyMessage } from '@/lib/errors'
import { createClient, requireStaff } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ ara?: string; durum?: string; sayfa?: string }>
}

export default async function AdminBooksPage({ searchParams }: PageProps) {
  await requireStaff('/yonetim/kitaplar')
  const { ara = '', durum = '', sayfa = '1' } = await searchParams
  const page = Math.max(1, Number.parseInt(sayfa, 10) || 1)

  let result: Awaited<ReturnType<typeof listAdminBooks>> = { books: [], total: 0 }
  let error: string | null = null
  try {
    result = await listAdminBooks(await createClient(), { query: ara, status: durum, page })
  } catch (caught) {
    console.error('Yönetim kitap listesi okunamadı:', caught)
    error = toFriendlyMessage(caught, 'Kitaplar yüklenemedi. Sayfayı yenileyin.')
  }

  return (
    <AdminBookList
      books={result.books}
      total={result.total}
      page={page}
      pageSize={ADMIN_PAGE_SIZE}
      query={ara}
      status={durum}
      error={error}
    />
  )
}
