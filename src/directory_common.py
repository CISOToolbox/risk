# -----------------------------------------------------------------------------
# REPLICATED from the private shared repository (shared/python/directory_common.py).
# DO NOT EDIT HERE - changes will be overwritten by the next propagation run.
# Fix the master in the shared repository and re-propagate. See CONTRIBUTING.md.
# -----------------------------------------------------------------------------
"""Local personnel directory — standalone fallback for the user picker.

When a module runs WITHOUT Pilot (standalone), `directory_source == 'local'`
and there is no central directory. This master gives each module its own local
personnel base, stored as a JSON list in `app_settings` (key DIRECTORY_KEY) so
**no dedicated table / Alembic migration** is needed.

Copied verbatim into each module's ``src/directory_common.py`` (same manual
mechanism as ``connectors_common.py`` / ``auth_common.py``). The directory route
(``routes/directory_proxy.py``) calls these helpers when the effective source is
'local'; in 'pilot' mode it keeps proxying to Pilot's central directory.

Shape of a person: {id, email, prenom, nom, fonction}. `email` is the identity.
"""
from __future__ import annotations

import json
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models import AppSettings

DIRECTORY_KEY = "directory_personnel"


async def _load(db: AsyncSession) -> list[dict]:
    res = await db.execute(select(AppSettings).where(AppSettings.key == DIRECTORY_KEY))
    row = res.scalar_one_or_none()
    if not row or not row.value:
        return []
    try:
        data = json.loads(row.value)
        return data if isinstance(data, list) else []
    except (ValueError, TypeError):
        return []


async def _save(db: AsyncSession, people: list[dict]) -> None:
    res = await db.execute(select(AppSettings).where(AppSettings.key == DIRECTORY_KEY))
    row = res.scalar_one_or_none()
    payload = json.dumps(people, ensure_ascii=False)
    if row:
        row.value = payload
    else:
        db.add(AppSettings(key=DIRECTORY_KEY, value=payload))
    await db.commit()


async def list_local_personnel(db: AsyncSession) -> list[dict]:
    """Return the local personnel list (empty if none)."""
    return await _load(db)


async def create_local_personnel(db: AsyncSession, body: dict) -> tuple[int, dict]:
    """Create a local person. Returns (status, payload).

    - 400 on invalid input (missing email/name)
    - 409 with the EXISTING person when the email is already present
    - 201 with the created person otherwise
    """
    email = (body.get("email") or "").strip()
    nom = (body.get("nom") or "").strip()
    prenom = (body.get("prenom") or "").strip()
    fonction = (body.get("fonction") or "").strip()
    if not email or "@" not in email:
        return 400, {"detail": "Email valide requis"}
    if not nom and not prenom:
        return 400, {"detail": "Nom ou prénom requis"}

    people = await _load(db)
    for p in people:
        if (p.get("email") or "").lower() == email.lower():
            return 409, p  # duplicate — return existing so the caller can reuse it

    person = {
        "id": uuid.uuid4().hex[:12],
        "email": email,
        "prenom": prenom,
        "nom": nom,
        "fonction": fonction,
    }
    people.append(person)
    await _save(db, people)
    return 201, person
