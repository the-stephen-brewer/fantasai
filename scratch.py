from sleeperpy import User, Leagues, Drafts, Players
import polars as pl
#from database.engine import engine, Base

import json

#from nfl import nfl_wrapper as nfl
#from sleeper.sleeper_main import load_players_with_caching

account = User.get_user(' ')
sport = 'nfl'
season = 2025
week = 1
dynasty_league_id = 1182778932503166976
dynasty_league_latest_draft = 1182778932503166977

def look_at_sleeper_data():
    leagues = Leagues.get_all_leagues("938248068674301952", sport, season)
    print("League info for user")
    for league in leagues:
        print(league)
    print("Draft info")
    for draft in Drafts.get_all_drafts_for_user("938248068674301952", sport, season):
        print(draft)
    

def test_stuff():
    leagues = Leagues.get_all_leagues(account['user_id'], sport, season)
    for league in leagues:
        league_id = league['league_id']
        matchups = Leagues.get_matchups(league_id, week)
        Leagues.get_users(league_id)
        Leagues.get_winners_playoff_bracket(league_id)
        Leagues.get_losers_playoff_bracket(league_id)
        Leagues.get_transactions(league_id, round)
        Leagues.get_traded_picks(league_id)
        Leagues.get_rosters(league_id)
        Leagues.get_league(league_id)


        Drafts.get_all_drafts_for_user(user_id, sport, season)
        Drafts.get_all_drafts_for_league(league_id)
        Drafts.get_specific_draft(draft_id)
        Drafts.get_all_picks_in_draft(draft_id)
        Drafts.get_traded_picks_in_draft(draft_id)

        Players.get_all_players()
        print(matchups)


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

def read_auction_values():
    """Reads the auction_values.json file and returns a Polars DataFrame."""
    file_path = '/home/sbrewer/code/fantasai/auction_values.json'
    with open(file_path, 'r') as f:
        data = json.load(f)
    
    player_list = data.get('player_list', [])
    return pl.DataFrame(player_list)


def check_ids():
    player_map_df = load_players_with_caching().select(["player_id", "gsis_id", "full_name", "position", "age", "years_exp", "team"])
    player_map_df = nfl.add_gsis_id_to_sleeper_df(player_map_df)
    auction_map_df = read_auction_values()

    # find the specific entry in auction_map_df and player_map_df where the full name is 'Bijan Robinson'
    bijan_player_map = player_map_df.filter(pl.col("full_name") == "Bijan Robinson")
    bijan_auction_map = auction_map_df.filter(pl.col("name") == "Bijan Robinson")

    print("--- Entry from player_map_df (Sleeper + NFL Data) ---")
    print(bijan_player_map)

    print("\n--- Entry from auction_map_df (Local JSON) ---")
    print(bijan_auction_map)


if __name__ == "__main__":
    look_at_sleeper_data()
    #print(get_auction_draft_frame(1182778932503166977))
    #print(check_ids())
    #print(Drafts.get_specific_draft(1182778932503166977))
    #print(Drafts.get_all_picks_in_draft(1182778932503166977))
    #load_job_to_test()
    #create_database_tables()
    #create_database_tables()
    #analyze_sleeper_users_current_season_performance(' ')
#print(load_players_with_caching().head(10))

#print(get_players_weekly_vor('00-0039163', 2025))

# 
# Calculate average VOR for each draft pick in 8, 10, 12, and 14 team drafts
# 


#I am working on a algorithem that analyzes all of the draft picks in an nfl fantasy draft and seeks to grade how they drafted at the end of the season now that we have real data. 
#Here are my raw thoughts on how to approach this. 
#What do you recommend.
#we want to keep user experience in mind and what adds value for them. Being able to identify what was their best pick, worst pick, highest value pick, biggest flop, any trends we see in their draft performance, and any tips they should consider for future drafts
# How to judge each draft pick:
# points scored as a starter on the season
# What if we weighted each matchup during regular season differently? 
## Score higher for points in a win
## Score higher for points against a playoff team

# Aka if a dude went off on a week when you win against a playoff team, his points count for extra?
# How do we know if they did well or not unless we have lots of data to compare against?
# We know how the player performed, how many weeks during the season were they RB20 or higher etc
# Maybe each player scores points based on their weekly rating, with bonus points for wins & playoff wins
# Negative points if they are outside the starting realm for their position, same multiplier applies if they lose and lose a playoff match
# Calculate an expected player score range for each draft pick

""" Need to move parquet to use s3 when running in container instead of local (or always)
import polars as pl
import s3fs # You need to add s3fs to your requirements.txt

S3_BUCKET = "s3://fantasai-cache"
CACHE_FILE = f"{S3_BUCKET}/nfl_data_2024.parquet"

def get_data():
    # 1. Try to read from S3 (The "Cache")
    try:
        print("Checking S3 cache...")
        # Polars reads directly from S3 with no extra logic needed
        return pl.read_parquet(CACHE_FILE)
    except Exception:
        print("Cache miss. Fetching from API...")
    
    # 2. If missing, Fetch & Compute
    df = fetch_heavy_data_from_api()
    
    # 3. Save to S3 (Persist the cache)
    # writes directly to the bucket
    df.write_parquet(CACHE_FILE)
    
    return df
"""