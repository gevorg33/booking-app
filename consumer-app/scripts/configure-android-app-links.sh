#!/usr/bin/env bash
# Injects verified Android App Links for https://{host}/book/{slug}
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MANIFEST="$ROOT/android/app/src/main/AndroidManifest.xml"
HOST="${CONSUMER_UNIVERSAL_LINK_HOST:-}"

if [ ! -f "$MANIFEST" ]; then
  echo "⚠ AndroidManifest.xml not found — run: npm run cap:add:android"
  exit 0
fi

MARKER='<!-- @@CONSUMER_APP_LINKS@@ -->'

if [ -z "$HOST" ]; then
  echo "⚠ Set CONSUMER_UNIVERSAL_LINK_HOST (e.g. app.optischedule.com) to enable App Links"
  # Strip any previous app-link block, keep marker only
  python3 - <<'PY' "$MANIFEST" "$MARKER"
import pathlib, re, sys
path = pathlib.Path(sys.argv[1])
marker = sys.argv[2]
text = path.read_text()
pattern = re.compile(
    re.escape(marker) + r"\s*(?:<!-- App Links -->.*?</intent-filter>\s*)?",
    re.DOTALL,
)
path.write_text(pattern.sub(marker + "\n\n            ", text))
PY
  exit 0
fi

APP_LINKS="            ${MARKER}
            <!-- App Links: https://${HOST}/book/* -->
            <intent-filter android:autoVerify=\"true\">
                <action android:name=\"android.intent.action.VIEW\" />
                <category android:name=\"android.intent.category.DEFAULT\" />
                <category android:name=\"android.intent.category.BROWSABLE\" />
                <data android:scheme=\"https\" android:host=\"${HOST}\" android:pathPrefix=\"/book\" />
            </intent-filter>

            "

python3 - <<'PY' "$MANIFEST" "$MARKER" "$APP_LINKS"
import pathlib, re, sys
path = pathlib.Path(sys.argv[1])
marker = sys.argv[2]
block = sys.argv[3]
text = path.read_text()
pattern = re.compile(re.escape(marker) + r".*?(?=\n\s*<intent-filter|\n\s*</activity>)", re.DOTALL)
if not pattern.search(text):
    raise SystemExit("Marker not found in AndroidManifest.xml")
path.write_text(pattern.sub(block.rstrip() + "\n\n            ", text, count=1))
PY

echo "✓ Android App Links configured for https://${HOST}/book/*"
echo "  Publish frontend/public/.well-known/assetlinks.json with your signing cert SHA-256"
