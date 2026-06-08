#!/usr/bin/env node
/** n99-3 — intent-qualified install → activation near-99% CI gate smoke. */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED_FILES = [
  'backend/src/common/utils/n99-qualified-activation.fixtures.ts',
  'backend/src/common/utils/n99-qualified-activation.util.ts',
  'backend/src/common/utils/n99-qualified-activation.util.spec.ts',
  'consumer-app/src/lib/deferred-install-link.util.ts',
  'frontend/src/lib/adoption-activation-display.util.ts',
  'frontend/src/components/adoption-dashboard-panel.tsx',
];

for (const file of REQUIRED_FILES) {
  if (!fs.existsSync(path.join(ROOT, file))) {
    console.error(`✗ missing ${file}`);
    process.exit(1);
  }
}

const fixtures = fs.readFileSync(
  path.join(ROOT, 'backend/src/common/utils/n99-qualified-activation.fixtures.ts'),
  'utf8',
);
const checks = [
  ['7-day window', /N99_QUALIFIED_ACTIVATION_WINDOW_DAYS\s*=\s*7/],
  ['near-99 target', /N99_QUALIFIED_ACTIVATION_TARGET\s*=\s*0\.99/],
  ['eval floor 90%', /N99_QUALIFIED_ACTIVATION_EVAL_FLOOR\s*=\s*0\.9/],
  ['locale spread ≤ 3 pts', /N99_QUALIFIED_LOCALE_SPREAD_MAX\s*=\s*0\.03/],
];

for (const [label, pattern] of checks) {
  if (!pattern.test(fixtures)) {
    console.error(`✗ n99-3 fixtures must define ${label}`);
    process.exit(1);
  }
}

const util = fs.readFileSync(
  path.join(ROOT, 'backend/src/common/utils/n99-qualified-activation.util.ts'),
  'utf8',
);
if (!util.includes('buildN99QualifiedActivationCohortExport')) {
  console.error('✗ n99-3.7 cohort export must split qualified vs cold by locale');
  process.exit(1);
}

const deferred = fs.readFileSync(
  path.join(ROOT, 'consumer-app/src/lib/deferred-install-link.util.ts'),
  'utf8',
);
if (!deferred.includes('intentQualified: true')) {
  console.error('✗ deferred install attribution must mark intentQualified installs');
  process.exit(1);
}

const result = spawnSync('npm', ['run', 'test:n99-3.7'], {
  cwd: path.join(ROOT, 'backend'),
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
if (result.status !== 0) {
  console.error('✗ n99-3 qualified activation unit tests failed');
  process.exit(result.status ?? 1);
}

console.log('✓ n99-3 intent-qualified activation measurement + near-99 gate wired');
