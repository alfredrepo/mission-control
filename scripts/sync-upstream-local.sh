#!/usr/bin/env bash
set -euo pipefail

BRANCH="${1:-main}"

echo "[sync-local] fetching remotes..."
git fetch upstream
git fetch origin

echo "[sync-local] checking out ${BRANCH}..."
git checkout "${BRANCH}"

echo "[sync-local] rebasing ${BRANCH} onto upstream/${BRANCH}..."
git rebase "upstream/${BRANCH}"

echo "[sync-local] done ✅ (no push performed)"
echo "[sync-local] when ready, run: git push origin ${BRANCH}"
