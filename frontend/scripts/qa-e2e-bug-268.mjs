/**
 * Guru live QA for e2e-bug.268 — dashboard first-available create_booking /
 * reschedule_booking must never land on a past calendar day.
 *
 * Run: node scripts/qa-e2e-bug-268.mjs
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

/** Actual booked/planned start from orchestration details (not LLM summary). */
function extractStartTimes(data) {
  const out = [];
  const planSteps = data?.details?.plan?.steps || [];
  const resultSteps = data?.details?.result?.steps || [];
  for (const s of planSteps) {
    if (s?.params?.startTime) out.push(String(s.params.startTime));
  }
  for (const s of resultSteps) {
    if (s?.result?.startTime) out.push(String(s.result.startTime));
  }
  return out;
}

function startTimeToUtcDay(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function todayUtcKey() {
  return new Date().toISOString().slice(0, 10);
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
    await c.query('SELECT id, timezone FROM businesses WHERE slug=$1', [SLUG])
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
  const empName = emp?.name?.split(/\s+/)[0] || 'Gevorg';
  // Use UTC today as floor; business may be ahead/behind by one day — allow
  // today-1 only if timezone offset could make "yesterday" display; for this
  // bug we reject clearly-past months (before session month).
  const today = todayUtcKey();
  const floor = today;

  async function dashboardAi(prompt) {
    const res = await request('POST', `/businesses/${biz.id}/ai/command`, {
      token,
      body: { prompt, context: {} },
    });
    return { status: res.status, data: unwrap(res.body) };
  }

  function record(id, pass, detail) {
    results.push({ id, pass, detail });
    console.log(
      `${pass ? 'PASS' : 'FAIL'}  ${id} — ${JSON.stringify(detail).slice(0, 320)}`,
    );
  }

  console.log(`e2e-bug.268 QA → ${API} ${SLUG} (floor=${floor})\n`);

  const cases = [
    {
      id: 'reschedule-soonest-tomorrow',
      prompt: `Reschedule ${empName} appointment to the soonest free slot tomorrow`,
      expectedActions: ['reschedule_booking'],
    },
    {
      id: 'reschedule-first-available-monday',
      prompt: `Move ${empName}'s appointment to the first available slot Monday`,
      expectedActions: ['reschedule_booking'],
    },
    {
      id: 'reschedule-nearest-free-next-week',
      prompt: 'Change time of the appointment to nearest free time next week',
      expectedActions: ['reschedule_booking'],
    },
    {
      id: 'reschedule-semicolon-put-it',
      prompt: `Move ${empName}'s appointment on June 1; put it June 2 nearest free time`,
      expectedActions: ['reschedule_booking'],
    },
    {
      id: 'book-nearest-swedish-tomorrow',
      prompt: 'Book the nearest available slot for Swedish massage tomorrow',
      expectedActions: ['create_booking', 'book_nearest_slot'],
    },
    {
      id: 'book-soonest-face-pilling-any',
      prompt:
        'Book the soonest free slot for Face Pilling with any provider',
      expectedActions: ['create_booking', 'book_nearest_slot'],
    },
    {
      id: 'book-nearest-swedish-any-provider',
      prompt:
        'Book the first available Swedish massage slot with any provider',
      expectedActions: ['create_booking', 'book_nearest_slot'],
    },
    {
      id: 'book-nearest-evening',
      prompt: 'Book nearest available evening slot for Swedish massage',
      expectedActions: ['create_booking', 'book_nearest_slot'],
    },
    {
      id: 'probe-create-booking-phrasing',
      prompt:
        'Create a booking for the first available massage slot on Monday for any provider',
      expectedActions: ['create_booking', 'book_nearest_slot'],
      soft: true, // may steal to create_employee — residual if so
    },
  ];

  for (const caze of cases) {
    const { status, data } = await dashboardAi(caze.prompt);
    const summary = String(data?.summary || '');
    const starts = extractStartTimes(data);
    const startDays = starts
      .map(startTimeToUtcDay)
      .filter(Boolean);
    const pastStarts = startDays.filter((d) => d < floor);
    const actionOk = caze.expectedActions.includes(data?.action);
    // Gate on real plan/result startTime — not LLM summary month names
    // (01/08/2026 DD/MM is often misread as "January 8").
    const successPastLeak =
      data?.success === true &&
      (pastStarts.length > 0 || starts.length === 0);
    const hardPass =
      status >= 200 &&
      status < 300 &&
      actionOk &&
      pastStarts.length === 0 &&
      !successPastLeak;
    const softPass =
      status >= 200 && status < 300 && pastStarts.length === 0;
    const pass = caze.soft ? softPass : hardPass;
    record(caze.id, pass, {
      status,
      action: data?.action,
      success: data?.success,
      starts,
      startDays,
      pastStarts,
      soft: !!caze.soft,
      summary: summary.slice(0, 160),
      note:
        data?.success === true &&
        /January|March/i.test(summary) &&
        startDays.some((d) => d >= floor)
          ? 'summary month misread of DD/MM (startTime OK) — residual'
          : null,
    });
  }

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass);
  console.log(
    `\ne2e-bug.268 QA → ${API} ${SLUG} — ${passed}/${results.length} PASS`,
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
