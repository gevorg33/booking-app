#!/usr/bin/env node
/** adopt-5.7 — unified performance & stability CI gate orchestrator. */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const CORE_GATES = [
  { name: 'crash-free SLO', script: 'mobile-crash-free-slo.mjs' },
  { name: 'startup TTI + regression alarm', script: 'mobile-startup-tti-gate.mjs' },
  { name: 'bundle size budget', script: 'mobile-bundle-budget.mjs' },
];

const REQUIRED_WIRING = [
  'backend/src/common/utils/crash-free-slo.util.ts',
  'backend/src/common/utils/startup-tti-slo.util.ts',
  'backend/src/common/utils/startup-tti-regression.util.ts',
  'scripts/mobile-bundle-budget.baseline.json',
  '.github/workflows/mobile-performance-gate.yml',
];

for (const file of REQUIRED_WIRING) {
  if (!fs.existsSync(path.join(ROOT, file))) {
    console.error(`✗ missing ${file}`);
    process.exit(1);
  }
}

let failed = false;
for (const gate of CORE_GATES) {
  const scriptPath = path.join(ROOT, 'scripts', gate.script);
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: ROOT,
    stdio: 'inherit',
  });
  if (result.status !== 0) {
    failed = true;
    console.error(`✗ ${gate.name} gate failed`);
  }
}

if (failed) process.exit(1);
console.log('✓ adopt-5.7 performance & stability gates passed');
