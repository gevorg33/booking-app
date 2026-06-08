#!/usr/bin/env node
/** n99-4 — push reachability / explicit opt-in / deliverability gate. */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function run(cwd, script) {
  const result = spawnSync('npm', ['run', script], {
    cwd,
    stdio: 'inherit',
    shell: true,
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(path.join(root, 'backend'), 'test:n99-4');
run(path.join(root, 'consumer-app'), 'test:n99-4');

console.log('n99-4 push reachability gate passed');
