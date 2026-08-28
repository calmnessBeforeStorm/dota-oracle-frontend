import type { ModelMetrics, ModelVersionInfo } from '@/api/types'

/**
 * F6 formatting rules, kept out of the page so they can be tested.
 *
 * Both functions exist to stop the dashboard from looking better than the data behind it,
 * which is the only way this page can fail: it is the page a visitor uses to decide whether
 * to believe everything else.
 */

/** A metric with no data renders as a dash. `0.0000` would read as a flawless model. */
export function formatMetric(value: number | null | undefined, digits = 4): string {
  return value === null || value === undefined ? '—' : value.toFixed(digits)
}

/**
 * Versions the picker should offer.
 *
 * The served version is always among them, even with nothing scored yet: dropping it would
 * leave the page describing some other model while the site serves this one.
 */
export function versionChoices(data: ModelMetrics): ModelVersionInfo[] {
  if (data.versions.some((info) => info.version === data.model_version)) return data.versions
  return [...data.versions, { version: data.model_version, sample_size: data.sample_size }]
}

/**
 * Below this many finished matches the page says so out loud.
 *
 * The row counts are what makes this necessary: fourteen matches produce four hundred
 * predictions, and a table of seventy-row buckets reads as a solid measurement. It is not -
 * snapshots of one game are correlated, so the honest denominator is matches, not rows.
 */
export const SMALL_SAMPLE_MATCHES = 30

export function isSmallSample(data: ModelMetrics): boolean {
  return data.matches > 0 && data.matches < SMALL_SAMPLE_MATCHES
}
