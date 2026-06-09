#!/usr/bin/env bash
# Copy Firebase web config from provider-app into consumer-app .env.lan
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REPO="$(cd "$ROOT/.." && pwd)"
PROVIDER_ENV="$REPO/provider-app/.env"
PROVIDER_ENV_LAN="$REPO/provider-app/.env.lan"
TARGET="$ROOT/.env.lan"

load_from_env_file() {
  local file="$1"
  [ -f "$file" ] || return 1
  while IFS='=' read -r key value; do
    case "$key" in
      VITE_FIREBASE_API_KEY) FB_API_KEY="$value" ;;
      VITE_FIREBASE_AUTH_DOMAIN) FB_AUTH_DOMAIN="$value" ;;
      VITE_FIREBASE_PROJECT_ID) FB_PROJECT_ID="$value" ;;
      VITE_FIREBASE_STORAGE_BUCKET) FB_STORAGE="$value" ;;
      VITE_FIREBASE_MESSAGING_SENDER_ID) FB_SENDER="$value" ;;
      VITE_FIREBASE_APP_ID) FB_APP_ID="$value" ;;
    esac
  done < <(grep '^VITE_FIREBASE_' "$file")
  return 0
}

FB_API_KEY=""
FB_AUTH_DOMAIN=""
FB_PROJECT_ID=""
FB_STORAGE=""
FB_SENDER=""
FB_APP_ID=""

if load_from_env_file "$PROVIDER_ENV"; then
  echo "Using Firebase vars from provider-app/.env"
elif load_from_env_file "$PROVIDER_ENV_LAN"; then
  echo "Using Firebase vars from provider-app/.env.lan"
else
  GS_JSON="$REPO/provider-app/android/app/google-services.json"
  if [ -f "$GS_JSON" ]; then
    echo "Using Firebase vars from provider-app/android/app/google-services.json"
    FB_PROJECT_ID="$(python3 -c "import json; d=json.load(open('$GS_JSON')); print(d['project_info']['project_id'])")"
    FB_SENDER="$(python3 -c "import json; d=json.load(open('$GS_JSON')); print(d['project_info']['project_number'])")"
    FB_API_KEY="$(python3 -c "import json; d=json.load(open('$GS_JSON')); print(d['client'][0]['api_key'][0]['current_key'])")"
    FB_STORAGE="$(python3 -c "import json; d=json.load(open('$GS_JSON')); print(d['project_info']['storage_bucket'])")"
    FB_AUTH_DOMAIN="${FB_PROJECT_ID}.firebaseapp.com"
  else
    echo "No Firebase config found in provider-app" >&2
    exit 1
  fi
fi

if [ -z "$FB_AUTH_DOMAIN" ] && [ -n "$FB_PROJECT_ID" ]; then
  FB_AUTH_DOMAIN="${FB_PROJECT_ID}.firebaseapp.com"
fi

if [ ! -f "$TARGET" ]; then
  cp "$ROOT/.env.lan.example" "$TARGET" 2>/dev/null || cp "$ROOT/.env.example" "$TARGET"
fi

set_var() {
  local key="$1" val="$2"
  if grep -q "^${key}=" "$TARGET"; then
    sed -i '' "s|^${key}=.*|${key}=${val}|" "$TARGET"
  else
    echo "${key}=${val}" >> "$TARGET"
  fi
}

[ -n "$FB_API_KEY" ] && set_var VITE_FIREBASE_API_KEY "$FB_API_KEY"
[ -n "$FB_AUTH_DOMAIN" ] && set_var VITE_FIREBASE_AUTH_DOMAIN "$FB_AUTH_DOMAIN"
[ -n "$FB_PROJECT_ID" ] && set_var VITE_FIREBASE_PROJECT_ID "$FB_PROJECT_ID"
[ -n "$FB_STORAGE" ] && set_var VITE_FIREBASE_STORAGE_BUCKET "$FB_STORAGE"
[ -n "$FB_SENDER" ] && set_var VITE_FIREBASE_MESSAGING_SENDER_ID "$FB_SENDER"
[ -n "$FB_APP_ID" ] && set_var VITE_FIREBASE_APP_ID "$FB_APP_ID"

CONSUMER_GS="$ROOT/android/app/google-services.json"
PROVIDER_GS="$REPO/provider-app/android/app/google-services.json"
if [ ! -f "$CONSUMER_GS" ] && [ -f "$PROVIDER_GS" ]; then
  echo "⚠ consumer android/app/google-services.json missing"
  echo "  Register Android app com.optischedule.consumer in Firebase Console and download google-services.json"
  echo "  (same optischedule-project as provider-app — see provider-app/FIREBASE_SETUP.md)"
fi

if [ -f "$CONSUMER_GS" ] || [ -f "$ROOT/ios/App/App/GoogleService-Info.plist" ]; then
  set_var VITE_FCM_CONFIGURED true
else
  set_var VITE_FCM_CONFIGURED false
fi

cp "$TARGET" "$ROOT/.env"
echo "✓ Wrote Firebase config to consumer-app/.env.lan"
echo "  project: ${FB_PROJECT_ID:-unknown}"
