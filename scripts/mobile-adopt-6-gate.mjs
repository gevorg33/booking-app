#!/usr/bin/env node
/** adopt-6 — growth loops & exit gate CI smoke. */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function run(cwd, script) {
  const result = spawnSync('npm', ['run', script], {
    cwd,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(path.join(root, 'backend'), 'test:adopt-6');
run(path.join(root, 'consumer-app'), 'test:sprint48');
const exitGate = spawnSync(process.execPath, [path.join(root, 'scripts/mobile-adoption-exit-gate.mjs')], {
  cwd: root,
  stdio: 'inherit',
});
if (exitGate.status !== 0) process.exit(exitGate.status ?? 1);
console.log('adopt-6 growth loops gate passed');
