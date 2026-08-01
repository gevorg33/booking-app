/**
 * Guru live QA for e2e-bug.301 — provider explain_dashboard_only_action
 * summaries must localize for HY/RU prompts (not stay EN).
 *
 * Run: node frontend/scripts/qa-e2e-bug-301.mjs
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
    id: 'live-en-call',
    prompt: "Why can't I call the client?",
    expectAction: 'explain_dashboard_only_action',
    expectFragment: 'Tap phone to call client',
    expectEn: true,
  },
  {
    id: 'live-hy-call',
    prompt: 'Ինչու չեմ կարող զանգահարել հաճախորդին',
    expectAction: 'explain_dashboard_only_action',
    expectFragment: 'Հեռախոսով զանգել հաճախորդին',
    forbidEn: true,
  },
  {
    id: 'live-hy-zangel',
    prompt: 'Ինչու չեմ կարող զանգել հաճախորդին',
    expectAction: 'explain_dashboard_only_action',
    expectFragment: 'Հեռախոսով զանգել հաճախորդին',
    forbidEn: true,
  },
  {
    id: 'live-ru-call',
    prompt: 'Почему я не могу позвонить клиенту?',
    expectAction: 'explain_dashboard_only_action',
    expectFragment: 'Позвонить клиенту',
    forbidEn: true,
  },
  {
    id: 'live-hy-templates',
    prompt: 'Ինչու չեմ կարող խմբագրել հաղորդագրության ձևանմուշները',
    expectAction: 'explain_dashboard_only_action',
    expectFragment: 'ձևանմուշ',
    forbidEn: true,
  },
  {
    id: 'live-hy-loyalty',
    prompt: 'Ինչու չեմ կարող կարգավորել հավատարմության միավորները',
    expectAction: 'explain_dashboard_only_action',
    expectFragment: 'հավատարմության',
    forbidEn: true,
  },
  {
    id: 'live-hy-intake',
    prompt: 'Ինչու չեմ կարող բացել ամբողջական ընդունելության պատասխանները',
    expectAction: 'explain_dashboard_only_action',
    expectFragment: 'ընդունելության',
    forbidEn: true,
  },
  {
    id: 'live-en-loyalty',
    prompt: 'Adjust loyalty points',
    expectAction: 'explain_dashboard_only_action',
    expectFragment: 'Adjust loyalty points',
    expectEn: true,
  },
  {
    id: 'live-hy-locale-on-en-prompt',
    prompt: "Why can't I call the client?",
    locale: 'hy',
    expectAction: 'explain_dashboard_only_action',
    expectFragment: 'Հեռախոսով զանգել հաճախորդին',
    forbidEn: true,
  },
  {
    id: 'live-ru-locale-on-en-prompt',
    prompt: 'Adjust loyalty points',
    locale: 'ru',
    expectAction: 'explain_dashboard_only_action',
    expectFragment: 'Изменить баллы лояльности',
    forbidEn: true,
  },
  // controls — dedicated handoffs stay their actions (may still be EN — residual)
  {
    id: 'ctrl-reassign-hy',
    prompt: 'Ինչու չեմ կարող վերանշանակել բազմածառայության ամրագրումը',
    expectAction: 'explain_reassign_limit',
    noteResidual: true,
  },
  {
    id: 'ctrl-summarize-en',
    prompt: 'Summarize this client',
    expectAction: 'summarize_client',
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

function assertCase(c, body) {
  const errors = [];
  const summary = String(body?.summary || '');
  if (body?.action !== c.expectAction) {
    errors.push(`action=${body?.action} (want ${c.expectAction})`);
  }
  if (c.expectFragment && !summary.includes(c.expectFragment)) {
    errors.push(`missing fragment ${JSON.stringify(c.expectFragment)}`);
  }
  if (c.forbidEn) {
    for (const frag of [
      "isn't available from the mobile assistant",
      'Tap phone to call client',
      'Adjust loyalty points',
      'Use the dashboard for this',
    ]) {
      if (summary.includes(frag)) {
        errors.push(`EN leak: ${frag}`);
      }
    }
  }
  if (c.expectEn && !/dashboard/i.test(summary)) {
    errors.push('expected EN dashboard summary');
  }
  if (c.noteResidual && /[԰-֏]/.test(c.prompt) && /isn't available|Use the Reassign|Multi-service/i.test(summary)) {
    // reassign still EN — recorded as residual, not a fail for this suite
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

  console.log(`e2e-bug.301 QA → ${API} ${SLUG}`);
  let passed = 0;
  const residuals = [];

  for (const caze of CASES) {
    const res = await request(
      'POST',
      `/businesses/${biz.id}/provider/ai/command`,
      {
        token,
        body: {
          prompt: caze.prompt,
          context: {
            confirmed: true,
            ...(caze.locale ? { locale: caze.locale } : {}),
          },
        },
      },
    );
    const d = unwrap(res.body);
    const errors = assertCase(caze, d);
    if (caze.noteResidual && d.action === caze.expectAction) {
      const summary = String(d.summary || '');
      if (/Multi-service|Reassign button|dashboard page/i.test(summary)) {
        residuals.push({
          id: caze.id,
          summary: summary.slice(0, 120),
        });
      }
    }
    if (errors.length) {
      console.log(`FAIL ${caze.id}`);
      for (const e of errors) console.log(`  - ${e}`);
      console.log(`  summary=${JSON.stringify(String(d.summary || '').slice(0, 160))}`);
    } else {
      passed += 1;
      console.log(`PASS ${caze.id}`);
    }
  }

  console.log(`\n${passed}/${CASES.length} passed`);
  if (residuals.length) {
    console.log('RESIDUAL candidates (EN summary on HY reassign):');
    for (const r of residuals) console.log(`  ${r.id}: ${r.summary}`);
  }
  if (passed !== CASES.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
