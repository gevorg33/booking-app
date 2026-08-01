/**
 * Guru live QA for e2e-bug.241 — mark_multi_service_step_done must be
 * reachable on provider AI (registry + rescue + per-leg dispatch).
 *
 * Run: node scripts/qa-e2e-bug-241.mjs
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

  // Prefer services whose names match fixture-style "leg" prompts
  const svcRows = (
    await c.query(
      `SELECT id, name FROM services
       WHERE business_id=$1 AND "isActive"=true
       ORDER BY name`,
      [biz.id],
    )
  ).rows;
  const hairdrying =
    svcRows.find((s) => /hairdry|blowdry|dry/i.test(s.name)) || svcRows[0];
  const hairstyle =
    svcRows.find((s) => s.id !== hairdrying.id && /hair|style|color/i.test(s.name)) ||
    svcRows.find((s) => s.id !== hairdrying.id) ||
    svcRows[0];
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
  const results = [];

  async function insertMultiGroup() {
    const groupId = crypto.randomUUID();
    const customerId = crypto.randomUUID();
    await c.query(
      `INSERT INTO customers (id, business_id, name, email, phone, "isActive", "createdAt", "updatedAt")
       VALUES ($1,$2,'Spa Day QA',$3,NULL,true,NOW(),NOW())`,
      [customerId, biz.id, `spa-qa-${customerId.slice(0, 8)}@example.com`],
    );

    const start1 = new Date(Date.now() + 3 * 3600 * 1000);
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
          context: {
            confirmed: false,
            ...context,
          },
        },
      },
    );
    return { status: res.status, data: unwrap(res.body), raw: res.body };
  }

  function record(id, pass, detail) {
    results.push({ id, pass, detail });
    console.log(
      `${pass ? 'PASS' : 'FAIL'}  ${id} — ${JSON.stringify(detail).slice(0, 240)}`,
    );
  }

  // —— Classification / rescue (no booking needed) ——
  const classifyCases = [
    {
      id: 'finish-step1-spa-day',
      prompt: 'Finish step 1 of spa day',
    },
    {
      id: 'complete-blowdry-leg',
      prompt: 'Complete blowdry leg',
    },
    {
      id: 'finish-step2',
      prompt: 'Finish step 2',
    },
    {
      id: 'complete-manicure-leg',
      prompt: 'Complete the manicure leg',
    },
    {
      id: 'finish-color-leg',
      prompt: 'Finish the color leg',
    },
    {
      id: 'hy-step',
      prompt: 'Ավարտված է 1-ին քայլը',
    },
    {
      id: 'ru-step',
      prompt: 'Завершён первый этап',
    },
  ];

  for (const caze of classifyCases) {
    const { status, data } = await providerAi(caze.prompt);
    const pass =
      status >= 200 &&
      status < 300 &&
      data?.action === 'mark_multi_service_step_done' &&
      data?.action !== 'unknown';
    record(caze.id, pass, {
      status,
      action: data?.action,
      success: data?.success,
      summary: String(data?.summary || '').slice(0, 140),
    });
  }

  // —— Negatives ——
  const negCases = [
    { id: 'neg-visit-complete', prompt: 'Mark visit complete', forbid: 'mark_multi_service_step_done' },
    { id: 'neg-in-progress', prompt: 'Mark in progress', forbid: 'mark_multi_service_step_done' },
    { id: 'neg-paid', prompt: 'Mark as paid', forbid: 'mark_multi_service_step_done' },
    { id: 'neg-check-in', prompt: 'Check in client', forbid: 'mark_multi_service_step_done' },
  ];
  for (const caze of negCases) {
    const { status, data } = await providerAi(caze.prompt);
    const pass =
      status >= 200 && status < 300 && data?.action !== caze.forbid;
    record(caze.id, pass, {
      status,
      action: data?.action,
      summary: String(data?.summary || '').slice(0, 120),
    });
  }

  // —— No bookingId → clarify, still correct action ——
  {
    const { status, data } = await providerAi('Finish step 1 of spa day');
    const pass =
      status >= 200 &&
      status < 300 &&
      data?.action === 'mark_multi_service_step_done' &&
      data?.success === false &&
      /open the multi-service booking/i.test(String(data?.summary || ''));
    record('clarify-without-bookingId', pass, {
      status,
      action: data?.action,
      success: data?.success,
      summary: String(data?.summary || '').slice(0, 140),
    });
  }

  // —— Single booking (not multi-group) → not a multi-service group ——
  {
    const singleId = crypto.randomUUID();
    const start = new Date(Date.now() + 4 * 3600 * 1000);
    const end = new Date(start.getTime() + 3600 * 1000);
    await c.query(
      `INSERT INTO bookings (
         id, business_id, employee_id, service_id, customer_id,
         status, "paymentStatus", "startTime", "endTime",
         multi_service_group_id, metadata, "createdAt", "updatedAt"
       ) VALUES (
         $1,$2,$3,$4,NULL,
         'confirmed','pending',$5,$6,
         NULL,'{}'::jsonb,NOW(),NOW()
       )`,
      [
        singleId,
        biz.id,
        emp.id,
        hairdrying.id,
        start.toISOString(),
        end.toISOString(),
      ],
    );
    createdBookingIds.push(singleId);
    const { status, data } = await providerAi('Finish step 1 of spa day', {
      bookingId: singleId,
      confirmed: true,
    });
    const pass =
      status >= 200 &&
      status < 300 &&
      data?.action === 'mark_multi_service_step_done' &&
      data?.success === false &&
      /not part of a multi-service/i.test(String(data?.summary || ''));
    record('reject-single-booking', pass, {
      status,
      action: data?.action,
      success: data?.success,
      summary: String(data?.summary || '').slice(0, 140),
    });
  }

  // —— Execute by stepIndex: only leg 1 completed ——
  {
    const { leg1, leg2 } = await insertMultiGroup();
    const { status, data } = await providerAi('Finish step 1 of spa day', {
      bookingId: leg1,
      confirmed: true,
    });
    const rows = (
      await c.query(
        `SELECT id, status FROM bookings WHERE id = ANY($1::uuid[]) ORDER BY "startTime"`,
        [[leg1, leg2]],
      )
    ).rows;
    const s1 = rows.find((r) => r.id === leg1)?.status;
    const s2 = rows.find((r) => r.id === leg2)?.status;
    const pass =
      status >= 200 &&
      status < 300 &&
      data?.action === 'mark_multi_service_step_done' &&
      s1 === 'completed' &&
      s2 === 'confirmed';
    record('execute-stepIndex-only-leg1', pass, {
      status,
      action: data?.action,
      success: data?.success,
      leg1: s1,
      leg2: s2,
      summary: String(data?.summary || '').slice(0, 140),
    });
  }

  // —— Execute by serviceName (hairdrying / blowdry-ish) ——
  {
    const { leg1, leg2 } = await insertMultiGroup();
    const legPrompt = `Complete ${String(hairdrying.name).split(/\s+/)[0]} leg`;
    const { status, data } = await providerAi(legPrompt, {
      bookingId: leg2, // anchor can be any leg
      confirmed: true,
    });
    const rows = (
      await c.query(
        `SELECT id, status FROM bookings WHERE id = ANY($1::uuid[])`,
        [[leg1, leg2]],
      )
    ).rows;
    const s1 = rows.find((r) => r.id === leg1)?.status;
    const s2 = rows.find((r) => r.id === leg2)?.status;
    const pass =
      status >= 200 &&
      status < 300 &&
      data?.action === 'mark_multi_service_step_done' &&
      s1 === 'completed' &&
      s2 === 'confirmed';
    record('execute-serviceName-only-matching-leg', pass, {
      status,
      action: data?.action,
      prompt: legPrompt,
      service: hairdrying.name,
      success: data?.success,
      leg1: s1,
      leg2: s2,
      summary: String(data?.summary || '').slice(0, 140),
    });
  }

  // —— Ambiguous / missing step → clarify which step ——
  {
    const { leg1, leg2 } = await insertMultiGroup();
    // Prompt that classifies as step-done but has no parseable step/service that matches
    const { status, data } = await providerAi('Finish step 9', {
      bookingId: leg1,
      confirmed: true,
    });
    const rows = (
      await c.query(
        `SELECT status FROM bookings WHERE id = ANY($1::uuid[])`,
        [[leg1, leg2]],
      )
    ).rows;
    const noneCompleted = rows.every((r) => r.status === 'confirmed');
    const pass =
      status >= 200 &&
      status < 300 &&
      data?.action === 'mark_multi_service_step_done' &&
      noneCompleted &&
      /which step/i.test(String(data?.summary || ''));
    record('clarify-unknown-step', pass, {
      status,
      action: data?.action,
      success: data?.success,
      noneCompleted,
      summary: String(data?.summary || '').slice(0, 140),
      steps: data?.details?.steps,
    });
  }

  // —— Execute step 2 only ——
  {
    const { leg1, leg2 } = await insertMultiGroup();
    const { status, data } = await providerAi('Finish step 2', {
      bookingId: leg1,
      confirmed: true,
    });
    const rows = (
      await c.query(
        `SELECT id, status FROM bookings WHERE id = ANY($1::uuid[])`,
        [[leg1, leg2]],
      )
    ).rows;
    const s1 = rows.find((r) => r.id === leg1)?.status;
    const s2 = rows.find((r) => r.id === leg2)?.status;
    const pass =
      status >= 200 &&
      status < 300 &&
      data?.action === 'mark_multi_service_step_done' &&
      s1 === 'confirmed' &&
      s2 === 'completed';
    record('execute-stepIndex-only-leg2', pass, {
      status,
      action: data?.action,
      success: data?.success,
      leg1: s1,
      leg2: s2,
      summary: String(data?.summary || '').slice(0, 140),
    });
  }

  if (createdBookingIds.length) {
    await c.query(`DELETE FROM bookings WHERE id = ANY($1::uuid[])`, [
      createdBookingIds,
    ]);
    await c.query(
      `DELETE FROM customers WHERE email LIKE 'spa-qa-%@example.com'`,
    );
  }
  await c.end();

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass);
  console.log(
    `\ne2e-bug.241 QA → ${API} ${SLUG} — ${passed}/${results.length} PASS`,
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
