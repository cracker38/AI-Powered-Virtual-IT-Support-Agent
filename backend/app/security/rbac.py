from __future__ import annotations

from functools import wraps
from typing import Callable, Iterable, Annotated

from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from .. import models
from .auth import get_current_user


def _user_permissions(user: models.User, db: Session) -> set[str]:
    # Very simple permission model: join roles → permissions
    perms: set[str] = set()
    # If permissions were implemented as a separate table, you would query that here.
    # For now, map role names to implied permissions.
    for role in user.roles:
        if role.name == "ADMIN":
            perms.update({"KB_EDIT", "VIEW_ANALYTICS", "RUN_WORKFLOWS"})
        if role.name == "IT_AGENT":
            perms.update({"KB_EDIT", "VIEW_ANALYTICS"})
    if not perms:
        perms.add("KB_VIEW")
    return perms


def require_permissions(required: Iterable[str]) -> Callable:
    """
    Dependency generator enforcing that current user has all required permissions.
    """

    required_set = set(required)

    def dependency(
        db: Annotated[Session, Depends(get_db)],
        user: Annotated[models.User, Depends(get_current_user)],
    ) -> models.User:
        user_perms = _user_permissions(user, db)
        if not required_set.issubset(user_perms):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return user

    return dependency

