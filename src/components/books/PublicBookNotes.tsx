'use client'

import { useEffect, useState } from 'react'
import { useAppData } from '@/components/providers/AppDataProvider'
import { formatShortDate } from '@/lib/dates'
import { loadBookPublicNotes } from '@/lib/data/library'
import type { PublicNote } from '@/lib/data/types'
import { createClient } from '@/lib/supabase/client'

/**
 * Kitap sayfasında diğer velilerin onaylı, herkese açık notları.
 * Yalnızca giriş yapmış kullanıcılara gösterilir; yazan kişi gösterilmez.
 */
export function PublicBookNotes({ bookId }: { bookId: string }) {
  const { userId } = useAppData()
  const supabase = createClient()
  const [notes, setNotes] = useState<PublicNote[]>([])

  useEffect(() => {
    if (!userId) {
      setNotes([])
      return
    }
    let cancelled = false
    void loadBookPublicNotes(supabase, bookId)
      .then((loaded) => {
        if (!cancelled) setNotes(loaded)
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [supabase, bookId, userId])

  if (!userId || notes.length === 0) return null

  return (
    <section className="border-t border-line p-5">
      <h2 className="mb-3 text-xs font-bold tracking-wider text-muted uppercase">
        👨‍👩‍👧 Velilerin notları
      </h2>
      <ul className="flex flex-col gap-2.5">
        {notes.map((note) => (
          <li key={note.id} className="rounded-xl border border-line bg-cream p-3.5">
            <div className="mb-1.5 flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-ink-soft">Bir veli</span>
              <span className="text-[11px] text-muted">{formatShortDate(note.createdAt)}</span>
            </div>
            <p className="text-[13px] leading-relaxed whitespace-pre-wrap text-ink-soft">
              {note.body}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
