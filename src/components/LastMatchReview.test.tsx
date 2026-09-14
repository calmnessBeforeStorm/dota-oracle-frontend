import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { RecentMatch } from '@/api/types'
import { LastMatchReview } from './LastMatchReview'

const MATCH: RecentMatch = {
  match_id: 1,
  league_id: 10,
  league_name: 'DreamLeague Season 30',
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
  // The feed's thinned curve misses the dip: on its own it reads as a wire-to-wire win.
  curve: [
    { minute: 0, p_radiant: 0.6, predicted_at: '2026-09-01T12:00:00Z' },
    { minute: 35, p_radiant: 0.8, predicted_at: '2026-09-01T12:35:00Z' },
  ],
  p_at_ten: null,
  model_version: 'lgbm-20260901-102407',
}

const FULL_CURVE = [
  [0, 0.6],
  [10, 0.4],
  [20, 0.45],
  [27, 0.55],
  [35, 0.8],
].map(([minute, p]) => ({ minute, p_radiant: p, predicted_at: '2026-09-01T12:00:00Z' }))

function stubDetail(curve: unknown) {
  vi.stubGlobal('fetch', (input: RequestInfo | URL) => {
    const path = new URL(String(input), 'http://localhost').pathname
    const body = path === '/api/matches/1' ? { curve, timeline: [] } : []
    return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }))
  })
}

function renderReview(match: RecentMatch) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const root = createRootRoute()
  const index = createRoute({
    getParentRoute: () => root,
    path: '/',
    component: () => <LastMatchReview match={match} />,
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
  return render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  // Recharts' ResponsiveContainer observes its size; jsdom has no ResizeObserver.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('LastMatchReview', () => {
  it('reads the turning point off the full curve, not the thinned one', async () => {
    stubDetail(FULL_CURVE)
    renderReview(MATCH)
    // Wait for the router to mount the route (always async, even with no loader) using text
    // that renders regardless of the curve, then check synchronously - before the detail
    // request has had a chance to resolve - that the wrong caption never appeared alongside
    // the thinned curve. `findByText` below waits for the right label and would pass even if
    // a wrong one flashed first, so this is what actually exercises item 1's behaviour.
    await screen.findByText('Последний матч')
    expect(screen.queryByText('Фаворит с первой минуты')).not.toBeInTheDocument()
    expect(await screen.findByText('Решён с 27-й минуты')).toBeInTheDocument()
  })

  it('says so when the model never saw the winner', async () => {
    stubDetail([
      { minute: 0, p_radiant: 0.6, predicted_at: '2026-09-01T12:00:00Z' },
      { minute: 30, p_radiant: 0.35, predicted_at: '2026-09-01T12:30:00Z' },
    ])
    renderReview(MATCH)
    expect(await screen.findByText('Модель до конца не видела победителя')).toBeInTheDocument()
  })

  it('names the league and links to the match card', async () => {
    stubDetail(FULL_CURVE)
    renderReview(MATCH)
    expect(await screen.findByText('DreamLeague Season 30')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /к матчу/ })).toHaveAttribute('href', '/match/1')
  })
})
