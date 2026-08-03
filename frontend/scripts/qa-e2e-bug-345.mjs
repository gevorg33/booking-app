/**
 * Guru live QA for e2e-bug.345 — public check_availability's no-slots
 * summary must use an unambiguous date label ("4 August 2026"), never DD/MM
 * slash ("04/08/2026") that an LLM can misread as US MM/DD. Sibling of
 * Fixed e2e-bug.285/306/332.
 *
 * Run: node frontend/scripts/qa-e2e-bug-345.mjs
 * Requires: API on :3001, business slug gevgas-operations-7c299253.
 */
import http from 'http';

const API = process.env.API_BASE || 'http://127.0.0.1:3001';
const SLUG = 'gevgas-operations-7c299253';
const SLASH_DATE_RE = /\b\d{2}\/\d{2}\/\d{4}\b/;

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
  return {
    action: data?.action,
    success: data?.success,
    summary: String(data?.summary || ''),
  };
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
  console.log('e2e-bug.345 — public check_availability no-slots date label\n');

  // Original reported repro: "any specialist" single-day path.
  {
    const r = await assist('check availability for Swedish massage tomorrow');
    check(
      'any-specialist-no-slash-date',
      !SLASH_DATE_RE.test(r.summary) && /\d{1,2} \w+ \d{4}/.test(r.summary),
      `got: ${r.summary}`,
    );
  }
  {
    const r = await assist('what times are available for a haircut tomorrow');
    check(
      'open-times-browse-no-slash-date',
      !SLASH_DATE_RE.test(r.summary) && /\d{1,2} \w+ \d{4}/.test(r.summary),
      `got: ${r.summary}`,
    );
  }

  // Named-provider variant shares the same call site — must also be fixed.
  {
    const r = await assist('is Karo Mazmanyan free tomorrow for Swedish massage');
    check(
      'named-provider-no-slash-date',
      !SLASH_DATE_RE.test(r.summary) && r.summary.includes('Karo Mazmanyan'),
      `got: ${r.summary}`,
    );
  }

  // Regression: multi-day count path (no date at all) must be unaffected.
  {
    const r = await assist('check availability for Swedish massage this week');
    check(
      'multi-day-count-path-unaffected',
      !SLASH_DATE_RE.test(r.summary),
      `got: ${r.summary}`,
    );
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
