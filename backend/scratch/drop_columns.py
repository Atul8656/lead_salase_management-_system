from sqlalchemy import text
from db.connection import engine

def drop_columns():
    stmts = [
        "ALTER TABLE users DROP COLUMN IF EXISTS login_id;",
        "ALTER TABLE users DROP COLUMN IF EXISTS password_plain;"
    ]
    with engine.begin() as conn:
        for stmt in stmts:
            print(f"Executing: {stmt}")
            conn.execute(text(stmt))
    print("Migration complete: columns dropped.")

if __name__ == "__main__":
    drop_columns()
