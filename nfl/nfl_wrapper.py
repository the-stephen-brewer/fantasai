import nflreadpy as nfl
from datetime import date
import polars as pl
from nflreadpy.config import update_config
import core.cache_handler as cache_handler


update_config(
    cache_mode="filesystem",
    cache_dir=cache_handler.CACHE_DIR,
    cache_duration=86400,
    verbose=False,
    timeout=30,
    user_agent='nflreadpy/v0.1.1'
)

def load_yearly_ecr_with_caching():
    """
    Loads yearly ECR data, utilizing a local parquet file to cache results.

    If a cached file exists, it's loaded directly. Otherwise, it fetches
    fresh data using get_yearly_ecr_by_gsis_id(), saves it to the cache,
    and then returns the DataFrame.

    Returns:
        polars.DataFrame: A DataFrame with columns [gsis_id, player_name, year, ecr].
    """
    if cache_handler.get_file_from_cache(cache_handler.YEARLY_ECR_CACHE_FILE):
        print(f"Loading yearly ECR data from cache: {cache_handler.YEARLY_ECR_CACHE_FILE}")
        return pl.read_parquet(cache_handler.YEARLY_ECR_CACHE_FILE)
    
    print("No cache found. Fetching fresh yearly ECR data...")
    df = get_yearly_ecr_by_gsis_id()
    df.write_parquet(cache_handler.YEARLY_ECR_CACHE_FILE)
    cache_handler.save_file_to_cache(cache_handler.YEARLY_ECR_CACHE_FILE)
    print(f"Saved ECR data to cache: {cache_handler.YEARLY_ECR_CACHE_FILE}")
    return df

def add_gsis_id_to_sleeper_df(sleeper_df_with_player_id):
    """
    Enriches a DataFrame containing Sleeper 'player_id' with the corresponding 'gsis_id'.

    Args:
        sleeper_df_with_player_id (pl.DataFrame): A DataFrame that includes a 'player_id' column.

    Returns:
        pl.DataFrame: The original DataFrame with the 'gsis_id' column added.
    """
    ff_roster = nfl.load_ff_playerids()
    # Select only the necessary ID columns and ensure the join key is a string
    id_map = ff_roster.select(["sleeper_id", "gsis_id"]).with_columns(
        pl.col("sleeper_id").cast(pl.String)
    )
    # Join the gsis_id onto the input DataFrame
    merged_df = sleeper_df_with_player_id.join(id_map, left_on="player_id", right_on="sleeper_id", how="left")

    # If the join creates 'gsis_id_right' due to an existing 'gsis_id' column,
    # coalesce them into a single, definitive 'gsis_id' column.
    if 'gsis_id_right' in merged_df.columns:
        return merged_df.with_columns(
            pl.coalesce(["gsis_id_right", "gsis_id"]).alias("gsis_id")
        ).drop("gsis_id_right")
    else:
        return merged_df

def get_gsis_id_from_sleeper_id(sleeper_id):
    ff_roster = nfl.load_ff_playerids()
    return ff_roster.filter(pl.col('sleeper_id') == str(sleeper_id))['gsis_id']

def get_player_stats_for_years(years, gsis_id=None):
    """
    Loads player game-level stats for specified years, optionally filtering for a specific player.

    Args:
        years (list[int]): A list of years to load stats for.
        gsis_id (str, optional): The player's GSIS ID to filter for. 
                                 If None, returns stats for all players. Defaults to None.

    Returns:
        pl.DataFrame: A DataFrame containing player stats.
    """
    player_stats = nfl.load_player_stats(years)
    if cache_handler.get_file_from_cache(cache_handler.LEAGUE_FANTASTY_POINTS_FILE):
        #   print(f"Loading league specific points from cache: {LEAGUE_FANTASTY_POINTS_FILE}")
        league_points = pl.read_parquet(cache_handler.LEAGUE_FANTASTY_POINTS_FILE)

        # Join the league-specific points onto the base player stats
        # The join must include 'season' to avoid incorrectly applying current year points to past years.
        player_stats = player_stats.join(
            league_points.select(["player_id", "week", "season", "league_fantasy_points"]), on=["player_id", "week", "season"], how="left"
        )

        # Overwrite the default fantasy points with the league-specific ones where available
        player_stats = player_stats.with_columns(
            pl.coalesce("league_fantasy_points", "fantasy_points_ppr").alias("fantasy_points_ppr"),
            pl.coalesce("league_fantasy_points", "fantasy_points").alias("fantasy_points")
        ).drop("league_fantasy_points")

    if gsis_id:
        return player_stats.filter(pl.col('player_id') == gsis_id)
    return player_stats

def get_yearly_ecr_by_gsis_id():
    """
    Fetches player ECR for the last 3 seasons, selecting the rank closest to Sept 1st of each year
    and returns it as a Polars DataFrame.
    """
    current_year = date.today().year
    years = range(current_year - 2, current_year + 1)

    ff_rankings = nfl.load_ff_rankings("all")
    ff_playerids = nfl.load_ff_playerids()

    # 1. Filter for relevant rankings and parse dates
    # ecr_type 'ro' is redraft-overall, 'rsf' is redraft-superflex
    ecr_df = (
        ff_rankings.filter(
            (pl.col("ecr_type").is_in(["ro", "rsf"])) &
            (pl.col('pos').is_in(["QB", "RB", "WR", "TE", "K"]))
        )
        .with_columns(
            pl.col("scrape_date").str.to_date("%Y-%m-%d"),
            pl.col("scrape_date").str.slice(0, 4).cast(pl.Int32).alias("year")
        )
        .filter(pl.col("year").is_in(years))
    )

    # 2. For each player/year/ecr_type, find the scrape_date closest to Sept 1st
    closest_ecr_df = (
        ecr_df.with_columns(
            (pl.col("scrape_date") - pl.date(pl.col("year"), 9, 1)).dt.total_days().abs().alias("days_from_sept1")
        )
        .sort("days_from_sept1")
        .group_by(["id", "year", "ecr_type"], maintain_order=True)
        .first()
    )

    # 3. Pivot the data to have separate columns for 'ecr' and 'ecr_superflex'
    pivoted_df = closest_ecr_df.pivot(
        index=["id", "year"],
        columns="ecr_type",
        values="ecr"
    ).rename({"ro": "ecr", "rsf": "ecr_superflex"})

    # 4. Join with player IDs to get gsis_id and name
    player_id_map = ff_playerids.select(["fantasypros_id", "gsis_id", "name"])
    
    # Cast the 'id' column to Int64 to match the 'fantasypros_id' type
    final_df = pivoted_df.with_columns(pl.col("id").cast(pl.Int64)).join(
        player_id_map,
        left_on="id",
        right_on="fantasypros_id",
        how="inner"
    ).filter(pl.col("gsis_id").is_not_null())

    # 5. Select final columns and return as a DataFrame
    return final_df.select([
        "gsis_id",
        "name",
        "year",
        "ecr",
        "ecr_superflex"
    ])
