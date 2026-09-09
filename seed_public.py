import os
os.environ['DATABASE_SCHEMA'] = 'public'

from database.engine import SessionLocal, Base, engine
from database.models import ProcessingQueue
from core.job_processing import process_job
from datetime import datetime, timezone

def seed_public():
    db = SessionLocal()
    try:
        print("Ensuring tables exist in public...")
        Base.metadata.create_all(bind=engine)
        
        # Check if we already have the draft
        from database.models import UserDrafts
        draft_id = "1265480918777200640"
        user_id = "938248068674301952"
        
        existing = db.query(UserDrafts).filter(UserDrafts.external_draft_id == draft_id).first()
        if existing:
            print("Draft already exists in public. Seed skipped.")
            return

        print("Adding a test job to public.processing_queue...")
        job = ProcessingQueue(
            user_id=user_id,
            external_draft_id=draft_id,
            platform_name="sleeper",
            status="queued"
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        
        print(f"Processing job {job.id} in public schema...")
        job.status = 'processing'
        job.status_change_at = datetime.now(timezone.utc)
        db.commit()
        
        process_job(db, job)
        print("Seeding complete!")
    finally:
        db.close()

if __name__ == "__main__":
    seed_public()
