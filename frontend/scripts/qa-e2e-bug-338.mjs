/**
 * Guru live QA for e2e-bug.338 — `create_service_category` name extraction
 * must strip a trailing "with N placeholder service(s)" / RU "и N placeholder
 * услугами" count clause, not absorb it into `categoryName` (e2e-bug.312
 * residual). placeholderCount itself is parsed separately (from the LLM
 * classifier params) and is unaffected by this fix.
 *
 * Run: node frontend/scripts/qa-e2e-bug-338.mjs
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

const JWT_SECRET =
  process.env.JWT_SECRET || 'dev-secret-change-in-production-f8a3b2c1d4e5';
const SLUG = 'gevgas-operations-7c299253';

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

  const ts = Date.now().toString().slice(-6);

  // Exact reported repro #1 (EN).
  {
    const name = `QA338EN-${ts}a`;
    const r = await ask(
      `Create a catalog category named ${name} with 2 placeholder services`,
    );
    check(
      'en-exact-repro-name-clean',
      r.success === true && r.summary.includes(`"${name}"`),
      `got success=${r.success} summary=${r.summary}`,
    );
    check(
      'en-exact-repro-no-clause-leak',
      !r.summary.includes('with 2 placeholder services"'),
      `got summary=${r.summary}`,
    );
    check(
      'en-exact-repro-placeholder-count-preserved',
      /2 placeholder service/i.test(r.summary),
      `got summary=${r.summary}`,
    );
  }

  // Exact reported repro #2 (RU).
  {
    const name = `QA338RU-${ts}b`;
    const r = await ask(
      `Создай категорию каталога с названием ${name} и 2 placeholder услугами`,
    );
    check(
      'ru-exact-repro-name-clean',
      r.success === true && r.summary.includes(name),
      `got success=${r.success} summary=${r.summary}`,
    );
    check(
      'ru-exact-repro-no-clause-leak',
      !r.summary.includes(`${name} и 2`),
      `got summary=${r.summary}`,
    );
  }

  // RU count-clause-precedes-name — must remain clean (regression).
  {
    const name = `QA338RU-${ts}c`;
    const r = await ask(
      `Создай категорию каталога с 2 услугами-заглушками под названием ${name}`,
    );
    check(
      'ru-count-first-regression',
      r.success === true && r.summary.includes(name),
      `got success=${r.success} summary=${r.summary}`,
    );
  }

  // Legit "with" in name, no count — must not be truncated.
  {
    const name = `QA338EN-${ts}d with Extras`;
    const r = await ask(`Create a catalog category named ${name}`);
    check(
      'en-legit-with-in-name-preserved',
      r.success === true && r.summary.includes(name),
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
