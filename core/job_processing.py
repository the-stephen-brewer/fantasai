from datetime import datetime, timezone
from sleeperpy import User, Drafts

from database.models import  Users, UserDrafts, DraftAnalysis, DraftAward, UserProfile
from core.draft_analysis import analyze_sleeper_draft
from sleeper.sleeper_main import calculate_kicker_points_for_season_for_leauge
from core.cache_handler import LEAGUE_FANTASTY_POINTS_FILE
from sqlalchemy.dialects.postgresql import insert
from core.profile_analysis import generate_user_profile

def process_job(db, job):
    """
    Handles the processing of a single draft analysis job.
    """
    print(f"Processing job ID: {job.id} for draft ID: {job.external_draft_id}")

    try:
        # 1. Get user and draft details from Sleeper API
        user_info = User.get_user(job.user_id)
        if not user_info:
            raise Exception(f"Could not retrieve user info for user_id: {job.user_id}")

        draft = Drafts.get_specific_draft(job.external_draft_id)
        if not draft:
            raise Exception(f"Could not retrieve draft info for draft_id: {job.external_draft_id}")
        if draft['status'] == 'pre_draft':
            job.status = 'complete'
            job.status_change_at = datetime.now(timezone.utc)
            job.message = 'No draft happened in this league'
            db.commit()
            print(f"Successfully completed job ID: {job.id}")
            return
        # 2. Save/update user in the 'users' table
        stmt = insert(Users).values(
            user_id=user_info['user_id'],
            user_display_name=user_info['display_name']
        )
        # 2. Add the "On Conflict" logic (The Upsert)
        # index_elements=['user_id'] tells PG which column to check for collisions
        upsert_stmt = stmt.on_conflict_do_update(
            index_elements=['user_id'], 
            set_=dict(user_display_name=stmt.excluded.user_display_name)
        )
        # 3. Execute atomically
        db.execute(upsert_stmt)
  
        # 3. Save the user/draft association
        db_processed_draft = db.query(UserDrafts).filter(UserDrafts.external_draft_id == job.external_draft_id).first()
        db_user_draft = db.query(UserDrafts).filter(UserDrafts.external_draft_id == job.external_draft_id, UserDrafts.user_id == job.user_id).first()
        # need to check if we have processed this draft or not. If not, we process the draft
        # if we have processed draft, check if this user draf combo already has an entry in user drafts, if not, add the user draft id entry to db so this user can see that draft
        user_profiles_to_process = []
        if not db_processed_draft and (draft.get('type') != 'auction' and "dynasty" not in draft['metadata']['scoring_type']):    # Only reprocess a draft if we haven't already processed this draft ID in the past
            # add three columns for league size, league type, and draft style 
            # 4. Run the analysis
            # Add additional checks here to determine if its a dynasty league, 8, 10, 14 man league. if so, mark as failed as we don't support yet
            print(f"Calculating kicker performance for league {draft['league_id']}...")
            kicker_stats = calculate_kicker_points_for_season_for_leauge(draft['league_id'], int(draft['season']))
            # This is a local use file only and shouldn't be written to S3
            kicker_stats.write_parquet(LEAGUE_FANTASTY_POINTS_FILE)

            print(f"Analyzing draft: {draft['metadata']['name']}...")
            analysis_df, weekly_results_df = analyze_sleeper_draft(draft)

            # 5. Save analysis and awards to the database
            if analysis_df is not None and not analysis_df.is_empty():
                analysis_records = analysis_df.to_dicts()
                db.bulk_insert_mappings(DraftAnalysis, analysis_records)
                print(f"Saved {len(analysis_records)} analysis records to the database.")

                from core.award import generate_awards_for_league_draft
                awards_df = generate_awards_for_league_draft(analysis_df, weekly_results_df)
                if awards_df is not None and not awards_df.is_empty():
                    award_records = awards_df.to_dicts()
                    db.bulk_insert_mappings(DraftAward, award_records)
                    print(f"Saved {len(award_records)} award records to the database.")
                user_profiles_to_process = analysis_df['picked_by'].unique().to_list()
                
        # 6. Mark job as complete
        if not db_user_draft:
            db.add(UserDrafts(
                user_id=user_info['user_id'],
                user_display_name=user_info['display_name'],
                external_draft_id=job.external_draft_id,
                league_name=draft['metadata']['name'],
                external_draft_system_id=job.platform_name,
                draft_type = draft['type'],
                is_dynasty = "dynasty" in draft['metadata']['scoring_type'],
                is_superflex = "2qb" in draft['metadata']['scoring_type'] or "super_flex" in draft["settings"],
                league_type = draft['metadata']['scoring_type'],
                league_size = draft['settings']['teams']
            ))
            db.commit()
        print("Generating user profiles...")
        # Get all unique user IDs from the draft
        # TODO - If our processing starts running too long we can move this logic to its own queue so we only process once all the drafts are processed instead of each time
        for user_id in user_profiles_to_process:
            profile_data = generate_user_profile(db, user_id, int(draft['season']))
            if profile_data:
                # Upsert user profile
                stmt = insert(UserProfile).values(**profile_data)
                upsert_stmt = stmt.on_conflict_do_update(
                    index_elements=['user_id', 'year'],
                    set_=profile_data
                )
                db.execute(upsert_stmt)
                print(f"Upserted profile for user {user_id} for year {draft['season']}")
        job.status = 'complete'
        job.status_change_at = datetime.now(timezone.utc)
        db.commit()
        print(f"Successfully completed job ID: {job.id}")

    except Exception as e:
        print(f"Error processing job ID {job.id}: {e}")
        job.status = 'failed'
        job.status_change_at = datetime.now(timezone.utc)
        job.message = str(f"Error processing job ID {job.id}: {e}")
        db.commit()
    finally:
        # Clean up temporary cache files
        LEAGUE_FANTASTY_POINTS_FILE.unlink(missing_ok=True)