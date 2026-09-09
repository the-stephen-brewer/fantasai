from sleeperpy import User, Leagues, Drafts, Players
import polars as pl
from sleeper.sleeper_main import load_players_with_caching, get_sleeper_usernames
from nfl import nfl_wrapper as nfl
import polars as pl




def analyze_sleeper_auction_draft(draft_id):
    draft = Drafts.get_specific_draft(draft_id)
    auction_picks = get_auction_draft_frame(draft_id)
    season = int(draft['season'])
    league_size = int(draft['settings']['teams'])
    is_superflex = check_is_superflex(draft)

    player_map_df = load_players_with_caching().select(["player_id", "gsis_id", "full_name", "position", "age", "years_exp", "team"])
    player_map_df = nfl.add_gsis_id_to_sleeper_df(player_map_df)

    analysis_df = auction_picks.join(
        player_map_df.with_columns(pl.col("player_id").cast(pl.String)), 
        on="player_id", 
        how="left"
    ).filter(pl.col("gsis_id").is_not_null())

    unique_drafter_ids = analysis_df.get_column("picked_by").unique().to_list()
    users = get_sleeper_usernames(unique_drafter_ids)
    
    # Convert the user dictionary to a DataFrame to join it
    users_df = pl.DataFrame(list(users.items()), schema=["picked_by", "display_name"])
    
    # Join the display names to the final analysis
    analysis_df = analysis_df.join(users_df, on="picked_by", how="left")

    # TODO - Get auction value for each player instead of 'ECR'
    # Check if there is an ECR to auction value formula we can use instead? 
    # normalize for this leagues base budget (this league uses 300, formula might be based on 100)
    # Given the ECR, get a VOR fit curve that checks expect value by dollar spent

def check_is_superflex(draft):
    return "super_flex" in draft["settings"]

def get_auction_draft_frame(draft_id):
    draft = Drafts.get_specific_draft(draft_id)
    picks = Drafts.get_all_picks_in_draft(draft_id)
    base_budget = int(draft['settings']['budget'])

    # Reverse the draft_order dict to map slot number to user_id
    # e.g., { 'user_id_1': 1, 'user_id_2': 2 } becomes { 1: 'user_id_1', 2: 'user_id_2' }
    slot_to_user_id = {v: k for k, v in draft['draft_order'].items()}

    # Initialize user_budgets with the base budget for all users in the draft order
    user_budgets = {user_id: base_budget for user_id in draft['draft_order'].keys()}
   
    # Find specific budget overrides (e.g., 'budget_1', 'budget_2')
    for key, value in draft['settings'].items():
        if key.startswith('budget_'):
            try:
                print(f"{key} , {value}")
                # Extract the slot number from the key 'budget_#'
                slot_number = int(key.split('_')[1])
                # Find the user_id for that slot
                if slot_number in slot_to_user_id:
                    user_id = slot_to_user_id[slot_number]
                    # Override the base budget with the specific one
                    user_budgets[user_id] = int(value)
            except (ValueError, IndexError):
                # Ignore keys that don't match the expected 'budget_#' format
                continue    
    # Create a DataFrame from the list of pick dictionaries
    picks_df = pl.DataFrame(picks)

    # Create a DataFrame from the user_budgets dictionary
    budgets_df = pl.DataFrame(
        list(user_budgets.items()),
        schema=["picked_by", "budget"]
    )

    # Join the picks with their corresponding budgets
    analysis_df = picks_df.join(budgets_df, on="picked_by", how="left")

    # Select and transform the final columns
    return analysis_df.select([
        pl.col("picked_by"),
        pl.col("player_id"),
        pl.col("metadata").struct.field("amount").cast(pl.Int32).alias("amount_spent"),
        pl.col("budget"),
        pl.lit(draft_id).alias("draft_id"),
        pl.lit(draft['league_id']).alias("league_id")
    ])