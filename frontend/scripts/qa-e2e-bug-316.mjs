/**
 * Guru live QA for e2e-bug.316 — high-traffic guide playbooks shortTitleKey
 * (customer booking-flow / packages + public professionals / services / checkout).
 *
 * Run: node frontend/scripts/qa-e2e-bug-316.mjs
 * Requires: API on :3001
 *
 * Live strategy: `booking_help` / page help with `context.screen` so ranking
 * resolves the playbook under test (bare prompts often steal to other intents).
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

const HIGH_TRAFFIC = [
  'consumer-booking-flow',
  'consumer-packages-gift-cards',
  'public-booking-professionals',
  'public-booking-services',
  'public-checkout',
];

const STEP1 = {
  'consumer-booking-flow': {
    en: 'Pick a professional',
    hy: 'Ընտրեք մասնագետ',
    ru: 'Выберите специалиста',
  },
  'consumer-packages-gift-cards': {
    en: 'Open Packages',
    hy: 'Բացեք փաթեթներ',
    ru: 'Откройте пакеты',
  },
  'public-booking-professionals': {
    en: 'Browse professionals',
    hy: 'Դիտեք մասնագետներ',
    ru: 'Просмотрите специалистов',
  },
  'public-booking-services': {
    en: 'Open Services',
    hy: 'Բացեք ծառայություններ',
    ru: 'Откройте услуги',
  },
  'public-checkout': {
    en: 'Review details',
    hy: 'Ստուգեք մանրամասները',
    ru: 'Проверьте детали',
  },
};

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

  // Residual discovery (filed as e2e-bug.330)
  const allPlaybooks = listAllGuideFlowPlaybookDefs();
  const missingShort = allPlaybooks
    .filter((p) => !HIGH_TRAFFIC.includes(p.topicId))
    .filter((p) => p.steps?.some((s) => !s.shortTitleKey))
    .map((p) => p.topicId);
  console.log(
    `INFO  residual-other-playbooks-lack-shortTitleKey — count=${missingShort.length} sample=${JSON.stringify(missingShort.slice(0, 12))}`,
  );

  for (const topicId of HIGH_TRAFFIC) {
    for (const locale of ['en', 'hy', 'ru']) {
      const messages = getFrontendGuideCorpusMessages(locale);
      const playbook = allPlaybooks.find((p) => p.topicId === topicId);
      const hasShortKeys = playbook?.steps?.every((s) => s.shortTitleKey);
      const resolved = resolveGuideFlowPlaybook(playbook, messages);
      const guide = buildGuideResponseFromFlowPlaybook(resolved);
      const expected = STEP1[topicId][locale];
      const titlesOk = guide.steps.every((s) => wordCount(s.title) <= 4);
      const step1Ok = guide.steps[0]?.title === expected;
      const stepped = buildGuideResponseForMultiTurnStep(
        guide,
        { guideFlowId: topicId, guideStepIndex: 0, completedSteps: [] },
        locale,
      );
      const summaryOk = String(stepped.summary || '').includes(expected);
      record(
        `unit-${topicId}-${locale}-short`,
        Boolean(hasShortKeys && titlesOk && step1Ok && summaryOk),
        {
          hasShortKeys,
          titles: guide.steps.map((s) => s.title),
          summary: stepped.summary,
          words: guide.steps.map((s) => wordCount(s.title)),
        },
      );
    }
  }

  console.log(`e2e-bug.316 QA → ${API} ${SLUG}`);

  async function publicAssistant(prompt, locale, screen) {
    const context = { slug: SLUG };
    if (screen) context.screen = screen;
    const res = await request('POST', `/public/${SLUG}/assistant`, {
      body: {
        prompt,
        assistantMode: 'act',
        locale,
        context,
      },
    });
    return { status: res.status, data: unwrap(res.body) };
  }

  const liveCases = [
    // Public professionals / services / checkout via booking_help + screen
    {
      id: 'live-en-professionals-short',
      locale: 'en',
      screen: '/book/professionals',
      prompt: 'How do I book an appointment?',
      titleRe: /^Browse professionals$/u,
      forbid: /bios or ratings|Professionals page/iu,
      actions: ['booking_help'],
    },
    {
      id: 'live-hy-professionals-short',
      locale: 'hy',
      screen: '/book/professionals',
      prompt: 'How do I book an appointment?',
      titleRe: /^Դիտեք մասնագետներ$/u,
      forbid: /վարկանիշ|բիոն/u,
      actions: ['booking_help'],
    },
    {
      id: 'live-ru-professionals-short',
      locale: 'ru',
      screen: '/book/professionals',
      prompt: 'How do I book an appointment?',
      titleRe: /^Просмотрите специалистов$/u,
      forbid: /биографии|рейтинги/iu,
      actions: ['booking_help'],
    },
    {
      id: 'live-en-services-short',
      locale: 'en',
      screen: '/book/services',
      prompt: 'How do I book an appointment?',
      titleRe: /^Open Services$/u,
      forbid: /from the menu|after choosing/iu,
      actions: ['booking_help'],
    },
    {
      id: 'live-hy-services-short',
      locale: 'hy',
      screen: '/book/services',
      prompt: 'How do I book an appointment?',
      titleRe: /^Բացեք ծառայություններ$/u,
      forbid: /ընտրացանկից|մասնագետն ընտրելուց/u,
      actions: ['booking_help'],
    },
    {
      id: 'live-ru-services-short',
      locale: 'ru',
      screen: '/book/services',
      prompt: 'How do I book an appointment?',
      titleRe: /^Откройте услуги$/u,
      forbid: /из меню|после выбора/iu,
      actions: ['booking_help'],
    },
    {
      id: 'live-en-checkout-short',
      locale: 'en',
      screen: '/book/checkout',
      prompt: 'How do I book an appointment?',
      titleRe: /^Review details$/u,
      forbid: /cancellation policy|prepayment is required/iu,
      actions: ['booking_help'],
    },
    {
      id: 'live-hy-checkout-short',
      locale: 'hy',
      screen: '/book/checkout',
      prompt: 'How do I book an appointment?',
      titleRe: /^Ստուգեք մանրամասները$/u,
      forbid: /չեղարկման կանոն|կանխավճար պահանջվում/u,
      actions: ['booking_help'],
    },
    {
      id: 'live-ru-checkout-short',
      locale: 'ru',
      screen: '/book/checkout',
      prompt: 'How do I book an appointment?',
      titleRe: /^Проверьте детали$/u,
      forbid: /политику отмены|требуется предоплата/iu,
      actions: ['booking_help'],
    },
    // Edge paraphrase on professionals screen
    {
      id: 'live-en-professionals-choose-here',
      locale: 'en',
      screen: '/book/professionals',
      prompt: 'How do I choose a professional here?',
      titleRe: /^Browse professionals$/u,
      forbid: /bios or ratings/iu,
      actions: ['booking_help'],
    },
    // Customer booking-flow (4-step) via page help on professionals
    {
      id: 'live-en-booking-flow-page-help',
      locale: 'en',
      screen: '/book/professionals',
      prompt: 'Help me with this page',
      titleRe: /^Pick a professional$/u,
      forbid: /Any available/iu,
      actions: ['explain_current_screen', 'guide_user_flow'],
    },
    {
      id: 'live-hy-booking-flow-page-help',
      locale: 'hy',
      screen: '/book/professionals',
      prompt: 'Help me with this page',
      titleRe: /^Ընտրեք մասնագետ$/u,
      forbid: /Ցանկացած ազատ/u,
      actions: ['explain_current_screen', 'guide_user_flow'],
    },
    {
      id: 'live-ru-booking-flow-page-help',
      locale: 'ru',
      screen: '/book/professionals',
      prompt: 'Help me with this page',
      titleRe: /^Выберите специалиста$/u,
      forbid: /Любой доступный/iu,
      actions: ['explain_current_screen', 'guide_user_flow'],
    },
    // Packages
    {
      id: 'live-en-packages-page-help',
      locale: 'en',
      screen: '/s/packages',
      prompt: 'Help me with this page',
      titleRe: /^Open Packages$/u,
      forbid: /Services or Account|expiry/iu,
      actions: ['explain_current_screen', 'guide_user_flow'],
    },
    {
      id: 'live-en-packages-walkthrough',
      locale: 'en',
      screen: '/s/packages',
      prompt: 'Walk me through buying a package step by step',
      titleRe: /^Open Packages$/u,
      forbid: /Services or Account|expiry/iu,
      actions: ['guide_user_flow', 'explain_current_screen'],
    },
    {
      id: 'live-hy-packages-walkthrough',
      locale: 'hy',
      screen: '/s/packages',
      prompt: 'Walk me through buying a package step by step',
      titleRe: /^Բացեք փաթեթներ$/u,
      forbid: /վավերության ժամկետ/u,
      actions: ['guide_user_flow', 'explain_current_screen'],
    },
    {
      id: 'live-ru-packages-walkthrough',
      locale: 'ru',
      screen: '/s/packages',
      prompt: 'Walk me through buying a package step by step',
      titleRe: /^Откройте пакеты$/u,
      forbid: /срок действия/iu,
      actions: ['guide_user_flow', 'explain_current_screen'],
    },
    // Funnel regression (e2e-bug.294 still short with no screen)
    {
      id: 'live-en-funnel-regression',
      locale: 'en',
      screen: null,
      prompt: 'How do I book an appointment?',
      titleRe: /^Pick a service$/u,
      forbid: /public booking page/iu,
      actions: ['booking_help'],
    },
  ];

  for (const c of liveCases) {
    const { status, data } = await publicAssistant(
      c.prompt,
      c.locale,
      c.screen,
    );
    const summary = String(data?.summary || '');
    const title = titleAfterColon(summary);
    const action = data?.action || data?.intent || '';
    const titleOk = c.titleRe.test(title);
    const forbidOk = !c.forbid.test(title) && !c.forbid.test(summary);
    const wordsOk = wordCount(title) <= 4;
    const actionOk = c.actions.includes(action);
    const pass =
      (status === 200 || status === 201) &&
      titleOk &&
      forbidOk &&
      wordsOk &&
      actionOk;
    record(c.id, pass, {
      status,
      action,
      summary: summary.slice(0, 180),
      title,
      words: wordCount(title),
      titleOk,
      forbidOk,
      actionOk,
    });
  }

  // Soft residual probes (document only — newly discovered routing gaps)
  const residualProbes = [
    {
      id: 'residual-services-page-help-misroute',
      locale: 'en',
      screen: '/book/services',
      prompt: 'Help me with this page',
      // Expect wrong topic today (Home / tabs) — filed as e2e-bug.331
      expectWrongTitle: /Home shows upcoming|Browse categories/i,
    },
    {
      id: 'residual-checkout-page-help-misroute',
      locale: 'en',
      screen: '/book/checkout',
      prompt: 'Help me with this page',
      expectWrongTitle: /Pick a professional|Home shows/i,
    },
  ];
  for (const c of residualProbes) {
    const { data } = await publicAssistant(c.prompt, c.locale, c.screen);
    const summary = String(data?.summary || '');
    const title = titleAfterColon(summary);
    const confirmed = c.expectWrongTitle.test(title) || c.expectWrongTitle.test(summary);
    console.log(
      `INFO  ${c.id} — confirmed=${confirmed} title=${JSON.stringify(title)} summary=${JSON.stringify(summary.slice(0, 120))}`,
    );
  }

  const failed = results.filter((r) => !r.pass);
  console.log(
    `\ne2e-bug.316: ${results.length - failed.length}/${results.length} passed`,
  );
  if (failed.length) {
    console.error('FAILED:', failed.map((f) => f.id).join(', '));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
