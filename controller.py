from datetime import datetime, timezone
import boto3
import json

def lambda_handler(event, context):
    """
    Entry point for lambda. This will process all jobs in the queue until it is empty.
    """
    if event.get('is_background_worker'):
        print(f"Starting heavy job for {event.get('job_id')}...")
        from database.engine import SessionLocal
        from database.models import ProcessingQueue
        from core.job_processing import process_job

        db = SessionLocal()
        db.expire_on_commit = False
        try:
            # Get the first item in the queue to process using postgres logic to ensure only one compute ever gets this row
            job = db.query(ProcessingQueue).filter(
                ProcessingQueue.status == 'queued'
            ).order_by(
                ProcessingQueue.created_at.asc()
            ).with_for_update(skip_locked=True).first()

            if job:
                # Lock the job by updating its status
                job.status = 'processing'
                job.status_change_at = datetime.now(timezone.utc)
                db.commit()
                db.refresh(job)
                process_job(db, job)
        finally:
            db.close()
        
        print("Job Complete")
        return
    lambda_client = boto3.client('lambda')
    # --- PHASE 1: The Receptionist (Handling the HTTP Request) ---
    print("Received HTTP request from Postgres. Spawning worker...")

    # 1. Trigger THIS same function in "Event" (Async) mode
    payload = {
        'is_background_worker': True
    }
    
    lambda_client.invoke(
        FunctionName=context.function_name,
        InvocationType='Event',  # <--- MAGIC: Fire and Forget!
        Payload=json.dumps(payload)
    )

    # 2. Return to Postgres IMMEDIATELY (within <1 second)
    return {
        'statusCode': 202,
        'body': json.dumps({'status': 'Background job started'})
    }

