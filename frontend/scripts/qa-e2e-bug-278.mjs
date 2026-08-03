/**
 * Guru live QA for e2e-bug.278 — recommend / who-is-best + day-part must
 * route to recommend_specialists (not check_providers / check_availability).
 *
 * Run: node scripts/qa-e2e-bug-278.mjs
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(__dirname, '../../backend');

const SLUG = process.env.SALON_SLUG || 'gevgas-operations-7c299253';
const API = process.env.API_BASE || 'http://127.0.0.1:3001';

const CASES = [
  {
    id: 'live-who-recommend-massage-tomorrow',
    prompt: 'Who do you recommend for a massage tomorrow?',
    expectAction: 'recommend_specialists',
    forbidGlued: ['massage tomorrow'],
    forbidActions: ['check_providers_for_service', 'check_availability'],
  },
  {
    id: 'live-who-is-best-massage-tonight',
    prompt: 'Who is best for massage tonight?',
    expectAction: 'recommend_specialists',
    forbidGlued: ['massage tonight'],
    forbidActions: ['check_providers_for_service', 'check_availability'],
  },
  {
    id: 'live-recommend-someone-massage-evening',
    prompt: 'recommend someone for massage this evening',
    expectAction: 'recommend_specialists',
    forbidGlued: ['massage this evening'],
    forbidActions: ['check_providers_for_service', 'check_availability'],
  },
  {
    id: 'live-who-is-the-best-color-tonight',
    prompt: 'Who is the best for color tonight?',
    expectAction: 'recommend_specialists',
    forbidGlued: ['color tonight'],
    forbidActions: ['check_providers_for_service', 'check_availability'],
  },
  {
    id: 'live-suggest-someone-haircut-tomorrow',
    prompt: 'suggest someone for a haircut tomorrow',
    expectAction: 'recommend_specialists',
    forbidGlued: ['haircut tomorrow'],
    forbidActions: ['check_providers_for_service', 'check_availability'],
  },
  {
    id: 'live-best-rated-specialists-this-week',
    prompt: 'best rated specialists for massage this week',
    expectAction: 'recommend_specialists',
    forbidGlued: ['massage this week'],
  },
  {
    id: 'live-who-recommend-bare-massage',
    prompt: 'Who do you recommend for a massage?',
    expectAction: 'recommend_specialists',
  },
  {
    id: 'live-recommend-specialists-haircut-next-friday',
    prompt: 'recommend specialists for haircut next Friday',
    expectAction: 'recommend_specialists',
    forbidGlued: ['haircut next friday', 'haircut next Friday'],
  },
  {
    id: 'live-control-who-available-this-week',
    prompt: 'Who is available for massage this week?',
    forbidActions: ['recommend_specialists'],
    forbidGlued: ['massage this week'],
  },
  {
    id: 'live-control-who-is-free-tonight',
    prompt: 'who is free tomorrow evening for lashes',
    forbidActions: ['recommend_specialists'],
  },
  {
    id: 'live-control-named-availability',
    prompt: 'is Gevorg available for massage tomorrow at 09:00',
    forbidActions: ['recommend_specialists'],
  },
  {
    id: 'live-control-subjective-first-time',
    prompt: "What's the best option for a first-time haircut?",
    forbidActions: ['recommend_specialists'],
    allowActions: ['booking_help', 'guide_user_flow', 'explain_app_feature'],
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

function detailsBlob(d) {
  try {
    return JSON.stringify(d.details ?? {});
  } catch {
    return '';
  }
}

async function main() {
  loadEnv();
  const results = [];

  for (const c of CASES) {
    const res = await request('POST', `/public/${SLUG}/assistant`, {
      prompt: c.prompt,
      assistantMode: 'act',
      locale: 'en',
      context: { slug: SLUG },
    });
    const d = res.body?.data ?? res.body ?? {};
    const action = d.action;
    const summary = String(d.summary || '');
    const blob = `${summary}\n${detailsBlob(d)}`.toLowerCase();

    let pass = res.status >= 200 && res.status < 300;
    if (c.expectAction) pass = pass && action === c.expectAction;
    if (c.allowActions) pass = pass && c.allowActions.includes(action);
    if (c.forbidActions?.includes(action)) pass = false;
    for (const glued of c.forbidGlued || []) {
      if (blob.includes(glued.toLowerCase())) pass = false;
    }

    results.push({
      id: c.id,
      pass,
      detail: {
        status: res.status,
        action,
        success: d.success,
        summary: summary.slice(0, 180).replace(/\n/g, ' | '),
      },
    });
  }

  let failed = 0;
  console.log(`e2e-bug.278 QA → ${API} ${SLUG}\n`);
  for (const row of results) {
    if (row.pass) {
      console.log(`PASS ${row.id}`, JSON.stringify(row.detail).slice(0, 320));
    } else {
      failed += 1;
      console.log(`FAIL ${row.id}`, JSON.stringify(row.detail).slice(0, 420));
    }
  }
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
