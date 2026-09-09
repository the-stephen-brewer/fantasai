export interface PositionData {
  count: number;
  avg_draft_value: number;
  league_avg_draft_value: number; // As per todo, for comparison
  avg_adp_delta: number;
  avg_first_drafted_round: number;
}

export interface RoundPhaseData {
  avg_draft_value: number;
  avg_adp_delta: number;
}

export interface UserProfile {
  id: number;
  user_id: string;
  year: number;
  draft_count: number;
  total_picks: number;
  total_draft_value: number;
  avg_adp_delta: number;
  absolute_adp_deviation: number;
  portfolio_risk_variance: number;
  most_drafted_team: string | null;
  rookie_pick_rate: number;
  avg_team_age: number;
  best_pick_id: number;
  worst_pick_id: number;
  grade: string; // From the grading algorithm
  position_data: {
    QB?: PositionData;
    RB?: PositionData;
    WR?: PositionData;
    TE?: PositionData;
    K?: PositionData;
  };
  round_phase_data: {
    "Early [1-4]": RoundPhaseData;
    "Mid [5-9]": RoundPhaseData;
    "Late [10+]": RoundPhaseData;
  };
}

export interface DraftPick {
  id: number;
  pick_no: number;
  full_name: string;
  position: string;
  team: string;
  draft_value: number;
  season_vor: number;
  expected_vor: number;
  ecr: number;
  adp_delta: number;
}

export interface DraftAward {
  award_title: string;
  award_description: string;
  user_display_name: string;
  award_context: string;
  draft_id: string;
  user_id: string;
}

export interface AnalyzedDraft {
  draft_id: string;
  league_name: string;
  user_team_name: string;
  analysis_status: "COMPLETE" | "ANALYZING" | "QUEUED" | "FAILED";
  awards: DraftAward[];
}
