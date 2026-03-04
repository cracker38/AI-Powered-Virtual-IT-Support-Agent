from datetime import timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db


router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/overview", response_model=schemas.AnalyticsOverview)
def get_overview(db: Session = Depends(get_db)) -> schemas.AnalyticsOverview:
    total_conversations = db.query(func.count(models.Conversation.id)).scalar() or 0

    # Placeholder metrics for automated resolution
    automated_resolution_events = (
        db.query(func.count(models.AnalyticsEvent.id))
        .filter(models.AnalyticsEvent.event_type == "INTENT_RESOLVED_AUTOMATED")
        .scalar()
        or 0
    )
    automated_resolution_rate = (
        automated_resolution_events / total_conversations if total_conversations else 0.0
    )

    # Compute average resolution time in Python to avoid DB-specific TIMESTAMPDIFF quirks
    avg_resolution_time_minutes = 0.0
    ended_conversations = (
        db.query(models.Conversation.started_at, models.Conversation.ended_at)
        .filter(models.Conversation.ended_at.isnot(None))
        .all()
    )
    if ended_conversations:
        total_minutes = 0.0
        for started_at, ended_at in ended_conversations:
            delta: timedelta = ended_at - started_at
            total_minutes += delta.total_seconds() / 60.0
        avg_resolution_time_minutes = total_minutes / len(ended_conversations)

    # Top intents by frequency
    intent_counts = (
        db.query(models.Intent.name, func.count(models.Message.id))
        .join(models.Message, models.Message.nlu_intent_id == models.Intent.id)
        .group_by(models.Intent.name)
        .order_by(func.count(models.Message.id).desc())
        .limit(5)
        .all()
    )
    top_intents = [
        {"intent": name, "count": count} for name, count in intent_counts  # type: ignore[misc]
    ]

    return schemas.AnalyticsOverview(
        total_conversations=total_conversations,
        automated_resolution_rate=automated_resolution_rate,
        average_resolution_time_minutes=avg_resolution_time_minutes,
        top_intents=top_intents,
    )

