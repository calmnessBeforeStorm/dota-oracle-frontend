import { describe as group, expect, it } from 'vitest'

import type { TimelineEvent } from '@/api/types'
import { beneficiaryIsRadiant, chartMarkers, describe } from '@/lib/timeline'

function event(overrides: Partial<TimelineEvent> = {}): TimelineEvent {
  return { time: 600, minute: 10, kind: 'tower', is_radiant: true, lane: 'top', ...overrides }
}

group('beneficiaryIsRadiant', () => {
  it('flips a building event: the side named is the side that lost it', () => {
    expect(beneficiaryIsRadiant(event({ kind: 'tower', is_radiant: true }))).toBe(false)
    expect(beneficiaryIsRadiant(event({ kind: 'barracks', is_radiant: false }))).toBe(true)
    expect(beneficiaryIsRadiant(event({ kind: 'ancient', is_radiant: true }))).toBe(false)
  })

  it('leaves a roshan or first blood as-is: there the side named did it', () => {
    expect(beneficiaryIsRadiant(event({ kind: 'roshan', is_radiant: true, lane: null }))).toBe(true)
    expect(
      beneficiaryIsRadiant(event({ kind: 'first_blood', is_radiant: false, lane: null })),
    ).toBe(false)
  })

  it('stays unknown when the log does not say', () => {
    expect(beneficiaryIsRadiant(event({ is_radiant: null }))).toBeNull()
  })
})

group('describe', () => {
  it('names the lane when there is one', () => {
    expect(describe(event({ kind: 'tower', lane: 'mid' }))).toBe('башня, центр')
  })

  it('omits the lane when there is none', () => {
    expect(describe(event({ kind: 'roshan', lane: null }))).toBe('Рошан')
  })

  it('passes an unmapped lane through rather than dropping it', () => {
    expect(describe(event({ kind: 'tower', lane: 'somewhere' }))).toBe('башня, somewhere')
  })
})

group('chartMarkers', () => {
  it('keeps one marker per minute so labels cannot collide', () => {
    const events: TimelineEvent[] = [
      event({ kind: 'barracks', minute: 45, time: 2745 }),
      event({ kind: 'barracks', minute: 45, time: 2749 }),
      event({ kind: 'roshan', minute: 34, time: 2081, lane: null }),
    ]
    expect(chartMarkers(events).map((e) => e.minute)).toEqual([45, 34])
  })

  it('leaves towers to the list: they fall too often to mark', () => {
    expect(chartMarkers([event({ kind: 'tower', minute: 6 })])).toEqual([])
  })

  it('marks the ancient', () => {
    expect(chartMarkers([event({ kind: 'ancient', minute: 49 })])).toHaveLength(1)
  })
})
