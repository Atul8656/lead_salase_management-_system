from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from typing import List, Optional, Literal
from datetime import datetime
from models.lead import LeadStatus, LeadType

LeadPriorityOpt = Optional[Literal["hot", "warm", "cold"]]


def _coerce_priority_value(v):
    if v == "" or v is None:
        return None
    if isinstance(v, str):
        s = v.strip().lower()
        if s in ("hot", "warm", "cold"):
            return s
    return v


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
    description: Optional[str] = None
    notes: Optional[str] = None
    priority: LeadPriorityOpt = None
    payment_amount: float = 0.0
    payment_method: Optional[str] = None
    follow_up_date: Optional[datetime] = None

    @field_validator("priority", mode="before")
    @classmethod
    def normalize_priority_base(cls, v):
        return _coerce_priority_value(v)


class LeadCreate(LeadBase):
    """assigned_to defaults to creator when omitted. Phone is required."""

    phone: str = Field(..., min_length=5, max_length=40)
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
    description: Optional[str] = None
    priority: LeadPriorityOpt = None

    @field_validator("priority", mode="before")
    @classmethod
    def normalize_priority_update(cls, v):
        return _coerce_priority_value(v)

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


class LeadListOut(BaseModel):
    items: List[Lead]
    total: int


class LeadRemarkCreate(BaseModel):
    body: str = Field(..., min_length=1, max_length=20000)


class LeadRemarkOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lead_id: int
    user_id: int
    user_name: Optional[str] = None
    body: str
    created_at: datetime
