/**
 * Guru live QA for e2e-bug.283 — product-guide rescue must not steal
 * provider my_stats (HY "Ինչպե՞ս եմ…") into guide_user_flow.
 *
 * Run: node scripts/qa-e2e-bug-283.mjs
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
    id: 'live-hy-how-am-i-month',
    prompt: 'Ինչպե՞ս եմ այս ամիս',
    expectAction: 'my_stats',
    forbidActions: ['guide_user_flow', 'explain_app_feature', 'explain_current_screen'],
  },
  {
    id: 'live-hy-how-am-i-week',
    prompt: 'Ինչպես եմ այս շաբաթ',
    expectAction: 'my_stats',
    forbidActions: ['guide_user_flow', 'explain_app_feature'],
  },
  {
    id: 'live-hy-cucanish',
    prompt: 'Ցույց տուր իմ ցուցանիշները այս շաբաթ',
    expectAction: 'my_stats',
    forbidActions: ['guide_user_flow'],
  },
  {
    id: 'live-hy-utilization',
    prompt: 'Իմ օգտագործումը և եկամուտը այս շաբաթ',
    expectAction: 'my_stats',
    forbidActions: ['guide_user_flow'],
  },
  {
    id: 'live-en-how-am-i',
    prompt: 'How am I doing this month?',
    expectAction: 'my_stats',
    forbidActions: ['guide_user_flow'],
  },
  {
    id: 'live-en-show-stats',
    prompt: 'Show my stats this week',
    expectAction: 'my_stats',
    forbidActions: ['guide_user_flow'],
  },
  {
    id: 'live-ru-kak-u-menya',
    prompt: 'Как у меня дела этот месяц?',
    expectAction: 'my_stats',
    forbidActions: ['guide_user_flow'],
  },
  {
    id: 'live-ru-statistika',
    prompt: 'Моя статистика за неделю',
    expectAction: 'my_stats',
    forbidActions: ['guide_user_flow'],
  },
  {
    id: 'live-ctrl-guide-en-home',
    prompt: 'How do I use the Home tab?',
    expectAction: 'guide_user_flow',
    forbidActions: ['my_stats'],
  },
  {
    id: 'live-ctrl-guide-hy-home',
    prompt: 'Ինչպե՞ս օգտագործեմ Home tab-ը',
    expectAction: 'guide_user_flow',
    forbidActions: ['my_stats'],
  },
  {
    id: 'live-ctrl-faq-why-cant-hy',
    prompt: 'Ինչու չեմ կարող զանգահարել հաճախորդին',
    expectAction: 'explain_dashboard_only_action',
    forbidActions: ['my_stats', 'guide_user_flow'],
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

  const { rescueProductGuideIntent } = require(resolve(
    backendRoot,
    'dist/modules/ai/ai-product-guide-rescue.util.js',
  ));
  const { isMyStatsPrompt } = require(resolve(
    backendRoot,
    'dist/modules/ai/ai-provider-exp-2.util.js',
  ));
  const { resolveProductGuidePromptMatch } = require(resolve(
    backendRoot,
    'dist/modules/ai/ai-product-guide.util.js',
  ));

  const unitPrompt = 'Ինչպե՞ս եմ այս ամիս';
  const unitRescueUnknown = rescueProductGuideIntent(unitPrompt, 'unknown', {
    surface: 'provider',
  });
  const unitRescueMyStats = rescueProductGuideIntent(unitPrompt, 'my_stats', {
    surface: 'provider',
  });
  const unitMatch = resolveProductGuidePromptMatch(unitPrompt, {
    surface: 'provider',
  });
  const unitPass =
    isMyStatsPrompt(unitPrompt) &&
    !unitMatch.matched &&
    unitRescueUnknown.action === 'unknown' &&
    unitRescueMyStats.action === 'my_stats';
  console.log(
    `${unitPass ? 'PASS' : 'FAIL'}  unit-hy-how-am-i-no-guide-steal — ${JSON.stringify(
      {
        isMyStats: isMyStatsPrompt(unitPrompt),
        match: unitMatch,
        unknown: unitRescueUnknown,
        myStats: unitRescueMyStats,
      },
    )}`,
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

  console.log(`e2e-bug.283 QA → ${API} ${SLUG}`);
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

    console.log(
      `${pass ? 'PASS' : 'FAIL'}  ${caze.id} — ${JSON.stringify({
        status: res.status,
        action: d.action,
        success: d.success,
        summary: String(d.summary || '').slice(0, 140),
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
