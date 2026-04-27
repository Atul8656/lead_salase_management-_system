import sys
import os
sys.path.append(os.getcwd())
from db.connection import engine
from sqlalchemy import text

print("Testing database connection...")
try:
    with engine.connect() as conn:
        res = conn.execute(text("SELECT 1"))
        print("Success:", res.fetchone())
except Exception as e:
    print("Error:", e)
