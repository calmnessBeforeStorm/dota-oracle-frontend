import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { ModelMetrics, ModelTraining } from '@/api/types'
import { TrainingStatus } from './TrainingStatus'

/**
 * The page used to say "9 matches, do not trust these numbers" and stop, which reads as "this
 * model was never validated". It had been, on 1293 matches. These tests hold the two halves
 * apart and make sure both are on screen.
 */
const training: ModelTraining = {
  trained_at: '2026-09-01T10:24:07Z',
  train_matches: 4526,
  train_rows: 164273,
  train_window: ['2026-04-07', '2026-06-07'],
  holdout_matches: 1293,
  holdout_rows: 52957,
  holdout_window: ['2026-07-01', '2026-09-01'],
  holdout_log_loss: 0.5215,
  holdout_brier: 0.1758,
  holdout_ece: 0.0334,
  passes_gate: true,
  gate_failures: [],
  gate_ties: ['25-29: indistinguishable'],
  calibrator: 'platt on all tiers',
  weighted: true,
  feature_count: 28,
}

function metrics(overrides: Partial<ModelMetrics> = {}): ModelMetrics {
  return {
    model_version: 'lgbm-20260901-102407',
    sample_size: 271,
    matches: 9,
    predicted_matches: 29,
    awaiting_outcome: 20,
    first_prediction_at: '2026-09-01T09:12:41Z',
    last_prediction_at: '2026-09-01T10:33:31Z',
    log_loss: 0.52,
    brier: 0.18,
    ece: 0.03,
    by_minute: [],
    reliability: [],
    versions: [],
    training,
    ...overrides,
  }
}

describe('TrainingStatus', () => {
  it('shows the holdout beside the served count, so neither stands in for the other', () => {
    render(<TrainingStatus data={metrics()} />)

    // The large offline number the page never used to mention...
    expect(screen.getByText('1293 матча')).toBeInTheDocument()
    // ...and the small live one it used to show alone.
    expect(screen.getByText('9 матчей')).toBeInTheDocument()
  })

  it('separates matches predicted from matches scored', () => {
    render(<TrainingStatus data={metrics()} />)

    expect(screen.getByText('29 матчей')).toBeInTheDocument()
    expect(screen.getByText('20 матчей')).toBeInTheDocument()
  })

  it('says a gate passed on ties is not a gate passed on wins', () => {
    render(<TrainingStatus data={metrics()} />)

    expect(screen.getByText(/внутри шума/)).toBeInTheDocument()
    expect(screen.getByText(/ещё не запас/)).toBeInTheDocument()
  })

  it('reports a failed gate as failed, with the comparisons', () => {
    const failed = { ...training, passes_gate: false, gate_failures: ['20-24: worse'] }
    render(<TrainingStatus data={metrics({ training: failed })} />)

    expect(screen.getByText(/Гейт не пройден/)).toBeInTheDocument()
    expect(screen.getByText('20-24: worse')).toBeInTheDocument()
  })

  it('does not invent a holdout for a baseline', () => {
    /* A baseline has no card. Rendering zeroes would read as a model that failed validation. */
    render(<TrainingStatus data={metrics({ training: null })} />)

    expect(screen.queryByText('1293 матча')).not.toBeInTheDocument()
    expect(screen.getByText(/бейзлайн, а не обученный артефакт/)).toBeInTheDocument()
  })

  it('still renders when the version has never served a prediction', () => {
    render(
      <TrainingStatus
        data={metrics({
          sample_size: 0,
          matches: 0,
          predicted_matches: 0,
          awaiting_outcome: 0,
          first_prediction_at: null,
          last_prediction_at: null,
        })}
      />,
    )

    expect(screen.getAllByText('0 матчей').length).toBeGreaterThan(0)
    expect(screen.getByText('1293 матча')).toBeInTheDocument()
  })
})
