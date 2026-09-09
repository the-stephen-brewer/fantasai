import polars as pl

def _format_award(title, description, winner_row, context_key, context_label):
    """Helper to format the award dictionary."""
    # If winner_row is a DataFrame, extract scalar values. If it's a dict, access directly.
    user_display_name = winner_row["display_name"].item() if isinstance(winner_row, pl.DataFrame) else winner_row["display_name"]
    full_name = winner_row["full_name"].item() if isinstance(winner_row, pl.DataFrame) else winner_row["full_name"]
    context_value = winner_row[context_key].item() if isinstance(winner_row, pl.DataFrame) else winner_row[context_key]
    draft_id = winner_row["draft_id"].item() if isinstance(winner_row, pl.DataFrame) else winner_row["draft_id"]
    user_id = winner_row["picked_by"].item() if isinstance(winner_row, pl.DataFrame) else winner_row["picked_by"]

    return {
        "award_title": title,
        "award_description": description,
        "user_display_name": user_display_name,
        "award_context": f"{full_name} ({context_label}: {context_value:.2f})",
        "draft_id": draft_id,
        "user_id": user_id,
    }

def _get_draft_rank(df):
    """Global,Draft Rank,The manager with the best overall draft class."""
    winner = df.group_by(["picked_by", "display_name"]).agg(
        pl.sum("season_vor").alias("total_val")
    ).sort("total_val", descending=True).head(1)
    
    draft_id = df.head(1)["draft_id"].item()
    user_id = winner["picked_by"].item() if isinstance(winner, pl.DataFrame) else winner["picked_by"]
    return {
        "award_title": "Draft Rank Overall",
        "award_description": "The manager with the best overall draft class.",
        "user_display_name": winner["display_name"].item(),
        "award_context": f"Combined performance of all picks: {winner['total_val'].item():.2f}",
        "draft_id": draft_id,
        "user_id": user_id
    }

def _get_draft_rank_value(df):
    """Global,Draft Rank,The manager with the best value draft class."""
    winner = df.group_by(["picked_by", "display_name"]).agg(
        pl.sum("draft_value").alias("total_val")
    ).sort("total_val", descending=True).head(1)
    draft_id = df.head(1)["draft_id"].item()
    user_id = winner["picked_by"].item() if isinstance(winner, pl.DataFrame) else winner["picked_by"]
    return {
        "award_title": "Draft Rank Value",
        "award_description": "The manager with the best value draft class.",
        "user_display_name": winner["display_name"].item(),
        "award_context": f"Combined value of all picks: {winner['total_val'].item():.2f}",
        "draft_id": draft_id,
        "user_id": user_id
    }

def _get_positional_scout(df):
    """Global,[Position] Scout,Drafted a specific position better than rest of the league."""
    awards = []
    for pos in ["QB", "RB", "WR", "TE", "K"]:
        pos_df = df.filter(pl.col("position") == pos)
        if pos_df.is_empty():
            continue
        
        winner = pos_df.group_by(["picked_by", "display_name"]).agg(
            pl.sum("season_vor").alias("total_vor")
        ).sort("total_vor", descending=True).head(1)

        if winner["total_vor"].item() > 0:
            draft_id = df.head(1)["draft_id"].item()
            user_id = winner["picked_by"].item() if isinstance(winner, pl.DataFrame) else winner["picked_by"]
            awards.append({
                "award_title": f"{pos} Scout",
                "award_description": f"Drafted the best {pos}s in the league.",
                "user_display_name": winner["display_name"].item(),
                "award_context": f"Combined {pos} value: {winner['total_vor'].item():.2f}",
                "draft_id": draft_id,
                "user_id": user_id
            })
    return awards

def _get_mid_round_magician(df):
    """Global,Mid Round Magician,Highest value found in the middle rounds (5-10)."""
    mid_round_df = df.filter(pl.col("round").is_between(5, 10))
    if mid_round_df.is_empty():
        return None
    winner = mid_round_df.sort("draft_value", descending=True).head(1)
    return _format_award("Mid Round Magician", "Highest value found in the middle rounds (5-10).", winner, "draft_value", "Value")

def _get_sleeper_god(df):
    """Global,Sleeper God,Found a starter-level talent in the late rounds."""
    late_round_df = df.filter(pl.col("round") >= 12)
    if late_round_df.is_empty():
        return None
    winner = late_round_df.sort("season_vor", descending=True).head(1)
    return _format_award("Sleeper God", "Found a starter-level talent in the late rounds.", winner, "season_vor", "Value")

def _get_the_anchor(df):
    """Global,The Anchor,The highest performing player drafted in the first 2 rounds."""
    early_round_df = df.filter(pl.col("round") <= 2)
    if early_round_df.is_empty():
        return None
    winner = early_round_df.sort("season_vor", descending=True).head(1)
    return _format_award("The Anchor", "The highest value player drafted in the first 2 rounds.", winner, "season_vor", "Value")

def _get_the_lottery_winner(df):
    """Global,The Lottery Winner,The highest performing player drafted in the final 3 rounds."""
    max_round = df["round"].max()
    if max_round is None:
        return None
    final_rounds_df = df.filter(pl.col("round") >= (max_round - 2))
    if final_rounds_df.is_empty():
        return None
    winner = final_rounds_df.sort("season_vor", descending=True).head(1)
    return _format_award("The Lottery Winner", "The highest performing player drafted in the final 3 rounds.", winner, "season_vor", "Value")

def _get_deep_sea_fisher(df):
    """Global,Deep Sea Fisher,Most value extracted from players outside the top 100 ECR."""
    deep_df = df.filter(pl.col("ecr") > 100)
    if deep_df.is_empty():
        return None
    winner = deep_df.group_by(["picked_by", "display_name"]).agg(
        pl.sum("draft_value").alias("total_val")
    ).sort("total_val", descending=True).head(1)
    
    if winner["total_val"].item() > 0:
        draft_id = df.head(1)["draft_id"].item()
        user_id = winner["picked_by"].item() if isinstance(winner, pl.DataFrame) else winner["picked_by"]
        return {
            "award_title": "Deep Sea Fisher",
            "award_description": "Most value extracted from players outside the top 100 ECR.",
            "user_display_name": winner["display_name"].item(),
            "award_context": f"Combined value from players with ECR > 100: {winner['total_val'].item():.2f}",
            "draft_id": draft_id,
            "user_id": user_id
        }
    return None

def _get_the_reacher(df):
    """Global,The Reacher,Reached the furthest on average for their picks in rounds 1-10."""
    reach_df = df.filter(pl.col("round") <= 10).with_columns(
        (pl.col("pick_no") - pl.col("ecr")).alias("reach_delta")
    )
    winner = reach_df.group_by(["picked_by", "display_name"]).agg(
        pl.mean("reach_delta").alias("avg_reach")
    ).sort("avg_reach", descending=True).head(1)

    if winner["avg_reach"].item() > 0:
        draft_id = df.head(1)["draft_id"].item()
        user_id = winner["picked_by"].item() if isinstance(winner, pl.DataFrame) else winner["picked_by"]
        return {
            "award_title": "The Reacher",
            "award_description": "Reached the furthest on average for their picks in rounds 1-10.",
            "user_display_name": winner["display_name"].item(),
            "award_context": f"Average reach of {winner['avg_reach'].item():.2f} picks ahead of ECR.",
            "draft_id": draft_id,
            "user_id": user_id
        }
    return None

def _get_the_opportunist(df):
    """Global,The Opportunist,Got the best value (fallen players) in rounds 1-10."""
    value_df = df.filter(pl.col("round") <= 10).with_columns(
        (pl.col("ecr") - pl.col("pick_no")).alias("value_delta")
    )
    winners = value_df.group_by(["picked_by", "display_name"]).agg(
        pl.mean("value_delta").alias("avg_value"),
        pl.mean("season_vor").alias("avg_vor")
    ).filter(
        (pl.col("avg_vor") >= 0) & (pl.col("avg_value") > 0)
    ).sort("avg_value", descending=True)

    if winners.is_empty():
        return None
    
    winner = winners.head(1)
    draft_id = df.head(1)["draft_id"].item()
    user_id = winner["picked_by"].item() if isinstance(winner, pl.DataFrame) else winner["picked_by"]
    return {
        "award_title": "The Opportunist",
        "award_description": "Got the best value (fallen players) in rounds 1-10.",
        "user_display_name": winner["display_name"].item(),
        "award_context": f"Players fell an average of {winner['avg_value'].item():.2f} picks.",
        "draft_id": draft_id,
        "user_id": user_id
    }

def _get_the_homer(df):
    """Global,The Homer,Drafted 3+ players from the same NFL team."""
    homer_df = df.group_by(["picked_by", "display_name", "team"]).agg(
        pl.count("player_id").alias("player_count")
    ).filter(pl.col("player_count") >= 3)

    if homer_df.is_empty():
        return None
    
    # Can be won by multiple people for different teams
    return [
        {
            "award_title": "The Homer",
            "award_description": "Drafted 3 or more players from the same NFL team.",
            "user_display_name": row["display_name"],
            "award_context": f"Drafted {row['player_count']} players from {row['team']}.",
            "draft_id": df.head(1)["draft_id"].item(),
            "user_id": row["picked_by"]
        } for row in homer_df.to_dicts()
    ]

def _get_steady_studs(df):
    """Global,Steady Studs,Draft class with the most consistent producers."""
    winner = df.group_by(["picked_by", "display_name"]).agg(
        pl.mean("vor_std_dev").alias("avg_std_dev")
    ).sort("avg_std_dev", descending=False).head(1)
    draft_id = df.head(1)["draft_id"].item()
    user_id = winner["picked_by"].item() if isinstance(winner, pl.DataFrame) else winner["picked_by"]
    return {
        "award_title": "Steady Studs",
        "award_description": "Draft class with the most consistent producers (lowest VOR standard deviation).",
        "user_display_name": winner["display_name"].item(),
        "award_context": f"Average VOR standard deviation of {winner['avg_std_dev'].item():.2f}.",
        "draft_id": draft_id,
        "user_id": user_id
    }

def _get_crystal_ball(df):
    """Global,The Crystal Ball,Best rookie drafted late."""
    rookie_df = df.filter((pl.col("round") >= 8) & (pl.col("years_exp") == 0))
    if rookie_df.is_empty():
        return None
    winner = rookie_df.sort("season_vor", descending=True).head(1)
    if winner["season_vor"].item() > 0:
        return _format_award("The Crystal Ball", "Best rookie drafted in round 8 or later.", winner, "season_vor", "Value")
    return None

def _get_personal_best_and_worst_picks(df):
    """Personal,My Best/Worst Pick,Your single best/worst pick of the draft."""
    awards = []

    # Best pick for each manager
    best_picks = df.sort("draft_value", descending=True).group_by("picked_by", maintain_order=True).head(1)
    for row in best_picks.to_dicts():
        awards.append(_format_award("My Best Pick", "Your single best pick of the draft based on value provided.", row, "draft_value", "Value"))

    # Worst pick for each manager (from non-null VORs)
    worst_picks = df.filter(
        pl.col("draft_value").is_not_null()
    ).sort("draft_value", descending=False).group_by("picked_by", maintain_order=True).head(1)

    for row in worst_picks.to_dicts():
        awards.append(_format_award("My Worst Pick", "Your single worst pick of the draft based on value provided.", row, "draft_value", "Value"))

    return awards

def _get_adp_slave(df):
    """Global,The ADP Slave,Deviated the least from consensus rankings."""
    # Filter for picks where ECR is available to calculate deviation
    adp_df = df.filter(pl.col("ecr").is_not_null())
    if adp_df.is_empty():
        return None

    # Calculate the absolute deviation from ECR for each pick
    adp_df = adp_df.with_columns(
        (pl.col("pick_no") - pl.col("ecr")).abs().alias("adp_deviation")
    )

    # Find the manager with the lowest average deviation
    winner = adp_df.group_by(["picked_by", "display_name"]).agg(
        pl.mean("adp_deviation").alias("avg_deviation")
    ).sort("avg_deviation", descending=False).head(1)
    draft_id = df.head(1)["draft_id"].item()
    user_id = winner["picked_by"].item() if isinstance(winner, pl.DataFrame) else winner["picked_by"]
    return {
        "award_title": "The ADP Slave",
        "award_description": "Deviated the least from consensus rankings (ECR).",
        "user_display_name": winner["display_name"].item(),
        "award_context": f"Average deviation of only {winner['avg_deviation'].item():.2f} picks from ECR.",
        "draft_id": draft_id,
        "user_id": user_id
    }

def _get_zero_rb_disciple(df):
    """Global,Zero-RB Disciple,Waited the longest to draft their first RB."""
    # Filter for all RB picks
    rb_picks = df.filter(pl.col("position") == "RB")
    if rb_picks.is_empty():
        return None

    # Find the first RB pick for each manager
    first_rb_pick_by_manager = rb_picks.group_by(["picked_by", "display_name"]).agg(
        pl.min("pick_no").alias("first_rb_pick")
    )

    # Find the manager who waited the longest (highest pick number for their first RB)
    winner = first_rb_pick_by_manager.sort("first_rb_pick", descending=True).head(1)
    draft_id = df.head(1)["draft_id"].item()
    user_id = winner["picked_by"].item() if isinstance(winner, pl.DataFrame) else winner["picked_by"]
    return {
        "award_title": "Zero-RB Disciple",
        "award_description": "Waited the longest to draft their first running back.",
        "user_display_name": winner["display_name"].item(),
        "award_context": f"Drafted their first RB at pick #{winner['first_rb_pick'].item()}.",
        "draft_id": draft_id,
        "user_id": user_id
    }

def _get_qb_hoarder(df):
    """Global,QB Hoarder,Drafted a backup QB before others drafted their backups."""
    # Find the second QB pick for each manager using a window function for backward compatibility
    second_qb_picks = df.filter(pl.col("position") == "QB").sort("pick_no").with_columns(
        pl.col("pick_no").cum_count().over("picked_by").alias("qb_draft_order")
    ).filter(pl.col("qb_draft_order") == 1)

    if second_qb_picks.is_empty():
        return None

    # The winner is the one who took their second QB at the earliest pick number
    winner = second_qb_picks.sort("pick_no").head(1)
    draft_id = df.head(1)["draft_id"].item()
    user_id = winner["picked_by"].item() if isinstance(winner, pl.DataFrame) else winner["picked_by"]
    return {
        "award_title": "QB Hoarder",
        "award_description": "Drafted a backup QB before anyone else.",
        "user_display_name": winner["display_name"].item(),
        "award_context": f"Drafted backup QB {winner['full_name'].item()} at pick #{winner['pick_no'].item()}.",
        "draft_id": draft_id,
        "user_id": user_id
    }

def _get_the_nostradamus(df):
    """Global,The Nostradamus,Drafted a player >2 rounds early who became a top-10 starter."""
    # 1. Find all players who were "reached" for by more than 2 rounds (24 picks)
    # Exclude kickers as they can skew this award
    reaches = df.filter(((pl.col("ecr") - pl.col("pick_no")) > 24) & (pl.col("position") != "K"))
    if reaches.is_empty():
        return None

    # 2. Find the set of top 10 players by VOR for each position
    # Exclude kickers here as well
    top_10_starters = df.filter(pl.col("position") != "K").sort("season_vor", descending=True).group_by("position", maintain_order=True).head(10)
    top_10_player_ids = top_10_starters["player_id"].to_list()

    # 3. Find which of the "reaches" ended up being a top 10 starter
    successful_reaches = reaches.filter(pl.col("player_id").is_in(top_10_player_ids))
    if successful_reaches.is_empty():
        return None

    # 4. The winner is the one with the highest VOR among the successful reaches
    winner = successful_reaches.sort("season_vor", descending=True).head(1)
    reach_amount = winner['ecr'].item() - winner['pick_no'].item()
    return _format_award("The Nostradamus", f"Reached {reach_amount} picks for a top-10 positional player.", winner, "season_vor", "Value")

def _get_ryan_leaf_trophy(df):
    """Global,Ryan Leaf Trophy,Highest draft capital spent on a bust."""
    # Define a "bust" as a player who finished the season ranked below 50th at their position.
    # We rank based on total season_vor.
    busts = df.filter(
        pl.col("season_vor").rank("min", descending=True).over("position") > 50
    )
    if busts.is_empty():
        return None

    # The winner is the bust who was drafted earliest (lowest pick_no).
    winner = busts.sort("pick_no").head(1)
    draft_id = winner["draft_id"].item() if isinstance(winner, pl.DataFrame) else winner["draft_id"]
    user_id = winner["picked_by"].item() if isinstance(winner, pl.DataFrame) else winner["picked_by"]
    return {
        "award_title": "Ryan Leaf Trophy",
        "award_description": "Highest draft capital spent on a bust (player outside top-50 at their position).",
        "user_display_name": winner["display_name"].item(),
        "award_context": f"Used pick #{winner['pick_no'].item()} on {winner['full_name'].item()}.",
        "draft_id": draft_id,
        "user_id": user_id
    }

def _get_the_mirage(df):
    """Global,The Mirage,Largest gap between expectation and reality."""
    # Calculate the difference between expected and actual value.
    mirage_df = df.with_columns(
        (pl.col("expected_vor") - pl.col("season_vor")).alias("mirage_gap")
    )
    if mirage_df.is_empty():
        return None

    # The winner is the one with the largest gap (most disappointing).
    winner = mirage_df.sort("mirage_gap", descending=True).head(1)
    draft_id = winner["draft_id"].item() if isinstance(winner, pl.DataFrame) else winner["draft_id"]
    user_id = winner["picked_by"].item() if isinstance(winner, pl.DataFrame) else winner["picked_by"]
    return {
        "award_title": "The Mirage",
        "award_description": "The player with the largest gap between expected value and actual value.",
        "user_display_name": winner["display_name"].item(),
        "award_context": f"{winner['full_name'].item()} had a value gap of {winner['mirage_gap'].item():.2f}.",
        "draft_id": draft_id,
        "user_id": user_id
    }

def _get_grim_reaper(df):
    """Global,Grim Reaper,Most players with significant injuries."""
    # This award requires 'weeks_injured' to be pre-calculated and joined.
    if "weeks_injured" not in df.columns:
        return None

    # Count players with more than 8 weeks injured for each manager.
    reaper_df = df.filter(pl.col("weeks_injured") > 8).group_by(["picked_by", "display_name"]).agg(
        pl.count("player_id").alias("injured_player_count")
    )
    if reaper_df.is_empty():
        return None

    # The winner is the one with the most significantly injured players.
    winner = reaper_df.sort("injured_player_count", descending=True).head(1)
    draft_id = df.head(1)["draft_id"].item()
    user_id = winner["picked_by"].item() if isinstance(winner, pl.DataFrame) else winner["picked_by"]
    return {
        "award_title": "Grim Reaper",
        "award_description": "Drafted the most players who were injured for more than 8 weeks.",
        "user_display_name": winner["display_name"].item(),
        "award_context": f"Had {winner['injured_player_count'].item()} players miss significant time.",
        "draft_id": draft_id,
        "user_id": user_id
    }

def _get_cougar_chaser(df):
    """Global,Cougar Chaser,Drafted the oldest team on average."""
    if "age" not in df.columns or df["age"].is_null().all():
        return None

    winner = df.group_by(["picked_by", "display_name"]).agg(
        pl.mean("age").alias("avg_age")
    ).sort("avg_age", descending=True).head(1)
    draft_id = df.head(1)["draft_id"].item()
    user_id = winner["picked_by"].item() if isinstance(winner, pl.DataFrame) else winner["picked_by"]
    return {
        "award_title": "Cougar Chaser",
        "award_description": "Drafted the oldest team on average.",
        "user_display_name": winner["display_name"].item(),
        "award_context": f"Average player age of {winner['avg_age'].item():.2f} years.",
        "draft_id": draft_id,
        "user_id": user_id
    }

def _get_cradle_robber(df):
    """Global,Cradle Robber,Drafted the youngest team on average."""
    if "age" not in df.columns or df["age"].is_null().all():
        return None

    winner = df.group_by(["picked_by", "display_name"]).agg(
        pl.mean("age").alias("avg_age")
    ).sort("avg_age", descending=False).head(1)
    draft_id = df.head(1)["draft_id"].item()
    user_id = winner["picked_by"].item() if isinstance(winner, pl.DataFrame) else winner["picked_by"]
    return {
        "award_title": "Cradle Robber",
        "award_description": "Drafted the youngest team on average.",
        "user_display_name": winner["display_name"].item(),
        "award_context": f"Average player age of {winner['avg_age'].item():.2f} years.",
        "draft_id": draft_id,
        "user_id": user_id
    }

def _get_iron_man(df):
    """Global,Iron Man,Draft class with the most total games played."""
    # This award requires 'games_played' to be pre-calculated and joined.
    if "games_played" not in df.columns:
        return None

    # Sum the games played for all players for each manager.
    iron_man_df = df.group_by(["picked_by", "display_name"]).agg(
        pl.sum("games_played").alias("total_games_played")
    )
    if iron_man_df.is_empty():
        return None

    winner = iron_man_df.sort("total_games_played", descending=True).head(1)
    draft_id = df.head(1)["draft_id"].item()
    user_id = winner["picked_by"].item() if isinstance(winner, pl.DataFrame) else winner["picked_by"]
    return {
        "award_title": "Iron Man",
        "award_description": "Draft class with the most total games played.",
        "user_display_name": winner["display_name"].item(),
        "award_context": f"A total of {winner['total_games_played'].item()} games played by drafted players.",
        "draft_id": draft_id,
        "user_id": user_id
    }

def generate_awards_for_league_draft(league_draft_results_df, weekly_player_results_df):
    # league_draft_results_df columns below
    # draft_id,draft_slot,is_keeper,pick_no,picked_by,player_id,reactions,roster_id,round,gsis_id,full_name,position,age,years_exp,team,year,name,ecr,season_vor,avg_vor,vor_std_dev,expected_vor,adp_delta,draft_value,display_name
    # weekly_player_results_df
    # ['player_id', 'week', 'fantasy_points', 'position_rank', 'vor', 'injured_bool', 'season']
    
    df = league_draft_results_df.filter(pl.col("display_name").is_not_null())
    
    # Pre-calculate and join data needed for some awards
    if not weekly_player_results_df.is_empty():
        injured_weeks_per_player = weekly_player_results_df.filter(
            pl.col("injured_bool") == True
        ).group_by("player_id").agg(
            pl.count("week").alias("weeks_injured")
        )
        # The weekly results use gsis_id as 'player_id', so we join on that.
        df = df.join(injured_weeks_per_player, left_on="gsis_id", right_on="player_id", how="left").with_columns(pl.col("weeks_injured").fill_null(0))

        games_played_per_player = weekly_player_results_df.filter(
            pl.col("injured_bool") == False
        ).group_by("player_id").agg(
            pl.count("week").alias("games_played")
        )
        df = df.join(games_played_per_player, left_on="gsis_id", right_on="player_id", how="left").with_columns(pl.col("games_played").fill_null(0))


    awards = []

    # --- Award Strategies ---
    award_functions = [
        _get_draft_rank, _get_draft_rank_value, _get_positional_scout, _get_mid_round_magician,
        _get_sleeper_god, _get_the_anchor, _get_the_lottery_winner,
        _get_deep_sea_fisher, _get_the_reacher, _get_the_opportunist,
        _get_the_homer, _get_steady_studs, _get_crystal_ball, _get_personal_best_and_worst_picks,
        _get_adp_slave, _get_zero_rb_disciple, _get_qb_hoarder, _get_the_nostradamus,
        _get_ryan_leaf_trophy, _get_the_mirage, _get_grim_reaper, _get_cougar_chaser, 
        _get_cradle_robber, _get_iron_man
    ]

    for func in award_functions:
        try:
            result = func(df)
            if result:
                if isinstance(result, list):
                    awards.extend(result)
                else:
                    awards.append(result)
        except Exception as e:
            print(f"Could not generate award for {func.__name__}: {e}")

    # --- Special Case Awards (Top/Bottom N) ---
    sorted_df = df.sort("draft_value", descending=True)
    if sorted_df.height >= 1:
        awards.append(_format_award("Gold Pick", "The single best pick of the entire draft.", sorted_df.row(0, named=True), "draft_value", "Value"))
    if sorted_df.height >= 2:
        awards.append(_format_award("Silver Pick", "The second best pick of the draft.", sorted_df.row(1, named=True), "draft_value", "Value"))
    if sorted_df.height >= 3:
        awards.append(_format_award("Bronze Pick", "The third best pick of the draft.", sorted_df.row(2, named=True), "draft_value", "Value"))

    # Toilet Award
    busts_df = df.filter(pl.col("draft_value").is_not_null()).sort("draft_value", descending=False)
    for i in range(min(3, busts_df.height)):
        awards.append(_format_award("The Toilet Award", "One of the worst 3 picks based on value.", busts_df.row(i, named=True), "draft_value", "Value"))

    if not awards:
        return pl.DataFrame()

    return pl.DataFrame(awards).select(["award_title", "award_description", "user_display_name", "award_context", "draft_id", "user_id"])


#def generate_awards_for_league_draft(league_draft_results_df, weekly_player_results_df):
    # league_draft_results_df columns below
    # draft_id,draft_slot,is_keeper,pick_no,picked_by,player_id,reactions,roster_id,round,gsis_id,full_name,position,age,years_exp,team,year,name,ecr,season_vor,avg_vor,vor_std_dev,expected_vor,adp_delta,draft_value,display_name
    # weekly_player_results_df
    # ['player_id', 'week', 'fantasy_points', 'position_rank', 'vor', 'injured_bool', 'season']
    # Target award list:
    #Type	Title	Description	Logic
 #   #Global,Gold Pick,The single best pick of the entire draft.,Sort by season_vor DESC. Take the top 1.
 #   #Global,Silver Pick,The second best pick of the draft.,Sort by season_vor DESC. Take the 2nd record.
 #   #Global,Bronze Pick,The third best pick of the draft.,Sort by season_vor DESC. Take the 3rd record.
 #   #Global,The Toilet Award,The worst 3 picks based on value relative to replacement.,Filter where season_vor is not null. Sort by season_vor ASC. Take bottom 3.
 #   #Global,Draft Rank,The manager with the best overall draft class.,Group by picked_by. Sum season_vor. Sort DESC.
 #   #Global,[Position] Scout,"Drafted a specific position (QB, RB, WR, TE, K) better than rest of the league.",Filter by position = [X]. Group by picked_by, sum the vor, sort by VOR sums desc, limit 1
 #   #Global,Mid Round Magician,Highest value found in the middle rounds (5-10).,Filter where round between 5 and 10. Sort by season_vor DESC. Limit 1.
 #   #Global,Sleeper God,Found a starter-level talent in the late rounds.,Filter where round >= 12. Sort by season_vor DESC. Limit 1.
 #   #Global,The Anchor,The highest value player drafted in the first 2 rounds.,Filter where round <= 2. Sort by season_vor DESC. Limit 1.
 #   #Global,The Lottery Winner,The highest performing player drafted in the final 3 rounds.,Filter where round >= (Max Round - 3). Sort by season_vor DESC. Limit 1.
 #   #Global,Deep Sea Fisher,Most value extracted from players outside the top 100.,Filter where ecr > 100. Group by picked_by. Sum season_vor. Sort DESC.
 #   #Personal,My Best Pick,Your single best pick of the draft.,Group by picked_by. Identify Max season_vor.
 #   #Personal,My Worst Pick,Your single worst pick of the draft.,Group by picked_by. Identify Min season_vor.
  #  #Global,The Reacher,Reached the furthest on average for their picks in rounds 1-10.,Filter round <= 10. Calculate (pick_no - ecr). Group by picked_by. Sort Avg DESC (Highest negative difference implies reaching).
  #  #Global,The Opportunist,Got the best value (fallen players) in rounds 1-10.,Filter round <= 10. Calculate (ecr - pick_no). Group by picked_by. Sort Avg DESC (Highest positive difference implies value). Filter out any picked_by where the avg VOR for their picks in top 10 rounds is negative. Dont give award if difference isn't positive
  #  #Global,The Homer,Drafted 3+ players from the same NFL team.,Requires NFL Team column. Group by picked_by AND team. Count player_id. Filter where count >= 3.
  #  #Global,The ADP Slave,Deviated the least from consensus rankings.,Calculate absolute value of (pick_no - ecr). Group by picked_by. Average the result. Sort ASC (Lowest deviation).
  #  #Global,Zero-RB Disciple,Waited the longest to draft their first RB.,Filter where position = 'RB'. Group by picked_by. Find Min pick_no. Sort DESC (Highest pick number means waited longest).
  #  #Global,QB Hoarder,Drafted a backup QB before others drafted their backups.,Filter where position = 'QB'. Group by picked_by. Order picks by pick_no ASC. Select the 2nd QB for each user. Sort by pick_no ASC.
  #  #Global,The Nostradamus,Drafted a player >2 rounds early who became a top-10 starter.,Filter where (ecr - pick_no) > 24 (approx 2 rounds). Filter resulting list for Top 10 season_vor per position.
  #  #Global,Ryan Leaf Trophy,Highest draft capital spent on a bust.,Filter position rank > 50 (calculated via season_vor). Sort remaining list by pick_no ASC (Earliest pick).
  #  #Global,The Mirage,Largest gap between expectation and reality.,Sort by (expected_vor - season_vor) DESC.
  #  #Global,Steady Studs,Draft class with the most consistent producers.,Requires Weekly Scoring Data. Group by picked_by. Average the vor_std_dev of all drafted players. Sort ASC.
  #  #Global,The Crystal Ball,Best rookie drafted late.,Filter round >= 8 AND years_exp = 0. Sort season_vor DESC.
  #  #Global,Grim Reaper,Injury Weeks,Group by picked_by. Count players where weeks_injured > 8.
  #  #Global,Iron Man,Games Played,Group by picked_by. Sum games_played for entire draft class. Sort DESC.
  #  #Global,Cougar Chaser,Player Age,Group by picked_by. Average player_age. Sort DESC.
  #  #Global,Cradle Robber,Player Age,Group by picked_by. Average player_age. Sort ASC.