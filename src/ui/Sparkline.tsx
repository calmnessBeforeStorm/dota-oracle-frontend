interface Point {
  minute: number
  p_radiant: number
}

interface Props {
  points: Point[]
  /** Чем кончился матч. Маркер, а не вердикт: карточка ничего не утверждает о модели. */
  outcome: 'radiant' | 'dire' | null
  height?: number
}

const WIDTH = 200

/**
 * Кривая вероятности в размере карточки.
 *
 * Руками, а не Recharts: библиотека вынесена в отдельный чанк, чтобы лента красилась
 * без неё, и тянуть её обратно ради сорока строк SVG значит отменить этот расчёт.
 *
 * Ось Y всегда 0..1 и никогда не подгоняется под данные: подогнанная ось превращает
 * колебание в три процентных пункта в драматический обвал.
 */
export function Sparkline({ points, outcome, height = 48 }: Props) {
  const head = points[0]
  const tail = points[points.length - 1]
  if (!head || !tail) {
    return <svg viewBox={`0 0 ${WIDTH} ${height}`} className="w-full" role="presentation" />
  }

  const span = tail.minute - head.minute || 1

  const x = (p: Point) => ((p.minute - head.minute) / span) * WIDTH
  const y = (p: Point) => (1 - p.p_radiant) * height

  const d = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p).toFixed(1)},${y(p).toFixed(1)}`)
    .join(' ')

  return (
    <svg viewBox={`0 0 ${WIDTH} ${height}`} className="w-full" role="presentation">
      {/* Половина: выше неё ведёт Radiant, ниже — Dire. */}
      <line
        x1={0}
        y1={height / 2}
        x2={WIDTH}
        y2={height / 2}
        stroke="var(--line)"
        strokeWidth={1}
      />
      {points.length > 1 && (
        <path d={d} fill="none" stroke="var(--ink-dim)" strokeWidth={1.5} strokeLinejoin="round" />
      )}
      {outcome && (
        <circle
          cx={x(tail)}
          cy={y(tail)}
          r={3}
          fill={outcome === 'radiant' ? 'var(--radiant)' : 'var(--dire)'}
        />
      )}
    </svg>
  )
}
