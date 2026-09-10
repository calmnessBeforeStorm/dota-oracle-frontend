import { Link } from '@tanstack/react-router'

import type { LiveMatch } from '@/api/types'
import { formatGameTime } from '@/lib/utils'
import { ProbabilityDisplay } from '@/ui/ProbabilityDisplay'
import { Surface } from '@/ui/Surface'
import { SeriesScore } from './SeriesScore'
import { TierBadge } from './TierBadge'

/** F1: одна карточка в live-ленте. */
export function MatchCard({ match }: { match: LiveMatch }) {
  return (
    <Link to="/match/$matchId" params={{ matchId: String(match.match_id) }} className="block">
      {/* Свечение стороны, которая ведёт: в ленте из шести карточек видно, где напряжение. */}
      <Surface level="lit" lead={match.p_radiant >= 0.5 ? 'radiant' : 'dire'} className="p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <TierBadge tier={match.tier} />
            {/* Ни имени, ни номера — значит лига неизвестна. «Лига null» была бы
                подписью, которая выглядит как данные и ими не является. */}
            {(match.league_name ?? match.league_id) !== null && (
              <span className="truncate text-body text-ink-dim">
                {match.league_name ?? `Лига ${match.league_id}`}
              </span>
            )}
          </div>
          <SeriesScore series={match.series} />
        </div>

        <ProbabilityDisplay
          pRadiant={match.p_radiant}
          radiantName={match.radiant.name}
          direName={match.dire.name}
          variant="compact"
          live={{ streamDelaySeconds: match.stream_delay_s }}
        />

        <div className="mt-3 flex items-center justify-between text-body text-ink-faint">
          <span className="font-mono">{formatGameTime(match.game_time)}</span>
          <span className="font-mono">
            {match.radiant_score} — {match.dire_score}
          </span>
        </div>
      </Surface>
    </Link>
  )
}
