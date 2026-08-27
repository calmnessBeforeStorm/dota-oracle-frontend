import { cn } from '@/lib/utils'

const LABELS: Record<string, string> = {
  tier1: 'T1',
  tier2: 'T2',
  tier3: 'T3',
  unknown: '—',
}

const STYLES: Record<string, string> = {
  tier1: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  tier2: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  tier3: 'bg-neutral-700/40 text-neutral-400 border-neutral-700',
  unknown: 'bg-neutral-800/40 text-neutral-600 border-neutral-800',
}

/**
 * Tier comes from Liquipedia and is the whole reason phase 2 exists: it cannot be derived
 * from match data. "—" means unmapped, which is different from "low tier" (§3).
 */
export function TierBadge({ tier, className }: { tier: string; className?: string }) {
  return (
    <span
      title={tier === 'unknown' ? 'Турнир ещё не сопоставлен с Liquipedia' : `Tier ${tier.at(-1)}`}
      className={cn(
        'w-8 shrink-0 rounded border px-1 py-0.5 text-center text-xs font-medium',
        STYLES[tier] ?? STYLES.unknown,
        className,
      )}
    >
      {LABELS[tier] ?? LABELS.unknown}
    </span>
  )
}
