#!/usr/bin/env bash
# Adds Associated Domains entitlement — set CONSUMER_UNIVERSAL_LINK_HOST (e.g. app.optischedule.com)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENT="$ROOT/ios/App/App/App.entitlements"
HOST="${CONSUMER_UNIVERSAL_LINK_HOST:-}"

if [ ! -f "$ENT" ]; then
  echo "⚠ App.entitlements not found — run cap add ios first"
  exit 0
fi

if [ -z "$HOST" ]; then
  echo "⚠ Set CONSUMER_UNIVERSAL_LINK_HOST to your public web host (no https://)"
  exit 0
fi

/usr/libexec/PlistBuddy -c 'Delete :com.apple.developer.associated-domains' "$ENT" 2>/dev/null || true
/usr/libexec/PlistBuddy -c 'Add :com.apple.developer.associated-domains array' "$ENT"
/usr/libexec/PlistBuddy -c "Add :com.apple.developer.associated-domains:0 string applinks:${HOST}" "$ENT"
echo "✓ Associated domain applinks:${HOST}"
