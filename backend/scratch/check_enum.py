import sys
import os
sys.path.append(os.getcwd())
from db.connection import engine
from sqlalchemy import text

with engine.connect() as conn:
    print("UserRole Enum labels:")
    res = conn.execute(text("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'userrole'"))
    print(res.fetchall())

    print("\nUsers and roles:")
    res = conn.execute(text("SELECT email, role FROM users"))
    print(res.fetchall())
