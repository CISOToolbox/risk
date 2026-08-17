import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'src'))

from routes.internal import _normalize_status, _denormalize_status


class TestNormalizeStatus:

    def test_termine_without_accent(self):
        assert _normalize_status("Termine") == "completed"

    def test_termine_with_accent(self):
        assert _normalize_status("Terminé") == "completed"

    def test_completed_passthrough(self):
        assert _normalize_status("completed") == "completed"

    def test_en_cours(self):
        assert _normalize_status("En cours") == "in_progress"

    def test_en_cours_underscore(self):
        assert _normalize_status("en_cours") == "in_progress"

    def test_planifie_without_accent(self):
        assert _normalize_status("Planifie") == "planned"

    def test_planifie_with_accent(self):
        assert _normalize_status("Planifié") == "planned"

    def test_planifie_lowercase(self):
        assert _normalize_status("planifie") == "planned"

    def test_a_etudier_without_accent(self):
        assert _normalize_status("A etudier") == "backlog"

    def test_a_etudier_with_accents(self):
        assert _normalize_status("À étudier") == "backlog"

    def test_unknown_status_passthrough(self):
        assert _normalize_status("custom_status") == "custom_status"

    def test_empty_string(self):
        assert _normalize_status("") == ""


class TestDenormalizeStatus:

    def test_completed(self):
        assert _denormalize_status("completed") == "Terminé"

    def test_in_progress(self):
        assert _denormalize_status("in_progress") == "En cours"

    def test_planned(self):
        assert _denormalize_status("planned") == "Planifié"

    def test_backlog(self):
        assert _denormalize_status("backlog") == "À étudier"

    def test_unknown_passthrough(self):
        assert _denormalize_status("unknown") == "unknown"

    def test_empty_string(self):
        assert _denormalize_status("") == ""


class TestRoundTrip:

    def test_normalize_then_denormalize(self):
        for french in ("Terminé", "En cours", "Planifié", "À étudier"):
            normalized = _normalize_status(french)
            back = _denormalize_status(normalized)
            assert back == french, f"Round-trip failed for {french!r}: {normalized!r} -> {back!r}"

    def test_denormalize_then_normalize(self):
        for english in ("completed", "in_progress", "planned", "backlog"):
            french = _denormalize_status(english)
            back = _normalize_status(french)
            assert back == english, f"Round-trip failed for {english!r}: {french!r} -> {back!r}"
