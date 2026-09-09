from datetime import datetime, timezone

from database.models import ProcessingQueue
from core.job_processing import process_job
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from database.engine import SessionLocal, Base, engine
from core.profile_analysis import generate_user_profile

def main():
    """
    Main loop for the controller. Polls the processing_queue for new jobs.
    """

    try:
        db = SessionLocal()
        print("Dropping all tables for a clean slate...")
        Base.metadata.drop_all(bind=engine)
        print("Creating all tables...")
        Base.metadata.create_all(bind=engine)
        print("Tables created successfully.")
        #print(generate_user_profile(db, "938248068674301952", 2025))
        # Find the oldest queued job 
        # Stephen
        #test_job = ProcessingQueue(status='queued', user_id="362666760110886912", external_draft_id="1257478364675985408", platform_name="sleeper")
        # Greg
        #test_job = ProcessingQueue(status='queued', user_id="938248068674301952", external_draft_id="1265480918777200640", platform_name="sleeper")
        #db.add(test_job)
        #test_job = ProcessingQueue(status='queued', user_id="938248068674301952", external_draft_id="1257478364675985408", platform_name="sleeper")
        #db.add(test_job)
        #test_job = ProcessingQueue(status='queued', user_id="938248068674301952", external_draft_id="1182123985869680641", platform_name="sleeper")
        #db.add(test_job)
        #test_job = ProcessingQueue(status='queued', user_id="938248068674301952", external_draft_id="1182123908820373505", platform_name="sleeper")
        #db.add(test_job)
        #test_job = ProcessingQueue(status='queued', user_id="938248068674301952", external_draft_id="1186819185640927233", platform_name="sleeper")
        #db.add(test_job)
        #db.commit()
        #db.refresh(test_job)
        #job = db.query(ProcessingQueue).filter(ProcessingQueue.status == 'queued').order_by(ProcessingQueue.created_at).first()
        #job.status = 'processing'
        #job.status_change_at = datetime.now(timezone.utc)
        #db.commit()
        #db.refresh(job)
        #process_job(db, job)
        #for job in jobs: 
        #    # Lock the job by updating its status
        #    job.status = 'processing'
        #    job.status_change_at = datetime.now(timezone.utc)
        #    db.commit()
        #    db.refresh(job)
         #   process_job(db, job)
    finally:
        db.close()

if __name__ == "__main__":
    #Base.metadata.create_all(bind=engine) # Ensure tables exist
    main()