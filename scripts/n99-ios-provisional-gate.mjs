#!/usr/bin/env node
/** n99-4.1 — iOS provisional authorization gate. */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const result = spawnSync('npm', ['run', 'test:n99-4.1'], {
  cwd: path.join(root, 'consumer-app'),
  stdio: 'inherit',
  shell: true,
});

if (result.status !== 0) process.exit(result.status ?? 1);
console.log('n99-4.1 iOS provisional authorization gate passed');
