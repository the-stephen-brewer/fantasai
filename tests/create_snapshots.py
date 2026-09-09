import sys
import os
sys.path.append(os.getcwd())

import json
import vcr
import polars as pl
from sleeperpy import User, Drafts
from core.draft_analysis import analyze_sleeper_draft
from core.award import generate_awards_for_league_draft
from sleeper.sleeper_main import calculate_kicker_points_for_season_for_leauge
from core.cache_handler import LEAGUE_FANTASTY_POINTS_FILE

# Greg's info from local_test.py
USER_ID = "938248068674301952"
DRAFT_ID = "1265480918777200640"
SNAPSHOT_DIR = "tests/snapshots/greggyb23"

my_vcr = vcr.VCR(
    cassette_library_dir='tests/fixtures/vcr_cassettes',
    record_mode='once',
    match_on=['method', 'scheme', 'host', 'port', 'path', 'query'],
)

@my_vcr.use_cassette('greggyb23_analysis.yaml')
def run_analysis():
    print(f"Running analysis for draft {DRAFT_ID}...")
    
    # Record user info request
    user_info = User.get_user(USER_ID)
    
    draft = Drafts.get_specific_draft(DRAFT_ID)
    if not draft:
        print("Failed to get draft")
        return

    # Mock the kicker points file creation as in job_processing.py
    print(f"Calculating kicker performance for league {draft['league_id']}...")
    kicker_stats = calculate_kicker_points_for_season_for_leauge(draft['league_id'], int(draft['season']))
    kicker_stats.write_parquet(LEAGUE_FANTASTY_POINTS_FILE)
    
    # Save kicker stats snapshot
    os.makedirs(SNAPSHOT_DIR, exist_ok=True)
    kicker_stats.write_json(os.path.join(SNAPSHOT_DIR, "kicker_stats.json"))

    print("Running analyze_sleeper_draft...")
    analysis_df, weekly_results_df = analyze_sleeper_draft(draft)
    
    print("Generating awards...")
    awards_df = generate_awards_for_league_draft(analysis_df, weekly_results_df)

    # Save snapshots
    os.makedirs(SNAPSHOT_DIR, exist_ok=True)
    
    # We use to_dicts and then json.dump for better readability than pl.write_json sometimes,
    # but pl.write_json is fine too. Let's use pl.write_json for efficiency.
    analysis_df.write_json(os.path.join(SNAPSHOT_DIR, "analysis.json"))
    weekly_results_df.write_json(os.path.join(SNAPSHOT_DIR, "weekly_results.json"))
    awards_df.write_json(os.path.join(SNAPSHOT_DIR, "awards.json"))
    
    print(f"Snapshots saved to {SNAPSHOT_DIR}")
    
    # Cleanup
    LEAGUE_FANTASTY_POINTS_FILE.unlink(missing_ok=True)

if __name__ == "__main__":
    run_analysis()
