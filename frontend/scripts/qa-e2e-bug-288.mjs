/**
 * Guru live QA for e2e-bug.288 — "Any tours next week?" / "Tour bookings last
 * week?" must route to list_tour_calendar_week (not upcoming-departures clarify).
 *
 * Run: node scripts/qa-e2e-bug-288.mjs
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

const CLARIFY_RE =
  /Ask to list upcoming tour departures|remaining capacity/i;

async function main() {
  loadEnv();
  const { Client } = require('pg');
  const jwt = require('jsonwebtoken');
  const {
    isListTourCalendarWeekPrompt,
  } = require(resolve(
    backendRoot,
    'dist/modules/ai/ai-tour-calendar-week.util.js',
  ));
  const {
    isListUpcomingTourDeparturesPrompt,
  } = require(resolve(
    backendRoot,
    'dist/modules/ai/ai-upcoming-tour-departures.util.js',
  ));
  const { AiIntentRescueService } = require(resolve(
    backendRoot,
    'dist/modules/ai/ai-intent-rescue.service.js',
  ));

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

  const token = jwt.sign(
    {
      sub: member.user_id,
      email: String(member.email).toLowerCase(),
      role: member.user_role,
      businessId: biz.id,
      membershipRole: member.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: '2h' },
  );
  await c.end();

  const results = [];
  const rescue = new AiIntentRescueService();

  async function dashboardAi(prompt) {
    const res = await request('POST', `/businesses/${biz.id}/ai/command`, {
      token,
      body: {
        prompt,
        context: { confirmed: true, sessionId: `e288-${Date.now()}` },
      },
    });
    return { status: res.status, data: unwrap(res.body) };
  }

  function record(id, pass, detail) {
    results.push({ id, pass, detail });
    console.log(
      `${pass ? 'PASS' : 'FAIL'}  ${id} — ${JSON.stringify(detail).slice(0, 360)}`,
    );
  }

  console.log(`e2e-bug.288 QA → ${API} ${SLUG}\n`);

  const detectorCases = [
    {
      id: 'det-any-tours-next-week',
      prompt: 'Any tours next week?',
      expectCalendar: true,
    },
    {
      id: 'det-tour-bookings-last-week',
      prompt: 'Tour bookings last week?',
      expectCalendar: true,
    },
    {
      id: 'det-any-tours-last-week',
      prompt: 'Any tours last week?',
      expectCalendar: true,
    },
    {
      id: 'det-tour-bookings-next-week',
      prompt: 'Tour bookings next week?',
      expectCalendar: true,
    },
    {
      id: 'det-show-next-weeks-calendar',
      prompt: "Show me next week's tour calendar",
      expectCalendar: true,
    },
    {
      id: 'det-neg-upcoming-capacity',
      prompt: 'List upcoming tour departures with pax and remaining capacity',
      expectCalendar: false,
      expectUpcoming: true,
    },
  ];

  for (const caze of detectorCases) {
    const calendar = isListTourCalendarWeekPrompt(caze.prompt);
    const upcoming = isListUpcomingTourDeparturesPrompt(caze.prompt);
    const rescued = rescue.rescue({
      prompt: caze.prompt,
      action: 'list_upcoming_tour_departures',
      params: {},
      surface: 'dashboard',
    });
    const expectUpcoming = caze.expectUpcoming ?? false;
    const pass =
      calendar === caze.expectCalendar &&
      upcoming === expectUpcoming &&
      (caze.expectCalendar
        ? (rescued?.action ?? 'list_upcoming_tour_departures') ===
          'list_tour_calendar_week'
        : true);
    record(caze.id, pass, {
      calendar,
      upcoming,
      rescued: rescued?.action,
    });
  }

  const liveCases = [
    {
      id: 'live-any-tours-next-week',
      prompt: 'Any tours next week?',
      expectAction: 'list_tour_calendar_week',
    },
    {
      id: 'live-tour-bookings-last-week',
      prompt: 'Tour bookings last week?',
      expectAction: 'list_tour_calendar_week',
    },
    {
      id: 'live-any-tours-last-week',
      prompt: 'Any tours last week?',
      expectAction: 'list_tour_calendar_week',
    },
    {
      id: 'live-tour-bookings-next-week',
      prompt: 'Tour bookings next week?',
      expectAction: 'list_tour_calendar_week',
    },
    {
      id: 'live-show-next-weeks-calendar',
      prompt: "Show me next week's tour calendar",
      expectAction: 'list_tour_calendar_week',
    },
    {
      id: 'live-list-departures-next-week',
      prompt: 'List tour departures next week',
      expectAction: 'list_tour_calendar_week',
    },
    {
      id: 'live-which-tours-calendar-next',
      prompt: 'Which tours are on the calendar next week?',
      expectAction: 'list_tour_calendar_week',
    },
    {
      id: 'live-summarize-last-week',
      prompt: "Summarize last week's tour departures on the provider calendar",
      expectAction: 'list_tour_calendar_week',
    },
    {
      id: 'live-any-tours-this-week',
      prompt: 'Any tours this week?',
      expectAction: 'list_tour_calendar_week',
    },
    {
      id: 'live-canon-what-this-week',
      prompt: 'What tour bookings do I have this week?',
      expectAction: 'list_tour_calendar_week',
    },
    {
      id: 'live-neg-upcoming-capacity',
      prompt: 'List upcoming tour departures with pax and remaining capacity',
      expectAction: 'list_upcoming_tour_departures',
      allowClarify: true,
    },
  ];

  for (const caze of liveCases) {
    const { status, data } = await dashboardAi(caze.prompt);
    const action = data?.action;
    const summary = String(data?.summary || '');
    const isClarify = CLARIFY_RE.test(summary) && data?.success === false;
    const actionOk = action === caze.expectAction;
    const noDeadEndClarify =
      caze.expectAction === 'list_tour_calendar_week' ? !isClarify : true;
    const pass =
      status >= 200 &&
      status < 300 &&
      actionOk &&
      noDeadEndClarify &&
      action !== 'error';
    record(caze.id, pass, {
      status,
      action,
      expect: caze.expectAction,
      success: data?.success,
      isClarify,
      summary: summary.slice(0, 180),
    });
  }

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass);
  console.log(
    `\ne2e-bug.288 QA → ${API} ${SLUG} — ${passed}/${results.length} PASS`,
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
