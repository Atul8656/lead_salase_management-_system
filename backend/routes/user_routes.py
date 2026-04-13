from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from db.connection import get_db
from schemas import user_schema
from services import user_service
from middleware.auth_middleware import get_current_user
from models.user import User, UserRole

router = APIRouter()


def _require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin only")
    return current_user


@router.get("/members/next-id", response_model=user_schema.NextMemberIdOut)
def next_member_id(
    db: Session = Depends(get_db),
    _admin: User = Depends(_require_admin),
):
    return user_schema.NextMemberIdOut(next_member_id=user_service.peek_next_member_code(db))


@router.post("/members", response_model=user_schema.MemberCreatedResponse)
def create_team_member(
    body: user_schema.MemberCreateIn,
    db: Session = Depends(get_db),
    _admin: User = Depends(_require_admin),
):
    u, pw = user_service.create_team_member(db, body)
    pub = user_schema.UserPublic.model_validate(u)
    return user_schema.MemberCreatedResponse(
        **pub.model_dump(),
        generated_password=pw,
    )


@router.get("/members/{user_id}", response_model=user_schema.UserPublic)
def read_team_member(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    u = user_service.get_user(db, user_id)
    if u is None:
        raise HTTPException(status_code=404, detail="User not found")
    return u


@router.patch("/members/{user_id}", response_model=user_schema.UserPublic)
def patch_team_member(
    user_id: int,
    body: user_schema.MemberAdminUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(_require_admin),
):
    return user_service.update_member_admin(db, user_id, body)


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
