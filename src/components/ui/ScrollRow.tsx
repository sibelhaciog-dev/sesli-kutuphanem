'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Yana kayan satır. Sağda ya da solda gizli kalan seçenek varsa o kenarda
 * solan bir gölge ve ok düğmesi gösterir; telefonda satırın kaydırılabildiği
 * böylece anlaşılır. Sona gelinince sağ ok kaybolur, sol ok görünür.
 */
export function ScrollRow({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)

  const update = useCallback(() => {
    const el = ref.current
    if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [update])

  function slide(direction: 1 | -1) {
    const el = ref.current
    if (!el) return
    el.scrollBy({ left: direction * Math.max(160, el.clientWidth * 0.7), behavior: 'smooth' })
  }

  return (
    <div className="relative">
      <div ref={ref} onScroll={update} className={className}>
        {children}
      </div>
      <ArrowButton side="left" visible={canLeft} onClick={() => slide(-1)} />
      <ArrowButton side="right" visible={canRight} onClick={() => slide(1)} />
    </div>
  )
}

function ArrowButton({
  side,
  visible,
  onClick,
}: {
  side: 'left' | 'right'
  visible: boolean
  onClick: () => void
}) {
  const left = side === 'left'
  return (
    <button
      type="button"
      aria-label={left ? 'Önceki seçenekleri göster' : 'Diğer seçenekleri göster'}
      tabIndex={visible ? 0 : -1}
      onClick={onClick}
      className={cn(
        'absolute inset-y-0 flex items-center from-white via-white/95 to-transparent transition-opacity',
        left ? 'left-0 bg-gradient-to-r pr-10 pl-0' : 'right-0 bg-gradient-to-l pr-0 pl-10',
        visible ? 'opacity-100' : 'pointer-events-none opacity-0',
      )}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-xl leading-none font-bold text-ink shadow-md">
        {left ? '‹' : '›'}
      </span>
    </button>
  )
}
