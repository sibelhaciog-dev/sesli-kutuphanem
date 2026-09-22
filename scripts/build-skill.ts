/**
 * Claude in Chrome için Instagram aktarım skill'ini paketler.
 *
 *   npm run skill:paket
 *
 * 1. Veritabanındaki güncel rehberleri ve ilgi alanlarını
 *    `skills/sesli-kutuphanem-instagram/taksonomi.md` dosyasına yazar — skill
 *    konu seçerken bu listeyi kullanıyor. Rehberler yönetimden
 *    düzenlendiği için liste değişince paketi yeniden üretip yükleyin.
 * 2. Klasörü `skills/dist/sesli-kutuphanem-instagram.zip` olarak sıkıştırır.
 *
 * Yükleme: claude.ai → Settings → Capabilities → Skills → Upload skill →
 * bu zip. Claude in Chrome yan paneli hesabın skill'lerini kullanıyor.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Client } from 'pg'
import { loadEnvFiles } from './lib/env'

loadEnvFiles()

const NAME = 'sesli-kutuphanem-instagram'
const SKILLS_DIR = resolve(process.cwd(), 'skills')
const OUT = resolve(SKILLS_DIR, 'dist', `${NAME}.zip`)

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error(
    'DATABASE_URL tanımlı değil. `.env.local` dosyasına ekleyin (bkz. docs/operations.md).',
  )
  process.exit(1)
}

/** `\yay\y` → `ay (tam kelime)`; okuyan model için düzenli ifade gürültüsünü at. */
function readableKeyword(keyword: string): string {
  const whole = /^\\y(.+)\\y$/.exec(keyword)
  return whole ? `${whole[1]} (tam kelime)` : keyword.replaceAll('\\y', '')
}

async function main() {
  const client = new Client({
    connectionString,
    ssl: connectionString!.includes('supabase.') ? { rejectUnauthorized: false } : undefined,
  })
  await client.connect()

  let topics: Array<{
    area: string
    emoji: string
    slug: string
    name: string
    label: string | null
    description: string | null
    keywords: string[]
  }>
  let interests: Array<{ slug: string; name: string; emoji: string; keywords: string[] }>
  try {
    ;({ rows: topics } = await client.query(
      `select a.name as area, a.emoji, t.slug, t.name, t.label, t.description, t.keywords
       from development_topics t join development_areas a on a.id = t.area_id
       order by a.position, a.slug, t.position, t.slug`,
    ))
    ;({ rows: interests } = await client.query(
      'select slug, name, emoji, keywords from interests order by position, slug',
    ))
  } finally {
    await client.end()
  }

  const lines = [
    '# Sesli Kütüphanem — konu ve ilgi adresleri',
    '',
    `> OTOMATİK ÜRETİLDİ (${new Date().toISOString().slice(0, 10)}, \`npm run skill:paket\`).`,
    '> Kaynak: sitenin veritabanı. Rehberler yönetim panelinden değişince yeniden üretilir.',
    '',
    "JSON'da yalnızca **adres** (ters tırnak içindeki) kullanılır. Anahtar kelimeler",
    'konuyu tanımana yardım eder; kitabın açıklamasında geçmeleri şart değil.',
    '',
    '## Gelişim konuları → `topics[].slug`',
  ]
  let area = ''
  for (const topic of topics) {
    if (topic.area !== area) {
      area = topic.area
      lines.push('', `### ${topic.emoji} ${area}`, '')
    }
    const name =
      topic.label && topic.label !== topic.name
        ? `${topic.name} (menüde: ${topic.label})`
        : topic.name
    const hints = [
      topic.description,
      topic.keywords.length > 0
        ? `anahtar: ${topic.keywords.map(readableKeyword).join(', ')}`
        : null,
    ].filter(Boolean)
    lines.push(`- \`${topic.slug}\` — ${name}${hints.length > 0 ? `. ${hints.join('. ')}` : ''}`)
  }

  lines.push('', '## İlgi alanları → `interests[]`', '')
  for (const interest of interests) {
    const hints =
      interest.keywords.length > 0
        ? ` — anahtar: ${interest.keywords.map(readableKeyword).join(', ')}`
        : ''
    lines.push(`- \`${interest.slug}\` — ${interest.emoji} ${interest.name}${hints}`)
  }
  lines.push('')

  writeFileSync(resolve(SKILLS_DIR, NAME, 'taksonomi.md'), lines.join('\n'))

  // Zip: klasörün kendisi kökte olmalı (claude.ai böyle bekliyor).
  mkdirSync(resolve(SKILLS_DIR, 'dist'), { recursive: true })
  rmSync(OUT, { force: true })
  execFileSync('zip', ['-r', '-X', '-q', OUT, NAME, '-x', '*.DS_Store'], { cwd: SKILLS_DIR })

  console.log(`✅ ${topics.length} konu · ${interests.length} ilgi alanı → ${NAME}/taksonomi.md`)
  console.log(`✅ Paket: skills/dist/${NAME}.zip`)
  console.log('\n   Yükleme: claude.ai → Settings → Capabilities → Skills → Upload skill')
  console.log('   (aynı adla eski sürüm varsa önce onu silin ya da güncelleyin)')
}

main().catch((error: unknown) => {
  console.error('❌ Paketleme başarısız:', error instanceof Error ? error.message : error)
  process.exit(1)
})
