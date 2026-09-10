interface Point {
  minute: number
  p_radiant: number
}

interface Props {
  points: Point[]
  /** Чем кончился матч. Отметка, а не вердикт: карточка ничего не утверждает о модели. */
  outcome: 'radiant' | 'dire' | null
  className?: string
}

const WIDTH = 200
const HEIGHT = 48

/**
 * Кривая вероятности в размере карточки.
 *
 * Руками, а не Recharts: библиотека вынесена в отдельный чанк, чтобы лента красилась
 * без неё, и тянуть её обратно ради сорока строк SVG значит отменить этот расчёт.
 *
 * Ось Y всегда 0..1 и никогда не подгоняется под данные: подогнанная ось превращает
 * колебание в три процентных пункта в драматический обвал.
 *
 * Высота задаётся классом, а координаты — растягиваются (`preserveAspectRatio="none"`).
 * С сохранением пропорций SVG в ширину карточки вырастал до сотни пикселей и раздувал
 * её пустотой, а кривая всё равно читается по форме, а не по углу наклона.
 */
export function Sparkline({ points, outcome, className = 'h-12' }: Props) {
  const head = points[0]
  const tail = points[points.length - 1]
  if (!head || !tail) {
    return (
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="none"
        className={`w-full ${className}`}
        role="presentation"
      />
    )
  }

  const height = HEIGHT
  const span = tail.minute - head.minute || 1

  const x = (p: Point) => ((p.minute - head.minute) / span) * WIDTH
  const y = (p: Point) => (1 - p.p_radiant) * height

  const d = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p).toFixed(1)},${y(p).toFixed(1)}`)
    .join(' ')

  // Хвост цветом победителя вместо кружка: при растянутых координатах круг стал бы
  // эллипсом, а отрезок остаётся отрезком.
  const settled = points.slice(-2)
  const tailPath = settled
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p).toFixed(1)},${y(p).toFixed(1)}`)
    .join(' ')

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${height}`}
      preserveAspectRatio="none"
      className={`w-full ${className}`}
      role="presentation"
    >
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
      {outcome && settled.length === 2 && (
        <path
          d={tailPath}
          fill="none"
          stroke={outcome === 'radiant' ? 'var(--radiant)' : 'var(--dire)'}
          strokeWidth={2.5}
          strokeLinecap="round"
          data-outcome={outcome}
        />
      )}
    </svg>
  )
}
