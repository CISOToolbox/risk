from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


# ── User schemas ──────────────────────────────────────────────────

class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    name: str | None
    picture: str | None
    provider: str
    role: str
    ai_enabled: str
    created_at: datetime
    last_login: datetime | None

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    role: str | None = None
    ai_enabled: str | None = None


class ShareRequest(BaseModel):
    email: str
    permissions: list[str] = ["read"]  # read, edit, delete, share


# ── Analysis schemas ──────────────────────────────────────────────

class AnalysisCreate(BaseModel):
    name: str = ""
    organization: str | None = None
    analyst: str | None = None
    data: dict[str, Any] = Field(default_factory=dict)


class AnalysisUpdate(BaseModel):
    name: str | None = None
    organization: str | None = None
    analyst: str | None = None
    data: dict[str, Any] | None = None
    # FEAT-33 stale-tab guard (see routes/analyses.update_analysis).
    expected_server_rev: int | None = None


class AnalysisResponse(BaseModel):
    id: uuid.UUID
    name: str
    organization: str | None
    analyst: str | None
    owner_id: uuid.UUID | None
    shared_with: list[dict[str, Any]]
    created_at: datetime
    updated_at: datetime
    server_rev: int = 0
    data: dict[str, Any]

    model_config = {"from_attributes": True}


class AnalysisListItem(BaseModel):
    id: uuid.UUID
    name: str
    organization: str | None
    analyst: str | None
    owner_id: uuid.UUID | None
    shared_with: list[dict[str, Any]]
    created_at: datetime
    updated_at: datetime
    vm_count: int = 0
    bs_count: int = 0
    ss_count: int = 0
    measures_count: int = 0

    model_config = {"from_attributes": True}


class AICompleteRequest(BaseModel):
    system: str
    user: str
    provider: str = "anthropic"
    model: str = "claude-sonnet-4-6"


class AICompleteResponse(BaseModel):
    text: str


class AIConfigResponse(BaseModel):
    anthropic_configured: bool
    openai_configured: bool
    gemini_configured: bool = False
    providers: dict[str, dict[str, Any]]


class AIRuntimeResponse(BaseModel):
    managed: bool
    can_use: bool
    provider: str
    model: str
    anthropic_configured: bool
    openai_configured: bool
    gemini_configured: bool = False
    custom_configured: bool = False


class AIConfigUpdate(BaseModel):
    default_provider: str | None = None
    default_model: str | None = None


# ── Analysis stats ───────────────────────────────────────────────

class AnalysisStats(BaseModel):
    total_missions: int
    total_feared_events: int
    total_stakeholders: int
    total_threat_scenarios: int
    total_operational_scenarios: int
    total_risks: int
    risk_distribution: dict[str, int]
    avg_threat_level: float | None
    socle_compliance_rate: float | None
    action_plan_progress: float | None
    action_plan_total: int
    action_plan_completed: int
