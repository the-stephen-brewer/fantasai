from nfl.nfl_wrapper import get_player_stats_for_years
import polars as pl

def get_player_ranks_for_year_by_week(year):
    # Need to updat this to take in the fantasy league details so we can calculate kicker fantasy points accurately
    player_stats = get_player_stats_for_years(year)
    df = player_stats.filter(pl.col("position").is_in(["QB", "RB", "WR", "TE", "K"]))
    # 3. Calculate the Rank
    # We rank by 'fantasy_points_ppr' DESCENDING, grouping by 'week' and 'position'
    df_ranked = df.with_columns(
        pl.col("fantasy_points_ppr")
        .rank(method="min", descending=True)
        .over(["week", "position"])
        .alias("position_rank")
    )

    return df_ranked
    # 4. View specific results (e.g., Week 1 Wide Receivers)
    #print(df_ranked.filter(
    #    (pl.col("week") == 1) & (pl.col("position") == "WR")
    #).sort("position_rank").select(["player_name", "fantasy_points_ppr", "position_rank"]).head(5))