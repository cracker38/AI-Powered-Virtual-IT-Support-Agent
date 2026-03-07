from sqlalchemy.orm import Session

from ..models import User, UserRole
from ..security.auth import get_password_hash


DEFAULT_SUPER_ADMIN_EMAIL = "ange@gmail.com"
DEFAULT_SUPER_ADMIN_PASSWORD = "Ange@123"


def ensure_default_super_admin(db: Session) -> None:
    existing = db.query(User).filter(User.email == DEFAULT_SUPER_ADMIN_EMAIL).first()
    if existing:
        return

    super_admin = User(
        email=DEFAULT_SUPER_ADMIN_EMAIL,
        full_name="Default Super Admin",
        role=UserRole.SUPER_ADMIN,
        is_active=True,
        hashed_password=get_password_hash(DEFAULT_SUPER_ADMIN_PASSWORD),
    )
    db.add(super_admin)
    db.commit()

