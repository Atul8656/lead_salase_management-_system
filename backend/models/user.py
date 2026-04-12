from sqlalchemy import Column, Integer, String, Boolean, Enum
from sqlalchemy.orm import relationship
import enum
from db.connection import Base

class UserRole(enum.Enum):
    ADMIN = "admin"
    SALES_AGENT = "sales_agent"
    MANAGER = "manager"

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
    role = Column(Enum(UserRole), default=UserRole.SALES_AGENT)
    is_active = Column(Boolean, default=True)

    leads = relationship("Lead", back_populates="assignee")
    followups = relationship("FollowUp", back_populates="user")
    activities = relationship("Activity", back_populates="user")
