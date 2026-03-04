from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from .models import SenderType, ConversationStatus, WorkflowStatus


class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    display_name: Optional[str] = None
    department: Optional[str] = None
    locale: str = "en"


class UserRead(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserMe(UserRead):
    roles: list[str] = []


class RoleRead(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


class IntentRead(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


class MessageCreate(BaseModel):
    conversation_id: Optional[int] = None
    message_text: str
    language: Optional[str] = Field(default="en", pattern="^[a-z]{2}$")


class MessageRead(BaseModel):
    id: int
    conversation_id: int
    sender_type: SenderType
    message_text: str
    language: str
    created_at: datetime
    nlu_intent_id: Optional[int] = None
    nlu_confidence: Optional[float] = None

    class Config:
        from_attributes = True


class ConversationRead(BaseModel):
    id: int
    user_id: int
    channel: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    status: ConversationStatus
    linked_ticket_id: Optional[int] = None

    class Config:
        from_attributes = True


class ConversationWithMessages(ConversationRead):
    messages: list[MessageRead] = []


class KBArticleBase(BaseModel):
    title: str
    slug: str
    language: str = "en"
    body_markdown: str
    tags: Optional[str] = None
    is_published: bool = False


class KBArticleCreate(KBArticleBase):
    pass


class KBArticleUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    language: Optional[str] = None
    body_markdown: Optional[str] = None
    tags: Optional[str] = None
    is_published: Optional[bool] = None


class KBArticleRead(KBArticleBase):
    id: int
    created_by_user_id: int
    updated_by_user_id: int
    created_at: datetime
    updated_at: datetime
    version: int

    class Config:
        from_attributes = True


class WorkflowRunRead(BaseModel):
    id: int
    workflow_id: int
    conversation_id: int
    initiated_by_user_id: int
    status: WorkflowStatus
    started_at: datetime
    ended_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ChatQueryRequest(BaseModel):
    conversation_id: Optional[int] = None
    message: str
    language_hint: Optional[str] = None


class ChatQueryResponse(BaseModel):
    conversation_id: int
    reply: str
    confidence: float
    intent: Optional[str] = None
    actions: list[str] = []


class SemanticSearchRequest(BaseModel):
    query: str
    language: Optional[str] = None
    limit: int = 5


class SemanticSearchResult(BaseModel):
    article: KBArticleRead
    score: float


class AnalyticsOverview(BaseModel):
    total_conversations: int
    automated_resolution_rate: float
    average_resolution_time_minutes: float
    top_intents: list[dict]


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class LoginRequest(BaseModel):
    email: str
    password: str


class TicketRead(BaseModel):
    id: int
    external_ticket_id: str
    user_id: int
    source: str
    status: str
    priority: Optional[str] = None
    category: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

