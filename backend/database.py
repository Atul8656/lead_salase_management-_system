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
                CREATE TYPE userrole AS ENUM ('admin', 'sales_agent', 'manager');
            END IF;
        END
        $$;
        """,
    ]
    with engine.begin() as conn:
        for stmt in stmts:
            conn.execute(text(stmt))


def init_db() -> None:
    """Initialize DB objects required by SQLAlchemy models."""
    _ensure_postgres_enums()
    Base.metadata.create_all(bind=engine)
