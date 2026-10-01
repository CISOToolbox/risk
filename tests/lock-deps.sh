#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  lock-deps.sh — regenerate a module's requirements-lock.txt
# ─────────────────────────────────────────────────────────────────────────────
#
#  requirements.txt lists what a module asks for; its image installs
#  requirements-lock.txt: every package, transitives included, at one version,
#  with its hashes (pip install --require-hashes). The lock is resolved from
#  the module's requirements.txt and those of the add-ons baked into its image
#  (addons/core, addons/generic), constrained by the repository's
#  constraints.txt, with no release younger than 14 days (cooldown) except the
#  ones listed in EXCEPTIONS. Its header records the sha256 of every input;
#  tests/check-deps-drift.sh fails when an input changed since.
#
#  Usage (needs uv):
#      bash tests/lock-deps.sh risk vendor      # module directories (suite)
#      bash tests/lock-deps.sh .                # a module repository's root
#      CUTOFF=2026-09-17 bash tests/lock-deps.sh risk   # pin the cutoff date
#
#  Exit code: 0 = locks written, 1 = resolution failed, 2 = usage error.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CONSTRAINTS="${REPO_ROOT}/constraints.txt"
PYTHON_VERSION="3.13"   # the python:3.13-slim base of every image

# package=date — a release newer than the cutoff, accepted case by case.
EXCEPTIONS=(
    "pyjwt=2026-09-24"   # PyJWT 2.15.0: GHSA-42vr-xj54-vc7v
)

if [ -z "${CUTOFF:-}" ]; then
    CUTOFF="$(date -d '-14 days' +%F 2>/dev/null || date -v-14d +%F)"
fi

[ $# -gt 0 ] || { echo "usage: bash tests/lock-deps.sh <module directory>..." >&2; exit 2; }
[ -f "$CONSTRAINTS" ] || { echo "ERROR: ${CONSTRAINTS} not found" >&2; exit 2; }
command -v uv >/dev/null 2>&1 || { echo "ERROR: uv is required (https://docs.astral.sh/uv/)" >&2; exit 2; }
for d in "$@"; do
    [ -f "$d/requirements.txt" ] || { echo "ERROR: $d/requirements.txt not found" >&2; exit 2; }
done

sha256() { if command -v sha256sum >/dev/null 2>&1; then sha256sum "$1"; else shasum -a 256 "$1"; fi | cut -d' ' -f1; }

exception_args=()
for e in "${EXCEPTIONS[@]}"; do exception_args+=(--exclude-newer-package "$e"); done

for d in "$@"; do
    dir="$(cd "$d" && pwd)"
    inputs=("requirements.txt")
    while IFS= read -r r; do inputs+=("${r#"$dir"/}"); done < <(
        find "$dir/addons/core" "$dir/addons/generic" -name requirements.txt 2>/dev/null | sort)
    (
        cd "$dir"
        trap 'rm -f requirements-lock.txt.tmp' EXIT
        {
            echo "# Locked dependencies of the image: every package it installs, transitives"
            echo "# included, with hashes. Generated — do not edit by hand. Installed with:"
            echo "#   pip install --require-hashes -r requirements-lock.txt"
            echo "# Resolved for Python $PYTHON_VERSION, any platform, with the repository's"
            echo "# constraints.txt and no release after $CUTOFF (14-day cooldown), except:"
            echo "# ${EXCEPTIONS[*]}. Regenerate with tests/lock-deps.sh after changing an"
            echo "# input below."
            for i in "${inputs[@]}"; do echo "# input: $i sha256:$(sha256 "$i")"; done
            # --no-annotate: the "# via" notes would print the constraints file's
            # absolute path, which lies outside the module directory.
            uv pip compile "${inputs[@]}" -c "$CONSTRAINTS" \
                --exclude-newer "$CUTOFF" "${exception_args[@]}" \
                --universal --python-version "$PYTHON_VERSION" \
                --generate-hashes --no-annotate --no-header --quiet
        } > requirements-lock.txt.tmp || exit 1
        mv requirements-lock.txt.tmp requirements-lock.txt
    )
    printf '%-40s %3d packages  (%s)\n' "${d%/}/requirements-lock.txt" \
        "$(grep -cE '^[A-Za-z0-9]' "$dir/requirements-lock.txt")" "${inputs[*]}"
done
