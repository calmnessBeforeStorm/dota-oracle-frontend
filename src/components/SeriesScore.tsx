import { cn } from '@/lib/utils'
import { seriesFormatLabel, seriesScoreLabel, seriesStatus, type Series } from '@/lib/series'

/**
 * Series score. The Bo2 draw is a first-class state here (spec section 5.5): rendering 1-1
 * as "no winner yet" is the bug this component exists to prevent.
 */
export function SeriesScore({ series, className }: { series: Series; className?: string }) {
  const status = seriesStatus(series)

  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      {series.format && (
        <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs uppercase text-neutral-400">
          {seriesFormatLabel(series.format)}
        </span>
      )}
      <span className={cn('font-mono', status === 'draw' && 'text-amber-400')}>
        {seriesScoreLabel(series)}
      </span>
      {series.is_conditional_game && (
        <span
          className="text-xs text-neutral-500"
          title="Эта карта играется только из-за счёта в серии"
        >
          решающая
        </span>
      )}
    </div>
  )
}
