import pytest
import polars as pl
from polars.testing import assert_frame_equal
import os
import json
from unittest.mock import patch, MagicMock

# Import the function we want to test
from core.draft_analysis import analyze_sleeper_draft

SNAPSHOT_DIR = "tests/snapshots/greggyb23"

@pytest.fixture
def greg_draft_metadata():
    """Load Greg's draft metadata from a fixed source or mock it."""
    # This matches the one used in create_snapshots.py
    return {
        "draft_id": "1265480918777200640",
        "season": "2025",
        "settings": {"teams": 12, "super_flex": 1},
        "metadata": {"name": "Test League", "scoring_type": "2qb"},
        "type": "snake",
        "league_id": "1265480917594427392"
    }

def test_analyze_sleeper_draft_regression(greg_draft_metadata):
    """
    Regression test: compare current analysis output with the stored snapshot.
    We mock the Sleeper API and use cached data for VOR calculations.
    """
    
    # 1. Load snapshots
    with open(os.path.join(SNAPSHOT_DIR, "analysis.json"), "r") as f:
        expected_analysis_data = json.load(f)
    expected_analysis_df = pl.DataFrame(expected_analysis_data)

    # 2. Load kicker stats and write to cache file as process_job would
    with open(os.path.join(SNAPSHOT_DIR, "kicker_stats.json"), "r") as f:
        kicker_stats_data = json.load(f)
    kicker_stats_df = pl.DataFrame(kicker_stats_data)
    
    from core.cache_handler import LEAGUE_FANTASTY_POINTS_FILE
    kicker_stats_df.write_parquet(LEAGUE_FANTASTY_POINTS_FILE)

    # 3. Mock Sleeper API calls
    try:
        with patch("core.draft_analysis.Drafts") as mock_drafts, \
             patch("core.draft_analysis.get_sleeper_usernames") as mock_usernames:
            
            # Mock get_all_picks_in_draft to return data consistent with our analysis.json
            mock_drafts.get_all_picks_in_draft.return_value = expected_analysis_df.with_columns(
                pl.lit({}).alias("metadata")
            ).select([
                "player_id", "pick_no", "round", "draft_slot", "picked_by", "roster_id", "is_keeper", "metadata"
            ]).to_dicts()
            
            mock_usernames.return_value = {
                row["picked_by"]: row["display_name"] 
                for row in expected_analysis_df.select(["picked_by", "display_name"]).unique().to_dicts()
            }

            # Run the analysis
            analysis_df, weekly_results_df = analyze_sleeper_draft(greg_draft_metadata)

            # Compare with snapshot
            cols_to_compare = ["pick_no", "full_name", "season_vor", "draft_value"]
            
            actual_subset = analysis_df.select(cols_to_compare).sort("pick_no")
            expected_subset = expected_analysis_df.select(cols_to_compare).sort("pick_no")
            
            assert_frame_equal(actual_subset, expected_subset, check_column_order=False)
    finally:
        LEAGUE_FANTASTY_POINTS_FILE.unlink(missing_ok=True)
