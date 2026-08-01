/**
 * Guru live QA for e2e-bug.287 — dashboard check-only "is anybody open…"
 * must route to check_providers_for_service (not check_availability).
 * Named "is Gevorg open…" stays check_availability.
 *
 * Run: node scripts/qa-e2e-bug-287.mjs
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
  } = require(resolve(
    backendRoot,
    'dist/modules/ai/ai-payments.util.js',
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
        context: { confirmed: true, sessionId: `e287-${Date.now()}` },
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

  console.log(`e2e-bug.287 QA → ${API} ${SLUG}\n`);

  // Unit-level rescue gate (same service Nest uses)
  const rescueCases = [
    {
      id: 'rescue-anybody-from-availability',
      prompt: 'is anybody open tomorrow morning for Swedish massage',
      fromAction: 'check_availability',
      expect: 'check_providers_for_service',
    },
    {
      id: 'rescue-anyone-from-availability',
      prompt: 'is anyone free tomorrow morning for Swedish massage',
      fromAction: 'check_availability',
      expect: 'check_providers_for_service',
    },
    {
      id: 'rescue-who-open-from-availability',
      prompt: 'who is open tomorrow morning for Swedish massage',
      fromAction: 'check_availability',
      expect: 'check_providers_for_service',
    },
    {
      id: 'rescue-anybody-keeps-providers',
      prompt: 'is anybody open tomorrow morning for Swedish massage',
      fromAction: 'check_providers_for_service',
      expect: 'check_providers_for_service',
    },
    {
      id: 'rescue-named-stays-availability',
      prompt: 'is Gevorg open tomorrow morning for Swedish massage',
      fromAction: 'check_availability',
      expect: 'check_availability',
      expectCheckProviders: false,
    },
    {
      id: 'rescue-named-from-providers',
      prompt: 'is Gevorg open tomorrow morning for Swedish massage',
      fromAction: 'check_providers_for_service',
      expect: 'check_availability',
      expectCheckProviders: false,
    },
  ];

  for (const caze of rescueCases) {
    const check = isCheckProvidersForServicePrompt(caze.prompt);
    const expectCheck = caze.expectCheckProviders ?? true;
    const result = rescue.rescue({
      prompt: caze.prompt,
      action: caze.fromAction,
      params: {},
      surface: 'dashboard',
    });
    const out = result?.action ?? caze.fromAction;
    const pass = check === expectCheck && out === caze.expect;
    record(caze.id, pass, {
      check,
      from: caze.fromAction,
      out,
      reason: result?.rescueReason,
    });
  }

  // Live dashboard — guru edge matrix
  const liveCases = [
    {
      id: 'live-anybody-open-swedish',
      prompt: 'is anybody open tomorrow morning for Swedish massage',
      expectAction: 'check_providers_for_service',
    },
    {
      id: 'live-anyone-free-swedish',
      prompt: 'is anyone free tomorrow morning for Swedish massage',
      expectAction: 'check_providers_for_service',
    },
    {
      id: 'live-who-is-open-swedish',
      prompt: 'who is open tomorrow morning for Swedish massage',
      expectAction: 'check_providers_for_service',
    },
    {
      id: 'live-anybody-open-evening',
      prompt: 'is anybody open tomorrow evening for Swedish massage',
      expectAction: 'check_providers_for_service',
    },
    {
      id: 'live-see-who-is-open',
      prompt: 'see who is open tomorrow for Swedish massage',
      expectAction: 'check_providers_for_service',
    },
    {
      id: 'live-who-is-free-massage',
      prompt: 'who is free tomorrow morning for massage',
      expectAction: 'check_providers_for_service',
    },
    {
      id: 'live-anybody-open-facial',
      prompt: 'is anybody open Friday morning for facial',
      expectAction: 'check_providers_for_service',
    },
    {
      id: 'live-check-who-available',
      prompt: 'check who is available tomorrow for Swedish massage',
      expectAction: 'check_providers_for_service',
    },
    {
      id: 'live-named-gevorg-open',
      prompt: 'is Gevorg open tomorrow morning for Swedish massage',
      expectAction: 'check_availability',
      allowAlso: [],
    },
    {
      id: 'live-named-gevorg-available',
      prompt: 'Is Gevorg available for Swedish massage tomorrow morning?',
      expectAction: 'check_availability',
    },
    {
      id: 'live-compound-still-compound',
      prompt:
        'is anybody open tomorrow morning for Swedish massage and schedule the next available appointment',
      expectAction: 'compound_intent',
      allowAlso: [
        'check_providers_for_service',
        'book_nearest_slot',
        'create_booking',
      ],
      forbid: ['find_soonest_appointment', 'create_employee'],
    },
    {
      id: 'live-open-times-browse',
      prompt: 'What times are available for Swedish massage tomorrow?',
      expectAction: 'check_availability',
    },
  ];

  for (const caze of liveCases) {
    const { status, data } = await dashboardAi(caze.prompt);
    const action = data?.action;
    const allowed = [
      caze.expectAction,
      ...(caze.allowAlso || []),
    ];
    const forbidden = caze.forbid || [
      'create_employee',
      'find_soonest_appointment',
      'list_providers',
    ];
    // Strict prefer expectAction; allowAlso only for soft edges
    const preferOk =
      action === caze.expectAction ||
      (caze.allowAlso?.length && allowed.includes(action));
    const pass =
      status >= 200 &&
      status < 300 &&
      preferOk &&
      !forbidden.includes(action) &&
      // Hard fail: indefinite check-only must NOT be check_availability
      !(
        caze.expectAction === 'check_providers_for_service' &&
        action === 'check_availability'
      );
    record(caze.id, pass, {
      status,
      action,
      expect: caze.expectAction,
      success: data?.success,
      summary: String(data?.summary || '').slice(0, 180),
    });
  }

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass);
  console.log(
    `\ne2e-bug.287 QA → ${API} ${SLUG} — ${passed}/${results.length} PASS`,
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
