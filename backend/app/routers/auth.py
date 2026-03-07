from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models import AccessLog, User, UserRole
from ..schemas import LoginRequest, RegisterRequest, Token, UserCreate, UserRead
from ..security.auth import (
    authenticate_user,
    create_access_token,
    get_current_active_user,
    get_password_hash,
    require_role,
)


router = APIRouter(prefix="/auth", tags=["auth"])


def _log_access(db: Session, request: Request, user: User | None, success: bool) -> None:
    ip = request.client.host if request and request.client else None
    user_agent = request.headers.get("user-agent")
    entry = AccessLog(
        user_id=user.id if user else None,
        email=user.email if user else None,
        ip_address=ip,
        user_agent=user_agent,
        success=success,
    )
    db.add(entry)
    if user and success:
        user.last_login_at = entry.created_at


@router.post("/token", response_model=Token)
def login_for_access_token(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        _log_access(db, request, None, False)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value},
        expires_delta=access_token_expires,
    )
    _log_access(db, request, user, True)
    db.commit()
    return Token(access_token=access_token)


@router.post("/login", response_model=Token)
def login_with_json(request: Request, body: LoginRequest, db: Session = Depends(get_db)):
    user = authenticate_user(db, body.email, body.password)
    if not user:
        _log_access(db, request, None, False)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value},
        expires_delta=access_token_expires,
    )
    _log_access(db, request, user, True)
    db.commit()
    return Token(access_token=access_token)


@router.get("/me", response_model=UserRead)
def read_current_user(current_user: User = Depends(get_current_active_user)):
    return current_user


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register_end_user(body: RegisterRequest, db: Session = Depends(get_db)):
    """Public registration for end users. Creates account with role end_user."""
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=body.email,
        full_name=body.full_name,
        role=UserRole.END_USER,
        is_active=True,
        hashed_password=get_password_hash(body.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/users", response_model=UserRead)
def create_user(
    user_in: UserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.SUPER_ADMIN)),
):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        role=user_in.role,
        is_active=user_in.is_active,
        phone=user_in.phone,
        department=user_in.department,
        hashed_password=get_password_hash(user_in.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

