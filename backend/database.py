from sqlalchemy import text

from db.connection import Base, SessionLocal, engine, get_db


def _ensure_postgres_enums() -> None:
    """Create PostgreSQL enum types used by existing models if missing."""
    stmts = [
        """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leadstatus') THEN
                CREATE TYPE leadstatus AS ENUM (
                    'NEW',
                    'CONTACTED',
                    'INTERESTED',
                    'FOLLOW_UP',
                    'CONVERTED',
                    'NOT_INTERESTED'
                );
            END IF;
        END
        $$;
        """,
        """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'leadtype') THEN
                CREATE TYPE leadtype AS ENUM ('INBOUND', 'OUTBOUND');
            END IF;
        END
        $$;
        """,
        """
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'userrole') THEN
                CREATE TYPE userrole AS ENUM ('ADMIN', 'SALES_AGENT', 'MANAGER');
            END IF;
        END
        $$;
        """,
    ]
    with engine.begin() as conn:
        for stmt in stmts:
            conn.execute(text(stmt))


def _fix_lowercase_enums() -> None:
    """Update any lowercase enum values in the database to uppercase."""
    from db.connection import SessionLocal
    with SessionLocal() as db:
        try:
            # We use raw SQL to update values without triggering SQLAlchemy's enum validation
            # casting role to text to safely compare with lowercase strings
            db.execute(text("UPDATE users SET role = 'ADMIN' WHERE LOWER(role::text) = 'admin'"))
            db.execute(text("UPDATE users SET role = 'MANAGER' WHERE LOWER(role::text) = 'manager'"))
            db.execute(text("UPDATE users SET role = 'SALES_AGENT' WHERE LOWER(role::text) = 'sales_agent'"))
            db.commit()
        except Exception as e:
            print(f"Note: Could not run enum fix (might be expected if table doesn't exist yet): {e}")
            db.rollback()


def init_db() -> None:
    """Initialize DB objects required by SQLAlchemy models."""
    _ensure_postgres_enums()
    Base.metadata.create_all(bind=engine)
    _fix_lowercase_enums()
