'use client'

import { IconLabel } from '@/components/ui/Icon'
import { useState } from 'react'
import { useAppData } from '@/components/providers/AppDataProvider'
import { cn } from '@/lib/cn'
import { GuideArt } from './GuideArt'

interface GuidePanelProps {
  value: string | null
  onChange: (topicSlug: string | null) => void
}

/** Sol menüdeki gelişim rehberleri — taksonomi veritabanından gelir. */
export function GuidePanel({ value, onChange }: GuidePanelProps) {
  const { taxonomy } = useAppData()
  const initialArea =
    taxonomy.areas.find((area) => area.topics.some((topic) => topic.slug === value))?.slug ?? null
  const [openArea, setOpenArea] = useState<string | null>(initialArea)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen((open) => !open)}
        aria-expanded={mobileOpen}
        className="mb-2 flex w-full items-center justify-between rounded-xl border-2 border-accent bg-white px-4 py-3 text-base font-extrabold text-ink lg:hidden"
      >
        <IconLabel name="book">Gelişim Rehberleri</IconLabel>
        <span aria-hidden>{mobileOpen ? '⌄' : '›'}</span>
      </button>

      {/* Rehberler: her biri renkli zeminli, resimli yatay bir kutu. Telefonda
          "Gelişim Rehberleri"ne basınca açılır, geniş ekranda hep solda durur. */}
      <aside
        className={cn(
          'w-full shrink-0 lg:sticky lg:top-4 lg:block lg:w-64',
          mobileOpen ? 'mb-2 block' : 'hidden',
        )}
        aria-label="Gelişim Rehberleri"
      >
        <h2 className="mb-2 hidden px-1 text-base font-extrabold tracking-tight text-ink lg:block">
          Rehberler
        </h2>

        <div className="flex flex-col gap-1.5">
          {taxonomy.areas.map((area) => {
            const expanded = openArea === area.slug
            const activeInArea = area.topics.some((topic) => topic.slug === value)
            return (
              <div
                key={area.slug}
                className={cn(
                  'overflow-hidden rounded-xl border border-line bg-white',
                  activeInArea && !expanded && 'ring-2 ring-accent',
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpenArea(expanded ? null : area.slug)}
                  aria-expanded={expanded}
                  className="flex w-full items-center gap-3 py-1.5 pr-4 pl-1.5 text-left"
                >
                  <span className="shrink-0">
                    <GuideArt slug={area.slug} emoji={area.emoji} />
                  </span>
                  <span className="flex-1 text-sm font-semibold text-ink">
                    {area.name.replace(' Rehberi', '')}
                  </span>
                  <span aria-hidden className="text-base text-muted">
                    {expanded ? '⌄' : '›'}
                  </span>
                </button>

                {expanded && (
                  <div className="flex flex-wrap gap-1.5 px-3 pb-3">
                    {area.topics.map((topic) => {
                      const selected = value === topic.slug
                      return (
                        <button
                          key={topic.slug}
                          type="button"
                          onClick={() => {
                            onChange(selected ? null : topic.slug)
                            if (!selected) setMobileOpen(false)
                          }}
                          aria-pressed={selected}
                          className={cn(
                            'rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors',
                            selected
                              ? 'border-accent bg-accent text-ink'
                              : 'border-line bg-cream text-ink-soft hover:border-accent hover:text-accent-ink',
                          )}
                        >
                          {topic.label ?? topic.name}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="mt-2 w-full px-1 py-1.5 text-left text-xs text-muted transition-colors hover:text-accent-ink"
          >
            <IconLabel name="x">Filtreyi temizle</IconLabel>
          </button>
        )}
      </aside>
    </>
  )
}
