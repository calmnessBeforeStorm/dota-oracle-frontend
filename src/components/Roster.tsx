import type { MatchPlayerBrief } from '@/api/types'
import { cn, formatNetWorth, heroImageUrl } from '@/lib/utils'

/**
 * F2: one side's five players. Sorted by net worth rather than by slot - the position a
 * player drafted into matters far less than how the farm actually ended up distributed,
 * and that ordering is what makes two rosters comparable at a glance.
 */
export function Roster({
  players,
  side,
  teamName,
}: {
  players: MatchPlayerBrief[]
  side: 'radiant' | 'dire'
  teamName: string | null
}) {
  const sorted = [...players].sort((a, b) => (b.net_worth ?? 0) - (a.net_worth ?? 0))

  // `/proPlayers` only lists players with a pro profile, so a Tier-2 roster can come back
  // entirely nameless. Ten dashes in a column is noise, not information - the line is shown
  // only when somebody on this side has a name, which also keeps the rows the same height.
  const anyNamed = sorted.some((p) => p.player_name)

  if (sorted.length === 0) return null

  return (
    <section className="rounded-lg border border-neutral-800 bg-neutral-900">
      <header className="flex items-baseline gap-2 border-b border-neutral-800 px-4 py-2.5">
        <span
          className={cn('h-2 w-2 rounded-full', side === 'radiant' ? 'bg-radiant' : 'bg-dire')}
          aria-hidden
        />
        <h3 className="text-sm font-medium">{teamName ?? (side === 'radiant' ? 'Radiant' : 'Dire')}</h3>
      </header>

      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-neutral-500">
            <th className="px-4 py-1.5 text-left font-normal">Герой</th>
            <th className="py-1.5 text-right font-normal">K/D/A</th>
            <th className="py-1.5 text-right font-normal">Нетворс</th>
            <th className="px-4 py-1.5 text-right font-normal">GPM/XPM</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((player) => {
            const image = heroImageUrl(player.hero_image)
            return (
              <tr key={player.player_slot} className="border-t border-neutral-800/70">
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2.5">
                    {image ? (
                      <img
                        src={image}
                        alt=""
                        loading="lazy"
                        className="h-6 w-[42px] shrink-0 rounded-sm object-cover"
                      />
                    ) : (
                      <span className="h-6 w-[42px] shrink-0 rounded-sm bg-neutral-800" />
                    )}
                    <span className="min-w-0">
                      <span className="block truncate leading-tight">
                        {player.hero_name ?? `#${player.hero_id ?? '?'}`}
                      </span>
                      {/* Null rather than the account id: a number reads as a name and is not one. */}
                      {anyNamed && (
                        <span className="block truncate text-xs leading-tight text-neutral-500">
                          {player.player_name ?? '—'}
                        </span>
                      )}
                    </span>
                  </div>
                </td>
                <td className="py-2 text-right font-mono text-neutral-300">
                  {player.kills ?? 0}/{player.deaths ?? 0}/{player.assists ?? 0}
                </td>
                <td className="py-2 text-right font-mono text-neutral-300">
                  {formatNetWorth(player.net_worth)}
                </td>
                <td className="px-4 py-2 text-right font-mono text-neutral-500">
                  {player.gold_per_min ?? '—'}/{player.xp_per_min ?? '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </section>
  )
}
