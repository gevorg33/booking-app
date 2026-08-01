/**
 * Guru live QA for e2e-bug.296 — recommend someone + tonight/this evening
 * must keep a same-day window (not "(14 days)" fallback).
 *
 * Run: node frontend/scripts/qa-e2e-bug-296.mjs
 * Requires: API on :3001
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(__dirname, '../../backend');

const SLUG = process.env.SALON_SLUG || 'gevgas-operations-7c299253';
const API = process.env.API_BASE || 'http://127.0.0.1:3001';

const PERIOD_14 = /\(14 days\)/i;
const SAME_DAY = /\(\d{2}\/\d{2}\/\d{4}\)/;
/** Soft residual: evening/tonight summaries listing only afternoon slots (<17:00). */
const SLOT_TIMES = /(\d{2}):(\d{2})(?:,|\s|$)/g;

const CASES = [
  {
    id: 'live-recommend-someone-this-evening',
    prompt: 'recommend someone for massage this evening',
    expectAction: 'recommend_specialists',
    forbidPeriod14: true,
    requireSameDayPeriod: true,
    noteAfternoonResidual: true,
  },
  {
    id: 'live-recommend-someone-tonight',
    prompt: 'recommend someone for massage tonight',
    expectAction: 'recommend_specialists',
    forbidPeriod14: true,
    requireSameDayPeriod: true,
    noteAfternoonResidual: true,
  },
  {
    id: 'live-suggest-someone-this-evening',
    prompt: 'suggest someone for a massage this evening',
    expectAction: 'recommend_specialists',
    forbidPeriod14: true,
    requireSameDayPeriod: true,
    noteAfternoonResidual: true,
  },
  {
    id: 'live-recommend-someone-this-morning',
    prompt: 'recommend someone for massage this morning',
    expectAction: 'recommend_specialists',
    forbidPeriod14: true,
    requireSameDayPeriod: true,
  },
  {
    id: 'live-recommend-someone-this-afternoon',
    prompt: 'recommend someone for massage this afternoon',
    expectAction: 'recommend_specialists',
    forbidPeriod14: true,
    requireSameDayPeriod: true,
  },
  {
    id: 'live-who-recommend-this-evening',
    prompt: 'Who do you recommend for a massage this evening?',
    expectAction: 'recommend_specialists',
    forbidPeriod14: true,
    requireSameDayPeriod: true,
    noteAfternoonResidual: true,
  },
  {
    id: 'live-who-is-best-tonight',
    prompt: 'Who is best for massage tonight?',
    expectAction: 'recommend_specialists',
    forbidPeriod14: true,
    requireSameDayPeriod: true,
    noteAfternoonResidual: true,
  },
  {
    id: 'live-best-rated-this-evening',
    prompt: 'best rated specialists for massage this evening',
    expectAction: 'recommend_specialists',
    forbidPeriod14: true,
    requireSameDayPeriod: true,
    noteAfternoonResidual: true,
  },
  {
    id: 'live-recommend-someone-later-today',
    prompt: 'recommend someone for massage later today',
    expectAction: 'recommend_specialists',
    forbidPeriod14: true,
    // success may fail service scrub ("massage later") — still must not 14-day
    requireSameDayPeriod: false,
  },
  {
    id: 'live-can-you-recommend-someone-tonight',
    prompt: 'Can you recommend someone for a massage tonight?',
    expectAction: 'recommend_specialists',
    forbidPeriod14: true,
    requireSameDayPeriod: true,
  },
  {
    id: 'live-please-suggest-someone-this-evening',
    prompt: 'Please suggest someone for massage this evening',
    expectAction: 'recommend_specialists',
    forbidPeriod14: true,
    requireSameDayPeriod: true,
  },
  // Controls — multi-day windows still OK
  {
    id: 'ctrl-best-rated-this-week',
    prompt: 'best rated specialists for massage this week',
    expectAction: 'recommend_specialists',
    forbidPeriod14: false,
    allowPeriod14OrRange: true,
  },
  {
    id: 'ctrl-who-recommend-bare',
    prompt: 'Who do you recommend for a massage?',
    expectAction: 'recommend_specialists',
    // bare recommend may still use default scan — OK if not stealing day-part
  },
  {
    id: 'ctrl-who-available-this-week',
    prompt: 'Who is available for massage this week?',
    forbidActions: ['recommend_specialists'],
  },
  {
    id: 'ctrl-evening-slots-open',
    prompt: 'Evening slots for massage',
    // may be check_availability / find_evening_weekend_slots / recommend
    forbidActions: [],
  },
  {
    id: 'ctrl-open-evening-no-this',
    prompt: 'Evening specialists for massage',
    // open evening without this/tonight may route to availability — not a 296 fail
    forbidPeriod14: false,
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

function request(method, path, body) {
  return new Promise((resolvePromise, reject) => {
    const data = body != null ? JSON.stringify(body) : null;
    const url = new URL(path, API);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port || 3001,
        path: url.pathname + url.search,
        method,
        headers: data
          ? {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(data),
            }
          : {},
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

function collectSlotHours(summary) {
  const hours = [];
  SLOT_TIMES.lastIndex = 0;
  let m;
  while ((m = SLOT_TIMES.exec(summary)) !== null) {
    hours.push(Number(m[1]));
  }
  return hours;
}

async function main() {
  loadEnv();
  console.log(`e2e-bug.296 live QA → ${API} slug=${SLUG}`);

  const health = await request('GET', `/public/${SLUG}`).catch((e) => ({
    error: e,
  }));
  if (health.error || (health.status && health.status >= 500)) {
    console.error('API not reachable on', API, health.error || health.status);
    process.exit(1);
  }

  let pass = 0;
  let fail = 0;
  const failures = [];
  const residuals = [];

  for (const c of CASES) {
    const res = await request('POST', `/public/${SLUG}/assistant`, {
      prompt: c.prompt,
      assistantMode: 'act',
      locale: 'en',
      context: { slug: SLUG },
    });
    const data = unwrap(res.body);
    const action = data?.action ?? null;
    const summary = String(data?.summary ?? '');
    const problems = [];

    if (res.status < 200 || res.status >= 300) {
      problems.push(`HTTP ${res.status}`);
    }
    if (c.expectAction && action !== c.expectAction) {
      problems.push(`action=${action} want=${c.expectAction}`);
    }
    if (c.forbidActions?.includes(action)) {
      problems.push(`forbidden action ${action}`);
    }
    if (c.forbidPeriod14 && PERIOD_14.test(summary)) {
      problems.push(`14-day period label: ${summary.slice(0, 120)}`);
    }
    if (c.requireSameDayPeriod && !SAME_DAY.test(summary) && data?.success) {
      // success:false (no service) is OK without period; success:true needs day
      problems.push(`missing same-day period: ${summary.slice(0, 120)}`);
    }

    if (
      c.noteAfternoonResidual &&
      problems.length === 0 &&
      data?.success &&
      SAME_DAY.test(summary)
    ) {
      const hours = collectSlotHours(summary);
      if (hours.length > 0 && hours.every((h) => h < 17)) {
        residuals.push({
          id: c.id,
          note: `evening/tonight success lists only afternoon slots (<17:00): ${hours.join(',')}`,
          summary: summary.slice(0, 160),
        });
      }
    }

    if (problems.length === 0) {
      pass += 1;
      console.log(`PASS ${c.id} → ${action} | ${summary.slice(0, 100)}`);
    } else {
      fail += 1;
      failures.push({ id: c.id, problems, action, summary });
      console.log(`FAIL ${c.id} → ${action} | ${problems.join('; ')}`);
      console.log(`     summary: ${summary.slice(0, 180)}`);
    }
  }

  console.log(`\nResult: ${pass}/${CASES.length} passed, ${fail} failed`);
  if (residuals.length > 0) {
    console.log(`\nSoft residuals (not failing 296): ${residuals.length}`);
    for (const r of residuals) {
      console.log(`- ${r.id}: ${r.note}`);
    }
  }
  if (fail > 0) {
    for (const f of failures) {
      console.log(`- ${f.id}: ${f.problems.join('; ')}`);
    }
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
