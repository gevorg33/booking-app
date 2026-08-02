/**
 * Guru live QA for e2e-bug.327 — provider explain_reassign_limit /
 * explain_time_off_approval summaries must localize under HY/RU (locale
 * param and native-script prompt), not stay hardcoded EN.
 *
 * Run: node frontend/scripts/qa-e2e-bug-327.mjs
 * Requires: API on :3001, a valid staff JWT for BUSINESS_ID.
 */
import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(__dirname, '../../backend');
const require = createRequire(resolve(backendRoot, 'package.json'));
const jwt = require('jsonwebtoken');
const { Client } = require('pg');

const API = process.env.API_BASE || 'http://127.0.0.1:3001';
const JWT_SECRET =
  process.env.JWT_SECRET || 'dev-secret-change-in-production-f8a3b2c1d4e5';

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

function request(method, path, body, headers = {}) {
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
          ...headers,
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

const CASES = [
  {
    id: 'en-reassign',
    prompt: "Why can't AI reassign multi-service?",
    locale: 'en',
    expectFragment: 'Reassign button',
    forbid: [],
  },
  {
    id: 'hy-reassign-script',
    prompt: 'Ինչու չեմ կարող վերանշանակել բազմածառայության ամրագրումը',
    expectFragment: 'Վերանշանակել',
    forbid: ['Same-day reassignment uses the dedicated mobile API'],
  },
  {
    id: 'hy-reassign-explicit-locale',
    prompt: "Why can't AI reassign multi-service?",
    locale: 'hy',
    expectFragment: 'Վերանշանակել',
    forbid: ['Same-day reassignment uses the dedicated mobile API'],
  },
  {
    id: 'ru-reassign-script',
    prompt: 'Почему нельзя переназначить мультиуслугу?',
    expectFragment: 'Переназначить',
    forbid: ['Same-day reassignment uses the dedicated mobile API'],
  },
  {
    id: 'ru-reassign-explicit-locale',
    prompt: "Why can't AI reassign multi-service?",
    locale: 'ru',
    expectFragment: 'Переназначить',
    forbid: ['Same-day reassignment uses the dedicated mobile API'],
  },
  {
    id: 'en-time-off',
    prompt: 'Who approves my time off?',
    locale: 'en',
    expectFragment: 'manager approves',
    forbid: [],
  },
  {
    id: 'hy-time-off-script',
    prompt: 'Ով է հաստատում իմ արձակուրդը',
    expectFragment: 'մենեջերը',
    forbid: ['Your manager approves or denies time-off requests'],
  },
  {
    id: 'hy-time-off-explicit-locale',
    prompt: 'Who approves my time off?',
    locale: 'hy',
    expectFragment: 'մենեջերը',
    forbid: ['Your manager approves or denies time-off requests'],
  },
  {
    id: 'ru-time-off-script',
    prompt: 'Кто одобряет мой отпуск?',
    expectFragment: 'менеджер',
    forbid: ['Your manager approves or denies time-off requests'],
  },
  {
    id: 'ru-time-off-explicit-locale',
    prompt: 'Who approves my time off?',
    locale: 'ru',
    expectFragment: 'менеджер',
    forbid: ['Your manager approves or denies time-off requests'],
  },
];

async function main() {
  loadEnv();
  const dbUrl =
    process.env.DATABASE_URL ||
    'postgresql://gevorggasparyan@localhost:5432/booking_platform';
  const client = new Client({ connectionString: dbUrl });
  await client.connect();
  const { rows } = await client.query(
    `SELECT bm.business_id, bm.user_id, bm.role, e.id AS employee_id
     FROM business_members bm
     JOIN businesses b ON b.id = bm.business_id
     LEFT JOIN employees e ON e.user_id = bm.user_id AND e.business_id = bm.business_id
     WHERE b.slug = $1
     LIMIT 1`,
    ['gevgas-operations-7c299253'],
  );
  await client.end();
  if (!rows.length) {
    console.error('No staff membership found for gevgas-operations-7c299253');
    process.exitCode = 1;
    return;
  }
  const { business_id: businessId, user_id: userId, role, employee_id: employeeId } =
    rows[0];
  const token = jwt.sign(
    { sub: userId, businessId, membershipRole: role, employeeId },
    JWT_SECRET,
    { expiresIn: '1h' },
  );

  let passed = 0;
  const failures = [];

  for (const c of CASES) {
    const res = await request(
      'POST',
      `/businesses/${businessId}/provider/ai/command`,
      {
        prompt: c.prompt,
        context: c.locale ? { locale: c.locale } : {},
      },
      { Authorization: `Bearer ${token}` },
    );
    const body = res.body?.data ?? res.body;
    const errors = [];
    if (res.status !== 200 && res.status !== 201) {
      errors.push(`http ${res.status}`);
    }
    const summary = body?.summary ?? '';
    if (!summary.includes(c.expectFragment)) {
      errors.push(`missing fragment "${c.expectFragment}" in: ${summary}`);
    }
    for (const f of c.forbid) {
      if (summary.includes(f)) {
        errors.push(`forbidden EN fragment "${f}" present in: ${summary}`);
      }
    }
    if (errors.length) {
      failures.push({ id: c.id, errors });
      console.log(`FAIL ${c.id} ("${c.prompt}", locale=${c.locale ?? 'auto'})`);
      for (const e of errors) console.log(`  - ${e}`);
      console.log(`  action=${body?.action} summary=${JSON.stringify(summary)}`);
    } else {
      passed += 1;
      console.log(`PASS ${c.id} ("${c.prompt}", locale=${c.locale ?? 'auto'})`);
    }
  }

  console.log(`\n${passed}/${CASES.length} passed`);
  if (failures.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
