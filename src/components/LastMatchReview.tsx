import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { matchDetailQuery } from '@/api/queries'
import type { RecentMatch } from '@/api/types'
import { decidedLabel, decidedMinute } from '@/lib/decided'
import { Surface } from '@/ui/Surface'
import { TeamName } from '@/ui/TeamName'
import { ProbabilityChart } from './ProbabilityChart'
import { TierBadge } from './TierBadge'

const DAY_MONTH = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })

/**
 * The latest finished match, large - what the home page shows while nothing of the selected
 * tier is live.
 *
 * The feed's own curve is thinned to about thirty points for a sparkline and can skip the very
 * dip that makes a match interesting, so the full curve and the events come from the match
 * card. Until they arrive the thinned curve is drawn, and the label may change once.
 */
export function LastMatchReview({ match }: { match: RecentMatch }) {
  const detail = useQuery(matchDetailQuery(match.match_id))
  const curve = detail.data?.curve ?? match.curve
  // The thinned feed curve can skip the dip that decided the match, so the caption is a claim
  // that must wait for the full curve - only the chart draws the thinned one in the meantime.
  const full = detail.data?.curve
  const decided = full ? decidedMinute(full, match.radiant_win) : { kind: 'none' as const }
  const label = decidedLabel(decided)
  const winnerSide = match.radiant_win ? 'radiant' : 'dire'
  const winner = match.radiant_win ? match.radiant : match.dire

  return (
    <Surface level="raised" className="space-y-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-micro uppercase text-ink-faint">Последний матч</span>
          <TierBadge tier={match.tier} />
          {(match.league_name ?? match.league_id) !== null && (
            <span className="truncate text-body text-ink-dim">
              {match.league_name ?? `Лига ${match.league_id}`}
            </span>
          )}
        </div>
        {match.started_at && (
          <span className="font-mono text-micro text-ink-faint">
            {DAY_MONTH.format(new Date(match.started_at))}
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-3 text-body">
        <TeamName name={match.radiant.name} side="radiant" />
        <TeamName name={match.dire.name} side="dire" />
      </div>

      <ProbabilityChart
        curve={curve}
        events={detail.data?.timeline ?? []}
        marker={decided.kind === 'decided' ? decided.minute : null}
        height={220}
      />

      <div className="flex flex-wrap items-baseline justify-between gap-3 text-micro text-ink-faint">
        <span>
          Победа <TeamName name={winner.name} side={winnerSide} />
          {label && (
            <>
              {' · '}
              <span className="text-ink-dim">{label}</span>
            </>
          )}
        </span>
        <Link
          to="/match/$matchId"
          params={{ matchId: String(match.match_id) }}
          className="text-ink-dim underline-offset-2 hover:underline"
        >
          к матчу →
        </Link>
      </div>
    </Surface>
  )
}
