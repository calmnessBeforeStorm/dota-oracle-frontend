import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { accuracyRoute } from './accuracy'
import { liveRoute } from './live'
import { matchRoute } from './match'
import { rootRoute } from './root'

const TIER1_EMPTY = {
  model_version: 'lgbm-20260901-102407',
  sample_size: 0,
  matches: 0,
  predicted_matches: 0,
  awaiting_outcome: 0,
  first_prediction_at: null,
  last_prediction_at: null,
  log_loss: null,
  brier: null,
  ece: null,
  by_minute: [],
  reliability: [],
  versions: [],
  training: null,
  segment: 'tier1',
  segments: [
    { segment: 'tier1', matches: 0 },
    { segment: 'pro', matches: 14 },
    { segment: 'excluded', matches: 249 },
  ],
  unsegmented_matches: 3,
}

const EXCLUDED = {
  ...TIER1_EMPTY,
  segment: 'excluded',
  sample_size: 5210,
  matches: 249,
  predicted_matches: 253,
  awaiting_outcome: 4,
  log_loss: 0.61,
  brier: 0.21,
  ece: 0.05,
  by_minute: [{ bucket: '10-14', count: 5210, log_loss: 0.61, brier: 0.21, accuracy: 0.7 }],
  reliability: [{ predicted: 0.7, observed: 0.68, count: 5210 }],
}

const requested: URL[] = []

beforeEach(() => {
  requested.length = 0
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  vi.stubGlobal('fetch', (input: RequestInfo | URL) => {
    const url = new URL(String(input), 'http://localhost')
    requested.push(url)
    const body =
      url.pathname === '/api/model/metrics'
        ? url.searchParams.get('segment') === 'excluded'
          ? EXCLUDED
          : TIER1_EMPTY
        : []
    return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }))
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderAccuracy() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createRouter({
    routeTree: rootRoute.addChildren([liveRoute, matchRoute, accuracyRoute]),
    history: createMemoryHistory({ initialEntries: ['/accuracy'] }),
  })
  return render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('accuracy segments', () => {
  it('opens on Tier 1 and says where the data is instead', async () => {
    renderAccuracy()
    expect(await screen.findByText(/В Tier 1 сверенных матчей пока нет/)).toBeInTheDocument()
    expect(screen.getByText(/в Pro — 14 матчей, в Excluded — 249 матчей/)).toBeInTheDocument()
    expect(screen.getByText(/Ещё 3 матча без известного тира/)).toBeInTheDocument()
    const metricsRequests = requested.filter((url) => url.pathname === '/api/model/metrics')
    expect(metricsRequests[0]?.searchParams.get('segment')).toBe('tier1')
  })

  it('shows each segment with its match count', async () => {
    renderAccuracy()
    expect(await screen.findByRole('button', { name: /Pro\s*14/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Excluded\s*249/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Tier 1\s*0/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('switches to the control group and labels it as one', async () => {
    renderAccuracy()
    fireEvent.click(await screen.findByRole('button', { name: /Excluded/ }))
    // Log loss appears twice - the tile and the per-minute table - so findAll, not find.
    expect((await screen.findAllByText('0.6100')).length).toBeGreaterThan(0)
    expect(screen.getByText(/контрольная группа/)).toBeInTheDocument()
  })
})
