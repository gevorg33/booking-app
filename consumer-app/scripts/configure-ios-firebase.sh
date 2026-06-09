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

PBXPROJ="$ROOT/ios/App/App.xcodeproj/project.pbxproj"
if [ -f "$PLIST" ] && [ -f "$PBXPROJ" ] && ! grep -q 'GoogleService-Info.plist' "$PBXPROJ"; then
  PBXPROJ="$PBXPROJ" python3 <<'PY'
import os
from pathlib import Path

pbx = Path(os.environ["PBXPROJ"])
text = pbx.read_text()
build = "\t\tF1REBASE001FED79650016851F /* GoogleService-Info.plist in Resources */ = {isa = PBXBuildFile; fileRef = F1REBASE002FED79650016851F /* GoogleService-Info.plist */; };\n"
ref = "\t\tF1REBASE002FED79650016851F /* GoogleService-Info.plist */ = {isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = GoogleService-Info.plist; sourceTree = \"<group>\"; };\n"
text = text.replace("/* End PBXBuildFile section */", build + "/* End PBXBuildFile section */", 1)
text = text.replace(
    "\t\t504EC3131FED79650016851F /* Info.plist */ = {isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = Info.plist; sourceTree = \"<group>\"; };\n",
    "\t\t504EC3131FED79650016851F /* Info.plist */ = {isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = Info.plist; sourceTree = \"<group>\"; };\n" + ref,
    1,
)
text = text.replace(
    "\t\t\t\t504EC3131FED79650016851F /* Info.plist */,\n",
    "\t\t\t\t504EC3131FED79650016851F /* Info.plist */,\n\t\t\t\tF1REBASE002FED79650016851F /* GoogleService-Info.plist */,\n",
    1,
)
text = text.replace(
    "\t\t\t\t2FAD9763203C412B000D30F8 /* config.xml in Resources */,\n",
    "\t\t\t\t2FAD9763203C412B000D30F8 /* config.xml in Resources */,\n\t\t\t\tF1REBASE001FED79650016851F /* GoogleService-Info.plist in Resources */,\n",
    1,
)
pbx.write_text(text)
print("✓ GoogleService-Info.plist added to Xcode project")
PY
fi
