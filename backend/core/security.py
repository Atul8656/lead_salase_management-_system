import bcrypt
from datetime import datetime, timedelta, timezone
from jose import jwt
from core.config import settings


def hash_password(password: str) -> str:
    if not password:
        return ""
    # bcrypt requires bytes
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not plain_password or not hashed_password:
        return False
    try:
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    max_ttl_minutes = 15
    if expires_delta:
        expire = datetime.now(timezone.utc) + min(
            expires_delta, timedelta(minutes=max_ttl_minutes)
        )
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=min(settings.ACCESS_TOKEN_EXPIRE_MINUTES, max_ttl_minutes)
        )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    return encoded_jwt
