/**
 * Guru live QA for e2e-bug.302 — HY Home-tab guide must resolve a topic
 * (provider-today-calendar) and not return EN topic-miss clarify.
 *
 * Run: node frontend/scripts/qa-e2e-bug-302.mjs
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
    id: 'live-en-home-tab',
    prompt: 'How do I use the Home tab?',
    expectActions: ['guide_user_flow', 'explain_provider_app_tabs'],
    expectSuccess: true,
    expectTopicId: 'provider-today-calendar',
    forbidMiss: true,
  },
  {
    id: 'live-hy-home-tab',
    prompt: 'Ինչպե՞ս օգտագործեմ Home tab-ը',
    expectAction: 'guide_user_flow',
    expectSuccess: true,
    expectTopicId: 'provider-today-calendar',
    forbidMiss: true,
    forbidEnMiss: true,
  },
  {
    id: 'live-hy-home-tab-locale',
    prompt: 'Ինչպե՞ս օգտագործեմ Home tab-ը',
    locale: 'hy',
    expectAction: 'guide_user_flow',
    expectSuccess: true,
    expectTopicId: 'provider-today-calendar',
    forbidMiss: true,
    forbidEnMiss: true,
  },
  {
    id: 'live-hy-home-plain',
    prompt: 'Ինչպես օգտագործեմ Home tab-ը',
    expectAction: 'guide_user_flow',
    expectSuccess: true,
    expectTopicId: 'provider-today-calendar',
    forbidMiss: true,
  },
  {
    id: 'live-ru-home-tab',
    prompt: 'Как пользоваться вкладкой Home?',
    expectActions: ['guide_user_flow', 'explain_provider_app_tabs'],
    expectSuccess: true,
    expectTopicId: 'provider-today-calendar',
    forbidMiss: true,
    forbidEnMiss: true,
  },
  {
    id: 'live-en-today-tab',
    prompt: 'How do I use the Today tab?',
    expectActions: ['guide_user_flow', 'explain_provider_app_tabs'],
    expectSuccess: true,
    expectTopicId: 'provider-today-calendar',
    forbidMiss: true,
  },
  {
    id: 'live-hy-today-tab',
    prompt: 'Ինչպե՞ս օգտագործեմ Today tab-ը',
    expectAction: 'guide_user_flow',
    expectSuccess: true,
    expectTopicId: 'provider-today-calendar',
    forbidMiss: true,
  },
  {
    id: 'live-ru-today-tab',
    prompt: 'Как пользоваться вкладкой Today?',
    expectActions: ['guide_user_flow', 'explain_provider_app_tabs'],
    expectSuccess: true,
    expectTopicId: 'provider-today-calendar',
    forbidMiss: true,
    forbidEnMiss: true,
  },
  // controls
  {
    id: 'ctrl-hy-how-am-i',
    prompt: 'Ինչպե՞ս եմ այս ամիս',
    expectAction: 'my_stats',
    forbidActions: ['guide_user_flow', 'explain_provider_app_tabs'],
  },
  {
    id: 'ctrl-en-how-am-i',
    prompt: 'How am I doing this month?',
    expectAction: 'my_stats',
    forbidActions: ['guide_user_flow', 'explain_provider_app_tabs'],
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
  const topicId = body?.guide?.topicId ?? body?.details?.topicId;

  if (c.forbidActions?.includes(body?.action)) {
    errors.push(`forbidden action ${body?.action}`);
  }
  const allowedActions = c.expectActions ?? (c.expectAction ? [c.expectAction] : null);
  if (allowedActions && !allowedActions.includes(body?.action)) {
    errors.push(`action=${body?.action} (want ${allowedActions.join('|')})`);
  }
  if (c.expectSuccess === true && body?.success !== true) {
    errors.push(`success=${body?.success}`);
  }
  if (c.expectTopicId && topicId !== c.expectTopicId) {
    errors.push(`topicId=${topicId} (want ${c.expectTopicId})`);
  }
  if (c.forbidMiss && /could not match that to a guide topic/i.test(summary)) {
    errors.push('EN topic-miss clarify');
  }
  if (c.forbidEnMiss && /could not match that to a guide topic/i.test(summary)) {
    errors.push('EN miss leaked');
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

  console.log(`e2e-bug.302 QA → ${API} ${SLUG}`);
  let passed = 0;

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
    if (errors.length) {
      console.log(`FAIL ${caze.id}`);
      for (const e of errors) console.log(`  - ${e}`);
      console.log(
        `  action=${d.action} success=${d.success} topic=${d?.guide?.topicId} summary=${JSON.stringify(String(d.summary || '').slice(0, 140))}`,
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
