/**
 * Guru live QA for e2e-bug.280 — short public give_ai_feedback prompts must
 * reach give_ai_feedback (not assistant.unknown) when classify is unknown.
 *
 * Run: node scripts/qa-e2e-bug-280.mjs
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
  loadEnv();
  const { AiIntentRescueService } = require(resolve(
    backendRoot,
    'dist/modules/ai/ai-intent-rescue.service.js',
  ));
  const {
    isGiveAiFeedbackPrompt,
    parseGiveAiFeedbackFromPrompt,
  } = require(resolve(
    backendRoot,
    'dist/modules/ai/ai-give-ai-feedback.util.js',
  ));

  const results = [];
  function record(id, pass, detail) {
    results.push({ id, pass, detail });
    console.log(
      `${pass ? 'PASS' : 'FAIL'}  ${id} — ${JSON.stringify(detail).slice(0, 360)}`,
    );
  }

  const rescueService = new AiIntentRescueService();

  const shortCases = [
    { id: 'unit-helpful', prompt: 'Helpful', rating: 'up' },
    { id: 'unit-good-answer', prompt: 'Good answer', rating: 'up' },
    { id: 'unit-bad-answer', prompt: 'Bad answer', rating: 'down' },
    {
      id: 'unit-wrong-service',
      prompt: 'Wrong service',
      rating: 'down',
      reason: 'wrong_service',
    },
    {
      id: 'unit-wrong-person',
      prompt: 'Wrong person picked',
      rating: 'down',
      reason: 'wrong_person',
    },
    {
      id: 'unit-didnt-understand',
      prompt: "You didn't understand me",
      rating: 'down',
      reason: 'did_not_understand',
    },
    { id: 'unit-ru-ne-polezno', prompt: 'Не полезно', rating: 'down' },
    { id: 'unit-wrong-action', prompt: 'Wrong action', rating: 'down' },
  ];

  for (const u of shortCases) {
    const rescued = rescueService.rescue({
      prompt: u.prompt,
      action: 'unknown',
      params: {},
      surface: 'public',
    });
    const parsed = parseGiveAiFeedbackFromPrompt(u.prompt);
    const ok =
      isGiveAiFeedbackPrompt(u.prompt) &&
      rescued?.action === 'give_ai_feedback' &&
      parsed?.rating === u.rating &&
      (u.reason == null || parsed?.reason === u.reason);
    record(u.id, ok, {
      rescued: rescued?.action,
      rating: parsed?.rating,
      reason: parsed?.reason,
    });
  }

  console.log(`e2e-bug.280 QA → ${API} ${SLUG}`);

  async function publicAssistant(prompt, context = {}) {
    const res = await request('POST', `/public/${SLUG}/assistant`, {
      body: {
        prompt,
        assistantMode: 'act',
        locale: 'en',
        context: { slug: SLUG, ...context },
      },
    });
    return { status: res.status, data: unwrap(res.body) };
  }

  const feedbackCtx = {
    lastAssistantReply: 'Here are available times tomorrow afternoon.',
    lastAction: 'check_availability',
  };

  const liveCases = [
    { id: 'live-helpful', prompt: 'Helpful', rating: 'up' },
    { id: 'live-good-answer', prompt: 'Good answer', rating: 'up' },
    { id: 'live-bad-answer', prompt: 'Bad answer', rating: 'down' },
    {
      id: 'live-wrong-service',
      prompt: 'Wrong service',
      rating: 'down',
      reason: 'wrong_service',
    },
    {
      id: 'live-wrong-person-picked',
      prompt: 'Wrong person picked',
      rating: 'down',
      reason: 'wrong_person',
    },
    {
      id: 'live-didnt-understand',
      prompt: "You didn't understand me",
      rating: 'down',
      reason: 'did_not_understand',
    },
    { id: 'live-ru-ne-polezno', prompt: 'Не полезно', rating: 'down' },
    { id: 'live-wrong-action', prompt: 'Wrong action', rating: 'down' },
    { id: 'live-not-helpful', prompt: 'Not helpful', rating: 'down' },
    { id: 'live-that-was-helpful', prompt: 'That was helpful', rating: 'up' },
    {
      id: 'live-wrong-date-picked',
      prompt: 'Wrong date picked',
      rating: 'down',
      reason: 'wrong_date',
    },
  ];

  for (const caze of liveCases) {
    const { status, data } = await publicAssistant(caze.prompt, feedbackCtx);
    const d = data?.details || {};
    const rating = d.feedbackRating;
    const reason = d.feedbackReason;
    const actionOk = data?.action === 'give_ai_feedback';
    const ratingOk = rating === caze.rating;
    const reasonOk = caze.reason == null || reason === caze.reason;
    const notUnknown = data?.action !== 'unknown';
    const pass =
      status >= 200 &&
      status < 300 &&
      actionOk &&
      notUnknown &&
      ratingOk &&
      reasonOk;
    record(caze.id, pass, {
      status,
      action: data?.action,
      rating,
      reason,
      summary: String(data?.summary || '').slice(0, 120),
    });
  }

  // Negatives — must not become give_ai_feedback
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

  const failed = results.filter((r) => !r.pass);
  console.log(
    `\n${results.length - failed.length}/${results.length} passed` +
      (failed.length ? ` — FAILED: ${failed.map((f) => f.id).join(', ')}` : ''),
  );
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
