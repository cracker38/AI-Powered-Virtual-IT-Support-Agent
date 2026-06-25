from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr

from .models import TicketPriority, TicketStatus, UserRole


class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    role: UserRole = UserRole.END_USER
    is_active: bool = True
    phone: Optional[str] = None
    department: Optional[str] = None


class UserCreate(UserBase):
    password: str


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    is_active: Optional[bool] = None


class UserRoleUpdate(BaseModel):
    role: UserRole


class UserRead(UserBase):
    id: int
    last_login_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[UserRole] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: Optional[str] = None


class TicketBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: TicketPriority = TicketPriority.MEDIUM


class TicketCreate(TicketBase):
    pass


class TicketRead(TicketBase):
    id: int
    status: TicketStatus
    created_by: int
    assigned_to: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class KnowledgeBaseArticleBase(BaseModel):
    title: str
    content: str
    category: Optional[str] = None
    tags: Optional[str] = None
    is_published: bool = True


class KnowledgeBaseArticleCreate(KnowledgeBaseArticleBase):
    pass


class KnowledgeBaseArticleRead(KnowledgeBaseArticleBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AccessLogRead(BaseModel):
    id: int
    user_id: Optional[int] = None
    email: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    success: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AuditLogRead(BaseModel):
    id: int
    action: str
    actor_id: Optional[int] = None
    target_user_id: Optional[int] = None
    ip_address: Optional[str] = None
    details: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ApiKeyCreate(BaseModel):
    name: str
    scopes: Optional[List[str]] = None


class ApiKeyRead(BaseModel):
    id: int
    name: str
    is_active: bool
    scopes: Optional[str] = None
    last_used_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

