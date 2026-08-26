import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { Series } from '@/lib/series'
import { SeriesScore } from './SeriesScore'

const base: Series = {
  series_id: 1,
  format: 'bo2',
  score_a: 1,
  score_b: 1,
  winner_team_id: null,
  is_draw: true,
  game_in_series: 2,
  is_conditional_game: false,
}

describe('SeriesScore', () => {
  it('labels a drawn Bo2 explicitly', () => {
    render(<SeriesScore series={base} />)
    expect(screen.getByText(/1 : 1 \(ничья\)/)).toBeInTheDocument()
    expect(screen.getByText('Bo2')).toBeInTheDocument()
  })

  it('flags a conditional map', () => {
    render(<SeriesScore series={{ ...base, format: 'bo3', is_draw: false, is_conditional_game: true, game_in_series: 3 }} />)
    expect(screen.getByText('решающая')).toBeInTheDocument()
  })
})
