import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'src'))

from routes.internal import _posture_label


class TestPostureLabel:

    def test_score_0(self):
        assert _posture_label(0) == "Faible"

    def test_score_below_40(self):
        assert _posture_label(39) == "Faible"

    def test_score_at_40(self):
        assert _posture_label(40) == "Modéré"

    def test_score_59(self):
        assert _posture_label(59) == "Modéré"

    def test_score_at_60(self):
        assert _posture_label(60) == "Bon"

    def test_score_79(self):
        assert _posture_label(79) == "Bon"

    def test_score_at_80(self):
        assert _posture_label(80) == "Excellent"

    def test_score_100(self):
        assert _posture_label(100) == "Excellent"

    def test_score_none(self):
        assert _posture_label(None) == ""

    def test_boundary_values(self):
        """Verify exact boundary transitions."""
        assert _posture_label(39) == "Faible"
        assert _posture_label(40) == "Modéré"
        assert _posture_label(59) == "Modéré"
        assert _posture_label(60) == "Bon"
        assert _posture_label(79) == "Bon"
        assert _posture_label(80) == "Excellent"

    def test_negative_score(self):
        assert _posture_label(-1) == "Faible"

    def test_high_score(self):
        assert _posture_label(150) == "Excellent"
