import type { TournamentParticipant } from '@/api/types'
import { cn } from '@/lib/utils'

/**
 * F4: who played and how they did.
 *
 * The draw column is always present, even when every series was decided. Hiding it when it
 * happens to be empty would teach the reader that a Dota series always has a winner, and
 * then a Bo2 group stage would look like a rendering bug (spec section 5.5).
 */
export function ParticipantTable({ participants }: { participants: TournamentParticipant[] }) {
  if (participants.length === 0) return null

  // Series outcomes come from `link-stages`, which only runs for leagues mapped to
  // Liquipedia. Where it has not run, every record is 0-0-0 - true, but it reads as "nobody
  // played" unless the page says why.
  const noOutcomesKnown = participants.every(
    (p) => p.series_won + p.series_lost + p.series_drawn === 0,
  )

  return (
    <section className="rounded-lg border border-neutral-800 bg-neutral-900">
      <header className="border-b border-neutral-800 px-4 py-2.5">
        <h2 className="text-sm text-neutral-400">
          Участники <span className="text-neutral-600">· {participants.length}</span>
        </h2>
      </header>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-neutral-500">
            <th className="px-4 py-1.5 text-left font-normal">Команда</th>
            <th className="py-1.5 text-right font-normal">В</th>
            <th className="py-1.5 text-right font-normal">П</th>
            <th className="py-1.5 text-right font-normal">Н</th>
            <th className="px-4 py-1.5 text-right font-normal">Карты</th>
          </tr>
        </thead>
        <tbody>
          {participants.map((row) => (
            <tr key={row.team.team_id ?? row.team.name} className="border-t border-neutral-800/70">
              <td className="truncate px-4 py-2">{row.team.name ?? `#${row.team.team_id}`}</td>
              <td className="py-2 text-right font-mono text-radiant">{row.series_won}</td>
              <td className="py-2 text-right font-mono text-dire">{row.series_lost}</td>
              <td
                className={cn(
                  'py-2 text-right font-mono',
                  row.series_drawn > 0 ? 'text-neutral-300' : 'text-neutral-600',
                )}
              >
                {row.series_drawn}
              </td>
              <td className="px-4 py-2 text-right font-mono text-neutral-400">
                {row.maps_won}:{row.maps_lost}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {noOutcomesKnown && (
        <p className="border-t border-neutral-800 px-4 py-2 text-xs text-neutral-500">
          Исходы серий этого турнира неизвестны — он ещё не сопоставлен с Liquipedia, поэтому
          формат серий не определён. Счёт по картам считается в любом случае.
        </p>
      )}
    </section>
  )
}
