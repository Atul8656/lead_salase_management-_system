from datetime import datetime

from sqlalchemy import Column, Integer, String, Boolean, DateTime, TypeDecorator
from sqlalchemy.orm import relationship
import enum
from db.connection import Base


class UserRole(enum.Enum):
    ADMIN = "admin"
    SALES_AGENT = "sales_agent"
    MANAGER = "manager"


class UserRoleColumn(TypeDecorator):
    """
    Persist lowercase role strings (admin, sales_agent, manager). Accepts any casing
    or legacy PostgreSQL enum labels (ADMIN, SALES_AGENT) on read so sign-in works
    across DBs that store roles differently.
    """

    impl = String(32)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, UserRole):
            return value.value
        s = str(value).strip().lower()
        return s

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, UserRole):
            return value
        s = str(value).strip()
        sl = s.lower()
        try:
            return UserRole(sl)
        except ValueError:
            pass
        # Legacy: enum member names stored or returned uppercase
        legacy = {
            "ADMIN": UserRole.ADMIN,
            "SALES_AGENT": UserRole.SALES_AGENT,
            "MANAGER": UserRole.MANAGER,
        }
        if s in legacy:
            return legacy[s]
        raise ValueError(f"Unknown user role in database: {value!r}")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    login_id = Column(String(64), unique=True, index=True, nullable=True)
    full_name = Column(String)
    email = Column(String, unique=True, index=True)
    # Legacy plain text only (optional); prefer password_plain
    hashed_password = Column(String, nullable=True)
    # Plain text login password (trimmed match on sign-in).
    password_plain = Column(String(255), nullable=True)
    phone = Column(String(64), nullable=True)
    avatar_url = Column(String(1024), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=True)
    role = Column(UserRoleColumn(), default=UserRole.SALES_AGENT)
    is_active = Column(Boolean, default=True)

    leads = relationship("Lead", back_populates="assignee")
    followups = relationship("FollowUp", back_populates="user")
    activities = relationship("Activity", back_populates="user")
