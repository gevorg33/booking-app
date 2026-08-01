/**
 * Manual live QA for e2e-bug.258 — short Armenian "Ինչպես ամրագրել" must
 * route to booking_help (not confirm_my_booking_details + English clarify).
 *
 * Guru edge coverage: short stem, question-mark form, visit without step-by-step,
 * imperative, full քայլ առ քայլ regression, RU parity, EN regression, and
 * true confirm reads that must not flip to booking_help.
 *
 * Run: node scripts/qa-e2e-bug-258.mjs
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(__dirname, '../../backend');

const SLUG = process.env.SALON_SLUG || 'gevgas-operations-7c299253';
const API = process.env.API_BASE || 'http://127.0.0.1:3001';

const ENGLISH_CONFIRM_CLARIFY =
  /Finish booking or sign in so I can read your appointment details/i;

const CASES = [
  {
    id: 'e2e258-hy-short-how-book',
    prompt: 'Ինչպես ամրագրել',
    locale: 'hy',
    expectAction: 'booking_help',
    forbidEnglishClarify: true,
    requireHy: true,
  },
  {
    id: 'e2e258-hy-short-how-book-question-mark',
    prompt: 'Ինչպե՞ս ամրագրել',
    locale: 'hy',
    expectAction: 'booking_help',
    forbidEnglishClarify: true,
    requireHy: true,
  },
  {
    id: 'e2e258-hy-how-book-visit-no-step',
    prompt: 'Ինչպես ամրագրել այցելություն',
    locale: 'hy',
    expectAction: 'booking_help',
    forbidEnglishClarify: true,
    requireHy: true,
  },
  {
    id: 'e2e258-hy-how-book-imperative',
    prompt: 'Ինչպես ամրագրեմ',
    locale: 'hy',
    expectAction: 'booking_help',
    forbidEnglishClarify: true,
    requireHy: true,
  },
  {
    id: 'e2e258-hy-full-step-by-step',
    prompt: 'Ինչպե՞ս ամրագրել այցելություն քայլ առ քայլ',
    locale: 'hy',
    expectAction: 'booking_help',
    forbidEnglishClarify: true,
    requireHy: true,
  },
  {
    id: 'e2e258-ru-kak-zapisatsya',
    prompt: 'Как записаться',
    locale: 'ru',
    expectAction: 'booking_help',
    forbidEnglishClarify: true,
  },
  {
    id: 'e2e258-en-how-book-regression',
    prompt: 'How do I book an appointment?',
    locale: 'en',
    expectAction: 'booking_help',
    forbidEnglishClarify: false,
  },
  {
    id: 'e2e258-hy-confirm-time',
    prompt: 'Ինչ ժամի է իմ ամրագրումը?',
    locale: 'hy',
    expectAction: 'confirm_my_booking_details',
    forbidAction: 'booking_help',
  },
  {
    id: 'e2e258-hy-confirm-summarize',
    prompt: 'Ամփոփիր իմ ամրագրումը',
    locale: 'hy',
    expectAction: 'confirm_my_booking_details',
    forbidAction: 'booking_help',
  },
  {
    id: 'e2e258-hy-confirm-just-booked',
    prompt: 'Ի՞նչ ամրագրում եմ արել հենց հիմա',
    locale: 'hy',
    expectAction: 'confirm_my_booking_details',
    forbidAction: 'booking_help',
  },
  {
    id: 'e2e258-hy-confirm-provider',
    prompt: 'Ովի հետ է ամրագրումս?',
    locale: 'hy',
    expectAction: 'confirm_my_booking_details',
    forbidAction: 'booking_help',
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
  const guide = d.guide || d.details?.guide || d.data?.guide;
  const parts = [d.summary];
  if (guide) {
    parts.push(guide.title, guide.summary, guide.voiceSummary);
    for (const s of guide.steps || []) {
      parts.push(s.text || s.body || s.title || s.summary || '');
    }
  }
  return parts.filter(Boolean).join('\n');
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
    const blob = blobFrom(d);
    const englishClarify = ENGLISH_CONFIRM_CLARIFY.test(summary + '\n' + blob);

    let pass = res.status >= 200 && res.status < 300;
    if (c.expectAction) pass = pass && action === c.expectAction;
    if (c.forbidAction) pass = pass && action !== c.forbidAction;
    if (c.forbidEnglishClarify) pass = pass && !englishClarify;
    if (c.requireHy && action === 'booking_help') {
      // Prefer Armenian guide copy; allow empty steps if summary is hy.
      pass = pass && (hasHy(blob) || hasHy(summary));
    }

    results.push({
      id: c.id,
      pass,
      detail: {
        status: res.status,
        action,
        success: d.success,
        englishClarify,
        hasHy: hasHy(blob),
        summary: summary.slice(0, 160).replace(/\n/g, ' | '),
      },
    });
  }

  let failed = 0;
  console.log(`e2e-bug.258 QA → ${API} ${SLUG}\n`);
  for (const row of results) {
    if (row.pass) {
      console.log(`PASS ${row.id}`, JSON.stringify(row.detail).slice(0, 280));
    } else {
      failed += 1;
      console.log(`FAIL ${row.id}`, JSON.stringify(row.detail).slice(0, 360));
    }
  }
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
