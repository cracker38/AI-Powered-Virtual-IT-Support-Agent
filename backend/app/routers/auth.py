from __future__ import annotations

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from jose import jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from .. import models, schemas
from ..config import get_settings
from ..database import get_db
from ..security.auth import get_current_user


router = APIRouter(prefix="/auth", tags=["auth"])

# Use sha256_crypt to avoid local bcrypt backend issues on Windows.
pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")


def _verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def _hash_password(password: str) -> str:
    return pwd_context.hash(password)


def _create_access_token(subject: str, email: str | None = None, expires_minutes: int = 60) -> str:
    settings = get_settings()
    now = datetime.now(tz=timezone.utc)
    payload: dict = {
        "sub": subject,
        "email": email,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=expires_minutes)).timestamp()),
    }
    token = jwt.encode(payload, settings.auth_secret_key, algorithm="HS256")
    return token


@router.post("/login", response_model=schemas.TokenResponse)
async def login(
    request: Request,
    db: Session = Depends(get_db),
) -> schemas.TokenResponse:
    """
    Email/password login for local admin access.

    Accepts JSON body { "email": "...", "password": "..." } or a form body.
    """
    email: str | None = None
    password: str | None = None

    content_type = request.headers.get("content-type", "")
    if content_type.startswith("application/json"):
        payload = await request.json()
        email = (payload.get("email") or "").strip()
        password = payload.get("password")
    else:
        form = await request.form()
        email = (form.get("email") or form.get("username") or "").strip()
        password = form.get("password")

    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required",
        )
    user = db.query(models.User).filter(models.User.email == email).first()

    # If user does not exist yet and the default admin credentials are used,
    # auto-seed the admin account (one-time on first successful login).
    if not user and email == "ange@gmail.com" and password == "Ange@123":
        admin_role = db.query(models.Role).filter(models.Role.name == "ADMIN").first()
        if not admin_role:
            admin_role = models.Role(name="ADMIN", description="System administrator")
            db.add(admin_role)
            db.flush()

        user = models.User(
            username="ange",
            email=email,
            display_name="Ange",
            password_hash=_hash_password(password),
            locale="en",
        )
        db.add(user)
        db.flush()
        db.add(models.UserRole(user_id=user.id, role_id=admin_role.id))
        db.commit()
        db.refresh(user)

    if not user or not user.password_hash or not _verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = _create_access_token(subject=user.username, email=user.email)

    return schemas.TokenResponse(access_token=access_token, token_type="bearer")


@router.post("/seed-admin", response_model=schemas.UserRead)
def seed_admin(
    db: Session = Depends(get_db),
) -> schemas.UserRead:
    """
    One-time seeding of the default admin: ange@gmail.com / Ange@123.

    Only creates the admin if it doesn't already exist.
    """
    email = "ange@gmail.com"
    username = "ange"
    existing = db.query(models.User).filter(models.User.email == email).first()
    if existing:
        return schemas.UserRead.model_validate(existing)

    admin_role = db.query(models.Role).filter(models.Role.name == "ADMIN").first()
    if not admin_role:
        admin_role = models.Role(name="ADMIN", description="System administrator")
        db.add(admin_role)
        db.flush()

    user = models.User(
        username=username,
        email=email,
        display_name="Ange",
        password_hash=_hash_password("Ange@123"),
        locale="en",
    )
    db.add(user)
    db.flush()

    # link role
    link = models.UserRole(user_id=user.id, role_id=admin_role.id)
    db.add(link)

    db.commit()
    db.refresh(user)

    return schemas.UserRead.model_validate(user)


@router.get("/me", response_model=schemas.UserMe)
def read_me(current_user: models.User = Depends(get_current_user)) -> schemas.UserMe:
    roles = [r.name for r in (current_user.roles or [])]
    data = schemas.UserMe.model_validate(current_user)
    data.roles = roles
    return data

