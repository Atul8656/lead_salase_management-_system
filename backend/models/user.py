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

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String, nullable=True)
    phone = Column(String(64), nullable=True)
    avatar_url = Column(String(1024), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=True)
    role = Column(
        PG_ENUM(
            UserRole,
            name="userrole",
            create_type=False,
            values_callable=lambda enum_cls: [member.value for member in enum_cls],
        ),
        default=UserRole.SALES_AGENT,
    )
    is_active = Column(Boolean, default=True)


    leads = relationship("Lead", back_populates="assignee")
    followups = relationship("FollowUp", back_populates="user")
    activities = relationship("Activity", back_populates="user")
    todos = relationship("Todo", back_populates="user")
