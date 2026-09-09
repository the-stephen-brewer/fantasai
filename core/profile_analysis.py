import polars as pl
from sqlalchemy.orm import Session
from database.models import DraftAnalysis

def get_letter_grade(total_draft_value, draft_count):
    """Assigns a letter grade based on the average draft value."""
    if draft_count == 0:
        return "N/A"
    
    avg_value = total_draft_value / draft_count
    
    if avg_value >= 15:
        return "A+"
    elif avg_value >= 10:
        return "A"
    elif avg_value >= 5:
        return "A-"
    elif avg_value >= 2.5:
        return "B+"
    elif avg_value >= 0:
        return "B"
    elif avg_value >= -2.5:
        return "B-"
    elif avg_value >= -5:
        return "C+"
    elif avg_value >= -10:
        return "C"
    elif avg_value >= -15:
        return "C-"
    elif avg_value >= -20:
        return "D"
    else:
        return "F"

def generate_user_profile(db: Session, user_id: str, year: int):
    """
    Generates a user's draft profile for a given year.
    """
    # Get all draft picks for the user for the given year
    user_picks_query = db.query(DraftAnalysis).filter(
        DraftAnalysis.picked_by == user_id,
        DraftAnalysis.year == year
    )
    user_picks_df = pl.read_database(user_picks_query.statement, db.bind)

    if user_picks_df.height == 0:
        return None

    # Get all draft IDs the user participated in
    draft_ids = user_picks_df['draft_id'].unique().to_list()

    # Get all picks from those drafts
    all_picks_query = db.query(DraftAnalysis).filter(
        DraftAnalysis.draft_id.in_(draft_ids)
    )
    all_picks_df = pl.read_database(all_picks_query.statement, db.bind)


    # Separate league picks (other users' picks in the same drafts)
    league_picks_df = all_picks_df.filter(pl.col('picked_by') != user_id)

    # -- Global Scalars --
    draft_count = len(draft_ids)
    total_picks = user_picks_df.height
    total_draft_value = user_picks_df['draft_value'].sum()
    avg_adp_delta = user_picks_df['adp_delta'].mean()
    absolute_adp_deviation = user_picks_df['adp_delta'].abs().mean()
    portfolio_risk_variance = user_picks_df['vor_std_dev'].mean()
    most_drafted_team = user_picks_df['team'].mode()[0] if user_picks_df['team'].n_unique() > 0 else None
    rookie_pick_rate = user_picks_df.filter(pl.col('years_exp') == 1).height / total_picks if total_picks > 0 else 0
    avg_team_age = user_picks_df['age'].mean()
    
    # -- Best and Worst Picks --
    best_pick = user_picks_df.sort("draft_value", descending=True)[0]
    worst_pick = user_picks_df.sort("draft_value")[0]
    best_pick_id = best_pick["id"].item()
    worst_pick_id = worst_pick["id"].item()


    # -- Position Data --
    position_data = {}
    for pos in ['QB', 'RB', 'WR', 'TE']:
        user_pos_df = user_picks_df.filter(pl.col('position') == pos)
        league_pos_df = league_picks_df.filter(pl.col('position') == pos)

        if user_pos_df.height > 0:
            position_data[pos] = {
                'count': user_pos_df.height,
                'avg_draft_value': user_pos_df['draft_value'].mean(),
                'avg_adp_delta': user_pos_df['adp_delta'].mean(),
                'avg_first_drafted_round': user_pos_df['round'].min(),
                'league_avg_draft_value': league_pos_df['draft_value'].mean() if league_pos_df.height > 0 else 0
            }

    # -- Round Phase Data --
    round_phase_data = (
        user_picks_df.with_columns(
            pl.when(pl.col("round") <= 4).then(pl.lit("Early [1-4]"))
            .when((pl.col("round") > 4) & (pl.col("round") <= 9)).then(pl.lit("Mid [5-9]"))
            .otherwise(pl.lit("Late [10+]"))
            .alias("round_phase")
        )
        .group_by("round_phase")
        .agg(
            pl.mean("draft_value").alias("avg_draft_value"),
            pl.mean("adp_delta").alias("avg_adp_delta")
        )
    ).to_dicts()
    
    round_phase_data_dict = {item['round_phase']: {'avg_draft_value': item['avg_draft_value'], 'avg_adp_delta': item['avg_adp_delta']} for item in round_phase_data}

    # -- Strategy Flags --
    strategy_flags = {}

    # Hero RB
    rb_picks = user_picks_df.filter(pl.col('position') == 'RB').sort('round')
    hero_rb = False
    if rb_picks.height > 0:
        rb_in_first_two_rounds = rb_picks.filter(pl.col('round') <= 2).height
        if rb_in_first_two_rounds == 1: 
            next_rb_round = rb_picks.filter(pl.col('round') > 2)['round'].min()
            if next_rb_round is None or next_rb_round > 7:
                hero_rb = True
    strategy_flags['hero_rb'] = hero_rb

    # Asymmetric Upside Chaser
    late_round_picks_df = user_picks_df.filter(pl.col('round') >= 10)
    late_round_rookie_rate = late_round_picks_df.filter(pl.col('years_exp') == 0).height / late_round_picks_df.height if late_round_picks_df.height > 0 else 0
    strategy_flags['asymmetric_upside_chaser'] = late_round_rookie_rate > 0.25

    # ADP Slave
    adp_slave_data = {}
    for pos in ['QB', 'RB', 'WR', 'TE']:
        pos_df = user_picks_df.filter(pl.col('position') == pos)
        if pos_df.height > 0:
            deviation = pos_df['adp_delta'].abs().mean()
            if deviation is not None:
                adp_slave_data[f'{pos.lower()}_adp_deviation'] = deviation
            else:
                adp_slave_data[f'{pos.lower()}_adp_deviation'] = 0
        else:
            adp_slave_data[f'{pos.lower()}_adp_deviation'] = 0 # Default to 0 if no picks

    strategy_flags['adp_slave'] = adp_slave_data

    # -- Letter Grade --
    letter_grade = get_letter_grade(total_draft_value, draft_count)


    profile = {
        "year": year,
        "user_id": user_id,
        "draft_count": draft_count,
        "total_picks": total_picks,
        "total_draft_value": total_draft_value,
        "avg_adp_delta": avg_adp_delta,
        "absolute_adp_deviation": absolute_adp_deviation,
        "portfolio_risk_variance": portfolio_risk_variance,
        "most_drafted_team": most_drafted_team,
        "rookie_pick_rate": rookie_pick_rate,
        "avg_team_age": avg_team_age,
        "best_pick_id": best_pick_id,
        "worst_pick_id": worst_pick_id,
        "position_data": position_data,
        "round_phase_data": round_phase_data_dict,
        "strategy_flags": strategy_flags,
        "letter_grade": letter_grade
    }

    return profile