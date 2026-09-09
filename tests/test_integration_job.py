import pytest
import vcr
from datetime import datetime, timezone
from sqlalchemy import text
from database.engine import SessionLocal, Base, engine
from database.models import ProcessingQueue, Users, UserDrafts, DraftAnalysis, DraftAward, UserProfile
from core.job_processing import process_job

my_vcr = vcr.VCR(
    cassette_library_dir='tests/fixtures/vcr_cassettes',
    record_mode='once',
    match_on=['method', 'scheme', 'host', 'port', 'path', 'query'],
)

@pytest.fixture(scope="module")
def db_session():
    # Setup: ensure we are in test schema and it's clean
    # Note: We use DELETE instead of DROP because test_user may not own the tables
    session = SessionLocal()
    
    # Tables to clear in order of dependency
    tables = [
        'draft_awards',
        'draft_analysis',
        'user_profiles',
        'user_drafts',
        'processing_queue',
        'users'
    ]
    
    for table in tables:
        session.execute(text(f"DELETE FROM {table}"))
    
    session.commit()
    
    yield session
    session.close()

@my_vcr.use_cassette('greggyb23_analysis.yaml')
def test_full_job_lifecycle(db_session):
    """
    Integration test to verify the full job processing lifecycle:
    queued -> processing -> complete, and ensuring data is written to all tables.
    """
    user_id = "938248068674301952"
    draft_id = "1265480918777200640"
    
    # 1. Start with a queued job
    job = ProcessingQueue(
        user_id=user_id,
        external_draft_id=draft_id,
        platform_name="sleeper",
        status="queued",
        created_at=datetime.now(timezone.utc)
    )
    db_session.add(job)
    db_session.commit()
    db_session.refresh(job)
    
    # 2. Simulate worker pickup (queued -> processing)
    # We use with_for_update to mimic the real controller logic
    picked_job = db_session.query(ProcessingQueue).filter(
        ProcessingQueue.id == job.id,
        ProcessingQueue.status == 'queued'
    ).with_for_update(skip_locked=True).first()
    
    assert picked_job is not None
    picked_job.status = 'processing'
    picked_job.status_change_at = datetime.now(timezone.utc)
    db_session.commit()
    
    # 3. Process the job (this will trigger analysis and awards using VCR)
    process_job(db_session, picked_job)
    
    # 4. Verify job is marked as complete
    db_session.refresh(picked_job)
    assert picked_job.status == 'complete'
    
    # 5. Verify data was written to the users table
    db_user = db_session.query(Users).filter(Users.user_id == user_id).first()
    assert db_user is not None
    assert db_user.user_display_name == "greggyb23"
    
    # 6. Verify draft association was created
    db_draft = db_session.query(UserDrafts).filter(UserDrafts.external_draft_id == draft_id).first()
    assert db_draft is not None
    assert db_draft.user_id == user_id
    
    # 7. Verify analysis records were created (should be 168 for a 12-team 14-round draft)
    analysis_count = db_session.query(DraftAnalysis).filter(DraftAnalysis.draft_id == draft_id).count()
    assert analysis_count == 168
    
    # 8. Verify awards were created
    awards_count = db_session.query(DraftAward).filter(DraftAward.draft_id == draft_id).count()
    assert awards_count > 0
    
    # 9. Verify user profiles were generated
    profile_count = db_session.query(UserProfile).count()
    assert profile_count > 0
    
    # Specifically check Greg's profile
    greg_profile = db_session.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    assert greg_profile is not None
    assert greg_profile.year == 2025
