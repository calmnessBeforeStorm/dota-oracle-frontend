import type { PredictionPoint } from '@/api/types'

/**
 * Where a finished match turned, read off the model's own curve.
 *
 * Deliberately not a verdict on the model: "decided from minute 27" says when the winner's
 * probability last crossed one half and stayed there, which is a fact about the curve. The
 * three other outcomes are named rather than forced into a minute - a winner ahead from the
 * first point has no turning point, and a curve that ends with the winner behind (the last
 * live snapshot lands about thirty seconds before the throne falls) never saw one.
 */
export type Decided =
  | { kind: 'none' }
  | { kind: 'never' }
  | { kind: 'wire' }
  | { kind: 'decided'; minute: number }

export function decidedMinute(curve: PredictionPoint[], radiantWin: boolean): Decided {
  const points = [...curve].sort((a, b) => a.minute - b.minute)
  const last = points.at(-1)
  if (last === undefined) return { kind: 'none' }

  const winner = (point: PredictionPoint) => (radiantWin ? point.p_radiant : 1 - point.p_radiant)
  if (winner(last) < 0.5) return { kind: 'never' }

  let lastBehind = -1
  points.forEach((point, index) => {
    if (winner(point) < 0.5) lastBehind = index
  })
  const turn = points[lastBehind + 1]
  if (lastBehind === -1 || turn === undefined) return { kind: 'wire' }
  return { kind: 'decided', minute: turn.minute }
}

export function decidedLabel(decided: Decided): string | null {
  switch (decided.kind) {
    case 'decided':
      return `Решён с ${decided.minute}-й минуты`
    case 'wire':
      return 'Фаворит с первой минуты'
    case 'never':
      return 'Модель до конца не видела победителя'
    case 'none':
      return null
  }
}
