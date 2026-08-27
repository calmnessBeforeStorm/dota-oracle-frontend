import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, createRoute } from '@tanstack/react-router'

import { tournamentsQuery } from '@/api/queries'
import type { TournamentSummary } from '@/api/types'
import { TierBadge } from '@/components/TierBadge'
import { cn, formatPrizePool, formatDateRange } from '@/lib/utils'
import { rootRoute } from './root'

const TABS = [
  { key: 'current', label: 'Текущие' },
  { key: 'upcoming', label: 'Предстоящие' },
  { key: 'past', label: 'Прошедшие' },
  { key: 'all', label: 'Все' },
] as const

type Tab = (typeof TABS)[number]['key']

function TournamentRow({ tournament }: { tournament: TournamentSummary }) {
  return (
    <Link
      to="/tournaments/$leagueId"
      params={{ leagueId: String(tournament.league_id) }}
      className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3 transition hover:border-neutral-700"
    >
      <TierBadge tier={tournament.tier} />
      <span className="min-w-0 flex-1 truncate font-medium">
        {tournament.name ?? `Лига ${tournament.league_id}`}
      </span>
      <span className="font-mono text-sm text-neutral-400">
        {formatDateRange(tournament.first_match, tournament.last_match)}
      </span>
      <span className="w-24 text-right font-mono text-sm text-neutral-400">
        {formatPrizePool(tournament.prize_pool)}
      </span>
      <span className="w-16 text-right font-mono text-sm text-neutral-500">
        {tournament.maps} карт
      </span>
    </Link>
  )
}

/** F3: Liquipedia-style tournament calendar. */
function TournamentsPage() {
  const [status, setStatus] = useState<Tab>('all')
  const { data, isLoading, isError } = useQuery(tournamentsQuery(status))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatus(tab.key)}
            className={cn(
              'rounded px-3 py-1.5 text-sm transition',
              status === tab.key
                ? 'bg-neutral-100 text-neutral-900'
                : 'bg-neutral-900 text-neutral-400 hover:text-neutral-100',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading && <p className="text-neutral-500">Загрузка…</p>}
      {isError && <p className="text-dire">Не удалось загрузить турниры</p>}

      {data && data.length === 0 && (
        <p className="rounded-lg border border-dashed border-neutral-800 py-16 text-center text-neutral-500">
          В этой категории турниров нет
        </p>
      )}

      {data && data.length > 0 && (
        <>
          <p className="text-sm text-neutral-500">{data.length} турниров</p>
          <div className="space-y-2">
            {data.map((tournament) => (
              <TournamentRow key={tournament.league_id} tournament={tournament} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export const tournamentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tournaments',
  component: TournamentsPage,
})
