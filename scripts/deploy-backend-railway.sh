#!/usr/bin/env bash
# Deploy backend to Railway (interactive login required once).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$REPO_ROOT/backend"

cd "$BACKEND_DIR"

if ! npx --yes @railway/cli whoami >/dev/null 2>&1; then
  echo "Log in to Railway (browser or device code)..."
  npx --yes @railway/cli login
fi

if [[ ! -f .railway/config.json ]]; then
  echo "Linking Railway project (service root = backend/)..."
  npx --yes @railway/cli init --name booking-api
fi

echo "Ensure Postgres + Redis plugins are added in Railway dashboard."
echo "Set JWT_SECRET, ROOT_DOMAIN, CORS_ORIGIN, FRONTEND_URL, PUBLIC_API_URL in Railway variables."

npx --yes @railway/cli up --detach "$@"

echo ""
echo "After deploy, set on Vercel:"
echo "  NEXT_PUBLIC_API_URL=https://<your-railway-domain>"
echo "  INTERNAL_API_URL=https://<your-railway-domain>"
echo "  NEXT_PUBLIC_ROOT_DOMAIN=<your-apex-domain>"
