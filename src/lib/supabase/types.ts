// Auto-generate this file with: npx supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts
// Placeholder until Supabase project is connected

export type Database = {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string
          name: string
          short_name: string | null
          logo_url: string | null
          api_football_id: number | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['teams']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['teams']['Insert']>
      }
      seasons: {
        Row: { id: string; year: string; is_current: boolean }
        Insert: Omit<Database['public']['Tables']['seasons']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['seasons']['Insert']>
      }
      matches: {
        Row: {
          id: string
          api_football_id: number | null
          season_id: string
          home_team_id: string
          away_team_id: string
          matchday: number | null
          kickoff_at: string | null
          status: 'scheduled' | 'live' | 'finished'
          home_score: number | null
          away_score: number | null
        }
        Insert: Omit<Database['public']['Tables']['matches']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['matches']['Insert']>
      }
      referees: {
        Row: { id: string; name: string; nationality: string | null }
        Insert: Omit<Database['public']['Tables']['referees']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['referees']['Insert']>
      }
      standings: {
        Row: {
          id: string; team_id: string; season_id: string
          position: number; points: number; played: number
          won: number; drawn: number; lost: number
          gf: number; ga: number; gd: number
          synced_at: string
        }
        Insert: Omit<Database['public']['Tables']['standings']['Row'], 'id' | 'gd'>
        Update: Partial<Database['public']['Tables']['standings']['Insert']>
      }
      incidents: {
        Row: {
          id: string; match_id: string; referee_id: string | null
          team_affected_id: string
          type: 'penalty' | 'red_card' | 'disallowed_goal'
          minute: number; severity: number; time_weight: number
          game_state: number; piv_preview: number; piv_confirmed: number | null
          vote_closes_at: string | null
          status: 'open' | 'confirmed'
          created_at: string; closed_at: string | null
        }
        Insert: Omit<Database['public']['Tables']['incidents']['Row'], 'id' | 'piv_preview' | 'created_at'>
        Update: Partial<Database['public']['Tables']['incidents']['Insert']>
      }
      panel_verdicts: {
        Row: {
          id: string; incident_id: string; ref_name: string
          verdict: 'correct' | 'incorrect' | 'inconclusive'
          submitted_by: string | null; created_at: string
        }
        Insert: Omit<Database['public']['Tables']['panel_verdicts']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['panel_verdicts']['Insert']>
      }
      fan_votes: {
        Row: {
          id: string; incident_id: string; user_id: string
          vote: 'correct' | 'incorrect'; created_at: string
        }
        Insert: Omit<Database['public']['Tables']['fan_votes']['Row'], 'id' | 'created_at'>
        Update: never
      }
      referee_accuracy: {
        Row: {
          id: string; referee_id: string; team_id: string; season_id: string
          correct_calls: number; total_calls: number
        }
        Insert: Omit<Database['public']['Tables']['referee_accuracy']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['referee_accuracy']['Insert']>
      }
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
