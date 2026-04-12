"""
Adds users.password_plain and allows NULL hashed_password.
Run: python migrate_password_plain.py
"""
from sqlalchemy import text
from db.connection import engine


def run():
    stmts = [
        "ALTER TABLE users ADD COLUMN IF NOT EXISTS password_plain VARCHAR(255);",
        "ALTER TABLE users ALTER COLUMN hashed_password DROP NOT NULL;",
    ]
    with engine.begin() as conn:
        for s in stmts:
            conn.execute(text(s))
    with engine.begin() as conn:
        conn.execute(
            text(
                "UPDATE users SET password_plain = 'admin123' "
                "WHERE email = 'admin@crm.com' AND (password_plain IS NULL OR password_plain = '');"
            )
        )
        conn.execute(
            text(
                "UPDATE users SET password_plain = 'agent123' "
                "WHERE email = 'agent@crm.com' AND (password_plain IS NULL OR password_plain = '');"
            )
        )
    print("migrate_password_plain: done.")


if __name__ == "__main__":
    run()
