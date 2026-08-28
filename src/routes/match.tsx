import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createRoute } from '@tanstack/react-router'

import { matchDetailQuery } from '@/api/queries'
import type { PredictionPoint } from '@/api/types'
import { subscribeToMatch } from '@/api/ws'
import { DraftStrip } from '@/components/DraftStrip'
import { EventTimeline } from '@/components/EventTimeline'
import { ProbabilityChart } from '@/components/ProbabilityChart'
import { Roster } from '@/components/Roster'
import { SeriesScore } from '@/components/SeriesScore'
import { StreamDelayNotice } from '@/components/StreamDelayNotice'
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
          {/* Kills on this map, kept visually apart from the series score beside it: one is
              the game, the other is the match, and reading one as the other is the whole
              reason section 5.5 exists. */}
          {data.radiant_score !== null && data.dire_score !== null && (
            <span className="font-mono text-sm">
              <span className="text-radiant">{data.radiant_score}</span>
              <span className="px-1 text-neutral-600">—</span>
              <span className="text-dire">{data.dire_score}</span>
            </span>
          )}
          <SeriesScore series={data.series} />
          {data.is_live && (
            <span className={connected ? 'text-xs text-radiant' : 'text-xs text-neutral-500'}>
              {connected ? '● live' : '○ переподключение'}
            </span>
          )}
        </div>
      </header>

      {latest && (
        <div className="space-y-1.5">
          <WinProbabilityBar
            pRadiant={latest.p_radiant}
            radiantName={data.radiant.name}
            direName={data.dire.name}
          />
          {data.is_live && <StreamDelayNotice delaySeconds={data.stream_delay_seconds} />}
        </div>
      )}

      <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
        <h2 className="mb-4 text-sm text-neutral-400">Вероятность победы Radiant по минутам</h2>
        <ProbabilityChart curve={curve} events={data.timeline} />
      </section>

      {/* The live scoreboard groups the draft by side; only a parsed match carries the
          real sequence. */}
      <DraftStrip draft={data.draft} orderIsKnown={!data.is_live} />

      {data.players.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Roster
            players={data.players.filter((p) => p.is_radiant)}
            side="radiant"
            teamName={data.radiant.name}
          />
          <Roster
            players={data.players.filter((p) => !p.is_radiant)}
            side="dire"
            teamName={data.dire.name}
          />
        </div>
      )}

      {data.timeline.length > 0 && (
        <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
          <h2 className="mb-2 text-sm text-neutral-400">
            Ключевые события{' '}
            <span className="text-neutral-600">
              · {data.timeline.length}, время от гонга
            </span>
          </h2>
          {/* Capped and scrollable: a long map produces dozens of events, and letting them
              push the chart and rosters off the screen inverts what the card is for. */}
          <div className="max-h-80 overflow-y-auto pr-1">
            <EventTimeline events={data.timeline} />
          </div>
        </section>
      )}
    </article>
  )
}

export const matchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/match/$matchId',
  component: MatchPage,
})
