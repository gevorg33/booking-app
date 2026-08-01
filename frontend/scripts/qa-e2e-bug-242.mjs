/**
 * Guru live QA for e2e-bug.242 — confirm_pending_booking must be reachable
 * on provider AI; only pending bookings; named vs bulk; confirm gate.
 *
 * Run: node scripts/qa-e2e-bug-242.mjs
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
      employeeId: emp.id,
    },
    process.env.JWT_SECRET,
    { expiresIn: '2h' },
  );

  const createdBookingIds = [];
  const createdCustomerIds = [];
  const results = [];

  async function ensureCustomer(name) {
    const existing = (
      await c.query(
        `SELECT id, name FROM customers
         WHERE business_id=$1 AND lower(name)=$2 LIMIT 1`,
        [biz.id, name.toLowerCase()],
      )
    ).rows[0];
    if (existing) return existing;
    const id = crypto.randomUUID();
    await c.query(
      `INSERT INTO customers (id, business_id, name, email, phone, "isActive", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,NULL,true,NOW(),NOW())`,
      [id, biz.id, name, `confirm-qa-${id.slice(0, 8)}@example.com`],
    );
    createdCustomerIds.push(id);
    return { id, name };
  }

  async function insertBooking({
    customerId,
    status = 'pending',
    hoursFromNow = 3,
  }) {
    const id = crypto.randomUUID();
    const start = new Date(Date.now() + hoursFromNow * 3600 * 1000);
    // Keep on "today" window the handler defaults to
    const end = new Date(start.getTime() + 45 * 60 * 1000);
    await c.query(
      `INSERT INTO bookings (
         id, business_id, employee_id, service_id, customer_id,
         status, "paymentStatus", "startTime", "endTime",
         metadata, "createdAt", "updatedAt"
       ) VALUES (
         $1,$2,$3,$4,$5,
         $6,'pending',$7,$8,
         '{}'::jsonb,NOW(),NOW()
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
    createdBookingIds.push(id);
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
            confirmed: false,
            ...context,
          },
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

  // —— Classification / rescue ——
  const classifyCases = [
    'Confirm all pending today',
    "Accept Maria's booking",
    "Confirm Jane's appointment",
    'Approve all pending appointments',
    "Accept Sam's pending appointment",
    'Confirm my pending bookings',
    'Հաստատիր բոլոր սպասող ամրագրումները',
    'Подтверди все ожидающие записи',
  ];
  for (const [i, prompt] of classifyCases.entries()) {
    const { status, data } = await providerAi(prompt);
    const pass =
      status >= 200 &&
      status < 300 &&
      data?.action === 'confirm_pending_booking';
    record(`classify-${i + 1}`, pass, {
      prompt,
      status,
      action: data?.action,
      summary: String(data?.summary || '').slice(0, 120),
    });
  }

  // —— Negatives ——
  const negCases = [
    {
      id: 'neg-push',
      prompt: 'Confirm this booking from the push',
      forbid: 'confirm_pending_booking',
      allow: ['confirm_booking_from_push', 'unknown', 'clarify'],
    },
    {
      id: 'neg-visit-complete',
      prompt: 'Mark visit complete',
      forbid: 'confirm_pending_booking',
    },
    {
      id: 'neg-in-progress',
      prompt: 'Mark in progress',
      forbid: 'confirm_pending_booking',
    },
    {
      id: 'neg-paid',
      prompt: 'Mark as paid',
      forbid: 'confirm_pending_booking',
    },
  ];
  for (const caze of negCases) {
    const { status, data } = await providerAi(caze.prompt);
    const pass =
      status >= 200 &&
      status < 300 &&
      data?.action !== caze.forbid;
    record(caze.id, pass, {
      status,
      action: data?.action,
      summary: String(data?.summary || '').slice(0, 120),
    });
  }

  const maria = await ensureCustomer('Maria');
  const jane = await ensureCustomer('Jane');
  const sam = await ensureCustomer('Sam');

  // —— Empty pending ——
  {
    // Use a far-future day with no bookings via explicit date? Handler defaults today.
    // Just call with a unique name that has no pending.
    const { status, data } = await providerAi(
      "Confirm Zzznobodyqa's appointment",
      { confirmed: true },
    );
    const pass =
      status >= 200 &&
      status < 300 &&
      data?.action === 'confirm_pending_booking' &&
      /no pending/i.test(String(data?.summary || ''));
    record('empty-named-no-pending', pass, {
      status,
      action: data?.action,
      summary: String(data?.summary || '').slice(0, 140),
    });
  }

  // —— Named confirm: only Maria pending, not Jane confirmed ——
  {
    const mariaPending = await insertBooking({
      customerId: maria.id,
      status: 'pending',
      hoursFromNow: 2,
    });
    const janeConfirmed = await insertBooking({
      customerId: jane.id,
      status: 'confirmed',
      hoursFromNow: 2.5,
    });
    const { status, data } = await providerAi("Accept Maria's booking", {
      confirmed: true,
    });
    const rows = (
      await c.query(
        `SELECT id, status FROM bookings WHERE id = ANY($1::uuid[])`,
        [[mariaPending, janeConfirmed]],
      )
    ).rows;
    const m = rows.find((r) => r.id === mariaPending)?.status;
    const j = rows.find((r) => r.id === janeConfirmed)?.status;
    const pass =
      status >= 200 &&
      status < 300 &&
      data?.action === 'confirm_pending_booking' &&
      m === 'confirmed' &&
      j === 'confirmed'; // was already confirmed; must not flip elsewhere
    record('named-confirm-only-maria-pending', pass, {
      status,
      action: data?.action,
      success: data?.success,
      maria: m,
      jane: j,
      summary: String(data?.summary || '').slice(0, 140),
    });
  }

  // —— Bulk: only pending flipped; already-confirmed untouched ——
  {
    const p1 = await insertBooking({
      customerId: maria.id,
      status: 'pending',
      hoursFromNow: 3,
    });
    const p2 = await insertBooking({
      customerId: sam.id,
      status: 'pending',
      hoursFromNow: 3.5,
    });
    const already = await insertBooking({
      customerId: jane.id,
      status: 'confirmed',
      hoursFromNow: 4,
    });

    // Unconfirmed → should ask when >=2 pending
    const ask = await providerAi('Confirm all pending today', {
      confirmed: false,
    });
    const askPass =
      ask.data?.action === 'confirm_pending_booking' &&
      /confirm\s+\d+\s+pending/i.test(String(ask.data?.summary || ''));
    record('bulk-asks-confirmation', askPass, {
      action: ask.data?.action,
      summary: String(ask.data?.summary || '').slice(0, 140),
    });

    const { status, data } = await providerAi('Confirm all pending today', {
      confirmed: true,
    });
    const rows = (
      await c.query(
        `SELECT id, status FROM bookings WHERE id = ANY($1::uuid[])`,
        [[p1, p2, already]],
      )
    ).rows;
    const s1 = rows.find((r) => r.id === p1)?.status;
    const s2 = rows.find((r) => r.id === p2)?.status;
    const sA = rows.find((r) => r.id === already)?.status;
    const pass =
      status >= 200 &&
      status < 300 &&
      data?.action === 'confirm_pending_booking' &&
      s1 === 'confirmed' &&
      s2 === 'confirmed' &&
      sA === 'confirmed';
    record('bulk-confirm-only-pending', pass, {
      status,
      action: data?.action,
      success: data?.success,
      p1: s1,
      p2: s2,
      already: sA,
      summary: String(data?.summary || '').slice(0, 140),
    });
  }

  // —— Named does not bulk-confirm other pending ——
  {
    const mariaPending = await insertBooking({
      customerId: maria.id,
      status: 'pending',
      hoursFromNow: 5,
    });
    const samPending = await insertBooking({
      customerId: sam.id,
      status: 'pending',
      hoursFromNow: 5.5,
    });
    const { status, data } = await providerAi("Confirm Jane's appointment", {
      confirmed: true,
    });
    // Jane has no pending — expect no pending / no change to maria+sam
    const rows = (
      await c.query(
        `SELECT id, status FROM bookings WHERE id = ANY($1::uuid[])`,
        [[mariaPending, samPending]],
      )
    ).rows;
    const bothStillPending = rows.every((r) => r.status === 'pending');
    const pass =
      status >= 200 &&
      status < 300 &&
      data?.action === 'confirm_pending_booking' &&
      bothStillPending;
    record('named-jane-does-not-touch-others', pass, {
      status,
      action: data?.action,
      bothStillPending,
      summary: String(data?.summary || '').slice(0, 140),
    });
  }

  // —— Single pending named confirm without bulk confirm gate ——
  {
    // Unique client so leftover Sam pending from earlier cases can't bump count ≥2
    const solo = await ensureCustomer('SamSolo');
    const soloPending = await insertBooking({
      customerId: solo.id,
      status: 'pending',
      hoursFromNow: 6,
    });
    const { status, data } = await providerAi(
      "Accept SamSolo's pending appointment",
      { confirmed: false },
    );
    const row = (
      await c.query(`SELECT status FROM bookings WHERE id=$1`, [soloPending])
    ).rows[0];
    // Single match (< BULK_CONFIRM_THRESHOLD=2) executes without confirmed:true
    const pass =
      status >= 200 &&
      status < 300 &&
      data?.action === 'confirm_pending_booking' &&
      row?.status === 'confirmed';
    record('single-named-samsolo', pass, {
      status,
      action: data?.action,
      dbStatus: row?.status,
      summary: String(data?.summary || '').slice(0, 140),
    });
  }

  if (createdBookingIds.length) {
    await c.query(`DELETE FROM bookings WHERE id = ANY($1::uuid[])`, [
      createdBookingIds,
    ]);
  }
  if (createdCustomerIds.length) {
    await c.query(`DELETE FROM customers WHERE id = ANY($1::uuid[])`, [
      createdCustomerIds,
    ]);
  }
  await c.end();

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass);
  console.log(
    `\ne2e-bug.242 QA → ${API} ${SLUG} — ${passed}/${results.length} PASS`,
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
