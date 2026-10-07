'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useAppData } from '@/components/providers/AppDataProvider'
import { countPendingNotes } from '@/lib/data/library'
import { createClient } from '@/lib/supabase/client'

/**
 * Onay bekleyen herkese açık not sayısı — yalnızca editörler için.
 * Sayfa değiştikçe yenilenir; böylece notlar onaylanınca işaret kaybolur.
 */
export function usePendingNotes(): number {
  const { isStaff } = useAppData()
  const pathname = usePathname()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!isStaff) {
      setCount(0)
      return
    }
    let cancelled = false
    void countPendingNotes(createClient()).then((value) => {
      if (!cancelled) setCount(value)
    })
    return () => {
      cancelled = true
    }
  }, [isStaff, pathname])

  return count
}
