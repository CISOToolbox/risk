"""Internal API endpoints for Pilot integration + Vendor sync.

Protected by X-Service-Token for Pilot calls.
/api/sync/vendor is user-facing (pulls vendors from Vendor module).
"""

from __future__ import annotations

import logging

import os
from datetime import datetime, timezone
from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth import get_current_user
from src.database import get_db
from src.models import (
    Analysis,
    AnalysisContext,
    AnalysisMeasure,
    AnalysisResidual,
    User,
)
from src.routes.analyses import _can, _decompose_data, _delete_children, _reconstruct_data

router = APIRouter(prefix="/api", tags=["internal"])
logger = logging.getLogger("risk-internal")

SERVICE_TOKEN = os.getenv("SERVICE_TOKEN", "")
VENDOR_URL = os.getenv("VENDOR_URL", "http://vendor-app:8080")




def _validate_proxy_url(url: str) -> None:
    """Reject a proxy URL that points at an internal target.

    Delegates to the shared ssrf_guard rather than re-implementing the
    blocklist. The local version this replaces swallowed socket.gaierror, so a
    name that failed to resolve was ACCEPTED — the opposite of the shared
    guard's fail-closed contract — and it never knew about the Alibaba/Oracle
    metadata IPs, CGNAT, multicast or the reserved blocks.

    It matters more here than at a normal call site: the route below exports
    this value into the process-wide HTTP_PROXY, and httpx runs trust_env=True,
    so it redirects EVERY outbound request the module makes afterwards —
    including ones another guard had carefully pinned to a resolved IP.
    """
    from src.ssrf_guard import validate_public_url

    try:
        # allow_private stays False: the previous implementation already
        # refused RFC1918 proxies, so this is not a behaviour change.
        validate_public_url(url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Proxy endpoint not allowed: {e}")



def _check_service_token(request: Request) -> None:
    if not SERVICE_TOKEN:
        raise HTTPException(status_code=503, detail="Service token not configured")
    token = request.headers.get("X-Service-Token", "")
    import secrets as _secrets
    if not token or not _secrets.compare_digest(token, SERVICE_TOKEN):
        raise HTTPException(status_code=403, detail="Invalid service token")


# ═══════════════════════════════════════════════════════════════
# INTERNAL: Measures export for Pilot
# ═══════════════════════════════════════════════════════════════

@router.get("/internal/measures")
async def internal_measures(request: Request, db: AsyncSession = Depends(get_db)):
    _check_service_token(request)

    # Query measures with context for entity_name
    result = await db.execute(
        select(AnalysisMeasure, AnalysisContext.societe, Analysis.name, Analysis.id)
        .join(Analysis, AnalysisMeasure.analysis_id == Analysis.id)
        .outerjoin(AnalysisContext, AnalysisContext.analysis_id == Analysis.id)
        .order_by(AnalysisMeasure.analysis_id, AnalysisMeasure.sort_order)
    )

    measures = []
    for row in result.all():
        m = row[0]
        entity_name = row[1] or row[2] or ""
        analysis_id = row[3]
        # Risk supports multi-analysis: the same measure id (e.g. M-001) can exist
        # in several analyses. Pilot's measure cache keys on (module, source_id) so
        # we must namespace source_id by the analysis to avoid collisions.
        analysis_short = str(analysis_id).replace("-", "")[:8]
        composite_id = f"{analysis_short}:{m.id}"
        measures.append({
            "source_id": composite_id,
            "entity_id": str(analysis_id),
            "entity_name": entity_name,
            "title": m.mesure or "",
            "description": m.details or "",
            "status": _normalize_status(m.statut or ""),
            "assignee": m.responsable or "",
            "due_date": m.echeance or "",
            "type": m.type or "",
            "progress_log": m.progress_log or [],
            "source_module": "risk",
        })
    return measures


@router.get("/internal/stats")
async def internal_stats(request: Request, db: AsyncSession = Depends(get_db)):
    """Stats v2 envelope — see shared/docs/pilot-dashboard-contract.md"""
    _check_service_token(request)
    from datetime import date as _date

    # ── Entity count: analyses ──
    total_analyses = await db.scalar(select(func.count()).select_from(Analysis)) or 0

    # ── Measures ──
    # Project only the two columns the buckets need — no full-ORM hydration of
    # every measure just to count (stats is polled by Pilot every 30s).
    measures_rows = (await db.execute(
        select(AnalysisMeasure.statut, AnalysisMeasure.echeance)
        .where(AnalysisMeasure.statut != "A etudier")
    )).all()
    total_measures = len(measures_rows)
    completed = 0
    in_progress = 0
    planned = 0
    overdue = 0
    today = _date.today().isoformat()
    for statut, echeance in measures_rows:
        st = (statut or "").strip()
        if st in ("Termine", "Terminé", "completed"):
            completed += 1
        elif st in ("En cours", "in_progress"):
            in_progress += 1
        else:
            planned += 1
        if echeance and echeance < today and st not in ("Termine", "Terminé", "completed"):
            overdue += 1
    progress_pct = round(completed / total_measures * 100) if total_measures else 0

    # ── Residual risks distribution ──
    residual_rows = (await db.execute(
        select(AnalysisResidual.risk_level, AnalysisResidual.decision)
    )).all()
    dist = {"Critique": 0, "Eleve": 0, "Moyen": 0, "Faible": 0, "Negligeable": 0}
    critical_high_undecided = 0
    for risk_level, decision in residual_rows:
        level = (risk_level or "").strip()
        if level in dist:
            dist[level] += 1
        # Residual acceptance is a governance milestone: a high/critical residual
        # with no recorded decision is "not yet accepted" (spec reconciliation, C).
        if level in ("Critique", "Eleve") and not (decision or "").strip():
            critical_high_undecided += 1
    critical_high = dist["Critique"] + dist["Eleve"]
    total_residuals = sum(dist.values())

    # ── Posture score: 100 - (residuals_high_or_critical / total * 100) ──
    if total_residuals > 0:
        posture_score = 100 - round(critical_high / total_residuals * 100)
    else:
        posture_score = 100

    # ── Breakdown as donut of residual levels ──
    donut_segments = []
    if dist["Critique"]:   donut_segments.append({"label": "Critique",   "value": dist["Critique"],   "color": "redMax"})
    if dist["Eleve"]:      donut_segments.append({"label": "Élevé",      "value": dist["Eleve"],      "color": "red"})
    if dist["Moyen"]:      donut_segments.append({"label": "Modéré",    "value": dist["Moyen"],      "color": "orange"})
    if dist["Faible"]:     donut_segments.append({"label": "Faible",    "value": dist["Faible"],     "color": "yellow"})
    if dist["Negligeable"]: donut_segments.append({"label": "Négligeable", "value": dist["Negligeable"], "color": "green"})

    # ── Top items: top 3 critical/high residuals with scenario label ──
    top_items = []
    if critical_high > 0:
        from src.models import AnalysisSS
        ss_result = await db.execute(
            select(AnalysisSS)
            .order_by(AnalysisSS.gravite.desc().nullslast())
            .limit(3)
        )
        for ss in ss_result.scalars().all():
            label = (ss.scenario or ss.id or "")[:80]
            sev = "critical" if (ss.gravite or 0) >= 4 else "high"
            top_items.append({
                "id": ss.id,
                "label": label,
                "severity": sev,
                "url": "/risk/",
            })

    # ── Alerts ──
    alerts = []
    if overdue > 0:
        alerts.append({
            "level": "critical" if overdue >= 5 else "warning",
            "text": f"{overdue} mesure(s) en retard",
            "url": "/risk/",
        })
    if critical_high > 0:
        alerts.append({
            "level": "warning",
            "text": f"{critical_high} risque(s) résiduel(s) élevé(s)",
            "url": "/risk/",
        })
    if critical_high_undecided > 0:
        alerts.append({
            "level": "critical" if critical_high_undecided >= 3 else "warning",
            "text": f"{critical_high_undecided} risque(s) résiduel(s) élevé(s)/critique(s) sans décision d'acceptation",
            "url": "/risk/",
        })

    return {
        # Stats v2 envelope
        "entity_count": total_analyses,
        "entity_label": "Analyses EBIOS RM",
        # Semantic critical count so Pilot doesn't parse localized breakdown
        # labels — residual risks rated Critique or Élevé.
        "criticals": critical_high,
        "measures": {
            "total": total_measures,
            "completed": completed,
            "in_progress": in_progress,
            "planned": planned,
            "overdue": overdue,
            "progress_pct": progress_pct,
        },
        "posture": {
            "score": posture_score,
            "score_label": _posture_label(posture_score),
        },
        "breakdown": {
            "type": "donut",
            "data": {
                "segments": donut_segments,
                "center_label": str(total_residuals),
                "center_sublabel": "risques résiduels",
            },
        },
        "top_items": top_items,
        "alerts": alerts,
        # Legacy fields for backward compatibility
        "total_analyses": total_analyses,
        "total_measures": total_measures,
        "measures_progress": progress_pct,
        "risk_distribution": {
            "Eleve": dist["Critique"] + dist["Eleve"],
            "Moyen": dist["Moyen"],
            "Faible": dist["Faible"] + dist["Negligeable"],
        },
    }


def _posture_label(score: int) -> str:
    """Shared label bucket — see dashboard contract."""
    if score is None:
        return ""
    if score < 40:
        return "Faible"
    if score < 60:
        return "Modéré"
    if score < 80:
        return "Bon"
    return "Excellent"


@router.get("/internal/activity")
async def internal_activity(request: Request, db: AsyncSession = Depends(get_db)):
    """Recent activity events for the Pilot dashboard feed."""
    _check_service_token(request)
    from datetime import datetime as _dt

    events = []
    # Last 10 analyses (creation / update)
    analyses_result = await db.execute(
        select(Analysis).order_by(Analysis.updated_at.desc()).limit(10)
    )
    for a in analyses_result.scalars().all():
        events.append({
            "date": (a.updated_at or a.created_at or _dt.utcnow()).isoformat(),
            "module": "risk",
            "type": "analysis_updated",
            "label": f"Analyse « {(a.name or a.id)[:50]} » mise à jour",
            "url": "/risk/",
        })
    return events[:10]


async def bump_server_rev(db, analysis_id) -> None:
    """FEAT-33 — mark a server-initiated write so stale tabs cannot blob-PUT
    over it (see routes/analyses.update_analysis)."""
    from sqlalchemy import update as _upd
    from src.models import Analysis as _A
    await db.execute(_upd(_A).where(_A.id == analysis_id).values(server_rev=_A.server_rev + 1))


@router.patch("/internal/measures/{source_id}")
async def patch_measure(source_id: str, request: Request, entity_id: str | None = None, db: AsyncSession = Depends(get_db)):
    _check_service_token(request)
    body = await request.json()

    # Parse composite source_id format "<analysis_short>:<measure_id>". Fall back
    # to the legacy single-analysis format if no separator is present.
    if ":" in source_id:
        _analysis_prefix, _, measure_local_id = source_id.partition(":")
    else:
        measure_local_id = source_id

    query = select(AnalysisMeasure).where(AnalysisMeasure.id == measure_local_id)
    if entity_id:
        query = query.where(AnalysisMeasure.analysis_id == entity_id)

    result = await db.execute(query)
    measure = result.scalar_one_or_none()
    if not measure:
        raise HTTPException(status_code=404, detail="Measure not found")

    # Transverse Pilot ↔ Risk mapping: title → mesure, description → details.
    if "title" in body:
        measure.mesure = body["title"]
    if "description" in body:
        measure.details = body["description"]
    if "status" in body:
        measure.statut = _denormalize_status(body["status"])
    if "assignee" in body:
        measure.responsable = body["assignee"]
    if "due_date" in body:
        measure.echeance = body["due_date"]
    if "progress_log" in body:
        measure.progress_log = body["progress_log"]

    await bump_server_rev(db, measure.analysis_id)
    # Pilot write-back is a business write — journaled (FEAT-30 review).
    from src.audit import log_write
    await log_write(db, None, request, "measure.writeback_update", actor="pilot",
                    entity_type="measure", entity_id=str(source_id))
    await db.commit()
    import asyncio
    from src.pilot_notify import notify_pilot_measure
    asyncio.ensure_future(notify_pilot_measure({
        "source_id": source_id,
        "entity_id": entity_id or str(measure.analysis_id or ""),
        "title": measure.mesure or "",
        "description": measure.details or "",
        "status": _normalize_status(measure.statut or ""),
        "assignee": measure.responsable or "",
        "due_date": measure.echeance or "",
    }))
    return {"ok": True}


@router.delete("/internal/measures/{source_id}", status_code=204)
async def delete_measure_internal(source_id: str, request: Request, entity_id: str | None = None, db: AsyncSession = Depends(get_db)):
    """Delete a measure via Pilot write-back."""
    _check_service_token(request)
    if ":" in source_id:
        _, _, measure_local_id = source_id.partition(":")
    else:
        measure_local_id = source_id
    query = select(AnalysisMeasure).where(AnalysisMeasure.id == measure_local_id)
    if entity_id:
        query = query.where(AnalysisMeasure.analysis_id == entity_id)
    result = await db.execute(query)
    measure = result.scalar_one_or_none()
    if not measure:
        raise HTTPException(status_code=404, detail="Measure not found")
    await bump_server_rev(db, measure.analysis_id)
    await db.delete(measure)
    # Pilot write-back is a business write — journaled (FEAT-30 review).
    from src.audit import log_write
    await log_write(db, None, request, "measure.writeback_delete", actor="pilot",
                    entity_type="measure", entity_id=str(source_id))
    await db.commit()


# ═══════════════════════════════════════════════════════════════
# SYNC: Pull vendors from Vendor module into Risk PP
# ═══════════════════════════════════════════════════════════════

@router.post("/sync/vendor")
async def sync_vendor(
    analysis_id: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Pull vendors from Vendor module, inject into Risk's D.pp[] as read-only."""
    analysis = await db.get(Analysis, analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    if not _can("edit", analysis, user):
        raise HTTPException(status_code=403, detail="Access denied")

    # Fetch vendors from Vendor module
    headers = {"X-Service-Token": SERVICE_TOKEN} if SERVICE_TOKEN else {}
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(VENDOR_URL.rstrip("/") + "/api/export/vendors", headers=headers)
            resp.raise_for_status()
            vendor_data = resp.json()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Vendor module unreachable: {e}")

    vendors = vendor_data.get("vendors") or []

    # Reconstruct current data, modify, decompose back
    data = await _reconstruct_data(db, analysis.id)
    pp = data.get("pp") or []
    measures = data.get("measures") or []

    # Remove previously synced PP (have _sync flag)
    pp = [p for p in pp if not (isinstance(p, dict) and p.get("_sync"))]
    measures = [m for m in measures if not (isinstance(m, dict) and m.get("_sync"))]

    added_pp = 0
    added_measures = 0

    for v in vendors:
        if v.get("status") not in ("active", "review"):
            continue

        exp = v.get("exposure") or {}
        new_pp = {
            "id": v.get("id", ""),
            "nom": v.get("name", ""),
            "type": v.get("type", ""),
            "dependance": round(exp.get("dependance", 0)),
            "penetration": round(exp.get("penetration", 0)),
            "maturite": round(exp.get("maturite", 0)),
            "confiance": round(exp.get("confiance", 0)),
            "menace": v.get("threat_level"),
            "exposition": v.get("exposition", ""),
            "certifications": v.get("certifications", []),
            "_sync": {
                "source": "vendor",
                "synced_at": datetime.now(timezone.utc).isoformat(),
                "original_exposure": exp,
            }
        }
        pp.append(new_pp)
        added_pp += 1

        for vm in v.get("measures") or []:
            new_m = {
                "id": vm.get("id", ""),
                "mesure": vm.get("mesure") or vm.get("label", ""),
                "details": vm.get("details", ""),
                "type": vm.get("type", ""),
                "statut": vm.get("statut") or vm.get("status", ""),
                "responsable": vm.get("responsable") or vm.get("assignee", ""),
                "echeance": vm.get("echeance") or vm.get("due_date", ""),
                "ref": vm.get("ref_socle", ""),
                "_sync": {
                    "source": "vendor",
                    "vendor_id": v.get("id", ""),
                    "vendor_name": v.get("name", ""),
                    "synced_at": datetime.now(timezone.utc).isoformat(),
                }
            }
            measures.append(new_m)
            added_measures += 1

    data["pp"] = pp
    data["measures"] = measures

    await _delete_children(db, analysis.id)
    await _decompose_data(db, analysis.id, data)

    analysis.updated_at = datetime.now(timezone.utc)
    await db.commit()

    return {
        "added_pp": added_pp,
        "added_measures": added_measures,
        "total_pp": len(pp),
        "total_measures": len(measures),
    }


def _normalize_status(s: str) -> str:
    mapping = {
        "Termine": "completed", "Terminé": "completed", "completed": "completed",
        "En cours": "in_progress", "en_cours": "in_progress",
        "Planifie": "planned", "Planifié": "planned", "planifie": "planned",
        "A etudier": "backlog", "À étudier": "backlog",
    }
    return mapping.get(s, s)


def _denormalize_status(s: str) -> str:
    mapping = {
        "completed": "Terminé", "in_progress": "En cours",
        "planned": "Planifié", "backlog": "À étudier",
    }
    return mapping.get(s, s)


# ── Audit trail for Pilot-pushed config changes (SEC hardening) ──
# set_proxy / set_custom_llm are service-token endpoints (no user), yet they
# change egress routing and the LLM the module talks to. Record the source
# and what changed so a rogue/erroneous push is traceable. Secrets are NEVER
# logged: proxy URLs are stripped of any user:pass and the LLM key is reduced
# to a boolean. Rotate credentials after any unexpected change (runbook).
def _redact_url(url: str) -> str:
    if not url:
        return "(empty)"
    try:
        p = urlparse(url)
        host = p.hostname or ""
        if p.port:
            host += f":{p.port}"
        return f"{p.scheme}://{host}" if host else "(set)"
    except Exception:
        return "(set)"


def _audit_internal_change(request: Request, action: str, details: dict) -> None:
    ip = request.client.host if request and request.client else "?"
    rendered = " ".join(f"{k}={v}" for k, v in details.items())
    logger.warning("internal config change: action=%s src=%s %s", action, ip, rendered)


@router.put("/internal/proxy")
async def set_proxy(request: Request, db: AsyncSession = Depends(get_db)):
    """Receive proxy config from Pilot."""
    _check_service_token(request)
    body = await request.json()
    for key in ("http_proxy", "https_proxy"):
        if key in body:
            _validate_proxy_url(body[key])
    if "http_proxy" in body:
        os.environ["HTTP_PROXY"] = body["http_proxy"]
        os.environ["http_proxy"] = body["http_proxy"]
    if "https_proxy" in body:
        os.environ["HTTPS_PROXY"] = body["https_proxy"]
        os.environ["https_proxy"] = body["https_proxy"]
    if "no_proxy" in body:
        os.environ["NO_PROXY"] = body["no_proxy"]
        os.environ["no_proxy"] = body["no_proxy"]
    changed = {k: _redact_url(body[k]) for k in ("http_proxy", "https_proxy") if k in body}
    if "no_proxy" in body:
        changed["no_proxy"] = body["no_proxy"]
    if changed:
        _audit_internal_change(request, "proxy.set", changed)
    return {"ok": True}


# In-memory custom LLM config (pushed by Pilot)
_custom_llm = {"endpoint": "", "model": "", "key": "", "label": "Custom LLM"}

@router.put("/internal/ai-custom")
async def set_custom_llm(request: Request):
    """Receive custom LLM config from Pilot (in-memory only, no DB persistence for key)."""
    _check_service_token(request)
    global _custom_llm
    body = await request.json()
    _custom_llm = {
        "endpoint": body.get("endpoint", ""),
        "model": body.get("model", ""),
        "key": body.get("key", ""),
        "label": body.get("label", "Custom LLM"),
    }
    _audit_internal_change(request, "ai_custom.set", {
        "endpoint": _redact_url(_custom_llm["endpoint"]) if _custom_llm["endpoint"] else "(cleared)",
        "model": _custom_llm["model"] or "(none)",
        "label": _custom_llm["label"],
        "key_set": bool(_custom_llm["key"]),
    })
    return {"ok": True}


@router.post("/internal/sync-user")
async def sync_user(request: Request, db: AsyncSession = Depends(get_db)):
    """Receive user ai_enabled update from Pilot."""
    _check_service_token(request)
    body = await request.json()
    email = body.get("email", "")
    if not email:
        return {"ok": False, "error": "no email"}

    from src.models import User as LocalUser
    result = await db.execute(select(LocalUser).where(LocalUser.email == email))
    user = result.scalar_one_or_none()
    if user:
        changed = {}
        if "ai_enabled" in body and user.ai_enabled != body["ai_enabled"]:
            user.ai_enabled = body["ai_enabled"]
            changed["ai_enabled"] = bool(body["ai_enabled"])
        if "name" in body and body["name"] and user.name != body["name"]:
            user.name = body["name"]
            changed["name"] = True
        if changed:
            # Journal only when something actually changed (FEAT-30 P3).
            from src.audit import log_write
            await log_write(db, None, request, "user.sync", actor="pilot",
                            entity_type="user", entity_id=email, details=changed)
        await db.commit()
        return {"ok": True, "updated": True}
    return {"ok": True, "updated": False, "reason": "user not found in module"}



@router.post("/internal/delete-user")
async def delete_user(request: Request, db: AsyncSession = Depends(get_db)):
    """De-provision a user deleted in Pilot.

    Pilot owns the account directory, but each module keeps its own `users`
    row (that is where the module role lives). Without this route a deleted
    person kept a role here for ever: `/internal/sync-user` only creates and
    updates, so nothing ever removed anything.

    Objects the person owned are KEPT — `owner_id` is ON DELETE SET NULL —
    only the account row and the role go.
    """
    _check_service_token(request)
    from sqlalchemy import func as _func

    from src.models import User as LocalUser
    body = await request.json()
    email = (body.get("email") or "").strip().lower()
    if not email:
        raise HTTPException(status_code=422, detail="email required")
    target = (await db.execute(
        select(LocalUser).where(_func.lower(LocalUser.email) == email)
    )).scalar_one_or_none()
    if target is None:
        return {"ok": True, "deleted": False}
    from src.audit import log_write
    await log_write(db, None, request, "user.delete", actor="pilot",
                    entity_type="user", entity_id=email,
                    details={"role": target.role or ""})
    await db.delete(target)
    await db.commit()
    return {"ok": True, "deleted": True}

@router.get("/internal/export")
async def internal_export_list(request: Request, db: AsyncSession = Depends(get_db)):
    """List all analyses for Pilot backup."""
    _check_service_token(request)
    from src.models import Analysis
    result = await db.execute(select(Analysis).order_by(Analysis.updated_at.desc()))
    analyses = result.scalars().all()
    return [{"id": str(a.id), "name": a.name or "", "organization": a.organization or "", "updated_at": str(a.updated_at)} for a in analyses]


@router.get("/internal/export/{item_id}")
async def internal_export_item(item_id: str, request: Request, db: AsyncSession = Depends(get_db)):
    """Export full analysis data for Pilot backup."""
    _check_service_token(request)
    from src.models import Analysis
    from src.routes.analyses import _reconstruct_data
    analysis = await db.get(Analysis, item_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Not found")
    data = await _reconstruct_data(db, analysis.id)
    return {"id": str(analysis.id), "name": analysis.name, "organization": analysis.organization, "analyst": analysis.analyst, "owner_id": str(analysis.owner_id) if analysis.owner_id else None, "shared_with": analysis.shared_with or [], "data": data}


@router.put("/internal/restore/{item_id}")
async def internal_restore_item(item_id: str, request: Request, db: AsyncSession = Depends(get_db)):
    """Restore analysis data from Pilot backup."""
    _check_service_token(request)
    body = await request.json()
    data = body.get("data", {})
    # FEAT-36 — a restored backup can carry an old blob: migrate it too.
    from src.schema_migrations import FutureRevError, migrate_blob
    try:
        data = migrate_blob("risk", data)
    except FutureRevError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    name = body.get("name", "")
    organization = body.get("organization", "")

    from src.models import Analysis
    from src.routes.analyses import _delete_children, _decompose_data

    analysis = await db.get(Analysis, item_id)
    if analysis:
        # Update existing
        analysis.name = name or analysis.name
        analysis.organization = organization or analysis.organization
        from src.backup_common import restore_root_fields
        from src.models import User as _RootUser
        await restore_root_fields(db, analysis, body, _RootUser)
        analysis.analyst = body.get("analyst") or analysis.analyst
        await _delete_children(db, analysis.id)
        await _decompose_data(db, analysis.id, data)
        from src.audit import log_write
        await log_write(db, None, request, "analysis.restore", actor="pilot",
                        entity_type="analysis", entity_id=str(analysis.id), target=analysis.name or "")
        await bump_server_rev(db, analysis.id)
        await db.commit()
        return {"ok": True, "action": "updated"}
    else:
        # Create new
        analysis = Analysis(id=item_id, name=name, organization=organization)
        db.add(analysis)
        await db.flush()
        from src.backup_common import restore_root_fields
        from src.models import User as _RootUser
        await restore_root_fields(db, analysis, body, _RootUser)
        analysis.analyst = body.get("analyst") or analysis.analyst
        await _decompose_data(db, analysis.id, data)
        from src.audit import log_write
        await log_write(db, None, request, "analysis.restore", actor="pilot",
                        entity_type="analysis", entity_id=str(analysis.id), target=analysis.name or "")
        await db.commit()
        return {"ok": True, "action": "created"}


# ── Recovery reads (FEAT-30 phase 2) — state at instant T ───────────────
# The agent's scratch instance holds the database as it was at T. These
# endpoints re-run the exact same export code against it, so Pilot's diff
# compares two payloads of identical shape. The list call also brings the
# scratch schema to head (alembic) when T predates a migration.

@router.get("/internal/export-recovery")
async def internal_export_recovery_list(request: Request):
    _check_service_token(request)
    from src.backup_common import recovery_session, upgrade_recovery_schema
    upgrade_recovery_schema()
    async with recovery_session() as rdb:
        return await internal_export_list(request, rdb)


@router.get("/internal/export-recovery/{item_id}")
async def internal_export_recovery_item(item_id: str, request: Request):
    _check_service_token(request)
    from src.backup_common import recovery_session
    async with recovery_session() as rdb:
        return await internal_export_item(item_id, request, rdb)


# ── Journal reads (FEAT-30 phase 2) — event-anchored restore ────────────
# Pilot's restore UI shows WHO changed WHAT and WHEN so the admin picks an
# event instead of guessing a clock time. Modules whose audit_log predates
# the entity columns (surface/appsec/watch) still serve time+actor+action.

@router.get("/internal/journal")
async def internal_journal(request: Request, entity_id: str = "", limit: int = 30,
                           db: AsyncSession = Depends(get_db)):
    _check_service_token(request)
    from src.models import AuditLog
    cols = {c.name for c in AuditLog.__table__.columns}
    q = select(AuditLog).order_by(AuditLog.logged_at.desc()).limit(min(max(limit, 1), 100))
    if entity_id and "entity_id" in cols:
        q = q.where(AuditLog.entity_id == entity_id)
    rows = (await db.execute(q)).scalars().all()
    return [{
        "logged_at": r.logged_at.isoformat() if r.logged_at else None,
        "user_email": r.user_email or "",
        "action": r.action or "",
        "target": r.target or "",
        "entity_type": getattr(r, "entity_type", "") or "",
        "entity_id": getattr(r, "entity_id", "") or "",
        "details": (r.details or "")[:300],
    } for r in rows]
