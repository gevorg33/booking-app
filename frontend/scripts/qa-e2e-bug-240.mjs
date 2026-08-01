/**
 * Guru live QA for e2e-bug.240 — mark_visit_in_progress must be reachable
 * on provider AI (registry + rescue + dispatch), not stay unknown.
 *
 * Run: node scripts/qa-e2e-bug-240.mjs
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

  // Ensure a customer named Sam for name-targeted prompts
  let sam = (
    await c.query(
      `SELECT id, name FROM customers
       WHERE business_id=$1 AND lower(name) LIKE 'sam%'
       LIMIT 1`,
      [biz.id],
    )
  ).rows[0];
  if (!sam) {
    const id = crypto.randomUUID();
    await c.query(
      `INSERT INTO customers (id, business_id, name, email, phone, "isActive", "createdAt", "updatedAt")
       VALUES ($1,$2,'Sam QA',$3,NULL,true,NOW(),NOW())`,
      [id, biz.id, `sam-qa-${id.slice(0, 8)}@example.com`],
    );
    sam = { id, name: 'Sam QA' };
  }

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

  async function insertBooking({ customerId = sam.id, status = 'confirmed' } = {}) {
    const id = crypto.randomUUID();
    const start = new Date(Date.now() + 2 * 3600 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    await c.query(
      `INSERT INTO bookings (
         id, business_id, employee_id, service_id, customer_id,
         status, "paymentStatus", "startTime", "endTime",
         checked_in_at, metadata, "createdAt", "updatedAt"
       ) VALUES (
         $1,$2,$3,$4,$5,
         $6,'pending',$7,$8,
         NULL,'{}'::jsonb,NOW(),NOW()
       )`,
      [
        id,
        biz.id,
        emp.id,
        svc.id,
        customerId,
        status,
        start.toISOString(),
        end.toISOString(),
      ],
    );
    createdIds.push(id);
    return id;
  }

  async function providerAi(prompt, context = {}) {
    const res = await request(
      'POST',
      `/businesses/${biz.id}/provider/ai/command`,
      {
        token,
        body: {
          prompt,
          context: {
            // Default unconfirmed so classify/negative cases do not bulk-mutate
            // (see e2e-bug.263). Execution cases pass confirmed:true explicitly.
            confirmed: false,
            ...context,
          },
        },
      },
    );
    const data = unwrap(res.body);
    return { status: res.status, data, raw: res.body };
  }

  function record(id, pass, detail) {
    results.push({ id, pass, detail });
    const mark = pass ? 'PASS' : 'FAIL';
    console.log(
      `${mark}  ${id} — ${JSON.stringify(detail).slice(0, 220)}`,
    );
  }

  // —— Classification / rescue reachability (no booking needed) ——
  const classifyCases = [
    {
      id: 'repro-mark-sams-as-started',
      prompt: "Mark Sam's appointment as started",
      expectAction: 'mark_visit_in_progress',
    },
    {
      id: 'begin-janes-color',
      prompt: "Begin Jane's color",
      expectAction: 'mark_visit_in_progress',
    },
    {
      id: 'start-appointment-now',
      prompt: 'Start appointment now',
      expectAction: 'mark_visit_in_progress',
    },
    {
      id: 'start-service',
      prompt: 'Start service',
      expectAction: 'mark_visit_in_progress',
    },
    {
      id: 'begin-the-visit',
      prompt: 'Begin the visit',
      expectAction: 'mark_visit_in_progress',
    },
    {
      id: 'mark-in-progress',
      prompt: 'Mark in progress',
      expectAction: 'mark_visit_in_progress',
    },
    {
      id: 'start-sams-appointment',
      prompt: "Start Sam's appointment",
      expectAction: 'mark_visit_in_progress',
    },
    {
      id: 'hy-start-service',
      prompt: 'Սկսիր սպասարկումը',
      expectAction: 'mark_visit_in_progress',
    },
    {
      id: 'ru-start-service',
      prompt: 'Начни обслуживание',
      expectAction: 'mark_visit_in_progress',
    },
  ];

  for (const caze of classifyCases) {
    const { status, data } = await providerAi(caze.prompt);
    const action = data?.action;
    const pass =
      status >= 200 &&
      status < 300 &&
      action === caze.expectAction &&
      action !== 'unknown';
    record(caze.id, pass, {
      status,
      action,
      success: data?.success,
      summary: String(data?.summary || '').slice(0, 120),
    });
  }

  // —— Negatives: must not steal into mark_visit_in_progress ——
  const negCases = [
    {
      id: 'neg-complete',
      prompt: 'Mark visit complete',
      forbid: 'mark_visit_in_progress',
    },
    {
      id: 'neg-paid',
      prompt: 'Mark as paid',
      forbid: 'mark_visit_in_progress',
    },
    {
      id: 'neg-check-in',
      prompt: 'Check in client',
      forbid: 'mark_visit_in_progress',
    },
    {
      id: 'neg-no-show',
      prompt: 'Mark as no-show',
      forbid: 'mark_visit_in_progress',
    },
  ];

  for (const caze of negCases) {
    const { status, data } = await providerAi(caze.prompt);
    const action = data?.action;
    const pass =
      status >= 200 && status < 300 && action !== caze.forbid;
    record(caze.id, pass, {
      status,
      action,
      summary: String(data?.summary || '').slice(0, 120),
    });
  }

  // —— Execute with session bookingId: status becomes in_progress ——
  {
    const bookingId = await insertBooking();
    const { status, data } = await providerAi(
      "Mark Sam's appointment as started",
      { bookingId, confirmed: true },
    );
    const row = (
      await c.query(`SELECT status FROM bookings WHERE id=$1`, [bookingId])
    ).rows[0];
    const pass =
      status >= 200 &&
      status < 300 &&
      data?.action === 'mark_visit_in_progress' &&
      (data?.success === true || row?.status === 'in_progress') &&
      row?.status === 'in_progress';
    record('execute-with-bookingId', pass, {
      status,
      action: data?.action,
      success: data?.success,
      dbStatus: row?.status,
      summary: String(data?.summary || '').slice(0, 140),
    });
  }

  // —— Customer-name targeting without session bookingId ——
  {
    const bookingId = await insertBooking({ status: 'confirmed' });
    const { status, data } = await providerAi("Start Sam's appointment", {
      confirmed: true,
    });
    const row = (
      await c.query(`SELECT status FROM bookings WHERE id=$1`, [bookingId])
    ).rows[0];
    // Accept either successful flip OR clarify asking for which booking —
    // but action must still be mark_visit_in_progress (reachable), never unknown.
    const actionOk = data?.action === 'mark_visit_in_progress';
    const flipped = row?.status === 'in_progress';
    const clarifyOk =
      data?.success === false &&
      /booking|client|which|open/i.test(String(data?.summary || ''));
    const pass =
      status >= 200 &&
      status < 300 &&
      actionOk &&
      (flipped || clarifyOk || data?.success === true);
    record('execute-by-customer-name', pass, {
      status,
      action: data?.action,
      success: data?.success,
      dbStatus: row?.status,
      summary: String(data?.summary || '').slice(0, 140),
    });
  }

  // —— Idempotent / already in_progress ——
  {
    const bookingId = await insertBooking({ status: 'in_progress' });
    const { status, data } = await providerAi('Start appointment now', {
      bookingId,
      confirmed: true,
    });
    const pass =
      status >= 200 &&
      status < 300 &&
      data?.action === 'mark_visit_in_progress' &&
      status < 500;
    record('already-in-progress-no-500', pass, {
      status,
      action: data?.action,
      success: data?.success,
      summary: String(data?.summary || '').slice(0, 140),
    });
  }

  // cleanup
  if (createdIds.length) {
    await c.query(`DELETE FROM bookings WHERE id = ANY($1::uuid[])`, [
      createdIds,
    ]);
  }
  await c.end();

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass);
  console.log(
    `\ne2e-bug.240 QA → ${API} ${SLUG} — ${passed}/${results.length} PASS`,
  );
  if (failed.length) {
    console.log('FAILED:', failed.map((f) => f.id).join(', '));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
