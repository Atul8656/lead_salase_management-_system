from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict
from typing import List, Optional, Literal
from datetime import datetime
from models.lead import LeadStatus, LeadType

LeadPriorityOpt = Optional[Literal["HOT", "WARM", "COLD"]]


def _coerce_priority_value(v):
    if v == "" or v is None:
        return None
    if isinstance(v, str):
        s = v.strip().upper()
        if s in ("HOT", "WARM", "COLD"):
            return s
        # Fallback for lowercase/mixed casing if needed
        sl = s.lower()
        if sl == "hot": return "HOT"
        if sl == "warm": return "WARM"
        if sl == "cold": return "COLD"
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
    category: Optional[str] = None
    industry: Optional[str] = None
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
    model_config = ConfigDict(
        use_enum_values=True,
        validate_assignment=True,
        arbitrary_types_allowed=True,
        populate_by_name=True
    )

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
    category: Optional[str] = None
    industry: Optional[str] = None

    @field_validator("status", mode="before")
    @classmethod
    def normalize_status(cls, v):
        if v is None or v == "":
            return None
        if isinstance(v, str):
            s = v.strip().lower().replace("_", "-").replace(" ", "-")
            # Handle common variations
            if s == "follow-up" or s == "follow_up":
                return LeadStatus.FOLLOW_UP
            if s in ("lost", "not-interested", "not_interested"):
                return LeadStatus.LOST
            try:
                return LeadStatus(s)
            except ValueError:
                return v # Let pydantic handle it or return as is if valid
        return v

    @field_validator("lead_type", mode="before")
    @classmethod
    def normalize_lead_type(cls, v):
        if v is None or v == "":
            return None
        if isinstance(v, str):
            s = v.strip().lower()
            try:
                return LeadType(s)
            except ValueError:
                return v
        return v

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
    category: Optional[str] = None
    industry: Optional[str] = None
    is_deleted: bool = False

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
    created_at: Optional[datetime] = None


class LeadRemarkOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    lead_id: int
    user_id: int
    user_name: Optional[str] = None
    body: str
    created_at: datetime
