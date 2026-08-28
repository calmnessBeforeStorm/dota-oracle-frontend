import { useQuery } from '@tanstack/react-query'
import { createRoute } from '@tanstack/react-router'
import { useState } from 'react'

import { modelMetricsQuery } from '@/api/queries'
import type { ModelMetrics } from '@/api/types'
import { CalibrationChart } from '@/components/CalibrationChart'
import { formatMetric, isSmallSample, versionChoices } from '@/lib/metrics'
import { cn } from '@/lib/utils'
import { rootRoute } from './root'

/**
 * F6: public accuracy dashboard. Not cosmetic - without a visible calibration curve there is
 * no reason to trust the numbers on the rest of the site.
 *
 * Two rules the page must not break. Metrics are always shown per minute bucket, because the
 * averaged figure lies: predicting minute 40 is trivial and a model that is useless early
 * still posts a respectable mean (spec section 7.2). And nothing here is ever rounded up
 * into looking better than it is - an empty slice says so instead of showing zeroes, and
 * every row carries the sample size it was computed from.
 */
function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="mt-1 font-mono text-base">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-neutral-600">{hint}</div>}
    </div>
  )
}

function EmptyState({ data }: { data: ModelMetrics }) {
  const elsewhere = data.versions.filter((v) => v.version !== data.model_version)

  return (
    <div className="rounded-lg border border-dashed border-neutral-800 px-6 py-12 text-center">
      <p className="text-neutral-400">
        У версии <span className="font-mono">{data.model_version}</span> пока нет прогнозов,
        сверенных с исходом.
      </p>
      <p className="mx-auto mt-3 max-w-xl text-sm text-neutral-500">
        Прогноз попадает сюда только после того, как его матч завершился и результат приехал из
        внешнего источника. Показывать вместо этого калибровку прошлой версии нельзя: она ничего
        не говорит о числах, которые вы видите на сайте сейчас.
      </p>
      {elsewhere.length > 0 && (
        <p className="mt-3 text-sm text-neutral-500">
          Данные есть у других версий — они в переключателе выше.
        </p>
      )}
    </div>
  )
}

function AccuracyPage() {
  const [version, setVersion] = useState<string | undefined>(undefined)
  const { data, isLoading } = useQuery(modelMetricsQuery(version))

  if (isLoading) return <p className="text-neutral-500">Загрузка…</p>
  if (!data) return <p className="text-neutral-500">Метрики недоступны</p>

  const versions = versionChoices(data)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Точность модели</h1>
        <p className="mt-1 max-w-2xl text-sm text-neutral-500">
          Каждый выданный прогноз сохраняется и потом сверяется с тем, чем матч закончился. Ниже —
          результат этой сверки, без усреднения по всей игре: на 40-й минуте исход почти решён, и
          общая цифра польстила бы любой модели.
        </p>
      </header>

      {versions.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {versions.map((info) => (
            <button
              key={info.version}
              type="button"
              onClick={() => setVersion(info.version)}
              className={cn(
                'rounded-full border px-3 py-1 text-sm transition-colors',
                info.version === data.model_version
                  ? 'border-neutral-600 bg-neutral-800 text-neutral-100'
                  : 'border-neutral-800 text-neutral-400 hover:border-neutral-700',
              )}
            >
              <span className="font-mono">{info.version}</span>
              <span className="ml-2 text-xs text-neutral-500">{info.sample_size}</span>
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-4">
        <Metric label="Версия модели" value={data.model_version} />
        <Metric
          label="Выборка"
          value={`${data.sample_size}`}
          hint={`${data.matches} ${data.matches === 1 ? 'матч' : 'матчей'}`}
        />
        <Metric label="Log loss" value={formatMetric(data.log_loss)} hint="0.693 — монетка" />
        <Metric label="ECE" value={formatMetric(data.ece, 3)} hint="разрыв обещания и факта" />
      </div>

      {isSmallSample(data) && (
        <p className="rounded-lg border border-amber-900/60 bg-amber-950/30 px-4 py-3 text-sm text-amber-200/80">
          Матчей пока мало ({data.matches}), и цифрам ниже верить рано. Прогнозов много только
          потому, что каждый матч даёт их несколько десятков, — но все они об одной и той же
          игре, так что считать их независимыми измерениями нельзя.
        </p>
      )}

      {data.sample_size === 0 ? (
        <EmptyState data={data} />
      ) : (
        <>
          <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
            <h2 className="mb-2 text-sm text-neutral-400">Калибровка</h2>
            <p className="mb-4 text-xs text-neutral-500">
              Пунктир — идеальная калибровка: из ста матчей, где обещано 70%, побеждает
              семьдесят. Размер точки — сколько прогнозов попало в корзину.
            </p>
            <CalibrationChart bins={data.reliability} />
          </section>

          <section className="rounded-lg border border-neutral-800 bg-neutral-900">
            <header className="border-b border-neutral-800 px-4 py-2.5">
              <h2 className="text-sm text-neutral-400">По минутам матча</h2>
            </header>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-neutral-500">
                  <th className="px-4 py-1.5 text-left font-normal">Минута</th>
                  <th className="py-1.5 text-right font-normal">Прогнозов</th>
                  <th className="py-1.5 text-right font-normal">Log loss</th>
                  <th className="py-1.5 text-right font-normal">Brier</th>
                  <th className="px-4 py-1.5 text-right font-normal">Угадано</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {data.by_minute.map((row) => (
                  <tr key={row.bucket} className="border-t border-neutral-800/70">
                    <td className="px-4 py-2">{row.bucket}</td>
                    <td className="py-2 text-right text-neutral-500">{row.count}</td>
                    <td className="py-2 text-right">{row.log_loss.toFixed(4)}</td>
                    <td className="py-2 text-right">{row.brier.toFixed(4)}</td>
                    <td className="px-4 py-2 text-right text-neutral-400">
                      {(row.accuracy * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-neutral-800 px-4 py-2 text-xs text-neutral-500">
              Доля угаданных исходов приведена потому, что её спрашивают, а не потому, что по ней
              стоит судить: модель, которая права в 70% случаев и при этом самоуверенна, хуже
              честной с 68%.
            </p>
          </section>
        </>
      )}
    </div>
  )
}

export const accuracyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/accuracy',
  component: AccuracyPage,
})
