/**
 * Guru live QA for e2e-bug.300 — public "+1" / "-1" must become
 * give_ai_feedback up/down (not unknown).
 *
 * Run: node frontend/scripts/qa-e2e-bug-300.mjs
 * Requires: API on :3001
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
    id: 'live-plus-one',
    prompt: '+1',
    expectRating: 'up',
    expectClientAction: 'submitAssistantFeedback',
    forbidUnknown: true,
  },
  {
    id: 'live-minus-one',
    prompt: '-1',
    expectRating: 'down',
    expectShowReasonChips: true,
    expectClientAction: 'openAssistantFeedback',
    forbidUnknown: true,
  },
  {
    id: 'live-plus-one-space',
    prompt: '+ 1',
    expectRating: 'up',
    expectClientAction: 'submitAssistantFeedback',
    forbidUnknown: true,
  },
  {
    id: 'live-minus-one-space',
    prompt: '- 1',
    expectRating: 'down',
    expectShowReasonChips: true,
    expectClientAction: 'openAssistantFeedback',
    forbidUnknown: true,
  },
  {
    id: 'live-plus-one-bang',
    prompt: '+1!',
    expectRating: 'up',
    expectClientAction: 'submitAssistantFeedback',
    forbidUnknown: true,
  },
  {
    id: 'live-minus-one-period',
    prompt: '-1.',
    expectRating: 'down',
    expectShowReasonChips: true,
    expectClientAction: 'openAssistantFeedback',
    forbidUnknown: true,
  },
  {
    id: 'live-plus-one-words',
    prompt: 'plus one',
    expectRating: 'up',
    expectClientAction: 'submitAssistantFeedback',
    forbidUnknown: true,
  },
  {
    id: 'live-minus-one-words',
    prompt: 'minus one',
    expectRating: 'down',
    expectShowReasonChips: true,
    expectClientAction: 'openAssistantFeedback',
    forbidUnknown: true,
  },
  {
    id: 'live-plus-1-words',
    prompt: 'plus 1',
    expectRating: 'up',
    expectClientAction: 'submitAssistantFeedback',
    forbidUnknown: true,
  },
  {
    id: 'live-minus-1-words',
    prompt: 'minus 1',
    expectRating: 'down',
    expectShowReasonChips: true,
    expectClientAction: 'openAssistantFeedback',
    forbidUnknown: true,
  },
  // locale: labels already localized (e2e-299); rating must still parse
  {
    id: 'live-hy-plus-one',
    prompt: '+1',
    locale: 'hy',
    expectRating: 'up',
    expectClientAction: 'submitAssistantFeedback',
    forbidUnknown: true,
    expectLocalizedUp: 'Օգտակար',
  },
  {
    id: 'live-ru-minus-one',
    prompt: '-1',
    locale: 'ru',
    expectRating: 'down',
    expectShowReasonChips: true,
    expectClientAction: 'openAssistantFeedback',
    forbidUnknown: true,
    expectLocalizedDown: 'Не полезно',
  },
  // controls
  {
    id: 'ctrl-thumbs-up',
    prompt: 'Thumbs up',
    expectRating: 'up',
    expectClientAction: 'submitAssistantFeedback',
    forbidUnknown: true,
  },
  {
    id: 'ctrl-helpful',
    prompt: 'Helpful',
    expectRating: 'up',
    expectClientAction: 'submitAssistantFeedback',
    forbidUnknown: true,
  },
  // negatives — must NOT become give_ai_feedback
  {
    id: 'neg-party-plus-one',
    prompt: 'party of +1',
    forbidFeedback: true,
  },
  {
    id: 'neg-book-plus-one',
    prompt: 'Book +1 massage tomorrow',
    forbidFeedback: true,
  },
  {
    id: 'neg-one-plus-one',
    prompt: '1+1',
    forbidFeedback: true,
  },
  {
    id: 'neg-plus-ten',
    prompt: '+10',
    forbidFeedback: true,
  },
  {
    id: 'neg-minus-ten',
    prompt: '-10',
    forbidFeedback: true,
  },
  {
    id: 'neg-add-guest',
    prompt: 'add +1 guest',
    forbidFeedback: true,
  },
];

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
    errors.push(
      `feedbackRating=${details.feedbackRating} (want ${c.expectRating})`,
    );
  }
  if (c.expectClientAction && details.clientAction !== c.expectClientAction) {
    errors.push(
      `clientAction=${details.clientAction} (want ${c.expectClientAction})`,
    );
  }
  if (c.expectShowReasonChips && details.showReasonChips !== true) {
    errors.push(`showReasonChips missing`);
  }
  if (
    c.expectLocalizedUp &&
    details.feedbackUpLabel !== c.expectLocalizedUp
  ) {
    errors.push(`feedbackUpLabel=${JSON.stringify(details.feedbackUpLabel)}`);
  }
  if (
    c.expectLocalizedDown &&
    details.feedbackDownLabel !== c.expectLocalizedDown
  ) {
    errors.push(
      `feedbackDownLabel=${JSON.stringify(details.feedbackDownLabel)}`,
    );
  }
  return errors;
}

async function main() {
  loadEnv();
  let passed = 0;
  const failures = [];

  for (const c of CASES) {
    const res = await request('POST', `/public/${SLUG}/assistant`, {
      prompt: c.prompt,
      assistantMode: 'act',
      locale: c.locale || 'en',
      context: {},
    });
    const body = unwrap(res.body);
    const errors = assertCase(c, body);
    if (errors.length) {
      failures.push({ id: c.id, errors, body });
      console.log(`FAIL ${c.id}`);
      for (const e of errors) console.log(`  - ${e}`);
      console.log(
        `  action=${body?.action} summary=${JSON.stringify(body?.summary)}`,
      );
    } else {
      passed += 1;
      console.log(`PASS ${c.id}`);
    }
  }

  console.log(`\n${passed}/${CASES.length} passed`);
  if (failures.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
