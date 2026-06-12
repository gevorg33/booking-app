#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '..');

const result = spawnSync(
  'npx',
  [
    'jest',
    '--runInBand',
    '--testPathPatterns=fast-intent-heuristics.boundary.spec',
    '--silent',
  ],
  { cwd: backendRoot, stdio: 'inherit' },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log('Fast-intent-heuristics boundary gate passed (pipe-1.2.3 / acc-3.14)');
