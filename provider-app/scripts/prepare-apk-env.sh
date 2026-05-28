#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_LAN="$ROOT/.env.lan"
ENV_FILE="$ROOT/.env"

# Start from .env.lan.example if .env.lan missing
if [ ! -f "$ENV_LAN" ]; then
  cp "$ROOT/.env.lan.example" "$ENV_LAN"
fi

# Auto-detect LAN IP if placeholder still present
LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)"
if [ -n "$LAN_IP" ] && grep -q "192.168.10.10" "$ENV_LAN" 2>/dev/null; then
  sed -i '' "s|192.168.10.10|$LAN_IP|g" "$ENV_LAN"
fi

# Enable FCM in build when google-services.json is present
if [ -f "$ROOT/android/app/google-services.json" ]; then
  if grep -q '^VITE_FCM_CONFIGURED=' "$ENV_LAN"; then
    sed -i '' 's/^VITE_FCM_CONFIGURED=.*/VITE_FCM_CONFIGURED=true/' "$ENV_LAN"
  else
    echo 'VITE_FCM_CONFIGURED=true' >> "$ENV_LAN"
  fi
  echo "✓ google-services.json found — push enabled in build"
else
  if grep -q '^VITE_FCM_CONFIGURED=' "$ENV_LAN"; then
    sed -i '' 's/^VITE_FCM_CONFIGURED=.*/VITE_FCM_CONFIGURED=false/' "$ENV_LAN"
  fi
  echo "⚠ google-services.json missing — push disabled (see FIREBASE_SETUP.md)"
fi

cp "$ENV_LAN" "$ENV_FILE"
