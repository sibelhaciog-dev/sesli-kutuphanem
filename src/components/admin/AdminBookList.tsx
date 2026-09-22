'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { BookCover } from '@/components/books/BookCover'
import { Button, ButtonLink } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/cn'
import type { AdminBookRow, BookStatus } from '@/lib/data/admin'
import { ageLabel } from '@/lib/labels'

const STATUS_LABELS: Record<BookStatus, string> = {
  published: 'Yayında',
  draft: 'Taslak',
  archived: 'Arşiv',
}

export function AdminBookList({
  books,
  total,
  page,
  pageSize,
  query,
  status,
  error,
}: {
  books: AdminBookRow[]
  total: number
  page: number
  pageSize: number
  query: string
  status: string
  error: string | null
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(query)
  const pageCount = Math.max(1, Math.ceil(total / pageSize))

  function href(next: { ara?: string; durum?: string; sayfa?: number }) {
    const params = new URLSearchParams(searchParams.toString())
    // Arama ya da süzgeç değişince ilk sayfaya dön.
    if (!('sayfa' in next)) params.delete('sayfa')
    for (const [key, value] of Object.entries(next)) {
      if (value && !(key === 'sayfa' && value === 1)) params.set(key, String(value))
      else params.delete(key)
    }
    const qs = params.toString()
    return `/yonetim/kitaplar${qs ? `?${qs}` : ''}`
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            router.push(href({ ara: search.trim() }))
          }}
          className="flex min-w-60 flex-1 gap-2"
          role="search"
        >
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Kitap adı ya da adresi…"
            aria-label="Kitap ara"
            className="min-w-0 flex-1 rounded-full border-[1.5px] border-line px-4 py-2 text-sm outline-none focus:border-accent"
          />
          <Button type="submit" variant="secondary">
            Ara
          </Button>
        </form>
        <ButtonLink href="/yonetim/kitaplar/yeni">+ Yeni kitap</ButtonLink>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Chip active={!status} onClick={() => router.push(href({ durum: '' }))}>
          Tümü
        </Chip>
        {(['published', 'draft', 'archived'] as const).map((value) => (
          <Chip
            key={value}
            active={status === value}
            onClick={() => router.push(href({ durum: value }))}
          >
            {STATUS_LABELS[value]}
          </Chip>
        ))}
        <span className="ml-auto text-xs text-muted">{total} kitap</span>
      </div>

      {error && (
        <p role="alert" className="mb-4 rounded-xl bg-danger-soft p-3 text-sm text-danger">
          {error}
        </p>
      )}

      {books.length === 0 && !error ? (
        <EmptyState
          icon="📚"
          title="Kitap bulunamadı"
          description={query ? 'Aramayı değiştirin.' : 'Henüz kitap yok.'}
        />
      ) : (
        <ul className="divide-y divide-line rounded-panel border border-line bg-white">
          {books.map((book) => (
            <li key={book.id}>
              <Link
                href={`/yonetim/kitaplar/${book.id}`}
                className="flex items-center gap-3 p-3 transition-colors hover:bg-cream"
              >
                <span className="aspect-2/3 w-10 shrink-0 overflow-hidden rounded-md border border-line">
                  <BookCover title={book.title} src={book.coverThumbUrl} compact />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-serif text-[15px] text-ink">
                    {book.title}
                  </span>
                  <span className="block truncate text-[11px] text-muted">
                    {[
                      book.authors.join(', '),
                      ageLabel(book.ageMin, book.ageMax),
                      book.language === 'en' ? 'İngilizce' : null,
                      book.coverThumbUrl ? null : 'kapak yok',
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </span>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold',
                    book.status === 'published'
                      ? 'bg-success-soft text-success'
                      : book.status === 'draft'
                        ? 'bg-warning-soft text-warning'
                        : 'bg-[#F2F2F7] text-muted',
                  )}
                >
                  {STATUS_LABELS[book.status]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {pageCount > 1 && (
        <nav aria-label="Sayfalar" className="mt-4 flex items-center justify-center gap-3 text-sm">
          {page > 1 ? (
            <Link href={href({ sayfa: page - 1 })} className="text-accent hover:underline">
              ‹ Önceki
            </Link>
          ) : (
            <span className="text-line">‹ Önceki</span>
          )}
          <span className="text-muted">
            {page} / {pageCount}
          </span>
          {page < pageCount ? (
            <Link href={href({ sayfa: page + 1 })} className="text-accent hover:underline">
              Sonraki ›
            </Link>
          ) : (
            <span className="text-line">Sonraki ›</span>
          )}
        </nav>
      )}
    </div>
  )
}
