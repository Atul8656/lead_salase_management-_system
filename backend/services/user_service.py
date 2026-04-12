import re
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
from models.user import User, UserRole
from core.security import create_access_token as _jwt_token


def create_access_token(data: dict, expires_delta=None):
    return _jwt_token(data, expires_delta)


def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_email(db: Session, email: str):
    em = email.strip().lower()
    return (
        db.query(User).filter(func.lower(User.email) == em).first()
    )


def get_user_by_login_id(db: Session, login_id: str):
    if not login_id:
        return None
    lid = login_id.strip()
    return (
        db.query(User)
        .filter(func.lower(User.login_id) == func.lower(lid))
        .first()
    )


def get_user_by_email_or_login(db: Session, username: str):
    u = username.strip()
    if "@" in u:
        return get_user_by_email(db, u)
    return get_user_by_login_id(db, u)


def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(User).offset(skip).limit(limit).all()


def get_active_users(db: Session, skip: int = 0, limit: int = 500):
    return (
        db.query(User)
        .filter(User.is_active == True)
        .order_by(User.full_name.asc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def default_password_from_full_name(full_name: str) -> str:
    """firstname@lastname (lowercase, letters/digits only); single name -> name@name."""
    parts = full_name.strip().split()
    if not parts:
        return "user@user"

    def norm(part: str) -> str:
        s = re.sub(r"[^a-z0-9]", "", part.lower())
        return s if s else "x"

    first = norm(parts[0])
    last = norm(parts[-1]) if len(parts) > 1 else first
    return f"{first}@{last}"


def register_new_member(db: Session, email: str, full_name: str) -> Tuple[User, str]:
    """Auto login_id crm{id:05d}; password_plain = firstname@lastname from full_name."""
    em = email.strip().lower()
    if get_user_by_email(db, em):
        raise HTTPException(status_code=400, detail="Email already registered")

    plain_pw = default_password_from_full_name(full_name)

    db_user = User(
        login_id=None,
        email=em,
        full_name=full_name.strip(),
        password_plain=plain_pw,
        hashed_password=None,
        role=UserRole.SALES_AGENT,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    db_user.login_id = f"crm{db_user.id:05d}"
    db.commit()
    db.refresh(db_user)

    return db_user, plain_pw


def authenticate_user(db: Session, username: str, password: str) -> Optional[User]:
    user = get_user_by_email_or_login(db, username)
    if not user:
        return None

    pw_in = password.strip() if password else ""

    if user.password_plain and user.password_plain.strip() == pw_in:
        return user

    # Legacy: plain text stored in hashed_password column (no bcrypt)
    hp = user.hashed_password
    if hp and hp.strip() == pw_in:
        return user

    return None


def verify_user_password(user: User, password: str) -> bool:
    pw_in = password.strip() if password else ""
    if user.password_plain and user.password_plain.strip() == pw_in:
        return True
    hp = user.hashed_password
    if hp and hp.strip() == pw_in:
        return True
    return False


def update_current_user(db: Session, user: User, data) -> User:
    from schemas.user_schema import UserMeUpdate

    if not isinstance(data, UserMeUpdate):
        data = UserMeUpdate.model_validate(data)

    if "new_password" in data.model_fields_set and data.new_password:
        if not verify_user_password(user, data.current_password or ""):
            raise HTTPException(
                status_code=400, detail="Current password is incorrect"
            )
        user.password_plain = data.new_password.strip()
        user.hashed_password = None

    if "email" in data.model_fields_set and data.email is not None:
        em = data.email.strip().lower()
        if em != user.email.strip().lower():
            if get_user_by_email(db, em):
                raise HTTPException(status_code=400, detail="Email is already in use")
            user.email = em

    if "full_name" in data.model_fields_set and data.full_name is not None:
        user.full_name = data.full_name.strip()

    db.commit()
    db.refresh(user)
    return user
