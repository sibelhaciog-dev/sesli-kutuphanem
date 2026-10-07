import { describe, expect, it } from 'vitest'
import { buildEmailTemplates, GREETING } from './templates'

const templates = buildEmailTemplates({ siteName: 'Deneme <Adı>', tagline: 'Kısa tanım' })

describe('buildEmailTemplates', () => {
  it('dört şablon üretir', () => {
    expect(templates.map((template) => template.key)).toEqual([
      'confirmation',
      'recovery',
      'email_change',
      'password_changed',
    ])
  })

  it('uygulama adını konuda ve gövdede kullanır, HTML olarak kaçırır', () => {
    for (const template of templates) {
      expect(template.subject).toContain('Deneme <Adı>')
      expect(template.html).toContain('Deneme &lt;Adı&gt;')
      expect(template.html).not.toContain('Deneme <Adı>')
    }
  })

  it('her şablonda "Merhaba <ad>," hitabı var', () => {
    for (const template of templates) expect(template.html).toContain(GREETING)
  })

  it('bağlantı gereken şablonlarda Supabase onay adresi var', () => {
    for (const template of templates.filter((t) => t.key !== 'password_changed')) {
      expect(template.html).toContain('{{ .ConfirmationURL }}')
    }
  })

  it('Go şablon blokları dengeli (if/end sayısı eşit)', () => {
    for (const template of templates) {
      const opens = template.html.match(/\{\{\s*if\b/g)?.length ?? 0
      const ends = template.html.match(/\{\{\s*end\s*\}\}/g)?.length ?? 0
      expect(opens).toBe(ends)
    }
  })
})
