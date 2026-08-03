/**
 * Guru live QA for e2e-bug.337 — the Armenian ՛ emphasis mark (U+055B),
 * commonly inserted mid-imperative in real-world text ("Բացատրի՛ր" = "Explain!"),
 * must not defeat `hasHoursCue`'s negative-lookahead exclusion guard in
 * `ai-explain-business-hours-and-location.util.ts`, which was written against
 * the unmarked citation-form spelling ("ատրիր") — sibling investigation of
 * e2e-bug.291/311. Covers the exact reported HY clinic-explain prompts plus
 * hours/imperative controls.
 *
 * Run: node frontend/scripts/qa-e2e-bug-337.mjs
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

  // Original reported repro #1: bare clinic explain, with emphasis mark.
  {
    const r = await ask('Բացատրի՛ր մեր կլինիկական ծառայությունները');
    check(
      'hy-emphasis-bare-clinic-explain',
      r.action === 'explain_clinic_services' && r.success === true,
      `got action=${r.action} success=${r.success} summary=${r.summary}`,
    );
  }

  // Original reported repro #2: clinic explain + departments, with emphasis mark.
  {
    const r = await ask(
      'Բացատրի՛ր մեր կլինիկական ծառայությունները և բաժինները',
    );
    check(
      'hy-emphasis-clinic-and-departments',
      r.action === 'explain_clinic_services' && r.success === true,
      `got action=${r.action} success=${r.success} summary=${r.summary}`,
    );
  }

  // Regression: same prompt without emphasis mark, already worked before.
  {
    const r = await ask('Բացատրիր մեր կլինիկական ծառայությունները և բաժինները');
    check(
      'hy-no-emphasis-clinic-regression',
      r.action === 'explain_clinic_services' && r.success === true,
      `got action=${r.action} success=${r.success}`,
    );
  }

  // EN control, must remain correct.
  {
    const r = await ask('Explain our clinic services and department counts');
    check(
      'en-clinic-explain-control',
      r.action === 'explain_clinic_services' && r.success === true,
      `got action=${r.action} success=${r.success}`,
    );
  }

  // Real HY hours question must still correctly route to hours/location.
  {
    const r = await ask('Ինչ ժամեր եք բաց');
    check(
      'hy-real-hours-question-control',
      r.action === 'explain_business_hours_and_location' && r.success === true,
      `got action=${r.action} success=${r.success}`,
    );
  }

  // Real HY hours question, with emphasis mark inserted, must still work.
  {
    const r = await ask('Ինչ ժամեր եք բա՛ց');
    check(
      'hy-real-hours-question-emphasis-control',
      r.action === 'explain_business_hours_and_location' && r.success === true,
      `got action=${r.action} success=${r.success}`,
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
