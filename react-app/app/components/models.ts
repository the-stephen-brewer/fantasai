export interface DraftAnalysis {
  id: number;
  created_at: string;
  draft_id: string;
  draft_slot: number | null;
  is_keeper: boolean | null;
  pick_no: number;
  picked_by: string;
  player_id: number; // sleeper_id
  roster_id: number | null;
  round: number;
  gsis_id: string | null;
  full_name: string;
  position: string;
  age: number | null;
  years_exp: number | null;
  team: string | null;
  year: number;
  ecr: number | null;
  season_vor: number | null;
  avg_vor: number | null;
  vor_std_dev: number | null;
  expected_vor: number | null;
  adp_delta: number | null;
  draft_value: number | null;
  display_name: string;
}