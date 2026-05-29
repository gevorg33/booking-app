#!/usr/bin/env bash
# Copy Firebase web config from provider-app into frontend/.env.local (NEXT_PUBLIC_*).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(cd "$ROOT/.." && pwd)"
PROVIDER_ENV="$REPO/provider-app/.env"
PROVIDER_ENV_LAN="$REPO/provider-app/.env.lan"
GS_JSON="$REPO/provider-app/android/app/google-services.json"
TARGET="$ROOT/.env.local"

NEXT_PUBLIC_FIREBASE_API_KEY=""
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=""
NEXT_PUBLIC_FIREBASE_PROJECT_ID=""
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=""
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=""
NEXT_PUBLIC_FIREBASE_APP_ID=""

load_from_env_file() {
  local file="$1"
  [ -f "$file" ] || return 1
  while IFS='=' read -r key value; do
    case "$key" in
      VITE_FIREBASE_API_KEY) NEXT_PUBLIC_FIREBASE_API_KEY="$value" ;;
      VITE_FIREBASE_AUTH_DOMAIN) NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="$value" ;;
      VITE_FIREBASE_PROJECT_ID) NEXT_PUBLIC_FIREBASE_PROJECT_ID="$value" ;;
      VITE_FIREBASE_STORAGE_BUCKET) NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="$value" ;;
      VITE_FIREBASE_MESSAGING_SENDER_ID) NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="$value" ;;
      VITE_FIREBASE_APP_ID) NEXT_PUBLIC_FIREBASE_APP_ID="$value" ;;
    esac
  done < <(grep '^VITE_FIREBASE_' "$file")
  return 0
}

if load_from_env_file "$PROVIDER_ENV"; then
  echo "Using Firebase vars from provider-app/.env"
elif load_from_env_file "$PROVIDER_ENV_LAN"; then
  echo "Using Firebase vars from provider-app/.env.lan"
elif [ -f "$GS_JSON" ]; then
  echo "Using Firebase vars from provider-app/android/app/google-services.json"
  NEXT_PUBLIC_FIREBASE_PROJECT_ID="$(python3 -c "import json; d=json.load(open('$GS_JSON')); print(d['project_info']['project_id'])")"
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="$(python3 -c "import json; d=json.load(open('$GS_JSON')); print(d['project_info']['project_number'])")"
  NEXT_PUBLIC_FIREBASE_API_KEY="$(python3 -c "import json; d=json.load(open('$GS_JSON')); print(d['client'][0]['api_key'][0]['current_key'])")"
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="$(python3 -c "import json; d=json.load(open('$GS_JSON')); print(d['project_info']['storage_bucket'])")"
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="${NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com"
else
  echo "No Firebase config found in provider-app (.env or google-services.json)" >&2
  exit 1
fi

if [ -z "$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" ] && [ -n "$NEXT_PUBLIC_FIREBASE_PROJECT_ID" ]; then
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="${NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com"
fi

if [ -z "$NEXT_PUBLIC_FIREBASE_APP_ID" ]; then
  echo "⚠ NEXT_PUBLIC_FIREBASE_APP_ID missing — add Web app in Firebase Console (see provider-app/FIREBASE_SETUP.md)" >&2
fi

TMP="$(mktemp)"
if [ -f "$TARGET" ]; then
  grep -v '^NEXT_PUBLIC_FIREBASE_' "$TARGET" > "$TMP" || true
else
  : > "$TMP"
fi

{
  cat "$TMP"
  echo "NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY}"
  echo "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}"
  echo "NEXT_PUBLIC_FIREBASE_PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID}"
  echo "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}"
  echo "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}"
  echo "NEXT_PUBLIC_FIREBASE_APP_ID=${NEXT_PUBLIC_FIREBASE_APP_ID}"
} > "$TARGET"

rm -f "$TMP"
echo "✓ Wrote Firebase config to frontend/.env.local"
echo "  project: ${NEXT_PUBLIC_FIREBASE_PROJECT_ID}"
echo "  Restart the Next.js dev server to apply."
