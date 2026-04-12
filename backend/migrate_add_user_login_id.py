"""
One-time migration: add users.login_id and backfill existing rows.
Run from backend folder: python migrate_add_user_login_id.py
"""
from sqlalchemy import text
from db.connection import engine, SessionLocal
import db.base  # noqa: F401
from models.user import User


def run():
    with engine.begin() as conn:
        conn.execute(
            text(
                """
                ALTER TABLE users ADD COLUMN IF NOT EXISTS login_id VARCHAR(64);
                """
            )
        )

    db = SessionLocal()
    try:
        for u in db.query(User).all():
            if not getattr(u, "login_id", None):
                base = (u.email or "user").split("@")[0].lower()
                u.login_id = f"{base}_{u.id}"
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    run()
    print("Migration login_id: done.")
