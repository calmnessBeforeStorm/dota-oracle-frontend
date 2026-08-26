/**
 * Mirrors app/schemas/common.py on the backend. Regenerating these from the OpenAPI schema
 * (localhost:8000/openapi.json) is the plan once the contract settles.
 */
import type { Series } from '@/lib/series'

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

export interface MatchDetail {
  match_id: number
  radiant: TeamBrief
  dire: TeamBrief
  series: Series
  is_live: boolean
  radiant_win: boolean | null
  curve: PredictionPoint[]
}

export interface ModelMetrics {
  model_version: string
  log_loss_by_minute: Record<string, number>
  brier_by_minute: Record<string, number>
  ece: number
  sample_size: number
}
