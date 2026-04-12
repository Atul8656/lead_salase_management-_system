"""
Remove bcrypt hashes from users.hashed_password (set to NULL where value looks like bcrypt).
Run after switching to password_plain-only auth. Set password_plain in DB for users who had only bcrypt.
Run: python migrate_clear_bcrypt_hashes.py
"""
from sqlalchemy import text
from db.connection import engine


def run():
    with engine.begin() as conn:
        conn.execute(
            text(
                "UPDATE users SET hashed_password = NULL "
                "WHERE hashed_password IS NOT NULL AND hashed_password LIKE '$2%'"
            )
        )
    print("migrate_clear_bcrypt_hashes: done.")


if __name__ == "__main__":
    run()
