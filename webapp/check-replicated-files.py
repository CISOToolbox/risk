#!/usr/bin/env python3
"""Verify that no replicated file was modified in this repository.

This file is meant to be COPIED into every public CISO Toolbox repository (it
is deliberately dependency-free and works on Python 3.8+). It is the public
half of the drift check: the private masters are not available here, so the
verification is done against `.propagation-manifest.json`, which the
propagation writes into the repo and which contains only paths and sha256
digests -- never any private content.

Why a file can be "replicated": part of this repository is generated from a
private upstream repository (shared design system, i18n runtime, shared Python
helpers, and -- for standalone modules -- the whole module code, whose source
of truth is the public `suite-modules` repository). Those files are overwritten
by the next propagation, so editing them here has no lasting effect.

Usage:
    python3 check-replicated-files.py                    # check the current repository
    python3 check-replicated-files.py <dir>              # check another checkout
    python3 check-replicated-files.py --allow-missing    # succeed if there is no
                                                         # manifest (repo not yet
                                                         # under propagation)

Exit codes: 0 = clean, 1 = no manifest found, 2 = a replicated file changed.
"""
import hashlib
import json
import os
import sys

MANIFEST = ".propagation-manifest.json"
HELP = """
What to do instead
------------------
  * Module/application code (standalone repositories): the source of truth is
    the public `suite-modules` repository. Open your pull request there; the
    change is then propagated down to this repository.
  * Shared code (design system, i18n runtime, shared Python helpers): the
    source of truth is a private repository. Open an ISSUE describing the change
    (or a pull request against the replicated file, clearly labelled
    `shared-code proposal`): a maintainer ports it upstream, and the next
    propagation brings it back here with your change included.
  * Anything else in this repository is yours to edit freely -- only the paths
    listed in .propagation-manifest.json are replicated.

To make CI pass again, restore the replicated files:
    git checkout -- <the paths listed above>
"""


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def main(argv):
    args = [a for a in argv[1:] if not a.startswith("--")]
    allow_missing = "--allow-missing" in argv[1:]
    repo = os.path.abspath(args[0] if args else ".")
    manifest = os.path.join(repo, MANIFEST)
    if not os.path.isfile(manifest):
        sys.stderr.write("no %s in %s -- nothing to verify\n" % (MANIFEST, repo))
        return 0 if allow_missing else 1
    with open(manifest, encoding="utf-8") as fh:
        doc = json.load(fh)
    files = doc.get("files", {})
    modified, deleted = [], []
    for rel, expected in sorted(files.items()):
        target = os.path.join(repo, rel)
        if not os.path.isfile(target):
            deleted.append(rel)
        elif "sha256:" + sha256(target) != expected:
            modified.append(rel)

    if not modified and not deleted:
        print("OK: %d replicated file(s) intact." % len(files))
        return 0

    sys.stderr.write("\nReplicated files were changed in this repository.\n")
    sys.stderr.write("These files come from a private upstream and WILL BE "
                     "OVERWRITTEN by the next propagation.\n\n")
    for rel in modified:
        sys.stderr.write("  modified  %s\n" % rel)
    for rel in deleted:
        sys.stderr.write("  deleted   %s\n" % rel)
    sys.stderr.write(HELP)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv))
