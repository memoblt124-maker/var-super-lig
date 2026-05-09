export type IncidentType =
  | 'wrong_red_card' | 'missed_red_card' | 'wrong_yellow_card'
  | 'missed_yellow_card' | 'double_yellow_missed'
  | 'disallowed_goal_offside' | 'disallowed_goal_handball' | 'disallowed_goal_foul'
  | 'allowed_goal_offside' | 'allowed_goal_handball'
  | 'wrong_penalty_given' | 'missed_penalty'
  | 'wrong_foul' | 'missed_foul' | 'simulation_unpunished' | 'simulation_wrongly_punished'
  | 'wrong_offside' | 'missed_offside'
  | 'wrong_conduct_call' | 'missed_conduct_call'

type TeamRow = {
  id: string; name: string; short_name: string | null
  logo_url: string | null; api_football_id: number | null; created_at: string
}
type SeasonRow = { id: string; year: string; is_current: boolean }
type MatchRow = {
  id: string; api_football_id: number | null; season_id: string
  home_team_id: string; away_team_id: string; matchday: number | null
  kickoff_at: string | null; status: 'scheduled' | 'live' | 'finished'
  home_score: number | null; away_score: number | null
}
type RefereeRow = { id: string; name: string; nationality: string | null }
type StandingRow = {
  id: string; team_id: string; season_id: string
  position: number; points: number; played: number
  won: number; drawn: number; lost: number
  gf: number; ga: number; gd: number; synced_at: string
}
type IncidentRow = {
  id: string; match_id: string; referee_id: string | null
  team_affected_id: string; type: IncidentType
  minute: number; severity: number; time_weight: number
  game_state: number; piv_preview: number; piv_confirmed: number | null
  vote_closes_at: string | null; status: 'open' | 'confirmed'
  video_url: string | null; description: string | null
  is_worst_week: boolean; is_worst_month: boolean
  created_at: string; closed_at: string | null
}
type PanelVerdictRow = {
  id: string; incident_id: string; ref_name: string
  verdict: 'correct' | 'incorrect' | 'inconclusive'
  submitted_by: string | null; created_at: string
}
type FanVoteRow = {
  id: string; incident_id: string; user_id: string
  vote: 'correct' | 'incorrect'; created_at: string
}
type RefereeAccuracyRow = {
  id: string; referee_id: string; team_id: string; season_id: string
  correct_calls: number; total_calls: number
}

export type Database = {
  public: {
    Tables: {
      teams:            { Row: TeamRow;           Insert: Omit<TeamRow, 'id' | 'created_at'>;        Update: Partial<Omit<TeamRow, 'id' | 'created_at'>> }
      seasons:          { Row: SeasonRow;         Insert: Omit<SeasonRow, 'id'>;                     Update: Partial<Omit<SeasonRow, 'id'>> }
      matches:          { Row: MatchRow;          Insert: Omit<MatchRow, 'id'>;                      Update: Partial<Omit<MatchRow, 'id'>> }
      referees:         { Row: RefereeRow;        Insert: Omit<RefereeRow, 'id'>;                    Update: Partial<Omit<RefereeRow, 'id'>> }
      standings:        { Row: StandingRow;       Insert: Omit<StandingRow, 'id' | 'gd'>;           Update: Partial<Omit<StandingRow, 'id' | 'gd'>> }
      incidents:        { Row: IncidentRow;       Insert: Omit<IncidentRow, 'id' | 'piv_preview' | 'created_at'>; Update: Partial<Omit<IncidentRow, 'id' | 'piv_preview' | 'created_at'>> }
      panel_verdicts:   { Row: PanelVerdictRow;   Insert: Omit<PanelVerdictRow, 'id' | 'created_at'>; Update: Partial<Omit<PanelVerdictRow, 'id' | 'created_at'>> }
      fan_votes:        { Row: FanVoteRow;        Insert: Omit<FanVoteRow, 'id' | 'created_at'>;    Update: Partial<Omit<FanVoteRow, 'id' | 'created_at'>> }
      referee_accuracy: { Row: RefereeAccuracyRow; Insert: Omit<RefereeAccuracyRow, 'id'>;          Update: Partial<Omit<RefereeAccuracyRow, 'id'>> }
    }
    Views: {
      justice_table_projected: { Row: Record<string, unknown> }
      justice_table_confirmed: { Row: Record<string, unknown> }
      inconsistent_referees:   { Row: Record<string, unknown> }
      referee_accuracy_pct:    { Row: Record<string, unknown> }
    }
    Functions: {}
    Enums: {}
  }
}
