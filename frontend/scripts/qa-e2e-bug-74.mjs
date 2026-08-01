/**
 * Manual live QA for e2e-bug.74 — concurrent provider check-in serialization.
 *
 * Also guards the e2e-bug.184 residual: FOR UPDATE must not LEFT JOIN nullable
 * relations (would 500 with "nullable side of an outer join").
 *
 * Run: node scripts/qa-e2e-bug-74.mjs
 */
import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(__dirname, '../../backend');
const require = createRequire(resolve(backendRoot, 'package.json'));

const SLUG = process.env.SALON_SLUG || 'gevgas-operations-7c299253';
const API = process.env.API_BASE || 'http://127.0.0.1:3001';

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

function request(method, path, { token, body } = {}) {
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
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
    req.setTimeout(60000, () => req.destroy(new Error('timeout')));
    if (data) req.write(data);
    req.end();
  });
}

function msgOf(body) {
  const m = body?.message ?? body?.data?.message ?? body;
  return String(Array.isArray(m) ? m.join(' ') : m ?? '');
}

async function main() {
  loadEnv();
  const { Client } = require('pg');
  const jwt = require('jsonwebtoken');
  const crypto = require('crypto');

  const c = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD || undefined,
    database: process.env.DB_NAME,
  });
  await c.connect();

  const biz = (
    await c.query('SELECT id FROM businesses WHERE slug=$1', [SLUG])
  ).rows[0];
  if (!biz) throw new Error(`business not found: ${SLUG}`);

  const member = (
    await c.query(
      `SELECT bm.user_id, bm.role, u.email, u.role AS user_role
       FROM business_members bm
       JOIN users u ON u.id = bm.user_id
       WHERE bm.business_id=$1 AND bm.role='owner' LIMIT 1`,
      [biz.id],
    )
  ).rows[0];
  if (!member) throw new Error('no owner membership');

  const emp = (
    await c.query(
      `SELECT id FROM employees WHERE business_id=$1 AND "isActive"=true LIMIT 1`,
      [biz.id],
    )
  ).rows[0];
  const svc = (
    await c.query(
      `SELECT id FROM services WHERE business_id=$1 AND "isActive"=true LIMIT 1`,
      [biz.id],
    )
  ).rows[0];
  if (!emp || !svc) throw new Error('need employee + service');

  const token = jwt.sign(
    {
      sub: member.user_id,
      email: String(member.email).toLowerCase(),
      role: member.user_role,
      businessId: biz.id,
      membershipRole: member.role,
      employeeId: null,
    },
    process.env.JWT_SECRET,
    { expiresIn: '2h' },
  );

  const createdIds = [];
  const results = [];

  async function insertBooking({ status = 'confirmed' } = {}) {
    const id = crypto.randomUUID();
    const start = new Date(Date.now() + 48 * 3600 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    await c.query(
      `INSERT INTO bookings (
         id, business_id, employee_id, service_id, customer_id,
         status, "paymentStatus", "startTime", "endTime",
         checked_in_at, metadata, "createdAt", "updatedAt"
       ) VALUES (
         $1,$2,$3,$4,NULL,
         $5,'pending',$6,$7,
         NULL,'{}'::jsonb,NOW(),NOW()
       )`,
      [id, biz.id, emp.id, svc.id, status, start.toISOString(), end.toISOString()],
    );
    createdIds.push(id);
    return id;
  }

  function checkIn(bookingId) {
    return request(
      'POST',
      `/businesses/${biz.id}/provider/bookings/${bookingId}/check-in`,
      { token },
    );
  }

  // —— first check-in succeeds ——
  {
    const id = await insertBooking();
    const res = await checkIn(id);
    const data = res.body?.data ?? res.body;
    const msg = msgOf(res.body);
    const pass =
      res.status >= 200 &&
      res.status < 300 &&
      data?.floorStatus === 'checked_in' &&
      !!data?.checkedInAt &&
      !/FOR UPDATE|nullable side of an outer join/i.test(msg);
    results.push({
      id: 'first-check-in-succeeds',
      pass,
      detail: {
        status: res.status,
        floorStatus: data?.floorStatus,
        checkedInAt: data?.checkedInAt,
        message: msg.slice(0, 160),
      },
    });
  }

  // —— sequential second rejected ——
  {
    const id = await insertBooking();
    const first = await checkIn(id);
    const second = await checkIn(id);
    const msg = msgOf(second.body);
    const pass =
      first.status >= 200 &&
      first.status < 300 &&
      second.status >= 400 &&
      second.status < 500 &&
      /already checked in/i.test(msg);
    results.push({
      id: 'sequential-second-rejected',
      pass,
      detail: {
        first: first.status,
        second: second.status,
        message: msg.slice(0, 160),
      },
    });
  }

  // —— 5 concurrent ——
  {
    const id = await insertBooking();
    const responses = await Promise.all(
      Array.from({ length: 5 }, () => checkIn(id)),
    );
    const ok = responses.filter((r) => r.status >= 200 && r.status < 300);
    const bad = responses.filter((r) => r.status >= 400 && r.status < 500);
    const serverErr = responses.filter((r) => r.status >= 500);
    const msgs = responses.map((r) => msgOf(r.body));
    const joinLeak = msgs.some((m) =>
      /FOR UPDATE|nullable side of an outer join/i.test(m),
    );
    const already = bad.filter((r) =>
      /already checked in/i.test(msgOf(r.body)),
    );
    results.push({
      id: 'concurrent-five-only-one-succeeds',
      pass: ok.length === 1 && already.length === 4 && serverErr.length === 0,
      detail: {
        statuses: responses.map((r) => r.status),
        ok: ok.length,
        alreadyCheckedIn: already.length,
        serverErr: serverErr.length,
      },
    });
    results.push({
      id: 'no-for-update-outer-join-500',
      pass: !joinLeak && serverErr.length === 0,
      detail: {
        joinLeak,
        serverErr: serverErr.length,
        sample: msgs.find((m) => /FOR UPDATE|nullable/i.test(m))?.slice(0, 160),
      },
    });
  }

  // —— cancelled rejected ——
  {
    const id = await insertBooking({ status: 'cancelled' });
    const res = await checkIn(id);
    const msg = msgOf(res.body);
    const pass =
      res.status >= 400 &&
      res.status < 500 &&
      /cancel|not available|not allowed|Check-in/i.test(msg);
    results.push({
      id: 'cancelled-booking-rejected',
      pass,
      detail: { status: res.status, message: msg.slice(0, 160) },
    });
  }

  // cleanup
  if (createdIds.length) {
    await c.query(`DELETE FROM bookings WHERE id = ANY($1::uuid[])`, [
      createdIds,
    ]);
  }
  await c.end();

  let failed = 0;
  console.log(`e2e-bug.74 QA → ${API} ${SLUG}\n`);
  for (const row of results) {
    if (row.pass) {
      console.log(`PASS ${row.id}`, JSON.stringify(row.detail).slice(0, 240));
    } else {
      failed += 1;
      console.log(`FAIL ${row.id}`, JSON.stringify(row.detail).slice(0, 320));
    }
  }
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
