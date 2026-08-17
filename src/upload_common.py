# -----------------------------------------------------------------------------
# REPLICATED from the private shared repository (shared/python/upload_common.py).
# DO NOT EDIT HERE - changes will be overwritten by the next propagation run.
# Fix the master in the shared repository and re-propagate. See CONTRIBUTING.md.
# -----------------------------------------------------------------------------
"""Bounded, type-checked multipart upload reading (findings UP-01 / UP-02).

Shared by every module that exposes a file-import endpoint. This file is
copied verbatim to ``<module>/src/upload_common.py`` — keep every copy
byte-identical.

Two problems are addressed:

UP-01 — the size ceiling used to be enforced *after* ``await file.read()``
had already materialised the whole body in RAM. :func:`read_upload` reads
the spooled upload in small chunks and aborts with HTTP 413 as soon as the
ceiling is passed, so at most ``max_bytes + 1`` bytes ever reach the heap.
(Starlette still spools the multipart body to a temporary file before the
endpoint runs; what this bounds is the in-process memory, which is the part
an attacker could multiply by concurrent requests.)

UP-02 — no import endpoint checked what kind of file it was being handed.
:func:`read_upload` validates the filename extension *and* the declared
content type against an explicit profile, and checks the magic number of
ZIP-based office formats.

Content-type lists are deliberately permissive: browsers are notoriously
inconsistent for CSV and XLSX (Windows machines with Excel installed send
``application/vnd.ms-excel`` for a plain ``.csv``, and many send
``application/octet-stream`` when the OS MIME database does not know the
extension). Rejecting on content type alone would break legitimate imports,
so the extension is the primary signal and the content type only has to be
plausible for the profile.
"""

from __future__ import annotations

import os
from typing import Sequence

from fastapi import HTTPException, UploadFile

# Read granularity. Small enough that an oversized upload is stopped almost
# immediately, large enough not to make legitimate imports chatty.
CHUNK_SIZE = 64 * 1024

# ---------------------------------------------------------------------------
# Accepted-type profiles
# ---------------------------------------------------------------------------
# An empty string in a content-type tuple means "no content type declared",
# which some clients (and curl without -F type=) legitimately do.

CSV_EXTENSIONS: tuple[str, ...] = (".csv", ".tsv", ".txt")
CSV_CONTENT_TYPES: tuple[str, ...] = (
    "text/csv",
    "application/csv",
    "text/plain",
    "text/tab-separated-values",
    "text/comma-separated-values",
    "application/vnd.ms-excel",  # what Windows + Excel send for a .csv
    "application/octet-stream",
    "",
)

JSON_EXTENSIONS: tuple[str, ...] = (".json", ".enc", ".ctenc", ".txt")
JSON_CONTENT_TYPES: tuple[str, ...] = (
    "application/json",
    "text/json",
    "text/plain",
    "application/octet-stream",
    "",
)

# Used by the file-based connector import, which mostly receives .xlsx
# exports but must stay open to whatever tabular format an add-on parses.
TABULAR_EXTENSIONS: tuple[str, ...] = (
    ".xlsx",
    ".xlsm",
    ".xls",
    ".csv",
    ".tsv",
    ".txt",
    ".json",
)
TABULAR_CONTENT_TYPES: tuple[str, ...] = (
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.template",
    "application/vnd.ms-excel",
    "application/vnd.ms-excel.sheet.macroenabled.12",
    "application/zip",
    "application/x-zip-compressed",
    "text/csv",
    "application/csv",
    "text/tab-separated-values",
    "text/plain",
    "application/json",
    "application/octet-stream",
    "",
)

# Formats that are really ZIP containers: their first four bytes must be the
# local file header signature. Cheap, reliable, and it catches a mislabelled
# binary immediately.
_ZIP_MAGIC = b"PK\x03\x04"
_ZIP_BASED_EXTENSIONS = (".xlsx", ".xlsm")


def _normalise_content_type(raw: str | None) -> str:
    """Lowercase the media type and drop any ``; charset=…`` parameters."""
    if not raw:
        return ""
    return raw.split(";", 1)[0].strip().lower()


def _extension(filename: str | None) -> str:
    """Lowercase extension of ``filename``, ignoring any directory part.

    The filename comes from the client and is never used to build a path —
    only the trailing extension is looked at, after stripping anything that
    looks like a directory component.
    """
    if not filename:
        return ""
    base = os.path.basename(filename.replace("\\", "/")).strip()
    return os.path.splitext(base)[1].lower()


def _human_size(max_bytes: int) -> str:
    if max_bytes % (1024 * 1024) == 0:
        return f"{max_bytes // (1024 * 1024)}MB"
    if max_bytes % 1024 == 0:
        return f"{max_bytes // 1024}KB"
    return f"{max_bytes} bytes"


def validate_upload_type(
    file: UploadFile,
    extensions: Sequence[str],
    content_types: Sequence[str],
) -> None:
    """Reject an upload whose extension or declared MIME type is off-profile.

    Raises:
        HTTPException: 415 if the extension is not in ``extensions`` or the
            declared content type is not in ``content_types``.
    """
    ext = _extension(file.filename)
    if ext not in extensions:
        raise HTTPException(
            status_code=415,
            detail="Unsupported file type (expected: " + ", ".join(extensions) + ")",
        )

    declared = _normalise_content_type(file.content_type)
    if declared not in content_types:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported content type '{declared}' for a {ext} file",
        )


def verify_magic(filename: str | None, content: bytes) -> None:
    """Check the magic number of ZIP-based office formats (.xlsx/.xlsm).

    Other formats are text and have no reliable signature, so they are left
    to the parser that consumes them.

    Raises:
        HTTPException: 415 if the content does not start with ``PK\\x03\\x04``.
    """
    if _extension(filename) in _ZIP_BASED_EXTENSIONS:
        if not content.startswith(_ZIP_MAGIC):
            raise HTTPException(
                status_code=415,
                detail="File is not a valid Office/ZIP document",
            )


async def read_upload_limited(
    file: UploadFile,
    max_bytes: int,
    chunk_size: int = CHUNK_SIZE,
) -> bytes:
    """Read an upload in chunks, aborting as soon as ``max_bytes`` is passed.

    Never accumulates more than ``max_bytes + 1`` bytes in memory, unlike
    ``await file.read()`` followed by a length check.

    Args:
        file: The multipart upload.
        max_bytes: Ceiling, in bytes, for the uploaded payload.
        chunk_size: Read granularity.

    Returns:
        The full file content, guaranteed to be at most ``max_bytes`` long.

    Raises:
        HTTPException: 413 as soon as the payload exceeds ``max_bytes``.
    """
    chunks: list[bytes] = []
    total = 0
    while True:
        # Never ask for more than one byte past the ceiling: that single
        # extra byte is what tells us the file is too big.
        want = min(chunk_size, max_bytes + 1 - total)
        if want <= 0:
            break
        chunk = await file.read(want)
        if not chunk:
            break
        total += len(chunk)
        if total > max_bytes:
            raise HTTPException(
                status_code=413,
                detail=f"File too large (max {_human_size(max_bytes)})",
            )
        chunks.append(chunk)
    return b"".join(chunks)


async def read_upload(
    file: UploadFile,
    max_bytes: int,
    extensions: Sequence[str],
    content_types: Sequence[str],
) -> bytes:
    """Validate then read a multipart upload safely.

    Type validation happens first — it is free — then the body is read under
    a hard ceiling, then the magic number is checked for binary formats.

    Args:
        file: The multipart upload.
        max_bytes: Ceiling, in bytes, for the uploaded payload.
        extensions: Allowed lowercase extensions, e.g. :data:`CSV_EXTENSIONS`.
        content_types: Allowed declared MIME types, e.g. :data:`CSV_CONTENT_TYPES`.

    Returns:
        The file content.

    Raises:
        HTTPException: 415 on a type mismatch, 413 if the file is too large.
    """
    validate_upload_type(file, extensions, content_types)
    content = await read_upload_limited(file, max_bytes)
    verify_magic(file.filename, content)
    return content


async def read_csv_upload(file: UploadFile, max_bytes: int = 5 * 1024 * 1024) -> bytes:
    """Read a CSV/TSV upload under a ceiling (default 5 MB)."""
    return await read_upload(file, max_bytes, CSV_EXTENSIONS, CSV_CONTENT_TYPES)


async def read_json_upload(file: UploadFile, max_bytes: int = 10 * 1024 * 1024) -> bytes:
    """Read a JSON upload under a ceiling (default 10 MB)."""
    return await read_upload(file, max_bytes, JSON_EXTENSIONS, JSON_CONTENT_TYPES)


async def read_tabular_upload(file: UploadFile, max_bytes: int = 5 * 1024 * 1024) -> bytes:
    """Read a spreadsheet/tabular upload under a ceiling (default 5 MB)."""
    return await read_upload(file, max_bytes, TABULAR_EXTENSIONS, TABULAR_CONTENT_TYPES)


__all__ = [
    "CHUNK_SIZE",
    "CSV_CONTENT_TYPES",
    "CSV_EXTENSIONS",
    "JSON_CONTENT_TYPES",
    "JSON_EXTENSIONS",
    "TABULAR_CONTENT_TYPES",
    "TABULAR_EXTENSIONS",
    "read_csv_upload",
    "read_json_upload",
    "read_tabular_upload",
    "read_upload",
    "read_upload_limited",
    "validate_upload_type",
    "verify_magic",
]
