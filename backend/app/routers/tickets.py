from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Ticket, TicketPriority, TicketStatus, User, UserRole
from ..schemas import TicketCreate, TicketRead
from ..security.auth import get_current_active_user, require_role


router = APIRouter(prefix="/tickets", tags=["tickets"])


@router.post("/", response_model=TicketRead, status_code=status.HTTP_201_CREATED)
def create_ticket(
    ticket_in: TicketCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    ticket = Ticket(
        title=ticket_in.title,
        description=ticket_in.description,
        priority=ticket_in.priority or TicketPriority.MEDIUM,
        status=TicketStatus.OPEN,
        created_by=current_user.id,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


@router.get("/", response_model=List[TicketRead])
def list_my_tickets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    tickets = db.query(Ticket).filter(Ticket.created_by == current_user.id).order_by(Ticket.created_at.desc()).all()
    return tickets


@router.get("/all", response_model=List[TicketRead])
def list_all_tickets(
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.IT_ADMIN)),
):
    tickets = db.query(Ticket).order_by(Ticket.created_at.desc()).all()
    return tickets


@router.patch("/{ticket_id}/assign", response_model=TicketRead)
def assign_ticket(
    ticket_id: int,
    assignee_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role(UserRole.IT_ADMIN)),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket.assigned_to = assignee_id
    db.commit()
    db.refresh(ticket)
    return ticket


@router.patch("/{ticket_id}/status", response_model=TicketRead)
def update_ticket_status(
    ticket_id: int,
    status_value: TicketStatus,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role(UserRole.IT_ADMIN)),
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket.status = status_value
    db.commit()
    db.refresh(ticket)
    return ticket

