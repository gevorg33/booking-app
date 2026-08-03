/**
 * Guru live QA for e2e-bug.299 — public give_ai_feedback chip/summary
 * labels must localize under locale:hy|ru (not stay EN).
 *
 * Run: node frontend/scripts/qa-e2e-bug-299.mjs
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

const EXPECTED = {
  en: {
    up: 'Helpful',
    down: 'Not helpful',
    thanks: 'Thanks — this helps improve the assistant.',
    skip: 'Skip',
    downSummary:
      'Not helpful — choose a reason so we can improve the assistant.',
    wrongDate: 'Wrong date',
  },
  hy: {
    up: 'Օգտակար',
    down: 'Օգտակար չէ',
    thanks: 'Շնորհակալություն — սա օգնում է բարելավել օգնականին։',
    skip: 'Բաց թողնել',
    downSummary:
      'Օգտակար չէ — ընտրեք պատճառ, որպեսզի կարողանանք բարելավել օգնականին։',
    wrongDate: 'Սխալ ամսաթիվ',
  },
  ru: {
    up: 'Полезно',
    down: 'Не полезно',
    thanks: 'Спасибо — это помогает улучшить помощника.',
    skip: 'Пропустить',
    downSummary:
      'Не полезно — выберите причину, чтобы мы могли улучшить помощника.',
    wrongDate: 'Неверная дата',
  },
};

const CASES = [
  // EN baseline
  {
    id: 'live-en-not-helpful',
    prompt: 'Not helpful',
    locale: 'en',
    expectRating: 'down',
    expectChips: true,
  },
  {
    id: 'live-en-that-was-helpful',
    prompt: 'That was helpful',
    locale: 'en',
    expectRating: 'up',
  },
  {
    id: 'live-en-wrong-date',
    prompt: 'Wrong date picked',
    locale: 'en',
    expectRating: 'down',
    expectReason: 'wrong_date',
  },
  // hy — EN prompts with hy locale (chip copy must still be hy)
  {
    id: 'live-hy-not-helpful',
    prompt: 'Not helpful',
    locale: 'hy',
    expectRating: 'down',
    expectChips: true,
    forbidEnLabels: true,
  },
  {
    id: 'live-hy-bad-answer',
    prompt: 'Bad answer',
    locale: 'hy',
    expectRating: 'down',
    expectChips: true,
    forbidEnLabels: true,
  },
  {
    id: 'live-hy-that-was-helpful',
    prompt: 'That was helpful',
    locale: 'hy',
    expectRating: 'up',
    forbidEnLabels: true,
  },
  {
    id: 'live-hy-helpful',
    prompt: 'Helpful',
    locale: 'hy',
    expectRating: 'up',
    forbidEnLabels: true,
  },
  {
    id: 'live-hy-wrong-date',
    prompt: 'Wrong date picked',
    locale: 'hy',
    expectRating: 'down',
    expectReason: 'wrong_date',
    forbidEnLabels: true,
  },
  {
    id: 'live-hy-wrong-service',
    prompt: 'Wrong service',
    locale: 'hy',
    expectRating: 'down',
    expectReason: 'wrong_service',
    forbidEnLabels: true,
  },
  {
    id: 'live-hy-native-wrong',
    prompt: 'Սխալ էր',
    locale: 'hy',
    expectRating: 'down',
    expectChips: true,
    forbidEnLabels: true,
  },
  {
    id: 'live-hy-native-wrong-date',
    prompt: 'Սխալ ամսաթիվ',
    locale: 'hy',
    expectRating: 'down',
    expectReason: 'wrong_date',
    forbidEnLabels: true,
  },
  {
    id: 'live-hy-native-helpful',
    prompt: 'Օգտակար էր',
    locale: 'hy',
    expectRating: 'up',
    forbidEnLabels: true,
  },
  // ru
  {
    id: 'live-ru-not-helpful',
    prompt: 'Not helpful',
    locale: 'ru',
    expectRating: 'down',
    expectChips: true,
    forbidEnLabels: true,
  },
  {
    id: 'live-ru-that-was-helpful',
    prompt: 'That was helpful',
    locale: 'ru',
    expectRating: 'up',
    forbidEnLabels: true,
  },
  {
    id: 'live-ru-wrong-date',
    prompt: 'Wrong date picked',
    locale: 'ru',
    expectRating: 'down',
    expectReason: 'wrong_date',
    forbidEnLabels: true,
  },
  {
    id: 'live-ru-native-not-helpful',
    prompt: 'Не полезно',
    locale: 'ru',
    expectRating: 'down',
    expectChips: true,
    forbidEnLabels: true,
  },
  {
    id: 'live-ru-native-wrong-date',
    prompt: 'Неверная дата',
    locale: 'ru',
    expectRating: 'down',
    expectReason: 'wrong_date',
    forbidEnLabels: true,
  },
  {
    id: 'live-ru-native-wrong',
    prompt: 'Это было неправильно',
    locale: 'ru',
    expectRating: 'down',
    expectChips: true,
    forbidEnLabels: true,
  },
  // Edge: thumbs chip labels
  {
    id: 'live-hy-thumbs-down',
    prompt: 'Thumbs down',
    locale: 'hy',
    expectRating: 'down',
    expectChips: true,
    forbidEnLabels: true,
  },
  {
    id: 'live-ru-thumbs-up',
    prompt: 'Thumbs up',
    locale: 'ru',
    expectRating: 'up',
    forbidEnLabels: true,
  },
  // Edge: blocked-pipeline rescue still localizes
  {
    id: 'live-hy-short-helpful',
    prompt: 'Helpful',
    locale: 'hy',
    expectRating: 'up',
    forbidEnLabels: true,
  },
  {
    id: 'live-ru-short-not-helpful',
    prompt: 'Not helpful',
    locale: 'ru',
    expectRating: 'down',
    expectChips: true,
    forbidEnLabels: true,
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

function reasonLabel(details, id) {
  const opts = details?.feedbackReasonOptions;
  if (!Array.isArray(opts)) return undefined;
  return opts.find((o) => o?.id === id)?.label;
}

function assertCase(c, body) {
  const errors = [];
  const locale = c.locale || 'en';
  const exp = EXPECTED[locale];
  const action = body?.action;
  const details = body?.details ?? {};
  const summary = String(body?.summary ?? '');

  if (action !== 'give_ai_feedback') {
    errors.push(`action=${action} (want give_ai_feedback)`);
  }
  if (details.feedbackRating !== c.expectRating) {
    errors.push(
      `feedbackRating=${details.feedbackRating} (want ${c.expectRating})`,
    );
  }
  if (details.feedbackUpLabel !== exp.up) {
    errors.push(`feedbackUpLabel=${JSON.stringify(details.feedbackUpLabel)}`);
  }
  if (details.feedbackDownLabel !== exp.down) {
    errors.push(
      `feedbackDownLabel=${JSON.stringify(details.feedbackDownLabel)}`,
    );
  }
  if (details.feedbackThanks !== exp.thanks) {
    errors.push(`feedbackThanks=${JSON.stringify(details.feedbackThanks)}`);
  }
  if (details.feedbackReasonSkipLabel !== exp.skip) {
    errors.push(
      `feedbackReasonSkipLabel=${JSON.stringify(details.feedbackReasonSkipLabel)}`,
    );
  }
  if (reasonLabel(details, 'wrong_date') !== exp.wrongDate) {
    errors.push(
      `wrong_date option=${JSON.stringify(reasonLabel(details, 'wrong_date'))}`,
    );
  }

  if (c.expectChips) {
    if (details.showReasonChips !== true) {
      errors.push(`showReasonChips missing`);
    }
    if (summary !== exp.downSummary) {
      errors.push(`summary=${JSON.stringify(summary)}`);
    }
  } else if (c.expectRating === 'up' || c.expectReason) {
    if (summary !== exp.thanks) {
      errors.push(`thanks summary=${JSON.stringify(summary)}`);
    }
  }

  if (c.expectReason && details.feedbackReason !== c.expectReason) {
    errors.push(
      `feedbackReason=${details.feedbackReason} (want ${c.expectReason})`,
    );
  }

  if (c.forbidEnLabels && locale !== 'en') {
    const hay = [
      summary,
      details.feedbackUpLabel,
      details.feedbackDownLabel,
      details.feedbackThanks,
      details.feedbackReasonSkipLabel,
      ...(Array.isArray(details.feedbackReasonOptions)
        ? details.feedbackReasonOptions.map((o) => o?.label)
        : []),
    ]
      .filter(Boolean)
      .join(' | ');
    for (const frag of [
      'Helpful',
      'Not helpful',
      'Wrong date',
      'Wrong action',
      'Skip',
      'Thanks —',
    ]) {
      if (hay.includes(frag)) {
        errors.push(`EN fragment leaked: ${frag}`);
      }
    }
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
  if (failures.length) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
