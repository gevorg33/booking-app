#!/usr/bin/env node
/** n99-3.6 — qualified-install dead-end audit gate (>1% drop opens fix ticket). */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED_FILES = [
  'backend/src/common/utils/n99-qualified-install-funnel.fixtures.ts',
  'backend/src/common/utils/n99-qualified-install-funnel.util.ts',
  'backend/src/common/utils/n99-qualified-install-funnel.util.spec.ts',
  'consumer-app/src/lib/qualified-install-funnel.util.ts',
  'consumer-app/src/lib/qualified-install-funnel.util.spec.ts',
  'frontend/src/lib/adoption-dead-end-display.util.ts',
];

for (const file of REQUIRED_FILES) {
  if (!fs.existsSync(path.join(ROOT, file))) {
    console.error(`✗ missing ${file}`);
    process.exit(1);
  }
}

const fixtures = fs.readFileSync(
  path.join(ROOT, 'backend/src/common/utils/n99-qualified-install-funnel.fixtures.ts'),
  'utf8',
);
if (!fixtures.includes('N99_DEAD_END_DROP_THRESHOLD = 0.01')) {
  console.error('✗ dead-end threshold must be 1%');
  process.exit(1);
}

const util = fs.readFileSync(
  path.join(ROOT, 'backend/src/common/utils/n99-qualified-install-funnel.util.ts'),
  'utf8',
);
if (!util.includes('auditQualifiedInstallDeadEnds')) {
  console.error('✗ qualified-install dead-end audit util missing');
  process.exit(1);
}

const bookPage = fs.readFileSync(
  path.join(ROOT, 'consumer-app/src/pages/BookPage.tsx'),
  'utf8',
);
if (!bookPage.includes("track(\n      'started_booking'")) {
  console.error('✗ BookPage must instrument started_booking on mount');
  process.exit(1);
}

const backendTests = spawnSync('npm', ['run', 'test:n99-3.6'], {
  cwd: path.join(ROOT, 'backend'),
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
if (backendTests.status !== 0) {
  process.exit(backendTests.status ?? 1);
}

const consumerTests = spawnSync('npm', ['run', 'test:n99-3.6'], {
  cwd: path.join(ROOT, 'consumer-app'),
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
if (consumerTests.status !== 0) {
  process.exit(consumerTests.status ?? 1);
}

console.log('✓ n99-3.6 qualified-install dead-end audit wired');
