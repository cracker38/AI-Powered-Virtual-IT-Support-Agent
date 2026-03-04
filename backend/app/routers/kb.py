from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db


router = APIRouter(prefix="/kb", tags=["knowledge-base"])


def get_current_admin(db: Session = Depends(get_db)) -> models.User:
    # Placeholder; in production, validate role from JWT
    user = db.query(models.User).filter(models.User.username == "admin").first()
    if not user:
        user = models.User(username="admin", email="admin@example.com")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user


@router.get("/articles", response_model=list[schemas.KBArticleRead])
def list_articles(
    query: str | None = None,
    language: str | None = None,
    tag: str | None = None,
    db: Session = Depends(get_db),
) -> list[schemas.KBArticleRead]:
    q = db.query(models.KBArticle)
    if language:
        q = q.filter(models.KBArticle.language == language)
    if tag:
        q = q.filter(models.KBArticle.tags.isnot(None)).filter(models.KBArticle.tags.like(f"%{tag}%"))
    if query:
        like = f"%{query}%"
        q = q.filter(
            or_(
                models.KBArticle.title.like(like),
                models.KBArticle.body_markdown.like(like),
                models.KBArticle.tags.like(like),
            )
        )
    articles = q.order_by(models.KBArticle.updated_at.desc()).all()
    return [schemas.KBArticleRead.model_validate(article) for article in articles]


@router.post("/articles", response_model=schemas.KBArticleRead, status_code=status.HTTP_201_CREATED)
def create_article(
    payload: schemas.KBArticleCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin),
) -> schemas.KBArticleRead:
    article = models.KBArticle(
        title=payload.title,
        slug=payload.slug,
        language=payload.language,
        body_markdown=payload.body_markdown,
        tags=payload.tags,
        is_published=payload.is_published,
        created_by_user_id=current_user.id,
        updated_by_user_id=current_user.id,
    )
    db.add(article)
    db.commit()
    db.refresh(article)
    return schemas.KBArticleRead.model_validate(article)


@router.get("/articles/{article_id}", response_model=schemas.KBArticleRead)
def get_article(
    article_id: int,
    db: Session = Depends(get_db),
) -> schemas.KBArticleRead:
    article = db.query(models.KBArticle).get(article_id)
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
    return schemas.KBArticleRead.model_validate(article)


@router.put("/articles/{article_id}", response_model=schemas.KBArticleRead)
def update_article(
    article_id: int,
    payload: schemas.KBArticleUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin),
) -> schemas.KBArticleRead:
    article = db.query(models.KBArticle).get(article_id)
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(article, field, value)
    article.updated_by_user_id = current_user.id

    db.add(article)
    db.commit()
    db.refresh(article)
    return schemas.KBArticleRead.model_validate(article)


@router.delete("/articles/{article_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_article(
    article_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_admin),  # noqa: ARG001
) -> None:
    article = db.query(models.KBArticle).get(article_id)
    if not article:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Article not found")
    db.delete(article)
    db.commit()

