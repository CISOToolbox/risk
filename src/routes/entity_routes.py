"""CRUD routers for all EBIOS RM child entities.

Uses the generic crud_factory to create GET/PUT endpoints for each entity.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete as sa_delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth import get_current_user
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
)
from src.routes.crud_factory import create_entity_router


# ── VM ────────────────────────────────────────────────────────────

def _vm_to_dict(v):
    return {"id": v.id, "nom": v.nom or "", "nature": v.nature or "",
            "description": v.description or "", "responsable": v.responsable or ""}

def _vm_from_dict(aid, i, d):
    return AnalysisVM(analysis_id=aid, id=d.get("id", ""), sort_order=i,
                      nom=d.get("nom", ""), nature=d.get("nature", ""),
                      description=d.get("description", ""), responsable=d.get("responsable", ""))

vm_router = create_entity_router("vm", AnalysisVM, _vm_to_dict, _vm_from_dict)


# ── BS ────────────────────────────────────────────────────────────

def _bs_to_dict(b):
    return {"id": b.id, "nom": b.nom or "", "type": b.type or "",
            "vm": b.vm or "", "localisation": b.localisation or "",
            "proprietaire": b.proprietaire or ""}

def _bs_from_dict(aid, i, d):
    return AnalysisBS(analysis_id=aid, id=d.get("id", ""), sort_order=i,
                      nom=d.get("nom", ""), type=d.get("type", ""),
                      vm=d.get("vm", ""), localisation=d.get("localisation", ""),
                      proprietaire=d.get("proprietaire", ""))

bs_router = create_entity_router("bs", AnalysisBS, _bs_to_dict, _bs_from_dict)


# ── PP ────────────────────────────────────────────────────────────

def _pp_to_dict(p):
    return {"id": p.id, "nom": p.nom or "", "categorie": p.categorie or "",
            "type": p.type or "", "dependance": p.dependance or "",
            "penetration": p.penetration or "", "maturite": p.maturite or "",
            "confiance": p.confiance or "", "bs": p.bs or "",
            "menace": p.menace, "exposition": p.exposition or ""}

def _pp_from_dict(aid, i, d):
    return AnalysisPP(analysis_id=aid, id=d.get("id", ""), sort_order=i,
                      nom=d.get("nom", ""), categorie=d.get("categorie", ""),
                      type=d.get("type", ""), dependance=str(d.get("dependance", "")),
                      penetration=str(d.get("penetration", "")),
                      maturite=str(d.get("maturite", "")),
                      confiance=str(d.get("confiance", "")), bs=d.get("bs", ""),
                      menace=d.get("menace"), exposition=d.get("exposition", ""))

pp_router = create_entity_router("pp", AnalysisPP, _pp_to_dict, _pp_from_dict)


# ── SR ────────────────────────────────────────────────────────────

def _sr_to_dict(s):
    return {"id": s.id, "nom": s.nom or ""}

def _sr_from_dict(aid, i, d):
    return AnalysisSR(analysis_id=aid, id=d.get("id", ""), sort_order=i,
                      nom=d.get("nom", ""))

sr_router = create_entity_router("sr_list", AnalysisSR, _sr_to_dict, _sr_from_dict)


# ── OV ────────────────────────────────────────────────────────────

def _ov_to_dict(o):
    return {"id": o.id, "nom": o.nom or ""}

def _ov_from_dict(aid, i, d):
    return AnalysisOV(analysis_id=aid, id=d.get("id", ""), sort_order=i,
                      nom=d.get("nom", ""))

ov_router = create_entity_router("ov_list", AnalysisOV, _ov_to_dict, _ov_from_dict)


# ── SROV ──────────────────────────────────────────────────────────

def _srov_to_dict(s):
    return {"couple": s.couple or "", "sr_id": s.sr_id or "",
            "ov_id": s.ov_id or "", "motivation": s.motivation or "",
            "ressources": s.ressources or "", "activite": s.activite or "",
            "justification": s.justification or ""}

def _srov_from_dict(aid, i, d):
    return AnalysisSROV(analysis_id=aid, sort_order=i,
                        couple=d.get("couple", ""), sr_id=d.get("sr_id", ""),
                        ov_id=d.get("ov_id", ""), motivation=d.get("motivation", ""),
                        ressources=d.get("ressources", ""), activite=d.get("activite", ""),
                        justification=d.get("justification", ""))

srov_router = create_entity_router("srov", AnalysisSROV, _srov_to_dict, _srov_from_dict)


# ── ER ────────────────────────────────────────────────────────────

def _er_to_dict(e):
    return {"id": e.id, "evenement": e.evenement or "", "vm": e.vm or "",
            "dict": e.dict or "", "impacts": e.impacts or "",
            "gravite": e.gravite or "", "gravite_cat": e.gravite_cat or {}}

def _er_from_dict(aid, i, d):
    return AnalysisER(analysis_id=aid, id=d.get("id", ""), sort_order=i,
                      evenement=d.get("evenement", ""), vm=d.get("vm", ""),
                      dict=d.get("dict", ""), impacts=d.get("impacts", ""),
                      gravite=str(d.get("gravite", "")),
                      gravite_cat=d.get("gravite_cat") or None)

er_router = create_entity_router("er", AnalysisER, _er_to_dict, _er_from_dict)


# ── SS ────────────────────────────────────────────────────────────

def _ss_to_dict(s):
    return {"id": s.id, "scenario": s.scenario or "",
            "couple_id": s.couple_id or "", "couple_desc": s.couple_desc or "",
            "pp": s.pp or "", "bs": s.bs or "", "er": s.er or "",
            "gravite": s.gravite}

def _ss_from_dict(aid, i, d):
    gravite = d.get("gravite")
    try:
        gravite = int(gravite) if gravite is not None and gravite != "" else None
    except (ValueError, TypeError):
        gravite = None
    return AnalysisSS(analysis_id=aid, id=d.get("id", ""), sort_order=i,
                      scenario=d.get("scenario", ""), couple_id=d.get("couple_id", ""),
                      couple_desc=d.get("couple_desc", ""), pp=d.get("pp", ""),
                      bs=d.get("bs", ""), er=d.get("er", ""), gravite=gravite)

ss_router = create_entity_router("ss", AnalysisSS, _ss_to_dict, _ss_from_dict)


# ── Eco ───────────────────────────────────────────────────────────

def _eco_to_dict(e):
    return {"pp_id": e.pp_id or "", "mesures_existantes": e.mesures_existantes or "",
            "mesures_complementaires": e.mesures_complementaires or "",
            "categorie": e.categorie or "", "dep_resid": e.dep_resid or "",
            "pen_resid": e.pen_resid or "", "mat_resid": e.mat_resid or "",
            "conf_resid": e.conf_resid or "", "menace_resid": e.menace_resid,
            "exposition_resid": e.exposition_resid or ""}

def _eco_from_dict(aid, i, d):
    return AnalysisEco(analysis_id=aid, sort_order=i,
                       pp_id=d.get("pp_id", ""),
                       mesures_existantes=d.get("mesures_existantes", ""),
                       mesures_complementaires=d.get("mesures_complementaires", ""),
                       categorie=d.get("categorie", ""),
                       dep_resid=str(d.get("dep_resid", "")),
                       pen_resid=str(d.get("pen_resid", "")),
                       mat_resid=str(d.get("mat_resid", "")),
                       conf_resid=str(d.get("conf_resid", "")),
                       menace_resid=d.get("menace_resid"),
                       exposition_resid=d.get("exposition_resid", ""))

eco_router = create_entity_router("eco", AnalysisEco, _eco_to_dict, _eco_from_dict)


# ── SOP Detail ────────────────────────────────────────────────────

def _sopd_to_dict(s):
    return {"sop": s.sop or "", "ss": s.ss or "", "phase": s.phase or "",
            "action": s.action or "", "bs": s.bs or "",
            "controle": s.controle or "", "ref": s.ref or "",
            "efficacite": s.efficacite or "", "commentaire": s.commentaire or "",
            "mesure_proposee": s.mesure_proposee or "",
            "type_mesure": s.type_mesure or ""}

def _sopd_from_dict(aid, i, d):
    return AnalysisSOPDetail(analysis_id=aid, sort_order=i,
                             sop=d.get("sop", ""), ss=d.get("ss", ""),
                             phase=d.get("phase", ""), action=d.get("action", ""),
                             bs=d.get("bs", ""), controle=d.get("controle", ""),
                             ref=d.get("ref", ""), efficacite=d.get("efficacite", ""),
                             commentaire=d.get("commentaire", ""),
                             mesure_proposee=d.get("mesure_proposee", ""),
                             type_mesure=d.get("type_mesure", ""))

sop_detail_router = create_entity_router("sop_detail", AnalysisSOPDetail, _sopd_to_dict, _sopd_from_dict)


# ── SOP Summary ──────────────────────────────────────────────────

def _sops_to_dict(s):
    return {"sop": s.sop or "", "ss": s.ss or ""}

def _sops_from_dict(aid, i, d):
    return AnalysisSOPSummary(analysis_id=aid, sort_order=i,
                              sop=d.get("sop", ""), ss=d.get("ss", ""))

sop_summary_router = create_entity_router("sop_summary", AnalysisSOPSummary, _sops_to_dict, _sops_from_dict)


# ── Measures ──────────────────────────────────────────────────────

def _measure_to_dict(m):
    return {"id": m.id, "mesure": m.mesure or "", "details": m.details or "",
            "origine": m.origine or "", "type": m.type or "",
            "sop": m.sop or "", "phase": m.phase or "",
            "effet": m.effet or "", "ref_socle": m.ref_socle or "",
            "responsable": m.responsable or "", "echeance": m.echeance or "",
            "cout": m.cout or "", "statut": m.statut or "",
            "progress_log": m.progress_log or []}

def _measure_from_dict(aid, i, d):
    return AnalysisMeasure(analysis_id=aid, id=d.get("id", ""), sort_order=i,
                           mesure=d.get("mesure", ""), details=d.get("details", ""),
                           origine=d.get("origine", ""), type=d.get("type", ""),
                           sop=d.get("sop", ""), phase=d.get("phase", ""),
                           effet=d.get("effet", ""), ref_socle=d.get("ref_socle", ""),
                           responsable=d.get("responsable", ""),
                           echeance=d.get("echeance", ""),
                           cout=d.get("cout", ""), statut=d.get("statut", ""),
                           progress_log=d.get("progress_log", []))

measures_router = create_entity_router("measures", AnalysisMeasure, _measure_to_dict, _measure_from_dict)


# ── Residuals ─────────────────────────────────────────────────────

def _residual_to_dict(r):
    return {"mesures": r.mesures or "", "v_resid": r.v_resid or "",
            "decision": r.decision or "", "risk_level": r.risk_level or ""}

def _residual_from_dict(aid, i, d):
    return AnalysisResidual(analysis_id=aid, sort_order=i,
                            mesures=d.get("mesures", ""),
                            v_resid=str(d.get("v_resid", "")),
                            decision=d.get("decision", ""),
                            risk_level=d.get("risk_level", ""))

residuals_router = create_entity_router("residuals", AnalysisResidual, _residual_to_dict, _residual_from_dict)


# ── FAIR ──────────────────────────────────────────────────────────

def _fair_to_dict(f):
    return {"lef_min": f.lef_min or "", "lef_likely": f.lef_likely or "",
            "lef_max": f.lef_max or "", "lm_min": f.lm_min or "",
            "lm_likely": f.lm_likely or "", "lm_max": f.lm_max or "",
            "ale_p10": f.ale_p10 or "", "ale_p50": f.ale_p50 or "",
            "ale_p90": f.ale_p90 or "", "ale_mean": f.ale_mean or ""}

def _fair_from_dict(aid, i, d):
    return AnalysisFAIR(analysis_id=aid, sort_order=i,
                        lef_min=str(d.get("lef_min", "")),
                        lef_likely=str(d.get("lef_likely", "")),
                        lef_max=str(d.get("lef_max", "")),
                        lm_min=str(d.get("lm_min", "")),
                        lm_likely=str(d.get("lm_likely", "")),
                        lm_max=str(d.get("lm_max", "")),
                        ale_p10=str(d.get("ale_p10", "")),
                        ale_p50=str(d.get("ale_p50", "")),
                        ale_p90=str(d.get("ale_p90", "")),
                        ale_mean=str(d.get("ale_mean", "")))

fair_router = create_entity_router("fair", AnalysisFAIR, _fair_to_dict, _fair_from_dict)


# ── Gravity Scale ────────────────────────────────────────────────

def _gs_to_dict(g):
    return {"niveau": g.niveau or "", "label": g.label or "",
            "description": g.description or "",
            "impact_financier": g.impact_financier or "",
            "impact_reputation": g.impact_reputation or "",
            "impact_reglementaire": g.impact_reglementaire or "",
            "impact_donnees_perso": g.impact_donnees_perso or "",
            "impact_operationnel": g.impact_operationnel or ""}

def _gs_from_dict(aid, i, d):
    return AnalysisGravityScale(analysis_id=aid, sort_order=i,
                                niveau=str(d.get("niveau", "")),
                                label=d.get("label", ""),
                                description=d.get("description", ""),
                                impact_financier=d.get("impact_financier", ""),
                                impact_reputation=d.get("impact_reputation", ""),
                                impact_reglementaire=d.get("impact_reglementaire", ""),
                                impact_donnees_perso=d.get("impact_donnees_perso", ""),
                                impact_operationnel=d.get("impact_operationnel", ""))

gravity_scale_router = create_entity_router("gravity_scale", AnalysisGravityScale, _gs_to_dict, _gs_from_dict)


# ── Socle ANSSI ──────────────────────────────────────────────────

def _sa_to_dict(s):
    return {"num": s.num or "", "thematique": s.thematique or "",
            "mesure": s.mesure or "", "conformite": s.conformite or "",
            "ecart": s.ecart or "", "mesures_prevues": s.mesures_prevues or "",
            "statut": s.statut or "", "priorite": s.priorite or ""}

def _sa_from_dict(aid, i, d):
    return AnalysisSocleANSSI(analysis_id=aid, sort_order=i,
                              num=d.get("num", ""),
                              thematique=d.get("thematique", ""),
                              mesure=d.get("mesure", ""),
                              conformite=str(d.get("conformite", "")),
                              ecart=d.get("ecart", ""),
                              mesures_prevues=d.get("mesures_prevues", ""),
                              statut=d.get("statut", ""),
                              priorite=d.get("priorite", ""))

socle_anssi_router = create_entity_router("socle_anssi", AnalysisSocleANSSI, _sa_to_dict, _sa_from_dict)


# ── Socle ISO ────────────────────────────────────────────────────

def _si_to_dict(s):
    return {"ref": s.ref or "", "theme": s.theme or "",
            "mesure": s.mesure or "", "applicable": s.applicable or "",
            "conformite": s.conformite or "", "ecart": s.ecart or "",
            "mesures_prevues": s.mesures_prevues or "",
            "statut": s.statut or "", "priorite": s.priorite or ""}

def _si_from_dict(aid, i, d):
    return AnalysisSocleISO(analysis_id=aid, sort_order=i,
                            ref=d.get("ref", ""),
                            theme=d.get("theme", ""),
                            mesure=d.get("mesure", ""),
                            applicable=str(d.get("applicable", "")),
                            conformite=str(d.get("conformite", "")),
                            ecart=d.get("ecart", ""),
                            mesures_prevues=d.get("mesures_prevues", ""),
                            statut=d.get("statut", ""),
                            priorite=d.get("priorite", ""))

socle_iso_router = create_entity_router("socle_iso", AnalysisSocleISO, _si_to_dict, _si_from_dict)


# ── Context (singleton GET/PUT) ──────────────────────────────────

context_router = APIRouter(prefix="/api/analyses/{analysis_id}/context", tags=["analyses"])


@context_router.get("")
async def get_context(
    analysis_id: uuid.UUID,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    analysis = await db.get(Analysis, analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    result = await db.execute(
        select(AnalysisContext).where(AnalysisContext.analysis_id == analysis_id)
    )
    ctx = result.scalar_one_or_none()
    if not ctx:
        return {}
    return {
        "societe": ctx.societe or "", "objet_etude": ctx.objet_etude or "",
        "date": ctx.date or "", "analyste": ctx.analyste or "",
        "reglementation": ctx.reglementation or "", "socle": ctx.socle or "",
        "commentaires": ctx.commentaires or "",
        "date_precedente": ctx.date_precedente or "",
        "evolutions": ctx.evolutions or "",
        "gravite_par_categorie": bool(ctx.gravite_par_categorie),
    }


@context_router.put("")
async def put_context(
    analysis_id: uuid.UUID,
    body: dict[str, Any],
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    analysis = await db.get(Analysis, analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    await db.execute(sa_delete(AnalysisContext).where(AnalysisContext.analysis_id == analysis_id))
    db.add(AnalysisContext(
        analysis_id=analysis_id,
        societe=body.get("societe", ""), objet_etude=body.get("objet_etude", ""),
        date=body.get("date", ""), analyste=body.get("analyste", ""),
        reglementation=body.get("reglementation", ""), socle=body.get("socle", ""),
        commentaires=body.get("commentaires", ""),
        date_precedente=body.get("date_precedente", ""),
        evolutions=body.get("evolutions", ""),
        gravite_par_categorie=bool(body.get("gravite_par_categorie", False)),
    ))
    analysis.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return body


# ── Settings (singleton GET/PUT) ─────────────────────────────────

settings_router = APIRouter(prefix="/api/analyses/{analysis_id}/settings", tags=["analyses"])


@settings_router.get("")
async def get_settings(
    analysis_id: uuid.UUID,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    analysis = await db.get(Analysis, analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    result = await db.execute(
        select(AnalysisSettings).where(AnalysisSettings.analysis_id == analysis_id)
    )
    s = result.scalar_one_or_none()
    if not s:
        return {"socle_type": "anssi"}
    return {"socle_type": s.socle_type or "anssi"}


@settings_router.put("")
async def put_settings(
    analysis_id: uuid.UUID,
    body: dict[str, Any],
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    analysis = await db.get(Analysis, analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    await db.execute(sa_delete(AnalysisSettings).where(AnalysisSettings.analysis_id == analysis_id))
    db.add(AnalysisSettings(
        analysis_id=analysis_id,
        socle_type=body.get("socle_type", "anssi"),
    ))
    analysis.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return body


# ── Risk Matrix (singleton GET/PUT) ──────────────────────────────

risk_matrix_router = APIRouter(prefix="/api/analyses/{analysis_id}/risk_matrix", tags=["analyses"])


@risk_matrix_router.get("")
async def get_risk_matrix(
    analysis_id: uuid.UUID,
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    analysis = await db.get(Analysis, analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    result = await db.execute(
        select(AnalysisRiskMatrix).where(AnalysisRiskMatrix.analysis_id == analysis_id)
    )
    rm = result.scalar_one_or_none()
    return rm.matrix if rm else []


@risk_matrix_router.put("")
async def put_risk_matrix(
    analysis_id: uuid.UUID,
    body: list[dict[str, Any]],
    user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    analysis = await db.get(Analysis, analysis_id)
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")

    await db.execute(sa_delete(AnalysisRiskMatrix).where(AnalysisRiskMatrix.analysis_id == analysis_id))
    db.add(AnalysisRiskMatrix(analysis_id=analysis_id, matrix=body))
    analysis.updated_at = datetime.now(timezone.utc)
    await db.commit()
    return body


# ── All entity routers ───────────────────────────────────────────

all_entity_routers = [
    vm_router, bs_router, pp_router, sr_router, ov_router,
    srov_router, er_router, ss_router, eco_router,
    sop_detail_router, sop_summary_router,
    measures_router, residuals_router, fair_router,
    gravity_scale_router, socle_anssi_router, socle_iso_router,
    context_router, settings_router, risk_matrix_router,
]
