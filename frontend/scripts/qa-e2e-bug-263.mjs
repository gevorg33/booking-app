/**
 * Guru live QA for e2e-bug.263 — provider mark_visit_in_progress /
 * mark_visit_complete without bookingId/customerName must clarify, not
 * bulk-mutate every matching day appointment.
 *
 * Run: node scripts/qa-e2e-bug-263.mjs
 */
import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import crypto from 'crypto';

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
    req.setTimeout(120000, () => req.destroy(new Error('timeout')));
    if (data) req.write(data);
    req.end();
  });
}

function unwrap(body) {
  return body?.data ?? body;
}

function isClarify(data) {
  const summary = String(data?.summary || '');
  return (
    data?.success === false &&
    (data?.details?.clarify === true ||
      /which client|name the customer|open (their|the) appointment/i.test(
        summary,
      ))
  );
}

async function main() {
  loadEnv();
  const { Client } = require('pg');
  const jwt = require('jsonwebtoken');

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
      `SELECT id, name FROM employees WHERE business_id=$1 AND "isActive"=true LIMIT 1`,
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

  async function ensureCustomer(name) {
    let row = (
      await c.query(
        `SELECT id, name FROM customers WHERE business_id=$1 AND name=$2 LIMIT 1`,
        [biz.id, name],
      )
    ).rows[0];
    if (row) return row;
    const id = crypto.randomUUID();
    await c.query(
      `INSERT INTO customers (id, business_id, name, email, phone, "isActive", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,NULL,true,NOW(),NOW())`,
      [id, biz.id, name, `${name.toLowerCase().replace(/\s+/g, '-')}-${id.slice(0, 8)}@example.com`],
    );
    return { id, name };
  }

  const customers = await Promise.all([
    ensureCustomer('E2E263 Ada'),
    ensureCustomer('E2E263 Bea'),
    ensureCustomer('E2E263 Target'),
  ]);

  const token = jwt.sign(
    {
      sub: member.user_id,
      email: String(member.email).toLowerCase(),
      role: member.user_role,
      businessId: biz.id,
      membershipRole: member.role,
      employeeId: emp.id,
    },
    process.env.JWT_SECRET,
    { expiresIn: '2h' },
  );

  const createdIds = [];
  const results = [];

  async function insertBooking(customerId, hoursAhead = 2) {
    const id = crypto.randomUUID();
    const start = new Date(Date.now() + hoursAhead * 3600 * 1000);
    const end = new Date(start.getTime() + 45 * 60 * 1000);
    await c.query(
      `INSERT INTO bookings (
         id, business_id, employee_id, service_id, customer_id,
         status, "paymentStatus", "startTime", "endTime",
         checked_in_at, metadata, "createdAt", "updatedAt"
       ) VALUES (
         $1,$2,$3,$4,$5,
         'confirmed','pending',$6,$7,
         NULL,'{}'::jsonb,NOW(),NOW()
       )`,
      [id, biz.id, emp.id, svc.id, customerId, start.toISOString(), end.toISOString()],
    );
    createdIds.push(id);
    return id;
  }

  async function statuses(ids) {
    const r = await c.query(
      `SELECT id, status FROM bookings WHERE id = ANY($1::uuid[])`,
      [ids],
    );
    return Object.fromEntries(r.rows.map((row) => [row.id, row.status]));
  }

  async function providerAi(prompt, context = {}) {
    const res = await request(
      'POST',
      `/businesses/${biz.id}/provider/ai/command`,
      {
        token,
        body: {
          prompt,
          context: { confirmed: true, ...context },
        },
      },
    );
    return { status: res.status, data: unwrap(res.body) };
  }

  function record(id, pass, detail) {
    results.push({ id, pass, detail });
    console.log(
      `${pass ? 'PASS' : 'FAIL'}  ${id} — ${JSON.stringify(detail).slice(0, 240)}`,
    );
  }

  try {
    console.log(`e2e-bug.263 QA → ${API} ${SLUG}\n  employee=${emp.name}\n`);

    const idA = await insertBooking(customers[0].id, 2);
    const idB = await insertBooking(customers[1].id, 3);
    const idT = await insertBooking(customers[2].id, 4);
    const dayIds = [idA, idB, idT];

    const untargeted = [
      {
        id: 'e2e263-live-untargeted-in-progress-clarify',
        prompt: 'Start appointment now',
        expectAction: 'mark_visit_in_progress',
      },
      {
        id: 'e2e263-live-untargeted-complete-clarify',
        prompt: 'Mark visit complete',
        expectAction: 'mark_visit_complete',
      },
      {
        id: 'e2e263-live-untargeted-mark-in-progress-clarify',
        prompt: 'Mark in progress',
        expectAction: 'mark_visit_in_progress',
      },
      {
        id: 'e2e263-live-begin-visit-clarify',
        prompt: 'Begin the visit',
        expectAction: 'mark_visit_in_progress',
      },
      {
        id: 'e2e263-live-hy-start-clarify',
        prompt: 'Սկսիր սպասարկումը',
        expectAction: 'mark_visit_in_progress',
      },
      {
        id: 'e2e263-live-ru-start-clarify',
        prompt: 'Начни обслуживание',
        expectAction: 'mark_visit_in_progress',
      },
    ];

    for (const caze of untargeted) {
      const before = await statuses(dayIds);
      const { status, data } = await providerAi(caze.prompt);
      const after = await statuses(dayIds);
      const unchanged = dayIds.every((id) => after[id] === before[id]);
      const pass =
        status >= 200 &&
        status < 300 &&
        data?.action === caze.expectAction &&
        isClarify(data) &&
        unchanged &&
        !/Updated \d+ appointment/i.test(String(data?.summary || ''));
      record(caze.id, pass, {
        status,
        action: data?.action,
        success: data?.success,
        clarify: data?.details?.clarify,
        unchanged,
        summary: String(data?.summary || '').slice(0, 140),
      });
    }

    // Named client updates only Target
    {
      const before = await statuses(dayIds);
      const { status, data } = await providerAi(
        "Start E2E263 Target's appointment",
      );
      const after = await statuses(dayIds);
      const pass =
        status >= 200 &&
        status < 300 &&
        data?.action === 'mark_visit_in_progress' &&
        after[idT] === 'in_progress' &&
        after[idA] === before[idA] &&
        after[idB] === before[idB];
      record('e2e263-live-named-client-updates-one', pass, {
        status,
        action: data?.action,
        success: data?.success,
        target: after[idT],
        others: { a: after[idA], b: after[idB] },
        summary: String(data?.summary || '').slice(0, 140),
      });
      // reset target for next case
      await c.query(`UPDATE bookings SET status='confirmed' WHERE id=$1`, [
        idT,
      ]);
    }

    // Session bookingId updates only that one
    {
      const before = await statuses(dayIds);
      const { status, data } = await providerAi('Start appointment now', {
        bookingId: idB,
      });
      const after = await statuses(dayIds);
      const pass =
        status >= 200 &&
        status < 300 &&
        data?.action === 'mark_visit_in_progress' &&
        after[idB] === 'in_progress' &&
        after[idA] === before[idA] &&
        after[idT] === before[idT];
      record('e2e263-live-session-bookingId-updates-one', pass, {
        status,
        action: data?.action,
        success: data?.success,
        b: after[idB],
        others: { a: after[idA], t: after[idT] },
        summary: String(data?.summary || '').slice(0, 140),
      });
      await c.query(`UPDATE bookings SET status='confirmed' WHERE id=$1`, [
        idB,
      ]);
    }

    // Single remaining appointment: untargeted may proceed (unique match)
    {
      await c.query(`UPDATE bookings SET status='cancelled' WHERE id = ANY($1::uuid[])`, [
        [idA, idB],
      ]);
      const { status, data } = await providerAi('Start appointment now');
      const after = await statuses([idT]);
      const pass =
        status >= 200 &&
        status < 300 &&
        data?.action === 'mark_visit_in_progress' &&
        (after[idT] === 'in_progress' || isClarify(data));
      // Prefer unique-match update; clarify also acceptable if name extract fails.
      record('e2e263-live-single-match-may-update', pass, {
        status,
        action: data?.action,
        success: data?.success,
        target: after[idT],
        summary: String(data?.summary || '').slice(0, 140),
      });
    }
  } finally {
    if (createdIds.length) {
      await c.query(`DELETE FROM bookings WHERE id = ANY($1::uuid[])`, [
        createdIds,
      ]).catch((err) => console.warn('cleanup', err.message));
    }
    await c.end();
  }

  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
