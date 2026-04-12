from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum, Numeric, Float
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from db.connection import Base

class LeadStatus(enum.Enum):
    NEW = "new"
    CONTACTED = "contacted"
    INTERESTED = "interested"
    FOLLOW_UP = "follow-up"
    CONVERTED = "converted"
    LOST = "lost"

class LeadType(enum.Enum):
    INBOUND = "inbound"
    OUTBOUND = "outbound"

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    email = Column(String, index=True)
    phone = Column(String)
    company_name = Column(String)
    website_url = Column(String)
    linkedin_url = Column(String)
    location = Column(String)
    
    source = Column(String) # e.g., Facebook, Google, Referral
    source_detail = Column(String)
    lead_type = Column(Enum(LeadType), default=LeadType.INBOUND, index=True)
    status = Column(Enum(LeadStatus), default=LeadStatus.NEW, index=True)

    assigned_to = Column(Integer, ForeignKey("users.id"), index=True)
    
    interest = Column(String)
    budget = Column(String)
    timeline = Column(String)
    notes = Column(String)
    
    # Financials for "Converted" status
    payment_amount = Column(Float, default=0.0)
    payment_method = Column(String)
    
    # Dates
    follow_up_date = Column(DateTime)
    last_contacted = Column(DateTime)
    follow_up_count = Column(Integer, default=0)
    converted_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    assignee = relationship("User", back_populates="leads")
    followups = relationship("FollowUp", back_populates="lead")
    activities = relationship("Activity", back_populates="lead")
