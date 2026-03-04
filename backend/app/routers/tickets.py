from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..security.rbac import require_permissions


router = APIRouter(prefix="/tickets", tags=["tickets"])


@router.get("/", response_model=list[schemas.TicketRead])
def list_tickets(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_permissions(["VIEW_ANALYTICS"])),
) -> list[schemas.TicketRead]:
    """
    Return a simple list of tickets created by the virtual assistant.

    For this academic project, we treat \"tickets\" as local records that can
    optionally be synchronised with an external ITSM in the future.
    """
    q = db.query(models.Ticket).order_by(models.Ticket.created_at.desc())
    items = q.limit(100).all()
    return [schemas.TicketRead.model_validate(t) for t in items]

