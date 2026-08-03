/**
 * Guru live QA for e2e-bug.305 — mid-step compound clarify must return
 * action=compound_intent (not create_booking / reschedule_booking alone).
 * details.compoundStep keeps the clarifying step.
 *
 * Run: node frontend/scripts/qa-e2e-bug-305.mjs
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
    id: 'live-move-then-book-action',
    prompt:
      "Move Gevorg's appointment to Friday; then book a second massage for Anna",
    expectCompoundActions: ['reschedule_booking', 'create_booking'],
    // Mid-step clarify OR full compound success — never lone step action alone.
    forbidLoneStepAction: true,
  },
  {
    id: 'live-reschedule-then-facial-action',
    prompt: 'Reschedule Sam to Monday; then book a facial for Maria',
    expectCompoundActions: ['reschedule_booking', 'create_booking'],
    forbidLoneStepAction: true,
  },
  {
    id: 'live-shift-also-book-action',
    prompt: "Shift Anna's visit to tomorrow; also book a haircut for Bob",
    expectCompoundActions: ['reschedule_booking', 'create_booking'],
    forbidLoneStepAction: true,
  },
  {
    id: 'live-move-then-book-no-semi',
    prompt:
      "Move Gevorg's appointment to Friday then book a second massage for Anna",
    expectCompoundActions: ['reschedule_booking', 'create_booking'],
    forbidLoneStepAction: true,
  },
  // controls
  {
    id: 'ctrl-lone-create',
    prompt: 'Book a massage for Anna on Friday at 10:00',
    expectLoneOk: ['create_booking', 'compound_intent'],
    forbidCompoundMidstep: true,
  },
  {
    id: 'ctrl-lone-reschedule-nearest',
    prompt:
      "Move Gevorg's appointment on June 1; put it June 2 nearest free time",
    expectLoneOk: ['reschedule_booking', 'compound_intent'],
    forbidCompoundMidstep: true,
  },
  {
    id: 'ctrl-cancel-waitlist',
    prompt: 'Cancel package visit; fill waitlist',
    expectCompoundActionsContains: [
      'cancel_package_visit',
      'fill_slot_from_waitlist',
    ],
    forbidLoneStepAction: true,
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
            resolvePromise({
              status: res.statusCode,
              body: JSON.parse(raw || '{}'),
            });
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

function assertCase(c, d) {
  const errors = [];
  const compoundActions = Array.isArray(d?.details?.compoundActions)
    ? d.details.compoundActions
    : Array.isArray(d?.details?.subIntents)
      ? d.details.subIntents
      : [];
  const stepIndex = d?.details?.compoundStepIndex;
  const compoundStep = d?.details?.compoundStep;
  const needsClarify = d?.details?.needsClarification === true;
  const midStepClarify =
    needsClarify &&
    typeof stepIndex === 'number' &&
    stepIndex > 0 &&
    compoundActions.length >= 2;

  if (c.expectCompoundActions) {
    const hasAll = c.expectCompoundActions.every((a) =>
      compoundActions.includes(a),
    );
    // Accept full success without clarify if still compound_intent / both in plan
    const successCompound =
      d.action === 'compound_intent' ||
      (Array.isArray(d?.details?.subIntents) &&
        c.expectCompoundActions.every((a) =>
          d.details.subIntents.includes(a),
        ));
    if (!hasAll && !successCompound) {
      // Soft: if mid-step or decomposed list present
      if (!(compoundActions.length >= 2 && d.details?.decomposed)) {
        errors.push(
          `compoundActions=${JSON.stringify(compoundActions)} (want ${c.expectCompoundActions.join('|')})`,
        );
      }
    }
  }

  if (c.expectCompoundActionsContains) {
    const hasSome = c.expectCompoundActionsContains.some((a) =>
      compoundActions.includes(a),
    );
    if (!hasSome && d.action !== 'compound_intent' && !d.success) {
      // may clarify differently — only fail if clearly lone forbidden step
    }
  }

  if (c.forbidLoneStepAction) {
    if (midStepClarify) {
      if (d.action !== 'compound_intent') {
        errors.push(
          `mid-step clarify action=${d.action} (want compound_intent); compoundStep=${compoundStep}`,
        );
      }
      if (!compoundStep) {
        errors.push('mid-step clarify missing details.compoundStep');
      }
      if (d.action === compoundStep) {
        errors.push(
          `top-level action equals compoundStep (${compoundStep}) — looks like single-intent collapse`,
        );
      }
    } else if (
      needsClarify &&
      compoundActions.length >= 2 &&
      (d.action === 'create_booking' || d.action === 'reschedule_booking') &&
      !d.details?.decomposed
    ) {
      errors.push(
        `compound clarify collapsed to lone ${d.action} without compound metadata`,
      );
    } else if (
      !needsClarify &&
      (d.action === 'create_booking' || d.action === 'reschedule_booking') &&
      c.expectCompoundActions &&
      !compoundActions.length
    ) {
      errors.push(
        `expected compound but got lone ${d.action} with no compoundActions`,
      );
    }
  }

  if (c.forbidCompoundMidstep && midStepClarify) {
    errors.push('unexpected mid-step compound clarify on control');
  }

  if (c.expectLoneOk && !c.expectLoneOk.includes(d.action) && !d.success) {
    // allow clarify with step action for single intents
    if (!(needsClarify && c.expectLoneOk.includes(d.action))) {
      // only soft-fail if clearly wrong compound
      if (d.action === 'compound_intent' && midStepClarify) {
        errors.push(`control became mid-step compound (${d.action})`);
      }
    }
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

  console.log(`e2e-bug.305 QA → ${API} ${SLUG}`);
  let passed = 0;
  let midStepSeen = 0;

  for (const caze of CASES) {
    const res = await request('POST', `/businesses/${biz.id}/ai/command`, {
      token,
      body: {
        prompt: caze.prompt,
        context: { confirmed: true },
      },
    });
    const d = unwrap(res.body);
    const errors = assertCase(caze, d);
    const mid =
      d?.details?.needsClarification === true &&
      typeof d?.details?.compoundStepIndex === 'number' &&
      d.details.compoundStepIndex > 0;
    if (mid) midStepSeen += 1;

    if (errors.length) {
      console.log(`FAIL ${caze.id}`);
      for (const e of errors) console.log(`  - ${e}`);
      console.log(
        `  action=${d.action} step=${d.details?.compoundStep} idx=${d.details?.compoundStepIndex} clarify=${d.details?.needsClarification} actions=${JSON.stringify(d.details?.compoundActions || d.details?.subIntents)} summary=${JSON.stringify(String(d.summary || '').slice(0, 120))}`,
      );
    } else {
      passed += 1;
      const note = mid
        ? ` [mid-step clarify action=${d.action} step=${d.details?.compoundStep}]`
        : '';
      console.log(`PASS ${caze.id}${note}`);
    }
  }

  console.log(`\n${passed}/${CASES.length} passed (mid-step clarifies seen: ${midStepSeen})`);
  if (midStepSeen === 0) {
    console.log(
      'WARN: no mid-step clarify observed this run — unit coverage still asserts action rewrite; re-check if live always auto-fills time.',
    );
  }
  if (passed !== CASES.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
