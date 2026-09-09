from sqlalchemy import text
from database.engine import engine

with engine.connect() as conn:
    result = conn.execute(text("SHOW search_path;"))
    print(f"Current search_path: {result.scalar()}")
