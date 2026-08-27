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

import type { PredictionPoint, TimelineEvent } from '@/api/types'
import { KIND, beneficiaryIsRadiant, chartMarkers } from '@/lib/timeline'
import { formatPercent } from '@/lib/utils'

/** F2: probability curve over the course of the map, with key events on the same time axis. */
export function ProbabilityChart({
  curve,
  events = [],
}: {
  curve: PredictionPoint[]
  events?: TimelineEvent[]
}) {
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
        {/* Events on the same axis as the curve: the point of the card is seeing *why* the
            line moved, and a separate list makes the reader do that join by eye. */}
        {chartMarkers(events).map((event, index) => {
            const radiant = beneficiaryIsRadiant(event)
          return (
            <ReferenceLine
              key={`${event.time}-${index}`}
              x={event.minute}
              stroke={radiant === null ? '#525252' : radiant ? '#2c6b40' : '#8e2a20'}
              strokeDasharray="2 3"
              // A glyph rather than a word: two events a couple of minutes apart are closer
              // together than "казармы" is wide, and the labels smeared into each other. The
              // list underneath carries the wording; here the mark only has to be findable.
              label={{
                value: KIND[event.kind]?.glyph ?? '•',
                position: 'top',
                fill: radiant === null ? '#737373' : radiant ? '#3f9b5b' : '#c0392b',
                fontSize: 13,
              }}
            />
          )
        })}
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
