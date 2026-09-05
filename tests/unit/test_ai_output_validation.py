"""The server enforces the shape of the model's response.

No prompt instruction guarantees that a model will not be hijacked by
hostile text stored in the database — and that text can come from outside
the organization (an action plan filled in by a vendor becomes a measure,
hence context). What IS guarantee-able is that the result of a hijack does
not get past the server.

Three properties, each matching a plausible hijack:

  - an **off-topic** response is refused, not rendered as empty
    suggestions — "nothing to suggest" and "the model talked about
    something else" must not be conflated;
  - **unknown fields** are removed, never forwarded to the UI, which
    would display them;
  - values that drive a WRITE (`action`, `id`) are constrained: outside
    the enumeration or malformed, they disappear, and the suggestion
    falls back to a creation — the least destructive behavior.
"""
from __future__ import annotations

import os
import sys

import pytest

os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://u:p@127.0.0.1:5999/t")
os.environ.setdefault("MODULE_NAME", "risk")
os.environ.setdefault("JWT_SECRET", "x" * 32)
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))

from src.ai_prompts import MAX_SUGGESTIONS, validate_output  # noqa: E402


def test_a_legitimate_answer_passes_untouched():
    out = validate_output("measures", [
        {"action": "new", "mesure": "MFA", "details": "détail", "origine": "Socle"}])
    assert out[0]["mesure"] == "MFA"
    assert out[0]["action"] == "new"


def test_an_off_topic_answer_is_refused():
    """The simplest hijack: make the model answer about something else.
    Returning an empty list would look like "nothing to suggest"."""
    with pytest.raises(ValueError):
        validate_output("measures", {"reponse": "La capitale de la France est Paris."})
    with pytest.raises(ValueError):
        validate_output("measures", [])
    with pytest.raises(ValueError):
        validate_output("measures", ["juste du texte"])


def test_unknown_fields_never_reach_the_client():
    """The UI displays ALL fields of a suggestion (`for k in s`):
    an injected field would be rendered there."""
    out = validate_output("measures", [
        {"mesure": "X", "exfiltration": "secret", "<script>alert(1)</script>": "y",
         "responsable_reel": "attaquant"}])
    assert set(out[0]) == {"mesure"}


def test_an_invented_action_falls_back_to_creation():
    """An action outside the enumeration must not be forwarded: the handler
    would compare it to its known cases and create — better be explicit."""
    out = validate_output("measures", [{"action": "delete_all", "mesure": "X"}])
    assert "action" not in out[0]


def test_a_malformed_id_is_dropped():
    """`id` drives a WRITE into an existing measure. Malformed, it
    disappears, and `enrich` without an id falls back to a creation."""
    out = validate_output("measures", [
        {"action": "enrich", "id": "'; DROP TABLE mesures--", "mesure": "X"}])
    assert "id" not in out[0]
    out2 = validate_output("measures", [{"action": "enrich", "id": "M-01", "mesure": "X"}])
    assert out2[0]["id"] == "M-01"


def test_the_number_of_suggestions_is_capped():
    out = validate_output("measures", [{"mesure": f"M{i}"} for i in range(300)])
    assert len(out) == MAX_SUGGESTIONS


def test_a_huge_field_is_capped():
    out = validate_output("measures", [{"mesure": "X", "details": "a" * 100000}])
    assert len(out[0]["details"]) < 100000


def test_panels_with_a_nested_shape_are_bounded_not_filtered():
    """srov / sop / residual_ss return an object with a schema of their own.
    We bound without filtering keys — the frontend only reads what it knows."""
    out = validate_output("sop", {"ss": "SS-01", "phases": [{"phase": "TA0001"}]})
    assert out["ss"] == "SS-01"
    with pytest.raises(ValueError):
        validate_output("sop", "pas un objet")


def test_every_measure_panel_is_declared():
    """A panel missing from the fields table would let anything through.

    The test says it: the protection depends on a declaration, and
    forgetting it when adding a panel silently disables it for that panel.
    """
    from src.ai_prompts import _CHAMPS
    for panel in ("measures", "socle", "eco", "socle_row", "eco_row", "sop_row"):
        assert panel in _CHAMPS, f"{panel} : aucun filtre de champs"
        assert "action" in _CHAMPS[panel], f"{panel} : le discriminant n'est pas admis"


def test_an_invalid_action_takes_the_id_with_it():
    """An orphaned valid id falls back into the frontend's legacy
    _updateIfExists path — blind overwrite of details/sop, with no preview.
    The invalid action must therefore take the id with it."""
    out = validate_output("measures", [{"action": "overwrite", "id": "M-01",
                                        "mesure": "x"}])
    assert out == [{"mesure": "x"}]


def test_action_case_is_normalised_not_rejected():
    out = validate_output("measures", [{"action": " Enrich ", "id": "M-01",
                                        "mesure": "x"}])
    assert out[0]["action"] == "enrich" and out[0]["id"] == "M-01"


def test_a_malformed_id_takes_the_action_with_it():
    """An enrich without a valid target degrades to a creation, never a write."""
    out = validate_output("measures", [{"action": "enrich", "id": "../../x",
                                        "mesure": "x"}])
    assert out == [{"mesure": "x"}]


def test_unchecked_residual_cards_write_nothing():
    """C1 of the 2026-09-02 review: _reuseMeasure (which WRITES into an
    existing measure) ran BEFORE the checked-box test — unchecking only
    blocked the creation. The order is locked here, in the frontend
    source, for lack of a JS test infrastructure."""
    import os
    ts = os.path.join(os.path.dirname(__file__), "..", "..", "app", "ts",
                      "EBIOS_RM_ai_assistant.ts")
    with open(ts, encoding="utf-8") as f:
        src = f.read()
    # Anchor on the checked-box collection: the file contains ANOTHER
    # `result.new_measures.forEach` (the card rendering), with no write.
    bloc = src[src.find('.ai-resid-new-check:checked'):]
    bloc = bloc[bloc.find("result.new_measures.forEach"):]
    skip = bloc.find("checkedNewIdxs.indexOf(i)")
    reuse = bloc.find("= _reuseMeasure(")   # the CALL — a comment may cite the name
    assert 0 <= skip < reuse, (
        "le test de case cochée doit précéder _reuseMeasure — sinon un enrich "
        "décoché écrit quand même dans la mesure existante")
