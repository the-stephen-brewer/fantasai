import time
from datetime import datetime, timezone

from database.engine import SessionLocal
from database.models import ProcessingQueue
from core.job_processing import process_job

def main():
    """
    Main loop for the controller. Polls the processing_queue for new jobs.
    """
    print("Starting controller...")
    while True:
        db = SessionLocal()
        try:
            # Find the oldest queued job
            job = db.query(ProcessingQueue).filter(ProcessingQueue.status == 'queued').order_by(ProcessingQueue.created_at).first()

            if job:
                # Lock the job by updating its status
                job.status = 'processing'
                job.status_change_at = datetime.now(timezone.utc)
                db.commit()
                db.refresh(job)
                process_job(db, job)
            else:
                print("No jobs in queue. Sleeping for 5 seconds...")
                time.sleep(5)
        finally:
            db.close()

if __name__ == "__main__":
    #Base.metadata.create_all(bind=engine) # Ensure tables exist
    main()