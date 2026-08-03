/**
 * Manual live QA for e2e-bug.91 — public assistant must never leak
 * orchestration internals (_capabilityHints, _entityMemoryBlock, etc.)
 * in the HTTP JSON body (network layer), even when the UI hides them.
 *
 * Run: node scripts/qa-e2e-bug-91.mjs
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
  { id: 'e2e91-how-book', prompt: 'how do I book with you?' },
  { id: 'e2e91-booking-help', prompt: 'booking help' },
  {
    id: 'e2e91-gift-shipment',
    prompt: 'Where is my physical gift card shipment?',
  },
  {
    id: 'e2e91-resume-draft',
    prompt: 'Continue where I left off with my booking',
  },
  { id: 'e2e91-guide-home-tab', prompt: 'How do I use the Home tab?' },
  { id: 'e2e91-guide-packages', prompt: 'How do I buy a package?' },
  { id: 'e2e91-list-services', prompt: 'what services do you offer?' },
  { id: 'e2e91-bare-help', prompt: 'help' },
  { id: 'e2e91-explain-app', prompt: 'explain the app to me' },
];

const LEAK_KEYS = [
  '_capabilityHints',
  '_entityMemoryBlock',
  '_entityMemoryAliases',
  '_conversationSummary',
  '_ragContextBlock',
  '_commandTraceId',
  '_accessTier',
  '_actorRole',
  '_roleProfile',
  '_membershipRole',
  '_planTierId',
  '_scopedEmployeeId',
  '_locationId',
  '_branchHint',
  '_confidenceHigh',
  '_abVariantId',
];

const BODY_MARKERS = [
  '_capabilityHints',
  '_entityMemoryBlock',
  '_entityMemoryAliases',
  '_commandTraceId',
  'FULL SYSTEM PROMPT',
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

async function assistant(prompt, locale = 'en') {
  return request('POST', `/public/${SLUG}/assistant`, {
    body: {
      prompt,
      assistantMode: 'act',
      locale,
      context: { slug: SLUG },
    },
  });
}

function collectUnderscoreKeys(obj, path = '', out = []) {
  if (!obj || typeof obj !== 'object') return out;
  for (const [k, v] of Object.entries(obj)) {
    const p = path ? `${path}.${k}` : k;
    if (k.startsWith('_') || LEAK_KEYS.includes(k)) out.push(p);
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      collectUnderscoreKeys(v, p, out);
    } else if (Array.isArray(v)) {
      v.forEach((item, i) => collectUnderscoreKeys(item, `${p}[${i}]`, out));
    }
  }
  return out;
}

function findBodyMarkers(raw) {
  return BODY_MARKERS.filter((m) => raw.includes(m));
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
    const leaks = collectUnderscoreKeys(d);
    const markers = findBodyMarkers(res.raw || '');
    if (res.status >= 500) {
      fail(c.id, `HTTP ${res.status}`);
      continue;
    }
    if (leaks.length || markers.length) {
      fail(
        c.id,
        `leaks=${leaks.join(',') || 'none'} markers=${markers.join(',') || 'none'}`,
      );
      continue;
    }
    pass(
      c.id,
      `HTTP ${res.status} action=${d?.action} sessionKeys=${Object.keys(d?.sessionContext || {}).length}`,
    );
  }

  // Edge: hy locale booking_help must also stay clean.
  {
    const id = 'e2e91-edge-hy-booking-help';
    const res = await assistant('booking help', 'hy');
    const d = res.body?.data ?? res.body;
    const leaks = collectUnderscoreKeys(d);
    const markers = findBodyMarkers(res.raw || '');
    if (leaks.length || markers.length || res.status >= 500) {
      fail(id, `leaks=${leaks} markers=${markers} status=${res.status}`);
    } else {
      pass(id, `HTTP ${res.status} action=${d?.action}`);
    }
  }

  // Edge: guide_user_flow package tour (historical leak trigger class).
  {
    const id = 'e2e91-edge-guide-user-flow-clean';
    const res = await assistant('How do I buy a package?');
    const d = res.body?.data ?? res.body;
    const leaks = collectUnderscoreKeys(d);
    if (d?.action !== 'guide_user_flow') {
      // Still pass leak check even if action drifts; note the action.
      if (leaks.length) {
        fail(id, `action=${d?.action} leaks=${leaks.join(',')}`);
      } else {
        pass(id, `action=${d?.action} (expected guide_user_flow) leak-clean`);
      }
    } else if (leaks.length) {
      fail(id, `leaks=${leaks.join(',')}`);
    } else {
      pass(id, `guide_user_flow leak-clean`);
    }
  }

  // Edge: sessionContext must not contain customer-name alias dump text.
  {
    const id = 'e2e91-edge-no-mary-alias-dump';
    const res = await assistant('how do I book with you?');
    const blob = res.raw || '';
    const dirty =
      /mary\s*→\s*customer/i.test(blob) ||
      /_entityMemoryBlock/i.test(blob) ||
      /customer=Mary/i.test(blob);
    if (dirty) {
      fail(id, 'entity memory / Mary alias dump present in body');
    } else {
      pass(id, 'no entity-memory customer alias dump');
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
