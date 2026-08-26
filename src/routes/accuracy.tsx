import { useQuery } from '@tanstack/react-query'
import { createRoute } from '@tanstack/react-router'

import { modelMetricsQuery } from '@/api/queries'
import { rootRoute } from './root'

/**
 * F6: public accuracy dashboard. Not cosmetic - without a visible calibration curve there is
 * no reason to trust the numbers on the rest of the site.
 *
 * Metrics are always shown per minute bucket: the averaged figure lies, because predicting
 * minute 40 is trivial (spec section 7.2).
 */
function AccuracyPage() {
  const { data, isLoading } = useQuery(modelMetricsQuery())

  if (isLoading) return <p className="text-neutral-500">Загрузка…</p>

  const buckets = Object.keys(data?.log_loss_by_minute ?? {})

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Точность модели</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Модель: <span className="font-mono">{data?.model_version ?? '—'}</span> · выборка:{' '}
          {data?.sample_size ?? 0} прогнозов · ECE: {data?.ece?.toFixed(3) ?? '—'}
        </p>
      </header>

      {buckets.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-800 py-16 text-center text-neutral-500">
          Метрик пока нет: модель обучается на фазе 4.
        </p>
      ) : (
        <table className="w-full text-sm">
          <thead className="text-left text-neutral-500">
            <tr>
              <th className="py-2">Минута</th>
              <th className="py-2">Log loss</th>
              <th className="py-2">Brier</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {buckets.map((bucket) => (
              <tr key={bucket} className="border-t border-neutral-800">
                <td className="py-2">{bucket}</td>
                <td className="py-2">{data?.log_loss_by_minute[bucket]?.toFixed(4)}</td>
                <td className="py-2">{data?.brier_by_minute[bucket]?.toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export const accuracyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/accuracy',
  component: AccuracyPage,
})
