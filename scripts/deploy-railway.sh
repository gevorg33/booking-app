#!/usr/bin/env bash
# Deploy backend API to Railway (requires: npx @railway/cli login).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$REPO_ROOT/backend"

echo "Deploying backend from $BACKEND_DIR"
echo "Railway: set root directory to backend/, add Postgres + Redis, set JWT_SECRET + CORS_ORIGIN."
echo ""

cd "$BACKEND_DIR"
npx --yes @railway/cli "$@"
