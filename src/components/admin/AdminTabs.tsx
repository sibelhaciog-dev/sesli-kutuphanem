'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/cn'
import { usePendingNotes } from './usePendingNotes'

const TABS = [
  { href: '/yonetim', label: 'Genel bakış' },
  { href: '/yonetim/kitaplar', label: 'Kitaplar' },
  { href: '/yonetim/rehberler', label: 'Rehberler' },
  { href: '/yonetim/modlar', label: 'Keşif modları' },
  { href: '/yonetim/notlar', label: 'Notlar' },
  { href: '/yonetim/ayin-kitabi', label: 'Ayın kitabı' },
  { href: '/yonetim/gorusler', label: 'Görüşler' },
]

export function AdminTabs() {
  const pathname = usePathname()
  const pendingNotes = usePendingNotes()
  return (
    <nav className="mb-6 flex gap-1 overflow-x-auto border-b border-line" aria-label="Yönetim">
      {TABS.map((tab) => {
        const active =
          tab.href === '/yonetim' ? pathname === tab.href : pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'shrink-0 border-b-2 px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors',
              active
                ? 'border-accent text-accent-ink'
                : 'border-transparent text-ink-soft hover:border-accent hover:text-accent-ink',
            )}
          >
            {tab.label}
            {tab.href === '/yonetim/notlar' && pendingNotes > 0 && (
              <span className="ml-1.5 rounded-full bg-danger px-1.5 text-[11px] leading-5 font-bold text-white">
                {pendingNotes}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
