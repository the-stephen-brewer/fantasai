from datetime import datetime, timezone
from sqlalchemy import Column, Integer, BigInteger, String, Float, Boolean, TIMESTAMP, UniqueConstraint, DDL, event
from sqlalchemy.dialects.postgresql import JSONB
from .engine import Base

class DraftAnalysis(Base):
    """SQLAlchemy model for the draft analysis results."""
    __tablename__ = 'draft_analysis'

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(TIMESTAMP, default=lambda: datetime.now(timezone.utc))
    draft_id = Column(String, index=True)
    draft_slot = Column(Integer)
    is_keeper = Column(Boolean)
    pick_no = Column(Integer)
    picked_by = Column(String, index=True)
    player_id = Column(Integer) # sleeper_id
    roster_id = Column(Integer)
    round = Column(Integer)
    gsis_id = Column(String, index=True)
    full_name = Column(String)
    position = Column(String)
    age = Column(Integer)
    years_exp = Column(Integer)
    team = Column(String)
    year = Column(Integer)
    ecr = Column(Float)
    season_vor = Column(Float)
    avg_vor = Column(Float)
    vor_std_dev = Column(Float)
    expected_vor = Column(Float)
    adp_delta = Column(Float)
    draft_value = Column(Float)
    display_name = Column(String)


class DraftAward(Base):
    """SQLAlchemy model for the draft awards."""
    __tablename__ = 'draft_awards'

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(TIMESTAMP, default=lambda: datetime.now(timezone.utc))
    draft_id = Column(String, index=True)
    award_title = Column(String)
    award_description = Column(String)
    award_context = Column(String)
    user_id = Column(String)
    user_display_name = Column(String)

class UserDrafts(Base):
    __tablename__ = 'user_drafts'

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(TIMESTAMP, default=lambda: datetime.now(timezone.utc))
    user_id = Column(String)
    user_display_name = Column(String)
    external_draft_id = Column(String)
    league_name = Column(String)
    external_draft_system_id = Column(String)
    draft_type = Column(String)
    is_dynasty = Column(Boolean)
    is_superflex = Column(Boolean)
    league_type = Column(String)
    league_size = Column(Integer)

class Users(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(TIMESTAMP, default=lambda: datetime.now(timezone.utc))
    user_id = Column(String, unique=True, index=True)
    user_display_name = Column(String)

class ProcessingQueue(Base):
    __tablename__ = 'processing_queue'

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String)
    external_draft_id = Column(String)
    platform_name = Column(String)
    status = Column(String)
    created_at = Column(TIMESTAMP, default=lambda: datetime.now(timezone.utc))
    status_change_at = Column(TIMESTAMP, default=lambda: datetime.now(timezone.utc))
    message = Column(String)

class UserProfile(Base):
    __tablename__ = 'user_profiles'

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(TIMESTAMP, default=lambda: datetime.now(timezone.utc))
    year = Column(Integer, index=True)
    user_id = Column(String, index=True)
    draft_count = Column(Integer)
    total_picks = Column(Integer)
    total_draft_value = Column(Float)
    avg_adp_delta = Column(Float)
    absolute_adp_deviation = Column(Float)
    portfolio_risk_variance = Column(Float)
    most_drafted_team = Column(String)
    rookie_pick_rate = Column(Float)
    avg_team_age = Column(Float)
    best_pick_id = Column(Integer)
    worst_pick_id = Column(Integer)
    position_data = Column(JSONB)
    round_phase_data = Column(JSONB)
    strategy_flags = Column(JSONB)
    letter_grade = Column(String)
    __table_args__ = (
        UniqueConstraint('user_id', 'year', name='uq_user_profile_user_year'),
    )

# --- DATABASE TRIGGERS ---
trigger_ddl = DDL("""
    CREATE OR REPLACE FUNCTION process_draft_webhook()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
        -- Just ping the URL, no body or headers needed
        PERFORM net.http_post(
            url := 'https://tbsyytygimdejr3unmpia7mfqu0njlfv.lambda-url.us-east-1.on.aws/',
            headers := '{"Content-Type": "application/json", "User-Agent": "pg_net/supabase"}'::jsonb,
            timeout_milliseconds := 7000
        );
        RETURN NEW;
    END;
    $$;

    CREATE TRIGGER trigger_process_draft
    AFTER INSERT ON processing_queue
    FOR EACH ROW
    EXECUTE FUNCTION process_draft_webhook();
""")

# Tell SQLAlchemy to run this SQL immediately after it creates the 'processing_queue' table
event.listen(ProcessingQueue.__table__, 'after_create', trigger_ddl)