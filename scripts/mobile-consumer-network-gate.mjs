#!/usr/bin/env node
/** adopt-5.4 — consumer network-aware UX gate. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const required = [
  'consumer-app/src/lib/consumer-network-ux.util.ts',
  'consumer-app/src/lib/consumer-network-ux.util.spec.ts',
  'consumer-app/src/lib/operation-feedback.ts',
  'consumer-app/src/lib/operation-feedback-store.ts',
  'consumer-app/src/components/ConsumerNetworkErrorCard.tsx',
  'consumer-app/src/components/OperationFeedbackHost.tsx',
];

for (const file of required) {
  if (!fs.existsSync(path.join(ROOT, file))) {
    console.error(`✗ missing ${file}`);
    process.exit(1);
  }
}

const pages = [
  'consumer-app/src/pages/BookPage.tsx',
  'consumer-app/src/pages/ManageBookingPage.tsx',
];

for (const file of pages) {
  const source = fs.readFileSync(path.join(ROOT, file), 'utf8');
  if (!source.includes('ConsumerNetworkErrorCard')) {
    console.error(`✗ ${file} must use ConsumerNetworkErrorCard for recoverable errors`);
    process.exit(1);
  }
  if (!source.includes('networkRetryAction')) {
    console.error(`✗ ${file} must expose localized retry actions`);
    process.exit(1);
  }
}

const feedback = fs.readFileSync(
  path.join(ROOT, 'consumer-app/src/lib/operation-feedback.ts'),
  'utf8',
);
if (!feedback.includes('networkRetryAction') || !feedback.includes('onRetry')) {
  console.error('✗ operation feedback must attach retry handlers for network failures');
  process.exit(1);
}

const catalog = fs.readFileSync(
  path.join(ROOT, 'consumer-app/src/lib/consumer-copy-catalog.ts'),
  'utf8',
);
for (const key of ['networkRetryAction', 'networkLoadFailed']) {
  if (!catalog.includes(key)) {
    console.error(`✗ consumer copy catalog missing ${key}`);
    process.exit(1);
  }
}

console.log('✓ consumer network UX — retry cards, feedback toasts, localized copy');
