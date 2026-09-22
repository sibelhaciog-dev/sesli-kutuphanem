'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { deleteBookAction, saveBookAction } from '@/app/yonetim/actions'
import { CoverUpload } from '@/components/admin/CoverUpload'
import { WeightPicker } from '@/components/admin/WeightPicker'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/Chip'
import { FormMessage, SelectField, TextAreaField, TextField } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import type { AdminBook } from '@/lib/data/admin'
import type { AreaView, InterestView } from '@/lib/data/types'
import { slugify } from '@/lib/slug'

interface BookFormProps {
  /** Düzenlenen kitap; `null` ise yeni kitap. */
  book: AdminBook | null
  areas: AreaView[]
  interests: InterestView[]
  /** Yeni eklenmiş kitaba yönlendirildiyse kapak bölümü öne çıkıyor. */
  justCreated?: boolean
}

const SUMMARY_MAX = 1000

function initialValues(book: AdminBook | null) {
  return {
    title: book?.title ?? '',
    subtitle: book?.subtitle ?? '',
    originalTitle: book?.originalTitle ?? '',
    slug: book?.slug ?? '',
    summary: book?.summary ?? '',
    description: book?.description ?? '',
    language: book?.language ?? 'tr',
    status: book?.status ?? 'published',
    ageMin: book?.ageMin?.toString() ?? '',
    ageMax: book?.ageMax?.toString() ?? '',
    pageCount: book?.pageCount?.toString() ?? '',
    publishedYear: book?.publishedYear?.toString() ?? '',
    isbn13: book?.isbn13 ?? '',
    publisher: book?.publisher ?? '',
    seriesTitle: book?.series?.title ?? '',
    seriesPosition: book?.series?.position?.toString() ?? '',
    authors: book?.authors.join(', ') ?? '',
    illustrators: book?.illustrators.join(', ') ?? '',
    translators: book?.translators.join(', ') ?? '',
    instagramUrl: book?.instagram?.url ?? '',
    instagramPostedAt: book?.instagram?.postedAt ?? '',
    likeCount: book?.instagram?.likeCount?.toString() ?? '',
  }
}

type Values = ReturnType<typeof initialValues>

/** Boş → undefined, sayı değilse NaN (şema Türkçe mesajla reddediyor). */
function optionalNumber(value: string): number | undefined {
  return value.trim() === '' ? undefined : Number(value)
}

/**
 * Kitap ekleme ve düzenleme — tüm alanlar (ADR 0008).
 *
 * Kayıt `upsert_book()` üzerinden gidiyor; `npm run book:add` betiğiyle aynı
 * yol ve aynı doğrulama (`src/lib/books/input.ts`).
 */
export function BookForm({ book, areas, interests, justCreated = false }: BookFormProps) {
  const router = useRouter()
  const toast = useToast()
  const [values, setValues] = useState<Values>(() => initialValues(book))
  const [slugTouched, setSlugTouched] = useState(Boolean(book))
  const [topics, setTopics] = useState<Record<string, number>>(() =>
    Object.fromEntries((book?.topics ?? []).map((topic) => [topic.slug, topic.relevance])),
  )
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    () => book?.interests.map((interest) => interest.slug) ?? [],
  )
  // Düzenlemede kapalı: editör konuları elle seçtiyse, kaldırdığı otomatik
  // konu kayıtta geri gelmesin.
  const [autoTag, setAutoTag] = useState(!book)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const autoBadges = useMemo(
    () =>
      Object.fromEntries(
        [...(book?.topics ?? []), ...(book?.interests ?? [])]
          .filter((entry) => entry.source === 'auto')
          .map((entry) => [entry.slug, 'otomatik']),
      ),
    [book],
  )

  const topicGroups = areas
    .filter((area) => area.topics.length > 0)
    .map((area) => ({
      key: area.slug,
      label: area.name,
      emoji: area.emoji,
      items: area.topics.map((topic) => ({ slug: topic.slug, name: topic.label ?? topic.name })),
    }))

  const slug = slugTouched ? values.slug : slugify(values.title)

  function patch(next: Partial<Values>) {
    setValues((current) => ({ ...current, ...next }))
  }

  function field(name: keyof Values) {
    return {
      value: values[name],
      onChange: (event: { target: { value: string } }) => patch({ [name]: event.target.value }),
      error: errors[name],
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setFormError('')
    setErrors({})

    const raw = {
      title: values.title,
      slug: book ? undefined : slug,
      subtitle: values.subtitle,
      originalTitle: values.originalTitle,
      summary: values.summary,
      description: values.description,
      language: values.language,
      status: values.status,
      ageMin: values.ageMin,
      ageMax: values.ageMax,
      pageCount: values.pageCount,
      publishedYear: values.publishedYear,
      isbn13: values.isbn13,
      publisher: values.publisher,
      series: values.seriesTitle.trim()
        ? { title: values.seriesTitle, position: optionalNumber(values.seriesPosition) }
        : null,
      authors: values.authors,
      illustrators: values.illustrators,
      translators: values.translators,
      topics: Object.entries(topics).map(([topicSlug, relevance]) => ({
        slug: topicSlug,
        relevance,
      })),
      interests: selectedInterests,
      instagram: values.instagramUrl.trim()
        ? {
            url: values.instagramUrl,
            postedAt: values.instagramPostedAt || undefined,
            likeCount: optionalNumber(values.likeCount),
          }
        : null,
      autoTag,
    }

    setBusy(true)
    const result = await saveBookAction(book?.id ?? null, raw)
    setBusy(false)

    if (!result.ok) {
      setFormError(result.error)
      setErrors(
        Object.fromEntries(
          Object.entries(result.fieldErrors ?? {}).map(([key, message]) => [
            // Şema yolları → form alanları
            key === 'series.title'
              ? 'seriesTitle'
              : key === 'series.position'
                ? 'seriesPosition'
                : key === 'instagram.url'
                  ? 'instagramUrl'
                  : key === 'instagram.postedAt'
                    ? 'instagramPostedAt'
                    : key === 'instagram.likeCount'
                      ? 'likeCount'
                      : key,
            message,
          ]),
        ),
      )
      return
    }

    if (!book) {
      router.push(`/yonetim/kitaplar/${result.data.id}?yeni=1`)
      return
    }
    toast.show('Kitap kaydedildi.')
    router.refresh()
  }

  async function remove() {
    if (!book) return
    setBusy(true)
    const result = await deleteBookAction(book.id)
    setBusy(false)
    if (!result.ok) {
      setFormError(result.error)
      setConfirmDelete(false)
      return
    }
    toast.show('Taslak kitap silindi.')
    router.push('/yonetim/kitaplar')
  }

  return (
    <form onSubmit={(event) => void submit(event)} noValidate>
      {book && (
        <Section
          title="Kapak"
          description={
            justCreated
              ? 'Kitap eklendi. Şimdi kapağını yükleyebilirsiniz.'
              : 'Kapak ayrı kaydedilir; yüklediğiniz an sitede görünür.'
          }
          highlight={justCreated}
        >
          <CoverUpload bookId={book.id} title={values.title || book.title} initial={book.cover} />
        </Section>
      )}

      <Section title="Temel bilgiler">
        <TextField label="Kitap adı *" {...field('title')} maxLength={200} required />
        <div className="grid gap-x-4 sm:grid-cols-2">
          <TextField label="Alt başlık" {...field('subtitle')} maxLength={200} />
          <TextField
            label="Özgün adı"
            hint="Çeviri kitaplarda orijinal ad"
            {...field('originalTitle')}
            maxLength={200}
          />
        </div>
        {book ? (
          <p className="mb-3.5 text-xs text-muted">
            Adres: <code className="rounded bg-cream px-1">/kitap/{book.slug}</code> — bağlantılar
            kırılmasın diye adres sonradan değişmez.
          </p>
        ) : (
          <TextField
            label="Adres"
            hint={`Sitede /kitap/${slug || '…'} olarak görünecek. Addan otomatik üretilir.`}
            value={slug}
            onChange={(event) => {
              setSlugTouched(true)
              patch({ slug: event.target.value })
            }}
            error={errors.slug}
          />
        )}
        <div className="grid gap-x-4 sm:grid-cols-2">
          <SelectField
            label="Dil"
            value={values.language}
            onChange={(event) => patch({ language: event.target.value as Values['language'] })}
          >
            <option value="tr">Türkçe</option>
            <option value="en">İngilizce</option>
          </SelectField>
          <SelectField
            label="Durum"
            hint="Taslak ve arşivdeki kitaplar sitede görünmez."
            value={values.status}
            onChange={(event) => patch({ status: event.target.value as Values['status'] })}
          >
            <option value="published">Yayında</option>
            <option value="draft">Taslak</option>
            <option value="archived">Arşiv</option>
          </SelectField>
        </div>
      </Section>

      <Section title="Tanıtım">
        <TextAreaField
          label="Kısa özet"
          hint={`Kitap kartında ve arama sonuçlarında görünür · ${values.summary.length}/${SUMMARY_MAX}`}
          rows={3}
          maxLength={SUMMARY_MAX}
          {...field('summary')}
        />
        <TextAreaField
          label="Açıklama"
          hint="İsteğe bağlı uzun tanıtım; kitap sayfasında özetin altında görünür."
          rows={5}
          maxLength={5000}
          {...field('description')}
        />
      </Section>

      <Section title="Yaş ve künye">
        <div className="grid grid-cols-2 gap-x-4 sm:grid-cols-4">
          <TextField label="En küçük yaş" type="number" min={0} max={18} {...field('ageMin')} />
          <TextField label="En büyük yaş" type="number" min={0} max={18} {...field('ageMax')} />
          <TextField label="Sayfa sayısı" type="number" min={1} {...field('pageCount')} />
          <TextField label="Basım yılı" type="number" min={1800} {...field('publishedYear')} />
        </div>
        <div className="grid gap-x-4 sm:grid-cols-2">
          <TextField label="ISBN" hint="13 hane; tire olabilir" {...field('isbn13')} />
          <TextField label="Yayınevi" {...field('publisher')} maxLength={120} />
        </div>
        <div className="grid grid-cols-[1fr_7rem] gap-x-4">
          <TextField
            label="Seri"
            hint="Kitap bir dizinin parçasıysa"
            {...field('seriesTitle')}
            maxLength={200}
          />
          <TextField label="Kaçıncı kitap" type="number" min={1} {...field('seriesPosition')} />
        </div>
      </Section>

      <Section title="Kişiler" description="Birden fazla kişi varsa virgülle ayırın.">
        <TextField label="Yazar" {...field('authors')} />
        <div className="grid gap-x-4 sm:grid-cols-2">
          <TextField label="Çizer" {...field('illustrators')} />
          <TextField label="Çevirmen" {...field('translators')} />
        </div>
      </Section>

      <Section
        title="Gelişim konuları"
        description="Kitabın hangi konulara değindiğini seçin. Önem 5: kitabın ana konusu, 1: kıyısından geçiyor. Rehber menüsü ve öneriler bu seçime göre çalışır."
      >
        <FormMessage tone="error">{errors.topics ?? ''}</FormMessage>
        <WeightPicker
          groups={topicGroups}
          value={topics}
          onChange={setTopics}
          weightLabel="önemi"
          badges={autoBadges}
        />
        <label className="mt-4 flex items-start gap-2.5 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={autoTag}
            onChange={(event) => setAutoTag(event.target.checked)}
            className="mt-0.5 size-4 accent-accent"
          />
          <span>
            Başlık ve özetteki anahtar kelimelerden eksik konuları otomatik ekle
            <span className="block text-xs text-muted">
              {book
                ? 'Kapalıyken yalnızca yukarıda seçtikleriniz kaydedilir. "otomatik" işaretliler daha önce anahtar kelimeden eklenmişti; kaydedince sizin seçiminiz sayılır.'
                : 'Seçmeyi unuttuğunuz konular anahtar kelimelerden yakalanır (önem 2).'}
            </span>
          </span>
        </label>
      </Section>

      <Section title="İlgi alanları" description="Çocuk profilindeki ilgi alanlarıyla eşleşir.">
        <FormMessage tone="error">{errors.interests ?? ''}</FormMessage>
        <div className="flex flex-wrap gap-2">
          {interests.map((interest) => {
            const active = selectedInterests.includes(interest.slug)
            return (
              <Chip
                key={interest.slug}
                active={active}
                onClick={() =>
                  setSelectedInterests((current) =>
                    active
                      ? current.filter((slugValue) => slugValue !== interest.slug)
                      : [...current, interest.slug],
                  )
                }
              >
                {interest.emoji} {interest.name}
                {autoBadges[interest.slug] ? ' · otomatik' : ''}
              </Chip>
            )
          })}
        </div>
      </Section>

      <Section title="Instagram" description="Kitabın sesli.kutuphanem hesabındaki tanıtımı.">
        <TextField
          label="Gönderi adresi"
          placeholder="https://www.instagram.com/p/…"
          type="url"
          {...field('instagramUrl')}
        />
        <div className="grid grid-cols-2 gap-x-4">
          <TextField label="Paylaşım tarihi" type="date" {...field('instagramPostedAt')} />
          <TextField label="Beğeni sayısı" type="number" min={0} {...field('likeCount')} />
        </div>
      </Section>

      <div className="sticky bottom-0 z-10 -mx-4 border-t border-line bg-white/95 px-4 py-3 backdrop-blur">
        <FormMessage tone="error">{formError}</FormMessage>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="submit" disabled={busy}>
            {busy ? 'Kaydediliyor…' : book ? 'Kaydet' : 'Kitabı ekle'}
          </Button>
          <Link href="/yonetim/kitaplar" className="px-3 text-sm text-muted hover:text-accent">
            Listeye dön
          </Link>
          {book?.status === 'published' && (
            <a
              href={`/kitap/${book.slug}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 text-sm text-muted hover:text-accent"
            >
              Sitede gör ↗
            </a>
          )}
          {book?.status === 'draft' && (
            <span className="ml-auto flex items-center gap-2">
              {confirmDelete ? (
                <>
                  <span className="text-xs text-danger">Kalıcı olarak silinsin mi?</span>
                  <Button variant="danger" size="sm" onClick={() => void remove()} disabled={busy}>
                    Evet, sil
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                    Vazgeç
                  </Button>
                </>
              ) : (
                <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
                  Taslağı sil
                </Button>
              )}
            </span>
          )}
        </div>
      </div>
    </form>
  )
}

function Section({
  title,
  description,
  highlight = false,
  children,
}: {
  title: string
  description?: string
  highlight?: boolean
  children: ReactNode
}) {
  return (
    <section
      className={`mb-5 rounded-panel border bg-white p-5 ${
        highlight ? 'border-accent ring-4 ring-accent-soft' : 'border-line'
      }`}
    >
      <h2 className="text-base text-ink">{title}</h2>
      {description && <p className="mt-1 text-xs leading-relaxed text-muted">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}
