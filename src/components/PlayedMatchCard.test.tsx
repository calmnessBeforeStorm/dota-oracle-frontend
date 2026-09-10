import { render, screen } from '@testing-library/react'
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { describe, expect, it } from 'vitest'

import type { RecentMatch } from '@/api/types'
import { PlayedMatchCard } from './PlayedMatchCard'

const MATCH: RecentMatch = {
  match_id: 1,
  league_id: 10,
  league_name: 'The International 2026',
  tier: 'tier1',
  radiant: { team_id: 1, name: 'Team Spirit', logo_url: null },
  dire: { team_id: 2, name: 'Falcons', logo_url: null },
  radiant_win: true,
  started_at: '2026-09-01T12:00:00Z',
  series: {
    series_id: null,
    format: null,
    score_a: 0,
    score_b: 0,
    winner_team_id: null,
    is_draw: false,
    game_in_series: 1,
    is_conditional_game: false,
  },
  curve: [
    { minute: 0, p_radiant: 0.5, predicted_at: '2026-09-01T12:00:00Z' },
    { minute: 11, p_radiant: 0.62, predicted_at: '2026-09-01T12:11:00Z' },
  ],
  p_at_ten: 0.62,
  model_version: 'lgbm-20260901-090724',
}

/**
 * Карточка — ссылка, значит ей нужен роутер; память вместо истории браузера.
 *
 * Роутер поднимается асинхронно и первый кадр отдаёт пустым, поэтому проверки идут через
 * `findBy*`, а не `getBy*`: синхронный запрос читал бы пустой DOM и «не нашёл» ничего,
 * из-за чего тест на отсутствие вердикта проходил бы, ничего не проверив.
 */
function renderCard(match: RecentMatch) {
  const root = createRootRoute()
  const index = createRoute({
    getParentRoute: () => root,
    path: '/',
    component: () => <PlayedMatchCard match={match} />,
  })
  const detail = createRoute({
    getParentRoute: () => root,
    path: '/match/$matchId',
    component: () => null,
  })
  const router = createRouter({
    routeTree: root.addChildren([index, detail]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  return render(<RouterProvider router={router} />)
}

describe('PlayedMatchCard', () => {
  it('shows what the model promised at minute ten', async () => {
    renderCard(MATCH)
    expect(await screen.findByText('62.0%')).toBeInTheDocument()
  })

  it('dashes when minute ten is missing rather than borrowing a neighbour', async () => {
    renderCard({ ...MATCH, p_at_ten: null })
    expect(await screen.findByText('—')).toBeInTheDocument()
  })

  it('passes no verdict on the model', async () => {
    renderCard(MATCH)
    // Ждём отрисовки прежде, чем утверждать об отсутствии: на пустом DOM этот тест
    // прошёл бы всегда и не значил бы ничего.
    await screen.findByText('62.0%')
    // Последняя точка кривой почти всегда права; галочка по ней — лесть, а не измерение.
    expect(screen.queryByText(/угадал/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/✓|✗/)).not.toBeInTheDocument()
  })

  it('says nothing about a series it knows nothing about', async () => {
    renderCard(MATCH)
    await screen.findByText('62.0%')
    expect(screen.queryByText('0 : 0')).not.toBeInTheDocument()
  })

  it('labels a drawn Bo2 as a draw', async () => {
    renderCard({
      ...MATCH,
      series: {
        ...MATCH.series,
        series_id: 7,
        format: 'bo2',
        score_a: 1,
        score_b: 1,
        is_draw: true,
      },
    })
    expect(await screen.findByText(/1 : 1 \(ничья\)/)).toBeInTheDocument()
  })

  it('shows an absolute date, not a relative one', async () => {
    renderCard(MATCH)
    expect(await screen.findByText(/1 сент/)).toBeInTheDocument()
    expect(screen.queryByText(/вчера|назад/i)).not.toBeInTheDocument()
  })
})
