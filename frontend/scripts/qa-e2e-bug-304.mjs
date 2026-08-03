/**
 * Guru live QA for e2e-bug.304 — mid-step compound clarify must keep prior
 * validated plans (compoundResumePlans) and surface action=compound_intent.
 * Follow-up with Start time + resume context must continue the compound.
 *
 * Run: node frontend/scripts/qa-e2e-bug-304.mjs
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

const COMPOUND_PROMPT =
  "Move Gevorg's appointment to Friday; then book a second massage for Anna";

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
            resolvePromise({ status: res.statusCode, body: JSON.parse(raw || '{}') });
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

function resumeContextFromClarify(d) {
  return {
    compoundResumePlans: d.details?.compoundResumePlans,
    compoundResumeSubIntents: d.details?.compoundResumeSubIntents,
    compoundStepIndex: d.details?.compoundStepIndex,
    compoundActions: d.details?.compoundActions,
    compoundConfirmationPrompt:
      d.details?.confirmationPrompt ||
      d.details?.compoundConfirmationPrompt ||
      COMPOUND_PROMPT,
  };
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

  console.log(`e2e-bug.304 QA → ${API} ${SLUG}`);
  let passed = 0;
  const total = 6;

  // 1) Mid-step clarify keeps resume plans
  {
    const id = 'live-clarify-keeps-resume-plans';
    const res = await request('POST', `/businesses/${biz.id}/ai/command`, {
      token,
      body: { prompt: COMPOUND_PROMPT, context: { confirmed: true } },
    });
    const d = unwrap(res.body);
    const errors = [];
    if (d.action !== 'compound_intent') {
      errors.push(`action=${d.action} (want compound_intent)`);
    }
    if (!Array.isArray(d.details?.compoundActions) || d.details.compoundActions.length < 2) {
      errors.push('missing compoundActions');
    }
    if (!Array.isArray(d.details?.compoundResumePlans)) {
      errors.push('missing compoundResumePlans array');
    }
    if (!Array.isArray(d.details?.compoundResumeSubIntents) || d.details.compoundResumeSubIntents.length < 2) {
      errors.push('missing compoundResumeSubIntents');
    }
    if (
      !/queued from earlier steps|continuing compound/i.test(
        String(d.summary || ''),
      )
    ) {
      errors.push('summary missing compound resume cue');
    }
    if (d.details?.compoundStep !== 'create_booking') {
      errors.push(`compoundStep=${d.details?.compoundStep}`);
    }
    if (errors.length) {
      console.log(`FAIL ${id}`);
      for (const e of errors) console.log(`  - ${e}`);
      console.log(
        `  action=${d.action} summary=${JSON.stringify(String(d.summary || '').slice(0, 160))}`,
      );
    } else {
      passed += 1;
      console.log(`PASS ${id}`);
    }

    // 2) Follow-up with resume + start time continues compound (not lone create)
    {
      const id2 = 'live-followup-resume-continues';
      const ctx = resumeContextFromClarify(d);
      const res2 = await request('POST', `/businesses/${biz.id}/ai/command`, {
        token,
        body: {
          prompt: 'Start time: 10:00',
          context: { confirmed: true, ...ctx },
        },
      });
      const d2 = unwrap(res2.body);
      const errors2 = [];
      // Success or still clarifying is ok; must not drop to lone create without resume
      const actions = [
        d2.action,
        ...(Array.isArray(d2.details?.compoundActions) ? d2.details.compoundActions : []),
        ...(Array.isArray(d2.details?.subIntents) ? d2.details.subIntents : []),
      ].filter(Boolean);
      const hasRescheduleEvidence =
        actions.includes('reschedule_booking') ||
        actions.includes('compound_intent') ||
        /reschedule|moved|queued/i.test(String(d2.summary || '')) ||
        (Array.isArray(d2.details?.plan?.steps) &&
          d2.details.plan.steps.some(
            (s) => s.action === 'reschedule_booking',
          )) ||
        (Array.isArray(d2.details?.executionTimeline) &&
          d2.details.executionTimeline.some((s) =>
            /reschedule/i.test(String(s.description || s.action || '')),
          ));
      if (d2.action === 'create_booking' && !hasRescheduleEvidence) {
        errors2.push('follow-up collapsed to lone create_booking (resume lost)');
      }
      if (
        d2.details?.needsClarification &&
        !Array.isArray(d2.details?.compoundResumePlans) &&
        !hasRescheduleEvidence
      ) {
        errors2.push('still clarifying without resume plans');
      }
      if (errors2.length) {
        console.log(`FAIL ${id2}`);
        for (const e of errors2) console.log(`  - ${e}`);
        console.log(
          `  action=${d2.action} summary=${JSON.stringify(String(d2.summary || '').slice(0, 160))} keys=${Object.keys(d2.details || {}).join(',')}`,
        );
      } else {
        passed += 1;
        console.log(`PASS ${id2}`);
      }
    }
  }

  // 3) Alternate phrasing
  {
    const id = 'live-reschedule-then-book-facial';
    const res = await request('POST', `/businesses/${biz.id}/ai/command`, {
      token,
      body: {
        prompt: 'Reschedule Sam to Monday; then book a facial for Maria',
        context: { confirmed: true },
      },
    });
    const d = unwrap(res.body);
    const errors = [];
      if (
        Array.isArray(d.details?.compoundActions) &&
        d.details.compoundActions.includes('create_booking') &&
        d.details.compoundStepIndex > 0
      ) {
        if (d.action !== 'compound_intent') errors.push(`action=${d.action}`);
        if (!Array.isArray(d.details?.compoundResumeSubIntents)) {
          errors.push('missing resume subIntents on mid-step');
        }
      } else if (d.action === 'compound_intent' || d.success) {
        // fully planned without clarify — ok
      } else if (d.details?.needsClarification && d.details?.compoundStepIndex === 0) {
        // clarifying first step — no prior plans expected
      } else {
        errors.push('unexpected shape');
      }
    if (errors.length) {
      console.log(`FAIL ${id}`);
      for (const e of errors) console.log(`  - ${e}`);
      console.log(
        `  action=${d.action} step=${d.details?.compoundStepIndex} resume=${d.details?.compoundResumePlans?.length}`,
      );
    } else {
      passed += 1;
      console.log(`PASS ${id}`);
    }
  }

  // 4) Control — lone create has no resume
  {
    const id = 'ctrl-lone-create-no-resume';
    const res = await request('POST', `/businesses/${biz.id}/ai/command`, {
      token,
      body: {
        prompt: 'Book a massage for Anna on Friday',
        context: { confirmed: true },
      },
    });
    const d = unwrap(res.body);
    const errors = [];
    if (d.details?.compoundResumePlans?.length) {
      errors.push('unexpected compoundResumePlans on single intent');
    }
    if (d.action === 'compound_intent' && !d.details?.decomposed) {
      errors.push('unexpected compound_intent');
    }
    if (errors.length) {
      console.log(`FAIL ${id}`);
      for (const e of errors) console.log(`  - ${e}`);
    } else {
      passed += 1;
      console.log(`PASS ${id}`);
    }
  }

  // 5) Control — single reschedule nearest (no compound resume)
  {
    const id = 'ctrl-single-reschedule-nearest';
    const res = await request('POST', `/businesses/${biz.id}/ai/command`, {
      token,
      body: {
        prompt:
          "Move Gevorg's appointment on June 1; put it June 2 nearest free time",
        context: { confirmed: true },
      },
    });
    const d = unwrap(res.body);
    const errors = [];
    if (d.details?.compoundResumePlans?.length) {
      errors.push('unexpected resume on single reschedule');
    }
    if (errors.length) {
      console.log(`FAIL ${id}`);
      for (const e of errors) console.log(`  - ${e}`);
    } else {
      passed += 1;
      console.log(`PASS ${id}`);
    }
  }

  // 6) Unit-shaped: no resume context → follow-up is not forced compound
  {
    const id = 'ctrl-followup-without-resume';
    const res = await request('POST', `/businesses/${biz.id}/ai/command`, {
      token,
      body: {
        prompt: 'Start time: 09:00',
        context: { confirmed: true },
      },
    });
    const d = unwrap(res.body);
    const errors = [];
    if (
      d.action === 'compound_intent' &&
      d.details?.compoundResumePlans?.length
    ) {
      errors.push('spurious compound resume without context');
    }
    if (errors.length) {
      console.log(`FAIL ${id}`);
      for (const e of errors) console.log(`  - ${e}`);
    } else {
      passed += 1;
      console.log(`PASS ${id}`);
    }
  }

  console.log(`\n${passed}/${total} passed`);
  if (passed !== total) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
