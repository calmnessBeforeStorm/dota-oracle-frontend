import { useQuery } from '@tanstack/react-query'
import { createRoute } from '@tanstack/react-router'

import { liveMatchesQuery } from '@/api/queries'
import { MatchCard } from '@/components/MatchCard'
import { rootRoute } from './root'

/** F1: live feed of Tier 1 matches. */
function LivePage() {
  const { data, isLoading, isError } = useQuery(liveMatchesQuery())

  if (isLoading) return <p className="text-neutral-500">Загрузка…</p>
  if (isError) return <p className="text-dire">Не удалось загрузить матчи</p>

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-neutral-800 py-16 text-center">
        <p className="text-neutral-400">Сейчас нет идущих матчей Tier 1</p>
        <p className="mt-1 text-sm text-neutral-600">Расписание — на странице «Турниры»</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {data.map((match) => (
        <MatchCard key={match.match_id} match={match} />
      ))}
    </div>
  )
}

export const liveRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: LivePage,
})
