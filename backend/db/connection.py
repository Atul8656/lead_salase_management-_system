from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from core.config import settings

# Supabase and most cloud Postgres require TLS
_connect_args = {}
if "supabase" in (settings.DATABASE_URL or "").lower() or "sslmode=require" in (settings.DATABASE_URL or ""):
    _connect_args["sslmode"] = "require"

engine = create_engine(
    settings.sqlalchemy_database_url,
    connect_args=_connect_args,
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
