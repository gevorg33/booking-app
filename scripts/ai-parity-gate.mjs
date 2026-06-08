#!/usr/bin/env node
/** parity-4.5 — enforced CI exit gate (jest suite + optional dist script). */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'backend');

function run(cwd, script, args = []) {
  const result = spawnSync('npm', ['run', script, ...args], {
    cwd,
    stdio: 'inherit',
    shell: true,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(root, 'test:parity-4.5');
run(root, 'report:ai-parity');

console.log('parity-4.5 exit gate passed');
