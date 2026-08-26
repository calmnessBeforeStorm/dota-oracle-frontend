import { describe, expect, it } from 'vitest'

import {
  MAX_GAMES,
  bo2NaiveOutcomes,
  canDraw,
  seriesScoreLabel,
  seriesStatus,
  type Series,
} from './series'

function series(overrides: Partial<Series> = {}): Series {
  return {
    series_id: 1,
    format: 'bo3',
    score_a: 0,
    score_b: 0,
    winner_team_id: null,
    is_draw: false,
    game_in_series: 1,
    is_conditional_game: false,
    ...overrides,
  }
}

describe('series status', () => {
  it('renders a drawn Bo2 as a draw, not as unfinished', () => {
    const s = series({ format: 'bo2', score_a: 1, score_b: 1, is_draw: true })
    expect(seriesStatus(s)).toBe('draw')
    expect(seriesScoreLabel(s)).toContain('ничья')
  })

  it('treats a Bo2 at 1-0 as still live', () => {
    expect(seriesStatus(series({ format: 'bo2', score_a: 1, score_b: 0 }))).toBe('live')
  })

  it('falls back to a draw when the backend omits the flag on a full Bo2', () => {
    // Defensive: 1-1 with all maps played can only be a draw.
    expect(seriesStatus(series({ format: 'bo2', score_a: 1, score_b: 1 }))).toBe('draw')
  })

  it('never draws a Bo3', () => {
    expect(canDraw('bo3')).toBe(false)
    expect(seriesStatus(series({ score_a: 1, score_b: 1 }))).toBe('live')
  })

  it('marks a decided series', () => {
    expect(seriesStatus(series({ score_a: 2, score_b: 0, winner_team_id: 42 }))).toBe('decided')
  })

  it('knows a Bo2 has exactly two maps', () => {
    expect(MAX_GAMES.bo2).toBe(2)
  })
})

describe('bo2NaiveOutcomes', () => {
  it('sums to one', () => {
    const probs = bo2NaiveOutcomes(0.65)
    expect(probs['2-0'] + probs['1-1'] + probs['0-2']).toBeCloseTo(1)
  })

  it('rejects impossible probabilities', () => {
    expect(() => bo2NaiveOutcomes(1.2)).toThrow(RangeError)
  })
})
