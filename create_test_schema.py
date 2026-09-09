from sqlalchemy import create_engine, text
from database.engine import DATABASE_URL

engine = create_engine(DATABASE_URL)
with engine.connect() as conn:
    conn.execute(text("CREATE SCHEMA IF NOT EXISTS test;"))
    conn.commit()
    print("Schema 'test' created or already exists.")
