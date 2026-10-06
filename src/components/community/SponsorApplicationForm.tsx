'use client'

import { useState, type FormEvent } from 'react'
import { useAppData } from '@/components/providers/AppDataProvider'
import { Button, ButtonLink } from '@/components/ui/Button'
import { FormMessage, SelectField, TextAreaField, TextField } from '@/components/ui/Field'
import { formatMonth } from '@/lib/dates'
import { fieldErrors } from '@/lib/admin/taxonomy-input'
import { toFriendlyError } from '@/lib/errors'
import { sponsorApplicationSchema } from '@/lib/sponsorship'
import { createClient } from '@/lib/supabase/client'

/**
 * "Kitabını paylaş" — yayınevi ya da yazarın "Ayın kitabı" sponsorluğu için
 * başvurusu. Ödeme sitede alınmıyor; ekip başvuruyu görüp iletişime geçiyor.
 */
export function SponsorApplicationForm({ months }: { months: string[] }) {
  const { userId, userEmail, isAuthenticated } = useAppData()
  const [values, setValues] = useState({
    contactName: '',
    contactEmail: userEmail ?? '',
    organization: '',
    bookTitle: '',
    bookLink: '',
    preferredMonth: '',
    message: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  const patch = (next: Partial<typeof values>) => setValues((current) => ({ ...current, ...next }))

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setErrors({})

    if (!userId) {
      setError('Başvuru göndermek için giriş yapmanız gerekiyor.')
      return
    }
    const parsed = sponsorApplicationSchema.safeParse(values)
    if (!parsed.success) {
      setError('Formda düzeltilmesi gereken alanlar var.')
      setErrors(fieldErrors(parsed.error))
      return
    }
    const input = parsed.data

    setBusy(true)
    const { error: insertError } = await createClient().from('sponsor_applications').insert({
      user_id: userId,
      contact_name: input.contactName,
      contact_email: input.contactEmail,
      organization: input.organization,
      book_title: input.bookTitle,
      book_link: input.bookLink,
      preferred_month: input.preferredMonth,
      message: input.message,
    })
    setBusy(false)

    if (insertError) {
      const friendly = toFriendlyError(insertError, 'Gönderilemedi. Tekrar deneyin.')
      setError(friendly.message)
      if (friendly.field) setErrors({ [friendly.field]: friendly.message })
      return
    }
    setDone(true)
  }

  if (done) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="mb-4 text-5xl" aria-hidden>
          📮
        </p>
        <h1 className="mb-2 text-3xl">Başvurunuz bize ulaştı</h1>
        <p className="mb-6 text-sm text-muted">
          En kısa sürede {values.contactEmail.trim()} adresinden size döneceğiz.
        </p>
        <ButtonLink href="/">Kitaplara dön</ButtonLink>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-3xl">🌟 Kitabını paylaş</h1>
      <p className="mb-2 text-sm leading-relaxed text-ink-soft">
        Yayınevi ya da yazar mısınız? Kitabınız bir ay boyunca ana sayfamızda{' '}
        <strong>“Ayın kitabı”</strong> olarak çocuklarına kitap arayan ailelere ulaşsın.
      </p>
      <p className="mb-6 text-xs leading-relaxed text-muted">
        Sponsorlu kitaplar vitrinde “Sponsorlu” etiketiyle gösterilir. Yalnızca çocuklar için uygun
        bulduğumuz kitapları yayınlıyoruz. Başvurunuzu inceledikten sonra koşulları konuşmak için
        size e-postayla ulaşıyoruz; bu formda ödeme alınmaz.
      </p>

      {!isAuthenticated && (
        <p className="mb-4 rounded-xl border border-line bg-white p-4 text-sm text-muted">
          Başvuru göndermek için{' '}
          <ButtonLink href="/giris?devam=/kitabini-paylas" size="sm">
            giriş yapın
          </ButtonLink>{' '}
          ya da{' '}
          <ButtonLink href="/kayit" size="sm" variant="secondary">
            ücretsiz hesap açın
          </ButtonLink>
          .
        </p>
      )}

      <form onSubmit={submit} className="rounded-panel border border-line bg-white p-5" noValidate>
        <FormMessage tone="error">{error}</FormMessage>

        <div className="grid gap-x-3 sm:grid-cols-2">
          <TextField
            label="Ad soyad *"
            autoComplete="name"
            value={values.contactName}
            onChange={(event) => patch({ contactName: event.target.value })}
            error={errors.contactName}
            maxLength={120}
          />
          <TextField
            label="E-posta *"
            type="email"
            autoComplete="email"
            value={values.contactEmail}
            onChange={(event) => patch({ contactEmail: event.target.value })}
            error={errors.contactEmail}
            maxLength={254}
          />
        </div>
        <TextField
          label="Yayınevi / kurum"
          autoComplete="organization"
          value={values.organization}
          onChange={(event) => patch({ organization: event.target.value })}
          error={errors.organization}
          maxLength={120}
        />
        <TextField
          label="Kitabın adı *"
          value={values.bookTitle}
          onChange={(event) => patch({ bookTitle: event.target.value })}
          error={errors.bookTitle}
          maxLength={200}
        />
        <TextField
          label="Kitap bağlantısı"
          hint="Yayınevi sayfası, satış sayfası ya da Instagram gönderisi."
          type="url"
          value={values.bookLink}
          onChange={(event) => patch({ bookLink: event.target.value })}
          error={errors.bookLink}
          placeholder="https://"
        />
        <SelectField
          label="Hangi ay?"
          value={values.preferredMonth}
          onChange={(event) => patch({ preferredMonth: event.target.value })}
          error={errors.preferredMonth}
        >
          <option value="">Fark etmez</option>
          {months.map((month) => (
            <option key={month} value={month}>
              {formatMonth(`${month}T12:00:00Z`)}
            </option>
          ))}
        </SelectField>
        <TextAreaField
          label="Mesajınız"
          hint="Kitabı kısaca tanıtın: hangi yaşa uygun, neyi anlatıyor?"
          rows={4}
          maxLength={2000}
          value={values.message}
          onChange={(event) => patch({ message: event.target.value })}
          error={errors.message}
        />

        <Button type="submit" size="lg" className="w-full" disabled={busy || !isAuthenticated}>
          {busy ? 'Gönderiliyor…' : 'Başvuruyu gönder'}
        </Button>
      </form>
    </div>
  )
}
