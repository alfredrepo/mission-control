#!/usr/bin/env bash
set -euo pipefail

BRANCH="${1:-main}"

echo "[sync] fetching remotes..."
git fetch upstream
git fetch origin

echo "[sync] checking out ${BRANCH}..."
git checkout "${BRANCH}"

echo "[sync] rebasing ${BRANCH} onto upstream/${BRANCH}..."
git rebase "upstream/${BRANCH}"

echo "[sync] pushing to origin/${BRANCH}..."
git push origin "${BRANCH}"

echo "[sync] done ✅"
