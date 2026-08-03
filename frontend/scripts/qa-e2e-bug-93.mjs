/**
 * Manual live QA for e2e-bug.93 — named provider availability / profile must
 * keep the employee name (specialty & reviews already OK).
 *
 * Run: node scripts/qa-e2e-bug-93.mjs
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
    id: 'e2e93-live-karo-specialty',
    prompt: "What is Karo Mazmanyan's specialty?",
    expectAction: 'explain_provider_specialty',
    expectNameInSummary: /Karo/i,
  },
  {
    id: 'e2e93-live-jujo-reviews',
    prompt: 'Show reviews for Jujo Karapetyan',
    expectAction: 'list_provider_reviews',
    expectNameInSummary: /Jujo/i,
  },
  {
    id: 'e2e93-live-karo-free-face-plasma',
    prompt: 'Is Karo Mazmanyan free tomorrow for Face Plasma?',
    forbidAction: 'check_providers_for_service',
    forbidSummary: /Specify which service|Nothing under \$0/i,
    expectNameKept: /Karo/i,
  },
  {
    id: 'e2e93-live-jujo-available',
    prompt: 'When is Jujo Karapetyan available?',
    forbidAction: 'check_providers_for_service',
    forbidSummary: /Specify which service/i,
    expectNameKept: /Jujo/i,
  },
  {
    id: 'e2e93-live-swedish-with-gevorg',
    prompt: 'check availability for Swedish massage with Gevorg tomorrow',
    forbidAction: 'check_providers_for_service',
    forbidSummary: /Specify which service/i,
    expectNameKept: /Gevorg/i,
  },
  {
    id: 'e2e93-live-gevorg-full-morning',
    prompt:
      'Is Gevorg Gasparyan available for Swedish massage tomorrow morning?',
    forbidAction: 'check_providers_for_service',
    forbidSummary: /Specify which service/i,
    expectNameKept: /Gevorg/i,
  },
  {
    id: 'e2e93-live-open-karo-profile',
    prompt: 'Open Karo Mazmanyan profile',
    expectAction: 'explain_professional_profile',
    forbidSummary: /Ask to show a stylist profile|Which stylist profile/i,
    expectNameInSummary: /Karo/i,
  },
  {
    id: 'e2e93-live-open-gevorg-professional-profile',
    prompt: "Open Gevorg's professional profile",
    expectAction: 'explain_professional_profile',
    forbidSummary: /Ask to show a stylist profile|Which stylist profile/i,
    expectNameInSummary: /Gevorg/i,
  },
  {
    id: 'e2e93-live-tell-mariam-profile',
    prompt: "tell me about Mariam's profile and experience",
    expectAction: 'explain_professional_profile',
    expectNameInSummary: /Mariam/i,
  },
  {
    id: 'e2e93-live-mariam-available',
    prompt: 'Is Mariam Ohanyan available tomorrow?',
    forbidAction: 'check_providers_for_service',
    forbidSummary:
      /Specify which service|couldn't find "Is Mariam|I couldn't find "Is Mariam/i,
    expectNameKept: /Mariam/i,
  },
  {
    id: 'e2e93-live-mariam-week',
    prompt: 'When is Mariam available this week?',
    forbidAction: 'check_providers_for_service',
    forbidSummary: /Specify which service/i,
    expectNameKept: /Mariam/i,
  },
  {
    id: 'e2e93-live-open-jujo-profile',
    prompt: 'Open Jujo Karapetyan profile',
    expectAction: 'explain_professional_profile',
    forbidSummary: /Ask to show a stylist profile/i,
    expectNameInSummary: /Jujo/i,
  },
  {
    id: 'e2e93-live-whats-karo-availability',
    prompt: "What's Karo Mazmanyan's availability this week?",
    forbidAction: 'check_providers_for_service',
    forbidSummary: /Specify which service/i,
    expectNameKept: /Karo/i,
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
  return request('POST', `/public/${SLUG}/assistant`, {
    body: {
      prompt,
      assistantMode: 'act',
      locale: 'en',
      context: { slug: SLUG },
    },
  });
}

function blobFrom(d) {
  const parts = [
    d?.summary,
    d?.details?.employeeName,
    d?.details?.providerName,
    d?.sessionContext?.employeeName,
    ...(d?.details?.availableProviders || []),
    d?.details?.checkProvidersHandoff?.summary,
    ...(d?.details?.checkProvidersHandoff?.availableProviders || []),
    d?.navigate?.query?.employeeName,
    d?.details?.provider?.name,
    d?.details?.navigate?.query?.employeeName,
  ];
  return parts.filter(Boolean).join('\n');
}

async function main() {
  loadEnv();
  console.log(`e2e-bug.93 QA → ${API} ${SLUG}`);
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
    const blob = blobFrom(d);
    if (res.status >= 500) {
      fail(c.id, `HTTP ${res.status}`);
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
    if (c.forbidSummary && c.forbidSummary.test(summary)) {
      fail(c.id, `forbidden summary: ${summary.slice(0, 120)}`);
      continue;
    }
    if (c.expectNameInSummary && !c.expectNameInSummary.test(summary)) {
      fail(c.id, `name missing from summary: ${summary.slice(0, 120)}`);
      continue;
    }
    if (c.expectNameKept && !c.expectNameKept.test(blob)) {
      fail(
        c.id,
        `name dropped from response blob: action=${d?.action} summary=${summary.slice(0, 100)}`,
      );
      continue;
    }
    pass(c.id, `action=${d?.action} success=${d?.success}`);
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
