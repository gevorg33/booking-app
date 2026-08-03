/**
 * Guru live QA for e2e-bug.265 — customer/public give_ai_feedback must rate
 * "Not helpful" as thumbs-down (not up via bare "helpful" cue).
 *
 * Surface: public booking assistant (shared util/handler with customer).
 * Run: node scripts/qa-e2e-bug-265.mjs
 */
import http from 'http';

const SLUG = process.env.SALON_SLUG || 'gevgas-operations-7c299253';
const API = process.env.API_BASE || 'http://127.0.0.1:3001';

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
  const results = [];

  function record(id, pass, detail) {
    results.push({ id, pass, detail });
    console.log(
      `${pass ? 'PASS' : 'FAIL'}  ${id} — ${JSON.stringify(detail).slice(0, 280)}`,
    );
  }

  async function publicAssistant(prompt, context = {}, locale = 'en') {
    const res = await request('POST', `/public/${SLUG}/assistant`, {
      body: {
        prompt,
        assistantMode: 'act',
        locale,
        context: { slug: SLUG, ...context },
      },
    });
    return { status: res.status, data: unwrap(res.body) };
  }

  const seed = await publicAssistant('What services do you offer?');
  const history = [
    { role: 'user', content: 'What services do you offer?' },
    {
      role: 'assistant',
      content: String(seed.data?.summary || 'Here are our services.'),
    },
  ];
  const feedbackCtx = {
    history,
    lastAssistantReply: history[1].content,
    lastAction: 'list_services',
  };

  console.log(`e2e-bug.265 QA → ${API}/public/${SLUG}/assistant\n`);

  // Core e2e-bug.265 + surrounding rating edges that must stay correct.
  // Public allowlist only forwards feedbackRating/feedbackReason/clientAction
  // (see PUBLIC_ASSISTANT_UI_DETAIL_KEYS) — assert those, not labels/aspect.
  const cases = [
    {
      id: 'public-not-helpful-down',
      prompt: 'Not helpful',
      rating: 'down',
      clientAction: 'openAssistantFeedback',
      summaryCue: /not helpful|choose a reason/i,
    },
    {
      id: 'public-not-helpful-lowercase',
      prompt: 'not helpful',
      rating: 'down',
      clientAction: 'openAssistantFeedback',
      summaryCue: /not helpful|choose a reason/i,
    },
    {
      id: 'public-that-was-not-helpful',
      prompt: 'That was not helpful',
      rating: 'down',
      clientAction: 'openAssistantFeedback',
      summaryCue: /not helpful|choose a reason/i,
    },
    {
      id: 'public-that-was-helpful-up',
      prompt: 'That was helpful',
      rating: 'up',
      clientAction: 'submitAssistantFeedback',
      summaryCue: /thanks/i,
    },
    {
      id: 'public-that-was-wrong-chips',
      prompt: 'That was wrong',
      rating: 'down',
      clientAction: 'openAssistantFeedback',
      summaryCue: /not helpful|choose a reason/i,
    },
    {
      id: 'public-wrong-date-reason',
      prompt: 'Wrong date picked',
      rating: 'down',
      reason: 'wrong_date',
      clientAction: 'submitAssistantFeedback',
      summaryCue: /thanks/i,
    },
    {
      id: 'public-wrong-action-reason',
      prompt: 'Wrong action',
      rating: 'down',
      reason: 'wrong_action',
      clientAction: 'submitAssistantFeedback',
      summaryCue: /thanks/i,
    },
  ];

  for (const caze of cases) {
    const { status, data } = await publicAssistant(caze.prompt, feedbackCtx);
    const d = data?.details || {};
    const pass =
      status >= 200 &&
      status < 300 &&
      data?.action === 'give_ai_feedback' &&
      data?.success === true &&
      d.feedbackRating === caze.rating &&
      (caze.reason ? d.feedbackReason === caze.reason : true) &&
      d.clientAction === caze.clientAction &&
      caze.summaryCue.test(String(data?.summary || ''));
    record(caze.id, pass, {
      status,
      action: data?.action,
      success: data?.success,
      rating: d.feedbackRating,
      reason: d.feedbackReason,
      clientAction: d.clientAction,
      summary: String(data?.summary || '').slice(0, 120),
    });
  }

  // HY / RU — must not rate negative phrasing as up
  for (const caze of [
    { id: 'public-hy-wrong', prompt: 'Սխալ էր', locale: 'hy' },
    { id: 'public-ru-not-useful', prompt: 'Не полезно', locale: 'ru' },
  ]) {
    const { status, data } = await publicAssistant(
      caze.prompt,
      feedbackCtx,
      caze.locale,
    );
    const d = data?.details || {};
    const isFeedback = data?.action === 'give_ai_feedback';
    const pass =
      status >= 200 &&
      status < 300 &&
      ((isFeedback && d.feedbackRating === 'down') ||
        !(isFeedback && d.feedbackRating === 'up'));
    record(caze.id, pass, {
      status,
      action: data?.action,
      rating: d.feedbackRating,
      summary: String(data?.summary || '').slice(0, 100),
    });
  }

  // Negatives
  for (const caze of [
    { id: 'neg-book', prompt: 'Book a haircut tomorrow' },
    { id: 'neg-read-aloud', prompt: 'Read that aloud' },
    { id: 'neg-booking-help', prompt: 'How do I book an appointment?' },
  ]) {
    const { status, data } = await publicAssistant(caze.prompt, feedbackCtx);
    const pass =
      status >= 200 &&
      status < 300 &&
      data?.action !== 'give_ai_feedback';
    record(caze.id, pass, {
      status,
      action: data?.action,
      summary: String(data?.summary || '').slice(0, 100),
    });
  }

  // Must not land on provider action; Not helpful stays down
  {
    const { status, data } = await publicAssistant(
      'Not helpful',
      feedbackCtx,
    );
    const pass =
      status >= 200 &&
      status < 300 &&
      data?.action === 'give_ai_feedback' &&
      data?.action !== 'give_provider_ai_feedback' &&
      data?.details?.feedbackRating === 'down';
    record('not-provider-action-not-helpful-down', pass, {
      status,
      action: data?.action,
      rating: data?.details?.feedbackRating,
    });
  }

  // Regression probe (not gate for e2e-265): short prompts that util detects
  // but public understanding may block before rescue — report only.
  const residualProbes = [
    'Helpful',
    'Good answer',
    'Bad answer',
    'Wrong service',
    'Wrong person picked',
    "You didn't understand me",
  ];
  for (const prompt of residualProbes) {
    const { status, data } = await publicAssistant(prompt, feedbackCtx);
    const d = data?.details || {};
    const reached = data?.action === 'give_ai_feedback';
    const wrongUp = reached && d.feedbackRating === 'up' && /bad|wrong/i.test(prompt);
    // Pass if not falsely thumbs-up on a negative cue; unknown is residual (logged).
    const pass = status >= 200 && status < 300 && !wrongUp;
    record(`probe-${prompt.replace(/\s+/g, '-').toLowerCase()}`, pass, {
      status,
      action: data?.action,
      rating: d.feedbackRating,
      note: reached
        ? 'reached give_ai_feedback'
        : 'unknown/other — see e2e-bug residual for pre-rescue block',
    });
  }

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass);
  console.log(
    `\ne2e-bug.265 QA → ${API} ${SLUG} — ${passed}/${results.length} PASS`,
  );
  if (failed.length) {
    console.log('FAILED:', failed.map((f) => f.id).join(', '));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
