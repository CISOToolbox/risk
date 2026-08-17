from __future__ import annotations

import logging
import os

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware

from src.database import async_session, engine
from src.models import Base
from src.routes.ai import router as ai_router
from src.routes.analyses import router as analyses_router
from src.routes.auth import router as auth_router
from src.routes.entity_routes import all_entity_routers
from src.routes.directory_proxy import router as directory_router
from src.routes.internal import router as internal_router
from src.routes.users import router as users_router
from src.version_common import version_payload

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("risk-backend")

app = FastAPI(title="EBIOS RM Backend", version="0.1.0")


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"
        return response


app.add_middleware(SecurityHeadersMiddleware)
# Generic write journal (FEAT-30 P1.6): every mutating /api request is
# journaled; routes with richer in-handler entries are excluded.
from src.audit import install_write_journal_middleware
install_write_journal_middleware(app, exclude=[
    # Routes with richer in-handler entries (analysis.blob_put/delete/import
    # + analysis.section_put via crud_factory). Everything else under
    # /api/analyses (create, duplicate, recalculate, share, context/settings/
    # risk_matrix singletons) is journaled by the middleware.
    ("PUT", r"/api/analyses/[^/]+"),
    ("DELETE", r"/api/analyses/[^/]+"),
    ("POST", r"/api/analyses/import"),
    ("PUT", r"/api/analyses/[^/]+/(vm|bs|pp|sr|ov|srov|er|ss|eco|sop_detail|sop_summary|measures|residuals|fair|gravity_scale|socle_anssi|socle_iso)"),
])

APP_URL = os.environ.get("APP_URL", "http://localhost:8085")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[APP_URL],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(auth_router)
app.include_router(analyses_router)
app.include_router(ai_router)
app.include_router(users_router)
app.include_router(directory_router)
app.include_router(internal_router)

# Entity-level CRUD routers (vm, bs, pp, sr, ov, srov, er, ss, etc.)
for entity_router in all_entity_routers:
    app.include_router(entity_router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}



@app.get("/api/version")
async def version():
    """Version identity (FEAT-29): public, used for backup
    compatibility checks before restore."""
    async with async_session() as db:
        return await version_payload("risk", Base.metadata, db)

@app.on_event("startup")
async def on_startup():
    # Fail closed unless AUTH_MODE=none is explicit (see auth_common.assert_auth_posture).
    from src.auth import assert_auth_posture
    assert_auth_posture()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created")


app.mount("/", StaticFiles(directory="app", html=True), name="static")
