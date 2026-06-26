#!/usr/bin/env node
/**
 * Sync backend/.env variables to Railway (booking-backend service).
 * Skips local DB/Redis hosts — Railway keeps DATABASE_URL / REDIS_URL.
 * Overrides app URLs for production deployment.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = join(__dirname, '..');
const envPath = join(backendRoot, '.env');

const SKIP = new Set([
  'DB_HOST',
  'DB_PORT',
  'DB_USERNAME',
  'DB_PASSWORD',
  'DB_NAME',
  'REDIS_HOST',
  'REDIS_PORT',
  'PORT',
  'DATABASE_URL',
  'REDIS_URL',
  'FIREBASE_SERVICE_ACCOUNT_PATH',
]);

const STAGING_HOST = 'frontend-sand-six-17.vercel.app';
const ROOT_DOMAIN = process.env.BOOKING_ROOT_DOMAIN || STAGING_HOST;
const FRONTEND_URL =
  process.env.BOOKING_FRONTEND_URL || `https://${STAGING_HOST}`;

const PROD_OVERRIDES = {
  NODE_ENV: 'production',
  CORS_ORIGIN: FRONTEND_URL,
  FRONTEND_URL,
  PUBLIC_API_URL: 'https://booking-backend-production-4898.up.railway.app',
  ROOT_DOMAIN,
};

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

function railwaySet(key, value) {
  const useStdin = /SECRET|KEY|TOKEN|PASSWORD|JSON|URL/i.test(key);
  const args = ['variable', 'set', useStdin ? key : `${key}=${value}`];
  if (useStdin) args.push('--stdin');
  const result = spawnSync('npx', ['--yes', '@railway/cli', ...args], {
    cwd: backendRoot,
    input: useStdin ? value : undefined,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  if (result.status !== 0) {
    console.error(`Failed ${key}:`, result.stderr || result.stdout);
    return false;
  }
  console.log(`✓ ${key}`);
  return true;
}

if (!existsSync(envPath)) {
  console.error('Missing backend/.env');
  process.exit(1);
}

spawnSync('npx', ['--yes', '@railway/cli', 'service', 'booking-backend'], {
  cwd: backendRoot,
  stdio: 'inherit',
});

const vars = parseEnvFile(envPath);
let ok = 0;
let fail = 0;

for (const [key, value] of vars) {
  if (SKIP.has(key)) {
    console.log(`– skip ${key} (local/Railway-managed)`);
    continue;
  }
  if (!value) {
    console.log(`– skip ${key} (empty)`);
    continue;
  }
  if (railwaySet(key, value)) ok += 1;
  else fail += 1;
}

for (const [key, value] of Object.entries(PROD_OVERRIDES)) {
  if (railwaySet(key, value)) ok += 1;
  else fail += 1;
}

const firebasePath = vars.get('FIREBASE_SERVICE_ACCOUNT_PATH');
if (firebasePath) {
  const resolved = join(backendRoot, firebasePath.replace(/^\.\//, ''));
  if (existsSync(resolved)) {
    const json = readFileSync(resolved, 'utf8').trim();
    if (railwaySet('FIREBASE_SERVICE_ACCOUNT_JSON', json)) ok += 1;
    else fail += 1;
  } else {
    console.log(`– skip FIREBASE_SERVICE_ACCOUNT_JSON (file not found: ${resolved})`);
  }
}

console.log(`\nDone. Set ${ok} variable(s), ${fail} failed.`);
process.exit(fail > 0 ? 1 : 0);
