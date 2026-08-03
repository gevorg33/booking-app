/**
 * Guru live QA for e2e-bug.269 — "is anybody open … and schedule the next
 * available appointment" must stay check+book (not collapse to book-only /
 * soonest / create_employee).
 *
 * Run: node scripts/qa-e2e-bug-269.mjs
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
  const {
    isCheckProvidersForServicePrompt,
    isBookNearestSlotPrompt,
    isPaymentsCompoundPrompt,
    decomposePaymentsCompoundPrompt,
  } = require(resolve(
    backendRoot,
    'dist/modules/ai/ai-payments.util.js',
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

  console.log(`e2e-bug.269 QA → ${API} ${SLUG}\n`);

  // Unit-level gate (same detectors Nest uses)
  const detectorCases = [
    {
      id: 'det-anybody-open-schedule',
      prompt:
        'is anybody open tomorrow morning for massage and schedule the next available appointment',
      expectCompound: true,
    },
    {
      id: 'det-anybody-open-semicolon',
      prompt:
        'is anybody open tomorrow morning for massage; schedule the next available appointment',
      expectCompound: true,
    },
    {
      id: 'det-anyone-open-schedule',
      prompt:
        'is anyone open tomorrow evening for Swedish massage and schedule the next available appointment',
      expectCompound: true,
    },
    {
      id: 'det-anybody-open-check-only',
      prompt: 'is anybody open tomorrow morning for massage',
      expectCompound: false,
      expectCheck: true,
    },
    {
      id: 'det-neg-named',
      prompt: 'is Gevorg open tomorrow morning for massage',
      expectCompound: false,
      expectCheck: false,
    },
  ];

  for (const caze of detectorCases) {
    const check = isCheckProvidersForServicePrompt(caze.prompt);
    const book = isBookNearestSlotPrompt(caze.prompt);
    const compound = isPaymentsCompoundPrompt(caze.prompt);
    const steps = decomposePaymentsCompoundPrompt(caze.prompt).map(
      (s) => s.action,
    );
    const expectCheck = caze.expectCheck ?? caze.expectCompound;
    const pass =
      check === expectCheck &&
      compound === caze.expectCompound &&
      (!caze.expectCompound ||
        (book &&
          steps[0] === 'check_providers_for_service' &&
          steps[1] === 'book_nearest_slot'));
    record(caze.id, pass, { check, book, compound, steps });
  }

  // Live dashboard — compound should not collapse to find_soonest / create_employee
  const liveCases = [
    {
      id: 'live-anybody-open-schedule',
      prompt:
        'is anybody open tomorrow morning for massage and schedule the next available appointment',
      allowActions: [
        'compound_intent',
        'check_providers_for_service',
        'book_nearest_slot',
        'create_booking',
      ],
      forbidActions: [
        'find_soonest_appointment',
        'create_employee',
        'list_providers',
      ],
    },
    {
      id: 'live-anybody-open-swedish',
      prompt:
        'is anybody open tomorrow morning for Swedish massage and schedule the next available appointment',
      allowActions: [
        'compound_intent',
        'check_providers_for_service',
        'book_nearest_slot',
        'create_booking',
      ],
      forbidActions: [
        'find_soonest_appointment',
        'create_employee',
        'list_providers',
      ],
    },
    {
      id: 'live-anyone-open-evening',
      prompt:
        'is anyone open tomorrow evening for Swedish massage and book the next available appointment',
      allowActions: [
        'compound_intent',
        'check_providers_for_service',
        'book_nearest_slot',
        'create_booking',
      ],
      forbidActions: ['find_soonest_appointment', 'create_employee'],
    },
    {
      id: 'live-who-free-nearest',
      prompt:
        "who's free tomorrow evening for Swedish massage, book the nearest slot",
      allowActions: [
        'compound_intent',
        'check_providers_for_service',
        'book_nearest_slot',
        'create_booking',
      ],
      forbidActions: ['find_soonest_appointment', 'create_employee'],
    },
    {
      id: 'live-check-only-anybody',
      prompt: 'is anybody open tomorrow morning for Swedish massage',
      allowActions: [
        'check_providers_for_service',
        'check_availability',
        'compound_intent',
      ],
      forbidActions: ['create_employee', 'find_soonest_appointment'],
    },
    {
      id: 'live-neg-named-gevorg',
      prompt: 'is Gevorg open tomorrow morning for Swedish massage',
      allowActions: [
        'check_availability',
        'check_providers_for_service',
        'create_booking',
        'book_nearest_slot',
      ],
      // Prefer not list_providers / create_employee
      forbidActions: ['create_employee', 'list_providers'],
    },
  ];

  for (const caze of liveCases) {
    const { status, data } = await dashboardAi(caze.prompt);
    const action = data?.action;
    const pass =
      status >= 200 &&
      status < 300 &&
      caze.allowActions.includes(action) &&
      !caze.forbidActions.includes(action);
    record(caze.id, pass, {
      status,
      action,
      success: data?.success,
      summary: String(data?.summary || '').slice(0, 160),
    });
  }

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass);
  console.log(
    `\ne2e-bug.269 QA → ${API} ${SLUG} — ${passed}/${results.length} PASS`,
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
