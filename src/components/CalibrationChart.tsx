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

import type { ReliabilityBin } from '@/api/types'
import { formatPercent } from '@/lib/utils'

/**
 * F6: the reliability diagram - what we promised against what happened.
 *
 * The diagonal is the whole point of the picture. A curve below it means we were
 * overconfident, above it means timid; how far from it is the only reading that matters, and
 * a chart without it invites people to read the shape of our curve as if it were a score.
 *
 * Dots are sized by how many predictions fell in the bin. A bin holding nine predictions and
 * one holding nine thousand are the same dot otherwise, and the first one is noise.
 */
export function CalibrationChart({ bins }: { bins: ReliabilityBin[] }) {
  const largest = Math.max(...bins.map((bin) => bin.count), 1)

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={bins} margin={{ top: 8, right: 16, bottom: 16, left: 0 }}>
        <CartesianGrid stroke="#262626" />
        <XAxis
          dataKey="predicted"
          type="number"
          domain={[0, 1]}
          ticks={[0, 0.25, 0.5, 0.75, 1]}
          tickFormatter={(value: number) => formatPercent(value)}
          stroke="#525252"
          tickLine={false}
          label={{
            value: 'обещанная вероятность',
            position: 'insideBottom',
            offset: -10,
            fill: '#525252',
          }}
        />
        <YAxis
          domain={[0, 1]}
          ticks={[0, 0.25, 0.5, 0.75, 1]}
          tickFormatter={(value: number) => formatPercent(value)}
          stroke="#525252"
          tickLine={false}
          width={46}
        />

        {/* Perfect calibration. Everything else on this chart is read as distance from it. */}
        <ReferenceLine
          segment={[
            { x: 0, y: 0 },
            { x: 1, y: 1 },
          ]}
          stroke="#525252"
          strokeDasharray="4 4"
          ifOverflow="extendDomain"
        />

        <Tooltip
          contentStyle={{ background: '#171717', border: '1px solid #404040', borderRadius: 8 }}
          labelFormatter={(value: number) => `обещали ${formatPercent(value)}`}
          formatter={(value: number, _name, item) => [
            `${formatPercent(value)} · ${(item?.payload as ReliabilityBin)?.count ?? 0} прогнозов`,
            'случилось',
          ]}
        />

        <Line
          type="monotone"
          dataKey="observed"
          stroke="#38bdf8"
          strokeWidth={2}
          isAnimationActive={false}
          dot={(props) => {
            const bin = props.payload as ReliabilityBin
            const radius = 3 + 5 * Math.sqrt(bin.count / largest)
            return (
              <circle
                key={`bin-${bin.predicted}`}
                cx={props.cx}
                cy={props.cy}
                r={radius}
                fill="#38bdf8"
                fillOpacity={0.75}
              />
            )
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
