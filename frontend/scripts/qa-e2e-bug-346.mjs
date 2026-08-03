/**
 * Guru live QA for e2e-bug.346 — public assistant `"Tell me about this
 * booking"` (and sibling "tell me about"/"learn about" + "this/the/your
 * <noun>" phrasings) misrouted to `explain_provider_specialty`, treating the
 * captured noun phrase as a (nonsensical) provider name. Root cause:
 * `hasNamedProviderCue` (ai-explain-provider-specialty.util.ts) matched
 * "tell me about"/"learn about" for any following text, gated only by the
 * e2e-bug.191 salon/business exclusion. Fixed with a general rule: a capture
 * led by "this/the/your" is a noun reference, not a person's name, regardless
 * of which noun follows — closing the same recurring gap noted for "the wine
 * tour" (task #259) as a side effect.
 *
 * Run: node frontend/scripts/qa-e2e-bug-346.mjs
 * Requires: API on :3001, salon `gevgas-operations-7c299253`.
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(__dirname, '../../backend');
const SLUG = 'gevgas-operations-7c299253';
const API = 'http://127.0.0.1:3001';

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
    if (data) req.write(data);
    req.end();
  });
}

function unwrap(body) {
  return body?.data ?? body;
}

async function main() {
  loadEnv();

  let pass = 0;
  let fail = 0;
  const check = (id, condition, detail) => {
    if (condition) {
      pass += 1;
      console.log(`  PASS  ${id}`);
    } else {
      fail += 1;
      console.log(`  FAIL  ${id} — ${detail}`);
    }
  };

  async function ask(prompt, locale = 'en') {
    const res = await request('POST', `/public/${SLUG}/assistant`, {
      prompt,
      assistantMode: 'act',
      locale,
      context: { slug: SLUG, locale },
    });
    const data = unwrap(res.body);
    return {
      action: data?.action ?? data?.intent?.action ?? null,
      summary: String(data?.summary ?? data?.message ?? ''),
    };
  }

  // Exact reported repro.
  {
    const r = await ask('Tell me about this booking');
    check(
      'exact-repro-this-booking',
      r.action === 'confirm_my_booking_details',
      `got action=${r.action} summary=${r.summary}`,
    );
  }

  // Sibling noun (task #259's "wine tour" — same root cause, resolved as a
  // side effect of this fix).
  {
    const r = await ask('Tell me about the wine tour');
    check(
      'sibling-the-wine-tour',
      r.action !== 'explain_provider_specialty',
      `got action=${r.action} summary=${r.summary}`,
    );
  }

  // Sibling determiner ("your").
  {
    const r = await ask('Learn more about your membership');
    check(
      'sibling-your-membership',
      r.action === 'explain_my_subscription',
      `got action=${r.action} summary=${r.summary}`,
    );
  }

  // Sibling booking-container noun ("this appointment").
  {
    const r = await ask('Tell me about this appointment');
    check(
      'sibling-this-appointment',
      r.action === 'confirm_my_booking_details',
      `got action=${r.action} summary=${r.summary}`,
    );
  }

  // Regression: legit named-provider "tell me about"/"learn about" phrasing
  // must be unaffected.
  {
    const r = await ask('Tell me about Anna');
    check(
      'regression-tell-me-about-anna',
      r.action === 'explain_provider_specialty',
      `got action=${r.action} summary=${r.summary}`,
    );
  }
  {
    const r = await ask('Learn about Sophie');
    check(
      'regression-learn-about-sophie',
      r.action === 'explain_provider_specialty',
      `got action=${r.action} summary=${r.summary}`,
    );
  }

  // Regression: specialty-match phrasing (no "tell me about" cue) unaffected.
  {
    const r = await ask('Who is best for curly hair?');
    check(
      'regression-specialty-match',
      r.action === 'explain_provider_specialty',
      `got action=${r.action} summary=${r.summary}`,
    );
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
