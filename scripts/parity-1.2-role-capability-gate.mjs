#!/usr/bin/env node
/** parity-1.2 — role capability map gate. */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'backend');

const result = spawnSync('npm', ['run', 'test:parity-1.2'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
});

if (result.status !== 0) process.exit(result.status ?? 1);
console.log('parity-1.2 role capability map gate passed');
