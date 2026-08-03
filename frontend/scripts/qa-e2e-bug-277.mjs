/**
 * Guru live QA for e2e-bug.277 — public booking_help must return guide +
 * localized supportHandoff (not summary-only).
 *
 * Run: node scripts/qa-e2e-bug-277.mjs
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
    id: 'live-hy-short-how-to-book',
    prompt: 'Ինչպես ամրագրել',
    locale: 'hy',
    expectAction: 'booking_help',
    requireGuide: true,
    requireSupportHandoff: true,
    requireHyHandoff: true,
    requireSteps: true,
  },
  {
    id: 'live-hy-en-how-to-book',
    prompt: 'How do I book an appointment?',
    locale: 'hy',
    expectAction: 'booking_help',
    requireGuide: true,
    requireSupportHandoff: true,
    requireHyHandoff: true,
    requireSteps: true,
  },
  {
    id: 'live-en-how-to-book',
    prompt: 'How do I book an appointment?',
    locale: 'en',
    expectAction: 'booking_help',
    requireGuide: true,
    requireSupportHandoff: true,
    expectHandoffLabel: 'Still stuck?',
    requireSteps: true,
  },
  {
    id: 'live-ru-how-to-book',
    prompt: 'How do I book an appointment?',
    locale: 'ru',
    expectAction: 'booking_help',
    requireGuide: true,
    requireSupportHandoff: true,
    requireRuHandoff: true,
    requireSteps: true,
  },
  {
    id: 'live-en-walkthrough',
    prompt: 'Walk me through booking',
    locale: 'en',
    expectAction: 'booking_help',
    requireGuide: true,
    requireSupportHandoff: true,
    requireSteps: true,
  },
  {
    id: 'live-hy-walkthrough',
    prompt: 'walk me through booking step by step',
    locale: 'hy',
    expectAction: 'booking_help',
    requireGuide: true,
    requireSupportHandoff: true,
    requireHyHandoff: true,
    requireSteps: true,
  },
  {
    id: 'live-en-booking-help',
    prompt: 'booking help',
    locale: 'en',
    expectAction: 'booking_help',
    requireGuide: true,
    requireSupportHandoff: true,
    requireSteps: true,
  },
  {
    id: 'live-hy-after-pick-time',
    prompt: 'What happens after I pick a time?',
    locale: 'hy',
    expectAction: 'booking_help',
    requireGuide: true,
    requireSupportHandoff: true,
    requireHyHandoff: true,
  },
  {
    id: 'live-hy-packages-control',
    prompt: 'How do I buy a package?',
    locale: 'hy',
    allowActions: ['guide_user_flow', 'explain_app_feature'],
    requireGuide: true,
    requireSupportHandoff: true,
    requireHyHandoff: true,
  },
  {
    id: 'live-en-home-tab-control',
    prompt: 'How do I use the Home tab?',
    locale: 'en',
    allowActions: ['explain_app_feature', 'guide_user_flow'],
    requireGuide: true,
    requireSupportHandoff: true,
    expectHandoffLabel: 'Still stuck?',
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

function hasHy(s) {
  return /[\u0530-\u058F]/.test(String(s || ''));
}

function hasCyr(s) {
  return /[\u0400-\u04FF]/.test(String(s || ''));
}

async function main() {
  loadEnv();
  process.chdir(backendRoot);

  const {
    publicAssistantResultToCommandResult,
    commandResultToPublicAssistantResult,
  } = require(resolve(
    backendRoot,
    'dist/modules/ai/customer-ai-command.util.js',
  ));

  const sampleGuide = {
    topicId: 'public-booking-funnel',
    summary: 'Step 1 of 3',
    steps: [{ title: 'A', body: 'B' }],
    supportHandoff: { action: 'create_support_ticket', label: 'Still stuck?' },
  };
  const round = commandResultToPublicAssistantResult(
    publicAssistantResultToCommandResult({
      success: true,
      action: 'booking_help',
      summary: 'Step 1 of 3',
      guide: sampleGuide,
      navigate: { path: 'services' },
    }),
  );
  const unitPass =
    round.guide?.supportHandoff?.label === 'Still stuck?' &&
    Array.isArray(round.guide?.steps) &&
    round.guide.steps.length === 1;
  console.log(
    `${unitPass ? 'PASS' : 'FAIL'}  unit-roundtrip-preserves-guide — ${JSON.stringify(
      {
        hasGuide: !!round.guide,
        handoff: round.guide?.supportHandoff?.label,
        steps: round.guide?.steps?.length,
      },
    )}`,
  );

  console.log(`e2e-bug.277 QA → ${API} ${SLUG}`);
  let failed = unitPass ? 0 : 1;

  for (const c of CASES) {
    const res = await request('POST', `/public/${SLUG}/assistant`, {
      prompt: c.prompt,
      assistantMode: 'act',
      locale: c.locale,
      context: { slug: SLUG },
    });
    const d = unwrap(res.body);
    const action = d.action;
    const guide = d.guide || d.details?.guide;
    const handoff = guide?.supportHandoff?.label;
    const stepCount = Array.isArray(guide?.steps) ? guide.steps.length : 0;

    let pass = res.status >= 200 && res.status < 300;
    if (c.expectAction) pass = pass && action === c.expectAction;
    if (c.allowActions) pass = pass && c.allowActions.includes(action);
    if (c.requireGuide) pass = pass && !!guide;
    if (c.requireSupportHandoff) {
      pass = pass && typeof handoff === 'string' && handoff.length > 0;
    }
    if (c.expectHandoffLabel) pass = pass && handoff === c.expectHandoffLabel;
    if (c.requireHyHandoff) pass = pass && hasHy(handoff);
    if (c.requireRuHandoff) pass = pass && hasCyr(handoff);
    if (c.requireSteps) pass = pass && stepCount >= 2;

    console.log(
      `${pass ? 'PASS' : 'FAIL'}  ${c.id} — ${JSON.stringify({
        status: res.status,
        action,
        hasGuide: !!guide,
        handoff,
        stepCount,
        summary: String(d.summary || '').slice(0, 80),
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
