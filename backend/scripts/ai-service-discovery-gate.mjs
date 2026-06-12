#!/usr/bin/env node
/** discover-exit-3 — budget + rank + avail + cross-sprint discover merge gate. */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

const result = spawnSync(npmCmd, ['run', 'test:ai-service-discovery'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
});

process.exit(result.status ?? 1);
