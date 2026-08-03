/**
 * Manual QA for e2e-bug.202 — book_lab_collection_nearest must not report
 * full compound success for a nonexistent named lab panel.
 *
 * Clinic: qa-test-clinic-cf58d2a9
 * FAIL if success:true with "Completed 2 customer step(s)" for unicorn panels.
 * PASS if stopped at book_lab_collection (or earlier) with couldn't-find panel.
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

const COMPLETED_2 =
  /Completed 2 customer step\(s\):\s*list my lab booking requests,\s*book lab collection/i;
const PANEL_ABORT =
  /couldn't find a lab panel or pending collection request matching/i;
const STOPPED_BOOK =
  /Stopped at step (?:1|2) \(book_lab_collection\)/i;

const CASES = [
  {
    id: 'unicorn-must-abort',
    prompt: 'Book lab draw earliest slot for unicorn-panel-xyzzy',
    expectAction: 'compound_intent',
    expectSuccess: false,
    forbidSummary: COMPLETED_2,
    requireSummary: PANEL_ABORT,
  },
  {
    id: 'nonexistent-lab-panel',
    prompt: 'Book lab draw earliest slot for nonexistent-lab-panel-xyzzy',
    expectAction: 'compound_intent',
    expectSuccess: false,
    forbidSummary: COMPLETED_2,
    requireSummary: PANEL_ABORT,
  },
  {
    id: 'unicorn-alt-phrasing',
    prompt: 'Schedule lab draw earliest slot for unicorn-panel-xyzzy',
    expectAction: 'compound_intent',
    expectSuccess: false,
    forbidSummary: COMPLETED_2,
    requireSummary: PANEL_ABORT,
  },
  {
    id: 'bogus-metabolic',
    prompt: 'Book lab draw earliest slot for fake-metabolic-xyzzy',
    expectAction: 'compound_intent',
    expectSuccess: false,
    forbidSummary: COMPLETED_2,
    requireSummary: PANEL_ABORT,
  },
  {
    id: 'control-unnamed-earliest',
    prompt: 'Book lab draw earliest slot',
    expectAction: 'compound_intent',
    // May succeed (pending requests) or stop at list (sign-in) / empty list —
    // must NOT invent unicorn-style success with a fake panel name.
    forbidSummary: /unicorn-panel/i,
  },
  {
    id: 'control-lipid-named',
    prompt: 'Book lab draw earliest slot for lipid panel',
    expectAction: 'compound_intent',
    // Abort with panel miss OR proceed if pending lipid exists — never Completed 2 with unicorn soft path
    forbidSummary: /unicorn-panel/i,
  },
  {
    id: 'control-cbc-named',
    prompt: 'Book lab draw earliest slot for CBC',
    expectAction: 'compound_intent',
    forbidSummary: /unicorn-panel/i,
  },
  {
    id: 'anon-unicorn-no-fake-success',
    prompt: 'Book lab draw earliest slot for unicorn-panel-xyzzy',
    anon: true,
    forbidSummary: COMPLETED_2,
  },
  {
    id: 'neg-list-only',
    prompt: 'What lab appointments do I need to book?',
    forbidSummary: COMPLETED_2,
    allowActions: [
      'list_my_lab_booking_requests',
      'compound_intent',
      'unknown',
    ],
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
  if (c.allowActions) {
    const ok = c.allowActions.includes(data.action);
    if (!ok) reasons.push(`action=${data.action} not allowed`);
    pass = pass && ok;
  }
  if (c.expectSuccess != null) {
    const ok = data.success === c.expectSuccess;
    if (!ok) reasons.push(`success=${data.success}`);
    pass = pass && ok;
  }
  if (c.forbidSummary) {
    const ok = !c.forbidSummary.test(summary);
    if (!ok) reasons.push('forbidSummary matched');
    pass = pass && ok;
  }
  if (c.requireSummary) {
    const ok = c.requireSummary.test(summary);
    if (!ok) reasons.push(`requireSummary missed: ${summary.slice(0, 160)}`);
    pass = pass && ok;
  }
  // Extra guard for unicorn family
  if (/unicorn|nonexistent-lab-panel|fake-metabolic/i.test(c.prompt)) {
    if (COMPLETED_2.test(summary) && data.success === true) {
      reasons.push('fake full compound success');
      pass = false;
    }
  }

  return { pass, reasons, summary, action: data.action, success: data.success };
}

async function main() {
  console.log(`e2e-bug.202 QA → ${API}/public/${SLUG}/assistant\n`);
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
      console.log(`  summary: ${result.summary.slice(0, 260)}`);
    }
  }
  console.log(`\n${ran - failed}/${ran} passed`);
  process.exit(failed ? 1 : 0);
}

main();
