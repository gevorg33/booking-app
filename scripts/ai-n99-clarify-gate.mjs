#!/usr/bin/env node
/** n99-1 — clarify → success on next turn near-99% CI gate. */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED_FILES = [
  'backend/src/modules/ai/ai-n99-clarify-success.fixtures.ts',
  'backend/src/modules/ai/ai-n99-clarify-success.util.ts',
  'backend/src/modules/ai/ai-n99-clarify-success.util.spec.ts',
  'backend/src/modules/ai/eval/ai-n99-clarify-followup.eval.spec.ts',
  'frontend/src/components/ai-accuracy-dashboard-panel.tsx',
];

for (const file of REQUIRED_FILES) {
  if (!fs.existsSync(path.join(ROOT, file))) {
    console.error(`✗ missing ${file}`);
    process.exit(1);
  }
}

const fixtures = fs.readFileSync(
  path.join(ROOT, 'backend/src/modules/ai/ai-n99-clarify-success.fixtures.ts'),
  'utf8',
);
if (!/CLARIFY_NEAR_99_TARGET\s*=\s*0\.99/.test(fixtures)) {
  console.error('✗ CLARIFY_NEAR_99_TARGET must be 0.99');
  process.exit(1);
}

const dashboard = fs.readFileSync(
  path.join(ROOT, 'frontend/src/components/ai-accuracy-dashboard-panel.tsx'),
  'utf8',
);
if (!dashboard.includes('clarifyNear99Gate')) {
  console.error('✗ AI accuracy dashboard must document near-99 clarify gate');
  process.exit(1);
}

const result = spawnSync('npm', ['run', 'test:n99-1'], {
  cwd: path.join(ROOT, 'backend'),
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
if (result.status !== 0) {
  console.error('✗ n99-1 clarify success gate tests failed');
  process.exit(result.status ?? 1);
}

console.log('✓ n99-1 clarify → success on next turn near-99% gate passed');
