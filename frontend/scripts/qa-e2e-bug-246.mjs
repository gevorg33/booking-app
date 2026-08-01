/**
 * Guru live QA for e2e-bug.246 — explain_offline_suggestions +
 * explain_accessibility_settings must be reachable on provider AI (READ FAQ).
 *
 * Run: node scripts/qa-e2e-bug-246.mjs
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

  const offlineCases = [
    { id: 'offline-stale', prompt: 'Why stale suggestions?' },
    { id: 'offline-refresh', prompt: 'Refresh suggestions when online?' },
    { id: 'offline-not-updating', prompt: 'Suggestions are not updating' },
    { id: 'offline-hy', prompt: 'Ինչու է հուշումը հին' },
    { id: 'offline-ru', prompt: 'Почему подсказки устарели?' },
  ];

  for (const caze of offlineCases) {
    const { status, data } = await providerAi(caze.prompt);
    const summary = String(data?.summary || '');
    const pass =
      status >= 200 &&
      status < 300 &&
      data?.action === 'explain_offline_suggestions' &&
      data?.success === true &&
      /stale|offline|refresh/i.test(summary) &&
      data?.action !== 'offline_queue_status' &&
      data?.action !== 'explain_ai_suggestions' &&
      data?.action !== 'unknown';
    record(caze.id, pass, {
      status,
      action: data?.action,
      success: data?.success,
      summary: summary.slice(0, 140),
    });
  }

  const a11yCases = [
    { id: 'a11y-bigger-text', prompt: 'Bigger text in app?' },
    { id: 'a11y-tap-targets', prompt: 'Larger tap targets?' },
    { id: 'a11y-font-size', prompt: 'Increase the font size in the app' },
    {
      id: 'a11y-hy',
      prompt: 'Հասանելիության կարգավորումներում մեծ տառաչափ',
    },
    {
      id: 'a11y-ru',
      prompt: 'Настройки доступности — крупный шрифт',
    },
  ];

  for (const caze of a11yCases) {
    const { status, data } = await providerAi(caze.prompt);
    const summary = String(data?.summary || '');
    const pass =
      status >= 200 &&
      status < 300 &&
      data?.action === 'explain_accessibility_settings' &&
      data?.success === true &&
      /accessibility/i.test(summary) &&
      (/iOS|Android/i.test(summary) || /system/i.test(summary)) &&
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
      id: 'neg-offline-queue',
      prompt: 'Show my offline queue status',
      forbid: [
        'explain_offline_suggestions',
        'explain_accessibility_settings',
      ],
    },
    {
      id: 'neg-calendar-bands',
      prompt: 'What do the green bands mean?',
      forbid: [
        'explain_offline_suggestions',
        'explain_accessibility_settings',
      ],
      expect: 'explain_calendar_utilization_bands',
    },
    {
      id: 'neg-block-lunch',
      prompt: 'Block my lunch from 12 to 1',
      forbid: [
        'explain_offline_suggestions',
        'explain_accessibility_settings',
      ],
    },
    {
      id: 'neg-feedback',
      prompt: 'Wrong client picked',
      forbid: [
        'explain_offline_suggestions',
        'explain_accessibility_settings',
      ],
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
    const { data: offline } = await providerAi('Why stale suggestions?');
    const { data: a11y } = await providerAi('Bigger text in app?');
    const pass =
      offline?.action === 'explain_offline_suggestions' &&
      a11y?.action === 'explain_accessibility_settings' &&
      offline?.action !== a11y?.action;
    record('cross-no-steal', pass, {
      offline: offline?.action,
      a11y: a11y?.action,
    });
  }

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass);
  console.log(
    `\ne2e-bug.246 QA → ${API} ${SLUG} — ${passed}/${results.length} PASS`,
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
