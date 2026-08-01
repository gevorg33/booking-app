/**
 * Manual live QA for e2e-bug.92 — provider-related prompts must not collapse
 * into check_providers_for_service then fail with "Specify which service…".
 *
 * Run: node scripts/qa-e2e-bug-92.mjs
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
    id: 'e2e92-live-recommend',
    prompt: 'Who do you recommend for a massage?',
    expectAction: 'recommend_specialists',
  },
  {
    id: 'e2e92-live-gevorg-week',
    prompt: 'When is Gevorg available this week?',
    expectAction: 'explain_provider_availability',
  },
  {
    id: 'e2e92-live-mariam-week',
    prompt: 'When is Mariam available this week?',
    expectAction: 'explain_provider_availability',
  },
  {
    id: 'e2e92-live-reviews',
    prompt: 'What do reviews say about Gevorg?',
    expectAction: 'list_provider_reviews',
  },
  {
    id: 'e2e92-live-specialty',
    prompt: "What is Gevorg's specialty?",
    expectAction: 'explain_provider_specialty',
  },
  {
    id: 'e2e92-live-who-works',
    prompt: 'who works here?',
    expectAction: 'list_providers',
  },
  {
    id: 'e2e92-live-who-providers',
    prompt: 'who are your providers?',
    expectAction: 'list_providers',
  },
  {
    id: 'e2e92-live-book-swedish',
    prompt: 'Book a Swedish massage with Gevorg tomorrow at 11am',
    expectAction: 'book_appointment',
  },
  {
    id: 'e2e92-live-book-haircut',
    prompt: 'can I book a haircut tomorrow at 3pm?',
    expectAction: 'book_appointment',
  },
  {
    id: 'e2e92-live-any-provider-fine',
    prompt:
      "I don't care who does it, any provider works fine for the massage",
    expectAction: 'explain_any_provider_option',
  },
  {
    id: 'e2e92-live-abs-date',
    prompt: 'Is Gevorg available for Swedish massage on August 15, 2026?',
    forbidAction: 'check_providers_for_service',
    forbidSummary: 'Specify which service',
  },
  {
    id: 'e2e92-live-with-gevorg',
    prompt: 'check availability for Swedish massage with Gevorg tomorrow',
    forbidAction: 'check_providers_for_service',
    forbidSummary: 'Specify which service',
  },
  {
    id: 'e2e92-live-any-provider-swedish-tomorrow',
    prompt: 'any provider is fine for Swedish massage tomorrow',
    forbidSummary: 'Specify which service',
  },
  {
    id: 'e2e92-live-recommend-best-rated',
    prompt: 'best rated specialists for massage this week',
    expectAction: 'recommend_specialists',
  },
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

function request(method, path, { body } = {}) {
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
    req.setTimeout(90000, () => req.destroy(new Error('timeout')));
    if (data) req.write(data);
    req.end();
  });
}

async function assistant(prompt) {
  const res = await request('POST', `/public/${SLUG}/assistant`, {
    body: {
      prompt,
      assistantMode: 'act',
      locale: 'en',
      context: { slug: SLUG },
    },
  });
  return res;
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
    const summary = String(d?.summary || '');
    if (res.status >= 500) {
      fail(c.id, `HTTP ${res.status}`);
      continue;
    }
    if (c.forbidSummary && summary.includes(c.forbidSummary)) {
      fail(c.id, `summary still asks for service: ${summary.slice(0, 80)}`);
      continue;
    }
    if (c.forbidAction && d?.action === c.forbidAction) {
      fail(c.id, `action collapsed to ${c.forbidAction}`);
      continue;
    }
    if (c.expectAction && d?.action !== c.expectAction) {
      fail(c.id, `action=${d?.action} expected ${c.expectAction}`);
      continue;
    }
    pass(
      c.id,
      `action=${d?.action} success=${d?.success}`,
    );
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
