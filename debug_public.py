from sqlalchemy import create_engine, text
from database.engine import DATABASE_URL

engine = create_engine(DATABASE_URL)
with engine.connect() as conn:
    print("Checking public.users count...")
    count = conn.execute(text("SELECT count(*) FROM public.users")).scalar()
    print(f"Total users in public: {count}")
    
    print("Checking public.user_drafts count...")
    count = conn.execute(text("SELECT count(*) FROM public.user_drafts")).scalar()
    print(f"Total drafts in public: {count}")
