from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from models.user import UserRole


class UserPublic(BaseModel):
    id: int
    login_id: Optional[str] = None
    email: str
    full_name: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True
        use_enum_values = True


class UserRegisterIn(BaseModel):
    """Sign-up: email + full name; password_plain is auto-set as firstname@lastname."""

    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=200)


class UserRegisteredOut(BaseModel):
    id: int
    login_id: Optional[str] = None
    email: str
    full_name: str
    role: str
    is_active: bool
    generated_password: str

    class Config:
        from_attributes = True
        use_enum_values = True


class UserUpdate(BaseModel):
    login_id: Optional[str] = Field(None, min_length=2, max_length=64)
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    role: Optional[UserRole] = None


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None
