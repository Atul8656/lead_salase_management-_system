from sqlalchemy import text

from db.connection import engine, Base
from db.base import User, Lead, FollowUp, Activity  # noqa: F401 — register models
from models.lead_remark import LeadRemark  # noqa: F401


def init_db():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")


def ensure_columns():
    """Add columns on existing PostgreSQL DBs (Supabase) without full migrations."""
    stmts = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(64)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(1024)",
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP",
        "ALTER TABLE leads ADD COLUMN IF NOT EXISTS priority VARCHAR(16)",
        "ALTER TABLE leads ADD COLUMN IF NOT EXISTS description TEXT",
    ]
    with engine.begin() as conn:
        for s in stmts:
            conn.execute(text(s))
    print("Schema patches applied (phone, description).")


if __name__ == "__main__":
    init_db()
    ensure_columns()
