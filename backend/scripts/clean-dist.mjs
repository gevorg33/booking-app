#!/usr/bin/env node
/**
 * Safely reset backend/dist without rm -rf on a corrupted tree.
 * Renames dist to dist.trash.<timestamp> and creates a fresh empty dist/.
 */
import { mkdirSync, renameSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const stamp = Date.now();

for (const name of ['dist', 'dist 2', 'dist 3', 'dist.corrupt.bak']) {
  const path = join(root, name);
  if (!existsSync(path)) continue;
  const trash = join(root, `${name.replace(/\s+/g, '-')}.trash.${stamp}`);
  renameSync(path, trash);
  console.log(`Renamed ${name} → ${trash.split('/').pop()}`);
}

mkdirSync(join(root, 'dist'), { recursive: true });
console.log('Created fresh dist/');
