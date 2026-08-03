/**
 * Guru live QA for e2e-bug.281 — public give_ai_feedback must return
 * showReasonChips / aspect / labels / feedbackReasonOptions in details.
 *
 * Run: node scripts/qa-e2e-bug-281.mjs
 */
import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(__dirname, '../../backend');
const require = createRequire(resolve(backendRoot, 'package.json'));

const SLUG = process.env.SALON_SLUG || 'gevgas-operations-7c299253';
const API = process.env.API_BASE || 'http://127.0.0.1:3001';

const LABEL_KEYS = [
  'feedbackUpLabel',
  'feedbackDownLabel',
  'feedbackThanks',
  'feedbackReasonSkipLabel',
];

const CASES = [
  {
    id: 'live-not-helpful-chips',
    prompt: 'Not helpful',
    expectRating: 'down',
    expectShowReasonChips: true,
    expectClientAction: 'openAssistantFeedback',
  },
  {
    id: 'live-bad-answer-chips',
    prompt: 'Bad answer',
    expectRating: 'down',
    expectShowReasonChips: true,
    expectClientAction: 'openAssistantFeedback',
  },
  {
    id: 'live-that-was-wrong-chips',
    prompt: 'That was wrong',
    expectRating: 'down',
    expectShowReasonChips: true,
    expectClientAction: 'openAssistantFeedback',
  },
  {
    id: 'live-that-was-helpful',
    prompt: 'That was helpful',
    expectRating: 'up',
    expectClientAction: 'submitAssistantFeedback',
    forbidShowReasonChips: true,
  },
  {
    id: 'live-helpful',
    prompt: 'Helpful',
    expectRating: 'up',
    expectClientAction: 'submitAssistantFeedback',
    forbidShowReasonChips: true,
  },
  {
    id: 'live-good-answer',
    prompt: 'Good answer',
    expectRating: 'up',
    expectClientAction: 'submitAssistantFeedback',
    forbidShowReasonChips: true,
  },
  {
    id: 'live-wrong-date-picked',
    prompt: 'Wrong date picked',
    expectRating: 'down',
    expectClientAction: 'submitAssistantFeedback',
    expectFeedbackReason: true,
    forbidShowReasonChips: true,
  },
  {
    id: 'live-wrong-service',
    prompt: 'Wrong service',
    expectRating: 'down',
    expectClientAction: 'submitAssistantFeedback',
    expectFeedbackReason: true,
    forbidShowReasonChips: true,
  },
  {
    id: 'live-wrong-person',
    prompt: 'Wrong person picked',
    expectRating: 'down',
    expectClientAction: 'submitAssistantFeedback',
    expectFeedbackReason: true,
    forbidShowReasonChips: true,
  },
  {
    id: 'live-wrong-action',
    prompt: 'Wrong action',
    expectRating: 'down',
    expectClientAction: 'submitAssistantFeedback',
    expectFeedbackReason: true,
    forbidShowReasonChips: true,
  },
  {
    id: 'live-did-not-understand',
    prompt: "You didn't understand me",
    expectRating: 'down',
    expectClientAction: 'submitAssistantFeedback',
    expectFeedbackReason: true,
    forbidShowReasonChips: true,
  },
  {
    id: 'live-ru-not-helpful',
    prompt: 'Не полезно',
    locale: 'ru',
    expectRating: 'down',
    expectShowReasonChips: true,
    expectClientAction: 'openAssistantFeedback',
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

async function main() {
  loadEnv();
  process.chdir(backendRoot);

  const {
    commandResultToPublicAssistantResult,
  } = require(resolve(
    backendRoot,
    'dist/modules/ai/customer-ai-command.util.js',
  ));
  const { buildGiveAiFeedbackDetails } = require(resolve(
    backendRoot,
    'dist/modules/ai/ai-give-ai-feedback.util.js',
  ));

  const unitDetails = buildGiveAiFeedbackDetails(
    { lastAssistantReply: 'unit seed', lastAction: 'list_services' },
    { aspect: 'rate_answer', rating: 'down' },
  );
  const unitMapped = commandResultToPublicAssistantResult({
    success: true,
    action: 'give_ai_feedback',
    summary: 'Not helpful — choose a reason',
    details: unitDetails,
  });
  const unitPass =
    unitMapped.details?.showReasonChips === true &&
    unitMapped.details?.aspect === 'rate_answer' &&
    unitMapped.details?.feedbackUpLabel === 'Helpful' &&
    Array.isArray(unitMapped.details?.feedbackReasonOptions) &&
    unitMapped.details.feedbackReasonOptions.length >= 4;
  console.log(
    `${unitPass ? 'PASS' : 'FAIL'}  unit-public-convert-keeps-chips — ${JSON.stringify(
      {
        keys: Object.keys(unitMapped.details || {}),
        showReasonChips: unitMapped.details?.showReasonChips,
        reasonOpts: unitMapped.details?.feedbackReasonOptions?.length,
      },
    )}`,
  );

  console.log(`e2e-bug.281 QA → ${API} ${SLUG}`);
  let failed = unitPass ? 0 : 1;

  const seedRes = await request('POST', `/public/${SLUG}/assistant`, {
    prompt: 'What services do you offer?',
    assistantMode: 'act',
    locale: 'en',
    context: { slug: SLUG },
  });
  const seed = unwrap(seedRes.body);
  const history = [
    { role: 'user', content: 'What services do you offer?' },
    {
      role: 'assistant',
      content: String(seed.summary || 'Here are our services.'),
    },
  ];

  for (const c of CASES) {
    const res = await request('POST', `/public/${SLUG}/assistant`, {
      prompt: c.prompt,
      assistantMode: 'act',
      locale: c.locale || 'en',
      context: {
        slug: SLUG,
        conversationHistory: history,
        lastAssistantReply: history[1].content,
        lastAction: 'list_services',
      },
    });
    const d = unwrap(res.body);
    const details = d.details || {};
    const keys = Object.keys(details);

    let pass = res.status >= 200 && res.status < 300;
    pass = pass && d.action === 'give_ai_feedback' && d.success === true;
    pass = pass && details.clientAction === c.expectClientAction;
    if (c.expectRating) pass = pass && details.feedbackRating === c.expectRating;
    if (c.expectShowReasonChips) {
      pass = pass && details.showReasonChips === true;
    }
    if (c.forbidShowReasonChips) {
      pass = pass && details.showReasonChips !== true;
    }
    if (c.expectFeedbackReason) {
      pass = pass && typeof details.feedbackReason === 'string';
    }
    pass = pass && details.aspect != null;
    pass = pass && details.assistantFeedback === true;
    for (const key of LABEL_KEYS) {
      pass = pass && typeof details[key] === 'string' && details[key].length > 0;
    }
    pass =
      pass &&
      Array.isArray(details.feedbackReasonOptions) &&
      details.feedbackReasonOptions.length >= 4;

    console.log(
      `${pass ? 'PASS' : 'FAIL'}  ${c.id} — ${JSON.stringify({
        status: res.status,
        action: d.action,
        success: d.success,
        keys,
        showReasonChips: details.showReasonChips,
        rating: details.feedbackRating,
        reason: details.feedbackReason,
        clientAction: details.clientAction,
        reasonOpts: details.feedbackReasonOptions?.length,
        up: details.feedbackUpLabel,
        down: details.feedbackDownLabel,
      })}`,
    );
    if (!pass) failed += 1;
  }

  const total = 1 + CASES.length;
  console.log(`\n${total - failed}/${total} passed`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
