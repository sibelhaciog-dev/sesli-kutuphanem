/**
 * Supabase e-posta şablonlarını uygulama adıyla üretir.
 *
 *   npm run email:sablon
 *
 * Çıktı: supabase/templates/*.html (yerel Supabase bunları config.toml
 * üzerinden kullanır). Canlı proje için her dosyanın içeriğini Supabase
 * panelinde Authentication → Email Templates'e yapıştırın; konu satırları
 * aşağıda yazdırılır (docs/operations.md §13).
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildEmailTemplates } from '../src/lib/email/templates'
import { SITE_NAME, SITE_TAGLINE } from '../src/lib/site'

const root = join(import.meta.dirname, '..')
const dir = join(root, 'supabase', 'templates')
mkdirSync(dir, { recursive: true })

const templates = buildEmailTemplates({ siteName: SITE_NAME, tagline: SITE_TAGLINE })
for (const template of templates) {
  writeFileSync(join(dir, `${template.key}.html`), template.html)
}

// config.toml'daki işaretli bloğu yeniden yaz (yerel Supabase için).
const configPath = join(root, 'supabase', 'config.toml')
const START = '# >>> e-posta şablonları (npm run email:sablon üretir, elle düzenlemeyin)'
const END = '# <<< e-posta şablonları'
const block = [
  START,
  ...templates.map((template) => {
    const section =
      template.key === 'password_changed'
        ? `[auth.email.notification.${template.key}]\nenabled = true`
        : `[auth.email.template.${template.key}]`
    return `${section}\nsubject = ${JSON.stringify(template.subject)}\ncontent_path = "./supabase/templates/${template.key}.html"\n`
  }),
  END,
].join('\n')

const config = readFileSync(configPath, 'utf8')
const pattern = new RegExp(`${START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${END}`)
const anchor = '[auth.sms]'
const next = pattern.test(config)
  ? config.replace(pattern, block)
  : config.replace(anchor, `${block}\n\n${anchor}`)
if (!next.includes(START)) throw new Error('config.toml içinde [auth.sms] bulunamadı')
writeFileSync(configPath, next)

console.log(`\n✓ ${templates.length} şablon üretildi (${SITE_NAME}) → supabase/templates/\n`)
console.log('Supabase paneli → Authentication → Email Templates:\n')
for (const template of templates) {
  console.log(`  ${template.panelName}`)
  console.log(`    Konu:   ${template.subject}`)
  console.log(`    İçerik: supabase/templates/${template.key}.html\n`)
}
