import { describe, expect, it } from 'vitest'

import type { ModelMetrics } from '@/api/types'
import { formatMetric, isSmallSample, versionChoices } from './metrics'

const empty: ModelMetrics = {
  model_version: 'live-v2',
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
}

describe('formatMetric', () => {
  it('renders a dash when there is nothing to report', () => {
    // Zero log loss is the score of a perfect model, which is the opposite of "no data".
    expect(formatMetric(null)).toBe('—')
    expect(formatMetric(undefined)).toBe('—')
  })

  it('keeps four digits by default', () => {
    expect(formatMetric(0.61234567)).toBe('0.6123')
  })

  it('honours a shorter precision for ECE', () => {
    expect(formatMetric(0.0432, 3)).toBe('0.043')
  })

  it('does not hide a zero that was actually measured', () => {
    expect(formatMetric(0)).toBe('0.0000')
  })
})

describe('versionChoices', () => {
  it('offers what the API listed', () => {
    const data = {
      ...empty,
      versions: [
        { version: 'live-v2', sample_size: 900 },
        { version: 'baseline', sample_size: 120 },
      ],
    }

    expect(versionChoices(data).map((v) => v.version)).toEqual(['live-v2', 'baseline'])
  })

  it('includes the served version even when it has scored nothing yet', () => {
    // Otherwise the page silently describes a retired model while the site serves this one.
    const data = { ...empty, versions: [{ version: 'baseline', sample_size: 120 }] }

    expect(versionChoices(data).map((v) => v.version)).toEqual(['baseline', 'live-v2'])
  })

  it('does not duplicate the served version', () => {
    const data = { ...empty, versions: [{ version: 'live-v2', sample_size: 0 }] }

    expect(versionChoices(data)).toHaveLength(1)
  })
})

describe('isSmallSample', () => {
  it('flags a handful of matches however many rows they produced', () => {
    // 14 matches, 426 predictions: the buckets look substantial and are not.
    expect(isSmallSample({ ...empty, matches: 14, sample_size: 426 })).toBe(true)
  })

  it('says nothing about an empty dashboard', () => {
    // That case has its own explanation; two warnings would just be noise.
    expect(isSmallSample(empty)).toBe(false)
  })

  it('stops warning once there is enough to read', () => {
    expect(isSmallSample({ ...empty, matches: 400, sample_size: 12000 })).toBe(false)
  })
})
