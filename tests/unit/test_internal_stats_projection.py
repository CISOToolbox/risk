"""Perf regression (M1): risk /internal/stats counts without hydrating whole
tables.

The handler used len(select(Analysis.id).all()) and loaded every AnalysisMeasure
and AnalysisResidual into ORM objects just to bucket them — on every 30s Pilot
poll. It now uses COUNT and projects the needed columns. This test locks the
counts/distribution/posture the rewrite must preserve.
"""
import os
import uuid
from types import SimpleNamespace

import pytest

os.environ.setdefault("SERVICE_TOKEN", "test-service-token")
os.environ.setdefault("JWT_SECRET", "test-secret")
os.environ.setdefault("MODULE_NAME", "risk")
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite://")

from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import JSONB as _JSONB
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from src.models import Analysis, AnalysisMeasure, AnalysisResidual, Base
from src.routes.internal import internal_stats

for _t in Base.metadata.tables.values():
    for _c in _t.columns:
        if _c.server_default is not None:
            _sd = str(getattr(_c.server_default, "arg", "")).lower()
            if any(k in _sd for k in ("gen_random_uuid", "now(", "::jsonb")):
                _c.server_default = None
        if isinstance(_c.type, _JSONB):
            _c.type = JSON()

_engine = create_async_engine(
    "sqlite+aiosqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool,
)
_Session = async_sessionmaker(_engine, class_=AsyncSession, expire_on_commit=False)

pytestmark = pytest.mark.asyncio


async def test_stats_counts_distribution_posture_preserved():
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    try:
        aid = uuid.uuid4()
        async with _Session() as db:
            db.add_all([Analysis(id=aid, name="A1"), Analysis(id=uuid.uuid4(), name="A2")])
            db.add_all([
                AnalysisMeasure(analysis_id=aid, id="M1", statut="Termine"),
                AnalysisMeasure(analysis_id=aid, id="M2", statut="En cours"),
                AnalysisMeasure(analysis_id=aid, id="M3", statut="A faire"),
                AnalysisMeasure(analysis_id=aid, id="M4", statut="A faire", echeance="2020-01-01"),
                AnalysisMeasure(analysis_id=aid, id="M5", statut="A etudier"),  # excluded by filter
            ])
            db.add_all([
                AnalysisResidual(analysis_id=aid, sort_order=0, risk_level="Critique", decision=""),
                AnalysisResidual(analysis_id=aid, sort_order=1, risk_level="Faible", decision="accepté"),
            ])
            await db.commit()

            req = SimpleNamespace(headers={"X-Service-Token": "test-service-token"})
            out = await internal_stats(req, db)

        assert out["entity_count"] == 2
        assert out["criticals"] == 1                         # 1 Critique residual (+ 0 Élevé)
        m = out["measures"]
        assert (m["total"], m["completed"], m["in_progress"], m["planned"]) == (4, 1, 1, 2)
        assert m["overdue"] == 1                             # M4: past echeance, not completed
        # posture = 100 - round(critical_high / total_residuals * 100) = 100 - 50
        assert out["posture"]["score"] == 50
    finally:
        async with _engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
