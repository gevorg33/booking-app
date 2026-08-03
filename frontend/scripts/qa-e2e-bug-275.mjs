/**
 * Guru live QA for e2e-bug.275 — hy/ru booking_help summaries must not
 * collapse to placeholder step titles ("Քայլ 1/3: Քայլ 1").
 *
 * Run: node scripts/qa-e2e-bug-275.mjs
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
  // Snapshot loader resolves via process.cwd() — must run from backend root.
  process.chdir(backendRoot);
  const { getFrontendGuideCorpusMessages } = require(resolve(
    backendRoot,
    'dist/modules/ai/guide/ai-guide-corpus-i18n.fixtures.js',
  ));
  const { listAllGuideFlowPlaybookDefs } = require(resolve(
    backendRoot,
    'dist/modules/ai/guide/guide-flow.loader.js',
  ));
  const {
    resolveGuideFlowPlaybook,
    buildGuideResponseFromFlowPlaybook,
    humanizeGuideStepTitle,
  } = require(resolve(
    backendRoot,
    'dist/modules/ai/guide/guide-flow.corpus.util.js',
  ));
  const { buildGuideResponseForMultiTurnStep } = require(resolve(
    backendRoot,
    'dist/modules/ai/ai-product-guide-multiturn.util.js',
  ));

  const results = [];
  function record(id, pass, detail) {
    results.push({ id, pass, detail });
    console.log(
      `${pass ? 'PASS' : 'FAIL'}  ${id} — ${JSON.stringify(detail).slice(0, 360)}`,
    );
  }

  // Unit probes against dist
  record(
    'unit-humanize-en',
    humanizeGuideStepTitle(
      'Step 1',
      'Pick a service from the public booking page.',
    ) === 'Pick a service',
    {
      got: humanizeGuideStepTitle(
        'Step 1',
        'Pick a service from the public booking page.',
      ),
    },
  );
  record(
    'unit-humanize-hy',
    humanizeGuideStepTitle(
      'Քայլ 1',
      'Ընտրեք ծառայություն հանրային ամրագրման էջից։',
    ) === 'Ընտրեք ծառայություն',
    {
      got: humanizeGuideStepTitle(
        'Քայլ 1',
        'Ընտրեք ծառայություն հանրային ամրագրման էջից։',
      ),
    },
  );

  for (const locale of ['en', 'hy', 'ru']) {
    const messages = getFrontendGuideCorpusMessages(locale);
    const playbook = listAllGuideFlowPlaybookDefs().find(
      (p) => p.topicId === 'public-booking-funnel',
    );
    const resolved = resolveGuideFlowPlaybook(playbook, messages);
    const guide = buildGuideResponseFromFlowPlaybook(resolved);
    const stepped = buildGuideResponseForMultiTurnStep(
      guide,
      {
        guideFlowId: 'public-booking-funnel',
        guideStepIndex: 0,
        completedSteps: [],
      },
      locale,
    );
    const badTitle = /:\s*(?:Step|Քայլ|Шаг)\s*1\s*$/u.test(stepped.summary);
    const placeholderStep = guide.steps.some((s) =>
      /^(?:Step|Քայլ|Шаг)\s*\d+\s*$/iu.test(String(s.title || '')),
    );
    record(`unit-funnel-${locale}`, !badTitle && !placeholderStep, {
      summary: stepped.summary,
      titles: guide.steps.map((s) => s.title),
    });
  }

  console.log(`e2e-bug.275 QA → ${API} ${SLUG}`);

  async function publicAssistant(prompt, locale) {
    const res = await request('POST', `/public/${SLUG}/assistant`, {
      body: {
        prompt,
        assistantMode: 'act',
        locale,
        context: { slug: SLUG },
      },
    });
    return { status: res.status, data: unwrap(res.body) };
  }

  const liveCases = [
    {
      id: 'live-en-how-to-book',
      locale: 'en',
      prompt: 'How do I book an appointment?',
      prefix: /^Step 1 of 3:/,
      forbid: /:\s*Step\s*1\s*$/i,
    },
    {
      id: 'live-hy-how-to-book',
      locale: 'hy',
      prompt: 'How do I book an appointment?',
      prefix: /^Քայլ 1\/3:/,
      forbid: /:\s*Քայլ\s*1\s*$/u,
    },
    {
      id: 'live-ru-how-to-book',
      locale: 'ru',
      prompt: 'How do I book an appointment?',
      prefix: /^Шаг 1 из 3:/,
      forbid: /:\s*Шаг\s*1\s*$/u,
    },
    {
      id: 'live-hy-short',
      locale: 'hy',
      prompt: 'Ինչպես ամրագրել',
      prefix: /^Քայլ 1\/3:/,
      forbid: /:\s*Քայլ\s*1\s*$/u,
    },
    {
      id: 'live-ru-short',
      locale: 'ru',
      prompt: 'Как записаться',
      prefix: /^Шаг 1 из 3:/,
      forbid: /:\s*Шаг\s*1\s*$/u,
    },
    {
      id: 'live-hy-walkthrough',
      locale: 'hy',
      prompt: 'Walk me through booking step by step',
      prefix: /^Քայլ 1\/3:/,
      forbid: /:\s*Քայլ\s*1\s*$/u,
    },
    {
      id: 'live-ru-walkthrough',
      locale: 'ru',
      prompt: 'Walk me through booking step by step',
      prefix: /^Шаг 1 из 3:/,
      forbid: /:\s*Шаг\s*1\s*$/u,
    },
    {
      id: 'live-en-walkthrough',
      locale: 'en',
      prompt: 'Walk me through booking step by step',
      prefix: /^Step 1 of 3:/,
      forbid: /:\s*Step\s*1\s*$/i,
    },
    {
      id: 'live-hy-booking-help',
      locale: 'hy',
      prompt: 'booking help',
      prefix: /^Քայլ 1\/3:/,
      forbid: /:\s*Քայլ\s*1\s*$/u,
    },
    {
      id: 'live-ru-booking-help',
      locale: 'ru',
      prompt: 'booking help',
      prefix: /^Шаг 1 из 3:/,
      forbid: /:\s*Шаг\s*1\s*$/u,
    },
  ];

  for (const caze of liveCases) {
    const { status, data } = await publicAssistant(caze.prompt, caze.locale);
    const summary = String(data?.summary || '');
    const actionOk = data?.action === 'booking_help';
    const prefixOk = caze.prefix.test(summary);
    const notPlaceholder = !caze.forbid.test(summary);
    const pass =
      status >= 200 &&
      status < 300 &&
      actionOk &&
      prefixOk &&
      notPlaceholder;
    record(caze.id, pass, {
      status,
      action: data?.action,
      summary,
      hasGuide: Boolean(data?.guide),
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
