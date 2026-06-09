#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_LAN="$ROOT/.env.lan"
ENV_FILE="$ROOT/.env"
EXAMPLE="$ROOT/.env.lan.example"

if [ ! -f "$ENV_LAN" ]; then
  if [ -f "$EXAMPLE" ]; then
    cp "$EXAMPLE" "$ENV_LAN"
  else
    cp "$ROOT/.env.example" "$ENV_LAN"
  fi
fi

LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)"
if [ -n "$LAN_IP" ] && grep -q "127.0.0.1" "$ENV_LAN" 2>/dev/null; then
  sed -i '' "s|127.0.0.1|$LAN_IP|g" "$ENV_LAN"
fi

set_var() {
  local key="$1" val="$2"
  if grep -q "^${key}=" "$ENV_LAN"; then
    current="$(grep "^${key}=" "$ENV_LAN" | cut -d= -f2-)"
    if [ -z "$current" ]; then
      sed -i '' "s|^${key}=.*|${key}=${val}|" "$ENV_LAN"
    fi
  else
    echo "${key}=${val}" >> "$ENV_LAN"
  fi
}

force_set_var() {
  local key="$1" val="$2"
  if grep -q "^${key}=" "$ENV_LAN"; then
    sed -i '' "s|^${key}=.*|${key}=${val}|" "$ENV_LAN"
  else
    echo "${key}=${val}" >> "$ENV_LAN"
  fi
}

GS_JSON="$ROOT/android/app/google-services.json"
if [ -f "$GS_JSON" ]; then
  PROJECT_ID="$(python3 -c "import json; d=json.load(open('$GS_JSON')); print(d['project_info']['project_id'])")"
  SENDER_ID="$(python3 -c "import json; d=json.load(open('$GS_JSON')); print(d['project_info']['project_number'])")"
  API_KEY="$(python3 -c "
import json
d=json.load(open('$GS_JSON'))
for c in d.get('client', []):
  if c.get('client_info', {}).get('android_client_info', {}).get('package_name') == 'com.optischedule.consumer':
    print(c['api_key'][0]['current_key'])
    break
" 2>/dev/null || true)"
  STORAGE="$(python3 -c "import json; d=json.load(open('$GS_JSON')); print(d['project_info']['storage_bucket'])")"
  APP_ID="$(python3 -c "
import json
d=json.load(open('$GS_JSON'))
for c in d.get('client', []):
  if c.get('client_info', {}).get('android_client_info', {}).get('package_name') == 'com.optischedule.consumer':
    print(c['client_info']['mobilesdk_app_id'])
    break
" 2>/dev/null || true)"

  [ -n "$PROJECT_ID" ] && force_set_var VITE_FIREBASE_PROJECT_ID "$PROJECT_ID"
  [ -n "$SENDER_ID" ] && force_set_var VITE_FIREBASE_MESSAGING_SENDER_ID "$SENDER_ID"
  [ -n "$API_KEY" ] && force_set_var VITE_FIREBASE_API_KEY "$API_KEY"
  [ -n "$STORAGE" ] && force_set_var VITE_FIREBASE_STORAGE_BUCKET "$STORAGE"
  [ -n "$APP_ID" ] && force_set_var VITE_FIREBASE_APP_ID "$APP_ID"
  [ -n "$PROJECT_ID" ] && force_set_var VITE_FIREBASE_AUTH_DOMAIN "${PROJECT_ID}.firebaseapp.com"
  echo "✓ Firebase config loaded from android/app/google-services.json"
fi

PLIST="$ROOT/ios/App/App/GoogleService-Info.plist"
if [ -f "$PLIST" ]; then
  PROJECT_ID="$(/usr/libexec/PlistBuddy -c 'Print :PROJECT_ID' "$PLIST" 2>/dev/null || true)"
  SENDER_ID="$(/usr/libexec/PlistBuddy -c 'Print :GCM_SENDER_ID' "$PLIST" 2>/dev/null || true)"
  API_KEY="$(/usr/libexec/PlistBuddy -c 'Print :API_KEY' "$PLIST" 2>/dev/null || true)"
  STORAGE="$(/usr/libexec/PlistBuddy -c 'Print :STORAGE_BUCKET' "$PLIST" 2>/dev/null || true)"

  [ -n "$PROJECT_ID" ] && force_set_var VITE_FIREBASE_PROJECT_ID "$PROJECT_ID"
  [ -n "$SENDER_ID" ] && force_set_var VITE_FIREBASE_MESSAGING_SENDER_ID "$SENDER_ID"
  if [ ! -f "$GS_JSON" ] && [ -n "$API_KEY" ]; then
    force_set_var VITE_FIREBASE_API_KEY "$API_KEY"
  fi
  [ -n "$STORAGE" ] && force_set_var VITE_FIREBASE_STORAGE_BUCKET "$STORAGE"
  [ -n "$PROJECT_ID" ] && force_set_var VITE_FIREBASE_AUTH_DOMAIN "${PROJECT_ID}.firebaseapp.com"
  echo "✓ Firebase config loaded from ios/App/App/GoogleService-Info.plist"
fi

FCM_READY=false
if [ -f "$ROOT/android/app/google-services.json" ] || [ -f "$ROOT/ios/App/App/GoogleService-Info.plist" ]; then
  FCM_READY=true
fi

if grep -q '^VITE_FCM_CONFIGURED=' "$ENV_LAN"; then
  sed -i '' "s/^VITE_FCM_CONFIGURED=.*/VITE_FCM_CONFIGURED=${FCM_READY}/" "$ENV_LAN"
else
  echo "VITE_FCM_CONFIGURED=${FCM_READY}" >> "$ENV_LAN"
fi

cp "$ENV_LAN" "$ENV_FILE"
echo "✓ consumer-app .env ready"
if [ "$FCM_READY" = true ]; then
  echo "✓ Firebase native config found — push enabled in build"
else
  echo "⚠ Missing google-services.json / GoogleService-Info.plist — push disabled"
fi
