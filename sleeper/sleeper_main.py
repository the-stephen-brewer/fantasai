from sleeper.leagues import Leagues
from sleeper.users import User
from .players import Players
from nfl import nfl_wrapper as nfl
import polars as pl
import core.cache_handler as cache_handler


def load_players_with_caching():
    if cache_handler.get_file_from_cache(cache_handler.PLAYERS_CACHE):
        print(f"Loading sleepers players from cache: {cache_handler.PLAYERS_CACHE}")
        return pl.read_parquet(cache_handler.PLAYERS_CACHE)
    
    print("No cache found. Fetching fresh players from Sleeper...")
    players_data = Players.get_all_players()
    if players_data:
        # The API returns a dict of dicts; we need the values to create the DataFrame
        # Set infer_schema_length=None to scan all data and prevent type conflicts
        # from mixed-type columns (e.g., a number or a string like "Out").
        df = pl.DataFrame(list(players_data.values()), infer_schema_length=None)
        df.write_parquet(cache_handler.PLAYERS_CACHE)
        cache_handler.save_file_to_cache(cache_handler.PLAYERS_CACHE)
        print(f"Saved players data to cache: {cache_handler.PLAYERS_CACHE}")
        return df
    return pl.DataFrame() # Return an empty DataFrame if the API call fails

def get_sleeper_usernames(user_ids):
    users = {}
    for user_id in user_ids:
        user = User.get_user(user_id)
        users[user_id] = user['display_name']
    return users

def get_sleeper_league_settings(league_id):
    league = Leagues.get_league(league_id)
    #print(league)
    return league

def calculate_kicker_points_for_season_for_leauge(league_id, year):
    league_settings = get_sleeper_league_settings(league_id)
    scoring_settings = league_settings["scoring_settings"]
    kicker_stats = nfl.get_player_stats_for_years(year).filter(pl.col("position") == "K")
    
    # Calculate fantasy points based on the league's scoring settings
    kicker_points_df = kicker_stats.with_columns(
        (
            (pl.col("fg_made_0_19") * scoring_settings.get("fgm_0_19", 0.0)) +
            (pl.col("fg_made_20_29") * scoring_settings.get("fgm_20_29", 0.0)) +
            (pl.col("fg_made_30_39") * scoring_settings.get("fgm_30_39", 0.0)) +
            (pl.col("fg_made_40_49") * scoring_settings.get("fgm_40_49", 0.0)) +
            ((pl.col("fg_made_50_59") + pl.col("fg_made_60_")) * scoring_settings.get("fgm_50p", 0.0)) +
            (pl.col("pat_made") * scoring_settings.get("xpm", 0.0)) +
            (pl.col("pat_missed") * scoring_settings.get("xpmiss", 0.0)) +
            (pl.col("fg_missed") * scoring_settings.get("fgmiss", 0.0)) +
            (pl.col("fg_missed_0_19") * scoring_settings.get("fgmiss_0_19", 0.0)) +
            (pl.col("fg_missed_20_29") * scoring_settings.get("fgmiss_20_29", 0.0)) +
            (pl.col("fg_missed_30_39") * scoring_settings.get("fgmiss_30_39", 0.0)) +
            (pl.col("fg_missed_40_49") * scoring_settings.get("fgmiss_40_49", 0.0)) +
            ((pl.col("fg_missed_50_59") + pl.col("fg_missed_60_")) * scoring_settings.get("fgmiss_50p", 0.0))
        ).alias("league_fantasy_points")
    )
    return kicker_points_df.select(
        ["player_id", "week", "season", "league_fantasy_points"]
    )
    

def get_league_weekly_results(league_id):
    """
    Fetches all weekly matchup results for a given league for the entire season.

    It iterates week by week, starting from week 1, and collects matchup data
    until no more matchups are found for a week.

    Args:
        league_id (str): The ID of the Sleeper league.

    Returns:
        pl.DataFrame: A DataFrame containing all matchup results for the season,
                      with an added 'week' column. Returns an empty DataFrame
                      if no matchups are found at all.
    """
    all_matchups = []
    week = 1
    while True:
        weekly_matchups = Leagues.get_matchups(league_id, week)
        if not weekly_matchups:
            break  # Stop when the API returns an empty list for a week
        all_matchups.extend([dict(item, week=week) for item in weekly_matchups])
        week += 1
    
    return pl.DataFrame(all_matchups)