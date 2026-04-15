from datetime import datetime, timedelta, timezone
from jose import jwt
from passlib.context import CryptContext
from core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    if not plain_password or not hashed_password:
        return False
    return pwd_context.verify(plain_password, hashed_password)


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
