/**
 * Veritabanındaki kataloğu `content/` dosyalarına yazar (ADR 0008).
 *
 *   npm run db:export
 *
 * ADR 0008'den beri doğru kaynak veritabanı; `content/` dosyaları onun
 * YEDEĞİ ve yeni ortamlar için tohumu (`npm run db:seed`). Bu betik yedeği
 * tazeler — ara sıra çalıştırıp commit'lemek hem git geçmişinde katalogun
 * izini tutar hem de yerel veritabanını üretime benzetir.
 *
 * Yazılan dosyalar: books.json, taxonomy.json, discovery-modes.json.
 * Başarımlar ve kurumlar panelden düzenlenmediği için dosya zaten kaynak.
 *
 * Yalnızca EDİTORYAL etiketler yazılır. Otomatik etiketler anahtar
 * kelimelerden türediği için tohumlamada yeniden hesaplanıyor.
 *
 * Her dosya yazılmadan önce içerik şemasından geçirilir; biri geçmezse hiçbir
 * dosya yazılmaz.
 */
import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Client } from 'pg'
import { format, resolveConfig } from 'prettier'
import { booksSchema, discoveryModesSchema, taxonomySchema } from '../src/lib/content/schema'
import { loadEnvFiles } from './lib/env'

loadEnvFiles()

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error(
    'DATABASE_URL tanımlı değil. `.env.local` dosyasına ekleyin (bkz. docs/operations.md).',
  )
  process.exit(1)
}

type Row = Record<string, unknown>

async function main() {
  const client = new Client({
    connectionString,
    ssl: connectionString!.includes('supabase.') ? { rejectUnauthorized: false } : undefined,
  })
  await client.connect()

  try {
    // ─── Taksonomi ────────────────────────────────────────────────────────
    const { rows: areas } = await client.query<Row>(
      `select id, slug, name, description, emoji, color, position
       from development_areas order by position, slug`,
    )
    const { rows: topics } = await client.query<Row>(
      `select area_id, slug, name, label, description, keywords, position
       from development_topics order by position, slug`,
    )
    const { rows: interests } = await client.query<Row>(
      `select slug, name, emoji, keywords, position from interests order by position, slug`,
    )

    const taxonomy = {
      developmentAreas: areas.map((area) => ({
        slug: area.slug,
        name: area.name,
        description: area.description,
        emoji: area.emoji,
        color: area.color,
        position: area.position,
        topics: topics
          .filter((topic) => topic.area_id === area.id)
          .map(({ area_id: _areaId, ...topic }) => topic),
      })),
      interests,
    }

    // ─── Keşif modları ────────────────────────────────────────────────────
    const { rows: modes } = await client.query<Row>(`
      select
        m.slug, m.name, m.emoji, m.description, m.prompt_hint as "promptHint",
        m.language, m.position, m.is_active as "isActive",
        coalesce((select jsonb_agg(jsonb_build_object('slug', t.slug, 'weight', mt.weight)
                                   order by mt.weight desc, t.slug)
                  from discovery_mode_topics mt join development_topics t on t.id = mt.topic_id
                  where mt.mode_id = m.id), '[]') as topics,
        coalesce((select jsonb_agg(jsonb_build_object('slug', i.slug, 'weight', mi.weight)
                                   order by mi.weight desc, i.slug)
                  from discovery_mode_interests mi join interests i on i.id = mi.interest_id
                  where mi.mode_id = m.id), '[]') as interests
      from discovery_modes m
      order by m.position, m.slug
    `)

    // ─── Kitaplar ─────────────────────────────────────────────────────────
    const { rows: books } = await client.query<Row>(`
      select
        b.slug, b.title, b.subtitle, b.original_title as "originalTitle",
        b.summary, b.description, b.language,
        b.age_min as "ageMin", b.age_max as "ageMax", b.page_count as "pageCount",
        b.isbn13, b.published_year as "publishedYear",
        pub.name as publisher,
        case when s.id is null then null else
          jsonb_build_object('slug', s.slug, 'title', s.title, 'position', b.series_position)
        end as series,
        coalesce((select array_agg(p.display_name order by bc.position)
                  from book_contributors bc join people p on p.id = bc.person_id
                  where bc.book_id = b.id and bc.role = 'author'), '{}') as authors,
        coalesce((select array_agg(p.display_name order by bc.position)
                  from book_contributors bc join people p on p.id = bc.person_id
                  where bc.book_id = b.id and bc.role = 'illustrator'), '{}') as illustrators,
        coalesce((select array_agg(p.display_name order by bc.position)
                  from book_contributors bc join people p on p.id = bc.person_id
                  where bc.book_id = b.id and bc.role = 'translator'), '{}') as translators,
        case when b.instagram_url is null then null else
          jsonb_build_object(
            'url', b.instagram_url,
            'shortcode', b.instagram_shortcode,
            'postedAt', to_char(b.posted_at, 'YYYY-MM-DD'),
            'likeCount', b.like_count)
        end as instagram,
        b.cover_path as "coverPath",
        b.status,
        coalesce((select jsonb_agg(jsonb_build_object('slug', t.slug, 'relevance', bt.relevance)
                                   order by bt.relevance desc, t.position)
                  from book_topics bt join development_topics t on t.id = bt.topic_id
                  where bt.book_id = b.id and bt.source = 'editorial'), '[]') as topics,
        coalesce((select array_agg(i.slug order by i.position)
                  from book_interests bi join interests i on i.id = bi.interest_id
                  where bi.book_id = b.id and bi.source = 'editorial'), '{}') as interests
      from books b
      left join publishers pub on pub.id = b.publisher_id
      left join series s on s.id = b.series_id
      order by b.posted_at desc nulls last, b.slug
    `)

    // ─── Doğrula, sonra yaz ───────────────────────────────────────────────
    const files = [
      { name: 'taxonomy.json', schema: taxonomySchema, data: taxonomy },
      { name: 'discovery-modes.json', schema: discoveryModesSchema, data: modes },
      { name: 'books.json', schema: booksSchema, data: books },
    ] as const

    const outputs: Array<{ path: string; text: string }> = []
    let failed = false
    for (const file of files) {
      const result = file.schema.safeParse(file.data)
      if (!result.success) {
        failed = true
        console.error(`❌ ${file.name} içerik şemasına uymuyor:`)
        for (const issue of result.error.issues.slice(0, 10)) {
          console.error(`   ${issue.path.join('.')}: ${issue.message}`)
        }
        continue
      }
      // Projenin Prettier ayarıyla biçimlenmeli; yoksa `format:check` düşer.
      const path = resolve(process.cwd(), 'content', file.name)
      const options = await resolveConfig(path)
      const text = await format(JSON.stringify(result.data), { ...options, filepath: path })
      outputs.push({ path, text })
    }
    if (failed) {
      console.error('\nHiçbir dosya yazılmadı.')
      process.exit(1)
    }

    for (const output of outputs) {
      writeFileSync(output.path, output.text)
    }

    console.log('✅ Dışa aktarıldı:')
    console.log(`   books.json            ${books.length} kitap`)
    console.log(
      `   taxonomy.json         ${areas.length} alan · ${topics.length} konu · ${interests.length} ilgi alanı`,
    )
    console.log(`   discovery-modes.json  ${modes.length} mod`)
    console.log('\n   Değişiklikleri görmek için: git diff content/')
  } finally {
    await client.end()
  }
}

main().catch((error: unknown) => {
  console.error('❌ Dışa aktarma başarısız:', error instanceof Error ? error.message : error)
  process.exit(1)
})
