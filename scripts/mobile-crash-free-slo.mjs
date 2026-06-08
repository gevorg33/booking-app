#!/usr/bin/env node
/** adopt-5.1 / adopt-5.7 — crash-free session SLO gate (≥ 99.5% target). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TARGET = 0.995;

const requiredFiles = [
  'backend/src/common/utils/crash-free-slo.util.ts',
  'consumer-app/src/lib/crash-reporting.util.ts',
  'provider-app/src/lib/crash-reporting.util.ts',
  'consumer-app/src/lib/crash-reporting.util.spec.ts',
  'provider-app/src/lib/crash-reporting.util.spec.ts',
  'frontend/src/components/adoption-dashboard-panel.tsx',
];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(ROOT, file))) {
    console.error(`✗ missing ${file}`);
    process.exit(1);
  }
}

const sloUtil = fs.readFileSync(
  path.join(ROOT, 'backend/src/common/utils/crash-free-slo.util.ts'),
  'utf8',
);
if (!/CRASH_FREE_SESSION_SLO\s*=\s*0\.995/.test(sloUtil)) {
  console.error('✗ CRASH_FREE_SESSION_SLO must be 0.995 (99.5%)');
  process.exit(1);
}

for (const app of ['consumer-app', 'provider-app']) {
  const crashUtil = fs.readFileSync(
    path.join(ROOT, `${app}/src/lib/crash-reporting.util.ts`),
    'utf8',
  );
  if (!crashUtil.includes('@sentry/capacitor')) {
    console.error(`✗ ${app} crash reporting must wire @sentry/capacitor when DSN is set`);
    process.exit(1);
  }
}

const dashboard = fs.readFileSync(
  path.join(ROOT, 'frontend/src/components/adoption-dashboard-panel.tsx'),
  'utf8',
);
if (!dashboard.includes('crashFreeSloAlertTitle') || !dashboard.includes('isCrashFreeBelowSlo')) {
  console.error('✗ adoption dashboard must surface crash-free SLO alarm');
  process.exit(1);
}

console.log(`✓ crash-free SLO target ${TARGET * 100}% enforced in backend + adoption dashboard`);
console.log('✓ Sentry release-health wiring present in consumer + provider apps');
