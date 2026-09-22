'use client'

import { useRouter } from 'next/navigation'
import { useState, type ReactNode } from 'react'
import {
  deleteTaxonomyAction,
  saveAreaAction,
  saveInterestAction,
  saveTopicAction,
  type ActionResult,
} from '@/app/yonetim/actions'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { FormMessage, SelectField, TextAreaField, TextField } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import type { AdminArea, AdminInterest, AdminTopic, TaxonomyKind, Usage } from '@/lib/data/admin'

type Editing =
  | { kind: 'area'; item: AdminArea | null }
  | { kind: 'topic'; item: AdminTopic | null; areaId: string }
  | { kind: 'interest'; item: AdminInterest | null }

/** "12 kitap · 3 çocuk · 1 mod" — silmeden önce etkisini göstermek için. */
function usageLabel(usage: Usage): string {
  const parts = [
    usage.books ? `${usage.books} kitap` : null,
    usage.children ? `${usage.children} çocuk profili` : null,
    usage.modes ? `${usage.modes} keşif modu` : null,
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(' · ') : 'kullanılmıyor'
}

function sumUsage(topics: AdminTopic[]): Usage {
  return topics.reduce(
    (total, topic) => ({
      books: total.books + topic.usage.books,
      children: total.children + topic.usage.children,
      modes: total.modes + topic.usage.modes,
    }),
    { books: 0, children: 0, modes: 0 },
  )
}

/**
 * Rehberler (gelişim alanları), alt konuları ve ilgi alanları (ADR 0008).
 * Sol menü, filtreler, çocuk profili seçenekleri ve otomatik etiketleme bu
 * listelerden üretiliyor.
 */
export function TaxonomyEditor({
  areas,
  interests,
}: {
  areas: AdminArea[]
  interests: AdminInterest[]
}) {
  const [editing, setEditing] = useState<Editing | null>(null)
  const nextAreaPosition = Math.max(0, ...areas.map((area) => area.position)) + 1
  const nextInterestPosition = Math.max(0, ...interests.map((interest) => interest.position)) + 1

  return (
    <div>
      <section className="mb-8">
        <header className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg text-ink">Rehberler ve konular</h2>
            <p className="text-xs text-muted">
              Sol menüdeki rehberler ve altlarındaki konular. Kitaplar konulara bağlanır.
            </p>
          </div>
          <Button size="sm" onClick={() => setEditing({ kind: 'area', item: null })}>
            + Rehber ekle
          </Button>
        </header>

        <div className="space-y-4">
          {areas.map((area) => (
            <article key={area.id} className="rounded-panel border border-line bg-white">
              <header className="flex flex-wrap items-center gap-3 border-b border-line p-4">
                <span
                  className="flex size-9 items-center justify-center rounded-xl text-lg"
                  style={{ background: `${area.color}22` }}
                  aria-hidden
                >
                  {area.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-[15px] font-semibold text-ink">{area.name}</h3>
                  <p className="text-[11px] text-muted">
                    sıra {area.position} · {area.topics.length} konu ·{' '}
                    {usageLabel(sumUsage(area.topics))}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setEditing({ kind: 'area', item: area })}
                >
                  Düzenle
                </Button>
              </header>
              <ul className="divide-y divide-line">
                {area.topics.map((topic) => (
                  <li key={topic.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ink">
                        {topic.name}
                        {topic.label && (
                          <span className="text-muted"> · menüde “{topic.label}”</span>
                        )}
                      </p>
                      <p className="truncate text-[11px] text-muted">
                        {usageLabel(topic.usage)} · {topic.keywords.length} anahtar kelime
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditing({ kind: 'topic', item: topic, areaId: area.id })}
                    >
                      Düzenle
                    </Button>
                  </li>
                ))}
                <li className="px-4 py-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditing({ kind: 'topic', item: null, areaId: area.id })}
                  >
                    + Konu ekle
                  </Button>
                </li>
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section>
        <header className="mb-3 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg text-ink">İlgi alanları</h2>
            <p className="text-xs text-muted">
              Çocuk profilinde seçilir; öneriler bu ilgilere göre eğilir.
            </p>
          </div>
          <Button size="sm" onClick={() => setEditing({ kind: 'interest', item: null })}>
            + İlgi alanı ekle
          </Button>
        </header>
        <ul className="divide-y divide-line rounded-panel border border-line bg-white">
          {interests.map((interest) => (
            <li key={interest.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
              <span className="text-lg" aria-hidden>
                {interest.emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-ink">{interest.name}</p>
                <p className="truncate text-[11px] text-muted">
                  sıra {interest.position} · {usageLabel(interest.usage)} ·{' '}
                  {interest.keywords.length} anahtar kelime
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setEditing({ kind: 'interest', item: interest })}
              >
                Düzenle
              </Button>
            </li>
          ))}
        </ul>
      </section>

      {editing?.kind === 'area' && (
        <AreaDialog
          area={editing.item}
          nextPosition={nextAreaPosition}
          onClose={() => setEditing(null)}
        />
      )}
      {editing?.kind === 'topic' && (
        <TopicDialog
          topic={editing.item}
          areaId={editing.areaId}
          areas={areas}
          onClose={() => setEditing(null)}
        />
      )}
      {editing?.kind === 'interest' && (
        <InterestDialog
          interest={editing.item}
          nextPosition={nextInterestPosition}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

// ─── Ortak iskelet ───────────────────────────────────────────────────────────

/**
 * Kaydet/sil akışı. Silme iki adımlı ve kullanım sayısını gösteriyor: bir
 * konu silinince kitap etiketlerinden ve çocuk profillerinden de gidiyor.
 */
function useEditorDialog(onClose: () => void) {
  const router = useRouter()
  const toast = useToast()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)

  async function run(action: () => Promise<ActionResult>, success: string) {
    setBusy(true)
    setFormError('')
    setErrors({})
    const result = await action()
    setBusy(false)
    if (!result.ok) {
      setFormError(result.error)
      setErrors(result.fieldErrors ?? {})
      return
    }
    toast.show(success)
    onClose()
    router.refresh()
  }

  return { errors, formError, busy, run }
}

function EditorDialog({
  title,
  subtitle,
  onClose,
  formError,
  busy,
  onSave,
  deletion,
  children,
}: {
  title: string
  subtitle?: string
  onClose: () => void
  formError: string
  busy: boolean
  onSave: () => void
  deletion?: { warning: string; onDelete: () => void }
  children: ReactNode
}) {
  const [confirming, setConfirming] = useState(false)
  return (
    <Dialog
      open
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      footer={
        confirming && deletion ? (
          <div>
            <p className="mb-3 text-sm text-danger">{deletion.warning}</p>
            <div className="flex gap-2">
              <Button variant="danger" onClick={deletion.onDelete} disabled={busy}>
                {busy ? 'Siliniyor…' : 'Evet, kalıcı olarak sil'}
              </Button>
              <Button variant="ghost" onClick={() => setConfirming(false)}>
                Vazgeç
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button onClick={onSave} disabled={busy}>
              {busy ? 'Kaydediliyor…' : 'Kaydet'}
            </Button>
            {deletion && (
              <Button variant="danger" className="ml-auto" onClick={() => setConfirming(true)}>
                Sil
              </Button>
            )}
          </div>
        )
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault()
          onSave()
        }}
        noValidate
      >
        <FormMessage tone="error">{formError}</FormMessage>
        {children}
        {/* Enter ile gönderim için görünmez düğme. */}
        <button type="submit" className="hidden" aria-hidden tabIndex={-1} />
      </form>
    </Dialog>
  )
}

function deletionWarning(name: string, usage: Usage, extra = ''): string {
  const used = usageLabel(usage)
  return used === 'kullanılmıyor'
    ? `“${name}” silinecek.${extra} Bu işlem geri alınamaz.`
    : `“${name}” şu anda ${used} tarafından kullanılıyor; silinince hepsinden kaldırılacak.${extra} Bu işlem geri alınamaz.`
}

const KEYWORD_HINT =
  'Virgülle ya da satır satır. Kitabın adı ve özetinde aranır; eşleşen kitaba bu başlık otomatik eklenir. Kelimenin başını yazmak yeter: “kıskanç” → “kıskançlık” da yakalanır. Tam kelime için \\y ile sarın: \\yay\\y “ay”ı yakalar, “ayakkabı”yı yakalamaz.'

// ─── Rehber ──────────────────────────────────────────────────────────────────

function AreaDialog({
  area,
  nextPosition,
  onClose,
}: {
  area: AdminArea | null
  nextPosition: number
  onClose: () => void
}) {
  const { errors, formError, busy, run } = useEditorDialog(onClose)
  const [values, setValues] = useState({
    name: area?.name ?? '',
    description: area?.description ?? '',
    emoji: area?.emoji ?? '📚',
    color: area?.color ?? '#8E8E93',
    position: String(area?.position ?? nextPosition),
  })
  const patch = (next: Partial<typeof values>) => setValues((current) => ({ ...current, ...next }))

  return (
    <EditorDialog
      title={area ? 'Rehberi düzenle' : 'Yeni rehber'}
      subtitle={area ? area.slug : undefined}
      onClose={onClose}
      formError={formError}
      busy={busy}
      onSave={() => void run(() => saveAreaAction(area?.id ?? null, values), 'Rehber kaydedildi.')}
      deletion={
        area
          ? {
              warning: deletionWarning(
                area.name,
                sumUsage(area.topics),
                ` Altındaki ${area.topics.length} konu da silinecek.`,
              ),
              onDelete: () =>
                void run(() => deleteTaxonomyAction('area', area.id), 'Rehber silindi.'),
            }
          : undefined
      }
    >
      <TextField
        label="Ad *"
        value={values.name}
        onChange={(event) => patch({ name: event.target.value })}
        error={errors.name}
        maxLength={80}
      />
      <TextAreaField
        label="Açıklama"
        rows={2}
        value={values.description}
        onChange={(event) => patch({ description: event.target.value })}
        error={errors.description}
        maxLength={500}
      />
      <div className="grid grid-cols-3 gap-3">
        <TextField
          label="Simge"
          value={values.emoji}
          onChange={(event) => patch({ emoji: event.target.value })}
          error={errors.emoji}
          maxLength={8}
        />
        <div className="mb-3.5">
          <label
            htmlFor="area-color"
            className="mb-1.5 block text-[11px] font-bold tracking-[0.06em] text-muted uppercase"
          >
            Renk
          </label>
          <div className="flex items-center gap-2">
            <input
              id="area-color"
              type="color"
              value={/^#[0-9A-Fa-f]{6}$/.test(values.color) ? values.color : '#8E8E93'}
              onChange={(event) => patch({ color: event.target.value.toUpperCase() })}
              className="h-10 w-12 cursor-pointer rounded-lg border-[1.5px] border-line"
            />
            <span className="text-xs text-muted">{values.color}</span>
          </div>
          {errors.color && <p className="mt-1 text-xs text-danger">{errors.color}</p>}
        </div>
        <TextField
          label="Sıra"
          type="number"
          min={0}
          value={values.position}
          onChange={(event) => patch({ position: event.target.value })}
          error={errors.position}
        />
      </div>
      {!area && (
        <p className="text-xs text-muted">
          Adres addan üretilir ve sonradan değişmez. Rehber, altına en az bir konu eklenince menüde
          işe yarar hale gelir.
        </p>
      )}
    </EditorDialog>
  )
}

// ─── Konu ────────────────────────────────────────────────────────────────────

function TopicDialog({
  topic,
  areaId,
  areas,
  onClose,
}: {
  topic: AdminTopic | null
  areaId: string
  areas: AdminArea[]
  onClose: () => void
}) {
  const { errors, formError, busy, run } = useEditorDialog(onClose)
  const siblings = areas.find((area) => area.id === areaId)?.topics ?? []
  const [values, setValues] = useState({
    areaId: topic?.areaId ?? areaId,
    name: topic?.name ?? '',
    label: topic?.label ?? '',
    description: topic?.description ?? '',
    keywords: topic?.keywords.join(', ') ?? '',
    position: String(topic?.position ?? Math.max(0, ...siblings.map((item) => item.position)) + 1),
  })
  const patch = (next: Partial<typeof values>) => setValues((current) => ({ ...current, ...next }))

  return (
    <EditorDialog
      title={topic ? 'Konuyu düzenle' : 'Yeni konu'}
      subtitle={topic ? topic.slug : undefined}
      onClose={onClose}
      formError={formError}
      busy={busy}
      onSave={() => void run(() => saveTopicAction(topic?.id ?? null, values), 'Konu kaydedildi.')}
      deletion={
        topic
          ? {
              warning: deletionWarning(topic.name, topic.usage),
              onDelete: () =>
                void run(() => deleteTaxonomyAction('topic', topic.id), 'Konu silindi.'),
            }
          : undefined
      }
    >
      <SelectField
        label="Rehber"
        value={values.areaId}
        onChange={(event) => patch({ areaId: event.target.value })}
        error={errors.areaId}
      >
        {areas.map((area) => (
          <option key={area.id} value={area.id}>
            {area.emoji} {area.name}
          </option>
        ))}
      </SelectField>
      <TextField
        label="Ad *"
        value={values.name}
        onChange={(event) => patch({ name: event.target.value })}
        error={errors.name}
        maxLength={80}
      />
      <TextField
        label="Menüdeki adı"
        hint="Boş bırakılırsa ad kullanılır."
        value={values.label}
        onChange={(event) => patch({ label: event.target.value })}
        error={errors.label}
        maxLength={80}
      />
      <TextAreaField
        label="Açıklama"
        rows={2}
        value={values.description}
        onChange={(event) => patch({ description: event.target.value })}
        error={errors.description}
        maxLength={500}
      />
      <TextAreaField
        label="Anahtar kelimeler"
        hint={errors.keywords ? undefined : KEYWORD_HINT}
        rows={3}
        value={values.keywords}
        onChange={(event) => patch({ keywords: event.target.value })}
        error={errors.keywords}
      />
      <TextField
        label="Sıra"
        type="number"
        min={0}
        value={values.position}
        onChange={(event) => patch({ position: event.target.value })}
        error={errors.position}
      />
    </EditorDialog>
  )
}

// ─── İlgi alanı ──────────────────────────────────────────────────────────────

function InterestDialog({
  interest,
  nextPosition,
  onClose,
}: {
  interest: AdminInterest | null
  nextPosition: number
  onClose: () => void
}) {
  const { errors, formError, busy, run } = useEditorDialog(onClose)
  const [values, setValues] = useState({
    name: interest?.name ?? '',
    emoji: interest?.emoji ?? '⭐',
    keywords: interest?.keywords.join(', ') ?? '',
    position: String(interest?.position ?? nextPosition),
  })
  const patch = (next: Partial<typeof values>) => setValues((current) => ({ ...current, ...next }))
  const kind: TaxonomyKind = 'interest'

  return (
    <EditorDialog
      title={interest ? 'İlgi alanını düzenle' : 'Yeni ilgi alanı'}
      subtitle={interest ? interest.slug : undefined}
      onClose={onClose}
      formError={formError}
      busy={busy}
      onSave={() =>
        void run(() => saveInterestAction(interest?.id ?? null, values), 'İlgi alanı kaydedildi.')
      }
      deletion={
        interest
          ? {
              warning: deletionWarning(interest.name, interest.usage),
              onDelete: () =>
                void run(() => deleteTaxonomyAction(kind, interest.id), 'İlgi alanı silindi.'),
            }
          : undefined
      }
    >
      <div className="grid grid-cols-[1fr_6rem] gap-3">
        <TextField
          label="Ad *"
          value={values.name}
          onChange={(event) => patch({ name: event.target.value })}
          error={errors.name}
          maxLength={60}
        />
        <TextField
          label="Simge"
          value={values.emoji}
          onChange={(event) => patch({ emoji: event.target.value })}
          error={errors.emoji}
          maxLength={8}
        />
      </div>
      <TextAreaField
        label="Anahtar kelimeler"
        hint={errors.keywords ? undefined : KEYWORD_HINT}
        rows={3}
        value={values.keywords}
        onChange={(event) => patch({ keywords: event.target.value })}
        error={errors.keywords}
      />
      <TextField
        label="Sıra"
        type="number"
        min={0}
        value={values.position}
        onChange={(event) => patch({ position: event.target.value })}
        error={errors.position}
      />
    </EditorDialog>
  )
}
