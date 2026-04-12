from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from models.lead import LeadStatus, LeadType

class LeadBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company_name: Optional[str] = None
    website_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    location: Optional[str] = None
    source: Optional[str] = None
    source_detail: Optional[str] = None
    lead_type: LeadType = LeadType.INBOUND
    status: LeadStatus = LeadStatus.NEW
    interest: Optional[str] = None
    budget: Optional[str] = None
    timeline: Optional[str] = None
    notes: Optional[str] = None
    payment_amount: float = 0.0
    payment_method: Optional[str] = None
    follow_up_date: Optional[datetime] = None

class LeadCreate(LeadBase):
    """assigned_to defaults to creator when omitted."""
    assigned_to: Optional[int] = None

class LeadUpdate(BaseModel):
    model_config = {"use_enum_values": True}

    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    company_name: Optional[str] = None
    website_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    location: Optional[str] = None
    source: Optional[str] = None
    source_detail: Optional[str] = None
    lead_type: Optional[LeadType] = None
    status: Optional[LeadStatus] = None
    assigned_to: Optional[int] = None
    interest: Optional[str] = None
    budget: Optional[str] = None
    timeline: Optional[str] = None
    payment_amount: Optional[float] = None
    payment_method: Optional[str] = None
    follow_up_date: Optional[datetime] = None
    last_contacted: Optional[datetime] = None
    notes: Optional[str] = None

class Lead(LeadBase):
    id: int
    assigned_to: Optional[int] = None
    follow_up_count: int
    last_contacted: Optional[datetime] = None
    converted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        use_enum_values = True


class PipelineMove(BaseModel):
    status: LeadStatus
    follow_up_date: Optional[datetime] = None
    payment_amount: Optional[float] = None
    payment_method: Optional[str] = None
