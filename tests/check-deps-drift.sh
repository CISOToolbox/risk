#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  check-deps-drift.sh — keep the 9 modules on one set of dependency versions
# ─────────────────────────────────────────────────────────────────────────────
#
#  Audit finding DEP-06: three generations of `requirements.txt` had drifted
#  apart, so a CVE fixed in one module stayed open in five others. `constraints.txt`
#  at the repo root is now the single source of truth; this script is what makes
#  it binding.
#
#  It is a *static* check on purpose. Each module's Docker build context is its
#  own directory, so a root-level constraints file cannot be reached by
#  `pip install -c ../constraints.txt` from inside a build — see the header of
#  constraints.txt. Checking the pins from outside the build gives the same
#  guarantee without touching the build contexts.
#
#  Checks performed on every requirements*.txt in the repo (modules + add-ons):
#    1. DRIFT    — a pin contradicts constraints.txt                    (fails)
#    2. UNPINNED — a shared package is missing from constraints.txt     (fails)
#    3. LOCK     — a module's requirements-lock.txt (what its image installs)
#                  or requirements-build-lock.txt (what builds its source-only
#                  packages, from requirements-build.txt) or
#                  requirements-test-lock.txt (the unit tests: the image lock
#                  plus requirements-test.txt)
#                  was resolved from inputs that changed since (its header
#                  records each input's sha256 — any edit, extras included),
#                  lacks a pin of them or holds another version, or is missing
#                  while the Dockerfile installs it: the lock is stale   (fails)
#    4. LOOSE    — a pin is not an exact `==`                        (warning)
#    5. STALE    — a constraints entry no longer used anywhere       (warning)
#    6. LOCK DIVERGENCE — two locks hold a transitive at different
#                  versions                                          (warning)
#
#  A lock carries every transitive: those are not required in constraints.txt
#  (check 2 skips lock files), but they must still agree with it (check 1).
#
#  LOOSE and STALE are warnings, not failures: a loose pin is resolved
#  exactly in its lock anyway. Only genuine cross-module divergence — the thing DEP-06 is
#  about — breaks the build.
#
#  Usage:
#      bash tests/check-deps-drift.sh            # from the repo root
#      bash tests/check-deps-drift.sh --quiet    # only report problems
#
#  Exit code: 0 = aligned, 1 = drift detected, 2 = usage/setup error.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONSTRAINTS="${REPO_ROOT}/constraints.txt"

QUIET=0
[ "${1:-}" = "--quiet" ] && QUIET=1

if [ ! -f "$CONSTRAINTS" ]; then
    echo "ERROR: ${CONSTRAINTS} not found" >&2
    exit 2
fi

command -v python3 >/dev/null 2>&1 || { echo "ERROR: python3 required" >&2; exit 2; }

REPO_ROOT="$REPO_ROOT" CONSTRAINTS="$CONSTRAINTS" QUIET="$QUIET" python3 - <<'PYEOF'
import os
import re
import sys
from collections import defaultdict
from pathlib import Path

repo = Path(os.environ["REPO_ROOT"])
constraints_path = Path(os.environ["CONSTRAINTS"])
quiet = os.environ["QUIET"] == "1"

PIN = re.compile(r"^([A-Za-z0-9][A-Za-z0-9._-]*)\s*(\[[^\]]*\])?\s*(==|>=|<=|~=|!=|>|<)\s*([^\s;#]+)")


def canon(name: str) -> str:
    """PEP 503 normalisation, so Pillow / pillow / PyJWT / pyjwt compare equal."""
    return re.sub(r"[-_.]+", "-", name).lower()


def parse(path: Path):
    """Yield (lineno, raw_name, extras, operator, version) for each pin."""
    for i, line in enumerate(path.read_text().splitlines(), start=1):
        line = line.split("#", 1)[0].strip()
        if not line or line.startswith("-"):
            continue
        m = PIN.match(line)
        if m:
            yield i, m.group(1), m.group(2) or "", m.group(3), m.group(4)


# ── source of truth ──────────────────────────────────────────────────────────
constraints, constraint_line = {}, {}
for lineno, name, _extras, op, version in parse(constraints_path):
    if op != "==":
        print(f"ERROR: constraints.txt:{lineno}: {name}{op}{version} — "
              f"constraints must use exact '==' pins", file=sys.stderr)
        sys.exit(2)
    constraints[canon(name)] = version
    constraint_line[canon(name)] = lineno

# ── every requirements file in the repo ──────────────────────────────────────
req_files = sorted(
    p for p in repo.rglob("requirements*.txt")
    if ".git" not in p.parts and ".client-addons" not in p.parts
)
if not req_files:
    print("ERROR: no requirements*.txt found", file=sys.stderr)
    sys.exit(2)

# A tool installed in its OWN virtual environment may hold one package at a
# version the application must not use. Named path → named packages, nothing
# else; none today (semgrep 1.179.0 accepts the PyJWT the modules run).
SEPARATE_ENV: dict[str, set[str]] = {}

# The image lock, the lock of the tools that build its source-only packages,
# and the unit tests' lock.
LOCK_NAME = "requirements-lock.txt"
BUILD_LOCK_NAME = "requirements-build-lock.txt"
TEST_LOCK_NAME = "requirements-test-lock.txt"
LOCK_NAMES = (LOCK_NAME, BUILD_LOCK_NAME, TEST_LOCK_NAME)

drift, loose, unpinned = [], [], []
seen = defaultdict(list)          # canonical name -> [(relpath, version)], lock files aside
locked = defaultdict(set)         # canonical name -> {(version, lock relpath)}

for path in req_files:
    rel = path.relative_to(repo)
    for lineno, name, extras, op, version in parse(path):
        key = canon(name)
        if op != "==":
            loose.append(f"{rel}:{lineno}: {name}{extras}{op}{version}")
            continue
        if path.name in LOCK_NAMES:
            locked[key].add((version, str(rel)))
        else:
            seen[key].append((str(rel), version))
        expected = constraints.get(key)
        if key in SEPARATE_ENV.get(str(rel), set()):
            continue
        if expected is not None and expected != version:
            drift.append(
                f"{rel}:{lineno}: {name} pinned to {version}, "
                f"constraints.txt:{constraint_line[key]} says {expected}"
            )

# A package used by two or more files must be governed by constraints.txt,
# otherwise the next divergence goes unnoticed — which is exactly DEP-06.
for key, uses in sorted(seen.items()):
    if key in constraints:
        continue
    files = {f for f, _ in uses}
    if len(files) >= 2:
        versions = sorted({v for _, v in uses})
        unpinned.append(
            f"{key}: used by {len(files)} files ({', '.join(sorted(files))}) "
            f"as {', '.join(versions)} but absent from constraints.txt"
        )

stale = sorted(set(constraints) - set(seen) - set(locked))

# A lock is stale when it no longer holds what its module asks for: the
# module's requirements.txt and the add-ons its image bakes in
# (addons/core, addons/generic — addons/custom is layered per client).
import hashlib

stale_lock = []
for dockerfile in sorted(repo.rglob("Dockerfile")):
    if ".git" in dockerfile.parts:
        continue
    text = dockerfile.read_text(errors="replace")
    for name in LOCK_NAMES:
        if name in text and not (dockerfile.parent / name).exists():
            stale_lock.append(f"{dockerfile.relative_to(repo)} installs {name}, which is missing")
INPUT = re.compile(r"^# input: (\S+) sha256:([0-9a-f]{64})$")
for lock in (p for p in req_files if p.name in LOCK_NAMES):
    base = lock.parent
    in_lock = {canon(n): v for _l, n, _e, op, v in parse(lock) if op == "=="}
    if lock.name == BUILD_LOCK_NAME:
        inputs = [base / "requirements-build.txt"]
    elif lock.name == TEST_LOCK_NAME:
        inputs = [base / LOCK_NAME, base / "requirements-test.txt"]
    else:
        inputs = [base / "requirements.txt"] + sorted(
            q for tier in ("core", "generic") for q in (base / "addons" / tier).rglob("requirements.txt"))
    recorded = {m.group(1): m.group(2) for l in lock.read_text().splitlines() if (m := INPUT.match(l))}
    actual = {str(q.relative_to(base)): hashlib.sha256(q.read_bytes()).hexdigest() for q in inputs if q.exists()}
    for name in sorted(set(recorded) | set(actual)):
        if recorded.get(name) != actual.get(name):
            what = ("is not an input any more" if name not in actual else
                    "is a new input" if name not in recorded else "changed since the lock was resolved")
            stale_lock.append(f"{lock.relative_to(repo)}: {name} {what}")
    for req in (q for q in inputs if q.exists()):
        for lineno, name, _e, op, version in parse(req):
            key = canon(name)
            if key not in in_lock:
                stale_lock.append(f"{lock.relative_to(repo)}: {name} ({req.relative_to(repo)}:{lineno}) is missing")
            elif op == "==" and in_lock[key] != version:
                stale_lock.append(f"{lock.relative_to(repo)}: {name} is {in_lock[key]}, "
                                  f"{req.relative_to(repo)}:{lineno} asks for {version}")
divergent = sorted(f"{key}: " + ", ".join(f"{v} ({f})" for v, f in sorted(vs))
                   for key, vs in locked.items() if len({v for v, _ in vs}) > 1)

# ── report ───────────────────────────────────────────────────────────────────
if not quiet:
    print(f"=== Dependency drift check ===")
    print(f"constraints.txt : {len(constraints)} pins")
    print(f"scanned         : {len(req_files)} requirements files, "
          f"{sum(len(v) for v in seen.values())} pins")
    print()

failed = False

for label, items in (("DRIFT", drift), ("UNPINNED SHARED PACKAGE", unpinned),
                     ("STALE LOCK — regenerate requirements-lock.txt", stale_lock)):
    if items:
        failed = True
        print(f"-- {label} ({len(items)}) --")
        for item in items:
            print(f"  FAIL  {item}")
        print()

if loose and not quiet:
    print(f"-- LOOSE PIN ({len(loose)}) — warning only --")
    for item in loose:
        print(f"  warn  {item}")
    print()

if stale and not quiet:
    print(f"-- STALE constraints entries ({len(stale)}) — warning only --")
    for key in stale:
        print(f"  warn  {key}=={constraints[key]} is no longer used by any requirements file")
    print()

if divergent and not quiet:
    print(f"-- LOCK DIVERGENCE ({len(divergent)}) — warning only --")
    for item in divergent:
        print(f"  warn  {item}")
    print()

if failed:
    print("RESULT: dependency drift detected — realign the pins with constraints.txt")
    sys.exit(1)

if not quiet:
    print("RESULT: OK — all modules and add-ons agree with constraints.txt")
sys.exit(0)
PYEOF
