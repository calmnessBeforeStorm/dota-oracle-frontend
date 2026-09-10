import { TIER_OPTIONS, type Tier } from '@/lib/tiers'
import { cn } from '@/lib/utils'

interface Props {
  selected: Tier[]
  onToggle: (tier: Tier) => void
  counts: Record<Tier, number>
}

/** Какие уровни турниров показывать в живой ленте. */
export function TierFilter({ selected, onToggle, counts }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {TIER_OPTIONS.map((option) => {
        const active = selected.includes(option.key)
        const count = counts[option.key] ?? 0
        return (
          <button
            key={option.key}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(option.key)}
            className={cn(
              'rounded px-3 py-1.5 text-micro transition',
              active ? 'bg-ink text-neutral-900' : 'bg-raised text-ink-dim hover:text-ink',
            )}
          >
            {option.label}
            {/* Счётчик показывает, что именно скрыто фильтром: без него «ничего не идёт» и
                «всё отфильтровано» выглядят одинаково. */}
            {count > 0 && <span className="ml-2 opacity-60">{count}</span>}
          </button>
        )
      })}
    </div>
  )
}
