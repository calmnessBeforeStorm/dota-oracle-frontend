import { StreamDelayNotice } from '@/components/StreamDelayNotice'
import { cn, formatPercent } from '@/lib/utils'
import { TeamName } from './TeamName'

type Variant = 'broadcast' | 'compact' | 'inline'

interface Props {
  pRadiant: number
  radiantName?: string | null
  direName?: string | null
  variant?: Variant
  /** Изменение за последнюю минуту в долях вероятности. null — сравнивать не с чем. */
  delta?: number | null
  /** Присутствует только у идущего матча. Включает предупреждение о задержке. */
  live?: { streamDelaySeconds: number }
}

/** Две плотности — это две строки таблицы, а не две ветки разметки. */
const SIZES: Record<Variant, { figure: string; bar: string; label: string }> = {
  broadcast: { figure: 'text-hero', bar: 'h-3', label: 'text-lead' },
  compact: { figure: 'text-lead', bar: 'h-2', label: 'text-body' },
  inline: { figure: 'text-body', bar: 'h-1.5', label: 'text-micro' },
}

function Delta({ delta }: { delta: number }) {
  const points = Math.abs(delta) * 100
  if (points < 0.05) return null
  return (
    <span className={cn('text-micro', delta > 0 ? 'text-radiant' : 'text-dire')}>
      {delta > 0 ? '▲' : '▼'} {points.toFixed(1)}
    </span>
  )
}

/**
 * Единственное число, ради которого существует продукт.
 *
 * Предупреждение о задержке живёт внутри, а не рядом. Инвариант 2 требует, чтобы оно
 * стояло у каждого live-числа; соседний элемент можно забыть поставить на новом экране,
 * часть примитива — нельзя. Броадкастный язык, уводящий вторичный текст в тень, делает
 * такую страховку обязательной, а не желательной.
 */
export function ProbabilityDisplay({
  pRadiant,
  radiantName,
  direName,
  variant = 'compact',
  delta = null,
  live,
}: Props) {
  const size = SIZES[variant]
  const radiantPct = Math.round(pRadiant * 1000) / 10

  return (
    <div className="space-y-1.5">
      <div className={cn('flex items-baseline justify-between gap-3', size.label)}>
        <TeamName name={radiantName} side="radiant" />
        <TeamName name={direName} side="dire" />
      </div>

      <div className={cn('flex items-baseline justify-between gap-3 font-mono', size.figure)}>
        <span className="flex items-baseline gap-2">
          {formatPercent(pRadiant, 1)}
          {delta !== null && <Delta delta={delta} />}
        </span>
        <span className="text-ink-dim">{formatPercent(1 - pRadiant, 1)}</span>
      </div>

      <div
        className={cn('flex overflow-hidden rounded-full bg-dire', size.bar)}
        role="meter"
        aria-valuenow={radiantPct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Вероятность победы Radiant"
      >
        <div
          className="bg-radiant transition-all duration-500"
          style={{ width: `${radiantPct}%` }}
        />
      </div>

      {live && <StreamDelayNotice delaySeconds={live.streamDelaySeconds} />}
    </div>
  )
}
