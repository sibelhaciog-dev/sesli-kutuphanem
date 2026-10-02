import Link from 'next/link'
import { cn } from '@/lib/cn'
import type { RecommendationPick } from '@/lib/data/discovery'

/**
 * Öneri kartları.
 *
 * Gerekçe her kartın ana metni: kullanıcının "neden bu kitap" sorusunun
 * cevabı burada. Kitap adı bağlantı, gerekçe altında.
 */
export function DiscoveryResults({
  picks,
  source,
  note,
  compact = false,
  covers,
}: {
  picks: RecommendationPick[]
  source: 'ai' | 'deterministik'
  note?: string | null
  compact?: boolean
  /** Kitap adresi → küçük kapak. Verilirse kartlarda kapak görünür. */
  covers?: ReadonlyMap<string, string | null>
}) {
  if (picks.length === 0) return null

  return (
    <div>
      {note && (
        <p className="mb-3 rounded-xl border border-line bg-cream px-3 py-2 text-xs text-muted">
          {note}
        </p>
      )}

      <ul className={cn('flex flex-col', compact ? 'gap-2' : 'gap-2.5')}>
        {picks.map((pick) => (
          <li
            key={pick.kitapId || pick.slug}
            className="rounded-xl border border-line bg-white p-3 transition-colors hover:border-accent"
          >
            <Link href={`/kitap/${pick.slug}`} className="flex items-start gap-3">
              {covers && (
                <span className="w-14 shrink-0 overflow-hidden rounded-md border border-line bg-cream">
                  {covers.get(pick.slug) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={covers.get(pick.slug)!}
                      alt=""
                      loading="lazy"
                      className="block aspect-[3/4] w-full object-cover"
                    />
                  ) : (
                    <span className="flex aspect-[3/4] items-center justify-center text-xl">
                      📖
                    </span>
                  )}
                </span>
              )}
              <span className="block min-w-0">
                <span
                  className={cn(
                    'block font-semibold text-ink',
                    compact ? 'text-sm' : 'text-[15px]',
                  )}
                >
                  {pick.baslik}
                </span>
                {pick.gerekce && (
                  <span className="mt-1 block text-xs leading-relaxed text-ink-soft">
                    {pick.gerekce}
                  </span>
                )}
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Kullanıcı önerinin nereden geldiğini bilmeli. */}
      <p className="mt-2.5 text-[11px] text-muted">
        {source === 'ai'
          ? '✨ Yapay zekâ, yaşına uygun kitaplar arasından seçti.'
          : '📋 Okuma geçmişine göre sıralandı.'}
      </p>
    </div>
  )
}
