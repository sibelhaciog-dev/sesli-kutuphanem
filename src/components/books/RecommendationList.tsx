import Link from 'next/link'
import { BookCover } from '@/components/books/BookCover'
import { IconLabel } from '@/components/ui/Icon'
import { cn } from '@/lib/cn'
import { ageLabel } from '@/lib/labels'
import type { Recommendation } from '@/lib/recommendations'

/**
 * Kapaklı öneri kartları: kitap sayfasındaki "Bunu sevdiyseniz" ve okuma
 * raporundaki "Sırada ne okunabilir?" aynı görünümü kullanıyor.
 */
export function RecommendationList({
  items,
  className,
}: {
  items: Recommendation[]
  className?: string
}) {
  return (
    <ul className={cn('flex flex-col gap-2.5', className)}>
      {items.map((entry) => (
        <li
          key={entry.book.id}
          className="rounded-xl border border-line bg-white p-3 transition-colors hover:border-accent"
        >
          <Link href={`/kitap/${entry.book.slug}`} className="group flex items-start gap-3">
            <span className="block aspect-2/3 w-16 shrink-0 overflow-hidden rounded-md border border-line bg-cream">
              <BookCover title={entry.book.title} src={entry.book.coverThumbUrl} compact />
            </span>
            <span className="block min-w-0">
              <span className="block text-[15px] font-semibold text-ink group-hover:text-accent-ink">
                {entry.book.language === 'en' ? '🇬🇧' : '🇹🇷'} {entry.book.title}
              </span>
              <span className="mt-0.5 block text-xs text-muted">
                {ageLabel(entry.book.ageMin, entry.book.ageMax)}
              </span>
              {entry.reasons.length > 0 && (
                <span className="mt-1 block text-[11px] text-accent-ink">
                  <IconLabel name="tag">{entry.reasons.join(', ')}</IconLabel>
                </span>
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  )
}
