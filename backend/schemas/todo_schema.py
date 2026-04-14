from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class TodoBase(BaseModel):
    title: str
    is_completed: bool = False


class TodoCreate(TodoBase):
    pass


class TodoUpdate(BaseModel):
    title: Optional[str] = None
    is_completed: Optional[bool] = None
    is_deleted: Optional[bool] = None


class Todo(TodoBase):
    id: int
    user_id: int
    is_deleted: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
