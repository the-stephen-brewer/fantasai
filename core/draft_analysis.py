from sleeperpy import Drafts
from sleeper.sleeper_main import load_players_with_caching, get_sleeper_usernames
from core.vor import get_players_weekly_vor, get_historical_vor_adp_curve, load_yearly_ecr_with_caching
from nfl import nfl_wrapper as nfl
import polars as pl

def check_is_superflex(draft):
    return "2qb" in draft['metadata']['scoring_type'] or "super_flex" in draft["settings"] 

def check_is_dynasty(draft):
    return "dynasty" in draft['metadata']['scoring_type']


def analyze_sleeper_draft(draft):
    #['draft_id', 'draft_slot', 'is_keeper', 'metadata', 'pick_no', 'picked_by', 'player_id', 'reactions', 'roster_id', 'round']
    # create a dataframe that has the following:
    # ADP for the player according to load_yearly_ecr_with_caching() value
    # adp to draft_slot delta, 
    # season vor by summing results from get_players_weekly_vor(gsis_id, year), 
    # average VOR by averaging the VOR for each week they weren't injured using results from get_players_weekly_vor(gsis_id, year), 
    # vor deviation identifying the standard deviation on their week to week VOR, 
    # draft value by season vor (actual) - expected VOR for draft slot from get_expected_vor(draft_slot), 
    # weeks on team (not yet supported as we need to get tihs data from sleeper weekly APIs), 
    # weeks injured on team (not yet supported as we need to get tihs data from sleeper weekly APIs)
    draft_id = draft['draft_id']
    season = int(draft['season'])
    is_dynasty = check_is_dynasty(draft)
    league_size = int(draft['settings']['teams'])
    is_superflex = check_is_superflex(draft)

    #DEBUG
    print("Process draft with draft_id:", draft_id)
    print("Name:", draft['metadata']['name'])
    print("League Size:", league_size)
    print("Is Superflex:", is_superflex)
    print("Is Dynasty:", is_dynasty)
    # 1. Load all necessary data sources
    picks = Drafts.get_all_picks_in_draft(draft_id)
    draft_df = pl.DataFrame(picks, infer_schema_length=None)

    player_map_df = load_players_with_caching().select(["player_id", "gsis_id", "full_name", "position", "age", "years_exp", "team"])
    player_map_df = nfl.add_gsis_id_to_sleeper_df(player_map_df)

    
    adp_df = load_yearly_ecr_with_caching().filter(pl.col("year") == season)
    if is_superflex:
        # For superflex leagues, prioritize the superflex ECR.
        # We drop the standard 'ecr' and rename 'ecr_superflex' to 'ecr'
        # so the rest of the logic can use the 'ecr' column seamlessly.
        adp_df = adp_df.drop("ecr").rename({"ecr_superflex": "ecr"})

    expected_vor_df = get_historical_vor_adp_curve(league_size, is_superflex)

    # 2. Join draft data with player mappings to get GSIS ID
    # Sleeper's player_id is a string, ensure our mapping is the same for the join
    analysis_df = draft_df.join(
        player_map_df.with_columns(pl.col("player_id").cast(pl.String)), 
        on="player_id", 
        how="left"
    ).filter(pl.col("gsis_id").is_not_null())
    # 3. Join with ADP/ECR data
    # Add the 'year' column to analysis_df before joining
    analysis_df = analysis_df.with_columns(
        pl.lit(season).alias("year")
    ).join(adp_df, on=["gsis_id", "year"], how="left")

    # 4. Calculate VOR metrics for each player
    vor_metrics = []
    all_weekly_metrics = []

    for row in analysis_df.to_dicts():
        gsis_id = row['gsis_id']
        weekly_vor_df = get_players_weekly_vor(gsis_id, season, league_size, is_superflex)
        
        if not weekly_vor_df.is_empty():
            # Add season to the weekly data and append to our list
            all_weekly_metrics.append(
                weekly_vor_df.with_columns(pl.lit(season).alias("season"))
            )

        if weekly_vor_df.is_empty():
            vor_metrics.append({"gsis_id": gsis_id, "season_vor": 0, "avg_vor": 0, "vor_std_dev": 0})
            continue

        active_weeks_vor = weekly_vor_df.filter(pl.col("injured_bool") == False)["vor"]
        
        # Look at the vor data for the following players:
        #debug_ids = ["00-0033702", "00-0039409", "00-0031544", "00-0040074"]
        #if gsis_id in debug_ids:
        #    print(f"\n--- Debugging VOR for {gsis_id} ---")
        #    print("Weekly VOR DataFrame:")
        #    print(weekly_vor_df)
        #    print("\nActive Weeks VOR Series:")
        #    print(active_weeks_vor)
        #    print("--- End Debug ---\n")
            
        vor_metrics.append({
            "gsis_id": gsis_id,
            "season_vor": weekly_vor_df["vor"].sum(),
            "avg_vor": active_weeks_vor.mean(),
            "vor_std_dev": active_weeks_vor.std()
        })

    # Combine all weekly metrics into a single DataFrame
    if all_weekly_metrics:
        player_weekly_metrics_df = pl.concat(all_weekly_metrics)
    else:
        player_weekly_metrics_df = pl.DataFrame()

    # 5. Join VOR metrics and Expected VOR
    vor_metrics_df = pl.DataFrame(vor_metrics)
    analysis_df = analysis_df.join(vor_metrics_df, on="gsis_id", how="left")
    # Join with expected VOR and fill nulls for picks > 160 with 0
    analysis_df = analysis_df.join(
        expected_vor_df, on="pick_no", how="left"
    ).with_columns(pl.col("expected_vor").fill_null(0))

    # 6. Calculate final value metrics
    final_analysis = analysis_df.with_columns(
        (pl.col("ecr") - pl.col("pick_no")).alias("adp_delta"),
        (pl.col("season_vor") - pl.col("expected_vor")).alias("draft_value")
    ).with_columns(
        [pl.col(c).round(2) for c in [
            "season_vor", "avg_vor", "vor_std_dev", "expected_vor", "adp_delta", "draft_value"
        ]]
    )    
    
    #print(final_analysis.select(["pick_no", "full_name", "ecr","picked_by", "adp_delta", "season_vor", "expected_vor", "draft_value", "avg_vor", "vor_std_dev"]))
    
    # Get the unique set of 'picked_by' user IDs from the draft
    unique_drafter_ids = final_analysis.get_column("picked_by").unique().to_list()
    users = get_sleeper_usernames(unique_drafter_ids)
    
    # Convert the user dictionary to a DataFrame to join it
    users_df = pl.DataFrame(list(users.items()), schema=["picked_by", "display_name"])
    
    # Join the display names to the final analysis
    final_analysis = final_analysis.join(users_df, on="picked_by", how="left")
    
    # Exclude the nested 'metadata' column before printing or saving to CSV
    final_analysis = final_analysis.drop("metadata")
    
    #print(final_analysis.select(["pick_no", "full_name", "display_name", "ecr", "adp_delta", "season_vor", "expected_vor", "draft_value"]))
    return final_analysis, player_weekly_metrics_df