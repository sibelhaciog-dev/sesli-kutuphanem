'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Yana kayan satır. Sağda gizli kalan seçenek varsa kenarda solan bir
 * gölge ve "›" düğmesi gösterir; telefonda satırın kaydırılabildiği
 * böylece anlaşılır. Düğmeye basınca satır biraz sağa kayar.
 */
export function ScrollRow({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [more, setMore] = useState(false)

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    setMore(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [update])

  return (
    <div className="relative">
      <div ref={ref} onScroll={update} className={className}>
        {children}
      </div>
      <button
        type="button"
        aria-label="Diğer seçenekleri göster"
        tabIndex={more ? 0 : -1}
        onClick={() => ref.current?.scrollBy({ left: 160, behavior: 'smooth' })}
        className={cn(
          'absolute inset-y-0 right-0 flex items-center bg-gradient-to-l from-white via-white/90 to-transparent pr-0.5 pl-8 transition-opacity',
          more ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-line bg-white text-base leading-none text-ink shadow-sm">
          ›
        </span>
      </button>
    </div>
  )
}
