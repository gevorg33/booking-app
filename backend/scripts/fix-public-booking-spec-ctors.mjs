#!/usr/bin/env node
/** One-off: insert adoption ctor deps (promoCodes, planEntitlements, referral) in manual PublicBookingService mocks. */
import fs from 'node:fs';
import path from 'node:path';

import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.name.endsWith('.spec.ts')) out.push(full);
  }
  return out;
}

const files = walk(path.join(root, 'src'))
  .map((full) => path.relative(root, full))
  .filter(
    (f) =>
      !f.includes('public-booking-test.harness') &&
      fs.readFileSync(path.join(root, f), 'utf8').includes('new PublicBookingService('),
  );

const CHECKOUT_BLOCK = `    {} as never,
    {} as never,
    {} as never,
    {} as never,
    multiServiceBookingsService,`;

const CHECKOUT_BLOCK_FIXED = `    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    multiServiceBookingsService,`;

const CONFIG_REPO_BLOCK = /(config as unknown as ConfigService,\n)(    \{\} as never,\n)/;

let updated = 0;
for (const rel of files) {
  const filePath = path.join(root, rel);
  let text = fs.readFileSync(filePath, 'utf8');
  if (text.includes('createPublicBookingServiceHarness')) continue;

  const original = text;
  if (text.includes(CHECKOUT_BLOCK)) {
    text = text.replace(CHECKOUT_BLOCK, CHECKOUT_BLOCK_FIXED);
  }
  text = text.replace(CONFIG_REPO_BLOCK, `$1    {} as never,\n$2`);

  if (text !== original) {
    fs.writeFileSync(filePath, text);
    updated += 1;
    console.log(`patched ${rel}`);
  } else {
    console.warn(`skipped (no match): ${rel}`);
  }
}

console.log(`updated ${updated} files`);
