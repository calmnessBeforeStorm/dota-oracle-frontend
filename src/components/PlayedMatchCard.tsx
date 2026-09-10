import { Link } from '@tanstack/react-router'

import type { RecentMatch } from '@/api/types'
import { seriesIsKnown, seriesScoreLabel } from '@/lib/series'
import { formatPercent } from '@/lib/utils'
import { Sparkline } from '@/ui/Sparkline'
import { Surface } from '@/ui/Surface'
import { TeamName } from '@/ui/TeamName'
import { TierBadge } from './TierBadge'

const DAY_MONTH = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })

/**
 * Сыгранный матч в ленте главной.
 *
 * Карточка не выносит вердикта. Отметка «угадала», посчитанная по последней точке кривой,
 * почти всегда положительна: на сороковой минуте исход уже решён. Лента зелёных галочек
 * на первом экране — худшая форма лести, какую может позволить себе этот продукт.
 *
 * Вместо неё — проверяемое утверждение: что модель обещала на десятой минуте, и чем всё
 * кончилось. Вердикт складывает зритель.
 */
export function PlayedMatchCard({ match }: { match: RecentMatch }) {
  const winner = match.radiant_win ? 'radiant' : 'dire'

  return (
    <Link to="/match/$matchId" params={{ matchId: String(match.match_id) }} className="block">
      <Surface level="raised" className="p-4 transition hover:bg-line">
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

        <div className="my-2">
          <Sparkline points={match.curve} outcome={winner} />
        </div>

        <div className="flex items-baseline justify-between gap-3 text-micro text-ink-faint">
          <span>
            на 10-й минуте{' '}
            <span className="font-mono text-ink-dim">
              {match.p_at_ten === null ? '—' : formatPercent(match.p_at_ten, 1)}
            </span>{' '}
            за <TeamName name={match.radiant.name} side="radiant" />
          </span>
          {seriesIsKnown(match.series) && (
            <span className="font-mono">{seriesScoreLabel(match.series)}</span>
          )}
        </div>
      </Surface>
    </Link>
  )
}
