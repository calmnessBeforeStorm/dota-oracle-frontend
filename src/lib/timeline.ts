import type { TimelineEvent, TimelineKind } from '@/api/types'

const LANE_LABELS: Record<string, string> = {
  top: 'верх',
  mid: 'центр',
  bot: 'низ',
  base: 'база',
}

/** What each decoded event is called, and the glyph that carries it in a dense list. */
export const KIND: Record<TimelineKind, { label: string; glyph: string }> = {
  tower: { label: 'башня', glyph: '▲' },
  barracks: { label: 'казармы', glyph: '▣' },
  ancient: { label: 'трон', glyph: '★' },
  roshan: { label: 'Рошан', glyph: '☠' },
  aegis: { label: 'аегис', glyph: '◈' },
  first_blood: { label: 'первая кровь', glyph: '✦' },
  tormentor: { label: 'торментор', glyph: '❖' },
}

const BUILDINGS: ReadonlySet<TimelineKind> = new Set(['tower', 'barracks', 'ancient'])

/**
 * The side an event favours, which is not the side the event names.
 *
 * A building event names the side that **lost** it, so the event favours the other one.
 * Getting this backwards paints every tower in the wrong colour, and it is the kind of
 * inversion that looks plausible either way on screen - hence one place for it, and a test.
 */
export function beneficiaryIsRadiant(event: TimelineEvent): boolean | null {
  if (event.is_radiant === null) return null
  return BUILDINGS.has(event.kind) ? !event.is_radiant : event.is_radiant
}

export function describe(event: TimelineEvent): string {
  const base = KIND[event.kind]?.label ?? event.kind
  const lane = event.lane ? (LANE_LABELS[event.lane] ?? event.lane) : null
  return lane ? `${base}, ${lane}` : base
}

/** Kinds worth a marker on the chart. A tower falls every few minutes; the rest stay in the
 * list underneath, where density costs nothing. */
const MARKED: ReadonlySet<TimelineKind> = new Set(['barracks', 'ancient', 'roshan'])

/**
 * One marker per minute, because the chart has one point per minute.
 *
 * Two barracks falling seconds apart are the same moment at this resolution, and drawing
 * both stacks their labels into an unreadable smear - which is exactly what happened the
 * first time this was rendered.
 */
export function chartMarkers(events: TimelineEvent[]): TimelineEvent[] {
  const byMinute = new Map<number, TimelineEvent>()
  for (const event of events) {
    if (!MARKED.has(event.kind)) continue
    if (!byMinute.has(event.minute)) byMinute.set(event.minute, event)
  }
  return [...byMinute.values()]
}
