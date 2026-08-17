"""Test that the pilot notify payload uses measure.mesure (not measure.titre)
for the title field. This locks a bug fix where `titre` was used but the
AnalysisMeasure model has `mesure` as the field name."""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'src'))

import ast
import inspect
import textwrap

from models import AnalysisMeasure


class TestMeasureModelField:

    def test_model_has_mesure_field(self):
        """AnalysisMeasure must have a `mesure` column."""
        assert hasattr(AnalysisMeasure, "mesure")

    def test_model_has_no_titre_field(self):
        """AnalysisMeasure must NOT have a `titre` column. The field is `mesure`."""
        assert not hasattr(AnalysisMeasure, "titre")


class TestPatchMeasurePayloadUsesCorrectField:
    """Verify that internal.py patch_measure builds the notify payload
    using `measure.mesure`, not `measure.titre`."""

    def test_patch_measure_uses_mesure_not_titre(self):
        source_path = os.path.join(
            os.path.dirname(__file__), '..', '..', 'src', 'routes', 'internal.py'
        )
        with open(source_path) as f:
            source = f.read()

        tree = ast.parse(source)
        patch_fn = None
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                if node.name == "patch_measure":
                    patch_fn = node
                    break

        assert patch_fn is not None, "patch_measure function not found in internal.py"

        fn_source = ast.get_source_segment(source, patch_fn)

        assert "measure.mesure" in fn_source, (
            "patch_measure must use `measure.mesure` for the title field"
        )
        assert "measure.titre" not in fn_source, (
            "patch_measure must NOT use `measure.titre` (bug: field does not exist)"
        )

    def test_internal_measures_uses_mesure_for_title(self):
        """The GET /internal/measures endpoint must also use m.mesure."""
        source_path = os.path.join(
            os.path.dirname(__file__), '..', '..', 'src', 'routes', 'internal.py'
        )
        with open(source_path) as f:
            source = f.read()

        tree = ast.parse(source)
        fn = None
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                if node.name == "internal_measures":
                    fn = node
                    break

        assert fn is not None, "internal_measures function not found"

        fn_source = ast.get_source_segment(source, fn)
        assert "m.mesure" in fn_source, (
            "internal_measures must use `m.mesure` for the title field"
        )
