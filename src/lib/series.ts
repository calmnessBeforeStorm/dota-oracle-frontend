/**
 * Series display rules (spec section 5.5).
 *
 * The backend owns the truth (`app/domain/series.py`); this mirrors only what the UI needs
 * in order to render a score correctly. The one thing that must never be lost in
 * translation: a Bo2 can end 1-1, and that is a *result*, not "still playing".
 */

export type SeriesFormat = 'bo1' | 'bo2' | 'bo3' | 'bo5'

export interface Series {
  series_id: number | null
  format: SeriesFormat
  score_a: number
  score_b: number
  winner_team_id: number | null
  is_draw: boolean
  game_in_series: number
  is_conditional_game: boolean
}

export const MAX_GAMES: Record<SeriesFormat, number> = {
  bo1: 1,
  bo2: 2,
  bo3: 3,
  bo5: 5,
}

/** Only Bo2 can be drawn. Every other format plays until someone takes the majority. */
export function canDraw(format: SeriesFormat): boolean {
  return format === 'bo2'
}

export type SeriesStatus = 'scheduled' | 'live' | 'draw' | 'decided'

export function seriesStatus(series: Series): SeriesStatus {
  const played = series.score_a + series.score_b
  if (played === 0) return 'scheduled'
  if (series.is_draw) return 'draw'
  if (series.winner_team_id !== null) return 'decided'
  if (canDraw(series.format) && played >= MAX_GAMES[series.format]) return 'draw'
  return 'live'
}

/** Score label for the header, e.g. "1 : 1 (ничья)" for a drawn Bo2. */
export function seriesScoreLabel(series: Series): string {
  const score = `${series.score_a} : ${series.score_b}`
  return seriesStatus(series) === 'draw' ? `${score} (ничья)` : score
}

export function seriesFormatLabel(format: SeriesFormat): string {
  return format.replace('bo', 'Bo')
}

/**
 * Naive Bo2 outcome distribution from a per-map probability.
 *
 * Mirrors the backend helper and carries the same caveat: maps are not independent, so the
 * real share of 1-1 runs higher than 2p(1-p). Use only as a placeholder until the v2 series
 * model ships real numbers - never label these as the model output.
 */
export function bo2NaiveOutcomes(pA: number): { '2-0': number; '1-1': number; '0-2': number } {
  if (pA < 0 || pA > 1) throw new RangeError(`pA must be in [0, 1], got ${pA}`)
  return { '2-0': pA * pA, '1-1': 2 * pA * (1 - pA), '0-2': (1 - pA) * (1 - pA) }
}
