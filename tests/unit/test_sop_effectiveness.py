"""Regression: the effectiveness of a control counts whatever language it was chosen in.

The select of an operational scenario offered the translated labels as its
values: an English page stored "Partial" and "Effective" where the
likelihood, the weak phases given to the assistant and a French page read
"Partiel" and "Efficace". A step assessed in English counted for nothing.

The stored value is the French one, like the other closed lists; the select
shows its label in the active language, and a value stored in English before
the fix is read as its French equivalent — in the page (compiled
``EBIOS_RM_app.js``, run with ``node``) and in the prompts built by the
server.
"""
from __future__ import annotations

import json
import re
import shutil
import subprocess
from pathlib import Path

import pytest

from src import ai_prompts

APP = Path(__file__).resolve().parents[2] / "app"
# What `_computeSOPVop` needs from the file; the first two exist since the fix.
PIECES = ("var _EFF_CANONICAL", "function _toCanonicalEff(", "function _computeSOPVop(")


def _extract(source: str, marker: str) -> str:
    """Return ``<marker>...{...}`` by brace matching, or nothing when absent."""
    start = source.find(marker)
    if start < 0:
        return ""
    i = source.index("{", start)
    depth = 0
    while True:
        if source[i] == "{":
            depth += 1
        elif source[i] == "}":
            depth -= 1
        i += 1
        if depth == 0:
            return source[start:i] + ";"


def _vop(steps: list[dict]) -> dict:
    source = (APP / "js" / "EBIOS_RM_app.js").read_text(encoding="utf-8")
    script = ("var D = " + json.dumps({"sop_detail": steps}) + ";\n"
              + "\n".join(_extract(source, marker) for marker in PIECES)
              + "\nconsole.log(JSON.stringify(_computeSOPVop()));")
    run = subprocess.run(["node", "-e", script], capture_output=True, text=True, timeout=30)
    assert run.returncode == 0, run.stderr
    return json.loads(run.stdout)


def _steps(*values: str) -> list[dict]:
    return [{"sop": "SOP-01", "ss": "SS-01", "phase": "TA0001", "efficacite": value}
            for value in values]


@pytest.mark.skipif(shutil.which("node") is None, reason="needs node to run the shipped frontend code")
@pytest.mark.parametrize("english, french", [
    (("Partial", "Partial", "Partial"), ("Partiel", "Partiel", "Partiel")),
    (("Effective", "Absent", "Absent"), ("Efficace", "Absent", "Absent")),
    (("Effective", "Effective", "Partial"), ("Efficace", "Efficace", "Partiel")),
])
def test_the_page_counts_a_step_assessed_in_english(english, french):
    counted = _vop(_steps(*english))
    assert counted == _vop(_steps(*french))
    phases = counted["sopPhases"]["SOP-01"]
    assert phases["absent"] + phases["partiel"] + phases["efficace"] == phases["total"] == 3


@pytest.mark.skipif(shutil.which("node") is None, reason="needs node to run the shipped frontend code")
def test_three_partial_controls_make_the_scenario_likely():
    assert _vop(_steps("Partial", "Partial", "Partial"))["sopVop"] == {"SOP-01": 3}


def test_no_select_stores_a_translated_label():
    """`sel(…, [t("…"), …])` stores what the page shows: the value changes with the language."""
    source = (APP / "ts" / "EBIOS_RM_app.ts").read_text(encoding="utf-8")
    found = [f"{number}: {line.strip()[:140]}" for number, line in enumerate(source.splitlines(), 1)
             if re.search(r"\bsel\([^\n]*\[\s*t\(", line)]
    assert not found, "\n".join(found)


def _study(*values: str) -> dict:
    return {"context": {"societe": "MedSecure"},
            "ss": [{"id": "SS-01", "scenario": "Ransomware through the hosting provider"}],
            "sop_detail": [dict(step, action=f"step {n}", bs="BS-01")
                           for n, step in enumerate(_steps(*values))],
            "measures": [], "residuals": [{"mesures": "", "v_init": 3}]}


def test_the_server_reads_the_same_likelihood_in_both_languages():
    assert (ai_prompts._ss_v_init(_study("Partial", "Partial", "Partial"), "SS-01")
            == ai_prompts._ss_v_init(_study("Partiel", "Partiel", "Partiel"), "SS-01") == 3)
    assert (ai_prompts._ss_v_init(_study("Effective", "Effective", "Effective"), "SS-01")
            == ai_prompts._ss_v_init(_study("Efficace", "Efficace", "Efficace"), "SS-01") == 1)


@pytest.mark.parametrize("panel, extra", [("measures", {}), ("residual_ss", {"row": 0})])
def test_the_assistant_is_given_the_weak_phases_assessed_in_english(panel, extra):
    prompt = ai_prompts.build_prompt(panel, _study("Partial", "Effective", "Absent"), **extra)
    assert "step 0" in prompt and "step 2" in prompt
    assert "step 1" not in prompt
    # the prompt names the stored value, the one its instructions use
    assert '"Partiel"' in prompt and '"Partial"' not in prompt
