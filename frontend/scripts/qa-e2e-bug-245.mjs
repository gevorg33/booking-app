/**
 * Guru live QA for e2e-bug.245 — explain_calendar_utilization_bands +
 * explain_block_vs_time_off must be reachable on provider AI (READ explainers).
 *
 * Run: node scripts/qa-e2e-bug-245.mjs
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

  const bandCases = [
    { id: 'bands-green', prompt: 'What do the green bands mean?' },
    { id: 'bands-fully-booked', prompt: 'Fully booked day?' },
    { id: 'bands-colors', prompt: 'What do the calendar colors mean?' },
    { id: 'bands-explain', prompt: 'Explain the calendar color bands' },
    { id: 'bands-hy', prompt: 'Ի՞նչ են ցույց տալիս օրացույցի գույները' },
    { id: 'bands-ru', prompt: 'Что означают цвета календаря?' },
  ];

  for (const caze of bandCases) {
    const { status, data } = await providerAi(caze.prompt);
    const summary = String(data?.summary || '');
    const pass =
      status >= 200 &&
      status < 300 &&
      data?.action === 'explain_calendar_utilization_bands' &&
      data?.success === true &&
      /Empty/i.test(summary) &&
      /Low/i.test(summary) &&
      /High/i.test(summary) &&
      data?.action !== 'summarize_utilization' &&
      data?.action !== 'get_calendar_month' &&
      data?.action !== 'unknown';
    record(caze.id, pass, {
      status,
      action: data?.action,
      success: data?.success,
      summary: summary.slice(0, 140),
    });
  }

  const blockCases = [
    {
      id: 'block-diff',
      prompt: "What's the difference between block and time off?",
    },
    { id: 'block-vacation', prompt: 'Which should I use for vacation?' },
    {
      id: 'block-or',
      prompt: 'Block or time off for a dentist appointment?',
    },
    {
      id: 'block-hy',
      prompt: 'Որն է տարբերությունը արգելափակման և արձակուրդի միջև',
    },
    {
      id: 'block-ru',
      prompt: 'В чём разница между блокировкой и отпуском?',
    },
  ];

  for (const caze of blockCases) {
    const { status, data } = await providerAi(caze.prompt);
    const summary = String(data?.summary || '');
    const pass =
      status >= 200 &&
      status < 300 &&
      data?.action === 'explain_block_vs_time_off' &&
      data?.success === true &&
      /block/i.test(summary) &&
      /time off/i.test(summary) &&
      /approval/i.test(summary) &&
      data?.action !== 'block_schedule' &&
      data?.action !== 'block_my_time' &&
      data?.action !== 'request_time_off' &&
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
      id: 'neg-summarize-util',
      prompt: 'How busy am I this month?',
      forbid: [
        'explain_calendar_utilization_bands',
        'explain_block_vs_time_off',
      ],
    },
    {
      id: 'neg-calendar-month',
      prompt: 'Show me my calendar for this month',
      forbid: [
        'explain_calendar_utilization_bands',
        'explain_block_vs_time_off',
      ],
    },
    {
      id: 'neg-block-my-time',
      prompt: 'Block my lunch from 12 to 1',
      forbid: [
        'explain_calendar_utilization_bands',
        'explain_block_vs_time_off',
      ],
    },
    {
      id: 'neg-request-time-off',
      prompt: 'Request time off next Friday',
      forbid: [
        'explain_calendar_utilization_bands',
        'explain_block_vs_time_off',
      ],
    },
  ];

  for (const caze of negCases) {
    const { status, data } = await providerAi(caze.prompt);
    const pass =
      status >= 200 &&
      status < 300 &&
      !caze.forbid.includes(data?.action);
    record(caze.id, pass, {
      status,
      action: data?.action,
      summary: String(data?.summary || '').slice(0, 120),
    });
  }

  {
    const { data: bands } = await providerAi('What do the green bands mean?');
    const { data: block } = await providerAi(
      "What's the difference between block and time off?",
    );
    const pass =
      bands?.action === 'explain_calendar_utilization_bands' &&
      block?.action === 'explain_block_vs_time_off' &&
      bands?.action !== block?.action;
    record('cross-no-steal', pass, {
      bands: bands?.action,
      block: block?.action,
    });
  }

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass);
  console.log(
    `\ne2e-bug.245 QA → ${API} ${SLUG} — ${passed}/${results.length} PASS`,
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
