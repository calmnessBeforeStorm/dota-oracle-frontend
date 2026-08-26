import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createRoute } from '@tanstack/react-router'

import { matchDetailQuery } from '@/api/queries'
import type { PredictionPoint } from '@/api/types'
import { subscribeToMatch } from '@/api/ws'
import { ProbabilityChart } from '@/components/ProbabilityChart'
import { SeriesScore } from '@/components/SeriesScore'
import { WinProbabilityBar } from '@/components/WinProbabilityBar'
import { rootRoute } from './root'

/** F2 + F5: match card with a live-updating probability curve. */
function MatchPage() {
  const { matchId } = matchRoute.useParams()
  const id = Number(matchId)
  const { data, isLoading, isError } = useQuery(matchDetailQuery(id))
  const [liveCurve, setLiveCurve] = useState<PredictionPoint[]>([])
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!data?.is_live) return
    return subscribeToMatch(
      id,
      (update) =>
        setLiveCurve((prev) =>
          // The poller can re-emit a minute; keep one point per minute, latest wins.
          [...prev.filter((p) => p.minute !== update.minute), update].sort(
            (a, b) => a.minute - b.minute,
          ),
        ),
      setConnected,
    )
  }, [id, data?.is_live])

  if (isLoading) return <p className="text-neutral-500">Загрузка…</p>
  if (isError || !data) return <p className="text-dire">Матч не найден</p>

  const curve = [...data.curve, ...liveCurve.filter((p) => !data.curve.some((c) => c.minute === p.minute))]
  const latest = curve.at(-1)

  return (
    <article className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">
          {data.radiant.name ?? 'Radiant'} — {data.dire.name ?? 'Dire'}
        </h1>
        <div className="flex items-center gap-3">
          <SeriesScore series={data.series} />
          {data.is_live && (
            <span className={connected ? 'text-xs text-radiant' : 'text-xs text-neutral-500'}>
              {connected ? '● live' : '○ переподключение'}
            </span>
          )}
        </div>
      </header>

      {latest && (
        <WinProbabilityBar
          pRadiant={latest.p_radiant}
          radiantName={data.radiant.name}
          direName={data.dire.name}
        />
      )}

      <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
        <h2 className="mb-4 text-sm text-neutral-400">Вероятность победы Radiant по минутам</h2>
        <ProbabilityChart curve={curve} />
      </section>
    </article>
  )
}

export const matchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/match/$matchId',
  component: MatchPage,
})
