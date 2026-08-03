/**
 * Guru live QA for e2e-bug.243 — give_provider_ai_feedback must be reachable
 * on provider AI with correct rating/reason parsing.
 *
 * Run: node scripts/qa-e2e-bug-243.mjs
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
        body: { prompt, context },
      },
    );
    return { status: res.status, data: unwrap(res.body) };
  }

  function record(id, pass, detail) {
    results.push({ id, pass, detail });
    console.log(
      `${pass ? 'PASS' : 'FAIL'}  ${id} — ${JSON.stringify(detail).slice(0, 260)}`,
    );
  }

  const cases = [
    {
      id: 'wrong-client',
      prompt: 'Wrong client picked',
      rating: 'down',
      reason: 'wrong_client',
      clientAction: 'submitAssistantFeedback',
    },
    {
      id: 'wasnt-my-intent',
      prompt: "That wasn't my intent",
      rating: 'down',
      reason: 'did_not_understand',
      clientAction: 'submitAssistantFeedback',
    },
    {
      id: 'was-not-my-intent',
      prompt: 'That was not my intent',
      rating: 'down',
      reason: 'did_not_understand',
      clientAction: 'submitAssistantFeedback',
    },
    {
      id: 'that-was-wrong',
      prompt: 'That was wrong',
      rating: 'down',
      clientAction: 'openAssistantFeedback', // down without reason → chips
      showReasonChips: true,
    },
    {
      id: 'that-was-helpful',
      prompt: 'That was helpful',
      rating: 'up',
      clientAction: 'submitAssistantFeedback',
    },
    {
      id: 'wrong-date',
      prompt: 'Wrong date picked',
      rating: 'down',
      reason: 'wrong_date',
      clientAction: 'submitAssistantFeedback',
    },
    {
      id: 'not-helpful',
      prompt: 'Not helpful',
      rating: 'down',
      clientAction: 'openAssistantFeedback',
      showReasonChips: true,
    },
    {
      id: 'wrong-service',
      prompt: 'Wrong service',
      rating: 'down',
      reason: 'wrong_service',
      clientAction: 'submitAssistantFeedback',
    },
    {
      id: 'wrong-action',
      prompt: 'Wrong action',
      rating: 'down',
      reason: 'wrong_action',
      clientAction: 'submitAssistantFeedback',
    },
    {
      id: 'good-answer',
      prompt: 'Good answer',
      rating: 'up',
      clientAction: 'submitAssistantFeedback',
    },
  ];

  for (const caze of cases) {
    const { status, data } = await providerAi(caze.prompt);
    const d = data?.details || {};
    const pass =
      status >= 200 &&
      status < 300 &&
      data?.action === 'give_provider_ai_feedback' &&
      data?.success === true &&
      d.feedbackRating === caze.rating &&
      (caze.reason ? d.feedbackReason === caze.reason : true) &&
      d.clientAction === caze.clientAction &&
      (caze.showReasonChips ? d.showReasonChips === true : true) &&
      d.assistantFeedback === true &&
      Array.isArray(d.feedbackReasonOptions) &&
      d.feedbackReasonOptions.length >= 5;
    record(caze.id, pass, {
      status,
      action: data?.action,
      success: data?.success,
      rating: d.feedbackRating,
      reason: d.feedbackReason,
      clientAction: d.clientAction,
      showReasonChips: d.showReasonChips,
      summary: String(data?.summary || '').slice(0, 100),
    });
  }

  // Negatives — must not become give_provider_ai_feedback
  const negCases = [
    { id: 'neg-check-in', prompt: 'Check in client' },
    { id: 'neg-cancel', prompt: 'Cancel my next appointment' },
    { id: 'neg-confirm-pending', prompt: 'Confirm all pending today' },
    { id: 'neg-mark-paid', prompt: 'Mark as paid' },
  ];
  for (const caze of negCases) {
    const { status, data } = await providerAi(caze.prompt);
    const pass =
      status >= 200 &&
      status < 300 &&
      data?.action !== 'give_provider_ai_feedback';
    record(caze.id, pass, {
      status,
      action: data?.action,
      summary: String(data?.summary || '').slice(0, 100),
    });
  }

  // Must not land on customer action name
  {
    const { status, data } = await providerAi('That was helpful');
    const pass =
      status >= 200 &&
      status < 300 &&
      data?.action === 'give_provider_ai_feedback' &&
      data?.action !== 'give_ai_feedback';
    record('not-customer-give-ai-feedback', pass, {
      status,
      action: data?.action,
    });
  }

  // Session lastAction preserved in details when provided
  {
    const { status, data } = await providerAi('Wrong client picked', {
      lastAction: 'confirm_pending_booking',
    });
    const pass =
      status >= 200 &&
      status < 300 &&
      data?.action === 'give_provider_ai_feedback' &&
      data?.details?.lastAction === 'confirm_pending_booking';
    record('session-lastAction-echo', pass, {
      status,
      action: data?.action,
      lastAction: data?.details?.lastAction,
    });
  }

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass);
  console.log(
    `\ne2e-bug.243 QA → ${API} ${SLUG} — ${passed}/${results.length} PASS`,
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
