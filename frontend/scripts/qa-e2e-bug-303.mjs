/**
 * Guru live QA for e2e-bug.303 — first-person how-am-I / my_stats must
 * return "Your stats…" (scope=mine), not "Team stats…", even for owner tokens.
 * Explicit team cues must still return Team.
 *
 * Run: node frontend/scripts/qa-e2e-bug-303.mjs
 * Requires: API on :3001
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(__dirname, '../../backend');
const require = createRequire(resolve(backendRoot, 'package.json'));

const SLUG = process.env.SALON_SLUG || 'gevgas-operations-7c299253';
const API = process.env.API_BASE || 'http://127.0.0.1:3001';

const CASES = [
  {
    id: 'live-en-how-am-i-month',
    prompt: 'How am I doing this month?',
    expectAction: 'my_stats',
    expectScope: 'mine',
    expectSummary: /Your stats this month/i,
    forbidSummary: /Team stats/i,
  },
  {
    id: 'live-en-how-am-i-week',
    prompt: 'How am I doing this week?',
    expectAction: 'my_stats',
    expectScope: 'mine',
    expectSummary: /Your stats this week/i,
    forbidSummary: /Team stats/i,
  },
  {
    id: 'live-en-show-my-stats',
    prompt: 'Show my stats this week',
    expectAction: 'my_stats',
    expectScope: 'mine',
    expectSummary: /Your stats this week/i,
    forbidSummary: /Team stats/i,
  },
  {
    id: 'live-hy-how-am-i-month',
    prompt: 'Ինչպե՞ս եմ այս ամիս',
    expectAction: 'my_stats',
    expectScope: 'mine',
    expectSummary: /Your stats this month/i,
    forbidSummary: /Team stats/i,
  },
  {
    id: 'live-hy-how-am-i-week',
    prompt: 'Ինչպես եմ այս շաբաթ',
    expectAction: 'my_stats',
    expectScope: 'mine',
    expectSummary: /Your stats this week/i,
    forbidSummary: /Team stats/i,
  },
  {
    id: 'live-hy-my-cucanish',
    prompt: 'Ցույց տուր իմ ցուցանիշները այս շաբաթ',
    expectAction: 'my_stats',
    expectScope: 'mine',
    expectSummary: /Your stats/i,
    forbidSummary: /Team stats/i,
  },
  {
    id: 'live-ru-kak-u-menya',
    prompt: 'Как у меня дела этот месяц?',
    expectAction: 'my_stats',
    expectScope: 'mine',
    expectSummary: /Your stats this month/i,
    forbidSummary: /Team stats/i,
  },
  {
    id: 'live-ru-moya-statistika',
    prompt: 'Моя статистика за неделю',
    expectAction: 'my_stats',
    expectScope: 'mine',
    expectSummary: /Your stats this week/i,
    forbidSummary: /Team stats/i,
  },
  // explicit team — must stay Team
  {
    id: 'live-en-team-stats',
    prompt: 'Team stats for the week',
    expectAction: 'my_stats',
    expectScope: 'team',
    expectSummary: /Team stats this week/i,
    forbidSummary: /Your stats/i,
  },
  {
    id: 'live-hy-team-cucanish',
    prompt: 'Թիմի ցուցանիշները այս շաբաթ',
    expectAction: 'my_stats',
    expectScope: 'team',
    expectSummary: /Team stats this week/i,
    forbidSummary: /Your stats/i,
  },
  {
    id: 'live-ru-team-statistika',
    prompt: 'Статистика команды за неделю',
    expectAction: 'my_stats',
    expectScope: 'team',
    expectSummary: /Team stats this week/i,
    forbidSummary: /Your stats/i,
  },
  // control — not my_stats
  {
    id: 'ctrl-hy-home-tab',
    prompt: 'Ինչպե՞ս օգտագործեմ Home tab-ը',
    forbidActions: ['my_stats'],
  },
];

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
    const data = body ? JSON.stringify(body) : '';
    const url = new URL(path, API);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (d) => (raw += d));
        res.on('end', () => {
          try {
            resolvePromise({ status: res.statusCode, body: JSON.parse(raw || '{}') });
          } catch (e) {
            reject(e);
          }
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

function assertCase(c, body) {
  const errors = [];
  const summary = String(body?.summary || '');
  const scope = body?.details?.scope ?? body?.scope;
  if (c.forbidActions?.includes(body?.action)) {
    errors.push(`forbidden action ${body?.action}`);
  }
  if (c.expectAction && body?.action !== c.expectAction) {
    errors.push(`action=${body?.action} (want ${c.expectAction})`);
  }
  if (c.expectScope && scope !== c.expectScope) {
    errors.push(`scope=${scope} (want ${c.expectScope})`);
  }
  if (c.expectSummary && !c.expectSummary.test(summary)) {
    errors.push(`summary missing ${c.expectSummary}`);
  }
  if (c.forbidSummary && c.forbidSummary.test(summary)) {
    errors.push(`summary has forbidden ${c.forbidSummary}`);
  }
  return errors;
}

async function main() {
  loadEnv();
  process.chdir(backendRoot);

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

  console.log(`e2e-bug.303 QA → ${API} ${SLUG} (owner token)`);
  let passed = 0;

  for (const caze of CASES) {
    const res = await request(
      'POST',
      `/businesses/${biz.id}/provider/ai/command`,
      {
        token,
        body: {
          prompt: caze.prompt,
          context: { confirmed: true },
        },
      },
    );
    const d = unwrap(res.body);
    const errors = assertCase(caze, d);
    if (errors.length) {
      console.log(`FAIL ${caze.id}`);
      for (const e of errors) console.log(`  - ${e}`);
      console.log(
        `  action=${d.action} scope=${d?.details?.scope} summary=${JSON.stringify(String(d.summary || '').slice(0, 140))}`,
      );
    } else {
      passed += 1;
      console.log(`PASS ${caze.id}`);
    }
  }

  console.log(`\n${passed}/${CASES.length} passed`);
  if (passed !== CASES.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
