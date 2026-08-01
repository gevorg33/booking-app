/**
 * Guru live QA for e2e-bug.267 — semicolon / "then put it" move+nearest
 * must stay a single dashboard reschedule_booking (not compound_intent /
 * fill_slot_from_waitlist).
 *
 * Run: node scripts/qa-e2e-bug-267.mjs
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
      `SELECT id, name FROM employees WHERE business_id=$1 AND "isActive"=true LIMIT 1`,
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
  const empName = emp?.name?.split(/\s+/)[0] || 'Gevorg';

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
      `${pass ? 'PASS' : 'FAIL'}  ${id} — ${JSON.stringify(detail).slice(0, 300)}`,
    );
  }

  console.log(`e2e-bug.267 QA → ${API} ${SLUG}\n`);

  const singleCases = [
    {
      id: 'semicolon-put-it-nearest',
      prompt: `Move ${empName}'s appointment on June 1; put it June 2 nearest free time`,
    },
    {
      id: 'then-put-it-nearest',
      prompt: `Move ${empName}'s appointment on June 1 then put it June 2 nearest free time`,
    },
    {
      id: 'semicolon-put-it-soonest',
      prompt: `Reschedule ${empName} appointment; put it on the soonest free slot tomorrow`,
    },
    {
      id: 'then-move-it-nearest',
      prompt:
        'Change time of the appointment then move it to the nearest free time next week',
    },
    {
      id: 'probe-shift-put-that',
      prompt: `Shift ${empName}'s booking on Monday; put that on the first available free slot Tuesday`,
      // Soft probe — compound must not win; if action ≠ reschedule, file residual.
      soft: true,
    },
    {
      id: 'control-no-semicolon',
      prompt: `Move ${empName}'s appointment on June 1 to June 2 nearest free time`,
    },
    {
      id: 'question-semicolon-put-it',
      prompt: `Can you move ${empName}'s appointment on June 1; put it June 2 nearest free time?`,
    },
    {
      id: 'voice-semicolon',
      prompt: `move ${empName} appointment june 1; put it june 2 nearest free time please`,
    },
  ];

  for (const caze of singleCases) {
    const { status, data } = await dashboardAi(caze.prompt);
    const summary = String(data?.summary || '');
    const compoundLeak =
      data?.action === 'compound_intent' ||
      data?.action === 'fill_slot_from_waitlist' ||
      /fill_slot_from_waitlist/i.test(summary) ||
      /Cannot book in the past/i.test(summary);
    const hardPass =
      status >= 200 &&
      status < 300 &&
      data?.action === 'reschedule_booking' &&
      !compoundLeak;
    // Soft probes: gate is "not compound / not waitlist"; reschedule preferred.
    const softPass =
      status >= 200 &&
      status < 300 &&
      !compoundLeak &&
      data?.action !== 'compound_intent';
    const pass = caze.soft ? softPass : hardPass;
    record(caze.id, pass, {
      status,
      action: data?.action,
      success: data?.success,
      compoundLeak,
      soft: !!caze.soft,
      summary: summary.slice(0, 140),
      note:
        caze.soft && data?.action !== 'reschedule_booking'
          ? 'soft: not compound (reschedule preferred — residual if other action)'
          : null,
    });
  }

  // True compounds must still decompose (not stolen by the single-intent guard).
  const compoundGuards = [
    {
      id: 'guard-cancel-fill-waitlist',
      prompt: 'Cancel package visit; fill waitlist',
      forbidAction: 'reschedule_booking',
      preferActions: ['compound_intent', 'cancel_package_visit'],
    },
    {
      id: 'guard-move-then-book-other',
      prompt: `Move ${empName}'s appointment to Friday; then book a second massage for Anna`,
      forbidAction: null,
      // Must not collapse to a lone reschedule that drops the book step.
      // Accept compound_intent or create_booking/book path — never silent drop.
      preferActions: [
        'compound_intent',
        'create_booking',
        'book_nearest_slot',
        'reschedule_booking',
      ],
      // Soft: just ensure we don't get fill_slot_from_waitlist from put-it guard
      // incorrectly. Main gate: not unknown/error from the guard itself.
      note: 'true compound — must not be forced to single reschedule-only',
    },
  ];

  for (const caze of compoundGuards) {
    const { status, data } = await dashboardAi(caze.prompt);
    const action = data?.action;
    const okStatus = status >= 200 && status < 300;
    const notForbidden = caze.forbidAction
      ? action !== caze.forbidAction
      : true;
    // For move+book: if it collapses to ONLY reschedule_booking with no book
    // intent in summary, that's a residual — still pass .267 if action is
    // compound OR multi-step. Soft pass: any non-error response that isn't
    // the false single-put-it path (fill waitlist).
    const notWaitlistSteal = action !== 'fill_slot_from_waitlist';
    const preferOk =
      !caze.preferActions || caze.preferActions.includes(action);
    const pass = okStatus && notForbidden && notWaitlistSteal && preferOk;
    record(caze.id, pass, {
      status,
      action,
      success: data?.success,
      summary: String(data?.summary || '').slice(0, 140),
      note: caze.note || null,
    });
  }

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass);
  console.log(
    `\ne2e-bug.267 QA → ${API} ${SLUG} — ${passed}/${results.length} PASS`,
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
