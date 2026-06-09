#!/usr/bin/env bash
# LAN .env for Android emulator/device (10.0.2.2 → host machine from emulator)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
bash "$ROOT/scripts/sync-firebase-from-provider.sh" || true
bash "$ROOT/scripts/prepare-env.sh"

ENV_FILE="$ROOT/.env"
LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)"

if [ -n "$LAN_IP" ] && [ -f "$ENV_FILE" ]; then
  if grep -q '^VITE_API_URL=' "$ENV_FILE"; then
    sed -i '' "s|^VITE_API_URL=.*|VITE_API_URL=http://${LAN_IP}:3001|" "$ENV_FILE"
  fi
  if grep -q '^VITE_PUBLIC_WEB_ORIGIN=' "$ENV_FILE"; then
    sed -i '' "s|^VITE_PUBLIC_WEB_ORIGIN=.*|VITE_PUBLIC_WEB_ORIGIN=http://${LAN_IP}:3000|" "$ENV_FILE"
  fi
  echo "✓ APK env: API + web origin → ${LAN_IP} (emulator uses 10.0.2.2 via public-api.ts)"
fi
