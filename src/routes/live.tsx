import { useQuery } from '@tanstack/react-query'
import { createRoute } from '@tanstack/react-router'

import { liveMatchesQuery, modelMetricsQuery, recentMatchesQuery } from '@/api/queries'
import { MatchCard } from '@/components/MatchCard'
import { ModelStrip } from '@/components/ModelStrip'
import { PlayedMatchCard } from '@/components/PlayedMatchCard'
import { Empty, Loading } from '@/ui/Pending'
import { rootRoute } from './root'

/**
 * F1 плюс лента сыгранных.
 *
 * Один роут, а не два. Матчи Tier 1 идут несколько часов в сутки, и страница, осмысленная
 * только в эти часы, — это страница, которая большую часть времени сломана. Идущее
 * появляется сверху, когда оно есть; всё остальное время экран занимает то, что уже
 * сыграно.
 */
function HomePage() {
  const live = useQuery(liveMatchesQuery())
  const recent = useQuery(recentMatchesQuery())
  const metrics = useQuery(modelMetricsQuery())

  if (live.isLoading && recent.isLoading) return <Loading />

  const liveMatches = live.data ?? []
  const playedMatches = recent.data ?? []

  return (
    <div className="space-y-6">
      {metrics.data && <ModelStrip data={metrics.data} />}

      {liveMatches.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-body text-ink-faint">Идут сейчас</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {liveMatches.map((match) => (
              <MatchCard key={match.match_id} match={match} />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-body text-ink-faint">
          Сыграно <span className="opacity-70">· только матчи, по которым мы дали прогноз</span>
        </h2>
        {playedMatches.length === 0 ? (
          <Empty
            title="Сверенных матчей пока нет"
            hint="Матч попадает сюда после того, как закончился и его исход приехал из внешнего источника"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {playedMatches.map((match) => (
              <PlayedMatchCard key={match.match_id} match={match} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

export const liveRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})
