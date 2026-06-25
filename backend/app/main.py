from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

from .database import Base, SessionLocal, engine
from .routers import analytics, auth, chat, kb, tickets, users
from .services.bootstrap import ensure_default_super_admin

FAVICON_SVG = b"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
<rect width="32" height="32" rx="6" fill="#1e3a5f"/>
<path fill="#60a5fa" d="M8 10h16v2H8zm0 5h12v2H8zm0 5h10v2H8z"/>
<circle cx="24" cy="20" r="4" fill="#22c55e"/>
</svg>"""


def create_app() -> FastAPI:
    app = FastAPI(title="AI-Powered Virtual IT Support Agent")

    # CORS for local frontend dev (explicit Authorization so cross-origin Bearer token is sent)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "Accept"],
        expose_headers=[],
    )

    # Routers
    app.include_router(auth.router)
    app.include_router(chat.router)
    app.include_router(tickets.router)
    app.include_router(kb.router)
    app.include_router(analytics.router)
    app.include_router(users.router)

    @app.get("/health")
    def health_check():
        return {"status": "ok"}

    @app.get("/favicon.ico", include_in_schema=False)
    def favicon():
        return Response(content=FAVICON_SVG, media_type="image/svg+xml")

    return app


app = create_app()


@app.on_event("startup")
def on_startup() -> None:
    # Create tables
    Base.metadata.create_all(bind=engine)

    # Bootstrap default super admin
    db = SessionLocal()
    try:
        ensure_default_super_admin(db)
    finally:
        db.close()

