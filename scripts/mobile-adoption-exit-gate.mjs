#!/usr/bin/env node
/** adopt-6.8 — rolling 30-day adoption program exit gate CI smoke. */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED_FILES = [
  'backend/src/common/utils/adoption-exit-gate.fixtures.ts',
  'backend/src/common/utils/adoption-exit-gate.util.ts',
  'backend/src/common/utils/adoption-exit-gate.util.spec.ts',
  'backend/src/common/utils/app-adoption-analytics.util.ts',
  'frontend/src/components/adoption-dashboard-panel.tsx',
  'frontend/src/lib/adoption-dashboard-display.util.ts',
];

for (const file of REQUIRED_FILES) {
  if (!fs.existsSync(path.join(ROOT, file))) {
    console.error(`✗ missing ${file}`);
    process.exit(1);
  }
}

const fixtures = fs.readFileSync(
  path.join(ROOT, 'backend/src/common/utils/adoption-exit-gate.fixtures.ts'),
  'utf8',
);
const checks = [
  ['ADOPTION_EXIT_PERIOD_DAYS = 30', /ADOPTION_EXIT_PERIOD_DAYS\s*=\s*30/],
  ['activation ≥ 60%', /ADOPTION_EXIT_ACTIVATION_MIN\s*=\s*0\.6/],
  ['push opt-in ≥ 80%', /ADOPTION_EXIT_PUSH_OPT_IN_MIN\s*=\s*0\.8/],
  ['crash-free ≥ 99.5%', /ADOPTION_EXIT_CRASH_FREE_MIN\s*=\s*0\.995/],
  ['locale spread ≤ 3 pts', /ADOPTION_EXIT_LOCALE_SPREAD_MAX\s*=\s*0\.03/],
  ['K-factor ≥ 0.2', /ADOPTION_EXIT_K_FACTOR_MIN\s*=\s*0\.2/],
];

for (const [label, pattern] of checks) {
  if (!pattern.test(fixtures)) {
    console.error(`✗ adoption exit gate fixtures must define ${label}`);
    process.exit(1);
  }
}

const analyticsUtil = fs.readFileSync(
  path.join(ROOT, 'backend/src/common/utils/app-adoption-analytics.util.ts'),
  'utf8',
);
if (!analyticsUtil.includes('buildAdoptionExitGateFromRows')) {
  console.error('✗ app-adoption-analytics must compute rolling 30-day exit gate');
  process.exit(1);
}

const dashboard = fs.readFileSync(
  path.join(ROOT, 'frontend/src/components/adoption-dashboard-panel.tsx'),
  'utf8',
);
if (
  !dashboard.includes('exitGateMetTitle') ||
  !dashboard.includes('readExitGateOpenFailures')
) {
  console.error('✗ adoption dashboard must document exit gate status and open failures');
  process.exit(1);
}

const result = spawnSync('npm', ['run', 'test:adopt-6-exit-gate'], {
  cwd: path.join(ROOT, 'backend'),
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
if (result.status !== 0) {
  console.error('✗ adoption exit gate unit tests failed');
  process.exit(result.status ?? 1);
}

console.log('✓ adopt-6.8 rolling 30-day adoption exit gate wired in backend + dashboard');
