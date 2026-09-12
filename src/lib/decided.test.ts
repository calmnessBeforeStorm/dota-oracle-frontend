import { describe, expect, it } from 'vitest'

import type { PredictionPoint } from '@/api/types'
import { decidedLabel, decidedMinute } from './decided'

function curve(...points: [number, number][]): PredictionPoint[] {
  return points.map(([minute, p]) => ({
    minute,
    p_radiant: p,
    predicted_at: '2026-09-01T12:00:00Z',
  }))
}

describe('decidedMinute', () => {
  it('says nothing about an empty curve', () => {
    expect(decidedMinute([], true)).toEqual({ kind: 'none' })
  })

  it('finds the start of the last stretch the winner stayed ahead', () => {
    const points = curve([0, 0.6], [10, 0.4], [20, 0.45], [27, 0.55], [35, 0.8])
    expect(decidedMinute(points, true)).toEqual({ kind: 'decided', minute: 27 })
  })

  it('reads the curve from the winner side when Dire won', () => {
    // Dire's probability is 0.7, 0.4, 0.6: behind at 10, ahead from 20.
    const points = curve([0, 0.3], [10, 0.6], [20, 0.4])
    expect(decidedMinute(points, false)).toEqual({ kind: 'decided', minute: 20 })
  })

  it('counts exactly one half as ahead', () => {
    expect(decidedMinute(curve([0, 0.4], [10, 0.5]), true)).toEqual({
      kind: 'decided',
      minute: 10,
    })
  })

  it('calls a winner ahead from the first point a favourite throughout', () => {
    expect(decidedMinute(curve([0, 0.55], [10, 0.7]), true)).toEqual({ kind: 'wire' })
    expect(decidedMinute(curve([12, 0.7]), true)).toEqual({ kind: 'wire' })
  })

  it('admits the model never saw the winner', () => {
    // The last live snapshot is taken about half a minute before the throne falls.
    expect(decidedMinute(curve([0, 0.6], [30, 0.4]), true)).toEqual({ kind: 'never' })
    expect(decidedMinute(curve([12, 0.3]), true)).toEqual({ kind: 'never' })
  })

  it('does not trust the order the points arrived in', () => {
    const points = curve([35, 0.8], [0, 0.6], [27, 0.55], [10, 0.4], [20, 0.45])
    expect(decidedMinute(points, true)).toEqual({ kind: 'decided', minute: 27 })
  })
})

describe('decidedLabel', () => {
  it('words every outcome', () => {
    expect(decidedLabel({ kind: 'decided', minute: 27 })).toBe('Решён с 27-й минуты')
    expect(decidedLabel({ kind: 'wire' })).toBe('Фаворит с первой минуты')
    expect(decidedLabel({ kind: 'never' })).toBe('Модель до конца не видела победителя')
    expect(decidedLabel({ kind: 'none' })).toBeNull()
  })
})
