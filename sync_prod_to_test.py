from sqlalchemy import create_engine, text
from database.engine import DATABASE_URL
import os

def sync_data():
    # We need to bypass the search_path listener for this script to easily query across schemas
    # Or just use fully qualified names: public.table_name and test.table_name
    engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        print("Identifying the 10 newest users with successful drafts...")
        
        # 1. Get the target User IDs
        user_query = text("""
            SELECT user_id 
            FROM public.users 
            WHERE user_id IN (SELECT DISTINCT user_id FROM public.user_drafts) 
            ORDER BY created_at DESC 
            LIMIT 10
        """)
        user_ids = [row[0] for row in conn.execute(user_query)]
        
        if not user_ids:
            print("No users found to sync.")
            return

        print(f"Targeting User IDs: {user_ids}")
        user_ids_tuple = tuple(user_ids)

        # Tables to sync directly by user_id
        user_scoped_tables = [
            'users', 
            'user_drafts', 
            'user_profiles', 
            'processing_queue'
        ]

        # 2. Sync user-scoped tables
        for table in user_scoped_tables:
            print(f"Syncing table: {table}...")
            # Clear existing data in test for these users to avoid conflicts or duplicates if we rerun
            conn.execute(text(f"DELETE FROM test.{table} WHERE user_id IN :uids"), {"uids": user_ids_tuple})
            
            # Copy from public to test
            conn.execute(text(f"INSERT INTO test.{table} SELECT * FROM public.{table} WHERE user_id IN :uids"), {"uids": user_ids_tuple})
        
        # 3. Get Draft IDs for these users to sync analysis and awards
        draft_query = text("SELECT DISTINCT external_draft_id FROM test.user_drafts WHERE user_id IN :uids")
        draft_ids = [row[0] for row in conn.execute(draft_query, {"uids": user_ids_tuple})]
        
        if draft_ids:
            draft_ids_tuple = tuple(draft_ids)
            draft_scoped_tables = ['draft_analysis', 'draft_awards']
            
            for table in draft_scoped_tables:
                print(f"Syncing table: {table}...")
                conn.execute(text(f"DELETE FROM test.{table} WHERE draft_id IN :dids"), {"dids": draft_ids_tuple})
                conn.execute(text(f"INSERT INTO test.{table} SELECT * FROM public.{table} WHERE draft_id IN :dids"), {"dids": draft_ids_tuple})
        
        conn.commit()
        print("Sync complete!")

if __name__ == "__main__":
    sync_data()
