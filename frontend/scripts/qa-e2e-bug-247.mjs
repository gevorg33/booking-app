/**
 * Guru live QA for e2e-bug.247 — explain_dashboard_only_action +
 * explain_reassign_limit + explain_time_off_approval must be reachable
 * on provider AI (READ dashboard-handoff FAQ).
 *
 * Run: node scripts/qa-e2e-bug-247.mjs
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

  async function providerAi(prompt) {
    const res = await request(
      'POST',
      `/businesses/${biz.id}/provider/ai/command`,
      { token, body: { prompt, context: {} } },
    );
    return { status: res.status, data: unwrap(res.body) };
  }

  function record(id, pass, detail) {
    results.push({ id, pass, detail });
    console.log(
      `${pass ? 'PASS' : 'FAIL'}  ${id} — ${JSON.stringify(detail).slice(0, 260)}`,
    );
  }

  const dashCases = [
    { id: 'dash-loyalty', prompt: 'Adjust loyalty points' },
    { id: 'dash-templates', prompt: 'Edit message templates' },
    { id: 'dash-intake', prompt: 'Open the full intake answers' },
  ];

  for (const caze of dashCases) {
    const { status, data } = await providerAi(caze.prompt);
    const summary = String(data?.summary || '');
    const pass =
      status >= 200 &&
      status < 300 &&
      data?.action === 'explain_dashboard_only_action' &&
      data?.success === true &&
      /dashboard/i.test(summary) &&
      data?.action !== 'explain_reassign_limit' &&
      data?.action !== 'explain_time_off_approval' &&
      data?.action !== 'unknown';
    record(caze.id, pass, {
      status,
      action: data?.action,
      success: data?.success,
      summary: summary.slice(0, 140),
    });
  }

  const reassignCases = [
    {
      id: 'reassign-why',
      prompt: "Why can't AI reassign multi-service?",
    },
    { id: 'reassign-button', prompt: 'Use reassign button' },
    {
      id: 'reassign-hy',
      prompt: 'Ինչու չեմ կարող վերանշանակել բազմածառայության ամրագրումը',
    },
    {
      id: 'reassign-ru',
      prompt: 'Почему нельзя переназначить мультиуслугу?',
    },
  ];

  for (const caze of reassignCases) {
    const { status, data } = await providerAi(caze.prompt);
    const summary = String(data?.summary || '');
    const pass =
      status >= 200 &&
      status < 300 &&
      data?.action === 'explain_reassign_limit' &&
      data?.success === true &&
      /reassign/i.test(summary) &&
      data?.action !== 'reassign_booking_same_day' &&
      data?.action !== 'list_reassign_options' &&
      data?.action !== 'unknown';
    record(caze.id, pass, {
      status,
      action: data?.action,
      success: data?.success,
      summary: summary.slice(0, 140),
    });
  }

  const approvalCases = [
    { id: 'approval-who', prompt: 'Who approves my time off?' },
    { id: 'approval-pending', prompt: 'Pending manager approval' },
    { id: 'approval-hy', prompt: 'Ով է հաստատում իմ արձակուրդը' },
    { id: 'approval-ru', prompt: 'Кто одобряет мой отпуск?' },
  ];

  for (const caze of approvalCases) {
    const { status, data } = await providerAi(caze.prompt);
    const summary = String(data?.summary || '');
    const pass =
      status >= 200 &&
      status < 300 &&
      data?.action === 'explain_time_off_approval' &&
      data?.success === true &&
      /manager/i.test(summary) &&
      data?.action !== 'request_time_off' &&
      data?.action !== 'list_my_time_off_requests' &&
      data?.action !== 'explain_dashboard_only_action' &&
      data?.action !== 'unknown';
    record(caze.id, pass, {
      status,
      action: data?.action,
      success: data?.success,
      summary: summary.slice(0, 140),
    });
  }

  const negCases = [
    {
      id: 'neg-reassign-live',
      prompt: 'Reassign Jane to Sam today',
      forbid: [
        'explain_dashboard_only_action',
        'explain_reassign_limit',
        'explain_time_off_approval',
      ],
    },
    {
      id: 'neg-time-off-list',
      prompt: 'Show my time off requests',
      forbid: [
        'explain_dashboard_only_action',
        'explain_reassign_limit',
        'explain_time_off_approval',
      ],
    },
    {
      id: 'neg-request-time-off',
      prompt: 'Request time off next Friday',
      forbid: [
        'explain_dashboard_only_action',
        'explain_reassign_limit',
        'explain_time_off_approval',
      ],
    },
    {
      id: 'neg-a11y',
      prompt: 'Bigger text in app?',
      forbid: [
        'explain_dashboard_only_action',
        'explain_reassign_limit',
        'explain_time_off_approval',
      ],
      expect: 'explain_accessibility_settings',
    },
  ];

  for (const caze of negCases) {
    const { status, data } = await providerAi(caze.prompt);
    const pass =
      status >= 200 &&
      status < 300 &&
      !caze.forbid.includes(data?.action) &&
      (caze.expect == null || data?.action === caze.expect);
    record(caze.id, pass, {
      status,
      action: data?.action,
      summary: String(data?.summary || '').slice(0, 120),
    });
  }

  {
    const { data: dash } = await providerAi('Adjust loyalty points');
    const { data: reassign } = await providerAi(
      "Why can't AI reassign multi-service?",
    );
    const { data: approval } = await providerAi('Who approves my time off?');
    const pass =
      dash?.action === 'explain_dashboard_only_action' &&
      reassign?.action === 'explain_reassign_limit' &&
      approval?.action === 'explain_time_off_approval' &&
      new Set([dash?.action, reassign?.action, approval?.action]).size === 3;
    record('cross-no-steal', pass, {
      dash: dash?.action,
      reassign: reassign?.action,
      approval: approval?.action,
    });
  }

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass);
  console.log(
    `\ne2e-bug.247 QA → ${API} ${SLUG} — ${passed}/${results.length} PASS`,
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
