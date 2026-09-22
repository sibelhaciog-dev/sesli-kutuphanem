'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { deleteModeAction, saveModeAction } from '@/app/yonetim/actions'
import { WeightPicker, type WeightGroup } from '@/components/admin/WeightPicker'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { FormMessage, SelectField, TextAreaField, TextField } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import type { AdminMode } from '@/lib/data/admin'
import type { AreaView, InterestView } from '@/lib/data/types'

/**
 * Keşif modları (ADR 0007): ana sayfadaki "bugün ne okuyalım?" seçenekleri.
 * Her mod aday havuzunu seçilen konulara/ilgilere eğiyor ve yapay zekâya
 * kısa bir not iletiyor.
 */
export function ModeEditor({
  modes,
  areas,
  interests,
}: {
  modes: AdminMode[]
  areas: AreaView[]
  interests: InterestView[]
}) {
  const [editing, setEditing] = useState<AdminMode | 'new' | null>(null)
  const topicNames = new Map(
    areas.flatMap((area) => area.topics.map((topic) => [topic.slug, topic.name] as const)),
  )
  const interestNames = new Map(interests.map((interest) => [interest.slug, interest.name]))

  return (
    <div>
      <header className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg text-ink">Keşif modları</h2>
          <p className="text-xs text-muted">
            Ana sayfadaki öneri çerçevesinde ve keşif sayfasında görünen seçenekler.
          </p>
        </div>
        <Button size="sm" onClick={() => setEditing('new')}>
          + Mod ekle
        </Button>
      </header>

      <ul className="divide-y divide-line rounded-panel border border-line bg-white">
        {modes.map((mode) => {
          const leanings = [
            ...mode.topics.map((entry) => topicNames.get(entry.slug) ?? entry.slug),
            ...mode.interests.map((entry) => interestNames.get(entry.slug) ?? entry.slug),
          ]
          return (
            <li key={mode.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <span className="text-xl" aria-hidden>
                {mode.emoji ?? '✨'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {mode.name}
                  {!mode.isActive && (
                    <span className="ml-2 rounded-full bg-[#F2F2F7] px-2 py-0.5 text-[10px] font-bold text-muted">
                      Pasif
                    </span>
                  )}
                </p>
                <p className="truncate text-[11px] text-muted">
                  sıra {mode.position} ·{' '}
                  {leanings.length > 0 ? leanings.join(', ') : 'hiçbir konuya eğilmiyor'}
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => setEditing(mode)}>
                Düzenle
              </Button>
            </li>
          )
        })}
      </ul>

      {editing && (
        <ModeDialog
          mode={editing === 'new' ? null : editing}
          nextPosition={Math.max(0, ...modes.map((mode) => mode.position)) + 1}
          areas={areas}
          interests={interests}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

function ModeDialog({
  mode,
  nextPosition,
  areas,
  interests,
  onClose,
}: {
  mode: AdminMode | null
  nextPosition: number
  areas: AreaView[]
  interests: InterestView[]
  onClose: () => void
}) {
  const router = useRouter()
  const toast = useToast()
  const [values, setValues] = useState({
    name: mode?.name ?? '',
    emoji: mode?.emoji ?? '',
    description: mode?.description ?? '',
    promptHint: mode?.promptHint ?? '',
    language: mode?.language ?? '',
    position: String(mode?.position ?? nextPosition),
    isActive: mode?.isActive ?? true,
  })
  const [topics, setTopics] = useState<Record<string, number>>(() =>
    Object.fromEntries((mode?.topics ?? []).map((entry) => [entry.slug, entry.weight])),
  )
  const [interestWeights, setInterestWeights] = useState<Record<string, number>>(() =>
    Object.fromEntries((mode?.interests ?? []).map((entry) => [entry.slug, entry.weight])),
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const patch = (next: Partial<typeof values>) => setValues((current) => ({ ...current, ...next }))

  const topicGroups: WeightGroup[] = areas
    .filter((area) => area.topics.length > 0)
    .map((area) => ({
      key: area.slug,
      label: area.name,
      emoji: area.emoji,
      items: area.topics.map((topic) => ({ slug: topic.slug, name: topic.label ?? topic.name })),
    }))
  const interestGroups: WeightGroup[] = [
    {
      key: 'ilgi',
      label: 'İlgi alanları',
      items: interests.map((interest) => ({
        slug: interest.slug,
        name: `${interest.emoji} ${interest.name}`,
      })),
    },
  ]

  async function save() {
    setBusy(true)
    setFormError('')
    setErrors({})
    const result = await saveModeAction(mode?.slug ?? null, {
      ...values,
      topics: Object.entries(topics).map(([slug, weight]) => ({ slug, weight })),
      interests: Object.entries(interestWeights).map(([slug, weight]) => ({ slug, weight })),
    })
    setBusy(false)
    if (!result.ok) {
      setFormError(result.error)
      setErrors(result.fieldErrors ?? {})
      return
    }
    toast.show('Mod kaydedildi.')
    onClose()
    router.refresh()
  }

  async function remove() {
    if (!mode) return
    setBusy(true)
    const result = await deleteModeAction(mode.id)
    setBusy(false)
    if (!result.ok) {
      setFormError(result.error)
      setConfirming(false)
      return
    }
    toast.show('Mod silindi.')
    onClose()
    router.refresh()
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={mode ? 'Modu düzenle' : 'Yeni keşif modu'}
      subtitle={mode?.slug}
      widthClassName="max-w-2xl"
      footer={
        confirming ? (
          <div>
            <p className="mb-3 text-sm text-danger">
              “{mode?.name}” silinecek. Geçmiş öneri kayıtları kalır; mod listeden kalkar. Yalnızca
              gizlemek istiyorsanız silmek yerine “Pasif” yapın.
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
            {mode && (
              <Button variant="danger" className="ml-auto" onClick={() => setConfirming(true)}>
                Sil
              </Button>
            )}
          </div>
        )
      }
    >
      <FormMessage tone="error">{formError}</FormMessage>
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
      <TextField
        label="Kısa açıklama"
        hint="Mod seçilirken altında görünür."
        value={values.description}
        onChange={(event) => patch({ description: event.target.value })}
        error={errors.description}
        maxLength={200}
      />
      <TextAreaField
        label="Yapay zekâya not"
        hint="Ebeveyn bu modu seçince yapay zekâya ne arandığını anlatan bir iki cümle. Ör: “Ebeveyn uyku öncesi sakin bir kitap arıyor.”"
        rows={3}
        value={values.promptHint}
        onChange={(event) => patch({ promptHint: event.target.value })}
        error={errors.promptHint}
        maxLength={400}
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <SelectField
          label="Kitap dili"
          value={values.language}
          onChange={(event) => patch({ language: event.target.value as typeof values.language })}
        >
          <option value="">Hepsi</option>
          <option value="tr">Yalnızca Türkçe</option>
          <option value="en">Yalnızca İngilizce</option>
        </SelectField>
        <TextField
          label="Sıra"
          type="number"
          min={0}
          value={values.position}
          onChange={(event) => patch({ position: event.target.value })}
          error={errors.position}
        />
        <label className="mb-3.5 flex items-center gap-2 self-end pb-2.5 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={values.isActive}
            onChange={(event) => patch({ isActive: event.target.checked })}
            className="size-4 accent-accent"
          />
          Sitede görünsün
        </label>
      </div>

      <h3 className="mt-2 text-sm font-bold text-ink">Hangi konulara eğilsin?</h3>
      <p className="mb-3 text-xs text-muted">
        Seçilen konulardaki kitaplar aday listesinde öne çıkar. Ağırlık 5: güçlü, 1: hafif.
      </p>
      <WeightPicker
        groups={topicGroups}
        value={topics}
        onChange={setTopics}
        weightLabel="ağırlığı"
      />
      <div className="mt-4">
        <WeightPicker
          groups={interestGroups}
          value={interestWeights}
          onChange={setInterestWeights}
          weightLabel="ağırlığı"
        />
      </div>
    </Dialog>
  )
}
