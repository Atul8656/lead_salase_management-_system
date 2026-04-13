from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, ConfigDict, computed_field, model_validator
from typing import Optional
from models.user import UserRole


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    id: int
    login_id: Optional[str] = None
    email: str
    full_name: str
    role: str
    is_active: bool
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: Optional[datetime] = None

    @computed_field
    @property
    def member_id(self) -> str:
        return f"M{self.id:03d}"


class MemberAdminUpdate(BaseModel):
    """Admin-only updates for a team member profile."""

    full_name: Optional[str] = Field(None, min_length=2, max_length=200)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=64)
    role: Optional[UserRole] = None


class MemberCreateIn(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=120)
    last_name: str = Field(..., min_length=1, max_length=120)
    surname: str = Field("", max_length=120)
    email: EmailStr
    phone: str = Field(..., min_length=5, max_length=40)


class MemberCreatedResponse(UserPublic):
    generated_password: str


class NextMemberIdOut(BaseModel):
    next_member_id: str


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

    model_config = ConfigDict(from_attributes=True, use_enum_values=True)

    @computed_field
    @property
    def member_id(self) -> str:
        return f"M{self.id:03d}"


class UserUpdate(BaseModel):
    login_id: Optional[str] = Field(None, min_length=2, max_length=64)
    email: Optional[EmailStr] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    role: Optional[UserRole] = None


class UserMeUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=200)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=64)
    avatar_url: Optional[str] = Field(None, max_length=1024)
    current_password: Optional[str] = None
    new_password: Optional[str] = Field(None, min_length=8, max_length=128)

    @model_validator(mode="after")
    def password_pair(self):
        if self.new_password and not (self.current_password and self.current_password.strip()):
            raise ValueError("current_password is required when setting new_password")
        return self


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None
