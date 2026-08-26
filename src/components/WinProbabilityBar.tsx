import { formatPercent } from '@/lib/utils'

interface Props {
  pRadiant: number
  radiantName?: string | null
  direName?: string | null
}

/** The single number the whole product exists to show. */
export function WinProbabilityBar({ pRadiant, radiantName, direName }: Props) {
  const radiantPct = Math.round(pRadiant * 1000) / 10

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-radiant">{radiantName ?? 'Radiant'}</span>
        <span className="text-dire">{direName ?? 'Dire'}</span>
      </div>
      <div
        className="flex h-2.5 overflow-hidden rounded-full bg-dire"
        role="meter"
        aria-valuenow={radiantPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Вероятность победы Radiant"
      >
        <div className="bg-radiant transition-all duration-500" style={{ width: `${radiantPct}%` }} />
      </div>
      <div className="flex justify-between font-mono text-sm">
        <span>{formatPercent(pRadiant, 1)}</span>
        <span>{formatPercent(1 - pRadiant, 1)}</span>
      </div>
    </div>
  )
}
