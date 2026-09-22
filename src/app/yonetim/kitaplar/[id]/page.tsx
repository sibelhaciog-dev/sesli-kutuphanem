import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { BookForm } from '@/components/admin/BookForm'
import { getAdminBook } from '@/lib/data/admin'
import { getTaxonomy } from '@/lib/data/catalog'
import { createClient, requireStaff } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Kitabı düzenle · Yönetim' }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ yeni?: string }>
}

export default async function EditBookPage({ params, searchParams }: PageProps) {
  await requireStaff('/yonetim/kitaplar')
  const [{ id }, { yeni }] = await Promise.all([params, searchParams])
  // Geçersiz kimlik veritabanında tip hatası verirdi; doğrudan 404.
  if (!UUID.test(id)) notFound()

  const [book, { areas, interests }] = await Promise.all([
    getAdminBook(await createClient(), id),
    getTaxonomy(),
  ])
  if (!book) notFound()

  return (
    <div>
      <p className="mb-1 text-xs text-muted">
        <Link href="/yonetim/kitaplar" className="hover:text-accent">
          Kitaplar
        </Link>{' '}
        › Düzenle
      </p>
      <h2 className="mb-5 text-2xl text-ink">{book.title}</h2>
      <BookForm book={book} areas={areas} interests={interests} justCreated={yeni === '1'} />
    </div>
  )
}
