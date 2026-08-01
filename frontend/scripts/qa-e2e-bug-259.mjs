/**
 * Manual live QA for e2e-bug.259 — locale:hy|ru must not return English
 * clarify/status prefixes or "Still stuck?" supportHandoff beside localized guides.
 * Also covers sibling e2e-bug.274 confirm anon clarify.
 *
 * Run: node scripts/qa-e2e-bug-259.mjs
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(__dirname, '../../backend');

const SLUG = process.env.SALON_SLUG || 'gevgas-operations-7c299253';
const API = process.env.API_BASE || 'http://127.0.0.1:3001';

const ENGLISH_CHROME = [
  /Still stuck\?/i,
  /Ask what Any stylist means/i,
  /Finish booking or sign in so I can read your appointment details/i,
  /Product guide help/i,
  /The user finished the in-app guide/i,
  /do not pick a named stylist/i,
];

const CASES = [
  {
    id: 'e2e259-live-hy-any-stylist-meaning',
    prompt: 'ինչ է նշանակում ցանկացած մասնագետ',
    locale: 'hy',
    expectAction: 'explain_any_provider_option',
    forbidEnglishChrome: true,
    requireHy: true,
  },
  {
    id: 'e2e259-live-hy-packages-guide-handoff',
    prompt: 'How do I buy a package?',
    locale: 'hy',
    allowActions: ['guide_user_flow', 'explain_app_feature'],
    forbidEnglishChrome: true,
    requireSupportHandoffLocalized: true,
    requireHy: true,
  },
  {
    id: 'e2e259-live-ru-packages-guide-handoff',
    prompt: 'How do I buy a package?',
    locale: 'ru',
    allowActions: ['guide_user_flow', 'explain_app_feature'],
    forbidEnglishChrome: true,
    requireSupportHandoffLocalized: true,
  },
  {
    id: 'e2e259-live-en-packages-guide-handoff-regression',
    prompt: 'How do I buy a package?',
    locale: 'en',
    allowActions: ['guide_user_flow', 'explain_app_feature'],
    expectSupportHandoffLabel: 'Still stuck?',
  },
  {
    id: 'e2e259-live-hy-booking-help-no-en-chrome',
    prompt: 'Ինչպես ամրագրել',
    locale: 'hy',
    expectAction: 'booking_help',
    forbidEnglishChrome: true,
    requireHy: true,
  },
  {
    id: 'e2e274-live-hy-confirm-time',
    prompt: 'Ինչ ժամի է իմ ամրագրումը?',
    locale: 'hy',
    expectAction: 'confirm_my_booking_details',
    forbidEnglishChrome: true,
    requireHy: true,
  },
  {
    id: 'e2e274-live-hy-confirm-summarize',
    prompt: 'Ամփոփիր իմ ամրագրումը',
    locale: 'hy',
    expectAction: 'confirm_my_booking_details',
    forbidEnglishChrome: true,
    requireHy: true,
  },
  {
    id: 'e2e274-live-en-confirm-summarize-regression',
    prompt: 'Summarize my booking',
    locale: 'en',
    expectAction: 'confirm_my_booking_details',
    expectSummaryIncludes:
      'Finish booking or sign in so I can read your appointment details',
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
    req.setTimeout(90000, () => req.destroy(new Error('timeout')));
    if (data) req.write(data);
    req.end();
  });
}

function hasHy(s) {
  return /[\u0530-\u058F]/.test(String(s || ''));
}

function blobFrom(d) {
  const guide = d.guide || d.details?.guide;
  const parts = [d.summary, guide?.supportHandoff?.label];
  if (guide) {
    parts.push(guide.title, guide.summary, guide.voiceSummary);
    for (const s of guide.steps || []) {
      parts.push(s.text || s.body || s.title || s.summary || '');
    }
    if (guide.supportHandoff?.ticket) {
      parts.push(
        guide.supportHandoff.ticket.subject,
        guide.supportHandoff.ticket.body,
      );
    }
  }
  return parts.filter(Boolean).join('\n');
}

function englishChromeHits(blob) {
  return ENGLISH_CHROME.filter((re) => re.test(blob)).map((re) => String(re));
}

async function main() {
  loadEnv();
  const results = [];

  for (const c of CASES) {
    const res = await request('POST', `/public/${SLUG}/assistant`, {
      prompt: c.prompt,
      assistantMode: 'act',
      locale: c.locale,
      context: { slug: SLUG },
    });
    const d = res.body?.data ?? res.body ?? {};
    const action = d.action;
    const summary = String(d.summary || '');
    const guide = d.guide || d.details?.guide;
    const handoffLabel = guide?.supportHandoff?.label;
    const blob = blobFrom(d);
    const hits = englishChromeHits(blob);

    let pass = res.status >= 200 && res.status < 300;
    if (c.expectAction) pass = pass && action === c.expectAction;
    if (c.allowActions) pass = pass && c.allowActions.includes(action);
    if (c.forbidEnglishChrome) pass = pass && hits.length === 0;
    if (c.requireHy) pass = pass && hasHy(blob);
    if (c.requireSupportHandoffLocalized) {
      pass =
        pass &&
        typeof handoffLabel === 'string' &&
        handoffLabel.length > 0 &&
        !/Still stuck\?/i.test(handoffLabel) &&
        !/stuck/i.test(handoffLabel);
    }
    if (c.expectSupportHandoffLabel) {
      pass = pass && handoffLabel === c.expectSupportHandoffLabel;
    }
    if (c.expectSummaryIncludes) {
      pass = pass && summary.includes(c.expectSummaryIncludes);
    }

    results.push({
      id: c.id,
      pass,
      detail: {
        status: res.status,
        action,
        success: d.success,
        handoffLabel: handoffLabel ?? null,
        englishHits: hits,
        hasHy: hasHy(blob),
        summary: summary.slice(0, 160).replace(/\n/g, ' | '),
      },
    });
  }

  let failed = 0;
  console.log(`e2e-bug.259 QA → ${API} ${SLUG}\n`);
  for (const row of results) {
    if (row.pass) {
      console.log(`PASS ${row.id}`, JSON.stringify(row.detail).slice(0, 300));
    } else {
      failed += 1;
      console.log(`FAIL ${row.id}`, JSON.stringify(row.detail).slice(0, 400));
    }
  }
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
