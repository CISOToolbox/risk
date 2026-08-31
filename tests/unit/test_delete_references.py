"""Regression guard for reference cleanup when an EBIOS row is deleted.

Nothing cascades in this model: a reference is a **string** of the form
``"VM-001 - Gestion des taux, VM-002 - ..."``. Because the label is copied into
the string, a dead reference keeps displaying the old name — which is exactly
why the inconsistency went unnoticed.

The test runs the **compiled** ``app/js/EBIOS_RM_app.js``, the file the image
serves, so a Python transcription cannot silently diverge from it.

Skipped when ``node`` is unavailable.
"""
from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

import pytest

APP_JS = Path(__file__).resolve().parents[2] / "app" / "js" / "EBIOS_RM_app.js"

HELPERS = ("_refParts", "_partMatches", "_rowIdField", "_findRefsTo", "_stripRefs")
CONSTANT = "_FIELD_TO_SOURCE"

pytestmark = pytest.mark.skipif(
    shutil.which("node") is None, reason="needs node to run the shipped frontend code"
)


def _extract_block(source: str, opener: str, close: str) -> str:
    start = source.find(opener)
    assert start >= 0, f"{opener!r} is gone from EBIOS_RM_app.js — was it renamed?"
    i = source.index("{", start)
    depth = 0
    while True:
        if source[i] == "{":
            depth += 1
        elif source[i] == "}":
            depth -= 1
        i += 1
        if depth == 0:
            return source[start:i] + close


def _harness(data: dict, source_section: str, row_id: str) -> dict:
    src = APP_JS.read_text(encoding="utf-8")
    code = _extract_block(src, "const " + CONSTANT, ";")
    for name in HELPERS:
        code += "\n" + _extract_block(src, "function " + name + "(", "")
    script = (
        code
        + "\nvar D = JSON.parse(process.argv[1]);"
        + "\nvar refs = _findRefsTo(process.argv[2], process.argv[3]);"
        + "\n_stripRefs(refs, process.argv[3]);"
        + "\nprocess.stdout.write(JSON.stringify({refs: refs, D: D}));"
    )
    out = subprocess.run(
        ["node", "-e", script, "--", json.dumps(data), source_section, row_id],
        capture_output=True, text=True, timeout=30, check=True,
    )
    return json.loads(out.stdout)


def test_deleting_a_mission_clears_it_from_supports_and_events():
    data = {
        "vm": [{"id": "VM-001"}],
        "bs": [{"id": "BS-001", "vm": "VM-001 - Paie, VM-002 - Achats"}],
        "er": [{"id": "ER-001", "vm": "VM-001 - Paie"}],
    }
    r = _harness(data, "vm", "VM-001")
    assert len(r["refs"]) == 2
    assert r["D"]["bs"][0]["vm"] == "VM-002 - Achats"
    assert r["D"]["er"][0]["vm"] == ""


def test_a_row_nobody_references_reports_nothing():
    data = {"vm": [{"id": "VM-009"}], "bs": [{"id": "BS-001", "vm": "VM-001 - Paie"}]}
    assert _harness(data, "vm", "VM-009")["refs"] == []


def test_matching_is_exact_not_a_prefix():
    """Past 999 rows, VM-100 would prefix VM-1000."""
    data = {"bs": [{"id": "BS-001", "vm": "VM-1000 - Grande"}]}
    r = _harness(data, "vm", "VM-100")
    assert r["refs"] == []
    assert r["D"]["bs"][0]["vm"] == "VM-1000 - Grande"


def test_a_bare_identifier_reference_is_cleared():
    """srov.sr_id holds the id alone, with no label appended."""
    data = {"srov": [{"couple": "SR/OV-001", "sr_id": "SR-002", "ov_id": "OV-001"}]}
    r = _harness(data, "sr", "SR-002")
    assert len(r["refs"]) == 1
    assert r["D"]["srov"][0]["sr_id"] == ""
    assert r["D"]["srov"][0]["ov_id"] == "OV-001"


def test_a_row_identified_by_its_reference_is_deleted_not_blanked():
    """An eco row is keyed by pp_id: blanking it would leave a row with no identity."""
    data = {
        "pp": [{"id": "PP-001"}, {"id": "PP-002"}],
        "eco": [{"pp_id": "PP-001", "categorie": "x"}, {"pp_id": "PP-002", "categorie": "y"}],
    }
    r = _harness(data, "pp", "PP-001")
    assert [row["pp_id"] for row in r["D"]["eco"]] == ["PP-002"]


def test_several_rows_deleted_at_once_do_not_shift_each_other():
    data = {
        "pp": [{"id": "PP-001"}],
        "eco": [
            {"pp_id": "PP-001", "categorie": "a"},
            {"pp_id": "PP-001", "categorie": "b"},
            {"pp_id": "PP-007", "categorie": "c"},
        ],
    }
    r = _harness(data, "pp", "PP-001")
    assert [row["categorie"] for row in r["D"]["eco"]] == ["c"]
