/**
 * Supabase kimlik doğrulama e-postalarının şablonları (kayıt onayı, şifre
 * sıfırlama, e-posta değişikliği, şifre değişti bildirimi).
 *
 * Supabase şablonları sabit HTML; uygulamanın adını çalışırken okuyamıyor.
 * Bu yüzden şablonlar buradan, `SITE_NAME` ile ÜRETİLİYOR:
 * `npm run email:sablon` → `supabase/templates/*.html`. Ad değişince komutu
 * yeniden çalıştırıp çıkan HTML'i Supabase paneline yapıştırmak yeterli
 * (docs/operations.md §13).
 *
 * `{{ … }}` kısımları Supabase'in (Go) şablon dili; gönderim anında doldurulur.
 * E-posta programları dış CSS ve çoğu modern özelliği desteklemediği için
 * düzen tablolarla, stiller satır içinde. Resim yok: birçok program resimleri
 * varsayılan olarak engelliyor, logo yazı + emoji.
 */

export interface EmailBrand {
  siteName: string
  tagline: string
}

export interface EmailTemplate {
  /** Supabase'deki adı (config.toml ve panel). */
  key: 'confirmation' | 'recovery' | 'email_change' | 'password_changed'
  /** Panelde şablonun bulunduğu başlık — yapıştırırken yol gösterir. */
  panelName: string
  subject: string
  html: string
}

const COLORS = {
  cream: '#faf8f4',
  ink: '#1c1c1e',
  inkSoft: '#3a3a3c',
  muted: '#8e8e93',
  line: '#e5e5ea',
  accent: '#eab23a',
  accentInk: '#8a5f00',
}

const FONT = "'Poppins', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

/**
 * "Merhaba Sibel," — kayıtta saklanan ilk ad; eski hesaplarda yalnızca tam ad
 * var, o da yoksa yalnızca "Merhaba,".
 */
export const GREETING =
  '{{ if .Data.first_name }}Merhaba {{ .Data.first_name }},' +
  '{{ else if .Data.full_name }}Merhaba {{ .Data.full_name }},' +
  '{{ else }}Merhaba,{{ end }}'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function button(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px">
  <tr>
    <td style="border-radius:999px;background:${COLORS.accent}">
      <a href="${href}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:${FONT};font-size:15px;font-weight:700;color:${COLORS.ink};text-decoration:none;border-radius:999px">${label}</a>
    </td>
  </tr>
</table>`
}

function paragraph(html: string, style = ''): string {
  return `<p style="margin:0 0 14px;font-family:${FONT};font-size:15px;line-height:1.6;color:${COLORS.inkSoft};${style}">${html}</p>`
}

/** Butona basamayanlar için düz bağlantı. */
function fallbackLink(href: string): string {
  return paragraph(
    `Düğme çalışmazsa bu bağlantıyı tarayıcına yapıştır:<br><a href="${href}" style="color:${COLORS.accentInk};word-break:break-all">${href}</a>`,
    `font-size:12px;color:${COLORS.muted}`,
  )
}

function layout(brand: EmailBrand, options: { preheader: string; body: string; footer: string }) {
  const name = escapeHtml(brand.siteName)
  return `<!doctype html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${name}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.cream}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(options.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.cream}">
  <tr>
    <td align="center" style="padding:32px 16px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px">
        <tr>
          <td style="padding:0 4px 18px">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td style="width:40px;height:40px;border-radius:12px;background:${COLORS.accent};text-align:center;font-size:20px;line-height:40px">📚</td>
                <td style="padding-left:12px;font-family:${FONT}">
                  <div style="font-size:17px;font-weight:700;color:${COLORS.ink};line-height:1.2">${name}</div>
                  <div style="font-size:12px;color:${COLORS.muted}">${escapeHtml(brand.tagline)}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="background:#ffffff;border:1px solid ${COLORS.line};border-radius:20px;padding:32px 28px">
            ${options.body}
          </td>
        </tr>
        <tr>
          <td style="padding:18px 8px 0;font-family:${FONT};font-size:12px;line-height:1.6;color:${COLORS.muted};text-align:center">
            ${options.footer}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>
`
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-family:${FONT};font-size:22px;font-weight:700;line-height:1.3;color:${COLORS.ink}">${text}</h1>`
}

function greeting(): string {
  return paragraph(GREETING, `color:${COLORS.ink};font-weight:600`)
}

export function buildEmailTemplates(brand: EmailBrand): EmailTemplate[] {
  const name = escapeHtml(brand.siteName)
  const notYou =
    'Bu isteği sen yapmadıysan bu e-postayı yok sayabilirsin; hesabında bir şey değişmez.'

  return [
    {
      key: 'confirmation',
      panelName: 'Confirm signup',
      subject: `Hesabını onayla · ${brand.siteName}`,
      html: layout(brand, {
        preheader: 'Hesabını onaylamak için tek bir adım kaldı.',
        body: [
          heading('Aramıza hoş geldin!'),
          greeting(),
          paragraph(
            `${name} hesabını oluşturduğun için teşekkürler. Çocuğunun yaşına ve ilgi alanlarına uygun kitapları keşfetmeye başlamadan önce e-posta adresini onaylaman gerekiyor.`,
          ),
          button('Hesabımı onayla', '{{ .ConfirmationURL }}'),
          fallbackLink('{{ .ConfirmationURL }}'),
        ].join('\n'),
        footer: `Bu e-postayı ${name} hesabı oluşturulduğu için aldın. Kaydı sen yapmadıysan bu e-postayı yok sayabilirsin.`,
      }),
    },
    {
      key: 'recovery',
      panelName: 'Reset password',
      subject: `Şifreni yenile · ${brand.siteName}`,
      html: layout(brand, {
        preheader: 'Şifreni yenilemek için bağlantı.',
        body: [
          heading('Şifreni yenile'),
          greeting(),
          paragraph(
            'Şifreni yenilemek için bir istek aldık. Aşağıdaki düğmeye basarak yeni şifreni belirleyebilirsin. Bağlantı kısa bir süre geçerli ve yalnızca bir kez kullanılabilir.',
          ),
          button('Yeni şifre belirle', '{{ .ConfirmationURL }}'),
          fallbackLink('{{ .ConfirmationURL }}'),
        ].join('\n'),
        footer: notYou,
      }),
    },
    {
      key: 'email_change',
      panelName: 'Change email address',
      subject: `Yeni e-posta adresini onayla · ${brand.siteName}`,
      html: layout(brand, {
        preheader: 'Yeni e-posta adresini onayla.',
        body: [
          heading('Yeni e-posta adresini onayla'),
          greeting(),
          paragraph(
            'E-posta adresini {{ .Email }} yerine <strong>{{ .NewEmail }}</strong> olarak değiştirmek istedin. Değişikliği tamamlamak için aşağıdaki düğmeye bas.',
          ),
          button('Yeni adresimi onayla', '{{ .ConfirmationURL }}'),
          fallbackLink('{{ .ConfirmationURL }}'),
        ].join('\n'),
        footer: notYou,
      }),
    },
    {
      key: 'password_changed',
      panelName: 'Password changed (güvenlik bildirimi)',
      subject: `Şifren değiştirildi · ${brand.siteName}`,
      html: layout(brand, {
        preheader: 'Hesabının şifresi değiştirildi.',
        body: [
          heading('Şifren değiştirildi'),
          greeting(),
          paragraph(
            `${name} hesabının ({{ .Email }}) şifresi az önce değiştirildi. Bunu sen yaptıysan başka bir şey yapmana gerek yok.`,
          ),
          paragraph(
            'Bu değişikliği sen yapmadıysan giriş sayfasındaki <strong>“Şifremi unuttum”</strong> bağlantısıyla hemen yeni bir şifre belirle.',
          ),
        ].join('\n'),
        footer: `Bu e-posta ${name} hesabının güvenliği için gönderildi.`,
      }),
    },
  ]
}
