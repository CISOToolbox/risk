"""Auth module — thin wrapper over auth_common.py.

Edit the shared auth logic in shared/python/auth_common.py, not here.
This file only re-exports symbols so existing imports keep working.
"""
from src.auth_common import (  # noqa: F401 — re-export
    ADMIN_MODULE_ROLES,
    AUTH_MODE,
    AUTH_TOKEN,
    COOKIE_NAME,
    JWT_SECRET,
    MODULE_COOKIE,
    MODULE_NAME,
    auth_enabled,
    assert_auth_posture,
    create_jwt,
    decode_jwt,
    get_current_user,
    get_current_user_permissive,
    get_module_role,
    perms_for_module_role,
    require_admin,
    require_identity,
    require_min_role,
    VIEWER_MODULE_ROLES,
)

