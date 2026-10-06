/**
 * "Ayın kitabı" vitrini — hangi kitabın, hangi gerekçeyle gösterileceği.
 *
 * Öncelik sırası:
 *   1. Bugün yayında bir sponsorlu dönem varsa onun kitabı.
 *   2. Yoksa en çok beğenilen kitap (puan + favori).
 *   3. Hiç beğeni yoksa en son eklenen kitap.
 *
 * Saf mantık; veriyi `src/lib/data/featured.ts` getirir.
 */

/** Kitap başına beğeni toplamı — `book_like_stats()` çıktısı. */
export interface BookLikeStat {
  bookId: string
  ratingCount: number
  ratingSum: number
  favoriteCount: number
}

export interface SponsoredSlot {
  bookId: string
  sponsorName: string
  sponsorUrl: string | null
  blurb: string | null
}

export type FeaturedReason =
  | { kind: 'sponsored'; sponsorName: string; sponsorUrl: string | null; blurb: string | null }
  | { kind: 'most-liked'; averageRating: number | null; ratingCount: number; favoriteCount: number }
  | { kind: 'newest' }

export interface FeaturedPick<T> {
  book: T
  reason: FeaturedReason
}

/**
 * Skorlama: favori, 5 yıldızlık bir oy sayılır; ortalama, `PRIOR_VOTES` adet
 * `PRIOR_MEAN` puanlık hayalî oyla dengelenir (Bayes ortalaması).
 *
 * NEDEN: Düz ortalamada tek bir 5 yıldız alan kitap, 40 kişinin 4,8 verdiği
 * kitabın önüne geçerdi. Hayalî oylar az oylu kitabı ortaya çeker; oy
 * arttıkça kitabın kendi ortalaması baskın gelir.
 */
const PRIOR_VOTES = 5
const PRIOR_MEAN = 3
const FAVORITE_AS_RATING = 5

export function likeScore(stat: BookLikeStat): number {
  const votes = stat.ratingCount + stat.favoriteCount
  const total = stat.ratingSum + stat.favoriteCount * FAVORITE_AS_RATING
  return (total + PRIOR_VOTES * PRIOR_MEAN) / (votes + PRIOR_VOTES)
}

/**
 * En çok beğenilen kitap. Eşitlikte daha çok oy alan, o da eşitse kimliğe
 * göre — her çağrıda aynı sonuç (sayfa yenilenince vitrin zıplamasın).
 */
export function pickMostLiked(
  stats: BookLikeStat[],
  isEligible: (bookId: string) => boolean = () => true,
): BookLikeStat | null {
  let best: { stat: BookLikeStat; score: number; votes: number } | null = null
  for (const stat of stats) {
    const votes = stat.ratingCount + stat.favoriteCount
    if (votes === 0 || !isEligible(stat.bookId)) continue
    const score = likeScore(stat)
    if (
      !best ||
      score > best.score ||
      (score === best.score && votes > best.votes) ||
      (score === best.score && votes === best.votes && stat.bookId < best.stat.bookId)
    ) {
      best = { stat, score, votes }
    }
  }
  return best?.stat ?? null
}

/**
 * Vitrini seç. `books` yayındaki katalog, yeniden eskiye sıralı (katalog
 * sorgusu böyle döndürüyor) — "en yeni" yedeği listenin başı.
 *
 * Sponsorlu kitap katalogda yoksa (taslağa alınmış olabilir) sponsor
 * atlanır: yayında olmayan bir kitabı vitrine koymak boş sayfaya götürür.
 */
export function resolveFeatured<T extends { id: string }>(
  books: T[],
  sponsored: SponsoredSlot | null,
  stats: BookLikeStat[],
): FeaturedPick<T> | null {
  const byId = new Map(books.map((book) => [book.id, book]))

  if (sponsored) {
    const book = byId.get(sponsored.bookId)
    if (book) {
      return {
        book,
        reason: {
          kind: 'sponsored',
          sponsorName: sponsored.sponsorName,
          sponsorUrl: sponsored.sponsorUrl,
          blurb: sponsored.blurb,
        },
      }
    }
  }

  const liked = pickMostLiked(stats, (id) => byId.has(id))
  if (liked) {
    return {
      book: byId.get(liked.bookId)!,
      reason: {
        kind: 'most-liked',
        averageRating:
          liked.ratingCount > 0
            ? Math.round((liked.ratingSum / liked.ratingCount) * 10) / 10
            : null,
        ratingCount: liked.ratingCount,
        favoriteCount: liked.favoriteCount,
      },
    }
  }

  const newest = books[0]
  return newest ? { book: newest, reason: { kind: 'newest' } } : null
}

/** Sponsor adresi yalnızca http(s) olabilir — veritabanı kısıtının aynası. */
export function isSafeSponsorUrl(value: string | null): value is string {
  return !!value && /^https?:\/\//i.test(value)
}
