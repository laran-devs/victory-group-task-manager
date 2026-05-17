from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from app.models.user import UserRole

class UserBase(BaseModel):
    email: str
    full_name: str
    role: UserRole = UserRole.USER
    position: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    position: Optional[str] = None
    password: Optional[str] = None

class UserInDBBase(UserBase):
    id: UUID

    model_config = ConfigDict(from_attributes=True)

class User(UserInDBBase):
    pass

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class LoginRequest(BaseModel):
    email: str
    password: str
