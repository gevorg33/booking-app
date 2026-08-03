/**
 * Guru live QA for e2e-bug.344 — public assistant `"is someone/everyone/
 * anybody free/available this <period> for <service>"` availability
 * questions were hijacked into `confirm_my_booking_details` instead of
 * `check_providers_for_service`. Root cause: `isConfirmMyBookingDetailsPrompt`'s
 * `BOOKING_CONTEXT` regex let bare "this" pair with a service-type noun
 * (massage/haircut/facial/service) across an intervening temporal-window
 * phrase ("this evening ... for Swedish massage"). Fixed by restricting
 * "this" to the actual booking-container nouns (booking/appointment/visit/
 * reservation) — "my"/"upcoming"/"current" keep pairing with the full noun
 * set since they don't collide with temporal phrases the same way.
 *
 * Run: node frontend/scripts/qa-e2e-bug-344.mjs
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

  const SIGN_IN_MSG = /finish booking or sign in/i;

  // Exact reported repro #1.
  {
    const r = await ask('is someone free this evening for Swedish massage');
    check(
      'exact-repro-someone-this-evening',
      r.action === 'check_providers_for_service' &&
        !SIGN_IN_MSG.test(r.summary),
      `got action=${r.action} summary=${r.summary}`,
    );
  }

  // Exact reported repro #2.
  {
    const r = await ask('is everyone available this week for a haircut');
    check(
      'exact-repro-everyone-this-week',
      r.action === 'check_providers_for_service' &&
        !SIGN_IN_MSG.test(r.summary),
      `got action=${r.action} summary=${r.summary}`,
    );
  }

  // Sibling pronoun with "this <period>".
  {
    const r = await ask('is anybody free this afternoon for a facial');
    check(
      'sibling-anybody-this-afternoon',
      r.action === 'check_providers_for_service' &&
        !SIGN_IN_MSG.test(r.summary),
      `got action=${r.action} summary=${r.summary}`,
    );
  }

  // Regression: the other 4 pronoun variants without "this <period>" already
  // worked (e2e-bug.334) — confirm still correct.
  {
    const r = await ask('is anyone free tomorrow morning for Swedish massage');
    check(
      'regression-anyone-tomorrow',
      r.action === 'check_providers_for_service',
      `got action=${r.action}`,
    );
  }

  // Regression: legit confirm_my_booking_details phrasing must be unaffected.
  // Note: two other phrasings were tried first and rejected as controls
  // because each collides with a DIFFERENT unrelated, pre-existing bug on
  // the live public assistant surface (both confirmed via git-stash
  // isolation to reproduce identically without this ticket's fix applied —
  // filed separately as e2e-bug.346):
  //   - "Tell me about this booking" -> misrouted to explain_provider_specialty
  //     (a provider-name-extraction rescue intercepts "this X").
  //   - "What time is my current appointment?" -> misrouted to
  //     explain_business_hours_and_location (both detectors match; hours/
  //     location wins the routing tie for "what time is ... appointment").
  // "Details for this appointment" avoids both collisions and correctly
  // exercises this ticket's fixture control (ai-e2e344-*.fixtures.ts).
  {
    const r = await ask('Details for this appointment');
    check(
      'regression-legit-details-this-appointment',
      r.action === 'confirm_my_booking_details',
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
