import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { accuracyRoute } from './accuracy'
import { liveRoute } from './live'
import { matchRoute } from './match'
import { rootRoute } from './root'

function renderHome() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createRouter({
    routeTree: rootRoute.addChildren([liveRoute, matchRoute, accuracyRoute]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  return render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

const requested: URL[] = []

beforeEach(() => {
  requested.length = 0
  // The latest-match review draws a Recharts chart; jsdom has no ResizeObserver.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
})

function stubApi(routes: Record<string, unknown>) {
  vi.stubGlobal('fetch', (input: RequestInfo | URL) => {
    const url = new URL(String(input), 'http://localhost')
    requested.push(url)
    // `in`, not `??`: a null stub means "the endpoint answered empty", and swapping it for an
    // empty array would feed the component something it never gets in production.
    const body = url.pathname in routes ? routes[url.pathname] : []
    return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }))
  })
}

function recentTiers(): string[][] {
  return requested
    .filter((url) => url.pathname === '/api/matches/recent')
    .map((url) => (url.searchParams.get('tiers') ?? '').split(',').sort())
}

const PLAYED = {
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
  curve: [{ minute: 11, p_radiant: 0.62, predicted_at: '2026-09-01T12:11:00Z' }],
  p_at_ten: 0.62,
  model_version: 'lgbm-20260901-090724',
}

describe('home page', () => {
  it('shows the latest played match large when nothing is live', async () => {
    stubApi({
      '/api/matches/live': [],
      '/api/model/metrics': null,
      '/api/matches/recent': [PLAYED],
    })
    renderHome()
    expect(await screen.findByText('Последний матч')).toBeInTheDocument()
    // A short notice above it, not the tall empty card the review replaces.
    expect(screen.getByText(/Сейчас матчей Tier 1 нет/)).toBeInTheDocument()
    expect(screen.queryByText(/Матчей Tier 1 сейчас нет/)).not.toBeInTheDocument()
    // The one match is in the review, not repeated as a card below it.
    expect(screen.queryByText(/на 10-й минуте/)).not.toBeInTheDocument()
  })

  it('keeps older played matches as cards under the review', async () => {
    stubApi({
      '/api/matches/live': [],
      '/api/model/metrics': null,
      '/api/matches/recent': [PLAYED, { ...PLAYED, match_id: 2, league_name: 'ESL One 2026' }],
    })
    renderHome()
    expect(await screen.findByText('Последний матч')).toBeInTheDocument()
    expect(await screen.findByText('ESL One 2026')).toBeInTheDocument()
    expect(screen.getAllByText(/на 10-й минуте/)).toHaveLength(1)
  })

  it('says the feed only covers matches it predicted', async () => {
    stubApi({ '/api/matches/live': [], '/api/matches/recent': [], '/api/model/metrics': null })
    renderHome()
    expect(await screen.findByText(/по которым мы дали прогноз/i)).toBeInTheDocument()
  })

  it('says so when there is nothing scored yet', async () => {
    stubApi({ '/api/matches/live': [], '/api/matches/recent': [], '/api/model/metrics': null })
    renderHome()
    expect(await screen.findByText(/Сверенных матчей пока нет/i)).toBeInTheDocument()
  })
})

function liveMatch(tier: string, matchId: number, leagueName: string) {
  return {
    match_id: matchId,
    league_id: matchId,
    league_name: leagueName,
    tier,
    radiant: { team_id: 1, name: 'Team Spirit', logo_url: null },
    dire: { team_id: 2, name: 'Falcons', logo_url: null },
    game_time: 600,
    radiant_score: 5,
    dire_score: 3,
    p_radiant: 0.55,
    model_version: 'lgbm-20260901-102407',
    minute: 10,
    stream_delay_s: 120,
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
  }
}

describe('фильтр по тиру в живой ленте', () => {
  const feed = [
    liveMatch('tier1', 1, 'The International 2026'),
    liveMatch('unknown', 2, 'bottle cup'),
    liveMatch('unknown', 3, '牛马MAJOR'),
  ]

  it('по умолчанию показывает только Tier 1', async () => {
    stubApi({ '/api/matches/live': feed, '/api/matches/recent': [], '/api/model/metrics': null })
    renderHome()

    expect(await screen.findByText('The International 2026')).toBeInTheDocument()
    expect(screen.queryByText('bottle cup')).not.toBeInTheDocument()
  })

  it('говорит, что таких турниров нет, вместо пустого экрана', async () => {
    // Ровно тот случай, ради которого фильтр и сделан: Tier 1 играет несколько часов в
    // сутки, всё остальное время лента пуста, и молчание читалось бы как поломка.
    const noTierOne = feed.filter((m) => m.tier !== 'tier1')
    stubApi({
      '/api/matches/live': noTierOne,
      '/api/matches/recent': [],
      '/api/model/metrics': null,
    })
    renderHome()

    expect(await screen.findByText(/Матчей Tier 1 сейчас нет/i)).toBeInTheDocument()
    expect(screen.queryByText('bottle cup')).not.toBeInTheDocument()
  })

  it('включает неразмеченные турниры по требованию', async () => {
    stubApi({ '/api/matches/live': feed, '/api/matches/recent': [], '/api/model/metrics': null })
    renderHome()

    fireEvent.click(await screen.findByRole('button', { name: /Без разметки/ }))

    expect(await screen.findByText('bottle cup')).toBeInTheDocument()
    expect(screen.getByText('The International 2026')).toBeInTheDocument()
  })

  it('не даёт снять все тиры разом', async () => {
    // Пустой набор означал бы «показать ничего и никогда», что неотличимо от поломки.
    stubApi({ '/api/matches/live': feed, '/api/matches/recent': [], '/api/model/metrics': null })
    renderHome()

    fireEvent.click(await screen.findByRole('button', { name: /Tier 1/ }))

    expect(await screen.findByText('The International 2026')).toBeInTheDocument()
  })

  it('запоминает выбор между заходами', async () => {
    stubApi({ '/api/matches/live': feed, '/api/matches/recent': [], '/api/model/metrics': null })
    const first = renderHome()
    fireEvent.click(await screen.findByRole('button', { name: /Без разметки/ }))
    expect(await screen.findByText('bottle cup')).toBeInTheDocument()
    first.unmount()

    renderHome()
    expect(await screen.findByText('bottle cup')).toBeInTheDocument()
  })
})

describe('played feed follows the tier chips', () => {
  it('asks the server for Tier 1 by default', async () => {
    stubApi({ '/api/matches/live': [], '/api/matches/recent': [], '/api/model/metrics': null })
    renderHome()
    await screen.findByText(/Сверенных матчей пока нет/i)
    expect(recentTiers()).toContainEqual(['tier1'])
  })

  it('asks again with the added chip', async () => {
    stubApi({
      '/api/matches/live': [liveMatch('tier1', 1, 'The International 2026')],
      '/api/matches/recent': [],
      '/api/model/metrics': null,
    })
    renderHome()
    fireEvent.click(await screen.findByRole('button', { name: /Без разметки/ }))
    await waitFor(() => expect(recentTiers()).toContainEqual(['tier1', 'unknown']))
  })

  it('shows the played cards without a review while something is live', async () => {
    stubApi({
      '/api/matches/live': [liveMatch('tier1', 1, 'The International 2026')],
      '/api/matches/recent': [PLAYED],
      '/api/model/metrics': null,
    })
    renderHome()
    expect(await screen.findByText(/на 10-й минуте/)).toBeInTheDocument()
    expect(screen.queryByText('Последний матч')).not.toBeInTheDocument()
  })
})
