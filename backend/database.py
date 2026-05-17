from sqlalchemy import text, inspect

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


def _verify_and_add_missing_columns() -> None:
    """Verify existing tables and add any missing columns defined in the models."""
    try:
        inspector = inspect(engine)
        db_tables = inspector.get_table_names()
        
        with engine.begin() as conn:
            for table_name, table in Base.metadata.tables.items():
                if table_name not in db_tables:
                    continue  # Table doesn't exist yet, create_all will handle it
                
                db_columns = [col['name'] for col in inspector.get_columns(table_name)]
                for column in table.columns:
                    if column.name not in db_columns:
                        try:
                            # Generate ALTER TABLE statement
                            col_type = column.type.compile(dialect=engine.dialect)
                            stmt = f"ALTER TABLE {table_name} ADD COLUMN {column.name} {col_type}"
                            conn.execute(text(stmt))
                            print(f"Auto-added missing column '{column.name}' to table '{table_name}'")
                        except Exception as e:
                            print(f"Error auto-adding column '{column.name}' to '{table_name}': {e}")
    except Exception as e:
        print(f"Error during schema verification: {e}")


def init_db() -> None:
    """Initialize DB objects required by SQLAlchemy models."""
    if engine.dialect.name == "postgresql":
        _ensure_postgres_enums()
    Base.metadata.create_all(bind=engine)
    
    # Auto-add any missing columns
    _verify_and_add_missing_columns()
    
    if engine.dialect.name == "postgresql":
        _fix_lowercase_enums()
