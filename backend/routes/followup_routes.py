from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from db.connection import get_db
from schemas import followup_schema
from services import followup_service
from middleware.auth_middleware import get_current_user
from models.user import User

router = APIRouter()

@router.post("", response_model=followup_schema.FollowUp)
@router.post("/", response_model=followup_schema.FollowUp)
def create_followup(followup: followup_schema.FollowUpCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return followup_service.create_followup(db=db, followup=followup, user_id=current_user.id)

@router.get("/my", response_model=List[followup_schema.FollowUp])
def read_my_followups(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return followup_service.get_user_followups(db, user_id=current_user.id)
