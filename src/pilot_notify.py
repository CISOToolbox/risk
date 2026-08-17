"""Fire-and-forget notification to Pilot when a measure changes.

Used by measures.py, findings.py (triage) and internal.py (write-back)
to keep Pilot's MeasureCache in sync without waiting for the next
full /measures/sync pull.

No-op in standalone mode (PILOT_URL not set) or when SERVICE_TOKEN is
missing — the module works independently either way.
"""
from __future__ import annotations

import logging
import os

logger = logging.getLogger(__name__)

PILOT_URL = os.getenv("PILOT_URL", "")
SERVICE_TOKEN = os.getenv("SERVICE_TOKEN", "")
MODULE_NAME = os.getenv("MODULE_NAME", "risk")


async def notify_pilot_measure(measure_data: dict) -> None:
    """POST the measure payload to Pilot's /api/measures/notify.
    Fire-and-forget: exceptions are logged and swallowed."""
    if not PILOT_URL or not SERVICE_TOKEN:
        return
    payload = dict(measure_data)
    payload.setdefault("module", MODULE_NAME)
    payload.setdefault("source_module", MODULE_NAME)
    try:
        import httpx
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(
                PILOT_URL.rstrip("/") + "/api/measures/notify",
                headers={"X-Service-Token": SERVICE_TOKEN, "Content-Type": "application/json"},
                json=payload,
            )
    except Exception:
        logger.debug("notify_pilot_measure failed for %s (fire-and-forget)", payload.get("source_id"))


async def notify_pilot_measure_deleted(source_id: str) -> None:
    """Notify Pilot that a measure was deleted locally."""
    if not PILOT_URL or not SERVICE_TOKEN:
        return
    try:
        import httpx
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(
                PILOT_URL.rstrip("/") + "/api/measures/notify",
                headers={"X-Service-Token": SERVICE_TOKEN, "Content-Type": "application/json"},
                json={"module": MODULE_NAME, "source_id": source_id, "deleted": True},
            )
    except Exception:
        logger.debug("notify_pilot_measure_deleted failed for %s", source_id)
