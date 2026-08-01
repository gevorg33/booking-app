/**
 * Guru live QA for e2e-bug.282 — HY/RU "why can't I call the client" must be
 * explain_dashboard_only_action (not summarize_client / my_stats).
 *
 * Run: node scripts/qa-e2e-bug-282.mjs
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

const CASES = [
  {
    id: 'live-hy-zangahararel',
    prompt: 'Ինչու չեմ կարող զանգահարել հաճախորդին',
    expectAction: 'explain_dashboard_only_action',
    forbidActions: ['summarize_client', 'my_stats'],
  },
  {
    id: 'live-hy-zangel',
    prompt: 'Ինչու չեմ կարող զանգել հաճախորդին',
    expectAction: 'explain_dashboard_only_action',
    forbidActions: ['summarize_client', 'my_stats'],
  },
  {
    id: 'live-en-call-client',
    prompt: "Why can't I call the client?",
    expectAction: 'explain_dashboard_only_action',
    forbidActions: ['summarize_client', 'my_stats'],
  },
  {
    id: 'live-en-phone-customer',
    prompt: "Why can't I phone the customer?",
    expectAction: 'explain_dashboard_only_action',
    forbidActions: ['summarize_client', 'my_stats'],
  },
  {
    id: 'live-ru-pozvonit',
    prompt: 'Почему я не могу позвонить клиенту?',
    expectAction: 'explain_dashboard_only_action',
    forbidActions: ['summarize_client', 'my_stats'],
  },
  {
    id: 'live-hy-templates',
    prompt: 'Ինչու չեմ կարող խմբագրել հաղորդագրության ձևանմուշները',
    expectAction: 'explain_dashboard_only_action',
    forbidActions: ['summarize_client', 'my_stats'],
  },
  {
    id: 'live-hy-loyalty',
    prompt: 'Ինչու չեմ կարող կարգավորել հավատարմության միավորները',
    expectAction: 'explain_dashboard_only_action',
    forbidActions: ['summarize_client', 'my_stats'],
  },
  {
    id: 'live-hy-intake',
    prompt: 'Ինչու չեմ կարող բացել ամբողջական ընդունելության պատասխանները',
    expectAction: 'explain_dashboard_only_action',
    forbidActions: ['summarize_client', 'my_stats'],
  },
  {
    id: 'live-control-reassign-hy',
    prompt: 'Ինչու չեմ կարող վերանշանակել բազմածառայության ամրագրումը',
    expectAction: 'explain_reassign_limit',
    forbidActions: ['summarize_client', 'my_stats', 'explain_dashboard_only_action'],
  },
  {
    id: 'live-control-summarize-en',
    prompt: 'Summarize this client',
    expectAction: 'summarize_client',
    forbidActions: ['explain_dashboard_only_action', 'my_stats'],
  },
  {
    id: 'live-control-summarize-hy',
    prompt: 'Ամփոփիր այս հաճախորդին',
    expectAction: 'summarize_client',
    forbidActions: ['explain_dashboard_only_action', 'my_stats'],
  },
  {
    id: 'live-control-my-stats-hy',
    prompt: 'Ինչպե՞ս եմ այս ամիս',
    expectAction: 'my_stats',
    forbidActions: ['summarize_client', 'explain_dashboard_only_action'],
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
  process.chdir(backendRoot);

  const {
    isExplainDashboardOnlyActionPrompt,
    isWhyCantCallClientDashboardHandoffPrompt,
  } = require(resolve(
    backendRoot,
    'dist/modules/ai/ai-provider-dashboard-handoff.util.js',
  ));
  const { isSummarizeClientPrompt } = require(resolve(
    backendRoot,
    'dist/modules/ai/ai-provider-client-context.util.js',
  ));

  const unitPrompt = 'Ինչու չեմ կարող զանգահարել հաճախորդին';
  const unitPass =
    isWhyCantCallClientDashboardHandoffPrompt(unitPrompt) &&
    isExplainDashboardOnlyActionPrompt(unitPrompt) &&
    !isSummarizeClientPrompt(unitPrompt);
  console.log(
    `${unitPass ? 'PASS' : 'FAIL'}  unit-hy-call-not-summarize — ${JSON.stringify({
      handoff: isExplainDashboardOnlyActionPrompt(unitPrompt),
      summarize: isSummarizeClientPrompt(unitPrompt),
    })}`,
  );

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

  console.log(`e2e-bug.282 QA → ${API} ${SLUG}`);
  let failed = unitPass ? 0 : 1;

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
    let pass = res.status >= 200 && res.status < 300;
    pass = pass && d.action === caze.expectAction;
    if (caze.forbidActions?.includes(d.action)) pass = false;
    const summary = String(d.summary || '');
    if (caze.expectAction === 'explain_dashboard_only_action') {
      pass = pass && /dashboard|վահանակ|панел/i.test(summary);
    }

    console.log(
      `${pass ? 'PASS' : 'FAIL'}  ${caze.id} — ${JSON.stringify({
        status: res.status,
        action: d.action,
        success: d.success,
        summary: summary.slice(0, 140),
      })}`,
    );
    if (!pass) failed += 1;
  }

  const total = 1 + CASES.length;
  console.log(`\n${total - failed}/${total} passed`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
