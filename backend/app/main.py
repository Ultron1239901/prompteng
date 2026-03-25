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


def create_app(*, api_prefix: str = "/api") -> FastAPI:
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

    app.include_router(api_router, prefix=api_prefix)

    @app.get("/")
    def root() -> dict[str, str]:
        docs_path = "/docs" if not api_prefix else f"{api_prefix}/docs"
        return {"name": "PromptLab AI API", "docs": docs_path}

    return app


app = create_app()
