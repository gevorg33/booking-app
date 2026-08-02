/**
 * Guru live QA for e2e-bug.333 — short "Create a booking for the first
 * available…" without "any provider" and without a named provider must
 * never fall through to a misleading fixed-time conflict message
 * ("… is not free at 13:10 on …"). It should either scan first-available
 * for a resolvable target (named provider, or a phrasing that implies any
 * provider) or ask the user to specify — never fabricate a wrong-time
 * conflict.
 *
 * Run: node frontend/scripts/qa-e2e-bug-333.mjs
 * Requires: API on :3001, dashboard owner JWT for gevgas-operations-7c299253.
 */
import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(__dirname, '../../backend');
const require = createRequire(resolve(backendRoot, 'package.json'));
const jwt = require('jsonwebtoken');
const { Client } = require('pg');

const API = process.env.API_BASE || 'http://127.0.0.1:3001';
const JWT_SECRET =
  process.env.JWT_SECRET || 'dev-secret-change-in-production-f8a3b2c1d4e5';
const SLUG = 'gevgas-operations-7c299253';
const SLASH_DATE_RE = /\b\d{2}\/\d{2}\/\d{4}\b/;
const FIXED_TIME_CONFLICT_RE = /is not free at \d{2}:\d{2} on/i;

function loadEnv() {
  const envPath = resolve(backendRoot, '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    if (process.env[key] == null) {
      process.env[key] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }
}

function request(method, path, body, headers = {}) {
  return new Promise((resolvePromise, reject) => {
    const data = body != null ? JSON.stringify(body) : null;
    const url = new URL(path, API);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port || 3001,
        path: url.pathname + url.search,
        method,
        headers: {
          ...(data
            ? {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
              }
            : {}),
          ...headers,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = raw ? JSON.parse(raw) : null;
          } catch {
            parsed = raw;
          }
          resolvePromise({ status: res.statusCode, body: parsed });
        });
      },
    );
    req.on('error', reject);
    req.setTimeout(120000, () => req.destroy(new Error('timeout')));
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  loadEnv();
  const dbUrl =
    process.env.DATABASE_URL ||
    'postgresql://gevorggasparyan@localhost:5432/booking_platform';
  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  const { rows: bizRows } = await client.query(
    `SELECT id FROM businesses WHERE slug = $1`,
    [SLUG],
  );
  const businessId = bizRows[0].id;
  const { rows: memberRows } = await client.query(
    `SELECT user_id, role FROM business_members WHERE business_id = $1 AND role = 'owner' LIMIT 1`,
    [businessId],
  );
  const token = jwt.sign(
    { sub: memberRows[0].user_id, businessId, membershipRole: memberRows[0].role },
    JWT_SECRET,
    { expiresIn: '1h' },
  );
  const authHeaders = { Authorization: `Bearer ${token}` };

  let pass = 0;
  let fail = 0;
  const check = (id, condition, detail) => {
    if (condition) {
      pass += 1;
      console.log(`  PASS  ${id}`);
    } else {
      fail += 1;
      console.log(`  FAIL  ${id} — ${detail}`);
    }
  };

  async function assist(prompt) {
    const res = await request(
      'POST',
      `/businesses/${businessId}/ai/command`,
      { prompt },
      authHeaders,
    );
    const data = res.body?.data ?? res.body;
    return { action: data?.action, success: data?.success, summary: String(data?.summary || '') };
  }

  // The original reported repro: bare "first available" with no provider
  // cue at all. Must never produce a fabricated fixed-time conflict.
  {
    const r = await assist('Create a booking for the first available massage slot');
    check(
      'bare-first-available-no-fake-conflict',
      !FIXED_TIME_CONFLICT_RE.test(r.summary),
      `got: ${r.summary}`,
    );
    check(
      'bare-first-available-clarifies-or-scans',
      r.action === 'create_booking' && r.success === false,
      `got action=${r.action} success=${r.success}`,
    );
  }

  // Canonical working case from e2e-bug.286 — must keep first-available
  // scanning across all providers.
  {
    const r = await assist(
      'Create a booking for the first available massage slot on Monday for any provider',
    );
    check(
      'canonical-any-provider-still-scans',
      !FIXED_TIME_CONFLICT_RE.test(r.summary),
      `got: ${r.summary}`,
    );
  }

  // Named provider, no "any provider" cue — should scan for that provider,
  // not fabricate a conflict.
  {
    const r = await assist(
      'Create a booking for the first available massage slot with Gevorg Gasparyan',
    );
    check(
      'named-provider-no-fake-conflict',
      !FIXED_TIME_CONFLICT_RE.test(r.summary),
      `got: ${r.summary}`,
    );
  }

  // "soonest" synonym without an explicit provider — must not crash or
  // fabricate a fixed-time conflict either.
  {
    const r = await assist('Book the soonest Deep tissue massage');
    check(
      'soonest-synonym-no-fake-conflict',
      !FIXED_TIME_CONFLICT_RE.test(r.summary) && r.action !== 'error',
      `got action=${r.action} summary=${r.summary}`,
    );
  }

  // Reschedule sibling path (also routed through enrichBookingTimeHintsFromPrompt).
  {
    const r = await assist('Reschedule my booking to the first available slot');
    check(
      'reschedule-first-available-no-fake-conflict-or-slash-date',
      !FIXED_TIME_CONFLICT_RE.test(r.summary) && !SLASH_DATE_RE.test(r.summary),
      `got: ${r.summary}`,
    );
  }

  await client.end();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
