/**
 * Guru live QA for e2e-bug.250 — list_tour_calendar_week must not set
 * sessionContext.serviceName from trailing prompt fragments
 * ("I have this week", "this week", etc.).
 *
 * Run: node scripts/qa-e2e-bug-250.mjs
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

const GARBAGE_SERVICE_NAME =
  /^(i have this week|do i have this week|this week|any tours this week|tour bookings this week|current calendar week|this week's tour calendar)/i;

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

function sessionServiceName(data) {
  return (
    data?.details?.sessionContext?.serviceName ??
    data?.sessionContext?.serviceName ??
    null
  );
}

function detailsServiceName(data) {
  return data?.details?.serviceName ?? null;
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

  console.log(`e2e-bug.250 QA → ${API} ${SLUG}`);

  const results = [];

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

  function isGarbageName(name) {
    if (name == null || name === '') return false;
    const s = String(name).trim();
    if (GARBAGE_SERVICE_NAME.test(s)) return true;
    if (/\bi\s+have\b/i.test(s)) return true;
    if (/\b(this|current)\s+week\b/i.test(s) && !/\b(trek|mountain|city|heritage)\b/i.test(s))
      return true;
    return false;
  }

  // Core .250 contract: unscoped list succeeds and never stores a fragment.
  const coreCases = [
    {
      id: 'canon-what-tour-bookings-this-week',
      prompt: 'What tour bookings do I have this week?',
    },
    {
      id: 'list-tour-departures-provider-week',
      prompt: 'List tour departures on the provider calendar this week',
    },
    {
      id: 'which-tour-bookings-calendar',
      prompt: 'Which tour bookings do I have this week on the calendar?',
    },
    {
      id: 'voice-tour-bookings-week',
      prompt: 'tour bookings I have this week please',
    },
    {
      id: 'show-tours-pax-current-week',
      prompt:
        'Show tour bookings with service and pax on the current calendar week',
    },
    {
      id: 'what-tours-provider-calendar-week',
      prompt: 'What tour departures are on the provider calendar this week?',
    },
  ];

  for (const caze of coreCases) {
    const { status, data } = await dashboardAi(caze.prompt);
    const sessName = sessionServiceName(data);
    const detName = detailsServiceName(data);
    const noGarbage =
      !isGarbageName(sessName) &&
      !isGarbageName(detName) &&
      sessName !== 'I have this week' &&
      detName !== 'I have this week';
    const pass =
      status >= 200 &&
      status < 300 &&
      data?.action === 'list_tour_calendar_week' &&
      data?.success === true &&
      noGarbage &&
      (sessName == null || sessName === '');
    record(caze.id, pass, {
      status,
      action: data?.action,
      success: data?.success,
      sessionServiceName: sessName,
      detailsServiceName: detName,
      summary: String(data?.summary || '').slice(0, 140),
    });
  }

  // Edge phrasing: may hit residual Invalid time value (e2e-bug.270) — still
  // must never poison sessionContext.serviceName with a prompt fragment.
  const edgeNoPoison = [
    { id: 'edge-any-tours-this-week', prompt: 'Any tours this week?' },
    {
      id: 'edge-show-weeks-tour-calendar',
      prompt: "Show me this week's tour calendar",
    },
    {
      id: 'edge-summarize-week-departures',
      prompt: "Summarize this week's tour departures on the provider calendar",
    },
    { id: 'edge-question-tour-bookings-week', prompt: 'Tour bookings this week?' },
    {
      id: 'edge-mountain-trek-named',
      prompt: 'Mountain trek tours on this calendar week with pax',
    },
  ];

  for (const caze of edgeNoPoison) {
    const { status, data } = await dashboardAi(caze.prompt);
    const sessName = sessionServiceName(data);
    const detName = detailsServiceName(data);
    const noGarbage =
      !isGarbageName(sessName) &&
      !isGarbageName(detName) &&
      sessName !== 'I have this week';
    record(caze.id, status >= 200 && status < 300 && noGarbage, {
      status,
      action: data?.action,
      success: data?.success,
      sessionServiceName: sessName,
      detailsServiceName: detName,
      summary: String(data?.summary || '').slice(0, 140),
      note:
        data?.action === 'error'
          ? 'residual Invalid time value → e2e-bug.270'
          : undefined,
    });
  }

  // Follow-up must not inherit garbage from the prior unscoped turn.
  {
    const first = await dashboardAi(
      'What tour bookings do I have this week?',
    );
    const sess1 = sessionServiceName(first.data);
    const second = await dashboardAi('show me more');
    const sess2 = sessionServiceName(second.data);
    const pass =
      !isGarbageName(sess1) &&
      sess1 !== 'I have this week' &&
      !isGarbageName(sess2) &&
      sess2 !== 'I have this week';
    record('follow-up-no-garbage-inherit', pass, {
      firstAction: first.data?.action,
      firstSessionServiceName: sess1,
      secondAction: second.data?.action,
      secondSessionServiceName: sess2,
      secondSummary: String(second.data?.summary || '').slice(0, 120),
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
