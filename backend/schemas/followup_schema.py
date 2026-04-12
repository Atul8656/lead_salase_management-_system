from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class FollowUpBase(BaseModel):
    lead_id: int
    scheduled_at: datetime
    notes: Optional[str] = None

class FollowUpCreate(FollowUpBase):
    pass

class FollowUpUpdate(BaseModel):
    scheduled_at: Optional[datetime] = None
    notes: Optional[str] = None
    is_completed: Optional[bool] = None

class FollowUp(FollowUpBase):
    id: int
    user_id: int
    is_completed: bool
    created_at: datetime

    class Config:
        from_attributes = True
