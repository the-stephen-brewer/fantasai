from urllib.parse import quote_plus

from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import os

# Determine the schema based on environment
DB_SCHEMA = os.environ.get('DATABASE_SCHEMA')
if not DB_SCHEMA:
    if os.environ.get('AWS_LAMBDA_FUNCTION_NAME'):
        DB_SCHEMA = "public"
    else:
        # Running locally or in tests
        DB_SCHEMA = "test"

# Database Credentials
# For production (Lambda), we use 'postgres' and pull password from env
# For local development (test schema), we use 'test_user'
if DB_SCHEMA == "public":
    DB_USER = "postgres"
    DB_PASSWORD = os.environ.get('live_db_pass', "local")
else:
    DB_USER = "test_user"
    DB_PASSWORD = "localpw"

# URL-encode the password
ENCODED_DB_PASSWORD = quote_plus(DB_PASSWORD)

# Construct the DATABASE_URL with the encoded password
DATABASE_URL = f"postgresql://{DB_USER}.jtxtswhzzktficdkllbt:{ENCODED_DB_PASSWORD}@aws-1-us-west-2.pooler.supabase.com:5432/postgres"

# The engine is the starting point for any SQLAlchemy application.
engine = create_engine(DATABASE_URL)

@event.listens_for(engine, "connect")
def set_search_path(dbapi_conn, conn_record):
    cursor = dbapi_conn.cursor()
    cursor.execute(f"SET search_path TO {DB_SCHEMA}")
    cursor.close()

# The SessionLocal class is a factory for creating new Session objects.
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for our declarative models.
Base = declarative_base()
