'use client'

import { useState } from 'react'
import { useAppData } from '@/components/providers/AppDataProvider'
import { cn } from '@/lib/cn'
import { GuideArt, guideBackground } from './GuideArt'

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
        <span>📖 Gelişim Rehberleri</span>
        <span aria-hidden>{mobileOpen ? '⌄' : '›'}</span>
      </button>

      {/* Telefonda: resimli rehber kartları. "Gelişim Rehberleri"ne basınca açılır. */}
      {mobileOpen && (
        <div className="mb-2 rounded-panel border border-line bg-white p-3 lg:hidden">
          <div className="grid grid-cols-2 gap-2.5">
            {taxonomy.areas.map((area) => {
              const expanded = openArea === area.slug
              const activeInArea = area.topics.some((topic) => topic.slug === value)
              return (
                <button
                  key={area.slug}
                  type="button"
                  onClick={() => setOpenArea(expanded ? null : area.slug)}
                  aria-expanded={expanded}
                  style={{ backgroundColor: guideBackground(area.slug) }}
                  className={cn(
                    'rounded-2xl px-2 pt-2 pb-2.5 text-center transition-shadow',
                    expanded || activeInArea ? 'ring-2 ring-accent' : 'ring-0',
                  )}
                >
                  <GuideArt slug={area.slug} emoji={area.emoji} />
                  <span className="mt-0.5 block text-[13px] font-bold text-ink">
                    {area.name.replace(' Rehberi', '')}
                  </span>
                </button>
              )
            })}
          </div>

          {(() => {
            const area = taxonomy.areas.find((entry) => entry.slug === openArea)
            if (!area) return null
            return (
              <div className="mt-3 rounded-2xl bg-cream p-3">
                <p className="mb-2 text-xs font-bold text-muted">
                  {area.emoji} {area.name.replace(' Rehberi', '')} konuları
                </p>
                <div className="flex flex-wrap gap-1.5">
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
                            ? 'border-accent bg-accent text-white'
                            : 'border-line bg-white text-ink-soft hover:border-accent hover:text-accent',
                        )}
                      >
                        {topic.label ?? topic.name}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })()}

          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              className="mt-2 w-full px-1 py-1.5 text-left text-xs text-muted hover:text-accent"
            >
              ✕ Filtreyi temizle
            </button>
          )}
        </div>
      )}

      {/* Geniş ekranda: soldaki liste. */}
      <aside
        className={cn(
          'hidden w-full shrink-0 overflow-hidden rounded-panel border border-line bg-white lg:sticky lg:top-4 lg:block lg:w-56',
        )}
        aria-label="Gelişim Rehberleri"
      >
        <h2 className="border-b-2 border-accent px-4 pt-4 pb-3 text-base font-extrabold tracking-tight text-ink">
          Rehberler
        </h2>

        {taxonomy.areas.map((area) => {
          const expanded = openArea === area.slug
          const activeInArea = area.topics.some((topic) => topic.slug === value)
          return (
            <div key={area.slug} className="border-b border-line last:border-b-0">
              <button
                type="button"
                onClick={() => setOpenArea(expanded ? null : area.slug)}
                aria-expanded={expanded}
                className={cn(
                  'flex w-full items-center justify-between px-4 py-3 text-left text-sm font-bold transition-colors hover:bg-cream',
                  activeInArea ? 'text-accent' : 'text-ink',
                )}
              >
                <span>
                  {area.emoji} {area.name.replace(' Rehberi', '')}
                </span>
                <span aria-hidden>{expanded ? '⌄' : '›'}</span>
              </button>

              {expanded && (
                <div className="pb-2">
                  {area.topics.map((topic) => {
                    const selected = value === topic.slug
                    return (
                      <button
                        key={topic.slug}
                        type="button"
                        onClick={() => onChange(selected ? null : topic.slug)}
                        aria-pressed={selected}
                        className={cn(
                          'block w-full py-1.5 pr-4 pl-8 text-left text-xs transition-colors',
                          selected
                            ? 'bg-accent-soft font-semibold text-accent'
                            : 'text-ink-soft hover:bg-accent-soft hover:text-accent',
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

        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="w-full border-t border-line px-4 py-2.5 text-left text-xs text-muted transition-colors hover:text-accent"
          >
            ✕ Filtreyi temizle
          </button>
        )}
      </aside>
    </>
  )
}
