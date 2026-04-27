from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, TypeDecorator
from sqlalchemy.orm import relationship
import enum
from db.connection import Base

class UserRole(enum.Enum):
    ADMIN = "ADMIN"
    SALES_AGENT = "SALES_AGENT"
    MANAGER = "MANAGER"


from sqlalchemy.dialects.postgresql import ENUM as PG_ENUM

class UserRoleColumn(TypeDecorator):
    """Normalize DB userrole (lowercase vs uppercase) for PostgreSQL enums."""

    impl = String(32)
    cache_ok = True

    def bind_expression(self, bindvalue):
        return cast(bindvalue, PG_ENUM(name="userrole", create_type=False))

    def process_bind_param(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, UserRole):
            return value.value.upper()
        return str(value).strip().upper()

    def process_result_value(self, value, dialect):
        if value is None:
            return None
        if isinstance(value, UserRole):
            return value
        s = str(value).strip().upper()
        try:
            return UserRole(s)
        except ValueError:
            # Fallback for common mismatches
            if s == "ADMIN": return UserRole.ADMIN
            if s == "MANAGER": return UserRole.MANAGER
            if s == "SALES_AGENT": return UserRole.SALES_AGENT
            raise ValueError(f"Unknown user role in database: {value!r}")

from sqlalchemy import cast

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=True)
    phone = Column(String(64), nullable=True)
    avatar_url = Column(String(1024), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=True)
    role = Column(UserRoleColumn(), default=UserRole.SALES_AGENT)
    is_active = Column(Boolean, default=True)


    leads = relationship("Lead", back_populates="assignee")
    followups = relationship("FollowUp", back_populates="user")
    activities = relationship("Activity", back_populates="user")
    todos = relationship("Todo", back_populates="user")
