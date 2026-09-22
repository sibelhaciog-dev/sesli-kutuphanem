import type { Metadata } from 'next'
import Link from 'next/link'
import { BookForm } from '@/components/admin/BookForm'
import { getTaxonomy } from '@/lib/data/catalog'
import { requireStaff } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Yeni kitap · Yönetim' }

export default async function NewBookPage() {
  await requireStaff('/yonetim/kitaplar/yeni')
  const { areas, interests } = await getTaxonomy()
  return (
    <div>
      <p className="mb-1 text-xs text-muted">
        <Link href="/yonetim/kitaplar" className="hover:text-accent">
          Kitaplar
        </Link>{' '}
        › Yeni kitap
      </p>
      <h2 className="mb-5 text-2xl text-ink">Yeni kitap</h2>
      <BookForm book={null} areas={areas} interests={interests} />
    </div>
  )
}
