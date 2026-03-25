from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import init_db
from app.routes import api_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    try:
        init_db()
        logger.info("Database initialized")
    except Exception:
        logger.exception("Database initialization failed")
    yield


class StripApiPrefixMiddleware:
    """Normalize Vercel's /api mount so the app can serve the same routes locally and in prod."""

    def __init__(self, app: FastAPI) -> None:
        self.app = app

    async def __call__(self, scope, receive, send):  # type: ignore[no-untyped-def]
        if scope.get("type") == "http":
            path = scope.get("path", "")
            if path == "/api":
                scope = dict(scope)
                scope["path"] = "/"
            elif path.startswith("/api/"):
                scope = dict(scope)
                scope["path"] = path[4:] or "/"
        await self.app(scope, receive, send)


settings = get_settings()

app = FastAPI(
    title="PromptLab AI API",
    description="Backend for PromptLab AI prompt engineering study tool",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(StripApiPrefixMiddleware)
app.include_router(api_router)


@app.get("/")
def root() -> dict[str, str]:
    return {"name": "PromptLab AI API", "docs": "/docs", "health": "/health"}
