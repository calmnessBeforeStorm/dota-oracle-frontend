# Pro Segment — Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When no live match of the selected tier is on, show a large review of the latest finished match (full probability chart, "decided from minute N"), filter the "played" feed by the tier chips on the server, and split the accuracy dashboard into Tier 1 / Pro / Excluded segments.

**Architecture:** A pure function (`src/lib/decided.ts`) finds the turning point of a finished match's curve. A new `LastMatchReview` component reuses `ProbabilityChart` with the full curve from `/api/matches/{id}`. The home page passes the selected tier chips to `/api/matches/recent?tiers=`, promotes the first match into the review when the live list is empty, and the accuracy page adds segment pills backed by `/api/model/metrics?segment=`.

**Tech Stack:** React 18, TypeScript (strict, `noUncheckedIndexedAccess`), TanStack Router + React Query v5, Tailwind, Recharts, Vitest + Testing Library (jsdom).

**Spec:** `../dota-oracle-backend/docs/superpowers/specs/2026-09-11-pro-segment-design.md` — section 3 is this plan. The backend half is `../dota-oracle-backend/docs/superpowers/plans/2026-09-12-pro-segment-backend.md`; tests here stub `fetch`, so they do not need it running, but the running app does.

## Global Constraints

- Work on branch `feature/pro-segment` in `dota-oracle-frontend`, created from `development`. Never commit to or push `main`.
- Every command runs from `dota-oracle-frontend/`.
- Commit author is the repo-local `user.email` (`ersaim.adilet@yandex.kz`, already set). Commit messages: English, imperative, lowercase start. **No `Co-Authored-By` or any AI attribution trailer.**
- Code comments in English; UI strings in Russian, exactly as written in this plan.
- `src/api/types.ts` mirrors `app/schemas/common.py` (frontend invariant 14): new backend fields land in the same change.
- Segment keys, exactly: `'tier1' | 'pro' | 'excluded'`; default `'tier1'`. Tier chip keys stay `'tier1' | 'tier2' | 'tier3' | 'unknown'`.
- The curve turning point rule (spec section 3), exactly: sort by minute; winner's probability `p_w = radiantWin ? p_radiant : 1 - p_radiant`; `p_w === 0.5` counts as `>= 0.5`; empty -> `none`; last point `p_w < 0.5` -> `never`; no point below 0.5 -> `wire`; otherwise `decided` at the minute of the point right after the last one below 0.5.
- Recharts' `ResponsiveContainer` needs `ResizeObserver`, which jsdom lacks: any test that renders a chart stubs it with `vi.stubGlobal('ResizeObserver', ...)`.
- Before pushing: `npm run lint && npm run typecheck && npm test && npm run build`.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/decided.ts` (create) | `decidedMinute`, `decidedLabel` |
| `src/components/ProbabilityChart.tsx` (modify) | Optional `marker` line and `height` |
| `src/components/LastMatchReview.tsx` (create) | The large review of one finished match |
| `src/api/types.ts` (modify) | `LiveMatch.valve_tier`, `Segment`, `SegmentCount`, `ModelMetrics` fields |
| `src/api/queries.ts` (modify) | `recentMatchesQuery(limit, tiers)`, `modelMetricsQuery(version, segment)` |
| `src/routes/live.tsx` (modify) | Tiers to `recent`, review when live is empty |
| `src/lib/metrics.ts` (modify) | `SEGMENT_OPTIONS`, `segmentLabel`, `otherSegmentsSummary` |
| `src/routes/accuracy.tsx` (modify) | Segment pills, segment-aware empty state |
| `CLAUDE.md`, `docs/spec.md` (modify) | Documentation |

---

### Task 0: Branch

- [ ] **Step 1: Create the branch**

```bash
git switch development && git pull --ff-only
git switch -c feature/pro-segment
```

- [ ] **Step 2: Commit this plan onto the branch**

```bash
git add docs/superpowers/plans/2026-09-12-pro-segment-frontend.md
git commit -m "add the frontend plan for the pro segment"
```

---

### Task 1: The turning point of a finished match

**Files:**
- Create: `src/lib/decided.ts`
- Test: `src/lib/decided.test.ts`

**Interfaces:**
- Consumes: `PredictionPoint` from `@/api/types` (existing: `{ minute: number; p_radiant: number; predicted_at: string }`).
- Produces (used by Task 2):
  - `type Decided = { kind: 'none' } | { kind: 'never' } | { kind: 'wire' } | { kind: 'decided'; minute: number }`
  - `decidedMinute(curve: PredictionPoint[], radiantWin: boolean): Decided`
  - `decidedLabel(decided: Decided): string | null`

- [ ] **Step 1: Write the failing test**

Create `src/lib/decided.test.ts`:

```ts
import { describe, expect, it } from 'vitest'

import type { PredictionPoint } from '@/api/types'
import { decidedLabel, decidedMinute } from './decided'

function curve(...points: [number, number][]): PredictionPoint[] {
  return points.map(([minute, p]) => ({
    minute,
    p_radiant: p,
    predicted_at: '2026-09-01T12:00:00Z',
  }))
}

describe('decidedMinute', () => {
  it('says nothing about an empty curve', () => {
    expect(decidedMinute([], true)).toEqual({ kind: 'none' })
  })

  it('finds the start of the last stretch the winner stayed ahead', () => {
    const points = curve([0, 0.6], [10, 0.4], [20, 0.45], [27, 0.55], [35, 0.8])
    expect(decidedMinute(points, true)).toEqual({ kind: 'decided', minute: 27 })
  })

  it('reads the curve from the winner side when Dire won', () => {
    // Dire's probability is 0.7, 0.4, 0.6: behind at 10, ahead from 20.
    const points = curve([0, 0.3], [10, 0.6], [20, 0.4])
    expect(decidedMinute(points, false)).toEqual({ kind: 'decided', minute: 20 })
  })

  it('counts exactly one half as ahead', () => {
    expect(decidedMinute(curve([0, 0.4], [10, 0.5]), true)).toEqual({
      kind: 'decided',
      minute: 10,
    })
  })

  it('calls a winner ahead from the first point a favourite throughout', () => {
    expect(decidedMinute(curve([0, 0.55], [10, 0.7]), true)).toEqual({ kind: 'wire' })
    expect(decidedMinute(curve([12, 0.7]), true)).toEqual({ kind: 'wire' })
  })

  it('admits the model never saw the winner', () => {
    // The last live snapshot is taken about half a minute before the throne falls.
    expect(decidedMinute(curve([0, 0.6], [30, 0.4]), true)).toEqual({ kind: 'never' })
    expect(decidedMinute(curve([12, 0.3]), true)).toEqual({ kind: 'never' })
  })

  it('does not trust the order the points arrived in', () => {
    const points = curve([35, 0.8], [0, 0.6], [27, 0.55], [10, 0.4], [20, 0.45])
    expect(decidedMinute(points, true)).toEqual({ kind: 'decided', minute: 27 })
  })
})

describe('decidedLabel', () => {
  it('words every outcome', () => {
    expect(decidedLabel({ kind: 'decided', minute: 27 })).toBe('Решён с 27-й минуты')
    expect(decidedLabel({ kind: 'wire' })).toBe('Фаворит с первой минуты')
    expect(decidedLabel({ kind: 'never' })).toBe('Модель до конца не видела победителя')
    expect(decidedLabel({ kind: 'none' })).toBeNull()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/decided.test.ts`
Expected: FAIL — `Failed to resolve import "./decided"`

- [ ] **Step 3: Write minimal implementation**

Create `src/lib/decided.ts`:

```ts
import type { PredictionPoint } from '@/api/types'

/**
 * Where a finished match turned, read off the model's own curve.
 *
 * Deliberately not a verdict on the model: "decided from minute 27" says when the winner's
 * probability last crossed one half and stayed there, which is a fact about the curve. The
 * three other outcomes are named rather than forced into a minute - a winner ahead from the
 * first point has no turning point, and a curve that ends with the winner behind (the last
 * live snapshot lands about thirty seconds before the throne falls) never saw one.
 */
export type Decided =
  | { kind: 'none' }
  | { kind: 'never' }
  | { kind: 'wire' }
  | { kind: 'decided'; minute: number }

export function decidedMinute(curve: PredictionPoint[], radiantWin: boolean): Decided {
  const points = [...curve].sort((a, b) => a.minute - b.minute)
  const last = points.at(-1)
  if (last === undefined) return { kind: 'none' }

  const winner = (point: PredictionPoint) => (radiantWin ? point.p_radiant : 1 - point.p_radiant)
  if (winner(last) < 0.5) return { kind: 'never' }

  let lastBehind = -1
  points.forEach((point, index) => {
    if (winner(point) < 0.5) lastBehind = index
  })
  const turn = points[lastBehind + 1]
  if (lastBehind === -1 || turn === undefined) return { kind: 'wire' }
  return { kind: 'decided', minute: turn.minute }
}

export function decidedLabel(decided: Decided): string | null {
  switch (decided.kind) {
    case 'decided':
      return `Решён с ${decided.minute}-й минуты`
    case 'wire':
      return 'Фаворит с первой минуты'
    case 'never':
      return 'Модель до конца не видела победителя'
    case 'none':
      return null
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/lib/decided.test.ts`
Expected: PASS (8 tests)

Run: `npm run typecheck`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/lib/decided.ts src/lib/decided.test.ts
git commit -m "find where a finished match turned on the probability curve"
```

---

### Task 2: `LastMatchReview` and the chart marker

**Files:**
- Modify: `src/components/ProbabilityChart.tsx:17-30`
- Create: `src/components/LastMatchReview.tsx`
- Test: `src/components/LastMatchReview.test.tsx`

**Interfaces:**
- Consumes: `decidedMinute`, `decidedLabel` (Task 1); `matchDetailQuery(matchId)` (existing, returns `MatchDetail` with `curve: PredictionPoint[]` and `timeline: TimelineEvent[]`); `RecentMatch` (existing); `Surface`, `TeamName`, `TierBadge` (existing).
- Produces (used by Task 3):
  - `ProbabilityChart` props `marker?: number | null`, `height?: number` (default 280)
  - `LastMatchReview({ match }: { match: RecentMatch })`

- [ ] **Step 1: Write the failing test**

Create `src/components/LastMatchReview.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { RecentMatch } from '@/api/types'
import { LastMatchReview } from './LastMatchReview'

const MATCH: RecentMatch = {
  match_id: 1,
  league_id: 10,
  league_name: 'DreamLeague Season 30',
  tier: 'tier1',
  radiant: { team_id: 1, name: 'Team Spirit', logo_url: null },
  dire: { team_id: 2, name: 'Falcons', logo_url: null },
  radiant_win: true,
  started_at: '2026-09-01T12:00:00Z',
  series: {
    series_id: null,
    format: null,
    score_a: 0,
    score_b: 0,
    winner_team_id: null,
    is_draw: false,
    game_in_series: 1,
    is_conditional_game: false,
  },
  // The feed's thinned curve misses the dip: on its own it reads as a wire-to-wire win.
  curve: [
    { minute: 0, p_radiant: 0.6, predicted_at: '2026-09-01T12:00:00Z' },
    { minute: 35, p_radiant: 0.8, predicted_at: '2026-09-01T12:35:00Z' },
  ],
  p_at_ten: null,
  model_version: 'lgbm-20260901-102407',
}

const FULL_CURVE = [
  [0, 0.6],
  [10, 0.4],
  [20, 0.45],
  [27, 0.55],
  [35, 0.8],
].map(([minute, p]) => ({ minute, p_radiant: p, predicted_at: '2026-09-01T12:00:00Z' }))

function stubDetail(curve: unknown) {
  vi.stubGlobal('fetch', (input: RequestInfo | URL) => {
    const path = new URL(String(input), 'http://localhost').pathname
    const body = path === '/api/matches/1' ? { curve, timeline: [] } : []
    return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }))
  })
}

function renderReview(match: RecentMatch) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const root = createRootRoute()
  const index = createRoute({
    getParentRoute: () => root,
    path: '/',
    component: () => <LastMatchReview match={match} />,
  })
  const detail = createRoute({
    getParentRoute: () => root,
    path: '/match/$matchId',
    component: () => null,
  })
  const router = createRouter({
    routeTree: root.addChildren([index, detail]),
    history: createMemoryHistory({ initialEntries: ['/'] }),
  })
  return render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

beforeEach(() => {
  // Recharts' ResponsiveContainer observes its size; jsdom has no ResizeObserver.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('LastMatchReview', () => {
  it('reads the turning point off the full curve, not the thinned one', async () => {
    stubDetail(FULL_CURVE)
    renderReview(MATCH)
    expect(await screen.findByText('Решён с 27-й минуты')).toBeInTheDocument()
  })

  it('says so when the model never saw the winner', async () => {
    stubDetail([
      { minute: 0, p_radiant: 0.6, predicted_at: '2026-09-01T12:00:00Z' },
      { minute: 30, p_radiant: 0.35, predicted_at: '2026-09-01T12:30:00Z' },
    ])
    renderReview(MATCH)
    expect(await screen.findByText('Модель до конца не видела победителя')).toBeInTheDocument()
  })

  it('names the league and links to the match card', async () => {
    stubDetail(FULL_CURVE)
    renderReview(MATCH)
    expect(await screen.findByText('DreamLeague Season 30')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /к матчу/ })).toHaveAttribute('href', '/match/1')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/LastMatchReview.test.tsx`
Expected: FAIL — `Failed to resolve import "./LastMatchReview"`

- [ ] **Step 3: Extend `ProbabilityChart`**

In `src/components/ProbabilityChart.tsx` replace the component signature and the `ResponsiveContainer` opening line:

```tsx
/** F2: probability curve over the course of the map, with key events on the same time axis. */
export function ProbabilityChart({
  curve,
  events = [],
  marker = null,
  height = 280,
}: {
  curve: PredictionPoint[]
  events?: TimelineEvent[]
  /** Minute to mark with a solid line - where a finished match turned. */
  marker?: number | null
  height?: number
}) {
  if (curve.length === 0) {
    return <p className="py-12 text-center text-sm text-neutral-500">Прогнозов пока нет</p>
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
```

and right after the `<ReferenceLine y={0.5} ... />` line add:

```tsx
        {/* Solid and neutral: the event markers are dashed and coloured by side, and this one
            belongs to neither side - it is where the winner took the lead for good. */}
        {marker !== null && <ReferenceLine x={marker} stroke="#a3a3a3" strokeWidth={1.5} />}
```

- [ ] **Step 4: Create the component**

Create `src/components/LastMatchReview.tsx`:

```tsx
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'

import { matchDetailQuery } from '@/api/queries'
import type { RecentMatch } from '@/api/types'
import { decidedLabel, decidedMinute } from '@/lib/decided'
import { Surface } from '@/ui/Surface'
import { TeamName } from '@/ui/TeamName'
import { ProbabilityChart } from './ProbabilityChart'
import { TierBadge } from './TierBadge'

const DAY_MONTH = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })

/**
 * The latest finished match, large - what the home page shows while nothing of the selected
 * tier is live.
 *
 * The feed's own curve is thinned to about thirty points for a sparkline and can skip the very
 * dip that makes a match interesting, so the full curve and the events come from the match
 * card. Until they arrive the thinned curve is drawn, and the label may change once.
 */
export function LastMatchReview({ match }: { match: RecentMatch }) {
  const detail = useQuery(matchDetailQuery(match.match_id))
  const curve = detail.data?.curve ?? match.curve
  const decided = decidedMinute(curve, match.radiant_win)
  const label = decidedLabel(decided)
  const winnerSide = match.radiant_win ? 'radiant' : 'dire'
  const winner = match.radiant_win ? match.radiant : match.dire

  return (
    <Surface level="raised" className="space-y-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-micro uppercase text-ink-faint">Последний матч</span>
          <TierBadge tier={match.tier} />
          {(match.league_name ?? match.league_id) !== null && (
            <span className="truncate text-body text-ink-dim">
              {match.league_name ?? `Лига ${match.league_id}`}
            </span>
          )}
        </div>
        {match.started_at && (
          <span className="font-mono text-micro text-ink-faint">
            {DAY_MONTH.format(new Date(match.started_at))}
          </span>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-3 text-body">
        <TeamName name={match.radiant.name} side="radiant" />
        <TeamName name={match.dire.name} side="dire" />
      </div>

      <ProbabilityChart
        curve={curve}
        events={detail.data?.timeline ?? []}
        marker={decided.kind === 'decided' ? decided.minute : null}
        height={220}
      />

      <div className="flex flex-wrap items-baseline justify-between gap-3 text-micro text-ink-faint">
        <span>
          Победа <TeamName name={winner.name} side={winnerSide} />
          {label && (
            <>
              {' · '}
              <span className="text-ink-dim">{label}</span>
            </>
          )}
        </span>
        <Link
          to="/match/$matchId"
          params={{ matchId: String(match.match_id) }}
          className="text-ink-dim underline-offset-2 hover:underline"
        >
          к матчу →
        </Link>
      </div>
    </Surface>
  )
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test -- src/components/LastMatchReview.test.tsx`
Expected: PASS (3 tests)

Run: `npm run typecheck && npm run lint`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/components/ProbabilityChart.tsx src/components/LastMatchReview.tsx src/components/LastMatchReview.test.tsx
git commit -m "add a large review of the latest finished match"
```

---

### Task 3: Home page — tiers to the played feed, review when nothing is live

**Files:**
- Modify: `src/api/types.ts:13-39` (`LiveMatch`)
- Modify: `src/api/queries.ts:22-29` (`recentMatchesQuery`)
- Modify: `src/routes/live.tsx`
- Test: `src/routes/live.test.tsx`

**Interfaces:**
- Consumes: `LastMatchReview` (Task 2); `Tier` from `@/lib/tiers` (existing: `'tier1' | 'tier2' | 'tier3' | 'unknown'`); backend `GET /api/matches/recent?limit=&tiers=` (backend plan Task 6).
- Produces: `recentMatchesQuery(limit?: number, tiers?: Tier[])`; `LiveMatch.valve_tier: string | null`.

- [ ] **Step 1: Write the failing tests**

In `src/routes/live.test.tsx`:

Change the vitest import to include `beforeEach`, and replace `stubApi` with a version that records requests and add the ResizeObserver stub:

```tsx
const requested: URL[] = []

beforeEach(() => {
  requested.length = 0
  // The latest-match review draws a Recharts chart; jsdom has no ResizeObserver.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
})

function stubApi(routes: Record<string, unknown>) {
  vi.stubGlobal('fetch', (input: RequestInfo | URL) => {
    const url = new URL(String(input), 'http://localhost')
    requested.push(url)
    // `in`, not `??`: a null stub means "the endpoint answered empty", and swapping it for an
    // empty array would feed the component something it never gets in production.
    const body = url.pathname in routes ? routes[url.pathname] : []
    return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }))
  })
}

function recentTiers(): string[][] {
  return requested
    .filter((url) => url.pathname === '/api/matches/recent')
    .map((url) => (url.searchParams.get('tiers') ?? '').split(',').sort())
}
```

(`afterEach` already calls `vi.unstubAllGlobals()` and `localStorage.clear()`; keep it.)

Replace the test `'falls back to played matches when nothing is live'` with:

```tsx
  it('shows the latest played match large when nothing is live', async () => {
    stubApi({
      '/api/matches/live': [],
      '/api/model/metrics': null,
      '/api/matches/recent': [PLAYED],
    })
    renderHome()
    expect(await screen.findByText('Последний матч')).toBeInTheDocument()
    // The one match is in the review, not repeated as a card below it.
    expect(screen.queryByText(/на 10-й минуте/)).not.toBeInTheDocument()
  })

  it('keeps older played matches as cards under the review', async () => {
    stubApi({
      '/api/matches/live': [],
      '/api/model/metrics': null,
      '/api/matches/recent': [PLAYED, { ...PLAYED, match_id: 2, league_name: 'ESL One 2026' }],
    })
    renderHome()
    expect(await screen.findByText('Последний матч')).toBeInTheDocument()
    expect(await screen.findByText('ESL One 2026')).toBeInTheDocument()
    expect(screen.getAllByText(/на 10-й минуте/)).toHaveLength(1)
  })
```

Append a new `describe` block:

```tsx
describe('played feed follows the tier chips', () => {
  it('asks the server for Tier 1 by default', async () => {
    stubApi({ '/api/matches/live': [], '/api/matches/recent': [], '/api/model/metrics': null })
    renderHome()
    await screen.findByText(/Сверенных матчей пока нет/i)
    expect(recentTiers()).toContainEqual(['tier1'])
  })

  it('asks again with the added chip', async () => {
    stubApi({
      '/api/matches/live': [liveMatch('tier1', 1, 'The International 2026')],
      '/api/matches/recent': [],
      '/api/model/metrics': null,
    })
    renderHome()
    fireEvent.click(await screen.findByRole('button', { name: /Без разметки/ }))
    await waitFor(() => expect(recentTiers()).toContainEqual(['tier1', 'unknown']))
  })

  it('shows the played cards without a review while something is live', async () => {
    stubApi({
      '/api/matches/live': [liveMatch('tier1', 1, 'The International 2026')],
      '/api/matches/recent': [PLAYED],
      '/api/model/metrics': null,
    })
    renderHome()
    expect(await screen.findByText(/на 10-й минуте/)).toBeInTheDocument()
    expect(screen.queryByText('Последний матч')).not.toBeInTheDocument()
  })
})
```

Add `waitFor` to the `@testing-library/react` import.

- [ ] **Step 2: Run to verify failure**

Run: `npm test -- src/routes/live.test.tsx`
Expected: FAIL — `Unable to find an element with the text: Последний матч` and the tiers assertions failing (no `tiers` param yet).

- [ ] **Step 3: Types and query**

In `src/api/types.ts`, `LiveMatch`, after `tier: string` add:

```ts
  /**
   * Valve's league tier from OpenDota /leagues. The server already drops everything but
   * professional and premium leagues from the feed; null means the tier is not known yet.
   */
  valve_tier: string | null
```

In `src/api/queries.ts` add `import type { Tier } from '@/lib/tiers'` and replace `recentMatchesQuery` with:

```ts
export const recentMatchesQuery = (limit = 20, tiers?: Tier[]) => {
  // Sorted so that chip order does not split one question into two cache entries.
  const wanted = tiers && tiers.length > 0 ? [...tiers].sort().join(',') : undefined
  return queryOptions({
    queryKey: ['matches', 'recent', limit, wanted ?? 'all'],
    // Filtered on the server: the twenty newest matches can hold no Tier 1 at all while
    // older ones do, and a client-side filter would then show nothing.
    queryFn: () =>
      apiGet<RecentMatch[]>('/matches/recent', { limit: String(limit), tiers: wanted }),
    // The played feed changes only when a match has ended and its outcome has arrived from an
    // external source - minutes, not seconds.
    staleTime: 5 * 60_000,
  })
}
```

- [ ] **Step 4: The page**

In `src/routes/live.tsx`:

- add `import { LastMatchReview } from '@/components/LastMatchReview'`;
- move `const [tiers, setTiers] = useState<Tier[]>(readTiers)` above the queries and change the recent query to `const recent = useQuery(recentMatchesQuery(20, tiers))`;
- after `const hidden = feed.length - liveMatches.length` add:

```tsx
  // Nothing of the selected tier on air: the newest played match takes the space, large,
  // and is not repeated among the cards.
  const [latest, ...older] = playedMatches
  const review = liveMatches.length === 0 ? latest : undefined
  const playedCards = review ? older : playedMatches
```

- between the closing `</section>` of «Идут сейчас» and the «Сыграно» `<section>`, add:

```tsx
      {review && <LastMatchReview match={review} />}
```

- replace the whole «Сыграно» `<section>...</section>` with:

```tsx
      {playedMatches.length === 0 ? (
        <section className="space-y-3">
          <h2 className="text-body text-ink-faint">
            Сыграно <span className="opacity-70">· только матчи, по которым мы дали прогноз</span>
          </h2>
          <Empty
            title="Сверенных матчей пока нет"
            hint="Матч попадает сюда после того, как закончился и его исход приехал из внешнего источника"
          />
        </section>
      ) : (
        playedCards.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-body text-ink-faint">
              Сыграно <span className="opacity-70">· только матчи, по которым мы дали прогноз</span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {playedCards.map((match) => (
                <PlayedMatchCard key={match.match_id} match={match} />
              ))}
            </div>
          </section>
        )
      )}
```

- in the doc comment of `HomePage`, translate it to English and add one sentence (project rule: code comments in English):

```tsx
/**
 * F1 plus the played feed.
 *
 * One route, not two. Tier 1 matches run a few hours a day, and a page that only makes sense
 * during those hours is a page that is broken most of the time. What is live comes first when
 * there is any; the rest of the time the newest played match takes the screen, large, with the
 * point where it turned. The server drops amateur leagues from both feeds; the chips choose
 * among professional tiers.
 */
```

- translate the Russian comment above `const counts = feed.reduce(...)` to English:

```tsx
  // The tier comes with the feed - the poller writes it into the snapshot - so the chips are
  // counted here rather than by a request: the feed is tens of entries, and counts for hidden
  // tiers are needed at once, otherwise "nothing is on" and "everything is filtered" look alike.
```

- [ ] **Step 5: Run to verify pass**

Run: `npm test -- src/routes/live.test.tsx`
Expected: PASS (all tests in the file)

Run: `npm run typecheck && npm run lint`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/api/types.ts src/api/queries.ts src/routes/live.tsx src/routes/live.test.tsx
git commit -m "review the latest played match when nothing of the chosen tier is live"
```

---

### Task 4: Accuracy dashboard segments

**Files:**
- Modify: `src/api/types.ts:151-206` (`ModelMetrics`; new `Segment`, `SegmentCount`)
- Modify: `src/api/queries.ts:37-45` (`modelMetricsQuery`)
- Modify: `src/lib/metrics.ts`
- Modify: `src/routes/accuracy.tsx`
- Modify fixtures: `src/lib/metrics.test.ts:19`, `src/components/TrainingStatus.test.tsx:45`, `src/components/ModelStrip.test.tsx:42`
- Test: `src/lib/metrics.test.ts`, `src/routes/accuracy.test.tsx` (create)

**Interfaces:**
- Consumes: backend `GET /api/model/metrics?version=&segment=` returning `segment`, `segments`, `unsegmented_matches` (backend plan Task 7); `matchesLabel(n)` (existing in `lib/metrics.ts`).
- Produces:
  - `type Segment = 'tier1' | 'pro' | 'excluded'`, `interface SegmentCount { segment: string; matches: number }`
  - `ModelMetrics.segment: string`, `ModelMetrics.segments: SegmentCount[]`, `ModelMetrics.unsegmented_matches: number`
  - `modelMetricsQuery(version?: string, segment?: Segment)`
  - `SEGMENT_OPTIONS: { key: Segment; label: string }[]`, `segmentLabel(key: string): string`, `otherSegmentsSummary(data: ModelMetrics): string | null`

- [ ] **Step 1: Types and fixtures**

In `src/api/types.ts`, above `export interface ModelMetrics`, add:

```ts
/** Slices of the accuracy dashboard. Tier 1 is the product's domain; Excluded is the control group. */
export type Segment = 'tier1' | 'pro' | 'excluded'

export interface SegmentCount {
  segment: string
  matches: number
}
```

and in `ModelMetrics`, after `versions: ModelVersionInfo[]`, add:

```ts
  /** The slice every number above is computed in. */
  segment: string
  /** Scored matches of this version per segment - all three, zeros included. */
  segments: SegmentCount[]
  /** Scored matches whose league had no known Valve tier: in no segment. */
  unsegmented_matches: number
```

In each of `src/lib/metrics.test.ts`, `src/components/TrainingStatus.test.tsx` and `src/components/ModelStrip.test.tsx`, right after the fixture line `versions: [],` add:

```ts
  segment: 'tier1',
  segments: [],
  unsegmented_matches: 0,
```

(match the indentation of the surrounding fixture).

Run: `npm run typecheck`
Expected: no errors (the fixtures satisfy the extended type)

- [ ] **Step 2: Write the failing tests**

Append to `src/lib/metrics.test.ts` (add `otherSegmentsSummary, segmentLabel` to its import from `./metrics`):

```ts
describe('segments', () => {
  const withSegments = (segment: string, counts: [string, number][]): ModelMetrics => ({
    ...empty,
    segment,
    segments: counts.map(([name, matches]) => ({ segment: name, matches })),
  })

  it('names segments the way the pills do', () => {
    expect(segmentLabel('tier1')).toBe('Tier 1')
    expect(segmentLabel('pro')).toBe('Pro')
    expect(segmentLabel('excluded')).toBe('Excluded')
  })

  it('says where the data is when the selected slice is empty', () => {
    const data = withSegments('tier1', [
      ['tier1', 0],
      ['pro', 14],
      ['excluded', 249],
    ])
    expect(otherSegmentsSummary(data)).toBe('в Pro — 14 матчей, в Excluded — 249 матчей')
  })

  it('says nothing when no other slice has data either', () => {
    const data = withSegments('tier1', [
      ['tier1', 0],
      ['pro', 0],
      ['excluded', 0],
    ])
    expect(otherSegmentsSummary(data)).toBeNull()
  })
})
```

If `empty` in that file is declared inside a `describe`, move it to module scope first.

Create `src/routes/accuracy.test.tsx`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { accuracyRoute } from './accuracy'
import { liveRoute } from './live'
import { matchRoute } from './match'
import { rootRoute } from './root'

const TIER1_EMPTY = {
  model_version: 'lgbm-20260901-102407',
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
  segment: 'tier1',
  segments: [
    { segment: 'tier1', matches: 0 },
    { segment: 'pro', matches: 14 },
    { segment: 'excluded', matches: 249 },
  ],
  unsegmented_matches: 3,
}

const EXCLUDED = {
  ...TIER1_EMPTY,
  segment: 'excluded',
  sample_size: 5210,
  matches: 249,
  predicted_matches: 253,
  awaiting_outcome: 4,
  log_loss: 0.61,
  brier: 0.21,
  ece: 0.05,
  by_minute: [{ bucket: '10-14', count: 5210, log_loss: 0.61, brier: 0.21, accuracy: 0.7 }],
  reliability: [{ predicted: 0.7, observed: 0.68, count: 5210 }],
}

const requested: URL[] = []

beforeEach(() => {
  requested.length = 0
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  vi.stubGlobal('fetch', (input: RequestInfo | URL) => {
    const url = new URL(String(input), 'http://localhost')
    requested.push(url)
    const body =
      url.pathname === '/api/model/metrics'
        ? url.searchParams.get('segment') === 'excluded'
          ? EXCLUDED
          : TIER1_EMPTY
        : []
    return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }))
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function renderAccuracy() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createRouter({
    routeTree: rootRoute.addChildren([liveRoute, matchRoute, accuracyRoute]),
    history: createMemoryHistory({ initialEntries: ['/accuracy'] }),
  })
  return render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('accuracy segments', () => {
  it('opens on Tier 1 and says where the data is instead', async () => {
    renderAccuracy()
    expect(await screen.findByText(/В Tier 1 сверенных матчей пока нет/)).toBeInTheDocument()
    expect(screen.getByText(/в Pro — 14 матчей, в Excluded — 249 матчей/)).toBeInTheDocument()
    expect(screen.getByText(/Ещё 3 матча без известного тира/)).toBeInTheDocument()
    const metricsRequests = requested.filter((url) => url.pathname === '/api/model/metrics')
    expect(metricsRequests[0]?.searchParams.get('segment')).toBe('tier1')
  })

  it('shows each segment with its match count', async () => {
    renderAccuracy()
    expect(await screen.findByRole('button', { name: /Pro\s*14/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Excluded\s*249/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Tier 1\s*0/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('switches to the control group and labels it as one', async () => {
    renderAccuracy()
    fireEvent.click(await screen.findByRole('button', { name: /Excluded/ }))
    // Log loss appears twice - the tile and the per-minute table - so findAll, not find.
    expect((await screen.findAllByText('0.6100')).length).toBeGreaterThan(0)
    expect(screen.getByText(/контрольная группа/)).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run to verify failure**

Run: `npm test -- src/lib/metrics.test.ts src/routes/accuracy.test.tsx`
Expected: FAIL — `segmentLabel is not a function` / unable to find `В Tier 1 сверенных матчей пока нет`

- [ ] **Step 4: Library**

Append to `src/lib/metrics.ts` (add `Segment` to its type import from `@/api/types`):

```ts
/**
 * Dashboard slices, in pill order. Excluded is kept - it is the control group that shows
 * whether the model behaves differently outside the domain it was trained on - but it is never
 * the default and never unlabelled.
 */
export const SEGMENT_OPTIONS: { key: Segment; label: string }[] = [
  { key: 'tier1', label: 'Tier 1' },
  { key: 'pro', label: 'Pro' },
  { key: 'excluded', label: 'Excluded' },
]

export function segmentLabel(key: string): string {
  return SEGMENT_OPTIONS.find((option) => option.key === key)?.label ?? key
}

/** "в Pro — 14 матчей, в Excluded — 249 матчей", or null when no other slice has data. */
export function otherSegmentsSummary(data: ModelMetrics): string | null {
  const parts = data.segments
    .filter((count) => count.segment !== data.segment && count.matches > 0)
    .map((count) => `в ${segmentLabel(count.segment)} — ${matchesLabel(count.matches)}`)
  return parts.length > 0 ? parts.join(', ') : null
}
```

- [ ] **Step 5: Query**

In `src/api/queries.ts` add `Segment` to the type import from `./types`, add `keepPreviousData` to the `@tanstack/react-query` import, and replace `modelMetricsQuery` with:

```ts
export const modelMetricsQuery = (version?: string, segment: Segment = 'tier1') =>
  queryOptions({
    queryKey: ['model', 'metrics', version ?? 'served', segment],
    queryFn: () => apiGet<ModelMetrics>('/model/metrics', { version, segment }),
    // Switching a pill keeps the page on screen instead of flashing "loading".
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  })
```

- [ ] **Step 6: Page**

In `src/routes/accuracy.tsx`:

- change the imports:

```tsx
import type { ModelMetrics, Segment } from '@/api/types'
import {
  SEGMENT_OPTIONS,
  formatMetric,
  isSmallSample,
  matchesLabel,
  otherSegmentsSummary,
  segmentLabel,
  versionChoices,
} from '@/lib/metrics'
```

- replace `EmptyState` with:

```tsx
function EmptyState({ data }: { data: ModelMetrics }) {
  const elsewhere = data.versions.filter((v) => v.version !== data.model_version)
  const others = otherSegmentsSummary(data)

  return (
    <div className="rounded-lg border border-dashed border-neutral-800 px-6 py-12 text-center">
      <p className="text-neutral-400">
        В {segmentLabel(data.segment)} сверенных матчей пока нет · версия{' '}
        <span className="font-mono">{data.model_version}</span>
      </p>
      {others && (
        <p className="mt-3 text-sm text-neutral-400">
          Сверено {others} — переключатель сегментов выше.
        </p>
      )}
      {data.unsegmented_matches > 0 && (
        <p className="mt-2 text-sm text-neutral-500">
          Ещё {matchesLabel(data.unsegmented_matches)} без известного тира лиги — ни в один
          сегмент они не входят.
        </p>
      )}
      <p className="mx-auto mt-3 max-w-xl text-sm text-neutral-500">
        Прогноз попадает сюда только после того, как его матч завершился и результат приехал из
        внешнего источника. Показывать вместо этого калибровку прошлой версии или другого сегмента
        нельзя: она ничего не говорит о числах, которые вы видите на сайте сейчас.
      </p>
      {elsewhere.length > 0 && (
        <p className="mt-3 text-sm text-neutral-500">
          Данные есть у других версий — они в переключателе выше.
        </p>
      )}
    </div>
  )
}
```

- in `AccuracyPage`, replace the first two lines with:

```tsx
  const [version, setVersion] = useState<string | undefined>(undefined)
  const [segment, setSegment] = useState<Segment>('tier1')
  const { data, isLoading } = useQuery(modelMetricsQuery(version, segment))
```

- directly after the version pills block (`{versions.length > 1 && (...)}`) add:

```tsx
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Сегмент">
          {SEGMENT_OPTIONS.map((option) => {
            const count =
              data.segments.find((item) => item.segment === option.key)?.matches ?? 0
            const active = option.key === data.segment
            return (
              <button
                key={option.key}
                type="button"
                aria-pressed={active}
                onClick={() => setSegment(option.key)}
                className={cn(
                  'rounded-full border px-3 py-1 text-sm transition-colors',
                  active
                    ? 'border-neutral-600 bg-neutral-800 text-neutral-100'
                    : 'border-neutral-800 text-neutral-400 hover:border-neutral-700',
                )}
              >
                {option.label}
                <span className="ml-2 text-xs text-neutral-500">{count}</span>
              </button>
            )
          })}
        </div>
        {data.segment === 'excluded' && (
          <p className="text-xs text-neutral-500">
            Excluded — контрольная группа: лиги вне домена обучения (любительские турниры, которые
            Valve не считает профессиональными). Эти цифры — не точность продукта.
          </p>
        )}
      </div>
```

- [ ] **Step 7: Run to verify pass**

Run: `npm test -- src/lib/metrics.test.ts src/routes/accuracy.test.tsx src/components/ModelStrip.test.tsx src/components/TrainingStatus.test.tsx`
Expected: PASS

Run: `npm run typecheck && npm run lint`
Expected: no errors

- [ ] **Step 8: Commit**

```bash
git add src/api/types.ts src/api/queries.ts src/lib/metrics.ts src/lib/metrics.test.ts src/routes/accuracy.tsx src/routes/accuracy.test.tsx src/components/ModelStrip.test.tsx src/components/TrainingStatus.test.tsx
git commit -m "split the accuracy dashboard into Tier 1, Pro and Excluded"
```

---

### Task 5: Documentation, full check, push, merge into `development`

**Files:**
- Modify: `CLAUDE.md` (frontend)
- Modify: `docs/spec.md` (§3)

- [ ] **Step 1: Spec §3 copy**

In `docs/spec.md` replace the line

```
Fallback до готовности маппинга — `tier == "premium"` из `/leagues` OpenDota.
```

with exactly the same paragraph the backend plan (Task 10, Step 1) put into `dota-oracle-backend/docs/spec.md`. Verify the two copies agree:

Run (from `F:\projects\dota-oracle`): `diff --strip-trailing-cr dota-oracle-backend/docs/spec.md dota-oracle-frontend/docs/spec.md`
Expected: no output

- [ ] **Step 2: Frontend `CLAUDE.md`**

Append to invariant 12 («Дашборд точности не имеет права льстить»), after its last sentence:

```markdown
   Четвёртое правило — **сегменты не смешиваются**: Tier 1 / Pro / Excluded, по умолчанию
   Tier 1, даже когда он пуст; пустой сегмент говорит, где данные есть. Excluded —
   контрольная группа (любительские лиги вне домена обучения), всегда подписана и никогда не
   выдаётся за точность продукта (дизайн `2026-09-11-pro-segment`).
```

Add a new invariant at the end of the list:

```markdown
15. **Лента — только про-лиги, и фильтр живёт на сервере.** `/api/matches/live` и
   `/api/matches/recent` не отдают лиг, которые Valve считает любительскими; чипы тиров
   выбирают среди про-тиров Liquipedia, а «Без разметки» — это про-лига, ещё не сопоставленная с
   Liquipedia. Когда идущих матчей выбранного тира нет, экран занимает `LastMatchReview` —
   последний сыгранный матч с полной кривой и отметкой «решён с N-й минуты»
   (`lib/decided.ts`). Отметка — факт о кривой, не вердикт модели.
```

- [ ] **Step 3: Full check**

Run: `npm run lint && npm run typecheck && npm test && npm run build`
Expected: all succeed; test count = previous 77 + the new tests (decided 8, LastMatchReview 3, live +4 net, metrics +3, accuracy 3).

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md docs/spec.md
git commit -m "document the pro-only feed and the accuracy segments"
```

- [ ] **Step 5: Push and merge into `development`**

The backend branch must already be merged into `development` (backend plan Task 10), otherwise the test server's SPA asks for parameters its API ignores.

```bash
git push -u origin feature/pro-segment
git switch development && git pull --ff-only
git merge --no-ff feature/pro-segment -m "merge feature/pro-segment into development"
git push origin development
git branch -d feature/pro-segment
git push origin --delete feature/pro-segment
```

Stop here. Production (`development` -> `main`) needs the owner's explicit permission for that specific deploy and ships both images together: `./deploy.sh <api-sha> <spa-sha>`.
