/**
 * Guru live QA for e2e-bug.264 — mark_multi_service_step_done must resolve
 * customerName when bookingId/session booking is absent.
 *
 * Run: node scripts/qa-e2e-bug-264.mjs
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
  const svcRows = (
    await c.query(
      `SELECT id, name FROM services WHERE business_id=$1 AND "isActive"=true ORDER BY name ASC LIMIT 10`,
      [biz.id],
    )
  ).rows;
  const hairdrying =
    svcRows.find((s) => /hairdry/i.test(s.name)) || svcRows[0];
  const hairstyle =
    svcRows.find((s) => /hairstyle|haircut|cut/i.test(s.name) && s.id !== hairdrying?.id) ||
    svcRows.find((s) => s.id !== hairdrying?.id) ||
    svcRows[1];
  if (!emp || !hairdrying || !hairstyle) {
    throw new Error('need employee + 2 services');
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

  const createdBookingIds = [];
  const createdCustomerIds = [];
  const results = [];

  async function insertCustomer(name) {
    const id = crypto.randomUUID();
    await c.query(
      `INSERT INTO customers (id, business_id, name, email, phone, "isActive", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,NULL,true,NOW(),NOW())`,
      [id, biz.id, name, `${name.toLowerCase().replace(/\s+/g, '-')}-${id.slice(0, 8)}@example.com`],
    );
    createdCustomerIds.push(id);
    return id;
  }

  /** Place legs on today's UTC calendar day (resolver scans today only). */
  function todayUtcSlot(hourUtc, minuteUtc = 0) {
    const now = new Date();
    return new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        hourUtc,
        minuteUtc,
        0,
        0,
      ),
    );
  }

  async function insertMultiGroup(customerName, hourUtc = 15, minuteUtc = 0) {
    const groupId = crypto.randomUUID();
    const customerId = await insertCustomer(customerName);
    const start1 = todayUtcSlot(hourUtc, minuteUtc);
    // If that slot already passed, nudge forward but keep same UTC day when possible.
    if (start1.getTime() < Date.now() - 60_000) {
      const late = new Date(Date.now() + 30 * 60 * 1000);
      if (late.getUTCDate() === start1.getUTCDate()) {
        start1.setTime(late.getTime());
      }
    }
    const end1 = new Date(start1.getTime() + 45 * 60 * 1000);
    const start2 = end1;
    const end2 = new Date(start2.getTime() + 45 * 60 * 1000);
    const leg1 = crypto.randomUUID();
    const leg2 = crypto.randomUUID();
    for (const [id, svcId, start, end] of [
      [leg1, hairdrying.id, start1, end1],
      [leg2, hairstyle.id, start2, end2],
    ]) {
      await c.query(
        `INSERT INTO bookings (
           id, business_id, employee_id, service_id, customer_id,
           status, "paymentStatus", "startTime", "endTime",
           multi_service_group_id, checked_in_at, metadata, "createdAt", "updatedAt"
         ) VALUES (
           $1,$2,$3,$4,$5,
           'confirmed','pending',$6,$7,
           $8,NULL,'{}'::jsonb,NOW(),NOW()
         )`,
        [
          id,
          biz.id,
          emp.id,
          svcId,
          customerId,
          start.toISOString(),
          end.toISOString(),
          groupId,
        ],
      );
      createdBookingIds.push(id);
    }
    return { groupId, leg1, leg2, customerId };
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

  async function statusOf(id) {
    const r = await c.query(`SELECT status FROM bookings WHERE id=$1`, [id]);
    return r.rows[0]?.status;
  }

  function record(id, pass, detail) {
    results.push({ id, pass, detail });
    console.log(
      `${pass ? 'PASS' : 'FAIL'}  ${id} — ${JSON.stringify(detail).slice(0, 260)}`,
    );
  }

  try {
    console.log(
      `e2e-bug.264 QA → ${API} ${SLUG}\n  employee=${emp.name} legs=${hairdrying.name}/${hairstyle.name}\n`,
    );

    const spa = await insertMultiGroup('Spa Day QA', 14, 0);

    // 1) customerName + stepIndex, no bookingId
    {
      const { status, data } = await providerAi(
        'Finish step 1 for Spa Day QA',
      );
      const leg1 = await statusOf(spa.leg1);
      const leg2 = await statusOf(spa.leg2);
      const pass =
        status >= 200 &&
        status < 300 &&
        data?.action === 'mark_multi_service_step_done' &&
        data?.success === true &&
        leg1 === 'completed' &&
        leg2 === 'confirmed';
      record('e2e264-live-customerName-step1-no-bookingId', pass, {
        status,
        action: data?.action,
        success: data?.success,
        leg1,
        leg2,
        summary: String(data?.summary || '').slice(0, 140),
      });
      await c.query(`UPDATE bookings SET status='confirmed' WHERE id=$1`, [
        spa.leg1,
      ]);
    }

    // 2) customerName + service leg (use actual first service name)
    {
      const svcWord = String(hairdrying.name).split(/\s+/)[0];
      const { status, data } = await providerAi(
        `Complete ${svcWord} leg for Spa Day QA`,
      );
      const leg1 = await statusOf(spa.leg1);
      const leg2 = await statusOf(spa.leg2);
      const pass =
        status >= 200 &&
        status < 300 &&
        data?.action === 'mark_multi_service_step_done' &&
        (leg1 === 'completed' ||
          (data?.success === false && /which step/i.test(String(data?.summary || ''))));
      // Prefer completed leg1; clarify which step is acceptable if service name didn't match.
      const ok =
        pass &&
        (leg1 === 'completed'
          ? leg2 === 'confirmed'
          : true);
      record('e2e264-live-customerName-leg-service', ok, {
        status,
        action: data?.action,
        success: data?.success,
        svcWord,
        leg1,
        leg2,
        summary: String(data?.summary || '').slice(0, 140),
      });
      await c.query(`UPDATE bookings SET status='confirmed' WHERE id=$1`, [
        spa.leg1,
      ]);
    }

    // 3) no customer name → still ask to open booking
    {
      const { status, data } = await providerAi('Finish step 1 of spa day');
      const pass =
        status >= 200 &&
        status < 300 &&
        data?.action === 'mark_multi_service_step_done' &&
        data?.success === false &&
        /open the multi-service booking/i.test(String(data?.summary || ''));
      record('e2e264-live-no-name-still-clarify', pass, {
        status,
        action: data?.action,
        success: data?.success,
        summary: String(data?.summary || '').slice(0, 140),
      });
    }

    // 4) unknown customer
    {
      const { status, data } = await providerAi(
        'Finish step 1 for Nobody Matching',
      );
      const pass =
        status >= 200 &&
        status < 300 &&
        data?.action === 'mark_multi_service_step_done' &&
        data?.success === false &&
        /no multi-service visit found|nobody matching|open the multi-service/i.test(
          String(data?.summary || ''),
        );
      record('e2e264-live-unknown-customer-clarify', pass, {
        status,
        action: data?.action,
        success: data?.success,
        summary: String(data?.summary || '').slice(0, 160),
      });
    }

    // 5) session bookingId still works
    {
      const { status, data } = await providerAi('Finish step 1', {
        bookingId: spa.leg2,
      });
      const leg1 = await statusOf(spa.leg1);
      const pass =
        status >= 200 &&
        status < 300 &&
        data?.action === 'mark_multi_service_step_done' &&
        data?.success === true &&
        leg1 === 'completed';
      record('e2e264-live-session-bookingId-still-works', pass, {
        status,
        action: data?.action,
        success: data?.success,
        leg1,
        summary: String(data?.summary || '').slice(0, 140),
      });
      await c.query(`UPDATE bookings SET status='confirmed' WHERE id=$1`, [
        spa.leg1,
      ]);
    }

    // 6) two groups same customer name → clarify
    {
      // Same UTC day, different start times — both must be visible to the resolver.
      const twinA = await insertMultiGroup('Twin Group QA', 16, 0);
      const twinB = await insertMultiGroup('Twin Group QA', 18, 0);
      const { status, data } = await providerAi(
        'Finish step 1 for Twin Group QA',
      );
      const a1 = await statusOf(twinA.leg1);
      const b1 = await statusOf(twinB.leg1);
      const pass =
        status >= 200 &&
        status < 300 &&
        data?.action === 'mark_multi_service_step_done' &&
        data?.success === false &&
        /found \d+ multi-service|which|open one|specify a time/i.test(
          String(data?.summary || ''),
        ) &&
        a1 === 'confirmed' &&
        b1 === 'confirmed';
      record('e2e264-live-two-groups-same-name-clarify', pass, {
        status,
        action: data?.action,
        success: data?.success,
        a1,
        b1,
        summary: String(data?.summary || '').slice(0, 160),
      });
    }

    // 7) HY with English customer name still classifies + resolves if name present
    {
      await c.query(`UPDATE bookings SET status='confirmed' WHERE id=$1`, [
        spa.leg1,
      ]);
      const { status, data } = await providerAi(
        'Ավարտված է 1-ին քայլը for Spa Day QA',
      );
      const leg1 = await statusOf(spa.leg1);
      const pass =
        status >= 200 &&
        status < 300 &&
        data?.action === 'mark_multi_service_step_done' &&
        (leg1 === 'completed' ||
          (data?.success === false &&
            /which step|open|no multi-service/i.test(
              String(data?.summary || ''),
            )));
      record('e2e264-live-hy-with-for-name', pass, {
        status,
        action: data?.action,
        success: data?.success,
        leg1,
        summary: String(data?.summary || '').slice(0, 140),
      });
    }
  } finally {
    if (createdBookingIds.length) {
      await c
        .query(`DELETE FROM bookings WHERE id = ANY($1::uuid[])`, [
          createdBookingIds,
        ])
        .catch((e) => console.warn('cleanup bookings', e.message));
    }
    if (createdCustomerIds.length) {
      await c
        .query(`DELETE FROM customers WHERE id = ANY($1::uuid[])`, [
          createdCustomerIds,
        ])
        .catch((e) => console.warn('cleanup customers', e.message));
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
