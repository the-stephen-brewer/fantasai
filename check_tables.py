from sqlalchemy import create_engine, text
from database.engine import DATABASE_URL

engine = create_engine(DATABASE_URL)
with engine.connect() as conn:
    result = conn.execute(text("""
        SELECT schemaname, tablename 
        FROM pg_catalog.pg_tables 
        WHERE schemaname IN ('public', 'test')
        ORDER BY schemaname, tablename;
    """))
    for row in result:
        print(f"Schema: {row[0]}, Table: {row[1]}")
