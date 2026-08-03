/**
 * Guru live QA for e2e-bug.326 — public "+1 thanks" / "thanks +1" wrapper
 * phrasing (and fullwidth ＋1/－1) must become give_ai_feedback up/down.
 *
 * Run: node frontend/scripts/qa-e2e-bug-326.mjs
 * Requires: API on :3001
 */
import http from 'http';

const SLUG = process.env.SALON_SLUG || 'gevgas-operations-7c299253';
const API = process.env.API_BASE || 'http://127.0.0.1:3001';

const CASES = [
  { id: 'plus-one-thanks-suffix', prompt: '+1 thanks', expectRating: 'up', forbidUnknown: true },
  { id: 'thanks-plus-one-prefix', prompt: 'thanks +1', expectRating: 'up', forbidUnknown: true },
  { id: 'minus-one-thanks-suffix', prompt: '-1 thanks', expectRating: 'down', expectShowReasonChips: true, forbidUnknown: true },
  { id: 'thanks-minus-one-prefix', prompt: 'thanks -1', expectRating: 'down', expectShowReasonChips: true, forbidUnknown: true },
  { id: 'plus-one-thx-bang', prompt: '+1 thx!', expectRating: 'up', forbidUnknown: true },
  { id: 'ty-plus-one-comma', prompt: 'ty, +1', expectRating: 'up', forbidUnknown: true },
  { id: 'thanks-plus-one-word', prompt: 'thanks plus one', expectRating: 'up', forbidUnknown: true },
  { id: 'plus-one-fullwidth', prompt: '＋1', expectRating: 'up', forbidUnknown: true },
  { id: 'minus-one-fullwidth', prompt: '－1', expectRating: 'down', expectShowReasonChips: true, forbidUnknown: true },
  { id: 'plus-one-fullwidth-thanks', prompt: '＋1 thanks', expectRating: 'up', forbidUnknown: true },
  // negatives — must NOT become give_ai_feedback even with a wrapper word present
  { id: 'neg-party-plus-one', prompt: 'party of +1', forbidFeedback: true },
  { id: 'neg-book-plus-one', prompt: 'Book +1 massage tomorrow', forbidFeedback: true },
  { id: 'neg-thanks-book-plus-one', prompt: 'thanks, book +1 massage', forbidFeedback: true },
  { id: 'neg-plus-one-stars-thanks', prompt: 'thanks, +1 stars', forbidFeedback: true },
  { id: 'neg-plus-ten-thanks', prompt: '+10 thanks', forbidFeedback: true },
  // non-regression controls from e2e-bug.300
  { id: 'ctrl-bare-plus-one', prompt: '+1', expectRating: 'up', forbidUnknown: true },
  { id: 'ctrl-bare-minus-one', prompt: '-1', expectRating: 'down', expectShowReasonChips: true, forbidUnknown: true },
];

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
          ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
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

function unwrap(body) {
  return body?.data ?? body;
}

function assertCase(c, body) {
  const errors = [];
  const action = body?.action;
  const details = body?.details ?? {};

  if (c.forbidFeedback) {
    if (action === 'give_ai_feedback') {
      errors.push(`unexpected give_ai_feedback for negative control`);
    }
    return errors;
  }

  if (c.forbidUnknown && action === 'unknown') {
    errors.push(`action=unknown (want give_ai_feedback)`);
  }
  if (action !== 'give_ai_feedback') {
    errors.push(`action=${action} (want give_ai_feedback)`);
  }
  if (details.feedbackRating !== c.expectRating) {
    errors.push(`feedbackRating=${details.feedbackRating} (want ${c.expectRating})`);
  }
  if (c.expectShowReasonChips && details.showReasonChips !== true) {
    errors.push(`showReasonChips missing`);
  }
  return errors;
}

async function main() {
  let passed = 0;
  const failures = [];

  for (const c of CASES) {
    const res = await request('POST', `/public/${SLUG}/assistant`, {
      prompt: c.prompt,
      assistantMode: 'act',
      locale: 'en',
      context: {},
    });
    const body = unwrap(res.body);
    const errors = assertCase(c, body);
    if (errors.length) {
      failures.push({ id: c.id, errors, body });
      console.log(`FAIL ${c.id} ("${c.prompt}")`);
      for (const e of errors) console.log(`  - ${e}`);
      console.log(`  action=${body?.action} summary=${JSON.stringify(body?.summary)}`);
    } else {
      passed += 1;
      console.log(`PASS ${c.id} ("${c.prompt}")`);
    }
  }

  console.log(`\n${passed}/${CASES.length} passed`);
  if (failures.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
