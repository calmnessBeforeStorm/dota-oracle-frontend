import { render, screen } from '@testing-library/react'
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { describe, expect, it } from 'vitest'

import type { ModelMetrics } from '@/api/types'
import { ModelStrip } from './ModelStrip'

/** Полоса содержит ссылку на страницу точности, поэтому ей нужен роутер. */
function renderStrip(data: ModelMetrics) {
  const root = createRootRoute()
  const index = createRoute({
    getParentRoute: () => root,
    path: '/',
    component: () => <ModelStrip data={data} />,
  })
  const accuracy = createRoute({
    getParentRoute: () => root,
    path: '/accuracy',
    component: () => null,
  })
  const router = createRouter({
    routeTree: root.addChildren([index, accuracy]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  return render(<RouterProvider router={router} />)
}

const METRICS = {
  model_version: 'lgbm-20260901-090724',
  matches: 156,
  sample_size: 1457,
  log_loss: 0.5253,
  ece: 0.0547,
  by_minute: [],
  reliability: [],
  versions: [],
  predicted_matches: 160,
  awaiting_outcome: 4,
  first_prediction_at: null,
  last_prediction_at: null,
  training: null,
} as unknown as ModelMetrics

describe('ModelStrip', () => {
  it('names the version being served', async () => {
    renderStrip(METRICS)
    expect(await screen.findByText('lgbm-20260901-090724')).toBeInTheDocument()
  })

  it('gives the denominator in matches, not in predictions', async () => {
    renderStrip(METRICS)
    expect(await screen.findByText(/156 матчей/)).toBeInTheDocument()
  })

  it('says the sample is thin instead of showing a pretty number', async () => {
    renderStrip({ ...METRICS, matches: 9 })
    expect(await screen.findByText(/рано/i)).toBeInTheDocument()
  })

  it('dashes a metric it does not have', async () => {
    renderStrip({ ...METRICS, log_loss: null } as unknown as ModelMetrics)
    // Нулевой log loss — это безупречная модель; прочерк честнее.
    expect(await screen.findByText('—')).toBeInTheDocument()
  })
})
