"""EBIOS RM — Server-side calculation functions.

Ports the authoritative calculation logic from the browser JS
(EBIOS_RM_app.js) into Python so the backend can enforce consistency.
"""

from __future__ import annotations


# ── Risk level canonical mapping (mirrors _RISK_CANONICAL in JS) ─────
_RISK_CANONICAL: dict[str, str] = {
    "Élevé": "Élevé",
    "Elevé": "Élevé",
    "Eleve": "Élevé",
    "High": "Élevé",
    "Moyen": "Moyen",
    "Medium": "Moyen",
    "Faible": "Faible",
    "Low": "Faible",
}


def _to_canonical_risk(val: str) -> str:
    return _RISK_CANONICAL.get(val, val)


# ═════════════════════════════════════════════════════════════════════
# INDIVIDUAL CALCULATIONS
# ═════════════════════════════════════════════════════════════════════

def compute_menace(
    dependance: float,
    penetration: float,
    maturite: float,
    confiance: float,
) -> float | None:
    """Threat level = (P × D) / (M × C).

    Returns None when any parameter is zero or falsy (incomplete data).
    """
    if not dependance or not penetration or not maturite or not confiance:
        return None
    return (penetration * dependance) / (maturite * confiance)


def compute_exposition(menace: float | None) -> str:
    """Exposure label from threat level.

    Returns canonical French labels (language-independent storage).
    """
    if menace is None:
        return ""
    if menace >= 4:
        return "Critique"
    if menace >= 2:
        return "Élevée"
    if menace >= 1:
        return "Modérée"
    return "Faible"


def compute_risk_level(
    gravity: int | None,
    likelihood: int | None,
    risk_matrix: list[dict] | None = None,
) -> str:
    """Risk level from gravity × likelihood using the analysis risk matrix.

    Falls back to the default EBIOS RM matrix when *risk_matrix* is not
    provided.
    """
    if not gravity or not likelihood:
        return ""

    matrix = risk_matrix or _DEFAULT_RISK_MATRIX

    for row in matrix:
        try:
            if int(row["g"]) == int(gravity):
                levels = row.get("levels", [])
                idx = int(likelihood) - 1
                if 0 <= idx < len(levels):
                    return _to_canonical_risk(levels[idx])
        except (ValueError, TypeError, IndexError):
            continue
    return ""


def compute_ss_gravity(
    er_csv: str,
    feared_events: list[dict],
) -> int:
    """Strategic scenario gravity = MAX gravity of linked feared events.

    *er_csv* is a comma-separated string of ER ids (e.g. "ER-001, ER-002").
    Each id is matched by the first 5 characters.
    """
    if not er_csv:
        return 0
    ids = [s.strip()[:5] for s in er_csv.split(",")]
    max_g = 0
    for eid in ids:
        for er in feared_events:
            if er.get("id", "")[:5] == eid:
                g = er.get("gravite")
                if g is not None:
                    try:
                        g = int(g)
                    except (ValueError, TypeError):
                        continue
                    if g > max_g:
                        max_g = g
    return max_g


def compute_socle_statut(conformite: str | int | None) -> str:
    """Compliance status from conformity level (0-100)."""
    if conformite is None or conformite == "":
        return ""
    try:
        val = int(conformite)
    except (ValueError, TypeError):
        return ""
    if val >= 80:
        return "Appliqué"
    if val > 0:
        return "Partiel"
    return "Non appliqué"


def compute_socle_priorite(conformite: str | int | None) -> str:
    """Priority from gap analysis conformity level."""
    if conformite is None or conformite == "":
        return ""
    try:
        val = int(conformite)
    except (ValueError, TypeError):
        return ""
    if val < 30:
        return "Haute"
    if val < 60:
        return "Moyenne"
    return "Basse"


# ═════════════════════════════════════════════════════════════════════
# AGGREGATE STATISTICS
# ═════════════════════════════════════════════════════════════════════

def compute_analysis_stats(data: dict) -> dict:
    """Compute all summary statistics for an analysis.

    Returns a flat dict suitable for the AnalysisStats response schema.
    This is a read-only operation — *data* is NOT mutated.
    """
    vm = data.get("vm") or []
    bs = data.get("bs") or []
    pp = data.get("pp") or []
    er = data.get("er") or []
    ss = data.get("ss") or []
    sop_summary = data.get("sop_summary") or []
    sop_detail = data.get("sop_detail") or []
    measures = data.get("measures") or []
    residuals = data.get("residuals") or []
    risk_matrix = data.get("risk_matrix") or _DEFAULT_RISK_MATRIX

    # ── Risk distribution ────────────────────────────────────────
    dist: dict[str, int] = {"Élevé": 0, "Moyen": 0, "Faible": 0}
    for i, s in enumerate(ss):
        g = compute_ss_gravity(s.get("er", ""), er)
        res = residuals[i] if i < len(residuals) else {}
        v = res.get("v_resid") if res else None
        if v:
            level = compute_risk_level(g, v, risk_matrix)
            canonical = _to_canonical_risk(level) if level else ""
            if canonical in dist:
                dist[canonical] += 1

    # ── Average threat level (menace) across stakeholders ────────
    menace_values: list[float] = []
    for p in pp:
        m = compute_menace(
            _to_num(p.get("dependance")),
            _to_num(p.get("penetration")),
            _to_num(p.get("maturite")),
            _to_num(p.get("confiance")),
        )
        if m is not None:
            menace_values.append(m)
    avg_menace = (
        round(sum(menace_values) / len(menace_values), 2)
        if menace_values
        else None
    )

    # ── Socle compliance rate ────────────────────────────────────
    socle_type = data.get("socle_type", "anssi")
    socle = data.get("socle_anssi" if socle_type != "iso" else "socle_iso") or []
    socle_total = 0
    socle_sum = 0.0
    for s in socle:
        conf = s.get("conformite")
        if conf is not None and conf != "":
            try:
                socle_sum += float(conf)
                socle_total += 1
            except (ValueError, TypeError):
                pass
    socle_rate = round(socle_sum / socle_total, 1) if socle_total else None

    # ── Action plan progress ─────────────────────────────────────
    active_measures = [m for m in measures if m.get("statut") != "À étudier"]
    plan_total = len(active_measures)
    plan_completed = sum(
        1 for m in active_measures if m.get("statut") == "Terminé"
    )
    plan_progress = (
        round(plan_completed / plan_total * 100, 1)
        if plan_total
        else None
    )

    return {
        "total_missions": len(vm),
        "total_feared_events": len(er),
        "total_stakeholders": len(pp),
        "total_threat_scenarios": len(ss),
        "total_operational_scenarios": len(sop_summary),
        "total_risks": len(residuals),
        "risk_distribution": dist,
        "avg_threat_level": avg_menace,
        "socle_compliance_rate": socle_rate,
        "action_plan_progress": plan_progress,
        "action_plan_total": plan_total,
        "action_plan_completed": plan_completed,
    }


# ═════════════════════════════════════════════════════════════════════
# FULL RECALCULATION
# ═════════════════════════════════════════════════════════════════════

def recalculate_all(data: dict) -> dict:
    """Recalculate ALL computed fields in the analysis data.

    Walks through stakeholders, scenarios, risks and updates computed
    values.  Returns the updated *data* dict (mutated in place for
    efficiency — caller should pass a deep copy if needed).

    This function is **idempotent**: calling it twice with the same
    input produces the same output.
    """
    pp = data.get("pp") or []
    er = data.get("er") or []
    ss = data.get("ss") or []
    residuals = data.get("residuals") or []
    risk_matrix = data.get("risk_matrix") or _DEFAULT_RISK_MATRIX

    # ── 1. Stakeholders: menace + exposition ─────────────────────
    for p in pp:
        menace = compute_menace(
            _to_num(p.get("dependance")),
            _to_num(p.get("penetration")),
            _to_num(p.get("maturite")),
            _to_num(p.get("confiance")),
        )
        p["menace"] = round(menace, 2) if menace is not None else None
        p["exposition"] = compute_exposition(menace)

    # ── 2. Strategic scenarios: gravity from linked ER ───────────
    for s in ss:
        g = compute_ss_gravity(s.get("er", ""), er)
        s["gravite"] = g if g else None

    # ── 3. Residual risks: risk level from gravity × v_resid ─────
    #    Ensure residuals list matches ss length
    while len(residuals) < len(ss):
        residuals.append({"mesures": "", "v_resid": "", "decision": ""})
    data["residuals"] = residuals

    for i, s in enumerate(ss):
        if i >= len(residuals):
            break
        res = residuals[i]
        g = s.get("gravite") or compute_ss_gravity(s.get("er", ""), er)
        v = _to_int(res.get("v_resid"))
        res["risk_level"] = compute_risk_level(g, v, risk_matrix) if g and v else ""

    # ── 4. Socle: statut + priorite ──────────────────────────────
    _recalc_socle(data.get("socle_anssi") or [])
    _recalc_socle(data.get("socle_iso") or [])

    # ── 5. Eco map: menace résiduelle ────────────────────────────
    eco = data.get("eco") or []
    for e in eco:
        menace = compute_menace(
            _to_num(e.get("dep_resid")),
            _to_num(e.get("pen_resid")),
            _to_num(e.get("mat_resid")),
            _to_num(e.get("conf_resid")),
        )
        e["menace_resid"] = round(menace, 2) if menace is not None else None
        e["exposition_resid"] = compute_exposition(menace)

    return data


# ═════════════════════════════════════════════════════════════════════
# PRIVATE HELPERS
# ═════════════════════════════════════════════════════════════════════

_DEFAULT_RISK_MATRIX: list[dict] = [
    {"g": 4, "levels": ["Moyen", "Moyen", "Élevé", "Élevé"]},
    {"g": 3, "levels": ["Faible", "Moyen", "Moyen", "Élevé"]},
    {"g": 2, "levels": ["Faible", "Faible", "Moyen", "Moyen"]},
    {"g": 1, "levels": ["Faible", "Faible", "Faible", "Moyen"]},
]


def _to_num(val) -> float:
    """Convert a value to float, returning 0 on failure."""
    if val is None or val == "":
        return 0
    try:
        return float(val)
    except (ValueError, TypeError):
        return 0


def _to_int(val) -> int:
    """Convert a value to int, returning 0 on failure."""
    if val is None or val == "":
        return 0
    try:
        return int(val)
    except (ValueError, TypeError):
        return 0


def _recalc_socle(socle: list[dict]) -> None:
    """Recalculate statut and priorite for a socle list (ANSSI or ISO)."""
    for s in socle:
        conf = s.get("conformite")
        s["statut"] = compute_socle_statut(conf)
        s["priorite"] = compute_socle_priorite(conf)
