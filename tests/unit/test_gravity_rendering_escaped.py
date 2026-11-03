"""Regression: the frontend escapes the severity scale and the matrix rows.

`niveau`, the scale label and the matrix row `g` were interpolated raw into
the context page (level chip, matrix row heading), the feared-event selects
and the shared `sel()` helper; the SOP generation panel interpolated the
strategic scenario id raw into its loading message. Every template
interpolation that reads one of them must go through esc() (a comparison
that only yields "selected" is fine).

Checked in the TypeScript source and in the compiled JavaScript the page
loads (ES2021 keeps template literals), so a stale build fails too.
"""
import pathlib
import re

import pytest

APP = pathlib.Path(__file__).resolve().parents[2] / "app"
SOURCES = [APP / d / (stem + ext) for d, ext in (("ts", ".ts"), ("js", ".js"))
           for stem in ("EBIOS_RM_app", "EBIOS_RM_ai_assistant")]

# Values read from the stored scale / matrix.
TAINTED = re.compile(r"\.niveau\b|\brow\.g\b|\bgLbl\b")
# Calls whose output is safe: esc() itself, the badge (escapes its text) and
# the chip colours (a level clamped to 1..5 picks a fixed token).
SAFE_CALL = re.compile(r"\b(?:esc|_gravBadge|gravColor|gravTextColor)\((?:[^()]|\([^()]*\))*\)")


def _interpolations(src: str):
    """Yield (line, expr) for every ${…} of a template literal (one level of braces)."""
    for m in re.finditer(r"\$\{((?:[^{}]|\{[^{}]*\})*)\}", src):
        yield src.count("\n", 0, m.start()) + 1, m.group(1).strip()


def _src(path: pathlib.Path) -> str:
    return path.read_text(encoding="utf-8")


@pytest.mark.parametrize("path", SOURCES, ids=lambda p: f"{p.parent.name}/{p.name}")
def test_scale_values_are_escaped_in_templates(path):
    bad = []
    for line, expr in _interpolations(_src(path)):
        if "===" in expr:
            continue
        if TAINTED.search(SAFE_CALL.sub("", expr)):
            bad.append(f"{path.name}:{line}: ${{{expr}}}")
    assert bad == []


@pytest.mark.parametrize("path", [p for p in SOURCES if p.stem == "EBIOS_RM_app"], ids=lambda p: p.name)
def test_sel_helper_escapes_its_options(path):
    src = _src(path)
    body = src[src.index("function sel("):src.index("function ta(")]
    assert 'value="${esc(o)}"' in body and "${o}" not in body


@pytest.mark.parametrize("path", [p for p in SOURCES if p.stem == "EBIOS_RM_ai_assistant"], ids=lambda p: p.name)
def test_sop_loading_message_escapes_the_scenario_id(path):
    src = _src(path)
    assert re.search(r't\("ai\.generating_sop", \{\s*id: esc\(ssId\)\s*\}\)', src)
    assert not re.search(r't\("ai\.generating_sop", \{\s*id: ssId\s*\}\)', src)
