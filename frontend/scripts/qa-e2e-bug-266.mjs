/**
 * Guru live QA for e2e-bug.266 — provider my_stats must not false-positive on
 * Armenian FAQ prompts that merely contain նչ+եմ ("Ինչու չեմ կարող…").
 *
 * Run: node scripts/qa-e2e-bug-266.mjs
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

  async function providerAi(prompt, context = {}) {
    const res = await request(
      'POST',
      `/businesses/${biz.id}/provider/ai/command`,
      {
        token,
        body: { prompt, context: { confirmed: true, ...context } },
      },
    );
    return { status: res.status, data: unwrap(res.body) };
  }

  function record(id, pass, detail) {
    results.push({ id, pass, detail });
    console.log(
      `${pass ? 'PASS' : 'FAIL'}  ${id} — ${JSON.stringify(detail).slice(0, 280)}`,
    );
  }

  console.log(`e2e-bug.266 QA → ${API} ${SLUG}\n`);

  // Positives — real my_stats (EN + HY)
  const positives = [
    { id: 'pos-en-week', prompt: 'Show my stats this week' },
    { id: 'pos-en-how', prompt: 'How am I doing this month?' },
    { id: 'pos-hy-cucanish', prompt: 'Ցույց տուր իմ ցուցանիշները այս շաբաթ' },
    { id: 'pos-hy-how', prompt: 'Ինչպե՞ս եմ այս ամիս' },
    { id: 'pos-hy-utilization', prompt: 'Իմ օգտագործումը և եկամուտը այս շաբաթ' },
    { id: 'pos-ru', prompt: 'Моя статистика за неделю' },
  ];

  for (const caze of positives) {
    const { status, data } = await providerAi(caze.prompt);
    const pass =
      status >= 200 &&
      status < 300 &&
      data?.action === 'my_stats' &&
      data?.success === true;
    record(caze.id, pass, {
      status,
      action: data?.action,
      success: data?.success,
      summary: String(data?.summary || '').slice(0, 120),
    });
  }

  // Negatives — նչ+եմ FAQ phrasing must NOT become my_stats
  const negatives = [
    {
      id: 'neg-reassign-hy',
      prompt: 'Ինչու չեմ կարող վերանշանակել բազմածառայության ամրագրումը',
      prefer: 'explain_reassign_limit',
    },
    {
      id: 'neg-templates-hy',
      prompt: 'Ինչու չեմ կարող խմբագրել հաղորդագրության ձևանմուշները',
    },
    {
      id: 'neg-loyalty-hy',
      prompt: 'Ինչու չեմ կարող կարգավորել հավատարմության միավորները',
    },
    {
      id: 'neg-call-hy',
      prompt: 'Ինչու չեմ կարող զանգահարել հաճախորդին',
    },
    {
      id: 'neg-intake-hy',
      prompt: 'Ինչու չեմ կարող բացել ամբողջական ընդունելության պատասխանները',
    },
    {
      id: 'neg-generic-hy',
      prompt: 'Ինչու չեմ կարող սա անել հավելվածում',
    },
    {
      id: 'neg-floor-meaning-hy',
      prompt: 'Ի՞նչ է նշանակում floor status-ը',
      prefer: 'explain_floor_status',
    },
    {
      id: 'neg-reassign-en',
      prompt: "Why can't AI reassign multi-service?",
      prefer: 'explain_reassign_limit',
    },
  ];

  for (const caze of negatives) {
    const { status, data } = await providerAi(caze.prompt);
    const notMyStats = data?.action !== 'my_stats';
    const preferOk = caze.prefer
      ? data?.action === caze.prefer
      : true;
    // Gate: never my_stats. Prefer exact action when known; otherwise any non-stats is OK.
    const pass =
      status >= 200 &&
      status < 300 &&
      notMyStats &&
      (caze.prefer ? preferOk : true);
    record(caze.id, pass, {
      status,
      action: data?.action,
      success: data?.success,
      prefer: caze.prefer || null,
      summary: String(data?.summary || '').slice(0, 140),
    });
  }

  // Residual probes — HY dashboard-only FAQs may still be unknown if topic
  // keywords are EN-only; pass as long as not my_stats (file residual if unknown).
  for (const caze of [
    {
      id: 'probe-dash-templates-hy',
      prompt: 'Ինչու չեմ կարող խմբագրել հաղորդագրության ձևանմուշները',
    },
    {
      id: 'probe-dash-loyalty-hy',
      prompt: 'Ինչու չեմ կարող կարգավորել հավատարմության միավորները',
    },
  ]) {
    const { status, data } = await providerAi(caze.prompt);
    const pass =
      status >= 200 &&
      status < 300 &&
      data?.action !== 'my_stats';
    record(caze.id, pass, {
      status,
      action: data?.action,
      note:
        data?.action === 'explain_dashboard_only_action'
          ? 'dashboard handoff OK'
          : 'not my_stats (handoff may need HY keywords — residual if unknown)',
    });
  }

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass);
  console.log(
    `\ne2e-bug.266 QA → ${API} ${SLUG} — ${passed}/${results.length} PASS`,
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
