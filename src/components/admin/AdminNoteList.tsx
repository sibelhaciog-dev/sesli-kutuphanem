'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { formatShortDate } from '@/lib/dates'
import { moderatePublicNote } from '@/lib/data/library'
import type { ModerationNote } from '@/lib/data/types'
import { createClient } from '@/lib/supabase/client'

/** Herkese açık notların onayı. Reddedilen not silinmez, sahibine gizli kalır. */
export function AdminNoteList({ items }: { items: ModerationNote[] }) {
  const router = useRouter()
  const toast = useToast()
  const [pending, setPending] = useState<string | null>(null)

  async function decide(id: string, approve: boolean) {
    setPending(id)
    try {
      await moderatePublicNote(createClient(), id, approve)
      toast.show(approve ? 'Not yayında.' : 'Not yayından kaldırıldı.')
      router.refresh()
    } catch {
      toast.show('Güncellenemedi.', 'error')
    } finally {
      setPending(null)
    }
  }

  if (items.length === 0) {
    return <EmptyState icon="💬" title="Herkese açık not yok" />
  }

  const waiting = items.filter((item) => !item.approvedAt)
  const published = items.filter((item) => item.approvedAt)

  return (
    <div className="flex flex-col gap-6">
      <NoteGroup
        title={`⏳ Onay bekleyenler (${waiting.length})`}
        items={waiting}
        empty="Onay bekleyen not yok."
        actions={(item) => (
          <>
            <ActionButton disabled={pending === item.id} onClick={() => void decide(item.id, true)}>
              ✓ Onayla
            </ActionButton>
            <ActionButton
              disabled={pending === item.id}
              onClick={() => void decide(item.id, false)}
              muted
            >
              ✕ Reddet
            </ActionButton>
          </>
        )}
      />
      <NoteGroup
        title={`🌍 Yayında (${published.length})`}
        items={published}
        empty="Yayında not yok."
        actions={(item) => (
          <ActionButton
            disabled={pending === item.id}
            onClick={() => void decide(item.id, false)}
            muted
          >
            Yayından kaldır
          </ActionButton>
        )}
      />
      <p className="text-xs text-muted">
        Reddedilen ya da kaldırılan not silinmez; yazan veliye &quot;Sadece bana&quot; olarak
        görünmeye devam eder.
      </p>
    </div>
  )
}

function NoteGroup({
  title,
  items,
  empty,
  actions,
}: {
  title: string
  items: ModerationNote[]
  empty: string
  actions: (item: ModerationNote) => React.ReactNode
}) {
  return (
    <section>
      <h2 className="mb-2 text-sm font-bold text-ink">{title}</h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.id} className="rounded-panel border border-line bg-white p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                {item.bookSlug ? (
                  <Link
                    href={`/kitap/${item.bookSlug}`}
                    className="text-sm font-semibold text-ink hover:text-accent-ink"
                  >
                    📖 {item.bookTitle}
                  </Link>
                ) : (
                  <span className="text-sm font-semibold text-ink">📖 {item.bookTitle}</span>
                )}
                <span className="text-[11px] text-muted">{formatShortDate(item.createdAt)}</span>
              </div>
              <p className="mb-3 text-sm leading-relaxed whitespace-pre-wrap text-ink-soft">
                {item.body}
              </p>
              <div className="flex flex-wrap gap-1.5">{actions(item)}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function ActionButton({
  children,
  onClick,
  disabled,
  muted = false,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled: boolean
  muted?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={
        muted
          ? 'rounded-full border-[1.5px] border-line px-3 py-1 text-[11px] font-semibold text-muted transition-colors hover:border-danger hover:text-danger disabled:opacity-50'
          : 'rounded-full border-[1.5px] border-accent bg-accent px-3 py-1 text-[11px] font-semibold text-ink transition-colors disabled:opacity-50'
      }
    >
      {children}
    </button>
  )
}
