/**
 * Kitap ekleme betiği — Claude'un "şu kitabı ekle" dediğinde kullandığı yol
 * (ADR 0008).
 *
 *   npm run book:add -- kitaplar.json              yeni kitapları ekle
 *   npm run book:add -- kitaplar.json --guncelle   var olanları da güncelle
 *   npm run book:add -- kitaplar.json --deneme     hiçbir şey yazmadan dene
 *   npm run book:add -- kapaklar.json --sadece-kapak
 *                                                  var olan kitaplara yalnızca kapak ekle
 *   cat kitap.json | npm run book:add -- -         standart girdiden oku
 *   npm run book:add -- --konular                  geçerli konu ve ilgi adreslerini listele
 *   npm run book:add -- liste.json --kapak-hatasi-gec
 *                                                  indirilemeyen kapakları atla, kitapları yine ekle
 *
 * INSTAGRAM KİMLİĞİ: Girdide Instagram gönderisi varsa ve o gönderi zaten bir
 * kitaba bağlıysa, kitap o kitap sayılır (adres ne olursa olsun). Tarayıcıdan
 * çıkarılan başlık küçük farklarla gelebiliyor ("Aslan ile Kuş" / "Aslan ve
 * Kuş"); gönderi kodu değişmiyor.
 *
 * Girdi tek bir kitap nesnesi ya da kitap listesi. Biçim:
 * `src/lib/books/input.ts` (yönetim formuyla AYNI şema) ve örnek:
 * `docs/examples/kitap-ekleme.json`.
 *
 * AKIŞ — yarım aktarılmış liste en kötü sonuç olduğu için sıra önemli:
 *   1. Şema doğrulaması (hepsi)
 *   2. Konu/ilgi adları veritabanındaki taksonomiye karşı (hepsi)
 *   3. Kapak görselleri indirilip işleniyor (hepsi) — bozuk bağlantı erken çıksın
 *   4. Kitap verileri TEK İŞLEMDE yazılıyor (`upsert_book`); biri düşerse hiçbiri yazılmaz
 *   5. Kapaklar yükleniyor
 *
 * Kimlik bilgileri `.env.local`'den okunur:
 *   DATABASE_URL          kitap verisi için (zorunlu)
 *   SUPABASE_SECRET_KEY   kapak yüklemek için (yoksa kapaklar atlanır)
 *
 * Sitede en geç 5 dakika içinde görünür (katalog önbelleği).
 *
 * Çıkış kodları: 0 tamam · 1 girdi sorunu, hiçbir şey yazılmadı ·
 * 2 veritabanı hatası, hiçbir şey yazılmadı · 3 kitaplar yazıldı, kapakların
 * bir kısmı eksik (yeniden denemek için `--sadece-kapak`).
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { Client } from 'pg'
import { parseBookInputs, toUpsertPayload, type BookInput } from '../src/lib/books/input'
import { setBookCover, storeCover } from '../src/lib/data/covers'
import { toFriendlyMessage } from '../src/lib/errors'
import { CoverError, processCover } from '../src/lib/images/cover'
import type { Database } from '../src/lib/supabase/database.types'
import { loadEnvFiles } from './lib/env'

loadEnvFiles()

// ─── Argümanlar ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const flags = new Set(args.filter((arg) => arg.startsWith('--')))
const source = args.find((arg) => !arg.startsWith('--'))

const OVERWRITE = flags.has('--guncelle') || flags.has('--update')
const DRY_RUN = flags.has('--deneme') || flags.has('--dry-run')
const COVERS_ONLY = flags.has('--sadece-kapak')
const NO_AUTO_TAG = flags.has('--etiketleme-yok')
const LIST_TAXONOMY = flags.has('--konular')
const SKIP_COVER_ERRORS = flags.has('--kapak-hatasi-gec')

const MAX_COVER_BYTES = 25 * 1024 * 1024
const FETCH_TIMEOUT_MS = 20_000

function fail(message: string, code = 1): never {
  console.error(`\n✗ ${message}`)
  process.exit(code)
}

function readSource(): unknown {
  if (!source) {
    fail(
      'Kitap dosyası verilmedi.\n' +
        '  Kullanım: npm run book:add -- kitaplar.json [--guncelle] [--deneme] [--sadece-kapak]',
    )
  }
  const text = source === '-' ? readFileSync(0, 'utf8') : readFileSync(resolve(source), 'utf8')
  try {
    return JSON.parse(text)
  } catch (error) {
    fail(`Dosya geçerli JSON değil: ${(error as Error).message}`)
  }
}

/** Kapak adresi ya da yerel dosya → ham bayt. */
async function loadCoverSource(cover: string): Promise<Buffer> {
  if (/^https?:\/\//i.test(cover)) {
    const response = await fetch(cover, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      // Başlıklar yalnızca ASCII olabilir.
      headers: { 'User-Agent': 'SesliKutuphanem/1.0 (book cover import)' },
    })
    if (!response.ok) throw new CoverError(`Kapak indirilemedi (HTTP ${response.status}).`)
    const type = response.headers.get('content-type') ?? ''
    if (!type.startsWith('image/')) {
      throw new CoverError(`Bağlantı bir görsele gitmiyor (${type || 'türü bilinmiyor'}).`)
    }
    const data = Buffer.from(await response.arrayBuffer())
    if (data.length > MAX_COVER_BYTES)
      throw new CoverError('Kapak dosyası çok büyük (en fazla 25 MB).')
    return data
  }

  try {
    return readFileSync(resolve(cover))
  } catch {
    throw new CoverError(`Kapak dosyası bulunamadı: ${cover}`)
  }
}

const kb = (bytes: number) => `${Math.round(bytes / 1024)} KB`

// ─── Ana akış ────────────────────────────────────────────────────────────────

function connect(connectionString: string): Client {
  return new Client({
    connectionString,
    ssl: connectionString.includes('supabase.') ? { rejectUnauthorized: false } : undefined,
  })
}

/** Liste hazırlarken hangi adreslerin geçerli olduğunu görmek için. */
async function printTaxonomy(connectionString: string) {
  const client = connect(connectionString)
  await client.connect()
  try {
    const { rows: topics } = await client.query<{ area: string; slug: string; name: string }>(
      `select a.name as area, t.slug, t.name
       from development_topics t join development_areas a on a.id = t.area_id
       order by a.position, t.position`,
    )
    const { rows: interests } = await client.query<{ slug: string; name: string }>(
      'select slug, name from interests order by position',
    )
    let area = ''
    console.log('\nGelişim konuları (topics[].slug):')
    for (const topic of topics) {
      if (topic.area !== area) console.log(`\n  ${(area = topic.area)}`)
      console.log(`    ${topic.slug.padEnd(26)} ${topic.name}`)
    }
    console.log('\nİlgi alanları (interests[]):\n')
    for (const interest of interests)
      console.log(`    ${interest.slug.padEnd(26)} ${interest.name}`)
  } finally {
    await client.end()
  }
}

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    fail('DATABASE_URL tanımlı değil. `.env.local` dosyasına ekleyin (bkz. docs/operations.md).')
  }

  if (LIST_TAXONOMY) {
    await printTaxonomy(connectionString)
    return
  }

  // [1] Şema
  const parsed = parseBookInputs(readSource())
  if (!parsed.ok) {
    console.error(`\n✗ ${parsed.issues.length} sorun bulundu, hiçbir kitap yazılmadı:\n`)
    for (const issue of parsed.issues) {
      const label = issue.title ? `"${issue.title}"` : '(adsız)'
      console.error(`  ${issue.index}. kitap ${label} · ${issue.field}: ${issue.message}`)
    }
    process.exit(1)
  }

  let books: BookInput[] = parsed.books.map((book) =>
    NO_AUTO_TAG ? { ...book, autoTag: false } : book,
  )

  const client = connect(connectionString)
  await client.connect()

  try {
    // [2] Taksonomi ve var olan kitaplar
    // Tek bağlantı üzerinde sorgular sırayla gitmeli (pg eşzamanlıyı desteklemiyor).
    const { rows: topicRows } = await client.query<{ slug: string }>(
      'select slug from public.development_topics',
    )
    const { rows: interestRows } = await client.query<{ slug: string }>(
      'select slug from public.interests',
    )

    // Instagram gönderisi zaten bir kitaba bağlıysa o kitabın adresini kullan.
    const { rows: postRows } = await client.query<{ slug: string; shortcode: string }>(
      `select slug, instagram_shortcode as shortcode from public.books
       where instagram_shortcode = any($1)`,
      [books.map((book) => book.instagram?.shortcode).filter(Boolean)],
    )
    const slugByPost = new Map(postRows.map((row) => [row.shortcode, row.slug]))
    const matchedByPost = new Map<string, string>()
    books = books.map((book) => {
      const known = book.instagram?.shortcode ? slugByPost.get(book.instagram.shortcode) : undefined
      if (!known || known === book.slug) return book
      matchedByPost.set(known, book.slug)
      return { ...book, slug: known }
    })

    const { rows: existingRows } = await client.query<{
      id: string
      slug: string
      cover_path: string | null
    }>('select id, slug, cover_path from public.books where slug = any($1)', [
      books.map((book) => book.slug),
    ])
    const topics = new Set(topicRows.map((row) => row.slug))
    const interests = new Set(interestRows.map((row) => row.slug))
    const existing = new Map(existingRows.map((row) => [row.slug, row]))

    const problems: string[] = []
    // Eşleştirmeden sonra iki girdi aynı kitaba düşebilir.
    const slugCount = new Map<string, number>()
    for (const book of books) slugCount.set(book.slug, (slugCount.get(book.slug) ?? 0) + 1)
    for (const [slug, count] of slugCount) {
      if (count > 1)
        problems.push(`"${slug}" kitabı listede ${count} kez geçiyor (aynı gönderi ya da aynı ad)`)
    }
    books.forEach((book, position) => {
      const label = `${position + 1}. kitap "${book.title}"`
      for (const topic of book.topics) {
        if (!topics.has(topic.slug))
          problems.push(`${label} · bilinmeyen gelişim konusu: ${topic.slug}`)
      }
      for (const interest of book.interests) {
        if (!interests.has(interest)) problems.push(`${label} · bilinmeyen ilgi alanı: ${interest}`)
      }
      if (COVERS_ONLY && !existing.has(book.slug)) {
        problems.push(
          `${label} · bu adreste kitap yok (${book.slug}); --sadece-kapak var olan kitaplar içindir`,
        )
      }
      if (COVERS_ONLY && !book.cover) problems.push(`${label} · kapak verilmemiş`)
    })

    if (problems.length > 0) {
      console.error(`\n✗ ${problems.length} sorun bulundu, hiçbir kitap yazılmadı:\n`)
      for (const problem of problems) console.error(`  ${problem}`)
      console.error(
        `\n  Geçerli konular: ${[...topics].sort().join(', ')}` +
          `\n  Geçerli ilgi alanları: ${[...interests].sort().join(', ')}`,
      )
      process.exit(1)
    }

    // [3] Kapakları önceden indir ve işle — bozuk bağlantı yazmadan önce çıksın.
    const covers = new Map<string, Buffer>()
    const coverProblems: string[] = []
    for (const book of books) {
      if (!book.cover) continue
      try {
        const data = await loadCoverSource(book.cover)
        await processCover(data) // yalnızca doğrulama; yükleme sonra
        covers.set(book.slug, data)
      } catch (error) {
        const message =
          error instanceof CoverError
            ? error.message
            : `Kapak alınamadı (${(error as Error).message}).`
        coverProblems.push(`"${book.title}" · ${message}`)
      }
    }
    if (coverProblems.length > 0 && !SKIP_COVER_ERRORS) {
      console.error(`\n✗ ${coverProblems.length} kapak kullanılamıyor, hiçbir kitap yazılmadı:\n`)
      for (const problem of coverProblems) console.error(`  ${problem}`)
      console.error(
        '\n  Instagram görsel adresleri birkaç gün içinde geçersizleşir. Kitapları kapaksız' +
          '\n  eklemek için --kapak-hatasi-gec; kapakları sonra --sadece-kapak ile ekleyin.',
      )
      process.exit(1)
    }
    if (coverProblems.length > 0) {
      console.warn(`\n⚠ ${coverProblems.length} kapak atlanacak (--kapak-hatasi-gec):`)
      for (const problem of coverProblems) console.warn(`  ${problem}`)
    }

    const secretKey = process.env.SUPABASE_SECRET_KEY
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const coversSkipped = covers.size > 0 && (!secretKey || !supabaseUrl)
    if (coversSkipped && COVERS_ONLY) {
      fail(
        'Kapak yüklemek için SUPABASE_SECRET_KEY gerekiyor.\n' +
          '  Supabase → Project Settings → API Keys → Secret key değerini `.env.local`e ekleyin.',
      )
    }
    if (coversSkipped) {
      console.warn(
        '\n⚠ SUPABASE_SECRET_KEY tanımlı değil: kitaplar eklenecek ama kapaklar ATLANACAK.' +
          '\n  Supabase → Project Settings → API Keys → Secret key değerini `.env.local`e ekleyin.',
      )
    }

    if (DRY_RUN) {
      console.log(`\n◇ Deneme — hiçbir şey yazılmadı. ${books.length} kitap geçerli:\n`)
      for (const book of books) {
        const state = existing.has(book.slug)
          ? OVERWRITE || COVERS_ONLY
            ? 'güncellenecek'
            : 'ATLANACAK (zaten var)'
          : 'eklenecek'
        const cover = covers.has(book.slug) ? ' · kapak hazır' : ''
        const matched = matchedByPost.has(book.slug)
          ? ` · Instagram gönderisinden eşleşti ("${matchedByPost.get(book.slug)}" yerine)`
          : ''
        console.log(`  ${state.padEnd(22)} ${book.slug}${cover}${matched}`)
      }
      return
    }

    // [4] Kitap verileri — tek işlem
    const results = new Map<string, { id: string; status: string }>()
    if (COVERS_ONLY) {
      for (const book of books)
        results.set(book.slug, { id: existing.get(book.slug)!.id, status: 'kapak' })
    } else {
      await client.query('begin')
      try {
        for (const book of books) {
          const { rows } = await client.query<{ result: { id: string; status: string } }>(
            'select public.upsert_book($1::jsonb, $2) as result',
            [JSON.stringify(toUpsertPayload(book)), OVERWRITE],
          )
          results.set(book.slug, rows[0]!.result)
        }
        await client.query('commit')
      } catch (error) {
        await client.query('rollback')
        const at = books[results.size]
        fail(
          `"${at?.title ?? '?'}" yazılamadı, hiçbir kitap eklenmedi:\n  ` +
            toFriendlyMessage(error, (error as Error).message),
          2,
        )
      }
    }

    // [5] Kapaklar
    const coverResults = new Map<string, string>()
    let coverFailures = 0
    if (covers.size > 0 && secretKey && supabaseUrl) {
      const supabase = createClient<Database>(supabaseUrl, secretKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
      for (const book of books) {
        const data = covers.get(book.slug)
        const result = results.get(book.slug)
        if (!data || !result) continue
        // Atlanan kitaba kapak eklemek, "var olana dokunma" sözünü bozardı.
        if (result.status === 'skipped') continue
        try {
          const stored = await storeCover(supabase, book.slug, data)
          await setBookCover(supabase, result.id, stored)
          coverResults.set(book.slug, `${kb(stored.bytes)} + ${kb(stored.thumbBytes)}`)
        } catch (error) {
          coverFailures += 1
          coverResults.set(book.slug, `HATA: ${toFriendlyMessage(error, (error as Error).message)}`)
        }
      }
    }

    // ─── Rapor ───────────────────────────────────────────────────────────
    const LABELS: Record<string, string> = {
      created: '✓ eklendi',
      updated: '✓ güncellendi',
      skipped: '– atlandı (zaten var)',
      kapak: '✓ kapak',
    }
    console.log(`\n${books.length} kitap işlendi:\n`)
    for (const book of books) {
      const result = results.get(book.slug)
      const cover = coverResults.get(book.slug)
      console.log(
        `  ${(LABELS[result?.status ?? ''] ?? result?.status ?? '?').padEnd(24)} ${book.slug}` +
          (cover ? `  [kapak: ${cover}]` : '') +
          (matchedByPost.has(book.slug) ? '  [Instagram gönderisinden eşleşti]' : ''),
      )
    }

    const skippedBooks = books.filter((book) => results.get(book.slug)?.status === 'skipped')
    if (skippedBooks.length > 0) {
      console.log(`\n  ${skippedBooks.length} kitap zaten vardı. Üzerine yazmak için: --guncelle`)
      // Atlanan kitaba kapak eklenmiyor; kapağı eksikse bunu ayrıca söyle.
      const missingCover = skippedBooks.filter(
        (book) => covers.has(book.slug) && !existing.get(book.slug)?.cover_path,
      )
      if (missingCover.length > 0) {
        console.log(
          `  Bunlardan ${missingCover.length} tanesinin kapağı yok ama girdide kapak var.` +
            ' Eklemek için aynı dosyayla: --sadece-kapak',
        )
      }
    }
    console.log('\nSitede en geç 5 dakika içinde görünür.')

    // 3 = kitaplar yazıldı ama kapakların bir kısmı eksik (yeniden: --sadece-kapak)
    if (coversSkipped || coverProblems.length > 0) process.exitCode = 3
    if (coverFailures > 0) {
      console.error(
        `\n⚠ ${coverFailures} kapak yüklenemedi; kitaplar eklendi. Yalnızca kapakları ` +
          'yeniden denemek için: npm run book:add -- <dosya> --sadece-kapak',
      )
      process.exitCode = 3
    }
  } finally {
    await client.end()
  }
}

main().catch((error: unknown) => {
  fail(toFriendlyMessage(error, (error as Error)?.message ?? String(error)), 2)
})
