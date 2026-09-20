from pydantic import BaseModel, EmailStr, Field
from enum import Enum
from typing import Optional

class UserRoleEnum(str, Enum):
    WORKER = "worker"
    EMPLOYER = "employer"

class UserRegister(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    confirm_password: str
    role: UserRoleEnum

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str
    is_active: bool

    class Config:
        from_attributes = True

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Optional[UserResponse] = None

class SwitchRoleRequest(BaseModel):
    role: UserRoleEnum