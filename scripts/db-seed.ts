/**
 * Boş bir veritabanını `content/` dosyalarıyla tohumlar (ADR 0008).
 *
 *   npm run db:seed          uzak veritabanı (.env.local'deki DATABASE_URL)
 *   npm run db:seed:local    yerel Docker veritabanı
 *
 * ADR 0008'den beri kitapların, taksonominin ve keşif modlarının doğru
 * kaynağı VERİTABANI: yönetim paneli ve `npm run book:add` doğrudan oraya
 * yazıyor. Bu betik o yüzden artık yalnızca EKSİK kayıtları ekliyor, var
 * olana dokunmuyor — panelde yapılan bir düzeltmenin eski dosyayla ezilmesi
 * mümkün değil.
 *
 * Kullanım yeri: yeni kurulan bir ortam (yerel geliştirme, test, yeni bir
 * Supabase projesi). Üretimde çalıştırmaya gerek yok; çalıştırılırsa
 * zararsız, ama panelden SİLİNMİŞ bir kitap ya da konu dosyada duruyorsa geri
 * gelir. Dosyaları üretimle eşitlemek için önce `npm run db:export`.
 *
 * Başarımlar ve bağış kurumları panelden düzenlenmiyor; onların kaynağı hâlâ
 * dosya, o yüzden güncelleniyorlar.
 */
import { Client } from 'pg'
import { type BookContent, checkContentConsistency } from '../src/lib/content/schema'
import { loadAllContent } from '../src/lib/content/load'
import { loadEnvFiles } from './lib/env'

loadEnvFiles()

function requireConnectionString(): string {
  const value = process.env.DATABASE_URL
  if (!value) {
    console.error('DATABASE_URL tanımlı değil.')
    console.error('`.env.local` dosyasına ekleyin ya da komutun başında verin:')
    console.error('  DATABASE_URL="postgresql://…" npm run db:seed')
    console.error('Değer: Supabase → Project Settings → Database → Connection string (URI)')
    process.exit(1)
  }
  return value
}

const connectionString = requireConnectionString()

/** İçerik dosyasındaki kitap → `upsert_book()` gövdesi (tek yazma yolu). */
function toPayload(book: BookContent): Record<string, unknown> {
  return {
    slug: book.slug,
    title: book.title,
    subtitle: book.subtitle,
    originalTitle: book.originalTitle,
    summary: book.summary,
    description: book.description,
    language: book.language,
    ageMin: book.ageMin,
    ageMax: book.ageMax,
    pageCount: book.pageCount,
    isbn13: book.isbn13,
    publishedYear: book.publishedYear,
    status: book.status,
    publisher: book.publisher,
    series: book.series ? { title: book.series.title, position: book.series.position } : null,
    authors: book.authors,
    illustrators: book.illustrators,
    translators: book.translators,
    topics: book.topics,
    interests: book.interests,
    instagram: book.instagram,
    autoTag: true,
  }
}

async function main() {
  const { taxonomy, books, achievements, organizations, discoveryModes } = loadAllContent()

  const blocking = checkContentConsistency(books, taxonomy, discoveryModes).filter(
    (issue) => issue.level === 'error',
  )
  if (blocking.length > 0) {
    console.error('❌ İçerikte hata var, tohumlama durduruldu:')
    for (const issue of blocking) console.error(`  • ${issue.message}`)
    process.exit(1)
  }

  const client = new Client({
    connectionString,
    // Supabase bağlantıları TLS ister; yerel Docker istemez.
    ssl: connectionString.includes('supabase.') ? { rejectUnauthorized: false } : undefined,
  })
  await client.connect()

  const added = { areas: 0, topics: 0, interests: 0, modes: 0, books: 0 }

  try {
    await client.query('begin')

    // ─── Taksonomi: yalnızca eksikler ─────────────────────────────────────
    for (const area of taxonomy.developmentAreas) {
      const result = await client.query(
        `insert into development_areas (slug, name, description, emoji, color, position)
         values ($1, $2, $3, $4, $5, $6)
         on conflict (slug) do nothing`,
        [area.slug, area.name, area.description, area.emoji, area.color, area.position],
      )
      added.areas += result.rowCount ?? 0

      for (const topic of area.topics) {
        const topicResult = await client.query(
          `insert into development_topics (area_id, slug, name, label, description, keywords, position)
           select id, $2, $3, $4, $5, $6, $7 from development_areas where slug = $1
           on conflict (slug) do nothing`,
          [
            area.slug,
            topic.slug,
            topic.name,
            topic.label,
            topic.description,
            topic.keywords,
            topic.position,
          ],
        )
        added.topics += topicResult.rowCount ?? 0
      }
    }

    for (const interest of taxonomy.interests) {
      const result = await client.query(
        `insert into interests (slug, name, emoji, keywords, position)
         values ($1, $2, $3, $4, $5)
         on conflict (slug) do nothing`,
        [interest.slug, interest.name, interest.emoji, interest.keywords, interest.position],
      )
      added.interests += result.rowCount ?? 0
    }

    // ─── Keşif modları: yalnızca eksikler ─────────────────────────────────
    // Eğilimler yalnızca yeni eklenen modlara yazılıyor; var olan bir modun
    // ağırlıkları panelde ayarlanmış olabilir.
    for (const mode of discoveryModes) {
      const { rows } = await client.query<{ id: string }>(
        `insert into discovery_modes
           (slug, name, emoji, description, prompt_hint, language, position, is_active)
         values ($1, $2, $3, $4, $5, $6, $7, $8)
         on conflict (slug) do nothing
         returning id`,
        [
          mode.slug,
          mode.name,
          mode.emoji,
          mode.description,
          mode.promptHint,
          mode.language,
          mode.position,
          mode.isActive,
        ],
      )
      const modeId = rows[0]?.id
      if (!modeId) continue
      added.modes += 1

      for (const topic of mode.topics) {
        await client.query(
          `insert into discovery_mode_topics (mode_id, topic_id, weight)
           select $1, id, $3 from development_topics where slug = $2`,
          [modeId, topic.slug, topic.weight],
        )
      }
      for (const interest of mode.interests) {
        await client.query(
          `insert into discovery_mode_interests (mode_id, interest_id, weight)
           select $1, id, $3 from interests where slug = $2`,
          [modeId, interest.slug, interest.weight],
        )
      }
    }

    // ─── Başarımlar ve kurumlar: dosya hâlâ kaynak, güncellenir ───────────
    for (const achievement of achievements) {
      await client.query(
        `insert into achievements (slug, name, description, emoji, criteria, points, position)
         values ($1, $2, $3, $4, $5, $6, $7)
         on conflict (slug) do update set
           name = excluded.name, description = excluded.description, emoji = excluded.emoji,
           criteria = excluded.criteria, points = excluded.points, position = excluded.position`,
        [
          achievement.slug,
          achievement.name,
          achievement.description,
          achievement.emoji,
          JSON.stringify(achievement.criteria),
          achievement.points,
          achievement.position,
        ],
      )
    }

    for (const organization of organizations) {
      await client.query(
        `insert into donation_organizations (slug, name, description, website, is_active, position)
         values ($1, $2, $3, $4, $5, $6)
         on conflict (slug) do update set
           name = excluded.name, description = excluded.description, website = excluded.website,
           is_active = excluded.is_active, position = excluded.position`,
        [
          organization.slug,
          organization.name,
          organization.description,
          organization.website,
          organization.isActive,
          organization.position,
        ],
      )
    }

    // ─── Kitaplar: yönetim paneliyle AYNI yol, üzerine yazmadan ───────────
    for (const book of books) {
      const { rows } = await client.query<{ result: { status: string } }>(
        'select public.upsert_book($1::jsonb, false) as result',
        [JSON.stringify(toPayload(book))],
      )
      if (rows[0]?.result.status === 'created') added.books += 1
    }

    await client.query('commit')

    const { rows: counts } = await client.query<{ table_name: string; total: string }>(`
      select 'books' as table_name, count(*)::text as total from books
      union all select 'book_topics', count(*)::text from book_topics
      union all select 'book_interests', count(*)::text from book_interests
      union all select 'development_topics', count(*)::text from development_topics
      union all select 'discovery_modes', count(*)::text from discovery_modes
      union all select 'achievements', count(*)::text from achievements
      order by 1
    `)

    console.log('\n✅ Tohumlama tamam — eklenen (var olanlara dokunulmadı):')
    console.log(
      `   ${added.books} kitap · ${added.areas} alan · ${added.topics} konu · ` +
        `${added.interests} ilgi alanı · ${added.modes} keşif modu`,
    )
    console.log('\n   Toplam:')
    for (const row of counts) {
      console.log(`   ${row.table_name.padEnd(20)} ${row.total}`)
    }
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    await client.end()
  }
}

main().catch((error: unknown) => {
  console.error('❌ Tohumlama başarısız:', error instanceof Error ? error.message : error)
  process.exit(1)
})
