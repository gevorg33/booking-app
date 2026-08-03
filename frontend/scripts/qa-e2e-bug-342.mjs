/**
 * Guru live QA for e2e-bug.342 — `list_team_unpaid_today` / `explain_reviews_inbox`
 * were entirely missing from the command registry (INTENT_BINDING_SEEDS), so
 * `acceptRescueForSurface` silently dropped an otherwise-correct rescue
 * whenever the upstream classifier gave up entirely and returned literally
 * `'unknown'`. Both detectors and `tryRescueProviderExp2` were always
 * correct — only the registry row was missing.
 *
 * Run: node frontend/scripts/qa-e2e-bug-342.mjs
 * Requires: API on :3001, salon `gevgas-operations-7c299253` with an owner
 * membership and at least one active employee.
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
    if (data) req.write(data);
    req.end();
  });
}

function unwrap(body) {
  return body?.data ?? body;
}

async function main() {
  loadEnv();
  console.log(`e2e-bug.342 live QA → ${API} slug=${SLUG}`);
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

  async function providerAi(prompt) {
    const res = await request(
      'POST',
      `/businesses/${biz.id}/provider/ai/command`,
      { token, body: { prompt, context: {} } },
    );
    const data = unwrap(res.body);
    return {
      action: data?.action,
      success: data?.success,
      summary: String(data?.summary || ''),
    };
  }

  // Exact ticket-reported HY prompt for list_team_unpaid_today.
  {
    const r = await providerAi('Կա՞ որևէ մեկը հարկում, ով դեռ չի վճարել');
    check(
      'hy-unpaid-today-exact-repro',
      r.action === 'list_team_unpaid_today' && r.success === true,
      `got action=${r.action} success=${r.success} summary=${r.summary}`,
    );
  }

  // RU sibling for list_team_unpaid_today.
  {
    const r = await providerAi('Есть кто-то в команде, кто ещё не заплатил?');
    check(
      'ru-unpaid-today',
      r.action === 'list_team_unpaid_today' && r.success === true,
      `got action=${r.action} success=${r.success}`,
    );
  }

  // Exact ticket-reported HY prompt for explain_reviews_inbox.
  {
    const r = await providerAi('Ցուցադրիր վատ կարծիքները այս շաբաթ');
    check(
      'hy-reviews-inbox-exact-repro',
      r.action === 'explain_reviews_inbox' && r.success === true,
      `got action=${r.action} success=${r.success} summary=${r.summary}`,
    );
  }

  // RU sibling for explain_reviews_inbox.
  {
    const r = await providerAi('Покажи плохие отзывы за эту неделю');
    check(
      'ru-reviews-inbox',
      r.action === 'explain_reviews_inbox' && r.success === true,
      `got action=${r.action} success=${r.success}`,
    );
  }

  // Regression control — a sibling exp-2 intent (my_stats) must remain reachable.
  {
    const r = await providerAi('What are my stats today?');
    check(
      'en-my-stats-regression',
      r.action === 'my_stats' && r.success === true,
      `got action=${r.action} success=${r.success}`,
    );
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
