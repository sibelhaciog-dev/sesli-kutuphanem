import Link from 'next/link'
import { BookCover } from '@/components/books/BookCover'
import type { CatalogBook } from '@/lib/data/types'
import { isSafeSponsorUrl, type FeaturedPick } from '@/lib/featured'
import { ageLabel } from '@/lib/labels'

/** `Ekim` — vitrin başlığındaki ay adı. */
function monthName(isoDay: string): string {
  return new Date(`${isoDay}T12:00:00Z`).toLocaleDateString('tr-TR', {
    month: 'long',
    timeZone: 'Europe/Istanbul',
  })
}

/**
 * Ana sayfanın üstündeki "Ayın kitabı" vitrini. Sponsorlu kitap "Sponsorlu"
 * etiketiyle açıkça belirtiliyor; reklamın gizlenmemesi hem yasal zorunluluk
 * hem de ebeveynin güveni için şart.
 */
export function FeaturedBook({ pick, today }: { pick: FeaturedPick<CatalogBook>; today: string }) {
  const { book, reason } = pick
  const age = ageLabel(book.ageMin, book.ageMax)
  const sponsored = reason.kind === 'sponsored' ? reason : null

  let why: string
  if (reason.kind === 'sponsored') {
    why = reason.blurb ?? 'Bu ay sizin için seçtiğimiz kitap.'
  } else if (reason.kind === 'most-liked') {
    const parts = [
      reason.averageRating !== null &&
        `⭐ ${reason.averageRating.toLocaleString('tr-TR')} (${reason.ratingCount} puan)`,
      reason.favoriteCount > 0 && `❤️ ${reason.favoriteCount} favori`,
    ].filter(Boolean)
    why = `Ailelerin en çok beğendiği kitap · ${parts.join(' · ')}`
  } else {
    why = 'Kütüphanemize yeni katılan kitap.'
  }

  return (
    <section
      aria-labelledby="ayin-kitabi"
      className="relative overflow-hidden rounded-panel border border-line bg-white p-4 sm:p-5"
    >
      <div className="flex gap-4 sm:gap-5">
        <Link
          href={`/kitap/${book.slug}`}
          className="relative aspect-2/3 w-24 shrink-0 overflow-hidden rounded-xl bg-cream shadow-card sm:w-32"
          tabIndex={-1}
          aria-hidden
        >
          <BookCover title={book.title} src={book.coverThumbUrl} priority />
        </Link>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <p
              id="ayin-kitabi"
              className="rounded-full bg-accent-soft px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-accent-ink uppercase"
            >
              🌟 {monthName(today)} ayının kitabı
            </p>
            {sponsored && (
              <p className="rounded-full border border-line px-2.5 py-0.5 text-[11px] font-semibold text-muted">
                Sponsorlu ·{' '}
                {isSafeSponsorUrl(sponsored.sponsorUrl) ? (
                  <a
                    href={sponsored.sponsorUrl}
                    target="_blank"
                    rel="sponsored noopener noreferrer"
                    className="underline hover:text-accent-ink"
                  >
                    {sponsored.sponsorName}
                  </a>
                ) : (
                  sponsored.sponsorName
                )}
              </p>
            )}
          </div>

          <h2 className="font-serif text-xl leading-tight text-ink sm:text-2xl">
            <Link href={`/kitap/${book.slug}`} className="hover:text-accent-ink">
              {book.title}
            </Link>
          </h2>
          {(book.authors.length > 0 || age) && (
            <p className="mt-0.5 text-xs text-muted">
              {[book.authors.join(', '), age].filter(Boolean).join(' · ')}
            </p>
          )}

          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-soft">{book.summary}</p>
          <p className="mt-2 text-xs font-medium text-accent-ink">{why}</p>

          <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-3">
            <Link
              href={`/kitap/${book.slug}`}
              className="text-sm font-semibold text-accent-ink hover:underline"
            >
              Kitabı incele →
            </Link>
            <Link href="/kitabini-paylas" className="text-xs text-muted hover:text-accent-ink">
              Kitabınız burada görünsün mü?
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
