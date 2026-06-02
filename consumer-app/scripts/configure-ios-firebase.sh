#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PLIST="$ROOT/ios/App/App/GoogleService-Info.plist"
INFO="$ROOT/ios/App/App/Info.plist"

if [ ! -f "$PLIST" ]; then
  echo "⚠ GoogleService-Info.plist not found — add Firebase iOS app (com.optischedule.consumer)"
  exit 0
fi

REVERSED_CLIENT_ID="$(/usr/libexec/PlistBuddy -c 'Print :REVERSED_CLIENT_ID' "$PLIST" 2>/dev/null || true)"
if [ -z "$REVERSED_CLIENT_ID" ]; then
  echo "⚠ REVERSED_CLIENT_ID missing in GoogleService-Info.plist"
  exit 0
fi

/usr/libexec/PlistBuddy -c 'Delete :CFBundleURLTypes' "$INFO" 2>/dev/null || true
/usr/libexec/PlistBuddy -c 'Add :CFBundleURLTypes array' "$INFO"
/usr/libexec/PlistBuddy -c 'Add :CFBundleURLTypes:0 dict' "$INFO"
/usr/libexec/PlistBuddy -c 'Add :CFBundleURLTypes:0:CFBundleURLSchemes array' "$INFO"
/usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0:CFBundleURLSchemes:0 string $REVERSED_CLIENT_ID" "$INFO"

# Custom scheme for fallback deep links
/usr/libexec/PlistBuddy -c 'Add :CFBundleURLTypes:1 dict' "$INFO" 2>/dev/null || true
/usr/libexec/PlistBuddy -c 'Add :CFBundleURLTypes:1:CFBundleURLSchemes array' "$INFO" 2>/dev/null || \
  /usr/libexec/PlistBuddy -c 'Add :CFBundleURLTypes:1 dict' "$INFO"
/usr/libexec/PlistBuddy -c 'Add :CFBundleURLTypes:1:CFBundleURLSchemes array' "$INFO" 2>/dev/null || true
/usr/libexec/PlistBuddy -c 'Add :CFBundleURLTypes:1:CFBundleURLSchemes:0 string optischedule' "$INFO" 2>/dev/null || \
  /usr/libexec/PlistBuddy -c "Set :CFBundleURLTypes:1:CFBundleURLSchemes:0 optischedule" "$INFO"

echo "✓ Info.plist URL schemes configured"
