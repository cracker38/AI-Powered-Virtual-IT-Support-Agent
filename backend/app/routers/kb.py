from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import KnowledgeBaseArticle, User, UserRole
from ..schemas import KnowledgeBaseArticleCreate, KnowledgeBaseArticleRead
from ..security.auth import get_current_active_user, require_role


router = APIRouter(prefix="/kb", tags=["knowledge-base"])


@router.get("/public", response_model=List[KnowledgeBaseArticleRead])
def list_public_articles(
    db: Session = Depends(get_db),
    q: str | None = Query(default=None),
    limit: int = Query(default=10, le=20),
):
    """Guest access: view-only, limited published articles. No auth required."""
    query = db.query(KnowledgeBaseArticle).filter(KnowledgeBaseArticle.is_published.is_(True))
    if q:
        like = f"%{q}%"
        query = query.filter(
            (KnowledgeBaseArticle.title.ilike(like)) | (KnowledgeBaseArticle.content.ilike(like))
        )
    return query.order_by(KnowledgeBaseArticle.created_at.desc()).limit(limit).all()


@router.post("/", response_model=KnowledgeBaseArticleRead, status_code=status.HTTP_201_CREATED)
def create_article(
    article_in: KnowledgeBaseArticleCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(require_role(UserRole.IT_ADMIN)),
):
    article = KnowledgeBaseArticle(
        title=article_in.title,
        content=article_in.content,
        category=article_in.category,
        tags=article_in.tags,
        is_published=article_in.is_published,
        created_by=current_admin.id,
    )
    db.add(article)
    db.commit()
    db.refresh(article)
    return article


@router.get("/", response_model=List[KnowledgeBaseArticleRead])
def list_articles(
    db: Session = Depends(get_db),
    q: str | None = Query(default=None, description="Search query for title/content"),
    include_unpublished: bool = False,
    current_user: User = Depends(get_current_active_user),
):
    if include_unpublished and current_user.role not in (UserRole.IT_ADMIN, UserRole.SUPER_ADMIN):
        include_unpublished = False
    query = db.query(KnowledgeBaseArticle)
    if not include_unpublished:
        query = query.filter(KnowledgeBaseArticle.is_published.is_(True))

    if q:
        like_pattern = f"%{q}%"
        query = query.filter(
            (KnowledgeBaseArticle.title.ilike(like_pattern))
            | (KnowledgeBaseArticle.content.ilike(like_pattern))
        )

    return query.order_by(KnowledgeBaseArticle.created_at.desc()).all()


@router.get("/{article_id}", response_model=KnowledgeBaseArticleRead)
def get_article(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    article = db.query(KnowledgeBaseArticle).filter(KnowledgeBaseArticle.id == article_id).first()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    if not article.is_published and current_user.role not in (UserRole.IT_ADMIN, UserRole.SUPER_ADMIN):
        raise HTTPException(status_code=403, detail="Not allowed to view this article")
    return article

