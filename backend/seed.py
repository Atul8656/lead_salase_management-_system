from sqlalchemy.orm import Session
from db.connection import SessionLocal
import db.base  # noqa: F401 — register all models with SQLAlchemy
from models.user import User, UserRole
from models.lead import Lead, LeadStatus
from core.security import hash_password


def seed_data():
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == "admin@crm.com").first()
        if not admin:
            print("Seeding admin user...")
            admin = User(
                email="admin@crm.com",
                full_name="System Admin",
                hashed_password=hash_password("admin123"),
                role=UserRole.ADMIN,
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
        else:
            if not admin.hashed_password:
                admin.hashed_password = hash_password("admin123")
            db.commit()

        atul = db.query(User).filter(User.email == "atulbaraiya0@gmail.com").first()
        if not atul:
            print("Seeding Atul's user...")
            atul = User(
                email="atulbaraiya0@gmail.com",
                full_name="Atul Baraiya",
                hashed_password=hash_password("Atul@123"),
                role=UserRole.ADMIN,
            )
            db.add(atul)
            db.commit()

        agent = db.query(User).filter(User.email == "agent@crm.com").first()
        if not agent:
            print("Seeding agent...")
            agent = User(
                email="agent@crm.com",
                full_name="Sales Agent 1",
                hashed_password=hash_password("agent123"),
                role=UserRole.SALES_AGENT,
            )
            db.add(agent)
            db.commit()
        else:
            if not agent.hashed_password:
                agent.hashed_password = hash_password("agent123")
            db.commit()

        admin = db.query(User).filter(User.email == "admin@crm.com").first()

        if db.query(Lead).count() == 0:
            print("Seeding sample leads...")
            leads = [
                Lead(
                    name="John Doe",
                    email="john@example.com",
                    phone="1234567890",
                    company_name="Example Inc",
                    status=LeadStatus.NEW,
                    assigned_to=admin.id,
                ),
                Lead(
                    name="Jane Smith",
                    email="jane@acme.com",
                    phone="0987654321",
                    company_name="Acme Corp",
                    status=LeadStatus.CONTACTED,
                    assigned_to=admin.id,
                ),
            ]
            db.add_all(leads)
            db.commit()

        print("Seeding completed successfully.")
    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error seeding data: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
