import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createRoute } from '@tanstack/react-router'

import { liveMatchesQuery, modelMetricsQuery, recentMatchesQuery } from '@/api/queries'
import { LastMatchReview } from '@/components/LastMatchReview'
import { MatchCard } from '@/components/MatchCard'
import { ModelStrip } from '@/components/ModelStrip'
import { PlayedMatchCard } from '@/components/PlayedMatchCard'
import { TierFilter } from '@/components/TierFilter'
import {
  TIER_OPTIONS,
  normaliseTier,
  readTiers,
  toggleTier,
  writeTiers,
  type Tier,
} from '@/lib/tiers'
import { Empty, Loading } from '@/ui/Pending'
import { rootRoute } from './root'

/**
 * F1 plus the played feed.
 *
 * One route, not two. Tier 1 matches run a few hours a day, and a page that only makes sense
 * during those hours is a page that is broken most of the time. What is live comes first when
 * there is any; the rest of the time the newest played match takes the screen, large, with the
 * point where it turned. The server drops amateur leagues from both feeds; the chips choose
 * among professional tiers.
 */
function HomePage() {
  const [tiers, setTiers] = useState<Tier[]>(readTiers)
  const live = useQuery(liveMatchesQuery())
  const recent = useQuery(recentMatchesQuery(20, tiers))
  const metrics = useQuery(modelMetricsQuery())

  if (live.isLoading && recent.isLoading) return <Loading />

  const feed = live.data ?? []
  const playedMatches = recent.data ?? []

  // The tier comes with the feed - the poller writes it into the snapshot - so the chips are
  // counted here rather than by a request: the feed is tens of entries, and counts for hidden
  // tiers are needed at once, otherwise "nothing is on" and "everything is filtered" look alike.
  const counts = feed.reduce<Record<Tier, number>>(
    (acc, match) => {
      const tier = normaliseTier(match.tier)
      acc[tier] += 1
      return acc
    },
    { tier1: 0, tier2: 0, tier3: 0, unknown: 0 },
  )
  const liveMatches = feed.filter((match) => tiers.includes(normaliseTier(match.tier)))
  const hidden = feed.length - liveMatches.length

  // Nothing of the selected tier on air: the newest played match takes the space, large,
  // and is not repeated among the cards.
  const [latest, ...older] = playedMatches
  const review = liveMatches.length === 0 ? latest : undefined
  const playedCards = review ? older : playedMatches

  const onToggle = (tier: Tier) => {
    const next = toggleTier(tiers, tier)
    setTiers(next)
    writeTiers(next)
  }

  const selectedLabels = TIER_OPTIONS.filter((option) => tiers.includes(option.key))
    .map((option) => option.label)
    .join(', ')

  return (
    <div className="space-y-6">
      {metrics.data && <ModelStrip data={metrics.data} />}

      <section className="space-y-3">
        <h2 className="text-body text-ink-faint">Идут сейчас</h2>
        <TierFilter selected={tiers} onToggle={onToggle} counts={counts} />

        {liveMatches.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {liveMatches.map((match) => (
              <MatchCard key={match.match_id} match={match} />
            ))}
          </div>
        ) : review ? (
          // One line, not the tall empty card: the review below is what fills the space.
          <p className="text-body text-ink-faint">
            Сейчас матчей {selectedLabels} нет
            {hidden > 0 &&
              ` · идут ${hidden} матчей в турнирах других уровней — включите их фильтром выше`}
          </p>
        ) : (
          <Empty
            title={`Матчей ${selectedLabels} сейчас нет`}
            hint={
              hidden > 0
                ? `Идут ${hidden} матчей в турнирах других уровней — включите их фильтром выше, если нужно`
                : 'Валв не отдаёт ни одной идущей лиговой игры прямо сейчас'
            }
          />
        )}
      </section>

      {review && <LastMatchReview match={review} />}

      {/* Heading rendered once: the review can consume the only played match, leaving neither
          heading nor body - a section that shows nothing is a section that is not there. */}
      {(playedMatches.length === 0 || playedCards.length > 0) && (
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
              {playedCards.map((match) => (
                <PlayedMatchCard key={match.match_id} match={match} />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export const liveRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: HomePage,
})
