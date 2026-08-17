from __future__ import annotations

import copy
import uuid
from datetime import datetime, timezone
from typing import Optional

import re
from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from sqlalchemy import delete, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth import ADMIN_MODULE_ROLES, VIEWER_MODULE_ROLES, auth_enabled, get_current_user, perms_for_module_role
from src.calculations import compute_analysis_stats, recalculate_all
from src.database import get_db
from src.models import (
    Analysis,
    AnalysisBS,
    AnalysisContext,
    AnalysisEco,
    AnalysisER,
    AnalysisFAIR,
    AnalysisGravityScale,
    AnalysisMeasure,
    AnalysisOV,
    AnalysisPP,
    AnalysisResidual,
    AnalysisRiskMatrix,
    AnalysisSettings,
    AnalysisSocleANSSI,
    AnalysisSocleISO,
    AnalysisSOPDetail,
    AnalysisSOPSummary,
    AnalysisSR,
    AnalysisSROV,
    AnalysisSS,
    AnalysisVM,
    User,
)
from src.schemas import (
    AnalysisCreate,
    AnalysisListItem,
    AnalysisResponse,
    AnalysisStats,
    AnalysisUpdate,
    ShareRequest,
)
from src.upload_common import read_json_upload

router = APIRouter(prefix="/api/analyses", tags=["analyses"])


# ── Permissions ───────────────────────────────────────────────────

def _user_permissions(analysis: Analysis, user: Optional[User]) -> list[str]:
    if not auth_enabled() or user is None:
        return ["read", "edit", "delete", "share"]
    if user.role == "admin":
        return ["read", "edit", "delete", "share"]
    if analysis.owner_id == user.id:
        return ["read", "edit", "delete", "share"]
    if analysis.owner_id is None:
        # Unowned resource: rights follow the module role. Admins get full,
        # viewers stay read-only, everyone else read+edit — previously an
        # unowned analysis was a full-access free-for-all.
        mrole = getattr(user, "_module_role", "")
        if mrole in ADMIN_MODULE_ROLES:
            return ["read", "edit", "delete", "share"]
        if mrole in VIEWER_MODULE_ROLES:
            return ["read"]
        return ["read", "edit"]
    for share in (analysis.shared_with or []):
        if share.get("user_id") == str(user.id):
            return share.get("permissions", ["read"])
    # Module-role fallback (shared ladder): a per-module admin/control/editor/
    # viewer/... not explicitly in shared_with still gets the rights their role
    # implies. Without this, a per-module admin got nothing on analyses they
    # did not own — the core coherence gap vs vendor/compliance.
    return perms_for_module_role(getattr(user, "_module_role", ""))


def _can(perm: str, analysis: Analysis, user: Optional[User]) -> bool:
    return perm in _user_permissions(analysis, user)


# ── Reconstruct D object from relational tables ──────────────────

async def _reconstruct_data(db: AsyncSession, analysis_id: uuid.UUID) -> dict:
    """Reconstruct the D object from relational tables."""

    # Context
    ctx_result = await db.execute(
        select(AnalysisContext).where(AnalysisContext.analysis_id == analysis_id)
    )
    ctx = ctx_result.scalar_one_or_none()
    context = {}
    if ctx:
        context = {
            "societe": ctx.societe or "", "objet_etude": ctx.objet_etude or "",
            "date": ctx.date or "", "analyste": ctx.analyste or "",
            "reglementation": ctx.reglementation or "", "socle": ctx.socle or "",
            "commentaires": ctx.commentaires or "", "date_precedente": ctx.date_precedente or "",
            "evolutions": ctx.evolutions or "",
            "gravite_par_categorie": bool(ctx.gravite_par_categorie),
        }

    # Settings
    set_result = await db.execute(
        select(AnalysisSettings).where(AnalysisSettings.analysis_id == analysis_id)
    )
    settings = set_result.scalar_one_or_none()

    # Gravity scale
    gs_result = await db.execute(
        select(AnalysisGravityScale).where(AnalysisGravityScale.analysis_id == analysis_id)
        .order_by(AnalysisGravityScale.sort_order)
    )
    gravity_rows = gs_result.scalars().all()

    # Risk matrix
    rm_result = await db.execute(
        select(AnalysisRiskMatrix).where(AnalysisRiskMatrix.analysis_id == analysis_id)
    )
    rm = rm_result.scalar_one_or_none()

    # VM
    vm_result = await db.execute(
        select(AnalysisVM).where(AnalysisVM.analysis_id == analysis_id).order_by(AnalysisVM.sort_order)
    )
    vm_rows = vm_result.scalars().all()

    # BS
    bs_result = await db.execute(
        select(AnalysisBS).where(AnalysisBS.analysis_id == analysis_id).order_by(AnalysisBS.sort_order)
    )
    bs_rows = bs_result.scalars().all()

    # PP
    pp_result = await db.execute(
        select(AnalysisPP).where(AnalysisPP.analysis_id == analysis_id).order_by(AnalysisPP.sort_order)
    )
    pp_rows = pp_result.scalars().all()

    # SR
    sr_result = await db.execute(
        select(AnalysisSR).where(AnalysisSR.analysis_id == analysis_id).order_by(AnalysisSR.sort_order)
    )
    sr_rows = sr_result.scalars().all()

    # OV
    ov_result = await db.execute(
        select(AnalysisOV).where(AnalysisOV.analysis_id == analysis_id).order_by(AnalysisOV.sort_order)
    )
    ov_rows = ov_result.scalars().all()

    # SROV
    srov_result = await db.execute(
        select(AnalysisSROV).where(AnalysisSROV.analysis_id == analysis_id).order_by(AnalysisSROV.sort_order)
    )
    srov_rows = srov_result.scalars().all()

    # ER
    er_result = await db.execute(
        select(AnalysisER).where(AnalysisER.analysis_id == analysis_id).order_by(AnalysisER.sort_order)
    )
    er_rows = er_result.scalars().all()

    # SS
    ss_result = await db.execute(
        select(AnalysisSS).where(AnalysisSS.analysis_id == analysis_id).order_by(AnalysisSS.sort_order)
    )
    ss_rows = ss_result.scalars().all()

    # Eco
    eco_result = await db.execute(
        select(AnalysisEco).where(AnalysisEco.analysis_id == analysis_id).order_by(AnalysisEco.sort_order)
    )
    eco_rows = eco_result.scalars().all()

    # SOP Detail
    sopd_result = await db.execute(
        select(AnalysisSOPDetail).where(AnalysisSOPDetail.analysis_id == analysis_id).order_by(AnalysisSOPDetail.sort_order)
    )
    sopd_rows = sopd_result.scalars().all()

    # SOP Summary
    sops_result = await db.execute(
        select(AnalysisSOPSummary).where(AnalysisSOPSummary.analysis_id == analysis_id).order_by(AnalysisSOPSummary.sort_order)
    )
    sops_rows = sops_result.scalars().all()

    # Measures
    meas_result = await db.execute(
        select(AnalysisMeasure).where(AnalysisMeasure.analysis_id == analysis_id).order_by(AnalysisMeasure.sort_order)
    )
    meas_rows = meas_result.scalars().all()

    # Residuals
    res_result = await db.execute(
        select(AnalysisResidual).where(AnalysisResidual.analysis_id == analysis_id).order_by(AnalysisResidual.sort_order)
    )
    res_rows = res_result.scalars().all()

    # FAIR
    fair_result = await db.execute(
        select(AnalysisFAIR).where(AnalysisFAIR.analysis_id == analysis_id).order_by(AnalysisFAIR.sort_order)
    )
    fair_rows = fair_result.scalars().all()

    # Socle ANSSI
    sa_result = await db.execute(
        select(AnalysisSocleANSSI).where(AnalysisSocleANSSI.analysis_id == analysis_id).order_by(AnalysisSocleANSSI.sort_order)
    )
    sa_rows = sa_result.scalars().all()

    # Socle ISO
    si_result = await db.execute(
        select(AnalysisSocleISO).where(AnalysisSocleISO.analysis_id == analysis_id).order_by(AnalysisSocleISO.sort_order)
    )
    si_rows = si_result.scalars().all()

    # ── Build the D object ────────────────────────────────────────

    data = {
        "context": context,
        "socle_type": settings.socle_type if settings else "anssi",
        "gravity_scale": [
            {
                "niveau": g.niveau or "", "label": g.label or "",
                "description": g.description or "",
                "impact_financier": g.impact_financier or "",
                "impact_reputation": g.impact_reputation or "",
                "impact_reglementaire": g.impact_reglementaire or "",
                "impact_donnees_perso": g.impact_donnees_perso or "",
                "impact_operationnel": g.impact_operationnel or "",
            }
            for g in gravity_rows
        ],
        "risk_matrix": rm.matrix if rm else [],
        "vm": [
            {"id": v.id, "nom": v.nom or "", "nature": v.nature or "",
             "description": v.description or "", "responsable": v.responsable or ""}
            for v in vm_rows
        ],
        "bs": [
            {"id": b.id, "nom": b.nom or "", "type": b.type or "",
             "vm": b.vm or "", "localisation": b.localisation or "",
             "proprietaire": b.proprietaire or ""}
            for b in bs_rows
        ],
        "pp": [
            {"id": p.id, "nom": p.nom or "", "categorie": p.categorie or "",
             "type": p.type or "", "dependance": p.dependance or "",
             "penetration": p.penetration or "", "maturite": p.maturite or "",
             "confiance": p.confiance or "", "bs": p.bs or "",
             "menace": p.menace, "exposition": p.exposition or "",
             **( {"_sync": p._sync} if p._sync else {}),
             **( {"certifications": p.certifications} if p.certifications else {})}
            for p in pp_rows
        ],
        "sr_list": [{"id": s.id, "nom": s.nom or ""} for s in sr_rows],
        "ov_list": [{"id": o.id, "nom": o.nom or ""} for o in ov_rows],
        "srov": [
            {"couple": s.couple or "", "sr_id": s.sr_id or "",
             "ov_id": s.ov_id or "", "motivation": s.motivation or "",
             "ressources": s.ressources or "", "activite": s.activite or "",
             "justification": s.justification or ""}
            for s in srov_rows
        ],
        "er": [
            {"id": e.id, "evenement": e.evenement or "", "vm": e.vm or "",
             "dict": e.dict or "", "impacts": e.impacts or "",
             "gravite": e.gravite or "", "gravite_cat": e.gravite_cat or {}}
            for e in er_rows
        ],
        "ss": [
            {"id": s.id, "scenario": s.scenario or "",
             "couple_id": s.couple_id or "", "couple_desc": s.couple_desc or "",
             "pp": s.pp or "", "bs": s.bs or "", "er": s.er or "",
             "gravite": s.gravite}
            for s in ss_rows
        ],
        "eco": [
            {"pp_id": e.pp_id or "", "mesures_existantes": e.mesures_existantes or "",
             "mesures_complementaires": e.mesures_complementaires or "",
             "categorie": e.categorie or "", "dep_resid": e.dep_resid or "",
             "pen_resid": e.pen_resid or "", "mat_resid": e.mat_resid or "",
             "conf_resid": e.conf_resid or "", "menace_resid": e.menace_resid,
             "exposition_resid": e.exposition_resid or ""}
            for e in eco_rows
        ],
        "sop_detail": [
            {"sop": s.sop or "", "ss": s.ss or "", "phase": s.phase or "",
             "action": s.action or "", "bs": s.bs or "",
             "controle": s.controle or "", "ref": s.ref or "",
             "efficacite": s.efficacite or "", "commentaire": s.commentaire or "",
             "mesure_proposee": s.mesure_proposee or "",
             "type_mesure": s.type_mesure or ""}
            for s in sopd_rows
        ],
        "sop_summary": [
            {"sop": s.sop or "", "ss": s.ss or ""}
            for s in sops_rows
        ],
        "measures": [
            {"id": m.id, "mesure": m.mesure or "", "details": m.details or "",
             "origine": m.origine or "", "type": m.type or "",
             "sop": m.sop or "", "phase": m.phase or "",
             "effet": m.effet or "", "ref_socle": m.ref_socle or "",
             "responsable": m.responsable or "", "echeance": m.echeance or "",
             "cout": m.cout or "", "statut": m.statut or "",
             "progress_log": m.progress_log or []}
            for m in meas_rows
        ],
        "residuals": [
            {"mesures": r.mesures or "", "v_resid": r.v_resid or "",
             "decision": r.decision or "", "risk_level": r.risk_level or ""}
            for r in res_rows
        ],
        "fair": [
            {"lef_min": f.lef_min or "", "lef_likely": f.lef_likely or "",
             "lef_max": f.lef_max or "", "lm_min": f.lm_min or "",
             "lm_likely": f.lm_likely or "", "lm_max": f.lm_max or "",
             "ale_p10": f.ale_p10 or "", "ale_p50": f.ale_p50 or "",
             "ale_p90": f.ale_p90 or "", "ale_mean": f.ale_mean or ""}
            for f in fair_rows
        ],
        "socle_anssi": [
            {"num": s.num or "", "thematique": s.thematique or "",
             "mesure": s.mesure or "", "conformite": s.conformite or "",
             "ecart": s.ecart or "", "mesures_prevues": s.mesures_prevues or "",
             "statut": s.statut or "", "priorite": s.priorite or ""}
            for s in sa_rows
        ],
        "socle_iso": [
            {"ref": s.ref or "", "theme": s.theme or "",
             "mesure": s.mesure or "", "applicable": s.applicable or "",
             "conformite": s.conformite or "", "ecart": s.ecart or "",
             "mesures_prevues": s.mesures_prevues or "",
             "statut": s.statut or "", "priorite": s.priorite or ""}
            for s in si_rows
        ],
    }
    return data


# ── Decompose D object into relational tables ────────────────────

# Delete order: no inter-table FKs among child tables, so order doesn't matter much
_CHILD_TABLES = [
    AnalysisSocleISO, AnalysisSocleANSSI, AnalysisFAIR, AnalysisResidual,
    AnalysisMeasure, AnalysisSOPSummary, AnalysisSOPDetail, AnalysisEco,
    AnalysisSS, AnalysisER, AnalysisSROV, AnalysisOV, AnalysisSR,
    AnalysisPP, AnalysisBS, AnalysisVM, AnalysisRiskMatrix,
    AnalysisGravityScale, AnalysisSettings, AnalysisContext,
]


def _s(val, default=""):
    """Safe str cast for VARCHAR columns that may receive int/float from JSON."""
    if val is None:
        return default
    return str(val)


async def _delete_children(db: AsyncSession, analysis_id: uuid.UUID):
    for model in _CHILD_TABLES:
        await db.execute(delete(model).where(model.analysis_id == analysis_id))


async def _decompose_data(db: AsyncSession, analysis_id: uuid.UUID, data: dict):
    """Decompose a D object into relational child rows."""

    # Context
    ctx = data.get("context") or {}
    db.add(AnalysisContext(
        analysis_id=analysis_id,
        societe=ctx.get("societe", ""), objet_etude=ctx.get("objet_etude", ""),
        date=ctx.get("date", ""), analyste=ctx.get("analyste", ""),
        reglementation=ctx.get("reglementation", ""), socle=ctx.get("socle", ""),
        commentaires=ctx.get("commentaires", ""),
        date_precedente=ctx.get("date_precedente", ""),
        evolutions=ctx.get("evolutions", ""),
        gravite_par_categorie=bool(ctx.get("gravite_par_categorie", False)),
    ))

    # Settings
    db.add(AnalysisSettings(
        analysis_id=analysis_id,
        socle_type=data.get("socle_type", "anssi"),
    ))

    # Gravity scale
    for i, g in enumerate(data.get("gravity_scale") or []):
        db.add(AnalysisGravityScale(
            analysis_id=analysis_id, sort_order=i,
            niveau=str(g.get("niveau", "")), label=g.get("label", ""),
            description=g.get("description", ""),
            impact_financier=g.get("impact_financier", ""),
            impact_reputation=g.get("impact_reputation", ""),
            impact_reglementaire=g.get("impact_reglementaire", ""),
            impact_donnees_perso=g.get("impact_donnees_perso", ""),
            impact_operationnel=g.get("impact_operationnel", ""),
        ))

    # Risk matrix
    rm = data.get("risk_matrix") or []
    if rm:
        db.add(AnalysisRiskMatrix(analysis_id=analysis_id, matrix=rm))

    # VM
    for i, v in enumerate(data.get("vm") or []):
        vid = v.get("id", "")
        if not vid:
            continue
        db.add(AnalysisVM(
            analysis_id=analysis_id, id=vid, sort_order=i,
            nom=v.get("nom", ""), nature=v.get("nature", ""),
            description=v.get("description", ""), responsable=v.get("responsable", ""),
        ))

    # BS
    for i, b in enumerate(data.get("bs") or []):
        bid = b.get("id", "")
        if not bid:
            continue
        db.add(AnalysisBS(
            analysis_id=analysis_id, id=bid, sort_order=i,
            nom=b.get("nom", ""), type=b.get("type", ""),
            vm=b.get("vm", ""), localisation=b.get("localisation", ""),
            proprietaire=b.get("proprietaire", ""),
        ))

    # PP
    for i, p in enumerate(data.get("pp") or []):
        pid = p.get("id", "")
        if not pid:
            continue
        db.add(AnalysisPP(
            analysis_id=analysis_id, id=pid, sort_order=i,
            nom=p.get("nom", ""), categorie=p.get("categorie", ""),
            type=p.get("type", ""), dependance=str(p.get("dependance", "")),
            penetration=str(p.get("penetration", "")),
            maturite=str(p.get("maturite", "")),
            confiance=str(p.get("confiance", "")), bs=p.get("bs", ""),
            menace=p.get("menace"), exposition=p.get("exposition", ""),
            _sync=p.get("_sync"), certifications=p.get("certifications"),
        ))

    # SR
    for i, s in enumerate(data.get("sr_list") or []):
        sid = s.get("id", "")
        if not sid:
            continue
        db.add(AnalysisSR(
            analysis_id=analysis_id, id=sid, sort_order=i,
            nom=s.get("nom", ""),
        ))

    # OV
    for i, o in enumerate(data.get("ov_list") or []):
        oid = o.get("id", "")
        if not oid:
            continue
        db.add(AnalysisOV(
            analysis_id=analysis_id, id=oid, sort_order=i,
            nom=o.get("nom", ""),
        ))

    # SROV
    for i, s in enumerate(data.get("srov") or []):
        db.add(AnalysisSROV(
            analysis_id=analysis_id, sort_order=i,
            couple=str(s.get("couple", "")), sr_id=str(s.get("sr_id", "")),
            ov_id=str(s.get("ov_id", "")), motivation=str(s.get("motivation", "")),
            ressources=str(s.get("ressources", "")), activite=str(s.get("activite", "")),
            justification=str(s.get("justification", "")),
        ))

    # ER
    for i, e in enumerate(data.get("er") or []):
        eid = e.get("id", "")
        if not eid:
            continue
        db.add(AnalysisER(
            analysis_id=analysis_id, id=eid, sort_order=i,
            evenement=e.get("evenement", ""), vm=e.get("vm", ""),
            dict=e.get("dict", ""), impacts=e.get("impacts", ""),
            gravite=str(e.get("gravite", "")),
            gravite_cat=e.get("gravite_cat") or None,
        ))

    # SS
    for i, s in enumerate(data.get("ss") or []):
        sid = s.get("id", "")
        if not sid:
            continue
        gravite = s.get("gravite")
        try:
            gravite = int(gravite) if gravite is not None and gravite != "" else None
        except (ValueError, TypeError):
            gravite = None
        db.add(AnalysisSS(
            analysis_id=analysis_id, id=sid, sort_order=i,
            scenario=s.get("scenario", ""), couple_id=s.get("couple_id", ""),
            couple_desc=s.get("couple_desc", ""), pp=s.get("pp", ""),
            bs=s.get("bs", ""), er=s.get("er", ""), gravite=gravite,
        ))

    # Eco
    for i, e in enumerate(data.get("eco") or []):
        db.add(AnalysisEco(
            analysis_id=analysis_id, sort_order=i,
            pp_id=e.get("pp_id", ""),
            mesures_existantes=e.get("mesures_existantes", ""),
            mesures_complementaires=e.get("mesures_complementaires", ""),
            categorie=e.get("categorie", ""),
            dep_resid=str(e.get("dep_resid", "")),
            pen_resid=str(e.get("pen_resid", "")),
            mat_resid=str(e.get("mat_resid", "")),
            conf_resid=str(e.get("conf_resid", "")),
            menace_resid=e.get("menace_resid"),
            exposition_resid=e.get("exposition_resid", ""),
        ))

    # SOP Detail
    for i, s in enumerate(data.get("sop_detail") or []):
        db.add(AnalysisSOPDetail(
            analysis_id=analysis_id, sort_order=i,
            sop=s.get("sop", ""), ss=s.get("ss", ""),
            phase=s.get("phase", ""), action=s.get("action", ""),
            bs=s.get("bs", ""), controle=s.get("controle", ""),
            ref=s.get("ref", ""), efficacite=_s(s.get("efficacite", "")),
            commentaire=s.get("commentaire", ""),
            mesure_proposee=s.get("mesure_proposee", ""),
            type_mesure=s.get("type_mesure", ""),
        ))

    # SOP Summary
    for i, s in enumerate(data.get("sop_summary") or []):
        db.add(AnalysisSOPSummary(
            analysis_id=analysis_id, sort_order=i,
            sop=s.get("sop", ""), ss=s.get("ss", ""),
        ))

    # Measures
    for i, m in enumerate(data.get("measures") or []):
        mid = m.get("id", "")
        if not mid:
            continue
        db.add(AnalysisMeasure(
            analysis_id=analysis_id, id=mid, sort_order=i,
            mesure=m.get("mesure", ""), details=m.get("details", ""),
            origine=m.get("origine", ""), type=m.get("type", ""),
            sop=m.get("sop", ""), phase=m.get("phase", ""),
            effet=m.get("effet", ""), ref_socle=m.get("ref_socle", ""),
            responsable=m.get("responsable", ""), echeance=m.get("echeance", ""),
            cout=m.get("cout", ""), statut=m.get("statut", ""),
            progress_log=m.get("progress_log", []),
        ))

    # Residuals
    for i, r in enumerate(data.get("residuals") or []):
        db.add(AnalysisResidual(
            analysis_id=analysis_id, sort_order=i,
            mesures=r.get("mesures", ""), v_resid=str(r.get("v_resid", "")),
            decision=r.get("decision", ""), risk_level=r.get("risk_level", ""),
        ))

    # FAIR
    for i, f in enumerate(data.get("fair") or []):
        db.add(AnalysisFAIR(
            analysis_id=analysis_id, sort_order=i,
            lef_min=str(f.get("lef_min", "")), lef_likely=str(f.get("lef_likely", "")),
            lef_max=str(f.get("lef_max", "")), lm_min=str(f.get("lm_min", "")),
            lm_likely=str(f.get("lm_likely", "")), lm_max=str(f.get("lm_max", "")),
            ale_p10=str(f.get("ale_p10", "")), ale_p50=str(f.get("ale_p50", "")),
            ale_p90=str(f.get("ale_p90", "")), ale_mean=str(f.get("ale_mean", "")),
        ))

    # Socle ANSSI
    for i, s in enumerate(data.get("socle_anssi") or []):
        db.add(AnalysisSocleANSSI(
            analysis_id=analysis_id, sort_order=i,
            num=_s(s.get("num", "")), thematique=s.get("thematique", ""),
            mesure=s.get("mesure", ""), conformite=str(s.get("conformite", "")),
            ecart=s.get("ecart", ""), mesures_prevues=s.get("mesures_prevues", ""),
            statut=s.get("statut", ""), priorite=s.get("priorite", ""),
        ))

    # Socle ISO
    for i, s in enumerate(data.get("socle_iso") or []):
        db.add(AnalysisSocleISO(
            analysis_id=analysis_id, sort_order=i,
            ref=s.get("ref", ""), theme=s.get("theme", ""),
            mesure=s.get("mesure", ""), applicable=str(s.get("applicable", "")),
            conformite=str(s.get("conformite", "")),
            ecart=s.get("ecart", ""), mesures_prevues=s.get("mesures_prevues", ""),
            statut=s.get("statut", ""), priorite=s.get("priorite", ""),
        ))


# ── Response builder ─────────────────────────────────────────────

def _analysis_response(analysis: Analysis, data: dict) -> dict:
    return {
        "id": analysis.id,
        "name": analysis.name,
        "organization": analysis.organization,
        "analyst": analysis.analyst,
        "owner_id": analysis.owner_id,
        "shared_with": analysis.shared_with or [],
        "created_at": analysis.created_at,
        "updated_at": analysis.updated_at,
        "server_rev": analysis.server_rev or 0,
        "data": data,
    }


# ── Routes ───────────────────────────────────────────────────────

@router.post("", response_model=AnalysisResponse, status_code=201)
async def create_analysis(
    body: AnalysisCreate,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    analysis = Analysis(
        name=body.name,
        organization=body.organization,
        analyst=body.analyst,
        owner_id=user.id if user else None,
    )
    db.add(analysis)
    await db.flush()

    if body.data:
        await _decompose_data(db, analysis.id, body.data)

    await db.commit()
    await db.refresh(analysis)

    data = await _reconstruct_data(db, analysis.id)
    return _analysis_response(analysis, data)


@router.get("", response_model=list[AnalysisListItem])
async def list_analyses(
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not auth_enabled() or user is None or user.role == "admin":
        result = await db.execute(
            select(Analysis).order_by(Analysis.updated_at.desc())
        )
        analyses = result.scalars().all()
    else:
        result = await db.execute(
            select(Analysis).where(
                or_(Analysis.owner_id == user.id, Analysis.owner_id == None)
            ).order_by(Analysis.updated_at.desc())
        )
        analyses = list(result.scalars().all())
        shared_result = await db.execute(
            select(Analysis).where(
                Analysis.owner_id != None, Analysis.owner_id != user.id
            ).order_by(Analysis.updated_at.desc())
        )
        for a in shared_result.scalars().all():
            if _can("read", a, user):
                analyses.append(a)

    # Batch-fetch entity counts for all analyses in 4 queries (not N×4)
    analysis_ids = [a.id for a in analyses]
    count_map = {}
    if analysis_ids:
        for Model, key in [
            (AnalysisVM, "vm"), (AnalysisBS, "bs"),
            (AnalysisSS, "ss"), (AnalysisMeasure, "measures"),
        ]:
            rows = (await db.execute(
                select(Model.analysis_id, func.count())
                .where(Model.analysis_id.in_(analysis_ids))
                .group_by(Model.analysis_id)
            )).all()
            for aid, cnt in rows:
                count_map.setdefault(aid, {})[key] = cnt

    out = []
    for a in analyses:
        counts = count_map.get(a.id, {})
        out.append(AnalysisListItem(
            id=a.id, name=a.name, organization=a.organization,
            analyst=a.analyst, owner_id=a.owner_id,
            shared_with=a.shared_with or [],
            created_at=a.created_at, updated_at=a.updated_at,
            vm_count=counts.get("vm", 0), bs_count=counts.get("bs", 0),
            ss_count=counts.get("ss", 0), measures_count=counts.get("measures", 0),
        ))
    return out


@router.get("/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(
    analysis_id: uuid.UUID,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    analysis = await db.get(Analysis, analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    if not _can("read", analysis, user):
        raise HTTPException(status_code=403, detail="Access denied")

    data = await _reconstruct_data(db, analysis.id)
    return _analysis_response(analysis, data)


@router.put("/{analysis_id}", response_model=AnalysisResponse)
async def update_analysis(
    analysis_id: uuid.UUID,
    body: AnalysisUpdate,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    analysis = await db.get(Analysis, analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    # FEAT-33 stale-tab guard: refuse the whole-blob overwrite when a
    # server-initiated writer bumped server_rev since this tab loaded.
    if body.expected_server_rev is not None and (analysis.server_rev or 0) > body.expected_server_rev:
        raise HTTPException(status_code=409,
                            detail="Données modifiées côté serveur depuis le chargement (Pilot/scheduler) — rechargez avant une sauvegarde globale.")
    if not _can("edit", analysis, user):
        raise HTTPException(status_code=403, detail="Access denied")

    if body.name is not None:
        analysis.name = body.name
    if body.organization is not None:
        analysis.organization = body.organization
    if body.analyst is not None:
        analysis.analyst = body.analyst

    if body.data is not None:
        recalculated = recalculate_all(copy.deepcopy(body.data))
        await _delete_children(db, analysis.id)
        await _decompose_data(db, analysis.id, recalculated)
        # Auto-sync name from data.context.societe
        ctx = body.data.get("context", {})
        if ctx.get("societe") and not body.name:
            analysis.name = ctx["societe"]

    analysis.updated_at = datetime.now(timezone.utc)
    from src.audit import log_write
    await log_write(db, user, None,
                    "analysis.blob_put" if body.data is not None else "analysis.update",
                    entity_type="analysis", entity_id=str(analysis.id), target=analysis.name or "")
    await db.commit()
    await db.refresh(analysis)

    data = await _reconstruct_data(db, analysis.id)
    return _analysis_response(analysis, data)


@router.delete("/{analysis_id}", status_code=204)
async def delete_analysis(
    analysis_id: uuid.UUID,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    analysis = await db.get(Analysis, analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    if not _can("delete", analysis, user):
        raise HTTPException(status_code=403, detail="Access denied")
    from src.audit import log_write
    await log_write(db, user, None, "analysis.delete",
                    entity_type="analysis", entity_id=str(analysis.id), target=analysis.name or "")
    await db.delete(analysis)
    await db.commit()


@router.post("/{analysis_id}/duplicate", response_model=AnalysisResponse, status_code=201)
async def duplicate_analysis(
    analysis_id: uuid.UUID,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    original = await db.get(Analysis, analysis_id)
    if not original:
        raise HTTPException(status_code=404, detail="Analysis not found")
    if not _can("read", original, user):
        raise HTTPException(status_code=403, detail="Access denied")

    original_data = await _reconstruct_data(db, original.id)

    duplicate = Analysis(
        name=original.name + " (copy)",
        organization=original.organization,
        analyst=original.analyst,
        owner_id=user.id if user else None,
    )
    db.add(duplicate)
    await db.flush()

    await _decompose_data(db, duplicate.id, original_data)
    await db.commit()
    await db.refresh(duplicate)

    data = await _reconstruct_data(db, duplicate.id)
    return _analysis_response(duplicate, data)


@router.post("/import", response_model=AnalysisResponse, status_code=201)
async def import_analysis(
    file: UploadFile,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    import json

    content = await read_json_upload(file, 10 * 1024 * 1024)
    try:
        data = json.loads(content)
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise HTTPException(status_code=400, detail="Invalid JSON file")

    # FEAT-36 — refuse future revs, normalize + replay schema migrations.
    from src.schema_migrations import FutureRevError, migrate_blob
    try:
        data = migrate_blob("risk", data)
    except FutureRevError as exc:
        raise HTTPException(status_code=422, detail=str(exc))

    name = ""
    if isinstance(data, dict):
        ctx = data.get("context", {})
        name = ctx.get("societe", "") if isinstance(ctx, dict) else ""

    analysis = Analysis(
        name=name,
        owner_id=user.id if user else None,
    )
    db.add(analysis)
    await db.flush()

    if isinstance(data, dict):
        await _decompose_data(db, analysis.id, data)

    from src.audit import log_write
    await log_write(db, user, None, "analysis.import",
                    entity_type="analysis", entity_id=str(analysis.id), target=analysis.name or "")
    await db.commit()
    await db.refresh(analysis)

    data_out = await _reconstruct_data(db, analysis.id)
    return _analysis_response(analysis, data_out)


@router.get("/{analysis_id}/export")
async def export_analysis(
    analysis_id: uuid.UUID,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    analysis = await db.get(Analysis, analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    if not _can("read", analysis, user):
        raise HTTPException(status_code=403, detail="Access denied")

    data = await _reconstruct_data(db, analysis.id)
    filename = re.sub(r'[^a-zA-Z0-9_-]', '_', analysis.name or "export") + "_EBIOS_RM.json"
    return JSONResponse(
        content=data,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/{analysis_id}/recalculate", response_model=AnalysisResponse)
async def recalculate_analysis(
    analysis_id: uuid.UUID,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    analysis = await db.get(Analysis, analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    if not _can("edit", analysis, user):
        raise HTTPException(status_code=403, detail="Access denied")

    data = await _reconstruct_data(db, analysis.id)
    recalculated = recalculate_all(copy.deepcopy(data))

    await _delete_children(db, analysis.id)
    await _decompose_data(db, analysis.id, recalculated)

    analysis.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(analysis)

    data_out = await _reconstruct_data(db, analysis.id)
    return _analysis_response(analysis, data_out)


@router.get("/{analysis_id}/stats", response_model=AnalysisStats)
async def get_analysis_stats(
    analysis_id: uuid.UUID,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    analysis = await db.get(Analysis, analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    if not _can("read", analysis, user):
        raise HTTPException(status_code=403, detail="Access denied")

    data = await _reconstruct_data(db, analysis.id)
    return compute_analysis_stats(data)


@router.post("/{analysis_id}/share", response_model=AnalysisResponse)
async def share_analysis(
    analysis_id: uuid.UUID,
    body: ShareRequest,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    analysis = await db.get(Analysis, analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    if not _can("share", analysis, user):
        raise HTTPException(status_code=403, detail="No share permission")

    valid = {"read", "edit", "delete", "share"}
    perms = [p for p in body.permissions if p in valid]
    if not perms:
        raise HTTPException(status_code=400, detail="At least one valid permission required (read, edit, delete, share)")

    result = await db.execute(select(User).where(User.email == body.email))
    target = result.scalar_one_or_none()
    if not target:
        raise HTTPException(status_code=404, detail="User not found with this email")

    shared = list(analysis.shared_with or [])
    found = False
    for entry in shared:
        if entry.get("user_id") == str(target.id):
            entry["permissions"] = perms
            entry["name"] = target.name
            found = True
            break
    if not found:
        shared.append({"user_id": str(target.id), "email": target.email, "name": target.name, "permissions": perms})

    analysis.shared_with = shared
    analysis.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(analysis)

    data = await _reconstruct_data(db, analysis.id)
    return _analysis_response(analysis, data)


@router.delete("/{analysis_id}/share/{user_email}", response_model=AnalysisResponse)
async def revoke_share(
    analysis_id: uuid.UUID,
    user_email: str,
    user: Optional[User] = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    analysis = await db.get(Analysis, analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    if not _can("share", analysis, user):
        raise HTTPException(status_code=403, detail="No share permission")

    shared = [s for s in (analysis.shared_with or []) if s.get("email") != user_email]
    analysis.shared_with = shared
    analysis.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(analysis)

    data = await _reconstruct_data(db, analysis.id)
    return _analysis_response(analysis, data)
