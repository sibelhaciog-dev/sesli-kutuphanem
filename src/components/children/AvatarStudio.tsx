'use client'

import { useEffect, useMemo, useState } from 'react'
import { AvatarFigure } from '@/components/avatar/AvatarFigure'
import { useAppData } from '@/components/providers/AppDataProvider'
import { Button } from '@/components/ui/Button'
import { Dialog } from '@/components/ui/Dialog'
import { useToast } from '@/components/ui/Toast'
import {
  AVATAR_ITEMS,
  SECRET_ANIMALS,
  SECRET_MILESTONES,
  availableAnimals,
  chooseSecret,
  chosenSecrets,
  itemStatus,
  resolveAnimalId,
  secretChoicesLeft,
  toggleItem,
  type AvatarItem,
  type AvatarProgress,
} from '@/lib/avatar'
import { cn } from '@/lib/cn'
import { saveAvatar } from '@/lib/data/children'
import { loadAvatarProgress } from '@/lib/data/library'
import type { Child } from '@/lib/data/types'
import { createClient } from '@/lib/supabase/client'

interface AvatarStudioProps {
  child: Child
  onClose: () => void
}

const GROUPS: { kind: AvatarItem['unlock']['kind']; title: string; hint: string }[] = [
  {
    kind: 'guide',
    title: 'Rehber eşyaları',
    hint: 'Bir rehberden 3 kitap okuyunca o rehberin eşyası açılır.',
  },
  { kind: 'season', title: 'Mevsim eşyaları', hint: 'Her mevsim kendi eşyasını getirir.' },
  { kind: 'day', title: 'Özel günler', hint: 'Bazı özel günlerde sürpriz eşyalar açılır.' },
]

/**
 * Avatar atölyesi: hayvan dostu seçimi, okudukça açılan eşyalar ve 50/100.
 * kitapta seçilen gizli (nesli tükenmekte olan) hayvanlar.
 */
export function AvatarStudio({ child, onClose }: AvatarStudioProps) {
  const { refreshChildren } = useAppData()
  const toast = useToast()
  const [character, setCharacter] = useState(resolveAnimalId(child.avatarCharacter))
  const [accessories, setAccessories] = useState<string[]>(child.avatarAccessories)
  const [progress, setProgress] = useState<AvatarProgress | null>(null)
  const [busy, setBusy] = useState(false)
  const today = useMemo(() => new Date(), [])

  useEffect(() => {
    loadAvatarProgress(createClient(), child.id)
      .then(setProgress)
      .catch(() => setProgress({ booksRead: 0, readByArea: {} }))
  }, [child.id])

  const animals = availableAnimals(accessories)
  const booksRead = progress?.booksRead ?? 0
  const choicesLeft = secretChoicesLeft(booksRead, accessories)
  const chosen = new Set(chosenSecrets(accessories))
  const nextMilestone = SECRET_MILESTONES.find((milestone) => booksRead < milestone)

  function pickSecret(id: string) {
    setAccessories((current) => chooseSecret(current, id, booksRead))
    setCharacter(id)
  }

  async function save() {
    setBusy(true)
    try {
      await saveAvatar(createClient(), child.id, character, accessories)
      await refreshChildren()
      toast.show('Avatar kaydedildi.')
      onClose()
    } catch {
      toast.show('Avatar kaydedilemedi.', 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={`${child.name} için avatar`}
      subtitle={progress ? `${booksRead} kitap okundu` : 'Yükleniyor…'}
      footer={
        <div className="flex justify-end">
          <Button onClick={() => void save()} disabled={busy}>
            {busy ? 'Kaydediliyor…' : 'Kaydet'}
          </Button>
        </div>
      }
    >
      <div className="mb-5 flex justify-center rounded-2xl bg-cream py-4">
        <AvatarFigure characterId={character} accessories={accessories} size={168} />
      </div>

      <section className="mb-6">
        <h3 className="mb-2.5 text-[11px] font-bold tracking-wider text-muted uppercase">
          Hayvan dostunu seç
        </h3>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
          {animals.map((animal) => (
            <button
              key={animal.id}
              type="button"
              onClick={() => setCharacter(animal.id)}
              aria-pressed={character === animal.id}
              className={cn(
                'rounded-xl border-2 p-1 text-center transition-colors',
                character === animal.id
                  ? 'border-accent bg-accent-soft'
                  : 'border-transparent hover:border-line',
              )}
            >
              <AvatarFigure characterId={animal.id} headOnly size={52} className="mx-auto" />
              <span className="mt-1 block truncate text-[11px] font-medium text-ink">
                {animal.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="mb-6 rounded-2xl border border-line p-3">
        <h3 className="mb-1 text-[11px] font-bold tracking-wider text-muted uppercase">
          Gizli hayvanlar
        </h3>
        {choicesLeft > 0 ? (
          <>
            <p className="mb-3 text-sm text-ink">
              {booksRead} kitap okudun! Nesli tükenmekte olan bir hayvan seç; artık senin dostun
              olacak.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {SECRET_ANIMALS.filter((animal) => !chosen.has(animal.id)).map((animal) => (
                <button
                  key={animal.id}
                  type="button"
                  onClick={() => pickSecret(animal.id)}
                  className="flex items-start gap-2.5 rounded-xl border border-line p-2 text-left hover:border-accent"
                >
                  <AvatarFigure characterId={animal.id} headOnly size={44} className="shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-ink">{animal.name}</span>
                    <span className="block text-[11px] leading-snug text-muted">{animal.fact}</span>
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="text-xs text-muted">
            {nextMilestone
              ? `${nextMilestone}. kitapta nesli tükenmekte olan gizli bir hayvan seçebilirsin. (${booksRead}/${nextMilestone})`
              : 'Tüm gizli hayvan haklarını kullandın.'}
            {chosen.size > 0 &&
              ` Seçtiklerin: ${SECRET_ANIMALS.filter((animal) => chosen.has(animal.id))
                .map((animal) => animal.name)
                .join(', ')}.`}
          </p>
        )}
      </section>

      {GROUPS.map((group) => (
        <section key={group.kind} className="mb-5 last:mb-0">
          <h3 className="mb-1 text-[11px] font-bold tracking-wider text-muted uppercase">
            {group.title}
          </h3>
          <p className="mb-2.5 text-xs text-muted">{group.hint}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {AVATAR_ITEMS.filter((item) => item.unlock.kind === group.kind).map((item) => {
              const status = itemStatus(item, progress ?? { booksRead: 0, readByArea: {} }, today)
              const worn = accessories.includes(item.id)
              const usable = status.available || worn
              return (
                <button
                  key={item.id}
                  type="button"
                  disabled={!usable}
                  onClick={() => setAccessories((current) => toggleItem(current, item.id))}
                  aria-pressed={worn}
                  className={cn(
                    'rounded-xl border-2 p-2 text-center transition-colors',
                    worn
                      ? 'border-accent bg-accent-soft'
                      : usable
                        ? 'border-line hover:border-accent'
                        : 'cursor-not-allowed border-line',
                  )}
                >
                  <span className={cn('block', !usable && 'opacity-35 grayscale')}>
                    <AvatarFigure
                      characterId={character}
                      accessories={[item.id]}
                      size={72}
                      className="mx-auto"
                    />
                  </span>
                  <span className="mt-1 block text-xs font-semibold text-ink">
                    {!usable && '🔒 '}
                    {item.name}
                  </span>
                  <span className="block text-[10px] leading-snug text-muted">{status.note}</span>
                </button>
              )
            })}
          </div>
        </section>
      ))}
    </Dialog>
  )
}
