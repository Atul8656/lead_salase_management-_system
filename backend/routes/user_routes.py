from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from db.connection import get_db
from schemas import user_schema
from services import user_service
from middleware.auth_middleware import get_current_user
from models.user import User, UserRole

router = APIRouter()

@router.get("/me", response_model=user_schema.UserPublic)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/me", response_model=user_schema.UserPublic)
def patch_users_me(
    body: user_schema.UserMeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return user_service.update_current_user(db, current_user, body)

@router.get("/assignees", response_model=List[user_schema.UserPublic])
def list_assignees(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """All active users for lead assignment dropdowns."""
    return user_service.get_active_users(db)


@router.get("", response_model=List[user_schema.UserPublic])
@router.get("/", response_model=List[user_schema.UserPublic])
def read_users(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to view all users")
    return user_service.get_users(db, skip=skip, limit=limit)
