/**
 * Guru live QA for e2e-bug.329 — a compound "move X's appointment; then book
 * Y" must not silently drop the reschedule leg and jump straight to
 * executing the create leg when the reschedule leg can't build a plan (e.g.
 * no matching booking for that customer).
 *
 * Run: node frontend/scripts/qa-e2e-bug-329.mjs
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
            ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
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
  const { user_id: userId, role } = memberRows[0];
  const token = jwt.sign(
    { sub: userId, businessId, membershipRole: role },
    JWT_SECRET,
    { expiresIn: '1h' },
  );

  const countMassageBookings = async () => {
    const { rows } = await client.query(
      `SELECT count(*)::int AS n FROM bookings b
       JOIN customers c ON c.id = b.customer_id
       WHERE b.business_id = $1 AND c.name ILIKE '%QaBug329NoSuchCustomer%'`,
      [businessId],
    );
    return rows[0].n;
  };

  const before = await countMassageBookings();

  const failures = [];
  let passed = 0;
  const total = 1;

  const prompt =
    "Move QaBug329ReallyDoesNotExist's appointment to Friday 3pm; then book a Swedish massage for QaBug329NoSuchCustomer with Gevorg tomorrow at 10am";

  const res = await request(
    'POST',
    `/businesses/${businessId}/ai/command`,
    { prompt },
    { Authorization: `Bearer ${token}` },
  );
  const body = res.body?.data ?? res.body;
  const errors = [];

  if (body?.action === 'create_booking' || body?.success === true) {
    errors.push(
      `compound silently executed the create leg without the reschedule leg (action=${body?.action}, success=${body?.success})`,
    );
  }
  if (body?.action !== 'reschedule_booking' && body?.action !== 'compound_intent') {
    errors.push(`unexpected action=${body?.action}`);
  }
  if (body?.success !== false) {
    errors.push(`expected success=false, got ${body?.success}`);
  }

  const after = await countMassageBookings();
  if (after !== before) {
    errors.push(
      `massage booking WAS created for the never-mentioned-before customer (before=${before}, after=${after}) — reschedule leg was silently skipped and the create leg ran anyway`,
    );
  }

  if (errors.length) {
    failures.push({ id: 'compound-reschedule-no-plan-must-not-skip', errors });
    console.log('FAIL compound-reschedule-no-plan-must-not-skip');
    for (const e of errors) console.log(`  - ${e}`);
    console.log(`  action=${body?.action} success=${body?.success} summary=${JSON.stringify(body?.summary)}`);
  } else {
    passed += 1;
    console.log('PASS compound-reschedule-no-plan-must-not-skip');
    console.log(`  action=${body?.action} success=${body?.success} summary=${JSON.stringify(body?.summary)}`);
  }

  // Cleanup: remove any test booking that may have leaked through despite the fix.
  await client.query(
    `DELETE FROM bookings b USING customers c
     WHERE b.customer_id = c.id AND b.business_id = $1 AND c.name ILIKE '%QaBug329%'`,
    [businessId],
  );
  await client.query(
    `DELETE FROM customers WHERE business_id = $1 AND name ILIKE '%QaBug329%'`,
    [businessId],
  );

  await client.end();

  console.log(`\n${passed}/${total} passed`);
  if (failures.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
