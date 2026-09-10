import { Link } from '@tanstack/react-router'

import type { ModelMetrics } from '@/api/types'
import { formatMetric, isSmallSample, matchesLabel } from '@/lib/metrics'
import { Surface } from '@/ui/Surface'

/**
 * Состояние модели одной строкой над лентой.
 *
 * Те же правила, что на странице точности: знаменатель — матчи, а не прогнозы; метрика
 * без данных рисуется прочерком; тонкая выборка говорит о себе вслух вместо того, чтобы
 * показать красивое число.
 */
export function ModelStrip({ data }: { data: ModelMetrics }) {
  return (
    <Surface level="raised" className="flex flex-wrap items-baseline gap-x-6 gap-y-1 px-4 py-2.5">
      <span className="font-mono text-micro text-ink-dim">{data.model_version}</span>
      <span className="text-micro text-ink-faint">
        сверено <span className="font-mono text-ink-dim">{matchesLabel(data.matches)}</span>
      </span>
      <span className="text-micro text-ink-faint">
        log loss <span className="font-mono text-ink-dim">{formatMetric(data.log_loss)}</span>
      </span>
      <span className="text-micro text-ink-faint">
        ECE <span className="font-mono text-ink-dim">{formatMetric(data.ece, 3)}</span>
      </span>
      {isSmallSample(data) && (
        <span className="text-micro text-ink-faint">сверенных матчей мало, цифрам верить рано</span>
      )}
      <Link to="/accuracy" className="ml-auto text-micro text-ink-faint hover:text-ink">
        точность →
      </Link>
    </Surface>
  )
}
