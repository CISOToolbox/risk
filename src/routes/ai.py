"""Risk (EBIOS RM) AI endpoints.

The shared /api/ai proxy (provider registry, key/settings management,
/complete, /runtime, /config, /keys, /validate-key, the LLM dispatch) lives in
src/ai_proxy_common.py. Only the EBIOS RM métier system prompt and its
suggestion endpoint are here — the methodology stays server-side.
See docs/CHANTIER_IA_BACKEND.md §Phase 2.
"""
from __future__ import annotations

import uuid

from fastapi import Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from src.ai_prompts import PANELS, build_prompt, validate_output
from src.ai_proxy_common import (
    _check_ai_access,
    _check_rate_limit,
    _parse_json_lax,
    _runtime_provider_model,
    call_llm,
    make_ai_router,
)
from src.auth import get_current_user
from src.database import get_db
from src.models import Analysis, User
# _can / _reconstruct_data live in routes/analyses.py: the assistant applies
# EXACTLY the same access control and the same reconstruction as a normal
# analysis read. Redefining them here would make the two paths diverge.
from src.routes.analyses import _can, _reconstruct_data

# Common /api/ai endpoints; the business endpoint below is appended to it.
router = make_ai_router(generic_complete=False)


RISK_SYSTEM_PROMPT = "\n".join([
    "You are an EBIOS Risk Manager (EBIOS RM) specialist following the ANSSI methodology.",
    "You assist in completing risk analyses structured in 5 workshops.",
    "",
    "EBIOS RM structure:",
    "- Workshop 1: Scope & security baseline — Business assets (VM), Supporting assets (BS), Feared events (ER), Security baseline (ANSSI 42 or ISO 27001 Annex A)",
    "- Workshop 2: Risk origins — Risk origins (RO/SR) and Target objectives (TO/OV), assessed as RO/TO pairs with Motivation/Resources/Activity scores (0-4)",
    "- Workshop 3: Strategic scenarios — Stakeholders (PP) with threat assessment (Dependency/Penetration/Maturity/Trust), Strategic scenarios (SS) linking RO/TO → PP → BS → ER",
    "- Workshop 4: Operational scenarios — Kill chains (SOP) using step-by-step method (proche en proche), MITRE ATT&CK techniques, controls assessment (Effective/Partial/Absent)",
    "- Workshop 5: Risk treatment — Security measures registry, residual risk assessment, treatment decisions",
    "",
    "Rules:",
    "- Business assets (VM): critical processes or information, assessed on DICT (Availability, Integrity, Confidentiality, Traceability)",
    "- Supporting assets (BS): IT components supporting VMs (servers, apps, networks, data)",
    "- Feared events (ER): business impact per VM, severity 1-4",
    "- Stakeholders (PP): external actors only (suppliers, partners, clients). Internal employees are NOT stakeholders if the study scope is the entire organization",
    "- RO/TO pairs: Relevance = (Motivation + Resources + Activity) / 12. Priority: P1 (>7), P2 (5-7), Not retained (3-4), Excluded (≤2)",
    "- Strategic scenarios (SS): WHO (RO) attacks WHY (TO) THROUGH WHOM (PP) targeting WHAT (BS) causing WHICH impact (ER). Severity = MAX of linked ER severities",
    "- Kill chains (SOP): step-by-step from entry point (exposed BS) through lateral movement to final target (BS carrying VM). Each phase = elementary action with MITRE ATT&CK technique",
    "- Security measures: prioritize baseline measures first, then ecosystem, then complementary",
    "",
    "IMPORTANT: Always respond in the language specified in the user prompt (French or English).",
    "IMPORTANT: Always respond with valid JSON matching the requested schema. No markdown, no explanation — JSON only.",
    "IMPORTANT: NEVER propose elements that already exist in the analysis. The user prompt includes existing elements — check them carefully and only suggest NEW, DIFFERENT items. Avoid duplicates or near-duplicates (same concept with slightly different wording).",
    "IMPORTANT: When proposing more than 2 items, keep each suggestion concise: short names (max 10 words) and brief details (max 2 sentences). When proposing 1-2 items, you may provide more detailed descriptions.",
    "IMPORTANT: If the user instruction is off-topic, hostile, asks for something outside EBIOS RM, or you cannot fulfil it as suggestions, respond with JSON {\"error\": \"brief explanation in the user's language\"} instead of fabricated content. NEVER smuggle refusals into suggestion fields.",
])


def _parse_lax_or_refuse(text: str):
    """Lax-parse JSON, then surface explicit AI refusals ({"error": "..."}) as
    422 errors so the frontend renders them as an error message rather than a
    suggestion card. SROV / SOP responses (which carry pairs / phases) keep
    going through — a domain-specific guard, hence not the shared version.
    """
    parsed = _parse_json_lax(text)
    if isinstance(parsed, dict) and parsed.get("error") and not parsed.get("pairs") and not parsed.get("phases"):
        raise HTTPException(status_code=422, detail=str(parsed["error"]))
    return parsed


class RiskSuggestRequest(BaseModel):
    """FEAT-41 — the client declares WHAT to suggest, not what to send to the model.

    There is **no** field carrying a pre-composed prompt, and none must
    reappear: see `CLAUDE.md` §5.1 and the contract test
    `test_ai_requests_carry_no_precomposed_prompt`.
    """
    analysis_id: uuid.UUID
    panel: str
    ss_id: str | None = None          # `sop` panel only
    row: int | None = None            # "inline" panels: the targeted row
    language: str = "fr"
    # Two distinct semantics, inherited from the frontend: `custom_instruction`
    # REPLACES the panel's automatic instruction (data and JSON schema kept),
    # `extra_instruction` is ADDED to it ("refine" box).
    custom_instruction: str | None = None
    extra_instruction: str | None = None
    # FEAT-40 — the client expresses an INTENT, not data: the server reads
    # the measure plan from the database. A client can therefore neither
    # fabricate nor truncate it, only ask to do without it.
    include_existing_measures: bool = True


@router.post("/risk/suggest")
async def risk_suggest(body: RiskSuggestRequest,
                       user: User = Depends(get_current_user),
                       db: AsyncSession = Depends(get_db)):
    """Entry point of the EBIOS RM suggestions.

    The server re-reads the analysis from the database and composes the
    prompt itself (FEAT-41). Before, the browser sent the full string: the
    content actually submitted to the provider escaped the server, and
    **no access control on the analysis was possible** — the prompt arrived
    already filled with its data. It is enforced now.
    """
    _check_ai_access(user)
    _check_rate_limit(str(user.id) if user else "anonymous")

    if body.panel not in PANELS:
        raise HTTPException(status_code=422, detail=f"unknown panel '{body.panel}'")

    analysis = await db.get(Analysis, body.analysis_id)
    if analysis is None:
        raise HTTPException(status_code=404, detail="analysis not found")
    # Reading someone else's analysis via the assistant would be a disguised exfiltration.
    if not _can("read", analysis, user):
        raise HTTPException(status_code=403, detail="no access to this analysis")

    D = await _reconstruct_data(db, analysis.id)
    try:
        user_prompt = build_prompt(body.panel, D, body.language, body.ss_id,
                                   body.custom_instruction, body.extra_instruction,
                                   body.row, body.include_existing_measures)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    provider, model = await _runtime_provider_model(db)
    raw = await call_llm(db, RISK_SYSTEM_PROMPT, user_prompt, provider, model)
    # The server ENFORCES the expected shape rather than trusting the
    # model: hostile text stored in the database can hijack it, it cannot
    # get the result through. Unknown fields are discarded here, never
    # forwarded to the UI.
    try:
        return {"result": validate_output(body.panel, _parse_lax_or_refuse(raw))}
    except ValueError as e:
        raise HTTPException(status_code=502, detail=f"unusable AI response: {e}")
