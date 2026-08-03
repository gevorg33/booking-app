/**
 * Guru live QA for e2e-bug.294 — hy/ru booking_help step titles must be short
 * (EN-parity), not body-length strings from e2e-bug.275 humanize.
 *
 * Run: node frontend/scripts/qa-e2e-bug-294.mjs
 * Requires: API on :3001
 */
import { createRequire } from 'module';
import { readFileSync, existsSync, copyFileSync } from 'fs';
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

function titleAfterColon(summary) {
  const idx = String(summary || '').indexOf(':');
  if (idx < 0) return '';
  return String(summary).slice(idx + 1).trim();
}

function wordCount(text) {
  return String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

async function main() {
  loadEnv();
  process.chdir(backendRoot);

  // Keep dist snapshot in sync for unit probes (Nest may still use src via ts-node/watch)
  const srcSnap = resolve(
    backendRoot,
    'src/modules/ai/guide/dashboard-guide-corpus-i18n.snapshot.json',
  );
  const distSnap = resolve(
    backendRoot,
    'dist/modules/ai/guide/dashboard-guide-corpus-i18n.snapshot.json',
  );
  if (existsSync(srcSnap) && existsSync(dirname(distSnap))) {
    try {
      copyFileSync(srcSnap, distSnap);
    } catch {
      /* optional */
    }
  }

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
      `${pass ? 'PASS' : 'FAIL'}  ${id} — ${JSON.stringify(detail).slice(0, 400)}`,
    );
  }

  record(
    'unit-humanize-hy-short',
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
  record(
    'unit-humanize-ru-short',
    humanizeGuideStepTitle(
      'Шаг 1',
      'Выберите услугу на странице онлайн-записи.',
    ) === 'Выберите услугу',
    {
      got: humanizeGuideStepTitle(
        'Шаг 1',
        'Выберите услугу на странице онлайн-записи.',
      ),
    },
  );

  const expected = {
    en: 'Pick a service',
    hy: 'Ընտրեք ծառայություն',
    ru: 'Выберите услугу',
  };
  for (const locale of ['en', 'hy', 'ru']) {
    const messages = getFrontendGuideCorpusMessages(locale);
    const playbook = listAllGuideFlowPlaybookDefs().find(
      (p) => p.topicId === 'public-booking-funnel',
    );
    const hasShortKeys = playbook?.steps?.every((s) => s.shortTitleKey);
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
    const titlesOk = guide.steps.every((s) => wordCount(s.title) <= 4);
    const step1Ok = guide.steps[0]?.title === expected[locale];
    const summaryOk = String(stepped.summary || '').includes(expected[locale]);
    record(`unit-funnel-${locale}-short`, hasShortKeys && titlesOk && step1Ok && summaryOk, {
      hasShortKeys,
      titles: guide.steps.map((s) => s.title),
      summary: stepped.summary,
      words: guide.steps.map((s) => wordCount(s.title)),
    });
  }

  console.log(`e2e-bug.294 QA → ${API} ${SLUG}`);

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
      id: 'live-en-how-to-book-short',
      locale: 'en',
      prompt: 'How do I book an appointment?',
      titleRe: /^Pick a service$/u,
      forbid: /public booking page|from the/i,
    },
    {
      id: 'live-hy-how-to-book-short',
      locale: 'hy',
      prompt: 'How do I book an appointment?',
      titleRe: /^Ընտրեք ծառայություն$/u,
      forbid: /հանրային|ամրագրման էջից/u,
    },
    {
      id: 'live-ru-how-to-book-short',
      locale: 'ru',
      prompt: 'How do I book an appointment?',
      titleRe: /^Выберите услугу$/u,
      forbid: /на странице|онлайн-записи/iu,
    },
    {
      id: 'live-hy-short-prompt',
      locale: 'hy',
      prompt: 'Ինչպես ամրագրել',
      titleRe: /^Ընտրեք ծառայություն$/u,
      forbid: /հանրային|ամրագրման էջից/u,
    },
    {
      id: 'live-ru-short-prompt',
      locale: 'ru',
      prompt: 'Как записаться',
      titleRe: /^Выберите услугу$/u,
      forbid: /на странице|онлайн-записи/iu,
    },
    {
      id: 'live-hy-walkthrough-short',
      locale: 'hy',
      prompt: 'Walk me through booking step by step',
      titleRe: /^Ընտրեք ծառայություն$/u,
      forbid: /հանրային|ամրագրման էջից/u,
    },
    {
      id: 'live-ru-walkthrough-short',
      locale: 'ru',
      prompt: 'Walk me through booking step by step',
      titleRe: /^Выберите услугу$/u,
      forbid: /на странице|онлайн-записи/iu,
    },
    {
      id: 'live-en-walkthrough-short',
      locale: 'en',
      prompt: 'Walk me through booking step by step',
      titleRe: /^Pick a service$/u,
      forbid: /public booking page/i,
    },
    {
      id: 'live-hy-booking-help-short',
      locale: 'hy',
      prompt: 'booking help',
      titleRe: /^Ընտրեք ծառայություն$/u,
      forbid: /հանրային|ամրագրման էջից/u,
    },
    {
      id: 'live-ru-booking-help-short',
      locale: 'ru',
      prompt: 'booking help',
      titleRe: /^Выберите услугу$/u,
      forbid: /на странице|онлайн-записи/iu,
    },
  ];

  for (const caze of liveCases) {
    const { status, data } = await publicAssistant(caze.prompt, caze.locale);
    const summary = String(data?.summary || '');
    const title = titleAfterColon(summary);
    const actionOk = data?.action === 'booking_help';
    const titleOk = caze.titleRe.test(title);
    const notLong = !caze.forbid.test(title) && !caze.forbid.test(summary);
    const wordsOk = wordCount(title) <= 4;
    const pass =
      status >= 200 &&
      status < 300 &&
      actionOk &&
      titleOk &&
      notLong &&
      wordsOk;
    record(caze.id, pass, {
      status,
      action: data?.action,
      summary,
      title,
      words: wordCount(title),
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
