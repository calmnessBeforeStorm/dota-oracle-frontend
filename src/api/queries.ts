import { keepPreviousData, queryOptions } from '@tanstack/react-query'

import type { Tier } from '@/lib/tiers'
import { apiGet } from './client'
import type {
  LiveMatch,
  MatchDetail,
  ModelMetrics,
  RecentMatch,
  Segment,
  TournamentDetail,
  TournamentSummary,
} from './types'

export const liveMatchesQuery = () =>
  queryOptions({
    queryKey: ['matches', 'live'],
    queryFn: () => apiGet<LiveMatch[]>('/matches/live'),
    // Polling is the floor, not the mechanism: live cards are pushed over WebSocket (F5).
    // This only covers reconnects and matches appearing or ending.
    refetchInterval: 30_000,
  })

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

export const matchDetailQuery = (matchId: number) =>
  queryOptions({
    queryKey: ['matches', matchId],
    queryFn: () => apiGet<MatchDetail>(`/matches/${matchId}`),
  })

export const modelMetricsQuery = (version?: string, segment: Segment = 'tier1') =>
  queryOptions({
    queryKey: ['model', 'metrics', version ?? 'served', segment],
    queryFn: () => apiGet<ModelMetrics>('/model/metrics', { version, segment }),
    // Switching a pill keeps the page on screen instead of flashing "loading".
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  })

export const tournamentsQuery = (status: 'current' | 'past' | 'all', tier?: string) =>
  queryOptions({
    queryKey: ['tournaments', status, tier ?? 'any'],
    // `tier` is omitted rather than sent empty: the endpoint treats any value as a filter,
    // and "" would match nothing instead of everything.
    queryFn: () => apiGet<TournamentSummary[]>('/tournaments', tier ? { status, tier } : { status }),
    staleTime: 10 * 60_000,
  })

export const tournamentDetailQuery = (leagueId: number) =>
  queryOptions({
    queryKey: ['tournaments', leagueId],
    queryFn: () => apiGet<TournamentDetail>(`/tournaments/${leagueId}`),
    staleTime: 10 * 60_000,
  })
