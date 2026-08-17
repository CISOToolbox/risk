# -----------------------------------------------------------------------------
# REPLICATED from the private shared repository (shared/python/settings_crypto.py).
# DO NOT EDIT HERE - changes will be overwritten by the next propagation run.
# Fix the master in the shared repository and re-propagate. See CONTRIBUTING.md.
# -----------------------------------------------------------------------------
"""Encryption for secrets kept in the `AppSettings` key/value table.

Why a separate module from crypto.py
------------------------------------
`crypto.py` already implements the right scheme, but it exists as five
independent copies exporting three DIFFERENT APIs for it — `encrypt_config`
(access, asset), `encrypt_token` (appsec, watch), `encrypt_secret` (surface).
Live client data is already encrypted with those, so unifying them is a
migration, not a refactor, and not something to attempt while fixing an
unrelated finding. This module therefore adds only the missing capability, is
propagated from a single master, and reaches the modules that have no crypto.py
at all — Pilot in particular, which stores SMTP and cloud-connector credentials.

Storage format and lazy migration
---------------------------------
Ciphertext is written with an explicit `enc:v1:` marker. That is what makes the
migration safe: a stored value either carries the marker (decrypt it) or does
not (legacy cleartext, return as-is, re-encrypted on the next write). Guessing
by "try to decrypt and fall back on failure" would conflate a legacy cleartext
value with a value the current ENCRYPTION_KEY can no longer open after a key
rotation — the first must be returned, the second must not be silently served
as if it were plaintext.

Scheme: AES-256-GCM, per-message random salt + nonce, PBKDF2-HMAC-SHA256
(310k), key from ENCRYPTION_KEY only. Identical to crypto.py, deliberately: a
deployment that rotates ENCRYPTION_KEY rotates both at once.
"""
from __future__ import annotations

import logging
import os
from base64 import b64decode, b64encode

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

logger = logging.getLogger(__name__)

# Latches the first time a secret is written in cleartext because no
# ENCRYPTION_KEY is set, so the warning is loud but fires once per process
# rather than on every save.
_warned_cleartext = False

_KEY: bytes | None = None
_SALT_LEN = 16
_NONCE_LEN = 12
_KDF_ITERATIONS = 310_000
_MIN_KEY_LEN = 32

# Explicit, versioned marker. Bump the version if the scheme ever changes so
# both formats can be read during the transition.
_MARKER = "enc:v1:"

# Setting keys whose value is a secret. Anything not listed stays cleartext —
# provider names, model ids and regions are configuration, not credentials, and
# encrypting them would only make debugging harder.
SECRET_SETTING_KEYS = frozenset({
    "ai_key_anthropic",
    "ai_key_openai",
    "ai_key_gemini",
    "ai_key_bedrock",
    "ai_secret_bedrock",
    "ai_custom_key",
    "shodan_api_key",
    "shodan.api_key",
    "smtp_password",
    "nvd_api_key",
})


def is_secret_key(key: str) -> bool:
    """Is this AppSettings key one whose value must be encrypted at rest?"""
    k = (key or "").strip()
    if k in SECRET_SETTING_KEYS:
        return True
    # Per-connector credentials are named dynamically (connector_<name>_secret).
    return (
        k.startswith("connector_") and (k.endswith("_secret") or k.endswith("_key"))
    ) or k.endswith("_password") or k.endswith(".password")


def _get_key() -> bytes:
    global _KEY
    if _KEY is None:
        raw = os.environ.get("ENCRYPTION_KEY", "")
        if not raw:
            raise RuntimeError(
                "ENCRYPTION_KEY must be set to store secrets at rest. Generate "
                "one with: python3 -c \"import secrets; print(secrets.token_hex(32))\""
            )
        if len(raw) < _MIN_KEY_LEN:
            raise RuntimeError(
                f"ENCRYPTION_KEY too short ({len(raw)} chars): minimum {_MIN_KEY_LEN}."
            )
        _KEY = raw.encode()
    return _KEY


def _derive(passphrase: bytes, salt: bytes) -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(), length=32, salt=salt, iterations=_KDF_ITERATIONS
    )
    return kdf.derive(passphrase)


def is_encrypted(stored: str) -> bool:
    """Does this stored value carry the ciphertext marker?"""
    return bool(stored) and stored.startswith(_MARKER)


def encrypt_setting(plaintext: str) -> str:
    """Encrypt a secret for storage. Empty stays empty (means "not set")."""
    if not plaintext:
        return ""
    if is_encrypted(plaintext):
        return plaintext  # already ciphertext: never double-wrap
    salt = os.urandom(_SALT_LEN)
    nonce = os.urandom(_NONCE_LEN)
    ct = AESGCM(_derive(_get_key(), salt)).encrypt(nonce, plaintext.encode(), None)
    return _MARKER + b64encode(salt + nonce + ct).decode()


def encrypt_setting_or_plain(plaintext: str) -> str:
    """encrypt_setting, degrading to plaintext when ENCRYPTION_KEY is unset.

    Suite deployments always have the key (compose enforces it) so secrets
    are encrypted at rest. Single-module standalone deployments without the
    key keep their historical plaintext behavior instead of failing the write.

    A missing key is a legitimate standalone posture, but a silent one is a
    trap: the operator has no signal that credentials are landing in the DB in
    cleartext. Warn once so it is a decision, not an accident.
    """
    try:
        return encrypt_setting(plaintext)
    except RuntimeError:
        global _warned_cleartext
        if plaintext and not _warned_cleartext:
            _warned_cleartext = True
            logger.warning(
                "ENCRYPTION_KEY is not set — secrets (SMTP passwords, API keys, "
                "connector credentials) are being stored in the database in "
                "CLEARTEXT. Set ENCRYPTION_KEY (openssl rand -hex 32) to encrypt "
                "them at rest; existing rows migrate on their next write."
            )
        return plaintext


def decrypt_setting(stored: str) -> str:
    """Read a stored secret, transparently handling not-yet-migrated rows.

    No marker means the row predates encryption: return it unchanged so the
    feature keeps working, and let the next write encrypt it. A marked value
    that fails to open is NOT returned — that means the key changed, and
    handing back ciphertext would send garbage to the provider.
    """
    if not stored:
        return ""
    if not is_encrypted(stored):
        return stored
    try:
        raw = b64decode(stored[len(_MARKER):])
        salt = raw[:_SALT_LEN]
        nonce = raw[_SALT_LEN:_SALT_LEN + _NONCE_LEN]
        ct = raw[_SALT_LEN + _NONCE_LEN:]
        return AESGCM(_derive(_get_key(), salt)).decrypt(nonce, ct, None).decode()
    except Exception:
        logger.warning(
            "Stored secret could not be decrypted — ENCRYPTION_KEY has most "
            "likely changed since it was written. Re-enter the credential."
        )
        return ""
