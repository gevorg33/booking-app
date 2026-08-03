/**
 * Guru live QA for e2e-bug.244 — explain_booking_status_badge +
 * explain_floor_status must be reachable on provider AI (READ explainers).
 *
 * Run: node scripts/qa-e2e-bug-244.mjs
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

  const badgeCases = [
    { id: 'badge-pending', prompt: 'What does pending mean?' },
    { id: 'badge-in-progress', prompt: 'Why in progress?' },
    { id: 'badge-confirmed', prompt: 'What does the confirmed badge mean?' },
    { id: 'badge-statuses', prompt: 'Explain booking statuses' },
    { id: 'badge-no-show', prompt: 'What does no-show mean?' },
    { id: 'badge-hy', prompt: 'Ի՞նչ է նշանակում pending կարգավիճակը' },
    { id: 'badge-ru', prompt: 'Почему запись pending?' },
  ];

  for (const caze of badgeCases) {
    const { status, data } = await providerAi(caze.prompt);
    const summary = String(data?.summary || '');
    const pass =
      status >= 200 &&
      status < 300 &&
      data?.action === 'explain_booking_status_badge' &&
      data?.success === true &&
      /Pending/i.test(summary) &&
      /Confirmed/i.test(summary) &&
      /No-show/i.test(summary) &&
      data?.action !== 'explain_floor_status' &&
      data?.action !== 'unknown';
    record(caze.id, pass, {
      status,
      action: data?.action,
      success: data?.success,
      summary: summary.slice(0, 140),
    });
  }

  const floorCases = [
    { id: 'floor-waiting-vs', prompt: 'Waiting vs in service?' },
    { id: 'floor-checked-in', prompt: "What's checked in?" },
    { id: 'floor-explain', prompt: 'Explain the floor status' },
    { id: 'floor-strip', prompt: 'What does the floor strip show?' },
    { id: 'floor-hy', prompt: 'Ի՞նչ է նշանակում floor status-ը' },
    { id: 'floor-ru', prompt: 'Что показывает floor status?' },
  ];

  for (const caze of floorCases) {
    const { status, data } = await providerAi(caze.prompt);
    const summary = String(data?.summary || '');
    const pass =
      status >= 200 &&
      status < 300 &&
      data?.action === 'explain_floor_status' &&
      data?.success === true &&
      /floor strip/i.test(summary) &&
      /Waiting|checked in/i.test(summary) &&
      /In service/i.test(summary) &&
      data?.action !== 'explain_booking_status_badge' &&
      data?.action !== 'team_floor_status';
    record(caze.id, pass, {
      status,
      action: data?.action,
      success: data?.success,
      summary: summary.slice(0, 140),
    });
  }

  // Negatives / no-steal
  const negCases = [
    {
      id: 'neg-confirm-pending',
      prompt: 'Confirm all pending today',
      forbid: ['explain_booking_status_badge', 'explain_floor_status'],
    },
    {
      id: 'neg-mark-in-progress',
      prompt: 'Mark in progress',
      forbid: ['explain_booking_status_badge', 'explain_floor_status'],
    },
    {
      id: 'neg-check-in',
      prompt: 'Check in client',
      forbid: ['explain_booking_status_badge', 'explain_floor_status'],
    },
    {
      id: 'neg-feedback',
      prompt: 'Wrong client picked',
      forbid: ['explain_booking_status_badge', 'explain_floor_status'],
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

  // Cross-no-steal: badge prompt must not return floor and vice versa
  {
    const { data: badge } = await providerAi('What does pending mean?');
    const { data: floor } = await providerAi('Explain the floor status');
    const pass =
      badge?.action === 'explain_booking_status_badge' &&
      floor?.action === 'explain_floor_status' &&
      badge?.action !== floor?.action;
    record('cross-no-steal', pass, {
      badge: badge?.action,
      floor: floor?.action,
    });
  }

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass);
  console.log(
    `\ne2e-bug.244 QA → ${API} ${SLUG} — ${passed}/${results.length} PASS`,
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
