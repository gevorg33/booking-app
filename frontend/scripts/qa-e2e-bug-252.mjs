/**
 * Guru live QA for e2e-bug.252 — owner alert toggle must accept
 * "a customer reschedules" (-s) the same as "a customer cancels".
 *
 * Mutates notifyBusinessOnCustomerBookingChange — restores prior value at end.
 *
 * Run: node scripts/qa-e2e-bug-252.mjs
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
    await c.query('SELECT id, settings FROM businesses WHERE slug=$1', [SLUG])
  ).rows[0];
  if (!biz) throw new Error(`business not found: ${SLUG}`);

  const prior =
    biz.settings?.notifications?.notifyBusinessOnCustomerBookingChange ??
    false;

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

  console.log(
    `e2e-bug.252 QA → ${API} ${SLUG} (prior notifyBusinessOnCustomerBookingChange=${prior})`,
  );

  const results = [];

  async function dashboardAi(prompt) {
    const res = await request('POST', `/businesses/${biz.id}/ai/command`, {
      token,
      body: { prompt, context: {} },
    });
    return { status: res.status, data: unwrap(res.body) };
  }

  function record(id, pass, detail) {
    results.push({ id, pass, detail });
    console.log(
      `${pass ? 'PASS' : 'FAIL'}  ${id} — ${JSON.stringify(detail).slice(0, 320)}`,
    );
  }

  const ACTION = 'toggle_business_email_on_customer_change';

  const enableCases = [
    {
      id: 'canon-every-time-reschedules',
      prompt:
        'Alert me every time a customer reschedules their appointment',
    },
    {
      id: 'whenever-a-customer-reschedules',
      prompt: 'Alert me whenever a customer reschedules',
    },
    {
      id: 'notify-me-when-a-customer-reschedules',
      prompt: 'Notify me when a customer reschedules a booking',
    },
    {
      id: 'email-me-whenever-a-customer-reschedules',
      prompt: 'Email me whenever a customer reschedules',
    },
    {
      id: 'tell-me-if-a-customer-reschedules',
      prompt: 'Tell me if a customer reschedules their visit',
    },
    {
      id: 'customers-reschedule-plural-ok',
      prompt: 'Alert me whenever customers reschedule their appointment',
    },
    {
      id: 'cancel-s-regression',
      prompt: 'Alert me whenever a customer cancels',
    },
    {
      id: 'enable-email-when-customer-reschedules',
      prompt: 'Enable email when a customer reschedules',
    },
    {
      id: 'voice-alert-me-reschedules',
      prompt: 'alert me whenever a customer reschedules please',
    },
  ];

  for (const caze of enableCases) {
    const { status, data } = await dashboardAi(caze.prompt);
    const pass =
      status >= 200 &&
      status < 300 &&
      data?.action === ACTION &&
      data?.action !== 'create_booking' &&
      data?.action !== 'react_agent' &&
      data?.action !== 'unknown';
    record(caze.id, pass, {
      status,
      action: data?.action,
      success: data?.success,
      enabled: data?.details?.enabled ?? data?.params?.enabled,
      summary: String(data?.summary || '').slice(0, 160),
    });
  }

  {
    const { status, data } = await dashboardAi(
      'Turn off email alerts when a customer reschedules',
    );
    const pass =
      status >= 200 &&
      status < 300 &&
      data?.action === ACTION &&
      (data?.details?.enabled === false ||
        data?.params?.enabled === false ||
        /off|disabled|stop/i.test(String(data?.summary || '')));
    record('turn-off-when-customer-reschedules', pass, {
      status,
      action: data?.action,
      success: data?.success,
      enabled: data?.details?.enabled ?? data?.params?.enabled,
      summary: String(data?.summary || '').slice(0, 160),
    });
  }

  // Negatives — customer-outbound must not become owner toggle.
  const negatives = [
    {
      id: 'neg-notify-the-customer-reschedule',
      prompt: 'Notify the customer about their rescheduled booking',
    },
    {
      id: 'neg-send-notification-to-customer',
      prompt:
        'Send a notification to the customer regarding their reschedule',
    },
  ];

  for (const caze of negatives) {
    const { status, data } = await dashboardAi(caze.prompt);
    const pass =
      status >= 200 &&
      status < 300 &&
      data?.action !== ACTION;
    record(caze.id, pass, {
      status,
      action: data?.action,
      summary: String(data?.summary || '').slice(0, 140),
    });
  }

  // Restore prior setting via AI (same as e2e-bug.159 cleanup) + DB verify.
  const restorePrompt = prior
    ? 'Alert me whenever customers cancel their appointment'
    : 'Turn off email alerts when customers cancel';
  await dashboardAi(restorePrompt);

  const after = (
    await c.query(
      `SELECT settings->'notifications'->'notifyBusinessOnCustomerBookingChange' AS v
       FROM businesses WHERE id=$1`,
      [biz.id],
    )
  ).rows[0]?.v;
  const restored =
    after === prior ||
    after === String(prior) ||
    (prior === false && (after === false || after === 'false' || after == null));
  record('restore-prior-setting', restored, {
    prior,
    after,
  });

  // Force DB restore if AI restore mismatched.
  if (!restored) {
    await c.query(
      `UPDATE businesses
       SET settings = jsonb_set(
         COALESCE(settings, '{}'::jsonb),
         '{notifications,notifyBusinessOnCustomerBookingChange}',
         $2::jsonb,
         true
       )
       WHERE id=$1`,
      [biz.id, JSON.stringify(Boolean(prior))],
    );
    console.log(`DB-forced restore notifyBusinessOnCustomerBookingChange=${prior}`);
  }

  await c.end();

  const failed = results.filter((r) => !r.pass);
  console.log(
    `\n${results.length - failed.length}/${results.length} passed` +
      (failed.length ? ` — FAILED: ${failed.map((f) => f.id).join(', ')}` : ''),
  );
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
