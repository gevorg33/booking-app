/**
 * Guru live QA for e2e-bug.248 — "move appointment … nearest free time"
 * must route to reschedule_booking (not find_soonest_appointment).
 *
 * Surfaces: dashboard AI (staff reschedule) + customer/public negatives
 * (true soonest READ must stay find_soonest_appointment).
 *
 * Run: node scripts/qa-e2e-bug-248.mjs
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
      `SELECT id, name FROM employees WHERE business_id=$1 AND "isActive"=true LIMIT 1`,
      [biz.id],
    )
  ).rows[0];

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

  const empName = emp?.name?.split(/\s+/)[0] || 'Gevorg';

  const rescheduleCases = [
    {
      id: 'canon-move-nearest',
      prompt: `Move ${empName}'s appointment on June 1 to June 2 nearest free time`,
    },
    {
      id: 'reschedule-soonest-slot',
      prompt: `Reschedule ${empName} appointment to the soonest free slot tomorrow`,
    },
    {
      id: 'shift-booking-earliest',
      prompt: `Shift the booking to the earliest free time on Friday`,
    },
    {
      id: 'change-time-nearest',
      prompt: 'Change time of the appointment to nearest free time next week',
    },
    {
      id: 'move-visit-soonest',
      prompt: 'Move the visit to the soonest available time',
    },
    {
      id: 'move-first-available',
      prompt: `Move ${empName}'s appointment to the first available slot Monday`,
    },
    {
      id: 'question-move-nearest',
      prompt:
        'Can you move that appointment to the nearest free time on June 2?',
    },
    {
      id: 'semicolon-move',
      // Residual e2e-bug.267 — ";" still decomposes to compound
      // (reschedule + fill_slot_from_waitlist). For .248 we only require it
      // is not stolen by find_soonest_appointment / optimize_schedule alone.
      prompt: `Move ${empName}'s appointment on June 1; put it June 2 nearest free time`,
      allowActions: ['reschedule_booking', 'compound_intent'],
    },
    {
      id: 'move-to-date-nearest-named',
      prompt: 'Move to June 11 nearest free time for Maria',
    },
    {
      id: 'voice-move-asap',
      prompt: 'move appointment asap nearest free time please',
    },
  ];

  for (const caze of rescheduleCases) {
    const { status, data } = await dashboardAi(caze.prompt);
    const params = data?.params || data?.details?.params || {};
    const allowed = caze.allowActions || ['reschedule_booking'];
    const pass =
      status >= 200 &&
      status < 300 &&
      allowed.includes(data?.action) &&
      data?.action !== 'find_soonest_appointment' &&
      data?.action !== 'optimize_schedule' &&
      data?.action !== 'unknown';
    record(caze.id, pass, {
      status,
      action: data?.action,
      success: data?.success,
      bookingFirstAvailable: params.bookingFirstAvailable,
      summary: String(data?.summary || '').slice(0, 140),
    });
  }

  // True soonest READ must stay find_soonest on public (customer/public surface).
  const soonestNeg = [
    {
      id: 'neg-public-who-soonest',
      prompt: "Who's free soonest for a trim?",
    },
    {
      id: 'neg-public-earliest-slot',
      prompt: 'Earliest slot this week',
    },
    {
      id: 'neg-public-nearest-opening',
      prompt: 'What is the nearest opening for facial?',
    },
  ];

  for (const caze of soonestNeg) {
    const { status, data } = await publicAi(caze.prompt);
    const pass =
      status >= 200 &&
      status < 300 &&
      data?.action === 'find_soonest_appointment' &&
      data?.action !== 'reschedule_booking';
    record(caze.id, pass, {
      status,
      action: data?.action,
      success: data?.success,
      summary: String(data?.summary || '').slice(0, 120),
    });
  }

  // Dashboard must not steal true soonest browse into reschedule.
  {
    const { status, data } = await dashboardAi(
      "Who's free soonest for a trim?",
    );
    const pass =
      status >= 200 &&
      status < 300 &&
      data?.action !== 'reschedule_booking' &&
      data?.action !== 'find_soonest_appointment';
    record('neg-dash-who-soonest-not-reschedule', pass, {
      status,
      action: data?.action,
      summary: String(data?.summary || '').slice(0, 120),
    });
  }

  // Cross: canon reschedule ≠ public soonest.
  {
    const { data: dash } = await dashboardAi(
      `Move ${empName}'s appointment on June 1 to June 2 nearest free time`,
    );
    const { data: pub } = await publicAi("Who's free soonest for a trim?");
    const pass =
      dash?.action === 'reschedule_booking' &&
      pub?.action === 'find_soonest_appointment';
    record('cross-reschedule-vs-soonest', pass, {
      dash: dash?.action,
      pub: pub?.action,
    });
  }

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass);
  console.log(
    `\ne2e-bug.248 QA → ${API} ${SLUG} — ${passed}/${results.length} PASS`,
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
