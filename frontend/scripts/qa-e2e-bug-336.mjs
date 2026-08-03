/**
 * Guru live QA for e2e-bug.336 — `explain_tour_calendar_span`'s week-range
 * and span-range date labels must use an unambiguous month-name format,
 * never DD/MM slash — sibling of Fixed e2e-bug.306/308. Covers EN/RU/HY.
 *
 * Run: node frontend/scripts/qa-e2e-bug-336.mjs
 * Requires: API on :3001, dashboard owner JWT for gevgas-operations-7c299253.
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
const SLUG = 'gevgas-operations-7c299253';
const SLASH_DATE_RE = /\b\d{2}\/\d{2}\/\d{4}\b/;

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
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 3001,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          ...headers,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = raw;
          }
          resolvePromise({ status: res.statusCode, body: parsed });
        });
      },
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  loadEnv();
  const dbUrl =
    process.env.DATABASE_URL ||
    'postgresql://gevorggasparyan@localhost:5432/booking_platform';
  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  const { rows: bizRows } = await client.query(
    `SELECT id FROM businesses WHERE slug = $1`,
    [SLUG],
  );
  const businessId = bizRows[0].id;
  const { rows: memberRows } = await client.query(
    `SELECT user_id, role FROM business_members WHERE business_id = $1 AND role = 'owner' LIMIT 1`,
    [businessId],
  );
  const token = jwt.sign(
    { sub: memberRows[0].user_id, businessId, membershipRole: memberRows[0].role },
    JWT_SECRET,
    { expiresIn: '1h' },
  );
  const authHeaders = { Authorization: `Bearer ${token}` };

  let pass = 0;
  let fail = 0;
  const check = (id, condition, detail) => {
    if (condition) {
      pass += 1;
      console.log(`  PASS  ${id}`);
    } else {
      fail += 1;
      console.log(`  FAIL  ${id} — ${detail}`);
    }
  };

  async function ask(prompt) {
    const res = await request(
      'POST',
      `/businesses/${businessId}/ai/command`,
      { prompt },
      authHeaders,
    );
    const data = res.body?.data ?? res.body;
    return {
      action: data?.action,
      success: data?.success,
      summary: String(data?.summary || ''),
    };
  }

  // Original reported repro (RU).
  {
    const r = await ask(
      'Почему тур отображается на несколько дней на календаре провайдера',
    );
    check(
      'ru-multi-day-span-action',
      r.action === 'explain_tour_calendar_span' && r.success === true,
      `got action=${r.action} success=${r.success}`,
    );
    check(
      'ru-multi-day-span-no-slash-date',
      !SLASH_DATE_RE.test(r.summary),
      `got: ${r.summary}`,
    );
  }

  // EN sibling.
  {
    const r = await ask(
      'Why do tours appear across multiple days on the provider calendar?',
    );
    check(
      'en-multi-day-span-no-slash-date',
      r.success === true && !SLASH_DATE_RE.test(r.summary),
      `got success=${r.success} summary=${r.summary}`,
    );
  }

  // HY sibling.
  {
    const r = await ask('Ինչու՞ շրջագայությունը երևում է մի քանի օր օրացույցում');
    check(
      'hy-multi-day-span-no-slash-date',
      r.success === true && !SLASH_DATE_RE.test(r.summary),
      `got success=${r.success} summary=${r.summary}`,
    );
  }

  // Other aspects (service colors, clipped week, stacked lanes) must also
  // avoid slash dates when they embed week/span ranges.
  {
    const r = await ask('How are tour service colors assigned on the provider calendar?');
    check(
      'service-colors-no-slash-date',
      r.success === true && !SLASH_DATE_RE.test(r.summary),
      `got success=${r.success} summary=${r.summary}`,
    );
  }
  {
    const r = await ask('How are tours clipped at the week boundary?');
    check(
      'clipped-week-no-slash-date',
      r.success === true && !SLASH_DATE_RE.test(r.summary),
      `got success=${r.success} summary=${r.summary}`,
    );
  }

  await client.end();
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
