/**
 * Guru live QA for e2e-bug.343 — dashboard `create_booking` must not crash
 * with an unhandled 500 on MM/DD slash dates where day-of-month > 12 (or any
 * other malformed date string reaching the booking pipeline). Fixed at two
 * layers: `parseDateInput`'s slash/ISO branches now validate + swap/guard
 * instead of leaking a truthy Invalid Date object, and
 * `BookingSlotResolverService.checkSlotAvailability` now short-circuits to a
 * graceful "invalid_date" clarification before ever reaching the DB query.
 *
 * Run: node frontend/scripts/qa-e2e-bug-343.mjs
 * Requires: API on :3001, salon `gevgas-operations-7c299253` with an owner
 * membership, employee "Gevorg Gasparyan", and a "Deep tissue massage" service.
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

const JWT_SECRET =
  process.env.JWT_SECRET || 'dev-secret-change-in-production-f8a3b2c1d4e5';
const SLUG = 'gevgas-operations-7c299253';

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
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 3001,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          ...headers,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = raw;
          }
          resolvePromise({ status: res.statusCode, body: parsed });
        });
      },
    );
    req.on('error', reject);
    req.write(data);
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

  async function ask(prompt) {
    const res = await request(
      'POST',
      `/businesses/${businessId}/ai/command`,
      { prompt },
      authHeaders,
    );
    const data = res.body?.data ?? res.body;
    return {
      status: res.status,
      action: data?.action,
      success: data?.success,
      summary: String(data?.summary || ''),
    };
  }

  // Exact reported repro — must no longer crash, and must degrade to a
  // clear clarification message rather than a raw crash / opaque error.
  {
    const r = await ask(
      'Book Gevorg Gasparyan for a Deep tissue massage on 08/19/2026 at 09:30 AM',
    );
    check(
      'exact-repro-no-crash',
      r.status < 500 &&
        r.action !== 'error' &&
        !/something went wrong/i.test(r.summary),
      `got status=${r.status} action=${r.action} summary=${r.summary}`,
    );
  }

  // A different MM/DD date with day > 12 — must also resolve, not crash.
  {
    const r = await ask(
      'Book Gevorg Gasparyan for a Deep tissue massage on 12/25/2026 at 10:00 AM',
    );
    check(
      'december-mmdd-no-crash',
      r.status < 500 && r.action !== 'error',
      `got status=${r.status} action=${r.action} summary=${r.summary}`,
    );
  }

  // Regression: unambiguous ISO date still works.
  {
    const r = await ask(
      'Book Gevorg Gasparyan for a Deep tissue massage on 2026-08-19 at 09:30 AM',
    );
    check(
      'iso-date-regression',
      r.status < 500 && r.action !== 'error',
      `got status=${r.status} action=${r.action} summary=${r.summary}`,
    );
  }

  // Regression: unambiguous month-name date still works.
  {
    const r = await ask(
      'Book Gevorg Gasparyan for a Deep tissue massage on August 19 2026 at 09:30 AM',
    );
    check(
      'month-name-date-regression',
      r.status < 500 && r.action !== 'error',
      `got status=${r.status} action=${r.action} summary=${r.summary}`,
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
