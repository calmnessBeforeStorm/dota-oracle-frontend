import type { DraftEntry } from '@/api/types'
import { cn, heroImageUrl } from '@/lib/utils'

/**
 * F2: the draft, in the order it happened.
 *
 * Kept as one chronological strip rather than split into two per-side lists, because the
 * order is the information: a ban answers the pick before it, and separating the sides
 * throws that away.
 *
 * `orderIsKnown` is the exception to that. A live match's draft comes from the scoreboard,
 * which lists picks and bans per side and never numbers them across the draft, so the
 * interleaving is genuinely lost until the match is parsed. The strip still shows what was
 * taken, and the caption stops claiming a sequence we do not have.
 */
export function DraftStrip({
  draft,
  orderIsKnown = true,
}: {
  draft: DraftEntry[]
  orderIsKnown?: boolean
}) {
  if (draft.length === 0) return null

  const picks = draft.filter((entry) => entry.is_pick)
  const bans = draft.filter((entry) => !entry.is_pick)

  return (
    <section className="rounded-lg border border-neutral-800 bg-neutral-900 p-4">
      <h2 className="mb-3 text-sm text-neutral-400">
        Драфт <span className="text-neutral-600">· {picks.length} пиков, {bans.length} банов</span>
      </h2>

      <ol className="flex flex-wrap gap-1.5">
        {draft.map((entry) => {
          const image = heroImageUrl(entry.hero_image)
          return (
            <li
              key={entry.order}
              title={`${orderIsKnown ? `${entry.order + 1}. ` : ''}${
                entry.is_pick ? 'пик' : 'бан'
              } · ${entry.is_radiant ? 'Radiant' : 'Dire'} · ${entry.hero_name ?? entry.hero_id}`}
              className={cn(
                'relative overflow-hidden rounded border',
                entry.is_radiant ? 'border-radiant-dim' : 'border-dire-dim',
                // A ban is a hero taken off the board. Dimmed rather than hidden, and kept
                // legible: at full grayscale on a dark portrait the mark disappeared and the
                // strip read as twenty-four picks.
                entry.is_pick ? 'opacity-100' : 'opacity-60 grayscale',
              )}
            >
              {image ? (
                <img src={image} alt="" loading="lazy" className="h-[34px] w-[60px] object-cover" />
              ) : (
                <span className="flex h-[34px] w-[60px] items-center justify-center bg-neutral-800 text-[10px] text-neutral-500">
                  {entry.hero_id}
                </span>
              )}
              {!entry.is_pick && (
                <span
                  className="absolute inset-0 flex items-center justify-center bg-neutral-950/40 text-xl font-bold text-dire"
                  aria-hidden
                >
                  ✕
                </span>
              )}
            </li>
          )
        })}
      </ol>

      <p className="mt-2 text-xs text-neutral-600">
        {orderIsKnown
          ? 'Слева направо — порядок драфта. Рамка — сторона, перечёркнутые — баны.'
          : 'Сгруппировано по сторонам: пока матч идёт, порядок драфта Valve не отдаёт. Рамка — сторона, перечёркнутые — баны.'}
      </p>
    </section>
  )
}
