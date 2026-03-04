from __future__ import annotations

from typing import Any, Optional

from sqlalchemy.orm import Session

from .. import models


def log_event(
    db: Session,
    event_type: str,
    *,
    user_id: Optional[int] = None,
    conversation_id: Optional[int] = None,
    metadata: Optional[dict[str, Any]] = None,
) -> models.AnalyticsEvent:
    """
    Persist a simple analytics event.

    This keeps the write-path lightweight so it can be called from
    conversational flows, workflows, or admin actions without a lot
    of boilerplate.
    """
    event = models.AnalyticsEvent(
        user_id=user_id,
        conversation_id=conversation_id,
        event_type=event_type,
        metadata_json=metadata or {},
    )
    db.add(event)
    # The caller is responsible for committing the transaction so event
    # writes can be batched with other changes.
    return event

