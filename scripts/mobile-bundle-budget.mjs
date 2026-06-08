#!/usr/bin/env node
/** adopt-5.7 — bundle size budget gate for consumer + provider apps. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUDGETS = {
  consumer: 3_500_000,
  provider: 4_000_000,
};

const baselinePath = path.join(ROOT, 'scripts/mobile-bundle-budget.baseline.json');
const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
const maxRegressionRatio = baseline.maxRegressionRatio ?? 1.05;

function dirSizeBytes(dir) {
  if (!fs.existsSync(dir)) return 0;
  let total = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    total += entry.isDirectory() ? dirSizeBytes(full) : fs.statSync(full).size;
  }
  return total;
}

let failed = false;
for (const [app, budget] of Object.entries(BUDGETS)) {
  const dist = path.join(ROOT, `${app}-app`, 'dist');
  const size = dirSizeBytes(dist);
  if (size === 0) {
    failed = true;
    console.error(`✗ ${app}-app dist/ missing — run npm run build in ${app}-app first`);
    continue;
  }
  if (size > budget) {
    failed = true;
    console.error(`✗ ${app}-app bundle ${size} bytes exceeds budget ${budget}`);
    continue;
  }

  const baselineBytes = baseline[app];
  if (baselineBytes && size > baselineBytes * maxRegressionRatio) {
    failed = true;
    console.error(
      `✗ ${app}-app bundle regression alarm: ${size} bytes exceeds baseline ${baselineBytes} × ${maxRegressionRatio}`,
    );
    continue;
  }

  console.log(`✓ ${app}-app bundle ${size} bytes within budget ${budget}`);
}

process.exit(failed ? 1 : 0);
