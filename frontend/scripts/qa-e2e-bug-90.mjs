/**
 * Manual live QA for e2e-bug.90 — public discovery intents must never 500
 * with `Cannot read properties of undefined (reading 'includes')`.
 *
 * Run: node scripts/qa-e2e-bug-90.mjs
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(__dirname, '../../backend');

const SLUG = process.env.SALON_SLUG || 'gevgas-operations-7c299253';
const API = process.env.API_BASE || 'http://127.0.0.1:3001';

/** Mirrors ai-e2e90-public-assistant-intents-gate.fixtures.ts */
const CASES = [
  {
    id: 'e2e90-list-services',
    prompt: 'what services do you offer?',
    expectAction: 'list_services',
    requireSuccess: true,
  },
  {
    id: 'e2e90-list-all-services',
    prompt: 'list all services',
    expectAction: 'list_services',
    requireSuccess: true,
  },
  {
    id: 'e2e90-list-providers',
    prompt: 'who are your providers?',
    expectAction: 'list_providers',
    requireSuccess: true,
  },
  {
    id: 'e2e90-list-all-specialists',
    prompt: 'list all specialists',
    expectAction: 'list_providers',
    requireSuccess: true,
  },
  {
    id: 'e2e90-list-providers-short',
    prompt: 'list providers',
    expectAction: 'list_providers',
    requireSuccess: true,
  },
  {
    id: 'e2e90-show-team',
    prompt: 'show me your team',
    expectAction: 'list_providers',
    requireSuccess: true,
  },
  {
    id: 'e2e90-budget-50',
    prompt: 'show me services under $50',
    expectAction: 'find_services_under_budget',
    requireSuccess: true,
  },
  {
    id: 'e2e90-budget-40',
    prompt: 'services under $40',
    expectAction: 'find_services_under_budget',
    requireSuccess: true,
  },
  {
    id: 'e2e90-evening-weekend',
    prompt: 'which services have evening or weekend slots?',
    expectAction: 'find_evening_weekend_slots',
    requireSuccess: true,
  },
  {
    id: 'e2e90-promotions',
    prompt: 'any promotions right now?',
    expectAction: 'list_public_promotions',
    requireSuccess: true,
  },
  {
    id: 'e2e90-provider-reviews',
    prompt: 'What do reviews say about Gevorg?',
    expectAction: 'list_provider_reviews',
    requireSuccess: true,
  },
];

const CRASH_MARKERS = [
  "Cannot read properties of undefined (reading 'includes')",
  'Cannot read properties of undefined',
  "reading 'includes'",
  'Internal server error',
];

function loadEnv() {
  const envPath = resolve(backendRoot, '.env');
  if (!existsSync(envPath)) return {};
  const env = {};
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    const val = m[2].trim().replace(/^["']|["']$/g, '');
    env[key] = val;
    if (process.env[key] == null) process.env[key] = val;
  }
  return env;
}

function request(method, path, { body, token } = {}) {
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
          resolvePromise({ status: res.statusCode, body: parsed, raw });
        });
      },
    );
    req.on('error', reject);
    req.setTimeout(90000, () => req.destroy(new Error('timeout')));
    if (data) req.write(data);
    req.end();
  });
}

async function assistant(prompt, { locale = 'en', token } = {}) {
  const res = await request('POST', `/public/${SLUG}/assistant`, {
    token,
    body: {
      prompt,
      assistantMode: 'act',
      locale,
      context: { slug: SLUG },
    },
  });
  return res;
}

function hasCrash(status, body, raw) {
  if (status >= 500) return true;
  const blob = `${raw || ''}\n${JSON.stringify(body || {})}`;
  return CRASH_MARKERS.some((m) => blob.includes(m));
}

async function main() {
  loadEnv();
  const results = [];
  const pass = (id, detail) => {
    results.push({ id, ok: true, detail });
    console.log(`PASS  ${id}${detail ? ` — ${detail}` : ''}`);
  };
  const fail = (id, detail) => {
    results.push({ id, ok: false, detail });
    console.log(`FAIL  ${id} — ${detail}`);
  };

  for (const c of CASES) {
    const res = await assistant(c.prompt);
    const d = res.body?.data ?? res.body;
    if (hasCrash(res.status, res.body, res.raw)) {
      fail(c.id, `crash/status=${res.status} action=${d?.action}`);
      continue;
    }
    if (res.status < 200 || res.status >= 300) {
      fail(c.id, `HTTP ${res.status}`);
      continue;
    }
    if (c.expectAction && d?.action !== c.expectAction) {
      fail(c.id, `action=${d?.action} expected ${c.expectAction}`);
      continue;
    }
    if (c.requireSuccess && d?.success !== true) {
      fail(c.id, `success=${d?.success} summary=${String(d?.summary || '').slice(0, 80)}`);
      continue;
    }
    pass(c.id, `HTTP ${res.status} action=${d?.action} success=${d?.success}`);
  }

  // Edge: hy locale must also avoid the 500 (copy may differ).
  {
    const id = 'e2e90-edge-hy-list-services';
    const res = await assistant('what services do you offer?', { locale: 'hy' });
    const d = res.body?.data ?? res.body;
    if (hasCrash(res.status, res.body, res.raw) || res.status >= 500) {
      fail(id, `crash/status=${res.status}`);
    } else if (d?.action !== 'list_services') {
      fail(id, `action=${d?.action}`);
    } else {
      pass(id, `HTTP ${res.status} action=${d?.action} success=${d?.success}`);
    }
  }

  // Edge: staff-only action must deny cleanly (security_blocked), never 500.
  {
    const id = 'e2e90-edge-deny-non-public-without-500';
    const res = await assistant('run a payment sweep for today');
    const d = res.body?.data ?? res.body;
    if (hasCrash(res.status, res.body, res.raw) || res.status >= 500) {
      fail(id, `crash/status=${res.status}`);
    } else {
      pass(
        id,
        `HTTP ${res.status} action=${d?.action} (deny path no 500)`,
      );
    }
  }

  // Edge: empty-ish / nonsense must not 500 either.
  {
    const id = 'e2e90-edge-garbled-no-500';
    const res = await assistant('asdf qwerty zxcvbnm 99999');
    if (hasCrash(res.status, res.body, res.raw) || res.status >= 500) {
      fail(id, `crash/status=${res.status}`);
    } else {
      const d = res.body?.data ?? res.body;
      pass(id, `HTTP ${res.status} action=${d?.action}`);
    }
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
