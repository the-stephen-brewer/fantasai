import pytest
import polars as pl
import os
import json
from polars.testing import assert_frame_equal

# Import the function we want to test
from core.award import generate_awards_for_league_draft

SNAPSHOT_DIR = "tests/snapshots/greggyb23"

def test_generate_awards_regression():
    """
    Regression test for award generation.
    """
    # 1. Load snapshots
    with open(os.path.join(SNAPSHOT_DIR, "analysis.json"), "r") as f:
        analysis_data = json.load(f)
    analysis_df = pl.DataFrame(analysis_data)

    with open(os.path.join(SNAPSHOT_DIR, "weekly_results.json"), "r") as f:
        weekly_results_data = json.load(f)
    weekly_results_df = pl.DataFrame(weekly_results_data)

    with open(os.path.join(SNAPSHOT_DIR, "awards.json"), "r") as f:
        expected_awards_data = json.load(f)
    expected_awards_df = pl.DataFrame(expected_awards_data)

    # 2. Run award generation
    actual_awards_df = generate_awards_for_league_draft(analysis_df, weekly_results_df)

    # 3. Compare
    # Sort both by award_title and user_display_name to ensure consistent comparison
    actual_sorted = actual_awards_df.sort(["award_title", "user_display_name"])
    expected_sorted = expected_awards_df.sort(["award_title", "user_display_name"])

    assert_frame_equal(actual_sorted, expected_sorted)
