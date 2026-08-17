from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Boolean, Column, DateTime, Float, ForeignKey, Index, Integer, String, Text, text,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


# ── Auth & Settings ────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    email = Column(String(255), unique=True, nullable=False)
    name = Column(String(255), nullable=True)
    picture = Column(String(500), nullable=True)
    provider = Column(String(50), nullable=False)
    provider_id = Column(String(255), nullable=False)
    role = Column(String(50), default="user", server_default=text("'user'"))
    ai_enabled = Column(String(5), default="false", server_default=text("'false'"))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=text("NOW()"))
    last_login = Column(DateTime(timezone=True), nullable=True)


class AppSettings(Base):
    __tablename__ = "app_settings"

    key = Column(String(100), primary_key=True)
    value = Column(Text, nullable=False, default="")


# ── Analysis (data column kept for backwards compat, deprecated) ───

class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    name = Column(String(255), nullable=False, default="")
    organization = Column(String(255), nullable=True)
    analyst = Column(String(255), nullable=True)
    owner_id = Column(UUID(as_uuid=True),
                      # SET NULL, not the NO ACTION default: deleting a user must
                      # not be blocked by the objects they happen to own. The
                      # ownership idiom already tolerates a null owner.
                      ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    shared_with = Column(JSONB, nullable=False, default=list, server_default=text("'[]'::jsonb"))
    # FEAT-33 — bumped ONLY by server-initiated writers (Pilot write-back,
    # restore, schedulers). Guards the blob PUT against stale-tab overwrite.
    server_rev = Column(Integer, nullable=False, default=0, server_default=text("0"))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=text("NOW()"))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), server_default=text("NOW()"))

    context_rel = relationship("AnalysisContext", back_populates="analysis", uselist=False, cascade="all, delete-orphan")
    settings_rel = relationship("AnalysisSettings", back_populates="analysis", uselist=False, cascade="all, delete-orphan")
    gravity_scales = relationship("AnalysisGravityScale", back_populates="analysis", cascade="all, delete-orphan", order_by="AnalysisGravityScale.sort_order")
    risk_matrices = relationship("AnalysisRiskMatrix", back_populates="analysis", uselist=False, cascade="all, delete-orphan")
    vms = relationship("AnalysisVM", back_populates="analysis", cascade="all, delete-orphan", order_by="AnalysisVM.sort_order")
    bss = relationship("AnalysisBS", back_populates="analysis", cascade="all, delete-orphan", order_by="AnalysisBS.sort_order")
    pps = relationship("AnalysisPP", back_populates="analysis", cascade="all, delete-orphan", order_by="AnalysisPP.sort_order")
    srs = relationship("AnalysisSR", back_populates="analysis", cascade="all, delete-orphan", order_by="AnalysisSR.sort_order")
    ovs = relationship("AnalysisOV", back_populates="analysis", cascade="all, delete-orphan", order_by="AnalysisOV.sort_order")
    srovs = relationship("AnalysisSROV", back_populates="analysis", cascade="all, delete-orphan", order_by="AnalysisSROV.sort_order")
    ers = relationship("AnalysisER", back_populates="analysis", cascade="all, delete-orphan", order_by="AnalysisER.sort_order")
    sss = relationship("AnalysisSS", back_populates="analysis", cascade="all, delete-orphan", order_by="AnalysisSS.sort_order")
    ecos = relationship("AnalysisEco", back_populates="analysis", cascade="all, delete-orphan", order_by="AnalysisEco.sort_order")
    sop_details = relationship("AnalysisSOPDetail", back_populates="analysis", cascade="all, delete-orphan", order_by="AnalysisSOPDetail.sort_order")
    sop_summaries = relationship("AnalysisSOPSummary", back_populates="analysis", cascade="all, delete-orphan", order_by="AnalysisSOPSummary.sort_order")
    measures = relationship("AnalysisMeasure", back_populates="analysis", cascade="all, delete-orphan", order_by="AnalysisMeasure.sort_order")
    residuals = relationship("AnalysisResidual", back_populates="analysis", cascade="all, delete-orphan", order_by="AnalysisResidual.sort_order")
    fairs = relationship("AnalysisFAIR", back_populates="analysis", cascade="all, delete-orphan", order_by="AnalysisFAIR.sort_order")
    socle_anssis = relationship("AnalysisSocleANSSI", back_populates="analysis", cascade="all, delete-orphan", order_by="AnalysisSocleANSSI.sort_order")
    socle_isos = relationship("AnalysisSocleISO", back_populates="analysis", cascade="all, delete-orphan", order_by="AnalysisSocleISO.sort_order")


# ── Context (1:1) ─────────────────────────────────────────────────

class AnalysisContext(Base):
    __tablename__ = "analysis_context"

    analysis_id = Column(UUID(as_uuid=True), ForeignKey("analyses.id", ondelete="CASCADE"), primary_key=True)
    societe = Column(String(255), nullable=True, default="")
    objet_etude = Column(Text, nullable=True, default="")
    date = Column(String(20), nullable=True, default="")
    analyste = Column(String(255), nullable=True, default="")
    reglementation = Column(Text, nullable=True, default="")
    socle = Column(String(100), nullable=True, default="")
    commentaires = Column(Text, nullable=True, default="")
    date_precedente = Column(String(20), nullable=True, default="")
    evolutions = Column(Text, nullable=True, default="")
    gravite_par_categorie = Column(Boolean, nullable=False, default=False, server_default=text("false"))

    analysis = relationship("Analysis", back_populates="context_rel")


# ── Settings (1:1) ────────────────────────────────────────────────

class AnalysisSettings(Base):
    __tablename__ = "analysis_settings"

    analysis_id = Column(UUID(as_uuid=True), ForeignKey("analyses.id", ondelete="CASCADE"), primary_key=True)
    socle_type = Column(String(50), nullable=True, default="anssi")

    analysis = relationship("Analysis", back_populates="settings_rel")


# ── Gravity Scale ─────────────────────────────────────────────────

class AnalysisGravityScale(Base):
    __tablename__ = "analysis_gravity_scale"

    analysis_id = Column(UUID(as_uuid=True), ForeignKey("analyses.id", ondelete="CASCADE"), primary_key=True)
    sort_order = Column(Integer, primary_key=True)
    niveau = Column(String(20), nullable=True, default="")
    label = Column(String(100), nullable=True, default="")
    description = Column(Text, nullable=True, default="")
    impact_financier = Column(Text, nullable=True, default="")
    impact_reputation = Column(Text, nullable=True, default="")
    impact_reglementaire = Column(Text, nullable=True, default="")
    impact_donnees_perso = Column(Text, nullable=True, default="")
    impact_operationnel = Column(Text, nullable=True, default="")

    analysis = relationship("Analysis", back_populates="gravity_scales")


# ── Risk Matrix (1:1 JSONB) ──────────────────────────────────────

class AnalysisRiskMatrix(Base):
    __tablename__ = "analysis_risk_matrix"

    analysis_id = Column(UUID(as_uuid=True), ForeignKey("analyses.id", ondelete="CASCADE"), primary_key=True)
    matrix = Column(JSONB, nullable=False, default=list, server_default=text("'[]'::jsonb"))

    analysis = relationship("Analysis", back_populates="risk_matrices")


# ── Valeurs Metier (VM) ──────────────────────────────────────────

class AnalysisVM(Base):
    __tablename__ = "analysis_vm"

    analysis_id = Column(UUID(as_uuid=True), ForeignKey("analyses.id", ondelete="CASCADE"), primary_key=True)
    id = Column(String(20), primary_key=True)
    sort_order = Column(Integer, nullable=False, default=0)
    nom = Column(String(500), nullable=True, default="")
    nature = Column(String(255), nullable=True, default="")
    description = Column(Text, nullable=True, default="")
    responsable = Column(String(255), nullable=True, default="")

    analysis = relationship("Analysis", back_populates="vms")


# ── Biens Supports (BS) ─────────────────────────────────────────

class AnalysisBS(Base):
    __tablename__ = "analysis_bs"

    analysis_id = Column(UUID(as_uuid=True), ForeignKey("analyses.id", ondelete="CASCADE"), primary_key=True)
    id = Column(String(20), primary_key=True)
    sort_order = Column(Integer, nullable=False, default=0)
    nom = Column(String(500), nullable=True, default="")
    type = Column(String(255), nullable=True, default="")
    vm = Column(Text, nullable=True, default="")
    localisation = Column(String(500), nullable=True, default="")
    proprietaire = Column(String(255), nullable=True, default="")

    analysis = relationship("Analysis", back_populates="bss")


# ── Parties Prenantes (PP) ───────────────────────────────────────

class AnalysisPP(Base):
    __tablename__ = "analysis_pp"

    analysis_id = Column(UUID(as_uuid=True), ForeignKey("analyses.id", ondelete="CASCADE"), primary_key=True)
    id = Column(String(20), primary_key=True)
    sort_order = Column(Integer, nullable=False, default=0)
    nom = Column(String(500), nullable=True, default="")
    categorie = Column(String(100), nullable=True, default="")
    type = Column(String(255), nullable=True, default="")
    dependance = Column(String(20), nullable=True, default="")
    penetration = Column(String(20), nullable=True, default="")
    maturite = Column(String(20), nullable=True, default="")
    confiance = Column(String(20), nullable=True, default="")
    bs = Column(Text, nullable=True, default="")
    # Computed fields (recalculated server-side)
    menace = Column(Float, nullable=True)
    exposition = Column(String(50), nullable=True, default="")
    _sync = Column("_sync", JSONB, nullable=True)
    certifications = Column(JSONB, nullable=True)

    analysis = relationship("Analysis", back_populates="pps")


# ── Sources de Risque (SR) ───────────────────────────────────────

class AnalysisSR(Base):
    __tablename__ = "analysis_sr"

    analysis_id = Column(UUID(as_uuid=True), ForeignKey("analyses.id", ondelete="CASCADE"), primary_key=True)
    id = Column(String(20), primary_key=True)
    sort_order = Column(Integer, nullable=False, default=0)
    nom = Column(String(500), nullable=True, default="")

    analysis = relationship("Analysis", back_populates="srs")


# ── Objectifs Vises (OV) ────────────────────────────────────────

class AnalysisOV(Base):
    __tablename__ = "analysis_ov"

    analysis_id = Column(UUID(as_uuid=True), ForeignKey("analyses.id", ondelete="CASCADE"), primary_key=True)
    id = Column(String(20), primary_key=True)
    sort_order = Column(Integer, nullable=False, default=0)
    nom = Column(String(500), nullable=True, default="")

    analysis = relationship("Analysis", back_populates="ovs")


# ── Couples SR/OV ────────────────────────────────────────────────

class AnalysisSROV(Base):
    __tablename__ = "analysis_srov"

    analysis_id = Column(UUID(as_uuid=True), ForeignKey("analyses.id", ondelete="CASCADE"), primary_key=True)
    sort_order = Column(Integer, primary_key=True)
    couple = Column(String(50), nullable=True, default="")
    sr_id = Column(String(20), nullable=True, default="")
    ov_id = Column(String(20), nullable=True, default="")
    motivation = Column(Text, nullable=True, default="")
    ressources = Column(Text, nullable=True, default="")
    activite = Column(Text, nullable=True, default="")
    justification = Column(Text, nullable=True, default="")

    analysis = relationship("Analysis", back_populates="srovs")


# ── Evenements Redoutes (ER) ─────────────────────────────────────

class AnalysisER(Base):
    __tablename__ = "analysis_er"

    analysis_id = Column(UUID(as_uuid=True), ForeignKey("analyses.id", ondelete="CASCADE"), primary_key=True)
    id = Column(String(20), primary_key=True)
    sort_order = Column(Integer, nullable=False, default=0)
    evenement = Column(Text, nullable=True, default="")
    vm = Column(Text, nullable=True, default="")
    dict = Column(Text, nullable=True, default="")
    impacts = Column(Text, nullable=True, default="")
    gravite = Column(String(20), nullable=True, default="")
    gravite_cat = Column(JSONB, nullable=True)  # severity per scale category (financier, reputation…)

    analysis = relationship("Analysis", back_populates="ers")


# ── Scenarios Strategiques (SS) ──────────────────────────────────

class AnalysisSS(Base):
    __tablename__ = "analysis_ss"

    analysis_id = Column(UUID(as_uuid=True), ForeignKey("analyses.id", ondelete="CASCADE"), primary_key=True)
    id = Column(String(20), primary_key=True)
    sort_order = Column(Integer, nullable=False, default=0)
    scenario = Column(Text, nullable=True, default="")
    couple_id = Column(String(50), nullable=True, default="")
    couple_desc = Column(Text, nullable=True, default="")
    pp = Column(Text, nullable=True, default="")
    bs = Column(Text, nullable=True, default="")
    er = Column(Text, nullable=True, default="")
    # Computed
    gravite = Column(Integer, nullable=True)

    analysis = relationship("Analysis", back_populates="sss")


# ── Ecosystem (Eco) ──────────────────────────────────────────────

class AnalysisEco(Base):
    __tablename__ = "analysis_eco"

    analysis_id = Column(UUID(as_uuid=True), ForeignKey("analyses.id", ondelete="CASCADE"), primary_key=True)
    sort_order = Column(Integer, primary_key=True)
    pp_id = Column(String(100), nullable=True, default="")
    mesures_existantes = Column(Text, nullable=True, default="")
    mesures_complementaires = Column(Text, nullable=True, default="")
    categorie = Column(String(100), nullable=True, default="")
    dep_resid = Column(String(20), nullable=True, default="")
    pen_resid = Column(String(20), nullable=True, default="")
    mat_resid = Column(String(20), nullable=True, default="")
    conf_resid = Column(String(20), nullable=True, default="")
    # Computed
    menace_resid = Column(Float, nullable=True)
    exposition_resid = Column(String(50), nullable=True, default="")

    analysis = relationship("Analysis", back_populates="ecos")


# ── SOP Detail ───────────────────────────────────────────────────

class AnalysisSOPDetail(Base):
    __tablename__ = "analysis_sop_detail"

    analysis_id = Column(UUID(as_uuid=True), ForeignKey("analyses.id", ondelete="CASCADE"), primary_key=True)
    sort_order = Column(Integer, primary_key=True)
    sop = Column(String(100), nullable=True, default="")
    ss = Column(String(100), nullable=True, default="")
    phase = Column(String(100), nullable=True, default="")
    action = Column(Text, nullable=True, default="")
    bs = Column(Text, nullable=True, default="")
    controle = Column(Text, nullable=True, default="")
    ref = Column(String(255), nullable=True, default="")
    efficacite = Column(String(100), nullable=True, default="")
    commentaire = Column(Text, nullable=True, default="")
    mesure_proposee = Column(Text, nullable=True, default="")
    type_mesure = Column(String(100), nullable=True, default="")

    analysis = relationship("Analysis", back_populates="sop_details")


# ── SOP Summary ──────────────────────────────────────────────────

class AnalysisSOPSummary(Base):
    __tablename__ = "analysis_sop_summary"

    analysis_id = Column(UUID(as_uuid=True), ForeignKey("analyses.id", ondelete="CASCADE"), primary_key=True)
    sort_order = Column(Integer, primary_key=True)
    sop = Column(String(100), nullable=True, default="")
    ss = Column(String(100), nullable=True, default="")

    analysis = relationship("Analysis", back_populates="sop_summaries")


# ── Measures (Plan d'action) ─────────────────────────────────────

class AnalysisMeasure(Base):
    __tablename__ = "analysis_measures"

    analysis_id = Column(UUID(as_uuid=True), ForeignKey("analyses.id", ondelete="CASCADE"), primary_key=True)
    id = Column(String(30), primary_key=True)
    sort_order = Column(Integer, nullable=False, default=0)
    mesure = Column(String(500), nullable=True, default="")
    details = Column(Text, nullable=True, default="")
    origine = Column(String(255), nullable=True, default="")
    type = Column(String(100), nullable=True, default="")
    sop = Column(String(100), nullable=True, default="")
    phase = Column(String(100), nullable=True, default="")
    effet = Column(Text, nullable=True, default="")
    ref_socle = Column(String(255), nullable=True, default="")
    responsable = Column(String(255), nullable=True, default="")
    echeance = Column(String(20), nullable=True, default="")
    cout = Column(String(100), nullable=True, default="")
    statut = Column(String(50), nullable=True, default="")
    progress_log = Column(JSONB, nullable=False, default=list, server_default=text("'[]'::jsonb"))

    analysis = relationship("Analysis", back_populates="measures")

    __table_args__ = (
        Index("ix_analysis_measures_statut", "analysis_id", "statut"),
    )


# ── Residual Risks ───────────────────────────────────────────────

class AnalysisResidual(Base):
    __tablename__ = "analysis_residuals"

    analysis_id = Column(UUID(as_uuid=True), ForeignKey("analyses.id", ondelete="CASCADE"), primary_key=True)
    sort_order = Column(Integer, primary_key=True)
    mesures = Column(Text, nullable=True, default="")
    v_resid = Column(String(20), nullable=True, default="")
    decision = Column(Text, nullable=True, default="")
    # Computed
    risk_level = Column(String(50), nullable=True, default="")

    analysis = relationship("Analysis", back_populates="residuals")


# ── FAIR Analysis ────────────────────────────────────────────────

class AnalysisFAIR(Base):
    __tablename__ = "analysis_fair"

    analysis_id = Column(UUID(as_uuid=True), ForeignKey("analyses.id", ondelete="CASCADE"), primary_key=True)
    sort_order = Column(Integer, primary_key=True)
    lef_min = Column(String(50), nullable=True, default="")
    lef_likely = Column(String(50), nullable=True, default="")
    lef_max = Column(String(50), nullable=True, default="")
    lm_min = Column(String(50), nullable=True, default="")
    lm_likely = Column(String(50), nullable=True, default="")
    lm_max = Column(String(50), nullable=True, default="")
    ale_p10 = Column(String(50), nullable=True, default="")
    ale_p50 = Column(String(50), nullable=True, default="")
    ale_p90 = Column(String(50), nullable=True, default="")
    ale_mean = Column(String(50), nullable=True, default="")

    analysis = relationship("Analysis", back_populates="fairs")


# ── Socle ANSSI ──────────────────────────────────────────────────

class AnalysisSocleANSSI(Base):
    __tablename__ = "analysis_socle_anssi"

    analysis_id = Column(UUID(as_uuid=True), ForeignKey("analyses.id", ondelete="CASCADE"), primary_key=True)
    sort_order = Column(Integer, primary_key=True)
    num = Column(String(20), nullable=True, default="")
    thematique = Column(String(500), nullable=True, default="")
    mesure = Column(Text, nullable=True, default="")
    conformite = Column(String(20), nullable=True, default="")
    ecart = Column(Text, nullable=True, default="")
    mesures_prevues = Column(Text, nullable=True, default="")
    # Computed
    statut = Column(String(50), nullable=True, default="")
    priorite = Column(String(50), nullable=True, default="")

    analysis = relationship("Analysis", back_populates="socle_anssis")


# ── Socle ISO ────────────────────────────────────────────────────

class AnalysisSocleISO(Base):
    __tablename__ = "analysis_socle_iso"

    analysis_id = Column(UUID(as_uuid=True), ForeignKey("analyses.id", ondelete="CASCADE"), primary_key=True)
    sort_order = Column(Integer, primary_key=True)
    ref = Column(String(20), nullable=True, default="")
    theme = Column(String(500), nullable=True, default="")
    mesure = Column(Text, nullable=True, default="")
    applicable = Column(String(20), nullable=True, default="")
    conformite = Column(String(20), nullable=True, default="")
    ecart = Column(Text, nullable=True, default="")
    mesures_prevues = Column(Text, nullable=True, default="")
    # Computed
    statut = Column(String(50), nullable=True, default="")
    priorite = Column(String(50), nullable=True, default="")

    analysis = relationship("Analysis", back_populates="socle_isos")





# ── Append-only server-side write journal (FEAT-30 P1.6) ──────────────
# Created by Base.metadata.create_all at startup (no migration needed for
# a new table). Written via src.audit.log_write — see audit_common master.
class AuditLog(Base):
    """Append-only: never UPDATEd/DELETEd (retention purge excepted).
    entity_type/entity_id tie a line to the exact restorable object."""
    __tablename__ = "audit_log"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()"))
    logged_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), server_default=text("NOW()"), index=True)
    user_email = Column(String(255), nullable=False, default="")
    user_name = Column(String(255), nullable=False, default="")
    action = Column(String(100), nullable=False, index=True)
    target = Column(String(500), nullable=False, default="")
    entity_type = Column(String(50), nullable=False, default="")
    entity_id = Column(String(64), nullable=False, default="", index=True)
    details = Column(Text, nullable=False, default="")
    ip_address = Column(String(64), nullable=False, default="")
