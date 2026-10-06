'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import {
  deleteFeaturedSlotAction,
  saveFeaturedSlotAction,
  setSponsorApplicationStatusAction,
} from '@/app/yonetim/actions'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { FormMessage, SelectField, TextAreaField, TextField } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/cn'
import type {
  AdminFeaturedSlot,
  AdminSponsorApplication,
  SponsorApplicationStatus,
} from '@/lib/data/featured'
import { formatMonth, formatShortDate } from '@/lib/dates'
import { monthRange, slotState } from '@/lib/sponsorship'

const STATE_LABELS = {
  active: { label: 'Şu an vitrinde', className: 'bg-accent text-ink' },
  upcoming: { label: 'Planlandı', className: 'bg-accent-soft text-accent-ink' },
  past: { label: 'Bitti', className: 'bg-[#F2F2F7] text-muted' },
} as const

const APPLICATION_STATUS_LABELS: Record<SponsorApplicationStatus, string> = {
  new: 'Yeni',
  in_review: 'Görüşülüyor',
  accepted: 'Anlaşıldı',
  declined: 'Olmadı',
}
const APPLICATION_STATUS_ORDER: SponsorApplicationStatus[] = [
  'new',
  'in_review',
  'accepted',
  'declined',
]

type BookOption = { id: string; title: string }

interface SlotDraft {
  id: string | null
  bookId: string
  startsOn: string
  endsOn: string
  sponsorName: string
  sponsorUrl: string
  blurb: string
}

/**
 * "Ayın kitabı" yönetimi: sponsorlu dönemler ve "Kitabını paylaş"
 * başvuruları. Dönem yoksa vitrinde en çok beğenilen kitap görünür.
 */
export function FeaturedAdmin({
  slots,
  applications,
  books,
  today,
}: {
  slots: AdminFeaturedSlot[]
  applications: AdminSponsorApplication[]
  books: BookOption[]
  today: string
}) {
  const [editing, setEditing] = useState<SlotDraft | null>(null)
  const active = slots.find((slot) => slotState(slot, today) === 'active')

  function startNew(prefill: Partial<SlotDraft> = {}) {
    const month = monthRange(today)
    setEditing({
      id: null,
      bookId: '',
      startsOn: month.start,
      endsOn: month.end,
      sponsorName: '',
      sponsorUrl: '',
      blurb: '',
      ...prefill,
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <section>
        <header className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg text-ink">Sponsorlu dönemler</h2>
            <p className="text-xs text-muted">
              {active
                ? `Şu an vitrinde: “${active.bookTitle}” (${active.sponsorName}).`
                : 'Şu an sponsorlu kitap yok; ana sayfada en çok beğenilen kitap gösteriliyor.'}
            </p>
          </div>
          <Button size="sm" onClick={() => startNew()}>
            + Sponsorlu dönem ekle
          </Button>
        </header>

        {slots.length === 0 ? (
          <div className="rounded-panel border border-line bg-white">
            <EmptyState
              icon="star"
              title="Henüz sponsorlu dönem yok"
              description="Bir yayınevi ya da yazarla anlaştığınızda kitabı ve tarihleri buradan girin."
            />
          </div>
        ) : (
          <ul className="divide-y divide-line rounded-panel border border-line bg-white">
            {slots.map((slot) => {
              const state = STATE_LABELS[slotState(slot, today)]
              return (
                <li key={slot.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {slot.bookSlug ? (
                        <Link href={`/kitap/${slot.bookSlug}`} className="hover:text-accent-ink">
                          {slot.bookTitle}
                        </Link>
                      ) : (
                        slot.bookTitle
                      )}
                      <span
                        className={cn(
                          'ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold',
                          state.className,
                        )}
                      >
                        {state.label}
                      </span>
                    </p>
                    <p className="truncate text-[11px] text-muted">
                      {slot.sponsorName} · {formatShortDate(slot.startsOn)} –{' '}
                      {formatShortDate(slot.endsOn)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      setEditing({
                        id: slot.id,
                        bookId: slot.bookId,
                        startsOn: slot.startsOn,
                        endsOn: slot.endsOn,
                        sponsorName: slot.sponsorName,
                        sponsorUrl: slot.sponsorUrl ?? '',
                        blurb: slot.blurb ?? '',
                      })
                    }
                  >
                    Düzenle
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <ApplicationList
        applications={applications}
        onSchedule={(application) => {
          const month = application.preferredMonth
            ? monthRange(application.preferredMonth)
            : monthRange(today)
          startNew({
            sponsorName: application.organization ?? application.contactName,
            sponsorUrl: application.bookLink ?? '',
            startsOn: month.start,
            endsOn: month.end,
          })
        }}
      />

      {editing && <SlotDialog draft={editing} books={books} onClose={() => setEditing(null)} />}
    </div>
  )
}

function SlotDialog({
  draft,
  books,
  onClose,
}: {
  draft: SlotDraft
  books: BookOption[]
  onClose: () => void
}) {
  const router = useRouter()
  const toast = useToast()
  const [values, setValues] = useState(draft)
  const [search, setSearch] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const patch = (next: Partial<SlotDraft>) => setValues((current) => ({ ...current, ...next }))

  // ~200 kitaplık açılır liste uzun; yazınca daralıyor. Seçili kitap her
  // zaman listede kalıyor ki arama değişince seçim kaybolmasın.
  const options = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase('tr')
    if (!needle) return books
    return books.filter(
      (book) => book.id === values.bookId || book.title.toLocaleLowerCase('tr').includes(needle),
    )
  }, [books, search, values.bookId])

  async function save() {
    setBusy(true)
    setFormError('')
    setErrors({})
    const { id, ...input } = values
    const result = await saveFeaturedSlotAction(id, input)
    setBusy(false)
    if (!result.ok) {
      setFormError(result.error)
      setErrors(result.fieldErrors ?? {})
      return
    }
    toast.show('Dönem kaydedildi.')
    onClose()
    router.refresh()
  }

  async function remove() {
    if (!values.id) return
    setBusy(true)
    const result = await deleteFeaturedSlotAction(values.id)
    setBusy(false)
    if (!result.ok) {
      setFormError(result.error)
      setConfirming(false)
      return
    }
    toast.show('Dönem silindi.')
    onClose()
    router.refresh()
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={values.id ? 'Sponsorlu dönemi düzenle' : 'Yeni sponsorlu dönem'}
      widthClassName="max-w-xl"
      footer={
        confirming ? (
          <div>
            <p className="mb-3 text-sm text-danger">
              Bu dönem silinecek. Şu an vitrindeyse yerine en çok beğenilen kitap gösterilir.
            </p>
            <div className="flex gap-2">
              <Button variant="danger" onClick={() => void remove()} disabled={busy}>
                {busy ? 'Siliniyor…' : 'Evet, sil'}
              </Button>
              <Button variant="ghost" onClick={() => setConfirming(false)}>
                Vazgeç
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button onClick={() => void save()} disabled={busy}>
              {busy ? 'Kaydediliyor…' : 'Kaydet'}
            </Button>
            {values.id && (
              <Button variant="danger" className="ml-auto" onClick={() => setConfirming(true)}>
                Sil
              </Button>
            )}
          </div>
        )
      }
    >
      <FormMessage tone="error">{formError}</FormMessage>
      <TextField
        label="Kitap ara"
        hint="Kitap önce kataloğa eklenmiş ve yayında olmalı."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Kitap adından bir parça…"
      />
      <SelectField
        label="Kitap *"
        value={values.bookId}
        onChange={(event) => patch({ bookId: event.target.value })}
        error={errors.bookId}
      >
        <option value="">Seç…</option>
        {options.map((book) => (
          <option key={book.id} value={book.id}>
            {book.title}
          </option>
        ))}
      </SelectField>
      <div className="grid grid-cols-2 gap-3">
        <TextField
          label="Başlangıç *"
          type="date"
          value={values.startsOn}
          onChange={(event) => patch({ startsOn: event.target.value })}
          error={errors.startsOn}
        />
        <TextField
          label="Bitiş *"
          type="date"
          value={values.endsOn}
          onChange={(event) => patch({ endsOn: event.target.value })}
          error={errors.endsOn}
        />
      </div>
      <TextField
        label="Sponsor adı *"
        hint="Vitrinde “Sponsorlu · …” olarak görünür."
        value={values.sponsorName}
        onChange={(event) => patch({ sponsorName: event.target.value })}
        error={errors.sponsorName}
        maxLength={120}
      />
      <TextField
        label="Sponsor bağlantısı"
        hint="İsteğe bağlı. Sponsor adına tıklanınca açılır."
        type="url"
        value={values.sponsorUrl}
        onChange={(event) => patch({ sponsorUrl: event.target.value })}
        error={errors.sponsorUrl}
        placeholder="https://"
      />
      <TextAreaField
        label="Sponsor mesajı"
        hint="İsteğe bağlı, en fazla 300 karakter. Kitabın altında görünür."
        rows={3}
        value={values.blurb}
        onChange={(event) => patch({ blurb: event.target.value })}
        error={errors.blurb}
        maxLength={300}
      />
    </Dialog>
  )
}

function ApplicationList({
  applications,
  onSchedule,
}: {
  applications: AdminSponsorApplication[]
  onSchedule: (application: AdminSponsorApplication) => void
}) {
  const router = useRouter()
  const toast = useToast()
  const [pending, setPending] = useState<string | null>(null)

  async function updateStatus(id: string, status: SponsorApplicationStatus) {
    setPending(id)
    const result = await setSponsorApplicationStatusAction(id, status)
    setPending(null)
    if (!result.ok) {
      toast.show(result.error, 'error')
      return
    }
    router.refresh()
  }

  return (
    <section>
      <header className="mb-3">
        <h2 className="text-lg text-ink">“Kitabını paylaş” başvuruları</h2>
        <p className="text-xs text-muted">
          Yayınevleri ve yazarlar{' '}
          <Link href="/kitabini-paylas" className="underline hover:text-accent-ink">
            /kitabini-paylas
          </Link>{' '}
          sayfasından başvuruyor. Anlaşınca “Döneme dönüştür” ile vitrine alın.
        </p>
      </header>

      {applications.length === 0 ? (
        <div className="rounded-panel border border-line bg-white">
          <EmptyState icon="mail" title="Henüz başvuru yok" />
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {applications.map((application) => (
            <li key={application.id} className="rounded-panel border border-line bg-white p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-ink">{application.bookTitle}</span>
                <span className="text-[11px] text-muted">
                  {formatShortDate(application.createdAt)}
                </span>
              </div>
              <dl className="mb-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs text-ink-soft">
                <dt className="text-muted">Başvuran</dt>
                <dd>
                  {application.contactName}
                  {application.organization && ` · ${application.organization}`}
                </dd>
                <dt className="text-muted">E-posta</dt>
                <dd>
                  <a
                    href={`mailto:${application.contactEmail}`}
                    className="underline hover:text-accent-ink"
                  >
                    {application.contactEmail}
                  </a>
                </dd>
                {application.preferredMonth && (
                  <>
                    <dt className="text-muted">İstediği ay</dt>
                    <dd>{formatMonth(application.preferredMonth)}</dd>
                  </>
                )}
                {application.bookLink && (
                  <>
                    <dt className="text-muted">Bağlantı</dt>
                    <dd className="truncate">
                      <a
                        href={application.bookLink}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="underline hover:text-accent-ink"
                      >
                        {application.bookLink}
                      </a>
                    </dd>
                  </>
                )}
              </dl>
              {application.message && (
                <p className="mb-3 text-sm leading-relaxed whitespace-pre-wrap text-ink-soft">
                  {application.message}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-1.5">
                {APPLICATION_STATUS_ORDER.map((status) => (
                  <button
                    key={status}
                    type="button"
                    disabled={pending === application.id}
                    onClick={() => void updateStatus(application.id, status)}
                    aria-pressed={application.status === status}
                    className={cn(
                      'rounded-full border-[1.5px] px-3 py-1 text-[11px] font-semibold transition-colors',
                      application.status === status
                        ? 'border-accent bg-accent text-ink'
                        : 'border-line text-muted hover:border-accent hover:text-accent-ink',
                    )}
                  >
                    {APPLICATION_STATUS_LABELS[status]}
                  </button>
                ))}
                <Button
                  size="sm"
                  variant="secondary"
                  className="ml-auto"
                  onClick={() => onSchedule(application)}
                >
                  Döneme dönüştür
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
