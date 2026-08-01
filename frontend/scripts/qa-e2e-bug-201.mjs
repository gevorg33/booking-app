/**
 * Manual QA for e2e-bug.201 — intake_lab_book_pay must not die on step 1
 * with "Ask to fill the pre-visit intake…" when the prompt includes a pay cue.
 *
 * Clinic: qa-test-clinic-cf58d2a9
 * PASS if compound enters and step 1 is NOT the payment-cue clarify.
 * Sign-in / no-published-intake / later-step failures are OK after the gate.
 */
import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(__dirname, '../../backend');
const require = createRequire(resolve(backendRoot, 'package.json'));

const SLUG = process.env.CLINIC_SLUG || 'qa-test-clinic-cf58d2a9';
const API = process.env.API_BASE || 'http://127.0.0.1:3001';

function loadEnv() {
  const envPath = resolve(backendRoot, '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    if (process.env[key] != null) continue;
    process.env[key] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}

async function mintClinicCustomerToken() {
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
  if (!biz) {
    await c.end();
    throw new Error(`business not found: ${SLUG}`);
  }
  const customer = (
    await c.query(
      'SELECT id, email FROM customers WHERE business_id=$1 AND email IS NOT NULL LIMIT 1',
      [biz.id],
    )
  ).rows[0];
  await c.end();
  if (!customer) throw new Error('no customer with email for clinic');
  return jwt.sign(
    {
      sub: customer.id,
      email: String(customer.email).toLowerCase(),
      businessId: biz.id,
      type: 'public_customer',
    },
    process.env.JWT_SECRET,
    { expiresIn: '2h' },
  );
}

async function assistant(prompt, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}/public/${SLUG}/assistant`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      prompt,
      assistantMode: 'act',
      locale: 'en',
      context: { slug: SLUG },
    }),
  });
  const raw = await res.json();
  return raw.data || raw;
}

const INTAKE_CLARIFY = /Ask to fill the pre-visit intake and book a lab test/i;
const STOPPED_STEP1_INTAKE =
  /Stopped at step 1 \(complete_intake_and_book\).*Ask to fill the pre-visit intake/i;

const CASES = [
  {
    id: 'pay-online-compound',
    prompt: 'Fill intake and book blood draw, pay online',
    expectAction: 'compound_intent',
    forbidIntakeClarify: true,
  },
  {
    id: 'pay-deposit-compound',
    prompt: 'Complete health form, book earliest blood draw, pay deposit',
    expectAction: 'compound_intent',
    forbidIntakeClarify: true,
  },
  {
    id: 'pay-cash-compound',
    prompt:
      'fill my intake, book the soonest blood test slot, and pay cash at the visit',
    expectAction: 'compound_intent',
    forbidIntakeClarify: true,
  },
  {
    id: 'pay-card-cbc',
    prompt: 'Finish questionnaire and book CBC, pay with card',
    expectAction: 'compound_intent',
    forbidIntakeClarify: true,
  },
  {
    id: 'pay-online-lipid',
    prompt: 'Fill intake and book lipid panel, pay online',
    expectAction: 'compound_intent',
    forbidIntakeClarify: true,
  },
  {
    id: 'control-standalone-no-pay',
    prompt: 'Fill intake and book blood draw',
    // May be compound complete_intake_and_book or single — must not be pay-cue clarify
    forbidIntakeClarify: true,
    forbidSummary: STOPPED_STEP1_INTAKE,
  },
  {
    id: 'control-standalone-must-pass-gate',
    prompt: 'Fill intake and book blood draw',
    forbidSummary: INTAKE_CLARIFY,
  },
  {
    id: 'neg-pay-only',
    prompt: 'Pay online for my booking',
    forbidAction: 'compound_intent',
    forbidIntakeClarify: true,
  },
  {
    id: 'neg-explain-intake',
    prompt: 'Why do I need to fill the intake form?',
    forbidIntakeClarify: true,
  },
  {
    id: 'anon-pay-online-past-gate',
    prompt: 'Fill intake and book blood draw, pay online',
    anon: true,
    expectAction: 'compound_intent',
    forbidIntakeClarify: true,
  },
  {
    id: 'anon-pay-cash-past-gate',
    prompt:
      'fill my intake, book the soonest blood test slot, and pay cash at the visit',
    anon: true,
    expectAction: 'compound_intent',
    forbidIntakeClarify: true,
  },
];

function passCase(c, data) {
  const summary = String(data.summary || '');
  const reasons = [];
  let pass = true;

  if (c.expectAction) {
    const ok = data.action === c.expectAction;
    if (!ok) reasons.push(`action=${data.action} want ${c.expectAction}`);
    pass = pass && ok;
  }
  if (c.forbidAction) {
    const ok = data.action !== c.forbidAction;
    if (!ok) reasons.push(`forbidAction ${c.forbidAction}`);
    pass = pass && ok;
  }
  if (c.forbidSummary) {
    const ok = !c.forbidSummary.test(summary);
    if (!ok) reasons.push('forbidSummary matched');
    pass = pass && ok;
  }
  if (c.forbidIntakeClarify) {
    const bad =
      INTAKE_CLARIFY.test(summary) || STOPPED_STEP1_INTAKE.test(summary);
    if (bad) reasons.push('intake payment-cue clarify on step 1');
    pass = pass && !bad;
  }

  return { pass, reasons, summary, action: data.action, success: data.success };
}

async function main() {
  console.log(`e2e-bug.201 QA → ${API}/public/${SLUG}/assistant\n`);
  let token = null;
  try {
    token = await mintClinicCustomerToken();
    console.log('auth: clinic customer JWT minted\n');
  } catch (err) {
    console.log(`auth: skip signed-in cases (${err.message})\n`);
  }

  let failed = 0;
  let ran = 0;
  for (const c of CASES) {
    if (!c.anon && !token) {
      console.log(`SKIP ${c.id} — no auth token`);
      continue;
    }
    ran += 1;
    let data;
    try {
      data = await assistant(c.prompt, c.anon ? null : token);
    } catch (err) {
      console.log(`FAIL ${c.id} — fetch error: ${err.message}`);
      failed += 1;
      continue;
    }
    const result = passCase(c, data);
    if (result.pass) {
      console.log(
        `PASS ${c.id} action=${result.action} success=${result.success}`,
      );
    } else {
      failed += 1;
      console.log(
        `FAIL ${c.id} action=${result.action} success=${result.success}`,
      );
      console.log(`  prompt: ${c.prompt}`);
      console.log(`  reasons: ${result.reasons.join('; ')}`);
      console.log(`  summary: ${result.summary.slice(0, 240)}`);
    }
  }
  console.log(`\n${ran - failed}/${ran} passed`);
  process.exit(failed ? 1 : 0);
}

main();
