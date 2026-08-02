/**
 * Guru live QA for e2e-bug.332 — dashboard create_booking's provider-not-free
 * conflict summary must use an unambiguous date label ("1 August 2026"),
 * never DD/MM slash ("01/08/2026") that an LLM can misread as US MM/DD.
 * Sibling of Fixed e2e-bug.306 (no-slot messages) / e2e-bug.285 (plan date).
 *
 * Run: node frontend/scripts/qa-e2e-bug-332.mjs
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

function monthName(m) {
  return [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ][m];
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

  // 1. Find an existing active future booking to reproduce a real conflict
  //    against (duplicate create_booking at the exact same employee/service/time).
  // Only a booking whose employee is actually assigned to the service
  // reliably reproduces the 'slot_unavailable' conflict (not
  // 'provider_not_assigned') when we duplicate it via the AI.
  const { rows: candidateRows } = await client.query(
    `SELECT b."startTime" AS start_time, e.name AS employee_name,
            e."serviceIds" AS service_ids, s.id AS service_id, s.name AS service_name
     FROM bookings b
     JOIN employees e ON e.id = b.employee_id
     JOIN services s ON s.id = b.service_id
     WHERE b.business_id = $1 AND b.status != 'cancelled'
       AND b."startTime" > now() + interval '5 days'
     ORDER BY b."startTime" ASC
     LIMIT 20`,
    [businessId],
  );
  const bookingRows = candidateRows.filter((row) => {
    const ids = row.service_ids
      ? String(row.service_ids).split(',').map((s) => s.trim())
      : [];
    return ids.length === 0 || ids.includes(row.service_id);
  });

  if (bookingRows.length === 0) {
    console.log('No suitable future booking found to reproduce a conflict against — skipping conflict-message checks.');
  } else {
    const row = bookingRows[0];
    const start = new Date(row.start_time);
    const hh24 = start.getUTCHours();
    const mm = String(start.getUTCMinutes()).padStart(2, '0');
    const hh12 = hh24 % 12 || 12;
    const ampm = hh24 >= 12 ? 'PM' : 'AM';
    const day = start.getUTCDate();
    const month = monthName(start.getUTCMonth());
    const year = start.getUTCFullYear();
    const expectedLabel = `${day} ${month} ${year}`;
    const dd = String(day).padStart(2, '0');
    const mmNum = String(start.getUTCMonth() + 1).padStart(2, '0');
    const forbiddenSlash = `${dd}/${mmNum}/${year}`;

    const prompt = `Book ${row.employee_name} for a ${row.service_name} on ${month} ${day} ${year} at ${hh12}:${mm} ${ampm}`;

    const res = await request(
      'POST',
      `/businesses/${businessId}/ai/command`,
      { prompt },
      authHeaders,
    );
    const data = res.body?.data ?? res.body;

    check(
      'conflict-reproduced-slot-unavailable',
      data?.success === false && data?.action === 'create_booking',
      `got success=${data?.success} action=${data?.action} summary=${data?.summary}`,
    );
    check(
      'conflict-summary-uses-ai-date-label',
      typeof data?.summary === 'string' && data.summary.includes(expectedLabel),
      `expected "${expectedLabel}" in summary, got: ${data?.summary}`,
    );
    check(
      'conflict-summary-no-slash-date',
      typeof data?.summary === 'string' &&
        !data.summary.includes(forbiddenSlash) &&
        !SLASH_DATE_RE.test(data.summary),
      `got: ${data?.summary}`,
    );
  }

  // 2. Regression: sibling "no one available" message (already-fixed path)
  //    must still be unambiguous too.
  {
    const { rows: empRows } = await client.query(
      `SELECT s.name AS service_name FROM services s
       WHERE s.business_id = $1 AND s."isActive" = true LIMIT 1`,
      [businessId],
    );
    if (empRows.length > 0) {
      const serviceName = empRows[0].service_name;
      const futureDate = new Date(Date.now() + 40 * 24 * 60 * 60 * 1000);
      const iso = futureDate.toISOString().slice(0, 10);
      const prompt = `Book a nonexistent provider named QaBug332NoSuchProvider for ${serviceName} on ${iso} at 03:00`;
      const res = await request(
        'POST',
        `/businesses/${businessId}/ai/command`,
        { prompt },
        authHeaders,
      );
      const data = res.body?.data ?? res.body;
      check(
        'sibling-message-no-slash-date-regression',
        typeof data?.summary === 'string' ? !SLASH_DATE_RE.test(data.summary) : true,
        `got: ${data?.summary}`,
      );
    }
  }

  await client.end();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
