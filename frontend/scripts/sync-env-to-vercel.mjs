#!/usr/bin/env node
/**
 * Sync frontend/.env.local to Vercel (staging).
 * Overrides API URLs to Railway — never pushes localhost to Vercel.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const frontendRoot = join(__dirname, '..');
const envPath = join(frontendRoot, '.env.local');

const STAGING_HOST = 'frontend-sand-six-17.vercel.app';

const STAGING_OVERRIDES = {
  NEXT_PUBLIC_API_URL: 'https://booking-backend-production-4898.up.railway.app',
  INTERNAL_API_URL: 'https://booking-backend-production-4898.up.railway.app',
  NEXT_PUBLIC_ROOT_DOMAIN:
    process.env.BOOKING_ROOT_DOMAIN || STAGING_HOST,
};

const ENVIRONMENTS = ['production', 'preview', 'development'];

function parseEnvFile(path) {
  const text = readFileSync(path, 'utf8');
  const vars = new Map();
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars.set(key, value);
  }
  return vars;
}

function vercelSet(key, value, environment) {
  const result = spawnSync(
    'npx',
    ['--yes', 'vercel', 'env', 'add', key, environment, '--force'],
    {
      cwd: frontendRoot,
      input: value,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    },
  );
  if (result.status !== 0) {
    console.error(`Failed ${key} (${environment}):`, result.stderr || result.stdout);
    return false;
  }
  console.log(`✓ ${key} → ${environment}`);
  return true;
}

if (!existsSync(envPath)) {
  console.error('Missing frontend/.env.local');
  process.exit(1);
}

const vars = parseEnvFile(envPath);
const all = new Map(vars);
for (const [key, value] of Object.entries(STAGING_OVERRIDES)) {
  all.set(key, value);
}

let ok = 0;
let fail = 0;

for (const [key, value] of all) {
  if (!value) {
    console.log(`– skip ${key} (empty)`);
    continue;
  }
  for (const env of ENVIRONMENTS) {
    if (vercelSet(key, value, env)) ok += 1;
    else fail += 1;
  }
}

console.log(`\nDone. ${ok} set, ${fail} failed.`);
console.log('Redeploy staging: cd frontend && npx vercel --prod --yes');
process.exit(fail > 0 ? 1 : 0);
