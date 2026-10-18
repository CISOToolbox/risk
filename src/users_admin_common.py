# -----------------------------------------------------------------------------
# Generated file - do not edit.
# It is overwritten at every release; a change made here is lost.
# See CONTRIBUTING.md.
# -----------------------------------------------------------------------------
"""User administration router shared by the backend modules.

Identical copy in the ``src/`` of every module that mounts it (no runtime
shared dependency); keep the copies identical — the next release overwrites
them.

In the suite, Pilot owns the accounts and the per-module roles: this router
then only says so (``managed``) and refuses writes with 409. In standalone
(``AUTH_MODE != "pilot"``) it is how the module's admin runs its accounts:

- every account, with its state — ``active``, ``pending`` (signed in once,
  awaits approval) or ``disabled``;
- grant a role of the module's ladder (``auth_common.MODULE_ROLES``), put an
  account back to pending, or disable it; the change applies to the account's
  next request (the role is read from the table on every request);
- allow or not the AI assistant for an account.

The last active admin cannot be demoted nor disabled: the module would be
left without anyone to run it. The admin rows are locked while counting, so
two demotions at the same time cannot both pass.

Mount it through the module's ``routes/users.py``::

    from src.users_admin_common import router  # noqa: F401
"""
from __future__ import annotations

import logging
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth import get_current_user, require_admin
from src.auth_common import AUTH_MODE, ROLE_DISABLED, ROLE_PENDING, account_state, module_ladder
from src.database import get_db
from src.models import User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/users", tags=["users"])


class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    name: str
    role: str
    state: str
    ai_enabled: bool
    last_login: datetime | None
    created_at: datetime | None


class UserUpdate(BaseModel):
    role: str | None = None
    ai_enabled: bool | None = None


def _out(u: User) -> UserOut:
    state = account_state(u.role)
    return UserOut(id=u.id, email=u.email, name=u.name or "",
                   # Outside the ladder and not disabled: shown as pending.
                   role=u.role if state != "pending" else ROLE_PENDING,
                   state=state, ai_enabled=u.ai_enabled == "true",
                   last_login=u.last_login, created_at=u.created_at)




@router.get("")
async def list_users(user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    require_admin(user)
    managed = AUTH_MODE == "pilot"
    rows = [] if managed else (await db.execute(select(User).order_by(User.created_at))).scalars().all()
    return {
        "users": [_out(u) for u in rows],
        "roles": list(module_ladder()),
        # Suite: accounts and roles are Pilot's; the UI says so.
        "managed": managed,
    }


@router.put("/{user_id}", response_model=UserOut)
async def update_user(user_id: uuid.UUID, body: UserUpdate, request: Request,
                      user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    require_admin(user)
    if AUTH_MODE == "pilot":
        raise HTTPException(status_code=409, detail="Users and roles are managed in Pilot in suite mode.")
    target = await db.get(User, user_id)
    if target is None:
        raise HTTPException(status_code=404, detail="User not found")
    details: dict = {}
    if body.role is not None and body.role != target.role:
        if body.role not in (*module_ladder(), ROLE_PENDING, ROLE_DISABLED):
            raise HTTPException(status_code=400, detail="Invalid role")
        if target.role == "admin" and body.role != "admin":
            # Locked until commit: a concurrent demotion waits, then counts
            # what this one left.
            admins = (await db.execute(select(User.id).where(User.role == "admin")
                                       .with_for_update())).scalars().all()
            if len(admins) <= 1:
                raise HTTPException(status_code=409, detail="The last admin cannot be demoted nor disabled")
        details["role"] = f"{target.role} -> {body.role}"
        target.role = body.role
    if body.ai_enabled is not None and (target.ai_enabled == "true") != body.ai_enabled:
        details["ai_enabled"] = body.ai_enabled
        target.ai_enabled = "true" if body.ai_enabled else "false"
    await db.commit()
    if details:
        # What changed, for the module's write journal (its middleware records
        # the request) and for the log.
        request.state.journal_details = details
        logger.info("user %s updated by %s: %s", target.email,
                    getattr(user, "email", None) or "(auth disabled)", details)
    await db.refresh(target)
    return _out(target)
