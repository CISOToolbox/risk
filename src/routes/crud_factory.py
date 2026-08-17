"""Generic CRUD router factory for EBIOS RM analysis child entities.

Creates GET/PUT endpoints for each entity type scoped under
/api/analyses/{analysis_id}/{entity_key}.

All entities follow the same pattern:
- GET returns the list (reconstructed from DB)
- PUT replaces the entire list (delete-all + re-insert)

This avoids 16 nearly-identical route files.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Callable

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth import get_current_user
from src.database import get_db
from src.models import Analysis

# The child-entity routers MUST share analyses.py's canonical permission ladder.
# A drifted copy here used to grant full write on an unowned analysis to ANY
# module role (viewer included) and had no module-role fallback — bypassing the
# fix analyses.py already carried. Import the single source of truth instead.
from src.routes.analyses import _user_permissions  # noqa: E402


def create_entity_router(
    entity_key: str,
    model_class,
    to_dict: Callable,
    from_dict: Callable,
    order_column=None,
) -> APIRouter:
    """Create a sub-router with GET and PUT for a child entity list.

    Args:
        entity_key: URL path segment (e.g. "vm", "bs", "measures").
        model_class: SQLAlchemy model class with analysis_id + sort_order.
        to_dict: fn(row) -> dict — converts a DB row to a D-compatible dict.
        from_dict: fn(analysis_id, sort_order, item_dict) -> model instance.
        order_column: Column to ORDER BY (defaults to model_class.sort_order).
    """
    router = APIRouter(
        prefix="/api/analyses/{analysis_id}/" + entity_key,
        tags=["analyses"],
    )

    if order_column is None:
        order_column = model_class.sort_order

    @router.get("")
    async def get_entities(
        analysis_id: uuid.UUID,
        user=Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ):
        analysis = await db.get(Analysis, analysis_id)
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
        if "read" not in _user_permissions(analysis, user):
            raise HTTPException(status_code=403, detail="Access denied")

        result = await db.execute(
            select(model_class)
            .where(model_class.analysis_id == analysis_id)
            .order_by(order_column)
        )
        rows = result.scalars().all()
        return [to_dict(r) for r in rows]

    @router.put("")
    async def put_entities(
        analysis_id: uuid.UUID,
        items: list[dict[str, Any]],
        user=Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ):
        analysis = await db.get(Analysis, analysis_id)
        if not analysis:
            raise HTTPException(status_code=404, detail="Analysis not found")
        if "edit" not in _user_permissions(analysis, user):
            raise HTTPException(status_code=403, detail="Access denied")

        # Delete all existing rows
        await db.execute(
            delete(model_class).where(model_class.analysis_id == analysis_id)
        )

        # Insert new rows
        for i, item in enumerate(items):
            db.add(from_dict(analysis_id, i, item))

        analysis.updated_at = datetime.now(timezone.utc)
        from src.audit import log_write
        await log_write(db, user, None, "analysis.section_put",
                        entity_type="analysis", entity_id=str(analysis_id),
                        target=analysis.name or "",
                        details={"section": model_class.__tablename__, "rows": len(items)})
        await db.commit()

        # Return the new list
        result = await db.execute(
            select(model_class)
            .where(model_class.analysis_id == analysis_id)
            .order_by(order_column)
        )
        rows = result.scalars().all()
        return [to_dict(r) for r in rows]

    return router
