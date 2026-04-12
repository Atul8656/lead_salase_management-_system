from db.connection import engine, Base
from db.base import User, Lead, FollowUp, Activity # Import all models to register them

def init_db():
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")

if __name__ == "__main__":
    init_db()
