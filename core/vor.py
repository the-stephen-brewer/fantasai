import numpy as np
from nfl.nfl_wrapper import get_player_stats_for_years, load_yearly_ecr_with_caching
from core.league_analysis import get_player_ranks_for_year_by_week
import polars as pl
from scipy.optimize import curve_fit
import core.cache_handler as cache_handler
import math

def get_replacement_players(num_teams, is_superflex=False):
    """
    Calculates replacement level indices using 'Starters + 1' logic for depth positions.
    
    Args:
        num_teams (int): Number of teams (e.g., 10, 12, 14).
        roster_settings (dict): Dictionary of starting spots. 
                                Default is {'QB': 1, 'RB': 2, 'WR': 2, 'TE': 1, 'FLEX': 1, 'K': 1}
        is_superflex (bool): If True, treats QB as a depth position (everyone drafts 2-3).
        
    Returns:
        dict: The replacement index for each position.
    """
    
    # 1. DEFAULT SETTINGS (Standard League)
    roster_settings = {'QB': 1, 'RB': 2, 'WR': 2, 'TE': 1, 'FLEX': 1, 'K': 1}
    # Standard: Teams draft 1 full backup per position (Factor = 1.0)
    # Superflex: Teams burn picks on QBs, so they hold fewer backup RBs/WRs (Factor = 0.6)
    bench_depth_factor = 0.6 if is_superflex else 0.8

    # 2. HANDLE FLEX DISTRIBUTION
    # We estimate how the Flex spots are split (usually 40% RB, 60% WR, negligible TE)
    # TODO: In your function, if is_superflex=True, reduce the rb_per_team and wr_per_team bench factors by roughly 0.5. This will lower the VOR floor at the end of the draft.
    num_flex = roster_settings.get('FLEX', 0)
    flex_rb_share = num_flex * 0.4
    flex_wr_share = num_flex * 0.6
    
    # 3. CALCULATE REPLACEMENTS
    replacements = {}
    
    # --- QB LOGIC ---
    # In 1QB, you don't draft a "backup" for value. You stream. 
    # So Replacement is just (Starters * Teams) + 1.
    # In Superflex, you MUST draft depth. So we apply "Starters + 1" logic.
    if is_superflex:
        # Treat Superflex as effectively 2 QB starters. 
        replacements['QB'] = (math.ceil(num_teams * 2) + 4)
    else:
        replacements['QB'] = (num_teams * roster_settings['QB']) + 1

    # --- RB & WR LOGIC (THE "STARTERS + 1" FORMULA) ---
    # Formula: Teams * (Starters + Flex_Share + 1_Bench_Spot)
    
    # RB Calculation
    rb_starters = roster_settings['RB']
    rb_baseline = num_teams * (rb_starters + flex_rb_share + bench_depth_factor)
    replacements['RB'] = math.ceil(rb_baseline)
    
    # WR Calculation
    wr_starters = roster_settings['WR']
    wr_baseline = num_teams * (wr_starters + flex_wr_share + bench_depth_factor)
    replacements['WR'] = math.ceil(wr_baseline)

    # --- TE & K LOGIC ---
    # "Onesie" positions usually don't have a drafted backup in standard leagues.
    # Replacement is just the first guy on the waiver wire.
    replacements['TE'] = (num_teams * roster_settings['TE']) + 1
    replacements['K'] = (num_teams * roster_settings['K']) + 1
    
    return replacements

def get_players_weekly_vor(player_gsis_id, year, league_size=12, is_superflex=False):
    player_stats = get_player_stats_for_years([year], player_gsis_id)
    if player_stats.is_empty():
        return pl.DataFrame()
    
    
    position = player_stats['position'].unique()[0]
    player_ranks = get_player_ranks_for_year_by_week(year).filter(pl.col("position") == position)

    replacement_rank = get_replacement_players(league_size, is_superflex)[position]

    # Find the fantasy points for the replacement-level player for each week
    replacement_points_by_week = (
        player_ranks
        .filter(pl.col("position_rank") == replacement_rank)
        .select(["week", pl.col("fantasy_points_ppr").alias("fantasy_points")])
        .rename({"fantasy_points": "replacement_points"})
    )

    # Get all weeks in the season to handle player's bye weeks or injuries
    all_weeks = player_ranks.select(pl.col("week").unique().sort()).to_series()
    all_weeks_df = pl.DataFrame({"week": all_weeks})

    # Join player stats with all weeks to identify weeks they didn't play
    player_weekly_stats = all_weeks_df.join(player_stats, on="week", how="left")

    # Join with replacement points
    player_vor_df = player_weekly_stats.join(replacement_points_by_week, on="week", how="left")

    # Join with all positional ranks to get the player's specific rank for each week
    player_vor_df_with_rank = player_vor_df.join(
        player_ranks.select(["player_id", "week", "position_rank"]),
        on=["player_id", "week"],
        how="left"
    )

    # Calculate VOR and set values for injured/bye weeks
    final_df = player_vor_df_with_rank.with_columns(
        pl.col("fantasy_points_ppr").is_null().alias("injured_bool"),
        pl.when(pl.col("fantasy_points_ppr").is_null())
        .then(0)
        .otherwise(pl.col("fantasy_points_ppr") - pl.col("replacement_points"))
        .alias("vor"),
        pl.lit(player_gsis_id).alias("player_id"),
        pl.col("fantasy_points_ppr").fill_null(0).alias("fantasy_points")
    ).select([
        "player_id",
        "week",
        "fantasy_points",
        "position_rank",
        "vor",
        "injured_bool"
    ])

    return final_df

def get_league_vor_label(league_size, is_superflex):
    if is_superflex:
        return f"super_{league_size}"
    return f"redraft_{league_size}"

def get_player_vors_for_seasons(seasons, league_size=12, is_superflex=False):
    # check if cached season_vor file exists. if it does, load the file into polars frame and return
    # grab top 200 players for each season in seasons (array of years)
    ## can call nfl.get_yearly_ecr_by_gsis_id to get a polars frame with all player ranks for last 3 seasons. 
    # get their GSIS_ID
    # create data frame to store every players season VOR score
    # for each player ID and season combo
    ## call get_players_weekly_vor 
    ## sum the weekly vors to get season vor
    ## add to data frame this data
    # save data frame to season_vor file
    # return data frame
    """
    Calculates the total season VOR for the top N players over a list of seasons.
    Caches the results in a parquet file for faster subsequent loads.
    """
    top_n = 200
    if cache_handler.get_file_from_cache(cache_handler.PLAYER_VORS_BY_SEASON_FILE):
        try:
            print(f"Loading player vors by season from cache: {cache_handler.PLAYER_VORS_BY_SEASON_FILE}")
            df = pl.read_parquet(cache_handler.PLAYER_VORS_BY_SEASON_FILE)
            return df.filter(pl.col("league_setting") == get_league_vor_label(league_size, is_superflex))
        except pl.ColumnNotFoundError:
            print("Cache is outdated (missing 'league_setting' in player VORs). Regenerating...")
            # Fall through to regenerate the cache file
    
    print("No cache found. generating VOR by season for top players last 3 seasons...")

    # Get preseason ECR for all players
    player_ecr_df = load_yearly_ecr_with_caching()

    # Filter for top N players for the specified seasons
    top_players_df = player_ecr_df.filter(
        (pl.col("year").is_in(seasons)) & (pl.col("ecr") <= top_n)
    )

    # Create a loop here to calculate season VOR for each unique league settings
    # Save in dataframe with a column that includes league type & size
    league_iterations = [
        {'size': 8, 'is_super': False}, {'size': 10, 'is_super': False}, {'size': 12, 'is_super': False}, {'size': 14, 'is_super': False},
        {'size': 8, 'is_super': True}, {'size': 10, 'is_super': True}, {'size': 12, 'is_super': True}, {'size': 14, 'is_super': True}
    ]
    season_vor_results = []
    for setting in league_iterations:
        loop_league_size = setting['size']
        loop_is_superflex = setting['is_super']
        label = get_league_vor_label(loop_league_size, loop_is_superflex)
        
        # Iterate through each player/season combination
        for row in top_players_df.to_dicts():
            gsis_id = row['gsis_id']
            year = row['year']
            
            weekly_vor_df = get_players_weekly_vor(gsis_id, year, loop_league_size, loop_is_superflex)
            if not weekly_vor_df.is_empty():
                season_vor = weekly_vor_df.select(pl.sum("vor")).item()
                season_vor_results.append({"gsis_id": gsis_id, "year": year, "season_vor": season_vor, "league_setting": label})

    # Create DataFrame, save to cache, and return
    final_df = pl.DataFrame(season_vor_results)
    final_df.write_parquet(cache_handler.PLAYER_VORS_BY_SEASON_FILE)
    cache_handler.save_file_to_cache(cache_handler.PLAYER_VORS_BY_SEASON_FILE)
    print(f"Saved seasonal VOR data to cache: {cache_handler.PLAYER_VORS_BY_SEASON_FILE}")
    return final_df.filter(pl.col("league_setting") == get_league_vor_label(league_size, is_superflex))

def get_historical_vor_adp_curve(league_size=12, is_superflex=False):
    # TODO - how do we store curves for different league settings?
    if cache_handler.get_file_from_cache(cache_handler.CURVE_FIT_DATA):
        try:
            print(f"Loading yearly ECR data from cache: {cache_handler.CURVE_FIT_DATA}")
            df = pl.read_parquet(cache_handler.CURVE_FIT_DATA)
            return df.filter(pl.col("league_setting") == get_league_vor_label(league_size, is_superflex))
        except pl.ColumnNotFoundError:
            print("Cache is outdated (missing 'league_setting'). Regenerating...")
            # Fall through to regenerate the cache file
    
    print("No cache found. generating vor adp curve...")
    seasons = [2025,2024,2023]
    ###
    # Gather History: Get the last 3–5 years of ADP and VOR data.
    # Join: Match every player's preseason ADP to their actual end-of-season VOR.
    # Regression: Fit a curve (Logarithmic is usually best for fantasy) to this data.$X = \text{ADP}$$Y = \text{VOR}$
    # Predict: Use that curve formula to generate the "Expected VOR" for slots 1 through 160.
    ###
    # get a polars frame for player adp by season for each season in seasons
    ## can get this from nfl.load_yearly_ecr_with_caching
    
    # get player vor score by season by averaging their weekly VOR for each season in seasons
    league_iterations = [
        {'size': 8, 'is_super': False}, {'size': 10, 'is_super': False}, {'size': 12, 'is_super': False}, {'size': 14, 'is_super': False},
        {'size': 8, 'is_super': True}, {'size': 10, 'is_super': True}, {'size': 12, 'is_super': True}, {'size': 14, 'is_super': True}
    ]
    all_curve_fits = []
    for setting in league_iterations:
        players_vors_by_seasons = get_player_vors_for_seasons(seasons, setting['size'], setting['is_super'])
        # TODO - think about how super flex would change ECR. Do we have a reliable source to get that?
        player_adp_by_season = load_yearly_ecr_with_caching()

        # merge the player vor season scores and their ADP data frames
        merged_df = player_adp_by_season.join(players_vors_by_seasons, on=["gsis_id", "year"], how="inner")
        # --- 2. CALCULATE THE CURVE ---

        # 1. CLEAN THE DATA FIRST
        # Ensure we don't have NaNs or 0s (log(0) is undefined)
        clean_df = merged_df.filter(
            (pl.col("ecr").is_not_null()) & 
            (pl.col("ecr") > 0) &
            (pl.col("season_vor").is_not_null())
        )

        # 2. ASSIGN CORRECT ARRAYS
        x_data = clean_df["ecr"].to_numpy()  # <--- Changed from "year" to "ecr"
        y_data = clean_df["season_vor"].to_numpy()

        # Define a Logarithmic Decay function: y = a + b * ln(x)
        # This is the standard shape of fantasy value charts
        def log_decay(x, a, b):
            return a + b * np.log(x)

        # Fit the curve to the historical data
        # popt contains the optimal [a, b] values
        popt, _ = curve_fit(log_decay, x_data, y_data)
        a_opt, b_opt = popt

        print(f"Formula: Expected VOR = {a_opt:.2f} + {b_opt:.2f} * ln(ADP)")

        # --- 3. GENERATE THE BENCHMARK TABLE ---

        # Create a reference table for Picks 1 to 160
        benchmark_df = pl.DataFrame({"pick_no": range(1, 161), "league_setting": get_league_vor_label(setting['size'], setting['is_super'])})

        benchmark_df = benchmark_df.with_columns(
            (a_opt + b_opt * np.log(pl.col("pick_no"))).alias("expected_vor")
        )

        # Optional: Set a floor of 0 (since you can't get negative value from a draft slot in theory)
        benchmark_df = benchmark_df.with_columns(
            pl.when(pl.col("expected_vor") < 0)
            .then(0)
            .otherwise(pl.col("expected_vor"))
        .alias("expected_vor")
        )
        all_curve_fits.append(benchmark_df)
    final_df = pl.concat(all_curve_fits)
    final_df.write_parquet(cache_handler.CURVE_FIT_DATA)
    cache_handler.save_file_to_cache(cache_handler.CURVE_FIT_DATA)
    print(f"Saved data to cache: {cache_handler.CURVE_FIT_DATA}")
    return final_df.filter(pl.col("league_setting") == get_league_vor_label(league_size, is_superflex))
