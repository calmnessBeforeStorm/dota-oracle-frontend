import type { TimelineEvent } from '@/api/types'
import { KIND, beneficiaryIsRadiant, describe } from '@/lib/timeline'
import { cn, formatGameTime } from '@/lib/utils'

/** F2: the chronological list under the chart. */
export function EventTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <p className="py-6 text-center text-sm text-neutral-500">Событий пока нет</p>
  }

  return (
    <ol className="divide-y divide-neutral-800/70">
      {events.map((event, index) => {
        const radiant = beneficiaryIsRadiant(event)
        const kind = KIND[event.kind]
        return (
          <li key={`${event.time}-${index}`} className="flex items-baseline gap-3 py-1.5 text-sm">
            <span className="w-14 shrink-0 text-right font-mono text-xs text-neutral-500">
              {formatGameTime(event.time)}
            </span>
            <span
              className={cn(
                'w-4 shrink-0 text-center',
                radiant === null ? 'text-neutral-500' : radiant ? 'text-radiant' : 'text-dire',
              )}
              aria-hidden
            >
              {kind?.glyph ?? '•'}
            </span>
            <span className="text-neutral-300">{describe(event)}</span>
            {radiant !== null && (
              <span className="text-xs text-neutral-600">
                в пользу {radiant ? 'Radiant' : 'Dire'}
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
