import { queryOptions } from '@tanstack/react-query'

import { apiGet } from './client'
import type {
  LiveMatch,
  MatchDetail,
  ModelMetrics,
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

export const matchDetailQuery = (matchId: number) =>
  queryOptions({
    queryKey: ['matches', matchId],
    queryFn: () => apiGet<MatchDetail>(`/matches/${matchId}`),
  })

export const modelMetricsQuery = () =>
  queryOptions({
    queryKey: ['model', 'metrics'],
    queryFn: () => apiGet<ModelMetrics>('/model/metrics'),
    staleTime: 5 * 60_000,
  })

export const tournamentsQuery = (status: 'current' | 'upcoming' | 'past' | 'all') =>
  queryOptions({
    queryKey: ['tournaments', status],
    queryFn: () => apiGet<TournamentSummary[]>('/tournaments', { status }),
    staleTime: 10 * 60_000,
  })

export const tournamentDetailQuery = (leagueId: number) =>
  queryOptions({
    queryKey: ['tournaments', leagueId],
    queryFn: () => apiGet<TournamentDetail>(`/tournaments/${leagueId}`),
    staleTime: 10 * 60_000,
  })
