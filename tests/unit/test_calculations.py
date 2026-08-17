"""Unit tests for src/calculations.py — EBIOS RM business calculations."""

from __future__ import annotations

import copy

import pytest

from src.calculations import (
    _DEFAULT_RISK_MATRIX,
    _to_canonical_risk,
    _to_int,
    _to_num,
    compute_analysis_stats,
    compute_exposition,
    compute_menace,
    compute_risk_level,
    compute_socle_priorite,
    compute_socle_statut,
    compute_ss_gravity,
    recalculate_all,
)


# ═══════════════════════════════════════════════════════════════════════
# compute_menace
# ═══════════════════════════════════════════════════════════════════════


class TestComputeMenace:
    """Formula: (P × D) / (M × C)."""

    def test_normal_case(self):
        assert compute_menace(2, 3, 2, 2) == 1.5

    def test_high_threat(self):
        assert compute_menace(4, 4, 1, 1) == 16.0

    def test_low_threat(self):
        assert compute_menace(1, 1, 4, 4) == 0.0625

    def test_symmetric(self):
        assert compute_menace(3, 2, 2, 3) == compute_menace(2, 3, 3, 2)

    def test_equal_values(self):
        assert compute_menace(3, 3, 3, 3) == 1.0

    def test_float_inputs(self):
        result = compute_menace(2.5, 3.0, 1.5, 2.0)
        assert result == pytest.approx(2.5)

    def test_zero_maturite_returns_none(self):
        assert compute_menace(2, 3, 0, 2) is None

    def test_zero_confiance_returns_none(self):
        assert compute_menace(2, 3, 2, 0) is None

    def test_zero_dependance_returns_none(self):
        assert compute_menace(0, 3, 2, 2) is None

    def test_zero_penetration_returns_none(self):
        assert compute_menace(2, 0, 2, 2) is None

    def test_all_zeros_returns_none(self):
        assert compute_menace(0, 0, 0, 0) is None

    def test_none_dependance_returns_none(self):
        # not dependance is True when dependance is None
        assert compute_menace(None, 3, 2, 2) is None

    def test_none_penetration_returns_none(self):
        assert compute_menace(2, None, 2, 2) is None

    def test_none_maturite_returns_none(self):
        assert compute_menace(2, 3, None, 2) is None

    def test_none_confiance_returns_none(self):
        assert compute_menace(2, 3, 2, None) is None

    def test_negative_values_computed(self):
        # Negative values are truthy, so formula is applied
        result = compute_menace(-2, 3, 2, 2)
        assert result == pytest.approx(-1.5)

    def test_very_large_values(self):
        result = compute_menace(100, 100, 1, 1)
        assert result == 10000.0

    def test_very_small_denominator(self):
        result = compute_menace(1, 1, 0.01, 0.01)
        assert result == pytest.approx(10000.0)


# ═══════════════════════════════════════════════════════════════════════
# compute_exposition
# ═══════════════════════════════════════════════════════════════════════


class TestComputeExposition:
    """Exposure label from threat level."""

    def test_none_returns_empty(self):
        assert compute_exposition(None) == ""

    def test_critique_at_4(self):
        assert compute_exposition(4.0) == "Critique"

    def test_critique_above_4(self):
        assert compute_exposition(10.0) == "Critique"

    def test_elevee_at_2(self):
        assert compute_exposition(2.0) == "Élevée"

    def test_elevee_at_3_99(self):
        assert compute_exposition(3.99) == "Élevée"

    def test_moderee_at_1(self):
        assert compute_exposition(1.0) == "Modérée"

    def test_moderee_at_1_99(self):
        assert compute_exposition(1.99) == "Modérée"

    def test_faible_below_1(self):
        assert compute_exposition(0.99) == "Faible"

    def test_faible_at_zero(self):
        assert compute_exposition(0) == "Faible"

    def test_faible_negative(self):
        assert compute_exposition(-1.0) == "Faible"

    def test_boundary_exactly_4(self):
        assert compute_exposition(4) == "Critique"

    def test_boundary_just_below_4(self):
        assert compute_exposition(3.9999) == "Élevée"

    def test_boundary_exactly_2(self):
        assert compute_exposition(2) == "Élevée"

    def test_boundary_just_below_2(self):
        assert compute_exposition(1.9999) == "Modérée"

    def test_boundary_exactly_1(self):
        assert compute_exposition(1) == "Modérée"

    def test_boundary_just_below_1(self):
        assert compute_exposition(0.9999) == "Faible"


# ═══════════════════════════════════════════════════════════════════════
# compute_risk_level
# ═══════════════════════════════════════════════════════════════════════


class TestComputeRiskLevel:
    """Risk level from gravity x likelihood using risk matrix."""

    def test_none_gravity_returns_empty(self):
        assert compute_risk_level(None, 2) == ""

    def test_none_likelihood_returns_empty(self):
        assert compute_risk_level(3, None) == ""

    def test_zero_gravity_returns_empty(self):
        assert compute_risk_level(0, 2) == ""

    def test_zero_likelihood_returns_empty(self):
        assert compute_risk_level(3, 0) == ""

    def test_high_gravity_high_likelihood(self):
        # g=4, l=4 -> "Élevé"
        assert compute_risk_level(4, 4) == "Élevé"

    def test_high_gravity_low_likelihood(self):
        # g=4, l=1 -> "Moyen"
        assert compute_risk_level(4, 1) == "Moyen"

    def test_low_gravity_low_likelihood(self):
        # g=1, l=1 -> "Faible"
        assert compute_risk_level(1, 1) == "Faible"

    def test_low_gravity_high_likelihood(self):
        # g=1, l=4 -> "Moyen"
        assert compute_risk_level(1, 4) == "Moyen"

    def test_mid_gravity_mid_likelihood(self):
        # g=3, l=2 -> "Moyen"
        assert compute_risk_level(3, 2) == "Moyen"

    def test_mid_gravity_high_likelihood(self):
        # g=3, l=4 -> "Élevé"
        assert compute_risk_level(3, 4) == "Élevé"

    def test_g2_l3_moyen(self):
        # g=2, l=3 -> "Moyen"
        assert compute_risk_level(2, 3) == "Moyen"

    def test_g2_l1_faible(self):
        assert compute_risk_level(2, 1) == "Faible"

    def test_gravity_out_of_range(self):
        assert compute_risk_level(5, 2) == ""

    def test_likelihood_out_of_range(self):
        assert compute_risk_level(3, 5) == ""

    def test_negative_likelihood(self):
        # idx = -1 - 1 = -2, not in 0..len
        assert compute_risk_level(3, -1) == ""

    def test_string_gravity_likelihood(self):
        # int() coercion in the function
        assert compute_risk_level("4", "3") == "Élevé"

    def test_custom_matrix(self):
        custom = [
            {"g": 2, "levels": ["Low", "High"]},
            {"g": 1, "levels": ["Low", "Low"]},
        ]
        assert compute_risk_level(2, 2, custom) == "Élevé"  # "High" -> canonical
        assert compute_risk_level(1, 1, custom) == "Faible"  # "Low" -> canonical

    def test_custom_matrix_unknown_label(self):
        custom = [{"g": 1, "levels": ["Inconnu"]}]
        # Unknown labels pass through _to_canonical_risk unchanged
        assert compute_risk_level(1, 1, custom) == "Inconnu"


# ═══════════════════════════════════════════════════════════════════════
# compute_ss_gravity
# ═══════════════════════════════════════════════════════════════════════


class TestComputeSsGravity:
    """Strategic scenario gravity = MAX gravity of linked feared events."""

    def test_empty_er_csv(self):
        assert compute_ss_gravity("", []) == 0

    def test_none_er_csv(self):
        assert compute_ss_gravity(None, []) == 0

    def test_single_match(self):
        events = [{"id": "ER-001", "gravite": 3}]
        assert compute_ss_gravity("ER-001", events) == 3

    def test_multiple_matches_takes_max(self):
        events = [
            {"id": "ER-001", "gravite": 2},
            {"id": "ER-002", "gravite": 4},
        ]
        assert compute_ss_gravity("ER-001, ER-002", events) == 4

    def test_no_matching_events(self):
        events = [{"id": "ER-001", "gravite": 3}]
        assert compute_ss_gravity("ER-099", events) == 0

    def test_partial_id_match_first_5_chars(self):
        # Matching uses first 5 characters
        events = [{"id": "ER-00123", "gravite": 4}]
        assert compute_ss_gravity("ER-00999", events) == 4  # "ER-00" matches "ER-00"

    def test_gravite_none_ignored(self):
        events = [{"id": "ER-001", "gravite": None}]
        assert compute_ss_gravity("ER-001", events) == 0

    def test_gravite_string_converted(self):
        events = [{"id": "ER-001", "gravite": "3"}]
        assert compute_ss_gravity("ER-001", events) == 3

    def test_gravite_invalid_string_ignored(self):
        events = [{"id": "ER-001", "gravite": "abc"}]
        assert compute_ss_gravity("ER-001", events) == 0

    def test_empty_events_list(self):
        assert compute_ss_gravity("ER-001", []) == 0

    def test_csv_with_spaces(self):
        events = [
            {"id": "ER-001", "gravite": 2},
            {"id": "ER-002", "gravite": 3},
        ]
        assert compute_ss_gravity("  ER-001 ,  ER-002  ", events) == 3

    def test_single_event_with_high_gravite(self):
        events = [
            {"id": "ER-001", "gravite": 1},
            {"id": "ER-002", "gravite": 4},
            {"id": "ER-003", "gravite": 2},
        ]
        assert compute_ss_gravity("ER-002", events) == 4

    def test_event_missing_id(self):
        events = [{"gravite": 3}]
        assert compute_ss_gravity("ER-001", events) == 0


# ═══════════════════════════════════════════════════════════════════════
# compute_socle_statut
# ═══════════════════════════════════════════════════════════════════════


class TestComputeSocleStatut:
    """Compliance status from conformity level (0-100)."""

    def test_none_returns_empty(self):
        assert compute_socle_statut(None) == ""

    def test_empty_string_returns_empty(self):
        assert compute_socle_statut("") == ""

    def test_invalid_string_returns_empty(self):
        assert compute_socle_statut("abc") == ""

    def test_zero_non_applique(self):
        assert compute_socle_statut(0) == "Non appliqué"

    def test_one_partiel(self):
        assert compute_socle_statut(1) == "Partiel"

    def test_79_partiel(self):
        assert compute_socle_statut(79) == "Partiel"

    def test_80_applique(self):
        assert compute_socle_statut(80) == "Appliqué"

    def test_100_applique(self):
        assert compute_socle_statut(100) == "Appliqué"

    def test_50_partiel(self):
        assert compute_socle_statut(50) == "Partiel"

    def test_string_75_partiel(self):
        assert compute_socle_statut("75") == "Partiel"

    def test_string_80_applique(self):
        assert compute_socle_statut("80") == "Appliqué"

    def test_string_0_non_applique(self):
        assert compute_socle_statut("0") == "Non appliqué"

    def test_negative_non_applique(self):
        # val <= 0 -> "Non appliqué"
        assert compute_socle_statut(-10) == "Non appliqué"


# ═══════════════════════════════════════════════════════════════════════
# compute_socle_priorite
# ═══════════════════════════════════════════════════════════════════════


class TestComputeSoclePriorite:
    """Priority from gap analysis conformity level."""

    def test_none_returns_empty(self):
        assert compute_socle_priorite(None) == ""

    def test_empty_string_returns_empty(self):
        assert compute_socle_priorite("") == ""

    def test_invalid_string_returns_empty(self):
        assert compute_socle_priorite("xyz") == ""

    def test_zero_haute(self):
        assert compute_socle_priorite(0) == "Haute"

    def test_29_haute(self):
        assert compute_socle_priorite(29) == "Haute"

    def test_30_moyenne(self):
        assert compute_socle_priorite(30) == "Moyenne"

    def test_59_moyenne(self):
        assert compute_socle_priorite(59) == "Moyenne"

    def test_60_basse(self):
        assert compute_socle_priorite(60) == "Basse"

    def test_100_basse(self):
        assert compute_socle_priorite(100) == "Basse"

    def test_string_15_haute(self):
        assert compute_socle_priorite("15") == "Haute"

    def test_string_45_moyenne(self):
        assert compute_socle_priorite("45") == "Moyenne"

    def test_string_80_basse(self):
        assert compute_socle_priorite("80") == "Basse"

    def test_negative_haute(self):
        assert compute_socle_priorite(-5) == "Haute"


# ═══════════════════════════════════════════════════════════════════════
# compute_analysis_stats
# ═══════════════════════════════════════════════════════════════════════


class TestComputeAnalysisStats:
    """Aggregate statistics for an analysis."""

    def test_empty_data(self):
        stats = compute_analysis_stats({})
        assert stats["total_missions"] == 0
        assert stats["total_feared_events"] == 0
        assert stats["total_stakeholders"] == 0
        assert stats["total_threat_scenarios"] == 0
        assert stats["total_operational_scenarios"] == 0
        assert stats["total_risks"] == 0
        assert stats["risk_distribution"] == {"Élevé": 0, "Moyen": 0, "Faible": 0}
        assert stats["avg_threat_level"] is None
        assert stats["socle_compliance_rate"] is None
        assert stats["action_plan_progress"] is None
        assert stats["action_plan_total"] == 0
        assert stats["action_plan_completed"] == 0

    def test_counts_entities(self):
        data = {
            "vm": [{"id": 1}, {"id": 2}],
            "er": [{"id": "ER-001"}],
            "pp": [{"id": 1}, {"id": 2}, {"id": 3}],
            "ss": [{"id": 1}],
            "sop_summary": [{"id": 1}, {"id": 2}],
            "residuals": [{"v_resid": ""}],
        }
        stats = compute_analysis_stats(data)
        assert stats["total_missions"] == 2
        assert stats["total_feared_events"] == 1
        assert stats["total_stakeholders"] == 3
        assert stats["total_threat_scenarios"] == 1
        assert stats["total_operational_scenarios"] == 2
        assert stats["total_risks"] == 1

    def test_action_plan_progress(self):
        data = {
            "measures": [
                {"statut": "Terminé"},
                {"statut": "En cours"},
                {"statut": "Terminé"},
                {"statut": "À étudier"},  # excluded from active
            ],
        }
        stats = compute_analysis_stats(data)
        assert stats["action_plan_total"] == 3  # excludes "À étudier"
        assert stats["action_plan_completed"] == 2
        assert stats["action_plan_progress"] == pytest.approx(66.7, abs=0.1)

    def test_action_plan_all_completed(self):
        data = {
            "measures": [
                {"statut": "Terminé"},
                {"statut": "Terminé"},
            ],
        }
        stats = compute_analysis_stats(data)
        assert stats["action_plan_progress"] == 100.0

    def test_action_plan_none_completed(self):
        data = {
            "measures": [
                {"statut": "En cours"},
                {"statut": "Planifié"},
            ],
        }
        stats = compute_analysis_stats(data)
        assert stats["action_plan_progress"] == 0.0

    def test_action_plan_empty(self):
        data = {"measures": []}
        stats = compute_analysis_stats(data)
        assert stats["action_plan_progress"] is None

    def test_avg_threat_level_single_stakeholder(self):
        data = {
            "pp": [
                {"dependance": 2, "penetration": 4, "maturite": 2, "confiance": 2},
            ],
        }
        stats = compute_analysis_stats(data)
        # menace = (4*2)/(2*2) = 2.0
        assert stats["avg_threat_level"] == 2.0

    def test_avg_threat_level_multiple_stakeholders(self):
        data = {
            "pp": [
                {"dependance": 2, "penetration": 4, "maturite": 2, "confiance": 2},
                {"dependance": 1, "penetration": 1, "maturite": 1, "confiance": 1},
            ],
        }
        stats = compute_analysis_stats(data)
        # menace1 = 2.0, menace2 = 1.0, avg = 1.5
        assert stats["avg_threat_level"] == 1.5

    def test_avg_threat_level_incomplete_stakeholder_skipped(self):
        data = {
            "pp": [
                {"dependance": 2, "penetration": 4, "maturite": 2, "confiance": 2},
                {"dependance": 0, "penetration": 0, "maturite": 0, "confiance": 0},
            ],
        }
        stats = compute_analysis_stats(data)
        # Second stakeholder returns None, skipped; avg = 2.0
        assert stats["avg_threat_level"] == 2.0

    def test_socle_compliance_rate_anssi(self):
        data = {
            "socle_type": "anssi",
            "socle_anssi": [
                {"conformite": 80},
                {"conformite": 60},
                {"conformite": 40},
            ],
        }
        stats = compute_analysis_stats(data)
        assert stats["socle_compliance_rate"] == 60.0

    def test_socle_compliance_rate_iso(self):
        data = {
            "socle_type": "iso",
            "socle_iso": [
                {"conformite": 100},
                {"conformite": 50},
            ],
        }
        stats = compute_analysis_stats(data)
        assert stats["socle_compliance_rate"] == 75.0

    def test_socle_compliance_empty(self):
        data = {"socle_type": "anssi", "socle_anssi": []}
        stats = compute_analysis_stats(data)
        assert stats["socle_compliance_rate"] is None

    def test_socle_compliance_skips_empty_conformite(self):
        data = {
            "socle_type": "anssi",
            "socle_anssi": [
                {"conformite": 80},
                {"conformite": None},
                {"conformite": ""},
            ],
        }
        stats = compute_analysis_stats(data)
        assert stats["socle_compliance_rate"] == 80.0

    def test_risk_distribution(self):
        data = {
            "er": [
                {"id": "ER-001", "gravite": 4},
                {"id": "ER-002", "gravite": 1},
            ],
            "ss": [
                {"er": "ER-001"},
                {"er": "ER-002"},
            ],
            "residuals": [
                {"v_resid": 4},  # g=4, l=4 -> Élevé
                {"v_resid": 1},  # g=1, l=1 -> Faible
            ],
        }
        stats = compute_analysis_stats(data)
        assert stats["risk_distribution"]["Élevé"] == 1
        assert stats["risk_distribution"]["Moyen"] == 1
        assert stats["risk_distribution"]["Faible"] == 0

    def test_risk_distribution_empty_residuals(self):
        data = {
            "er": [{"id": "ER-001", "gravite": 4}],
            "ss": [{"er": "ER-001"}],
            "residuals": [{"v_resid": ""}],  # empty v_resid -> skipped
        }
        stats = compute_analysis_stats(data)
        assert stats["risk_distribution"] == {"Élevé": 0, "Moyen": 0, "Faible": 0}

    def test_does_not_mutate_input(self):
        data = {"vm": [{"id": 1}], "measures": [{"statut": "Terminé"}]}
        original = copy.deepcopy(data)
        compute_analysis_stats(data)
        assert data == original


# ═══════════════════════════════════════════════════════════════════════
# recalculate_all
# ═══════════════════════════════════════════════════════════════════════


class TestRecalculateAll:
    """Full recalculation of all computed fields."""

    def test_stakeholder_menace_and_exposition(self):
        data = {
            "pp": [
                {"dependance": 2, "penetration": 4, "maturite": 2, "confiance": 2},
            ],
        }
        result = recalculate_all(data)
        assert result["pp"][0]["menace"] == 2.0
        assert result["pp"][0]["exposition"] == "Élevée"

    def test_stakeholder_incomplete_data(self):
        data = {
            "pp": [
                {"dependance": 0, "penetration": 0, "maturite": 0, "confiance": 0},
            ],
        }
        result = recalculate_all(data)
        assert result["pp"][0]["menace"] is None
        assert result["pp"][0]["exposition"] == ""

    def test_strategic_scenario_gravity(self):
        data = {
            "er": [{"id": "ER-001", "gravite": 3}],
            "ss": [{"er": "ER-001"}],
        }
        result = recalculate_all(data)
        assert result["ss"][0]["gravite"] == 3

    def test_residuals_padded_to_match_ss(self):
        data = {
            "er": [{"id": "ER-001", "gravite": 2}],
            "ss": [{"er": "ER-001"}, {"er": "ER-001"}],
            "residuals": [],
        }
        result = recalculate_all(data)
        assert len(result["residuals"]) == 2

    def test_residual_risk_level_computed(self):
        data = {
            "er": [{"id": "ER-001", "gravite": 4}],
            "ss": [{"er": "ER-001"}],
            "residuals": [{"v_resid": 4}],
        }
        result = recalculate_all(data)
        assert result["residuals"][0]["risk_level"] == "Élevé"

    def test_socle_anssi_recalculated(self):
        data = {
            "socle_anssi": [
                {"conformite": 90},
                {"conformite": 50},
                {"conformite": 0},
            ],
        }
        result = recalculate_all(data)
        assert result["socle_anssi"][0]["statut"] == "Appliqué"
        assert result["socle_anssi"][1]["statut"] == "Partiel"
        assert result["socle_anssi"][2]["statut"] == "Non appliqué"
        assert result["socle_anssi"][0]["priorite"] == "Basse"
        assert result["socle_anssi"][1]["priorite"] == "Moyenne"
        assert result["socle_anssi"][2]["priorite"] == "Haute"

    def test_eco_map_residual_menace(self):
        data = {
            "eco": [
                {
                    "dep_resid": 2,
                    "pen_resid": 4,
                    "mat_resid": 2,
                    "conf_resid": 2,
                },
            ],
        }
        result = recalculate_all(data)
        assert result["eco"][0]["menace_resid"] == 2.0
        assert result["eco"][0]["exposition_resid"] == "Élevée"

    def test_idempotent(self):
        data = {
            "pp": [
                {"dependance": 2, "penetration": 3, "maturite": 1, "confiance": 1},
            ],
            "er": [{"id": "ER-001", "gravite": 3}],
            "ss": [{"er": "ER-001"}],
            "residuals": [{"v_resid": 2}],
            "socle_anssi": [{"conformite": 50}],
        }
        first = recalculate_all(copy.deepcopy(data))
        second = recalculate_all(copy.deepcopy(first))
        assert first == second


# ═══════════════════════════════════════════════════════════════════════
# _to_canonical_risk
# ═══════════════════════════════════════════════════════════════════════


class TestToCanonicalRisk:
    def test_already_canonical(self):
        assert _to_canonical_risk("Élevé") == "Élevé"

    def test_accent_variant(self):
        assert _to_canonical_risk("Elevé") == "Élevé"

    def test_no_accent(self):
        assert _to_canonical_risk("Eleve") == "Élevé"

    def test_english_high(self):
        assert _to_canonical_risk("High") == "Élevé"

    def test_english_medium(self):
        assert _to_canonical_risk("Medium") == "Moyen"

    def test_english_low(self):
        assert _to_canonical_risk("Low") == "Faible"

    def test_unknown_passthrough(self):
        assert _to_canonical_risk("Custom") == "Custom"


# ═══════════════════════════════════════════════════════════════════════
# _to_num / _to_int helpers
# ═══════════════════════════════════════════════════════════════════════


class TestToNum:
    def test_none(self):
        assert _to_num(None) == 0

    def test_empty_string(self):
        assert _to_num("") == 0

    def test_valid_int(self):
        assert _to_num(3) == 3.0

    def test_valid_float(self):
        assert _to_num(2.5) == 2.5

    def test_string_number(self):
        assert _to_num("3.5") == 3.5

    def test_invalid_string(self):
        assert _to_num("abc") == 0


class TestToInt:
    def test_none(self):
        assert _to_int(None) == 0

    def test_empty_string(self):
        assert _to_int("") == 0

    def test_valid_int(self):
        assert _to_int(3) == 3

    def test_string_int(self):
        assert _to_int("4") == 4

    def test_invalid_string(self):
        assert _to_int("abc") == 0

    def test_float_truncated(self):
        assert _to_int(3.9) == 3
