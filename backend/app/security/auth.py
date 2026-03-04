from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from ..config import get_settings
from ..database import get_db
from .. import models


bearer_scheme = HTTPBearer(auto_error=False)


class AuthError(HTTPException):
    def __init__(self, detail: str = "Not authenticated") -> None:
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


def _decode_token(token: str) -> dict:
    """
    Decode a JWT.

    In production you will validate against your IdP JWKS instead of a local secret.
    """
    settings = get_settings()
    # For now we accept HS256 with a local secret; replace with JWKS/OIDC.
    secret = settings.auth_secret_key
    try:
        payload = jwt.decode(token, secret, algorithms=["HS256"], options={"verify_aud": False})
    except JWTError as exc:  # pragma: no cover - simple passthrough
        raise AuthError("Invalid authentication token") from exc

    exp = payload.get("exp")
    if exp is not None and datetime.fromtimestamp(exp, tz=timezone.utc) < datetime.now(tz=timezone.utc):
        raise AuthError("Token has expired")

    return payload


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: Session = Depends(get_db),
) -> models.User:
    """
    Resolve the current user from a JWT or fall back to a demo user in development.
    """
    if credentials is None:
        # Development fallback: single demo user to avoid blocking local testing.
        demo = db.query(models.User).filter(models.User.username == "demo.user").first()
        if not demo:
            demo = models.User(username="demo.user", email="demo@example.com")
            db.add(demo)
            db.commit()
            db.refresh(demo)
        return demo

    payload = _decode_token(credentials.credentials)
    username: str | None = payload.get("preferred_username") or payload.get("sub")
    email: str | None = payload.get("email")
    display_name: str | None = payload.get("name")

    if not username:
        raise AuthError("Token missing username")

    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        user = models.User(
            username=username,
            email=email,
            display_name=display_name,
            locale="en",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    return user

