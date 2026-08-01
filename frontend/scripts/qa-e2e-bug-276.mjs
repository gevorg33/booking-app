/**
 * Guru live QA for e2e-bug.276 — Home-tab tour under locale:hy must stay
 * explain_app_feature / guide_user_flow (consumer-tabs), not
 * explain_home_screen_widget English clarify.
 *
 * Run: node scripts/qa-e2e-bug-276.mjs
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

const ENGLISH_WIDGET_CLARIFY =
  /Ask about the home screen widget/i;

const CASES = [
  {
    id: 'live-hy-how-use-home-tab',
    prompt: 'How do I use the Home tab?',
    locale: 'hy',
    allowActions: ['explain_app_feature', 'guide_user_flow'],
    expectTopic: 'consumer-tabs',
    forbidWidgetClarify: true,
    requireSuccess: true,
  },
  {
    id: 'live-hy-home-tab-step-by-step',
    prompt: 'How do I use the Home tab step by step?',
    locale: 'hy',
    allowActions: ['explain_app_feature', 'guide_user_flow'],
    expectTopic: 'consumer-tabs',
    forbidWidgetClarify: true,
    requireSuccess: true,
  },
  {
    id: 'live-hy-what-on-home-tab',
    prompt: 'What is on the Home tab?',
    locale: 'hy',
    allowActions: ['explain_app_feature', 'guide_user_flow'],
    expectTopic: 'consumer-tabs',
    forbidWidgetClarify: true,
    requireSuccess: true,
  },
  {
    id: 'live-hy-walk-home-tab',
    prompt: 'Walk me through the Home tab',
    locale: 'hy',
    allowActions: ['explain_app_feature', 'guide_user_flow'],
    expectTopic: 'consumer-tabs',
    forbidWidgetClarify: true,
    requireSuccess: true,
  },
  {
    id: 'live-hy-home-vs-services',
    prompt: 'What is on the Home tab vs Services?',
    locale: 'hy',
    allowActions: ['explain_app_feature', 'guide_user_flow'],
    expectTopic: 'consumer-tabs',
    forbidWidgetClarify: true,
    forbidAction: 'compare_services',
    requireSuccess: true,
  },
  {
    id: 'live-hy-native-home-tab',
    prompt: 'Ինչպես օգտագործել Home ներդիրը?',
    locale: 'hy',
    allowActions: ['explain_app_feature', 'guide_user_flow'],
    expectTopic: 'consumer-tabs',
    requireSuccess: true,
  },
  {
    id: 'live-ru-how-use-home-tab',
    prompt: 'How do I use the Home tab?',
    locale: 'ru',
    allowActions: ['explain_app_feature', 'guide_user_flow'],
    expectTopic: 'consumer-tabs',
    requireSuccess: true,
  },
  {
    id: 'live-en-how-use-home-tab',
    prompt: 'How do I use the Home tab?',
    locale: 'en',
    allowActions: ['explain_app_feature', 'guide_user_flow'],
    expectTopic: 'consumer-tabs',
    requireSuccess: true,
  },
  {
    id: 'live-hy-widget-true-positive',
    prompt: 'How does the home screen widget work?',
    locale: 'hy',
    expectAction: 'explain_home_screen_widget',
    requireSuccess: true,
    forbidTopic: 'consumer-tabs',
  },
  {
    id: 'live-hy-widget-add',
    prompt: 'Add next appointment to home screen',
    locale: 'hy',
    expectAction: 'explain_home_screen_widget',
    // Hardened by e2e-bug.295 (classified-phase adoption + NEXT_CUE guard).
    requireSuccess: true,
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
    rescueCustomerAppGuideIntent,
  } = require(resolve(
    backendRoot,
    'dist/modules/ai/ai-customer-product-guide.util.js',
  ));
  const {
    isExplainHomeScreenWidgetPrompt,
  } = require(resolve(
    backendRoot,
    'dist/modules/ai/ai-explain-home-screen-widget.util.js',
  ));
  const { t } = require(resolve(backendRoot, 'dist/common/i18n/messages.js'));

  const unit = [];
  const homeTab = 'How do I use the Home tab step by step?';
  unit.push({
    id: 'unit-reclaim-from-widget',
    pass:
      rescueCustomerAppGuideIntent(homeTab, 'explain_home_screen_widget') ===
      'explain_app_feature',
  });
  unit.push({
    id: 'unit-detector-rejects-home-tab',
    pass: isExplainHomeScreenWidgetPrompt(homeTab) === false,
  });
  unit.push({
    id: 'unit-clarify-hy-localized',
    pass: /[\u0530-\u058F]/.test(t('hy', 'assistant.homeScreenWidgetClarify')),
  });

  let failed = 0;
  for (const u of unit) {
    console.log(`${u.pass ? 'PASS' : 'FAIL'}  ${u.id}`);
    if (!u.pass) failed += 1;
  }

  console.log(`e2e-bug.276 QA → ${API} ${SLUG}`);

  for (const c of CASES) {
    const res = await request('POST', `/public/${SLUG}/assistant`, {
      prompt: c.prompt,
      assistantMode: 'act',
      locale: c.locale,
      context: { slug: SLUG },
    });
    const d = unwrap(res.body);
    const action = d.action;
    const summary = String(d.summary || '');
    const topic =
      d.guide?.topicId ||
      d.details?.guide?.topicId ||
      d.sessionContext?.guideFlowId;
    const okHttp = res.status >= 200 && res.status < 300;
    let pass = okHttp;
    if (c.expectAction) pass = pass && action === c.expectAction;
    if (c.allowActions) pass = pass && c.allowActions.includes(action);
    if (c.forbidAction) pass = pass && action !== c.forbidAction;
    if (c.expectTopic) pass = pass && topic === c.expectTopic;
    if (c.forbidTopic) pass = pass && topic !== c.forbidTopic;
    if (c.forbidWidgetClarify) pass = pass && !ENGLISH_WIDGET_CLARIFY.test(summary);
    if (c.requireSuccess) pass = pass && d.success === true;
    if (c.soft && !pass) {
      console.log(
        `SOFT  ${c.id} — ${JSON.stringify({ action, success: d.success, summary: summary.slice(0, 100), topic })}`,
      );
      continue;
    }
    console.log(
      `${pass ? 'PASS' : 'FAIL'}  ${c.id} — ${JSON.stringify({
        status: res.status,
        action,
        success: d.success,
        summary: summary.slice(0, 100),
        topic,
      })}`,
    );
    if (!pass) failed += 1;
  }

  const total = unit.length + CASES.filter((c) => !c.soft).length;
  const passed = total - failed;
  console.log(`\n${passed}/${total} passed`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
