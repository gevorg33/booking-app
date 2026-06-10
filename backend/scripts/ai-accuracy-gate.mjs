#!/usr/bin/env node
/** acc-2.8 — deterministic AI command eval + accuracy report + baseline diff. */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const jestBin = path.join(root, 'node_modules', '.bin', 'jest');

const gateArgs = ['--runInBand', '--testPathPatterns=ai-command-eval.accuracy-gate'];
const unitArgs = ['--runInBand', '--testPathPatterns=ai-command-eval.report.spec'];

const gate = spawnSync(jestBin, gateArgs, {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});

if ((gate.status ?? 1) !== 0) {
  process.exit(gate.status ?? 1);
}

const unit = spawnSync(jestBin, unitArgs, {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});

process.exit(unit.status ?? 1);
