import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import type { PredictionPoint } from '@/api/types'
import { formatPercent } from '@/lib/utils'

/** F2: probability curve over the course of the map. */
export function ProbabilityChart({ curve }: { curve: PredictionPoint[] }) {
  if (curve.length === 0) {
    return <p className="py-12 text-center text-sm text-neutral-500">Прогнозов пока нет</p>
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={curve} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
        <CartesianGrid stroke="#262626" vertical={false} />
        <XAxis
          dataKey="minute"
          stroke="#525252"
          tickLine={false}
          label={{ value: 'минута', position: 'insideBottomRight', offset: -4, fill: '#525252' }}
        />
        <YAxis
          domain={[0, 1]}
          ticks={[0, 0.25, 0.5, 0.75, 1]}
          tickFormatter={(v: number) => formatPercent(v)}
          stroke="#525252"
          tickLine={false}
        />
        {/* The coin-flip line: everything above it favours Radiant. */}
        <ReferenceLine y={0.5} stroke="#404040" strokeDasharray="4 4" />
        <Tooltip
          contentStyle={{ background: '#0a0a0a', border: '1px solid #262626', borderRadius: 6 }}
          formatter={(value: number) => [formatPercent(value, 1), 'Radiant']}
          labelFormatter={(minute: number) => `${minute} мин`}
        />
        <Line
          type="monotone"
          dataKey="p_radiant"
          stroke="#3f9b5b"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
