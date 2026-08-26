import { Link } from '@tanstack/react-router'

import type { LiveMatch } from '@/api/types'
import { formatGameTime } from '@/lib/utils'
import { SeriesScore } from './SeriesScore'
import { StreamDelayNotice } from './StreamDelayNotice'
import { WinProbabilityBar } from './WinProbabilityBar'

/** F1: one card in the live feed. */
export function MatchCard({ match }: { match: LiveMatch }) {
  return (
    <Link
      to="/match/$matchId"
      params={{ matchId: String(match.match_id) }}
      className="block rounded-lg border border-neutral-800 bg-neutral-900 p-4 transition hover:border-neutral-700"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="truncate text-sm text-neutral-400">{match.league_name ?? 'Турнир'}</span>
        <SeriesScore series={match.series} />
      </div>

      <WinProbabilityBar
        pRadiant={match.p_radiant}
        radiantName={match.radiant.name}
        direName={match.dire.name}
      />

      <div className="mt-3 flex items-center justify-between text-sm text-neutral-400">
        <span className="font-mono">{formatGameTime(match.game_time)}</span>
        <span className="font-mono">
          {match.radiant_score} — {match.dire_score}
        </span>
      </div>
      <StreamDelayNotice delaySeconds={match.stream_delay_s} />
    </Link>
  )
}
