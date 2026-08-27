/**
 * Mirrors app/schemas/common.py on the backend. Regenerating these from the OpenAPI schema
 * (localhost:8100/openapi.json) is the plan once the contract settles.
 */
import type { Series, SeriesFormat } from '@/lib/series'

export interface TeamBrief {
  team_id: number | null
  name: string | null
  logo_url: string | null
}

export interface LiveMatch {
  match_id: number
  league_id: number | null
  league_name: string | null
  radiant: TeamBrief
  dire: TeamBrief
  game_time: number
  radiant_score: number
  dire_score: number
  p_radiant: number
  model_version: string
  minute: number
  tier: string
  series: Series
  /**
   * Valve's broadcast delay. Our numbers run ahead of what the viewer sees, so the UI has to
   * say so explicitly - otherwise it reads as spoiling the match (spec section 7.4).
   */
  stream_delay_s: number
}

export interface PredictionPoint {
  minute: number
  p_radiant: number
  predicted_at: string
}

export interface MatchPlayerBrief {
  player_slot: number
  is_radiant: boolean
  hero_id: number | null
  hero_name: string | null
  hero_image: string | null
  account_id: number | null
  /** Null for players with no pro profile - shown as a dash, never as the account id. */
  player_name: string | null
  kills: number | null
  deaths: number | null
  assists: number | null
  last_hits: number | null
  denies: number | null
  net_worth: number | null
  gold_per_min: number | null
  xp_per_min: number | null
}

export interface DraftEntry {
  order: number
  is_pick: boolean
  is_radiant: boolean
  hero_id: number
  hero_name: string | null
  hero_image: string | null
}

/** Valve's event vocabulary, already decoded by the backend into something labellable. */
export type TimelineKind =
  | 'tower'
  | 'barracks'
  | 'ancient'
  | 'roshan'
  | 'aegis'
  | 'first_blood'
  | 'tormentor'

export interface TimelineEvent {
  /** Seconds from the horn; negative before it. */
  time: number
  minute: number
  kind: TimelineKind
  /** For a building, the side that LOST it. For roshan and first blood, who did it. */
  is_radiant: boolean | null
  lane: string | null
}

export interface MatchDetail {
  match_id: number
  radiant: TeamBrief
  dire: TeamBrief
  series: Series
  is_live: boolean
  radiant_win: boolean | null
  curve: PredictionPoint[]
  players: MatchPlayerBrief[]
  draft: DraftEntry[]
  timeline: TimelineEvent[]
}

export interface ModelMetrics {
  model_version: string
  log_loss_by_minute: Record<string, number>
  brier_by_minute: Record<string, number>
  ece: number
  sample_size: number
}

export interface TournamentStageInfo {
  stage_id: number
  name: string
  stage_type: string
  /** Bo2 is only expressible because it comes from Liquipedia; Valve data cannot state it. */
  default_format: SeriesFormat | null
  starts_at: string | null
  ends_at: string | null
  series: number
}

export interface TournamentSummary {
  league_id: number
  name: string | null
  tier: string
  is_lan: boolean | null
  prize_pool: number | null
  liquipedia_slug: string | null
  first_match: string | null
  last_match: string | null
  maps: number
  stages: number
  status: 'current' | 'upcoming' | 'past'
}

export interface TournamentDetail extends Omit<TournamentSummary, 'stages'> {
  stages: TournamentStageInfo[]
  series_total: number
  series_drawn: number
  /** Series whose stage could not be determined, so the format is still unknown. */
  series_without_format: number
}
