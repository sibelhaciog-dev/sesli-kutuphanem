'use client'

import { cn } from '@/lib/cn'

export interface WeightGroup {
  key: string
  label: string
  emoji?: string
  items: Array<{ slug: string; name: string }>
}

interface WeightPickerProps {
  groups: WeightGroup[]
  /** Seçili öğe → ağırlık (1–5). */
  value: Record<string, number>
  onChange: (next: Record<string, number>) => void
  /** Seçilen öğenin ilk ağırlığı. */
  defaultWeight?: number
  /** Ağırlık seçicisinin ekran okuyucu etiketi ("önem", "ağırlık"). */
  weightLabel: string
  /** Öğenin yanında gösterilecek küçük not (ör. "otomatik"). */
  badges?: Record<string, string>
}

const WEIGHTS = [
  { value: 1, label: '1 · zayıf' },
  { value: 2, label: '2' },
  { value: 3, label: '3 · orta' },
  { value: 4, label: '4' },
  { value: 5, label: '5 · güçlü' },
]

/**
 * Konu/ilgi seçimi ve her seçime 1–5 ağırlık. Kitap formunda "bu konu
 * kitapta ne kadar merkezde", keşif modunda "aday havuzu bu konuya ne
 * kadar eğilsin" anlamına geliyor.
 */
export function WeightPicker({
  groups,
  value,
  onChange,
  defaultWeight = 3,
  weightLabel,
  badges = {},
}: WeightPickerProps) {
  function toggle(slug: string) {
    const next = { ...value }
    if (slug in next) delete next[slug]
    else next[slug] = defaultWeight
    onChange(next)
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <fieldset key={group.key}>
          <legend className="mb-2 text-xs font-bold text-ink-soft">
            {group.emoji && <span aria-hidden>{group.emoji} </span>}
            {group.label}
          </legend>
          <div className="flex flex-wrap gap-2">
            {group.items.map((item) => {
              const selected = item.slug in value
              return (
                <span
                  key={item.slug}
                  className={cn(
                    'inline-flex items-center rounded-full border-[1.5px] text-[13px] transition-colors',
                    selected ? 'border-accent bg-accent-soft' : 'border-line',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggle(item.slug)}
                    aria-pressed={selected}
                    className={cn(
                      'rounded-full px-3 py-1 font-medium',
                      selected ? 'text-accent-dark' : 'text-ink-soft hover:text-accent',
                    )}
                  >
                    {selected ? '✓ ' : ''}
                    {item.name}
                    {badges[item.slug] && (
                      <span className="ml-1.5 rounded bg-white px-1 text-[10px] font-bold text-muted">
                        {badges[item.slug]}
                      </span>
                    )}
                  </button>
                  {selected && (
                    <select
                      value={value[item.slug]}
                      onChange={(event) =>
                        onChange({ ...value, [item.slug]: Number(event.target.value) })
                      }
                      aria-label={`${item.name} ${weightLabel}`}
                      className="mr-1.5 rounded-full border-0 bg-white py-0.5 pr-1 pl-2 text-xs text-ink outline-none focus:ring-2 focus:ring-accent"
                    >
                      {WEIGHTS.map((weight) => (
                        <option key={weight.value} value={weight.value}>
                          {weight.label}
                        </option>
                      ))}
                    </select>
                  )}
                </span>
              )
            })}
          </div>
        </fieldset>
      ))}
    </div>
  )
}
