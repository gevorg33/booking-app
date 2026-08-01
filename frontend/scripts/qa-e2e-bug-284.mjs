/**
 * Guru live QA for e2e-bug.284 — "Move …; then book a second …" must be
 * compound reschedule_booking → create_booking (not create_booking alone).
 *
 * Run: node scripts/qa-e2e-bug-284.mjs
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
    id: 'live-move-then-book-second',
    prompt:
      "Move Gevorg's appointment to Friday; then book a second massage for Anna",
    expectCompound: true,
    expectActions: ['reschedule_booking', 'create_booking'],
    forbidLoneActions: ['create_booking', 'reschedule_booking'],
  },
  {
    id: 'live-move-then-book-no-semi',
    prompt:
      "Move Gevorg's appointment to Friday then book a second massage for Anna",
    expectCompound: true,
    expectActions: ['reschedule_booking', 'create_booking'],
  },
  {
    id: 'live-reschedule-then-book-facial',
    prompt: 'Reschedule Sam to Monday; then book a facial for Maria',
    expectCompound: true,
    expectActions: ['reschedule_booking', 'create_booking'],
  },
  {
    id: 'live-shift-also-book',
    prompt: "Shift Anna's visit to tomorrow; also book a haircut for Bob",
    expectCompound: true,
    expectActions: ['reschedule_booking', 'create_booking'],
  },
  {
    id: 'live-ctrl-put-it-nearest',
    prompt:
      "Move Gevorg's appointment on June 1; put it June 2 nearest free time",
    expectCompound: false,
    expectLoneAction: 'reschedule_booking',
    forbidActions: ['compound_intent', 'create_booking'],
  },
  {
    id: 'live-ctrl-create-only',
    prompt: 'Book a massage for Anna on Friday',
    expectCompound: false,
    expectLoneAction: 'create_booking',
    forbidActions: ['compound_intent', 'reschedule_booking'],
  },
  {
    id: 'live-ctrl-cancel-waitlist',
    prompt: 'Cancel package visit; fill waitlist',
    expectCompound: true,
    expectActionsContains: ['cancel_package_visit', 'fill_slot_from_waitlist'],
    forbidLoneActions: ['reschedule_booking', 'create_booking'],
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
    req.setTimeout(180000, () => req.destroy(new Error('timeout')));
    if (data) req.write(data);
    req.end();
  });
}

function unwrap(body) {
  return body?.data ?? body;
}

function collectActions(d) {
  const actions = [];
  if (d?.action) actions.push(d.action);
  if (Array.isArray(d?.details?.compoundActions)) {
    actions.push(...d.details.compoundActions);
  }
  if (Array.isArray(d?.details?.subIntents)) {
    actions.push(...d.details.subIntents);
  }
  if (d?.details?.compoundStep) actions.push(d.details.compoundStep);
  const steps =
    d?.details?.steps ||
    d?.details?.compoundSteps ||
    d?.compoundSteps ||
    d?.steps ||
    [];
  for (const s of steps) {
    if (s?.action) actions.push(s.action);
  }
  const planSteps = d?.plan?.steps || d?.details?.plan?.steps || [];
  for (const s of planSteps) {
    if (s?.action) actions.push(s.action);
  }
  const summary = String(d?.summary || '');
  for (const a of [
    'reschedule_booking',
    'create_booking',
    'cancel_package_visit',
    'fill_slot_from_waitlist',
  ]) {
    if (summary.includes(a)) actions.push(a);
  }
  return [...new Set(actions)];
}

async function main() {
  loadEnv();
  process.chdir(backendRoot);

  const {
    isRescheduleThenCreateBookingCompoundPrompt,
    decomposeRescheduleThenCreateBookingCompoundPrompt,
  } = require(resolve(
    backendRoot,
    'dist/modules/ai/ai-reschedule-then-create-booking-compound.util.js',
  ));
  const { matchGoldenCompoundPattern } = require(resolve(
    backendRoot,
    'dist/modules/ai/intent-decomposition.util.js',
  ));

  const unitPrompt =
    "Move Gevorg's appointment to Friday; then book a second massage for Anna";
  const unitSteps =
    decomposeRescheduleThenCreateBookingCompoundPrompt(unitPrompt);
  const golden = matchGoldenCompoundPattern('dashboard', unitPrompt);
  const unitPass =
    isRescheduleThenCreateBookingCompoundPrompt(unitPrompt) &&
    unitSteps.map((s) => s.action).join(',') ===
      'reschedule_booking,create_booking' &&
    golden?.steps?.map((s) => s.action).join(',') ===
      'reschedule_booking,create_booking';
  console.log(
    `${unitPass ? 'PASS' : 'FAIL'}  unit-decompose-move-then-book — ${JSON.stringify(
      {
        match: isRescheduleThenCreateBookingCompoundPrompt(unitPrompt),
        steps: unitSteps.map((s) => s.action),
        golden: golden?.steps?.map((s) => s.action),
        createCustomer: unitSteps[1]?.params?.customerName,
        createService: unitSteps[1]?.params?.serviceName,
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
  const token = jwt.sign(
    {
      sub: member.user_id,
      email: String(member.email).toLowerCase(),
      role: member.user_role,
      businessId: biz.id,
      membershipRole: member.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: '2h' },
  );
  await c.end();

  console.log(`e2e-bug.284 QA → ${API} ${SLUG}`);
  let failed = unitPass ? 0 : 1;

  for (const caze of CASES) {
    const res = await request('POST', `/businesses/${biz.id}/ai/command`, {
      token,
      body: {
        prompt: caze.prompt,
        context: { confirmed: true },
      },
    });
    const d = unwrap(res.body);
    const actions = collectActions(d);
    const top = d.action;
    let pass = res.status >= 200 && res.status < 300;

    const compoundActions = Array.isArray(d?.details?.compoundActions)
      ? d.details.compoundActions
      : [];
    const decomposed = d?.details?.decomposed === true || compoundActions.length >= 2;

    if (caze.expectCompound) {
      const expected = caze.expectActions || caze.expectActionsContains || [];
      const hasBoth = expected.every((a) => actions.includes(a));
      // Mid-step clarify returns the current step action but must still expose
      // the full compoundActions list (e2e-bug.284).
      const compoundVisible =
        top === 'compound_intent' ||
        decomposed ||
        (compoundActions.length >= 2 &&
          expected.every((a) => compoundActions.includes(a)));
      const loneCollapse =
        caze.forbidLoneActions?.includes(top) &&
        !compoundVisible &&
        !hasBoth;
      pass = pass && hasBoth && compoundVisible && !loneCollapse;
    } else {
      if (caze.expectLoneAction) {
        pass = pass && top === caze.expectLoneAction;
      }
      if (caze.forbidActions?.includes(top)) pass = false;
      // Controls must not look like the move+book compound.
      if (compoundActions.includes('reschedule_booking') &&
          compoundActions.includes('create_booking')) {
        pass = false;
      }
    }

    console.log(
      `${pass ? 'PASS' : 'FAIL'}  ${caze.id} — ${JSON.stringify({
        status: res.status,
        action: top,
        actions,
        compoundActions,
        compoundStep: d?.details?.compoundStep || null,
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
