from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, TypeDecorator
from sqlalchemy.orm import relationship
import enum
from db.connection import Base

class UserRole(enum.Enum):
    ADMIN = "admin"
    SALES_AGENT = "sales_agent"
    MANAGER = "manager"

class UserRoleColumn(TypeDecorator):
    impl = String(32)
    cache_ok = True
    def process_bind_param(self, value, dialect):
        if value is None: return None
        if isinstance(value, UserRole): return value.value
        return str(value).strip().lower()

    def process_result_value(self, value, dialect):
        if value is None: return None
        if isinstance(value, UserRole): return value
        s = str(value).strip()
        legacy = {"ADMIN": UserRole.ADMIN, "SALES_AGENT": UserRole.SALES_AGENT, "MANAGER": UserRole.MANAGER}
        if s in legacy: return legacy[s]
        try: return UserRole(s.lower())
        except ValueError: raise ValueError(f"Unknown user role: {value!r}")

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    login_id = Column(String(64), unique=True, index=True, nullable=True)
    full_name = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=True)
    password_plain = Column(String(255), nullable=True)
    phone = Column(String(64), nullable=True)
    avatar_url = Column(String(1024), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=True)
    role = Column(UserRoleColumn(), default=UserRole.SALES_AGENT)
    is_active = Column(Boolean, default=True)

    leads = relationship("Lead", back_populates="assignee")
    followups = relationship("FollowUp", back_populates="user")
    activities = relationship("Activity", back_populates="user")
