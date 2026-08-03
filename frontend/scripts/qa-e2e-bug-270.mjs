/**
 * Guru live QA for e2e-bug.270 — list_tour_calendar_week must not crash with
 * Invalid time value when the classifier stuffs week phrases into weekStartDate.
 *
 * Run: node scripts/qa-e2e-bug-270.mjs
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

const CRASH_PROMPTS = [
  { id: 'any-tours-this-week', prompt: 'Any tours this week?' },
  {
    id: 'show-weeks-tour-calendar',
    prompt: "Show me this week's tour calendar",
  },
  {
    id: 'summarize-weeks-departures',
    prompt: "Summarize this week's tour departures on the provider calendar",
  },
  { id: 'tour-bookings-this-week', prompt: 'Tour bookings this week?' },
  {
    id: 'mountain-trek-calendar-week',
    prompt: 'Mountain trek tours on this calendar week with pax',
  },
  {
    id: 'canon-what-tour-bookings',
    prompt: 'What tour bookings do I have this week?',
  },
  {
    id: 'list-departures-provider',
    prompt: 'List tour departures on the provider calendar this week',
  },
  {
    id: 'voice-tour-bookings-week',
    prompt: 'tour bookings this week please',
  },
  {
    id: 'which-tours-calendar-week',
    prompt: 'Which tours are on the calendar this week?',
  },
  {
    id: 'provider-schedule-this-week',
    prompt: 'List tours on the provider schedule this week with service and pax',
  },
  {
    id: 'current-calendar-week-pax',
    prompt:
      'Show tour bookings with service and pax on the current calendar week',
  },
  {
    id: 'week-of-iso',
    prompt: 'Week of 2026-06-09 — tour departures on the provider calendar',
  },
];

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
  const {
    normalizeTourWeekAnchorDateKey,
    buildWeekDateKeys,
  } = require(resolve(
    backendRoot,
    'dist/common/utils/tour-calendar.util.js',
  ));
  const {
    parseListTourCalendarWeekFromPrompt,
  } = require(resolve(
    backendRoot,
    'dist/modules/ai/ai-tour-calendar-week.util.js',
  ));

  const results = [];
  function record(id, pass, detail) {
    results.push({ id, pass, detail });
    console.log(
      `${pass ? 'PASS' : 'FAIL'}  ${id} — ${JSON.stringify(detail).slice(0, 360)}`,
    );
  }

  // Unit probes against dist (must be rebuilt with the fix).
  for (const garbage of [
    'this week',
    "this week's",
    'this calendar week',
    'not-a-date',
  ]) {
    let threw = false;
    let keys;
    try {
      keys = buildWeekDateKeys(garbage);
    } catch (e) {
      threw = true;
      record(`unit-buildWeek-${garbage}`, false, {
        error: String(e?.message ?? e),
      });
      continue;
    }
    const normalized = normalizeTourWeekAnchorDateKey(garbage);
    const ok =
      !threw &&
      Array.isArray(keys) &&
      keys.length === 7 &&
      keys.every((k) => /^\d{4}-\d{2}-\d{2}$/.test(k)) &&
      (normalized == null || /^\d{4}-\d{2}-\d{2}$/.test(normalized));
    record(`unit-buildWeek-${garbage}`, ok, { normalized, weekStart: keys[0] });
  }

  const parsed = parseListTourCalendarWeekFromPrompt(
    'Any tours this week?',
    { weekStartDate: 'this week' },
  );
  record('unit-parse-this-week-param', Boolean(parsed?.weekStartDate?.match(/^\d{4}-\d{2}-\d{2}$/)), {
    weekStartDate: parsed?.weekStartDate ?? null,
  });

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

  console.log(`e2e-bug.270 QA → ${API} ${SLUG}`);

  async function dashboardAi(prompt) {
    const res = await request('POST', `/businesses/${biz.id}/ai/command`, {
      token,
      body: { prompt, context: {} },
    });
    return { status: res.status, data: unwrap(res.body) };
  }

  for (const { id, prompt } of CRASH_PROMPTS) {
    const { status, data } = await dashboardAi(prompt);
    const action = data?.action ?? null;
    const summary = String(data?.summary ?? '');
    const isCrash =
      action === 'error' ||
      /Invalid time value/i.test(summary) ||
      /Something went wrong/i.test(summary);
    // Prefer list_tour_calendar_week; allow empty-state success or clarify on
    // unrelated misroutes — but never the gateway crash.
    const pass = status === 200 || status === 201
      ? !isCrash
      : false;
    record(`live-${id}`, pass, {
      status,
      action,
      summary: summary.slice(0, 180),
    });
  }

  const failed = results.filter((r) => !r.pass);
  console.log(
    `\n${results.length - failed.length}/${results.length} passed` +
      (failed.length ? ` — FAILED: ${failed.map((f) => f.id).join(', ')}` : ''),
  );
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
