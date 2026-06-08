#!/usr/bin/env node
/** adopt-5.3 — consumer offline resilience gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const required = [
  'consumer-app/src/lib/offline-queue.ts',
  'consumer-app/src/lib/use-online-status.ts',
  'consumer-app/src/lib/cached-tenant-data.util.ts',
  'consumer-app/src/hooks/use-cached-tenant-services.ts',
  'consumer-app/src/components/ConsumerOfflineBanner.tsx',
];

for (const file of required) {
  if (!fs.existsSync(path.join(ROOT, file))) {
    console.error(`✗ missing ${file}`);
    process.exit(1);
  }
}

const mutationUtil = fs.readFileSync(
  path.join(ROOT, 'consumer-app/src/lib/consumer-offline-mutation.util.ts'),
  'utf8',
);
if (!mutationUtil.includes('ACCOUNT_CANCEL')) {
  console.error('✗ consumer offline queue must cover account booking mutations');
  process.exit(1);
}

console.log('✓ consumer offline queue + cache + banner wiring present');
