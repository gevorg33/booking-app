/**
 * Guru live QA for e2e-bug.293 — "Thumbs up" / "Thumbs down" must rate
 * (not clarify without feedbackRating).
 *
 * Run: node scripts/qa-e2e-bug-293.mjs
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

const CASES = [
  {
    id: 'live-thumbs-up',
    prompt: 'Thumbs up',
    expectRating: 'up',
    expectClientAction: 'submitAssistantFeedback',
    forbidClarify: true,
  },
  {
    id: 'live-thumbs-down',
    prompt: 'Thumbs down',
    expectRating: 'down',
    expectShowReasonChips: true,
    expectClientAction: 'openAssistantFeedback',
    forbidClarify: true,
  },
  {
    id: 'live-thumb-up',
    prompt: 'thumb up',
    expectRating: 'up',
    expectClientAction: 'submitAssistantFeedback',
    forbidClarify: true,
  },
  {
    id: 'live-thumbs-up-hyphen',
    prompt: 'thumbs-up',
    expectRating: 'up',
    expectClientAction: 'submitAssistantFeedback',
    forbidClarify: true,
  },
  {
    id: 'live-thumbs-down-hyphen',
    prompt: 'thumbs-down',
    expectRating: 'down',
    expectShowReasonChips: true,
    expectClientAction: 'openAssistantFeedback',
    forbidClarify: true,
  },
  {
    id: 'live-emoji-up',
    prompt: '👍',
    expectRating: 'up',
    expectClientAction: 'submitAssistantFeedback',
    forbidClarify: true,
  },
  {
    id: 'live-emoji-down',
    prompt: '👎',
    expectRating: 'down',
    expectShowReasonChips: true,
    expectClientAction: 'openAssistantFeedback',
    forbidClarify: true,
  },
  {
    id: 'live-thumbs-up-case',
    prompt: 'THUMBS UP',
    expectRating: 'up',
    expectClientAction: 'submitAssistantFeedback',
    forbidClarify: true,
  },
  {
    id: 'live-thumbs-down-case',
    prompt: 'THUMBS DOWN',
    expectRating: 'down',
    expectShowReasonChips: true,
    expectClientAction: 'openAssistantFeedback',
    forbidClarify: true,
  },
  {
    id: 'live-control-helpful',
    prompt: 'Helpful',
    expectRating: 'up',
    expectClientAction: 'submitAssistantFeedback',
    forbidClarify: true,
  },
  {
    id: 'live-control-not-helpful',
    prompt: 'Not helpful',
    expectRating: 'down',
    expectShowReasonChips: true,
    expectClientAction: 'openAssistantFeedback',
    forbidClarify: true,
  },
  {
    id: 'live-control-wrong-date',
    prompt: 'Wrong date picked',
    expectRating: 'down',
    expectFeedbackReason: 'wrong_date',
    expectClientAction: 'submitAssistantFeedback',
    forbidClarify: true,
  },
  {
    id: 'live-edge-plus-one',
    prompt: '+1',
    // May stay unknown — recorded as residual if so.
    allowActions: ['give_ai_feedback', 'unknown'],
    noteIfUnknown: 'e2e-bug residual: +1 not mapped',
  },
  {
    id: 'live-edge-minus-one',
    prompt: '-1',
    allowActions: ['give_ai_feedback', 'unknown'],
    noteIfUnknown: 'e2e-bug residual: -1 not mapped',
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
    isGiveAiFeedbackPrompt,
    parseGiveAiFeedbackFromPrompt,
  } = require(resolve(
    backendRoot,
    'dist/modules/ai/ai-give-ai-feedback.util.js',
  ));

  let failed = 0;
  const residuals = [];

  for (const prompt of ['Thumbs up', 'Thumbs down', '👍', '👎']) {
    const parsed = parseGiveAiFeedbackFromPrompt(prompt);
    const pass =
      isGiveAiFeedbackPrompt(prompt) &&
      parsed?.rating != null &&
      (prompt.toLowerCase().includes('down') || prompt === '👎'
        ? parsed.rating === 'down'
        : parsed.rating === 'up');
    console.log(
      `${pass ? 'PASS' : 'FAIL'}  unit-${prompt} — ${JSON.stringify(parsed)}`,
    );
    if (!pass) failed += 1;
  }

  console.log(`e2e-bug.293 QA → ${API} ${SLUG}`);

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
      locale: 'en',
      context: {
        slug: SLUG,
        conversationHistory: history,
        lastAssistantReply: history[1].content,
        lastAction: 'list_services',
      },
    });
    const d = unwrap(res.body);
    const details = d.details || {};
    const summary = String(d.summary || '');

    let pass = res.status >= 200 && res.status < 300;
    if (c.allowActions) {
      pass = pass && c.allowActions.includes(d.action);
      if (d.action === 'unknown' && c.noteIfUnknown) {
        residuals.push({ id: c.id, prompt: c.prompt, note: c.noteIfUnknown });
      }
      // Edge cases: pass if allowed action; prefer give_ai_feedback+rating when present.
      if (d.action === 'give_ai_feedback') {
        pass = pass && d.success === true && details.feedbackRating != null;
      }
    } else {
      pass = pass && d.action === 'give_ai_feedback' && d.success === true;
      if (c.expectRating) {
        pass = pass && details.feedbackRating === c.expectRating;
      }
      if (c.expectClientAction) {
        pass = pass && details.clientAction === c.expectClientAction;
      }
      if (c.expectShowReasonChips) {
        pass = pass && details.showReasonChips === true;
      }
      if (c.expectFeedbackReason) {
        pass = pass && details.feedbackReason === c.expectFeedbackReason;
      }
      if (c.forbidClarify) {
        pass =
          pass &&
          !/say whether|say if the answer was helpful/i.test(summary) &&
          details.clarify !== true;
      }
    }

    console.log(
      `${pass ? 'PASS' : 'FAIL'}  ${c.id} — ${JSON.stringify({
        status: res.status,
        action: d.action,
        success: d.success,
        rating: details.feedbackRating,
        reason: details.feedbackReason,
        showReasonChips: details.showReasonChips,
        clientAction: details.clientAction,
        summary: summary.slice(0, 100),
      })}`,
    );
    if (!pass) failed += 1;
  }

  const total = 4 + CASES.length;
  console.log(`\n${total - failed}/${total} passed`);
  if (residuals.length) {
    console.log('\nResiduals noted:');
    for (const r of residuals) {
      console.log(`  - ${r.id}: ${r.note}`);
    }
  }
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
