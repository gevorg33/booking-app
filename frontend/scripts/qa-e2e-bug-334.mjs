/**
 * Guru live QA for e2e-bug.334 — public "is anyone free…"/"is anybody
 * available…"/"is someone/somebody/everyone/everybody free…" must never be
 * stolen by explain_provider_availability's employee-name lookup
 * ("I couldn't find \"anyone\". Available specialists: …"). Indefinite
 * pronouns are never a real provider name — these must resolve to team-wide
 * availability (check_providers_for_service / check_availability).
 *
 * Run: node frontend/scripts/qa-e2e-bug-334.mjs
 * Requires: API on :3001, business slug gevgas-operations-7c299253.
 */
import http from 'http';

const API = process.env.API_BASE || 'http://127.0.0.1:3001';
const SLUG = 'gevgas-operations-7c299253';
const COULDNT_FIND_RE = /couldn't find/i;

function request(method, path, body) {
  return new Promise((resolvePromise, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 3001,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = raw;
          }
          resolvePromise({ status: res.statusCode, body: parsed });
        });
      },
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function assist(prompt) {
  const res = await request('POST', `/public/${SLUG}/assistant`, {
    prompt,
    assistantMode: 'act',
    locale: 'en',
    context: { slug: SLUG },
  });
  const data = res.body?.data ?? res.body;
  return { action: data?.action, summary: String(data?.summary || '') };
}

let pass = 0;
let fail = 0;
function check(id, condition, detail) {
  if (condition) {
    pass += 1;
    console.log(`  PASS  ${id}`);
  } else {
    fail += 1;
    console.log(`  FAIL  ${id} — ${detail}`);
  }
}

async function main() {
  console.log('e2e-bug.334 — indefinite pronouns never resolved as a provider name\n');

  // Original repro + every indefinite pronoun sibling.
  const pronounPrompts = [
    ['anyone-free', 'is anyone free tomorrow morning for Swedish massage'],
    ['anyone-available', 'is anyone available this afternoon for a haircut'],
    ['anybody-free', 'is anybody free tomorrow for Deep tissue massage'],
    ['somebody-available', 'is somebody available today for a facial'],
  ];
  for (const [id, prompt] of pronounPrompts) {
    const r = await assist(prompt);
    check(
      `${id}-no-couldnt-find-specialist`,
      !COULDNT_FIND_RE.test(r.summary) && r.action !== 'explain_provider_availability',
      `got action=${r.action} summary=${r.summary}`,
    );
  }

  // Already-correct sibling from e2e-bug.307 — must keep working.
  {
    const r = await assist('is anybody open tomorrow morning for Swedish massage');
    check(
      'anybody-open-still-correct',
      !COULDNT_FIND_RE.test(r.summary) && r.action !== 'explain_provider_availability',
      `got action=${r.action} summary=${r.summary}`,
    );
  }

  // Regression: a real named provider must still resolve correctly.
  {
    const r = await assist('is Karo Mazmanyan free tomorrow for Swedish massage');
    check(
      'named-provider-still-resolves',
      r.action === 'explain_provider_availability' &&
        r.summary.includes('Karo Mazmanyan') &&
        !COULDNT_FIND_RE.test(r.summary),
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
