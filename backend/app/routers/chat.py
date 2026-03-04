from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models, schemas
from ..security.auth import get_current_user
from ..services.conversation_service import ConversationService


router = APIRouter(prefix="/chat", tags=["chat"])


@router.post("/query", response_model=schemas.ChatQueryResponse)
def chat_query(
    payload: schemas.ChatQueryRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> schemas.ChatQueryResponse:
    service = ConversationService(db=db, user=current_user)
    return service.handle_query(payload)

