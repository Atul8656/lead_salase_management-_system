from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ActivityRead(BaseModel):
    id: int
    lead_id: int
    user_id: int
    user_name: Optional[str] = None
    action: str
    details: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
