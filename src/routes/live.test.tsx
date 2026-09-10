import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

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

afterEach(() => vi.unstubAllGlobals())

function stubApi(routes: Record<string, unknown>) {
  vi.stubGlobal('fetch', (input: RequestInfo | URL) => {
    const path = new URL(String(input), 'http://localhost').pathname
    // `in`, а не `??`: заглушка null означает «ручка ответила пусто», и подменять её
    // пустым массивом значит кормить компонент не тем, что он получит в жизни.
    const body = path in routes ? routes[path] : []
    return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }))
  })
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
  it('falls back to played matches when nothing is live', async () => {
    stubApi({
      '/api/matches/live': [],
      // Полоса модели рисуется только при непустых метриках; здесь их нет.
      '/api/model/metrics': null,
      '/api/matches/recent': [PLAYED],
    })
    renderHome()
    // Экран, построенный вокруг одной цифры, без неё не должен выглядеть поломанным.
    // Проверяется подписью карточки сыгранного матча: имя команды на ней стоит дважды —
    // в шапке и в «за …», — и по нему тест ловил бы неоднозначность, а не смысл.
    expect(await screen.findByText(/на 10-й минуте/)).toBeInTheDocument()
    expect(screen.getByText('62.0%')).toBeInTheDocument()
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
