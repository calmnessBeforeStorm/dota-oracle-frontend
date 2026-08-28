import { Link } from '@tanstack/react-router'

import type { SeriesResult, TournamentStageInfo } from '@/api/types'
import { seriesFormatLabel } from '@/lib/series'
import { cn, formatDateRange } from '@/lib/utils'

/**
 * F4: results grouped by stage, oldest first.
 *
 * A list rather than a bracket, and the empty state says why: the backend has no round and
 * no progression to draw one from. Series whose stage was never determined go under their
 * own heading rather than being hidden - 13154 of our 13588 series are in that state, and
 * silently dropping them would make the page disagree with the counts above it.
 */
/**
 * The status column says something only when there is something to say.
 *
 * A decided series needs no word: the winner is already the brighter of the two names.
 *
 * The third state is **unknown**, and calling it "in progress" would be a lie about games
 * finished months ago. `winner_team_id` is filled by `link-stages`, which only runs for
 * leagues mapped to Liquipedia, so most series carry no outcome. It cannot be inferred from
 * the score either: without the format, 1:0 is equally a completed Bo1 and an abandoned Bo3
 * (spec section 5.5).
 */
function outcome(result: SeriesResult): { label: string; title: string; tone: string } {
  if (result.is_draw) {
    return { label: 'ничья', title: 'Bo2 закончился 1–1', tone: 'text-amber-400' }
  }
  if (result.winner_team_id === null) {
    return {
      label: '—',
      title:
        'Исход серии неизвестен: формат не определён, поэтому счёт не говорит, закончена ли она',
      tone: 'text-neutral-700',
    }
  }
  return { label: '', title: '', tone: '' }
}

function SeriesRow({ result }: { result: SeriesResult }) {
  const { label, title, tone } = outcome(result)
  const winnerIsA = !result.is_draw && result.winner_team_id === result.team_a.team_id
  const winnerIsB = !result.is_draw && result.winner_team_id === result.team_b.team_id

  return (
    <li className="flex items-center gap-3 border-t border-neutral-800/70 px-4 py-2 text-sm">
      <span className="w-20 shrink-0 font-mono text-xs text-neutral-600">
        {result.played_at ? formatDateRange(result.played_at, null) : '—'}
      </span>

      <span
        className={cn(
          'min-w-0 flex-1 truncate text-right',
          winnerIsA ? 'font-medium text-neutral-100' : 'text-neutral-500',
        )}
      >
        {result.team_a.name ?? '—'}
      </span>
      <span className="shrink-0 font-mono">
        {result.score_a}:{result.score_b}
      </span>
      <span
        className={cn(
          'min-w-0 flex-1 truncate',
          winnerIsB ? 'font-medium text-neutral-100' : 'text-neutral-500',
        )}
      >
        {result.team_b.name ?? '—'}
      </span>

      <span className={cn('w-12 shrink-0 text-center text-xs', tone)} title={title}>
        {label}
      </span>
      <span className="w-10 shrink-0 text-right font-mono text-xs text-neutral-600">
        {result.format ? seriesFormatLabel(result.format) : '—'}
      </span>
      {/* Links to the first map of the series - a series has no card of its own, and the
          first map is where a reader starts. */}
      {result.match_ids.length > 0 ? (
        <Link
          to="/match/$matchId"
          params={{ matchId: String(result.match_ids[0]) }}
          className="hidden w-16 shrink-0 text-right text-xs text-neutral-600 hover:text-neutral-300 sm:block"
        >
          {result.maps} карт
        </Link>
      ) : (
        <span className="hidden w-16 shrink-0 text-right text-xs text-neutral-700 sm:block">—</span>
      )}
    </li>
  )
}

export function SeriesResults({
  results,
  stages,
}: {
  results: SeriesResult[]
  stages: TournamentStageInfo[]
}) {
  if (results.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-neutral-800 py-10 text-center text-sm text-neutral-500">
        Серий этого турнира у нас нет
      </p>
    )
  }

  const byStage = new Map<number | null, SeriesResult[]>()
  for (const result of results) {
    const key = result.stage_id
    if (!byStage.has(key)) byStage.set(key, [])
    byStage.get(key)!.push(result)
  }

  // Stages in their own order first, then whatever had no stage.
  const ordered: Array<[TournamentStageInfo | null, SeriesResult[]]> = []
  for (const stage of stages) {
    const group = byStage.get(stage.stage_id)
    if (group) ordered.push([stage, group])
  }
  const unstaged = byStage.get(null)
  if (unstaged) ordered.push([null, unstaged])

  return (
    <div className="space-y-4">
      {ordered.map(([stage, group]) => (
        <section
          key={stage?.stage_id ?? 'unstaged'}
          className="rounded-lg border border-neutral-800 bg-neutral-900"
        >
          <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-neutral-800 px-4 py-2.5">
            <h3 className="text-sm font-medium">{stage?.name ?? 'Без стадии'}</h3>
            <span className="text-xs text-neutral-600">
              {stage ? `${group.length} серий` : `${group.length} серий · формат неизвестен`}
            </span>
          </header>
          <ol>
            {group.map((result) => (
              <SeriesRow key={result.series_id} result={result} />
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}
