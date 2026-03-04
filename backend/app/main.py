from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .database import Base, engine
from .routers import chat, kb, analytics, workflows, auth, tickets


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(title=settings.app_name, version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.on_event("startup")
    def on_startup() -> None:
        # Ensure all tables exist in the configured database
        Base.metadata.create_all(bind=engine)

    @app.get("/health", tags=["system"])
    async def health_check() -> dict:
        return {"status": "ok"}

    app.include_router(auth.router)
    app.include_router(chat.router)
    app.include_router(kb.router)
    app.include_router(analytics.router)
    app.include_router(workflows.router)
    app.include_router(tickets.router)

    return app


app = create_app()

