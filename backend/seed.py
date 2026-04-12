from sqlalchemy.orm import Session
from db.connection import SessionLocal
import db.base  # noqa: F401 — register all models with SQLAlchemy
from models.user import User, UserRole
from models.lead import Lead, LeadStatus


def seed_data():
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == "admin@crm.com").first()
        if not admin:
            print("Seeding admin user...")
            admin = User(
                login_id="admin",
                email="admin@crm.com",
                full_name="System Admin",
                password_plain="admin123",
                hashed_password=None,
                role=UserRole.ADMIN,
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
        else:
            if not admin.login_id:
                admin.login_id = "admin"
            if not admin.password_plain:
                admin.password_plain = "admin123"
                admin.hashed_password = None
            db.commit()

        agent = db.query(User).filter(User.email == "agent@crm.com").first()
        if not agent:
            print("Seeding agent...")
            agent = User(
                login_id="agent",
                email="agent@crm.com",
                full_name="Sales Agent 1",
                password_plain="agent123",
                hashed_password=None,
                role=UserRole.SALES_AGENT,
            )
            db.add(agent)
            db.commit()
        else:
            if not agent.login_id:
                agent.login_id = "agent"
            if not agent.password_plain:
                agent.password_plain = "agent123"
                agent.hashed_password = None
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
        print(f"Error seeding data: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
