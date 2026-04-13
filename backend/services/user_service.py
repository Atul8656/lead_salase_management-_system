import re
from typing import Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
from models.user import User, UserRole
from core.security import create_access_token as _jwt_token
from schemas.user_schema import MemberAdminUpdate, MemberCreateIn, UserMeUpdate


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


def peek_next_member_code(db: Session) -> str:
    m = db.query(func.max(User.id)).scalar()
    n = (m or 0) + 1
    return f"M{n:03d}"


def create_team_member(db: Session, body: MemberCreateIn) -> Tuple[User, str]:
    """Admin-created sales member; login_id set to M{id:03d}; password auto from name."""
    fn = body.first_name.strip()
    ln = body.last_name.strip()
    sn = (body.surname or "").strip()
    full_name = " ".join(p for p in (fn, ln, sn) if p)
    if not full_name:
        raise HTTPException(status_code=400, detail="Enter first and last name")

    em = body.email.strip().lower()
    if get_user_by_email(db, em):
        raise HTTPException(status_code=400, detail="Email already registered")

    plain_pw = default_password_from_full_name(full_name)
    db_user = User(
        login_id=None,
        email=em,
        full_name=full_name,
        phone=body.phone.strip(),
        password_plain=plain_pw,
        hashed_password=None,
        role=UserRole.SALES_AGENT,
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    db_user.login_id = f"M{db_user.id:03d}"
    db.commit()
    db.refresh(db_user)

    return db_user, plain_pw


def register_new_member(db: Session, email: str, full_name: str) -> Tuple[User, str]:
    """Public sign-up: member login_id M{id:03d}; password_plain = firstname@lastname."""
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

    db_user.login_id = f"M{db_user.id:03d}"
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


def update_member_admin(db: Session, user_id: int, data: MemberAdminUpdate) -> User:
    u = get_user(db, user_id)
    if u is None:
        raise HTTPException(status_code=404, detail="User not found")

    if "full_name" in data.model_fields_set and data.full_name is not None:
        u.full_name = data.full_name.strip()

    if "email" in data.model_fields_set and data.email is not None:
        em = data.email.strip().lower()
        if em != u.email.strip().lower():
            if get_user_by_email(db, em):
                raise HTTPException(status_code=400, detail="Email is already in use")
            u.email = em

    if "phone" in data.model_fields_set:
        if data.phone is None or not str(data.phone).strip():
            u.phone = None
        else:
            u.phone = str(data.phone).strip()

    if "role" in data.model_fields_set and data.role is not None:
        u.role = data.role

    db.commit()
    db.refresh(u)
    return u


def update_current_user(db: Session, user: User, data: UserMeUpdate) -> User:
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

    if "phone" in data.model_fields_set:
        if data.phone is None or not str(data.phone).strip():
            user.phone = None
        else:
            user.phone = str(data.phone).strip()

    if "avatar_url" in data.model_fields_set:
        v = data.avatar_url
        if v is None or (isinstance(v, str) and not v.strip()):
            user.avatar_url = None
        else:
            user.avatar_url = str(v).strip()

    db.commit()
    db.refresh(user)
    return user
