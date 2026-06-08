#!/usr/bin/env node
/** adopt-5.5 — mobile app version gate + kill switch gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const required = [
  'backend/src/common/utils/mobile-app-config.util.ts',
  'backend/src/modules/mobile-app/mobile-app-config.controller.ts',
  'consumer-app/src/lib/app-version-gate.util.ts',
  'consumer-app/src/components/AppVersionGate.tsx',
  'consumer-app/src/components/AppUpdateNudgeBanner.tsx',
  'consumer-app/src/hooks/use-mobile-app-version-policy.ts',
  'provider-app/src/lib/app-version-gate.util.ts',
  'provider-app/src/components/AppVersionGate.tsx',
  'provider-app/src/components/AppUpdateNudgeBanner.tsx',
  'provider-app/src/hooks/use-mobile-app-version-policy.ts',
  'provider-app/src/lib/app-version-gate-copy.util.ts',
];

for (const file of required) {
  if (!fs.existsSync(path.join(ROOT, file))) {
    console.error(`✗ missing ${file}`);
    process.exit(1);
  }
}

for (const app of ['consumer-app', 'provider-app']) {
  const appSource = fs.readFileSync(path.join(ROOT, `${app}/src/App.tsx`), 'utf8');
  if (!appSource.includes('AppVersionGate')) {
    console.error(`✗ ${app} must wrap routes with AppVersionGate`);
    process.exit(1);
  }
}

const envExample = fs.readFileSync(path.join(ROOT, 'backend/.env.example'), 'utf8');
for (const key of ['MOBILE_CONSUMER_IOS_KILL_SWITCH', 'MOBILE_PROVIDER_ANDROID_MIN_VERSION']) {
  if (!envExample.includes(key)) {
    console.error(`✗ backend/.env.example missing ${key}`);
    process.exit(1);
  }
}

console.log('✓ mobile app version gate + kill switch wired for consumer and provider');
