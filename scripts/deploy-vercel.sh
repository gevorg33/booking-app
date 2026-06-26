#!/usr/bin/env bash
# Deploy dashboard frontend to Vercel (requires: npx vercel login).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
FRONTEND_DIR="$REPO_ROOT/frontend"

echo "Deploying frontend from $FRONTEND_DIR"
echo "Required Vercel env: NEXT_PUBLIC_API_URL, INTERNAL_API_URL, NEXT_PUBLIC_ROOT_DOMAIN"
echo ""

cd "$FRONTEND_DIR"
npx --yes vercel "$@"
