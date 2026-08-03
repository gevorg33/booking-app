/**
 * Guru live QA for e2e-bug.249 — dashboard check-then-book / nearest-slot
 * must resolve to create_booking (bookingFirstAvailable), NOT book_appointment.
 *
 * Surfaces: dashboard AI (staff) + public negatives (flexible book OK).
 *
 * Run: node scripts/qa-e2e-bug-249.mjs
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
      `SELECT name FROM services WHERE business_id=$1 AND "isActive"=true LIMIT 1`,
      [biz.id],
    )
  ).rows[0];
  const serviceName = svc?.name || 'massage';

  const token = jwt.sign(
    {
      sub: member.user_id,
      email: String(member.email).toLowerCase(),
      role: member.user_role,
      businessId: biz.id,
      membershipRole: member.role,
      employeeId: emp?.id ?? null,
    },
    process.env.JWT_SECRET,
    { expiresIn: '2h' },
  );
  await c.end();

  const results = [];

  async function dashboardAi(prompt) {
    const res = await request('POST', `/businesses/${biz.id}/ai/command`, {
      token,
      body: { prompt, context: {} },
    });
    return { status: res.status, data: unwrap(res.body) };
  }

  async function publicAi(prompt) {
    const res = await request('POST', `/public/${SLUG}/assistant`, {
      body: {
        prompt,
        assistantMode: 'act',
        locale: 'en',
        context: { slug: SLUG },
      },
    });
    return { status: res.status, data: unwrap(res.body) };
  }

  function record(id, pass, detail) {
    results.push({ id, pass, detail });
    console.log(
      `${pass ? 'PASS' : 'FAIL'}  ${id} — ${JSON.stringify(detail).slice(0, 280)}`,
    );
  }

  const dashCases = [
    {
      id: 'canon-check-book-nearest',
      prompt: `check who is free tomorrow evening for ${serviceName}, book the nearest slot`,
    },
    {
      id: 'book-nearest-available',
      prompt: `Book the nearest available slot for ${serviceName} tomorrow`,
    },
    {
      id: 'book-first-available',
      prompt: `Book first available ${serviceName} tomorrow evening`,
    },
    {
      id: 'soonest-any-provider',
      prompt: `Book the soonest slot for ${serviceName} tomorrow evening on any provider`,
    },
    {
      id: 'semicolon-check-book',
      prompt: `who is free tomorrow for ${serviceName}; book the nearest slot`,
    },
    {
      id: 'voice-check-book',
      prompt: `see who is free for ${serviceName} tomorrow book nearest please`,
    },
    {
      id: 'check-book-asap',
      prompt: `check providers for ${serviceName} tomorrow, book ASAP`,
    },
    {
      id: 'check-book-earliest',
      prompt: `who can do ${serviceName} tomorrow evening, book the earliest slot`,
    },
    {
      id: 'and-then-book-nearest',
      prompt: `check who is free for ${serviceName} tomorrow and book the nearest slot`,
    },
    {
      id: 'look-up-and-reserve',
      prompt: `look up who is available tomorrow evening for ${serviceName} and reserve the nearest slot`,
    },
  ];

  for (const caze of dashCases) {
    const { status, data } = await dashboardAi(caze.prompt);
    const params = data?.params || data?.details?.params || {};
    const action = data?.action;
    // Compound (check → create_booking) is OK; single create_booking is OK.
    // book_appointment on dashboard is the e2e-249 failure mode.
    const pass =
      status >= 200 &&
      status < 300 &&
      action !== 'book_appointment' &&
      action !== 'find_soonest_appointment' &&
      action !== 'unknown' &&
      (action === 'create_booking' ||
        action === 'compound_intent' ||
        action === 'check_providers_for_service');
    record(caze.id, pass, {
      status,
      action,
      success: data?.success,
      bookingFirstAvailable: params.bookingFirstAvailable,
      summary: String(data?.summary || '').slice(0, 140),
    });
  }

  // Public flexible nearest may be book_appointment / book_nearest_slot — not create_booking.
  const publicCases = [
    {
      id: 'pub-book-nearest',
      prompt: `Book the nearest slot for ${serviceName} tomorrow`,
      allow: ['book_appointment', 'book_nearest_slot', 'compound_intent'],
    },
    {
      id: 'pub-check-book',
      prompt: `who is free tomorrow for ${serviceName}, book the nearest slot`,
      allow: [
        'book_appointment',
        'book_nearest_slot',
        'check_availability',
        'compound_intent',
      ],
    },
  ];

  for (const caze of publicCases) {
    const { status, data } = await publicAi(caze.prompt);
    const pass =
      status >= 200 &&
      status < 300 &&
      caze.allow.includes(data?.action) &&
      data?.action !== 'create_booking';
    record(caze.id, pass, {
      status,
      action: data?.action,
      summary: String(data?.summary || '').slice(0, 120),
    });
  }

  {
    const { data: dash } = await dashboardAi(
      `check who is free tomorrow evening for ${serviceName}, book the nearest slot`,
    );
    const { data: pub } = await publicAi(
      `Book the nearest slot for ${serviceName} tomorrow`,
    );
    const pass =
      dash?.action !== 'book_appointment' &&
      (dash?.action === 'create_booking' ||
        dash?.action === 'compound_intent' ||
        dash?.action === 'check_providers_for_service') &&
      pub?.action !== 'create_booking';
    record('cross-dash-create-vs-public-book', pass, {
      dash: dash?.action,
      pub: pub?.action,
    });
  }

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass);
  console.log(
    `\ne2e-bug.249 QA → ${API} ${SLUG} — ${passed}/${results.length} PASS`,
  );
  if (failed.length) {
    console.log('FAILED:', failed.map((f) => f.id).join(', '));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
