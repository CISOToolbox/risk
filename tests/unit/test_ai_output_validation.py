"""Le serveur impose la forme de la réponse du modèle.

Aucune consigne de prompt ne garantit qu'un modèle ne sera pas détourné par un
texte hostile stocké en base — et ce texte peut venir de l'extérieur de
l'organisation (un plan d'action rempli par un fournisseur devient une mesure,
donc du contexte). Ce qui est garantissable, c'est que le résultat d'un
détournement ne franchisse pas le serveur.

Trois propriétés, chacune correspondant à un détournement plausible :

  - une réponse **hors sujet** est refusée, pas rendue comme des suggestions
    vides — « rien à proposer » et « le modèle a parlé d'autre chose » ne
    doivent pas se confondre ;
  - les **champs inconnus** sont supprimés, jamais transmis à l'interface, qui
    les afficherait ;
  - les valeurs qui pilotent une ÉCRITURE (`action`, `id`) sont contraintes :
    hors énumération ou hors forme, elles disparaissent, et la suggestion
    retombe sur une création — le comportement le moins destructeur.
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
    """Le détournement le plus simple : faire répondre le modèle sur autre
    chose. Rendre une liste vide passerait pour « rien à proposer »."""
    with pytest.raises(ValueError):
        validate_output("measures", {"reponse": "La capitale de la France est Paris."})
    with pytest.raises(ValueError):
        validate_output("measures", [])
    with pytest.raises(ValueError):
        validate_output("measures", ["juste du texte"])


def test_unknown_fields_never_reach_the_client():
    """L'interface affiche TOUS les champs d'une suggestion (`for k in s`) :
    un champ injecté y serait rendu."""
    out = validate_output("measures", [
        {"mesure": "X", "exfiltration": "secret", "<script>alert(1)</script>": "y",
         "responsable_reel": "attaquant"}])
    assert set(out[0]) == {"mesure"}


def test_an_invented_action_falls_back_to_creation():
    """Une action hors énumération ne doit pas être transmise : le handler la
    comparerait à ses cas connus et créerait — autant que ce soit explicite."""
    out = validate_output("measures", [{"action": "delete_all", "mesure": "X"}])
    assert "action" not in out[0]


def test_a_malformed_id_is_dropped():
    """`id` pilote une ÉCRITURE dans une mesure existante. Hors forme, il
    disparaît, et `enrich` sans id retombe sur une création."""
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
    """srov / sop / residual_ss rendent un objet dont le schéma leur est propre.
    On borne sans filtrer les clés — le frontend ne lit que ce qu'il connaît."""
    out = validate_output("sop", {"ss": "SS-01", "phases": [{"phase": "TA0001"}]})
    assert out["ss"] == "SS-01"
    with pytest.raises(ValueError):
        validate_output("sop", "pas un objet")


def test_every_measure_panel_is_declared():
    """Un panneau absent de la table de champs laisserait passer n'importe quoi.

    Le test le dit : la protection dépend d'une déclaration, et l'oublier en
    ajoutant un panneau la désactive silencieusement pour lui.
    """
    from src.ai_prompts import _CHAMPS
    for panel in ("measures", "socle", "eco", "socle_row", "eco_row", "sop_row"):
        assert panel in _CHAMPS, f"{panel} : aucun filtre de champs"
        assert "action" in _CHAMPS[panel], f"{panel} : le discriminant n'est pas admis"


def test_an_invalid_action_takes_the_id_with_it():
    """Un id valide orphelin retombe dans le chemin historique _updateIfExists
    du frontend — écrasement aveugle de details/sop, sans aperçu. L'action
    invalide doit donc retirer l'id avec elle."""
    out = validate_output("measures", [{"action": "overwrite", "id": "M-01",
                                        "mesure": "x"}])
    assert out == [{"mesure": "x"}]


def test_action_case_is_normalised_not_rejected():
    out = validate_output("measures", [{"action": " Enrich ", "id": "M-01",
                                        "mesure": "x"}])
    assert out[0]["action"] == "enrich" and out[0]["id"] == "M-01"


def test_a_malformed_id_takes_the_action_with_it():
    """Un enrich sans cible valide dégrade en création, jamais en écriture."""
    out = validate_output("measures", [{"action": "enrich", "id": "../../x",
                                        "mesure": "x"}])
    assert out == [{"mesure": "x"}]


def test_unchecked_residual_cards_write_nothing():
    """C1 de la revue 2026-09-02 : _reuseMeasure (qui ÉCRIT dans une mesure
    existante) s'exécutait AVANT le test de case cochée — décocher ne
    bloquait que la création. L'ordre est verrouillé ici, dans le source du
    frontend, faute d'infrastructure de test JS."""
    import os
    ts = os.path.join(os.path.dirname(__file__), "..", "..", "app", "ts",
                      "EBIOS_RM_ai_assistant.ts")
    with open(ts, encoding="utf-8") as f:
        src = f.read()
    # Ancrer sur la collecte des cases cochées : le fichier contient un AUTRE
    # `result.new_measures.forEach` (le rendu des cartes), sans écriture.
    bloc = src[src.find('.ai-resid-new-check:checked'):]
    bloc = bloc[bloc.find("result.new_measures.forEach"):]
    skip = bloc.find("checkedNewIdxs.indexOf(i)")
    reuse = bloc.find("= _reuseMeasure(")   # l'APPEL — un commentaire peut citer le nom
    assert 0 <= skip < reuse, (
        "le test de case cochée doit précéder _reuseMeasure — sinon un enrich "
        "décoché écrit quand même dans la mesure existante")
