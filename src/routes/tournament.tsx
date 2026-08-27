import { useQuery } from '@tanstack/react-query'
import { createRoute } from '@tanstack/react-router'

import { tournamentDetailQuery } from '@/api/queries'
import type { TournamentStageInfo } from '@/api/types'
import { TierBadge } from '@/components/TierBadge'
import { seriesFormatLabel } from '@/lib/series'
import { formatDateRange, formatPrizePool } from '@/lib/utils'
import { rootRoute } from './root'

const STAGE_TYPE_LABELS: Record<string, string> = {
  group: 'группа',
  playoff: 'плей-офф',
  swiss: 'швейцарка',
}

function StageRow({ stage }: { stage: TournamentStageInfo }) {
  return (
    <tr className="border-t border-neutral-800">
      <td className="py-2 pr-4">{stage.name}</td>
      <td className="py-2 pr-4 text-neutral-400">
        {STAGE_TYPE_LABELS[stage.stage_type] ?? stage.stage_type}
      </td>
      <td className="py-2 pr-4">
        {stage.default_format ? (
          <span className="rounded bg-neutral-800 px-1.5 py-0.5 font-mono text-xs">
            {seriesFormatLabel(stage.default_format)}
          </span>
        ) : (
          <span className="text-neutral-600" title="Формат со страницы не считался">
            —
          </span>
        )}
      </td>
      <td className="py-2 pr-4 font-mono text-neutral-400">
        {formatDateRange(stage.starts_at, stage.ends_at)}
      </td>
      <td className="py-2 text-right font-mono text-neutral-400">{stage.series}</td>
    </tr>
  )
}

/** F4: the tournament page. */
function TournamentPage() {
  const { leagueId } = tournamentRoute.useParams()
  const { data, isLoading, isError } = useQuery(tournamentDetailQuery(Number(leagueId)))

  if (isLoading) return <p className="text-neutral-500">Загрузка…</p>
  if (isError || !data) return <p className="text-dire">Турнир не найден</p>

  return (
    <article className="space-y-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <TierBadge tier={data.tier} />
          <h1 className="text-xl font-semibold">{data.name ?? `Лига ${data.league_id}`}</h1>
          {data.is_lan !== null && (
            <span className="rounded bg-neutral-800 px-1.5 py-0.5 text-xs text-neutral-400">
              {data.is_lan ? 'LAN' : 'online'}
            </span>
          )}
        </div>
        <p className="text-sm text-neutral-500">
          {formatDateRange(data.first_match, data.last_match)} · {formatPrizePool(data.prize_pool)}{' '}
          · {data.maps} карт · {data.series_total} серий
        </p>
        {data.liquipedia_slug && (
          <p className="text-xs text-neutral-600">
            Разметка тира и форматов —{' '}
            <a
              className="underline hover:text-neutral-400"
              href={`https://liquipedia.net/dota2/${encodeURI(data.liquipedia_slug)}`}
              target="_blank"
              rel="noreferrer"
            >
              {data.liquipedia_slug}
            </a>
          </p>
        )}
      </header>

      <section>
        <h2 className="mb-3 text-sm text-neutral-400">Стадии и форматы серий</h2>
        {data.stages.length === 0 ? (
          <p className="rounded-lg border border-dashed border-neutral-800 py-10 text-center text-sm text-neutral-500">
            Стадии не размечены: турнир ещё не сопоставлен с Liquipedia либо его страница
            описывает формат иначе.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-neutral-500">
              <tr>
                <th className="pb-2 pr-4 font-normal">Стадия</th>
                <th className="pb-2 pr-4 font-normal">Тип</th>
                <th className="pb-2 pr-4 font-normal">Формат</th>
                <th className="pb-2 pr-4 font-normal">Даты</th>
                <th className="pb-2 text-right font-normal">Серий</th>
              </tr>
            </thead>
            <tbody>
              {data.stages.map((stage) => (
                <StageRow key={stage.stage_id} stage={stage} />
              ))}
            </tbody>
          </table>
        )}
      </section>

      {(data.series_drawn > 0 || data.series_without_format > 0) && (
        <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-4 text-sm">
          {data.series_drawn > 0 && (
            <p>
              Ничьих 1–1 в Bo2: <span className="font-mono text-amber-400">{data.series_drawn}</span>
            </p>
          )}
          {data.series_without_format > 0 && (
            <p className="text-neutral-500">
              Серий без формата:{' '}
              <span className="font-mono">{data.series_without_format}</span> — стадию по датам
              определить не удалось, формат намеренно оставлен неизвестным.
            </p>
          )}
        </section>
      )}
    </article>
  )
}

export const tournamentRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tournaments/$leagueId',
  component: TournamentPage,
})
