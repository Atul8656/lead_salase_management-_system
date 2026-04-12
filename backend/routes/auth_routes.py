from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from db.connection import get_db
from services import user_service
from schemas.user_schema import Token, UserRegisterIn, UserRegisteredOut
from datetime import timedelta
from core.config import settings

router = APIRouter()


@router.post("/register", response_model=UserRegisteredOut)
def register(user: UserRegisterIn, db: Session = Depends(get_db)):
    db_user, plain_pw = user_service.register_new_member(
        db,
        email=user.email,
        full_name=user.full_name,
    )
    return UserRegisteredOut(
        id=db_user.id,
        login_id=db_user.login_id,
        email=db_user.email,
        full_name=db_user.full_name,
        role=db_user.role.value,
        is_active=db_user.is_active,
        generated_password=plain_pw,
    )


@router.post("/login", response_model=Token)
def login(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
):
    u = user_service.authenticate_user(db, form_data.username, form_data.password)
    if not u:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = user_service.create_access_token(
        data={"sub": u.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}
