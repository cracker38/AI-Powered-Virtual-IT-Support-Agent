from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import AccessLog, ApiKey, AuditLog, User, UserRole
from ..schemas import (
    AccessLogRead,
    ApiKeyCreate,
    ApiKeyRead,
    AuditLogRead,
    UserRead,
    UserRoleUpdate,
    UserUpdate,
)
from ..security.auth import get_current_active_user, require_role
from ..services.security_utils import create_api_key, hash_api_key


router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=List[UserRead])
def list_users(
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    role: Optional[UserRole] = Query(default=None),
    q: Optional[str] = Query(default=None, description="Search by email or name"),
):
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    if q:
        like = f"%{q}%"
        query = query.filter((User.email.ilike(like)) | (User.full_name.ilike(like)))
    return query.order_by(User.created_at.desc()).all()


@router.patch("/me", response_model=UserRead)
def update_my_profile(
    update: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.patch("/{user_id}", response_model=UserRead)
def update_user_profile(
    user_id: int,
    update: UserUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.IT_ADMIN)),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for field, value in update.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}/role", response_model=UserRead)
def update_user_role(
    user_id: int,
    body: UserRoleUpdate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role(UserRole.SUPER_ADMIN)),
    request: Request = None,
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    old_role = user.role.value
    user.role = body.role
    db.add(
        AuditLog(
            action="update_role",
            actor_id=current_admin.id,
            target_user_id=user.id,
            ip_address=request.client.host if request and request.client else None,
            details=f"{old_role} -> {body.role.value}",
        )
    )
    db.commit()
    db.refresh(user)
    return user


@router.get("/access-logs", response_model=List[AccessLogRead])
def get_access_logs(
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.MANAGER)),
    user_id: Optional[int] = None,
    limit: int = 100,
):
    query = db.query(AccessLog)
    if user_id:
        query = query.filter(AccessLog.user_id == user_id)
    return query.order_by(AccessLog.created_at.desc()).limit(limit).all()


@router.get("/audit-logs", response_model=List[AuditLogRead])
def get_audit_logs(
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.MANAGER)),
    limit: int = 100,
):
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()


@router.post("/import", response_model=List[UserRead])
def import_users(
    users: List[UserUpdate],
    db: Session = Depends(get_db),
    _: User = Depends(require_role(UserRole.SUPER_ADMIN)),
):
    # Simple bulk upsert by email (without passwords, for directory sync stubs)
    created_or_updated: list[User] = []
    for item in users:
        # Only email is mandatory at this layer; assume already validated upstream.
        if not getattr(item, "email", None):
            continue
        existing = db.query(User).filter(User.email == item.email).first()
        if existing:
            for field, value in item.model_dump(exclude_unset=True).items():
                if field == "email":
                    continue
                setattr(existing, field, value)
            created_or_updated.append(existing)
        else:
            new_user = User(
                email=item.email,  # type: ignore[arg-type]
                full_name=item.full_name,
                department=item.department,
                phone=item.phone,
                is_active=item.is_active if item.is_active is not None else True,
            )
            db.add(new_user)
            created_or_updated.append(new_user)
    db.commit()
    for u in created_or_updated:
        db.refresh(u)
    return created_or_updated


@router.get("/permissions-matrix")
def get_permissions_matrix():
    return {
        "end_user": {
            "can_chat": True,
            "can_view_kb": True,
            "can_view_analytics": False,
            "can_manage_users": False,
            "can_manage_kb": False,
        },
        "it_admin": {
            "can_chat": True,
            "can_view_kb": True,
            "can_view_analytics": True,
            "can_manage_users": False,
            "can_manage_kb": True,
        },
        "manager": {
            "can_chat": True,
            "can_view_kb": True,
            "can_view_analytics": True,
            "can_manage_users": False,
            "can_manage_kb": False,
        },
        "super_admin": {
            "can_chat": True,
            "can_view_kb": True,
            "can_view_analytics": True,
            "can_manage_users": True,
            "can_manage_kb": True,
            "can_manage_integrations": True,
        },
    }


@router.post("/api-keys", response_model=ApiKeyRead)
def create_api_key_for_current_user(
    body: ApiKeyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.IT_ADMIN)),
):
    scopes_str = ",".join(body.scopes) if body.scopes else None
    plaintext_key, key_hash = create_api_key()
    api_key = ApiKey(
        name=body.name,
        key_hash=key_hash,
        owner_id=current_user.id,
        scopes=scopes_str,
    )
    db.add(api_key)
    db.commit()
    db.refresh(api_key)
    # Attach plaintext key only in response (not stored)
    api_key_dict = ApiKeyRead.model_validate(api_key).model_dump()
    api_key_dict["plaintext"] = plaintext_key
    return api_key_dict  # type: ignore[return-value]


@router.get("/api-keys", response_model=List[ApiKeyRead])
def list_my_api_keys(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.IT_ADMIN)),
):
    keys = (
        db.query(ApiKey)
        .filter(ApiKey.owner_id == current_user.id, ApiKey.is_active.is_(True))
        .order_by(ApiKey.created_at.desc())
        .all()
    )
    return keys


@router.delete("/api-keys/{api_key_id}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_api_key(
    api_key_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.IT_ADMIN)),
):
    api_key = (
        db.query(ApiKey)
        .filter(ApiKey.id == api_key_id, ApiKey.owner_id == current_user.id)
        .first()
    )
    if not api_key:
        raise HTTPException(status_code=404, detail="API key not found")
    api_key.is_active = False
    db.commit()

