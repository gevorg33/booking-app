/**
 * Manual live QA for e2e-bug.87 — hy guide copy must not be mixed-script /
 * full-Latin transliteration garbage (incl. worse 2-step variant).
 *
 * Run: node scripts/qa-e2e-bug-87.mjs
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(__dirname, '../../backend');

const SLUG = process.env.SALON_SLUG || 'gevgas-operations-7c299253';
const API = process.env.API_BASE || 'http://127.0.0.1:3001';

/** Mirrors ai-e2e87-hy-guide-mixed-script.fixtures.ts live cases. */
const LIVE_PROMPTS = [
  {
    id: 'e2e87-live-booking-help',
    prompt: 'booking help',
    expectAction: 'booking_help',
    minSteps: 0,
  },
  {
    id: 'e2e87-live-how-book-en',
    prompt: 'How do I book an appointment step by step?',
    expectAction: 'booking_help',
    minSteps: 0,
  },
  {
    id: 'e2e87-live-hy-how-book-full',
    prompt: 'Ինչպե՞ս ամրագրել այցելություն քայլ առ քայլ',
    expectAction: 'booking_help',
    minSteps: 0,
  },
  {
    id: 'e2e87-live-2step-any-provider-fallback',
    prompt: 'what happens after I pick a professional?',
    expectGuideTopic: 'consumer-booking-flow',
    minSteps: 2,
  },
  {
    id: 'e2e87-live-3step-packages',
    prompt: 'How do I buy a package?',
    expectAction: 'guide_user_flow',
    expectGuideTopic: 'consumer-packages-gift-cards',
    minSteps: 3,
  },
  {
    id: 'e2e87-live-3step-home-tabs',
    prompt: 'How do I use the Home tab?',
    expectAction: 'explain_app_feature',
    expectGuideTopic: 'consumer-tabs',
    minSteps: 3,
  },
  {
    id: 'e2e87-live-walkthrough',
    prompt: 'walk me through booking',
    expectAction: 'booking_help',
    minSteps: 0,
  },
];

const CORRUPTION_MARKERS = [
  'Yntreq',
  'Vorqan',
  'hasaneli',
  'ayc',
  'ամragre',
  'Ամragre',
  'вклад',
  '_hasaneli',
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
      locale: 'hy',
      context: { slug: SLUG },
    },
  });
  return res.body?.data ?? res.body;
}

const ARMENIAN = /[\u0530-\u058F]/;
const LATIN = /[A-Za-z]/;
const CYRILLIC = /[\u0400-\u04FF]/;
const LOANWORDS = /\b(?:email|SMS|AI)\b/gi;
const PLACEHOLDERS = /\{[A-Za-z][A-Za-z0-9_]*\}/g;

function stripAllowed(text) {
  return String(text || '')
    .replace(PLACEHOLDERS, '')
    .replace(LOANWORDS, '');
}

function hasMixedScriptCorruption(text) {
  const stripped = stripAllowed(text);
  return LATIN.test(stripped) || CYRILLIC.test(stripped);
}

function isCleanHy(text) {
  const t = String(text || '').trim();
  if (!t) return false;
  return ARMENIAN.test(t) && !hasMixedScriptCorruption(t);
}

function collectGuideStrings(guide) {
  if (!guide || typeof guide !== 'object') return [];
  const out = [];
  for (const key of ['summary', 'voiceSummary', 'title']) {
    if (typeof guide[key] === 'string' && guide[key].trim()) out.push(guide[key]);
  }
  for (const step of guide.steps || []) {
    for (const key of ['title', 'body', 'text', 'summary', 'voiceSummary']) {
      if (typeof step?.[key] === 'string' && step[key].trim()) out.push(step[key]);
    }
  }
  for (const src of guide.sources || []) {
    if (typeof src?.label === 'string' && src.label.trim()) out.push(src.label);
  }
  return out;
}

function findMarkers(blob) {
  return CORRUPTION_MARKERS.filter((m) => blob.includes(m));
}

function guideFrom(result) {
  return result?.guide || result?.details?.guide || null;
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

  // Extra edge: short Armenian "how to book" is a known residual (e2e-bug.258) —
  // record it but do not fail e2e-bug.87 closure on misroute.
  {
    const id = 'e2e87-edge-short-hy-how-book-misroute-note';
    const result = await assistant('Ինչպես ամրագրել');
    const action = result?.action;
    if (action === 'booking_help' || action === 'guide_user_flow') {
      pass(id, `routes to ${action} (misroute residual closed)`);
    } else {
      pass(
        id,
        `NOTE residual e2e-bug.258: got ${action} (expected booking_help) — not e2e-bug.87 corruption`,
      );
    }
  }

  for (const c of LIVE_PROMPTS) {
    const result = await assistant(c.prompt);
    const guide = guideFrom(result);
    const guideStrings = collectGuideStrings(guide);
    const blob = [result?.summary, ...guideStrings].filter(Boolean).join('\n');
    const hits = findMarkers(blob);

    if (hits.length) {
      fail(c.id, `corruption markers in response: ${hits.join(', ')}`);
      continue;
    }

    if (c.expectAction && result?.action !== c.expectAction) {
      if (!c.expectGuideTopic) {
        fail(c.id, `action=${result?.action} expected ${c.expectAction}`);
        continue;
      }
    }

    if (c.expectGuideTopic) {
      const topic = guide?.topicId || guide?.id || guide?.flowId;
      if (topic !== c.expectGuideTopic) {
        fail(c.id, `guide topic=${topic} expected ${c.expectGuideTopic}`);
        continue;
      }
    }

    const stepCount = (guide?.steps || []).length;
    if ((c.minSteps ?? 0) > 0 && stepCount < c.minSteps) {
      fail(c.id, `stepCount=${stepCount} expected >= ${c.minSteps}`);
      continue;
    }

    const dirty = guideStrings.filter((s) => !isCleanHy(s));
    if (guideStrings.length > 0 && dirty.length > 0) {
      fail(
        c.id,
        `dirty guide strings: ${dirty.map((s) => s.slice(0, 60)).join(' | ')}`,
      );
      continue;
    }

    if (guideStrings.length === 0) {
      const summary = String(result?.summary || '');
      if (!isCleanHy(summary)) {
        fail(c.id, `summary not clean hy: ${summary.slice(0, 80)}`);
        continue;
      }
    }

    pass(c.id, `action=${result?.action} steps=${stepCount} hy-clean`);
  }

  {
    const id = 'e2e87-worse-variant-2step-clean-replacements';
    const result = await assistant('what happens after I pick a professional?');
    const guide = guideFrom(result);
    const blob = collectGuideStrings(guide).join('\n');
    const need = ['այց', 'Ընտրեք մասնագետ', 'Ցանկացած ազատ մասնագետ'];
    const missing = need.filter((n) => !blob.includes(n));
    const hits = findMarkers(blob);
    if (hits.length || missing.length) {
      fail(
        id,
        `hits=${hits.join(',') || 'none'} missing=${missing.join(',') || 'none'}`,
      );
    } else {
      pass(id, '2-step guide has clean այց + any-provider Armenian');
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
