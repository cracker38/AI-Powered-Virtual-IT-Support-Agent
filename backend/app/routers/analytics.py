from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import KnowledgeBaseArticle, Ticket, TicketStatus, User, UserRole
from ..security.auth import require_role


router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/overview")
def get_overview(
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.MANAGER)),
):
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_tickets = db.query(func.count(Ticket.id)).scalar() or 0
    open_tickets = (
        db.query(func.count(Ticket.id)).filter(Ticket.status == TicketStatus.OPEN).scalar() or 0
    )
    kb_articles = db.query(func.count(KnowledgeBaseArticle.id)).scalar() or 0

    return {
        "total_users": total_users,
        "total_tickets": total_tickets,
        "open_tickets": open_tickets,
        "kb_articles": kb_articles,
    }

