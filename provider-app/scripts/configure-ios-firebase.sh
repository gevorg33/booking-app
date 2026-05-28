#!/usr/bin/env bash
# Inject Google Sign-In URL scheme from GoogleService-Info.plist into Info.plist
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLIST="$ROOT/ios/App/App/GoogleService-Info.plist"
INFO="$ROOT/ios/App/App/Info.plist"

if [ ! -f "$PLIST" ]; then
  echo "⚠ GoogleService-Info.plist not found — skip URL scheme (see FIREBASE_SETUP.md)"
  exit 0
fi

REVERSED_CLIENT_ID="$(/usr/libexec/PlistBuddy -c 'Print :REVERSED_CLIENT_ID' "$PLIST" 2>/dev/null || true)"
if [ -z "$REVERSED_CLIENT_ID" ]; then
  echo "⚠ REVERSED_CLIENT_ID missing in GoogleService-Info.plist"
  exit 0
fi

# Remove existing CFBundleURLTypes if present, then add fresh entry
/usr/libexec/PlistBuddy -c 'Delete :CFBundleURLTypes' "$INFO" 2>/dev/null || true
/usr/libexec/PlistBuddy -c 'Add :CFBundleURLTypes array' "$INFO"
/usr/libexec/PlistBuddy -c 'Add :CFBundleURLTypes:0 dict' "$INFO"
/usr/libexec/PlistBuddy -c 'Add :CFBundleURLTypes:0:CFBundleURLSchemes array' "$INFO"
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0:CFBundleURLSchemes:0 string $REVERSED_CLIENT_ID" "$INFO"

echo "✓ Info.plist URL scheme set to $REVERSED_CLIENT_ID"
