import sys
import os

# Add the current directory to sys.path to import local modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from db.connection import engine

def fix_db():
    commands = [
        # Add is_deleted to leads
        "ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;",
        "CREATE INDEX IF NOT EXISTS idx_leads_is_deleted ON leads(is_deleted);",
        
        # Create todos table if not exists (including is_deleted etc)
        """
        CREATE TABLE IF NOT EXISTS todos (
            id SERIAL PRIMARY KEY,
            title VARCHAR NOT NULL,
            is_completed BOOLEAN DEFAULT FALSE,
            is_deleted BOOLEAN DEFAULT FALSE,
            user_id INTEGER REFERENCES users(id),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """,
        "CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);",
        "CREATE INDEX IF NOT EXISTS idx_todos_is_deleted ON todos(is_deleted);"
    ]
    
    with engine.connect() as conn:
        for cmd in commands:
            print(f"Executing: {cmd.strip().splitlines()[0]}...")
            try:
                conn.execute(text(cmd))
                conn.commit()
                print("Success.")
            except Exception as e:
                print(f"Error: {e}")

if __name__ == "__main__":
    fix_db()
