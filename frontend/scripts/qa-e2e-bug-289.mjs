/**
 * Guru live QA for e2e-bug.289 — HY list_tour_calendar_week success/empty
 * summary must stay Armenian (not English). Also covers RU + EN + next/last
 * week + no DD/MM slash (e2e-bug.308 sibling).
 *
 * Run: node scripts/qa-e2e-bug-289.mjs
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

const HY_EMPTY_RE = /հաստատված էքսկուրսիայի մեկնարկներ չկան|շաբաթվա համար|էքսկուրսիայի մեկնարկ/u;
const RU_EMPTY_RE = /нет подтверждённых выездов туров|календарной неделе|выезд/u;
const EN_EMPTY_RE = /No confirmed tour departures|tour departure/i;
const SLASH_DDMM_RE = /\d{2}\/\d{2}\/\d{4}/;
const EN_BUG_CUES = [
  'No confirmed tour departures',
  'There are no confirmed tour departures',
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

function request(method, path, { token, body } = {}) {
  return new Promise((resolvePromise, reject) => {
    const data = body != null ? JSON.stringify(body) : null;
    const url = new URL(path, API);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port || 3001,
        path: url.pathname + url.search,
        method,
        headers: {
          ...(data
            ? {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
              }
            : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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
  const { Client } = require('pg');
  const jwt = require('jsonwebtoken');
  const {
    resolveTourCalendarWeekLocale,
  } = require(resolve(
    backendRoot,
    'dist/modules/ai/ai-tour-calendar-week.logic.js',
  ));
  const { isAiDateGroundedBookingAction } = require(resolve(
    backendRoot,
    'dist/modules/ai/ai-date-label.util.js',
  ));

  const c = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD || undefined,
    database: process.env.DB_NAME,
  });
  await c.connect();

  const biz = (
    await c.query('SELECT id FROM businesses WHERE slug=$1', [SLUG])
  ).rows[0];
  if (!biz) throw new Error(`business not found: ${SLUG}`);

  const member = (
    await c.query(
      `SELECT bm.user_id, bm.role, u.email, u.role AS user_role
       FROM business_members bm
       JOIN users u ON u.id = bm.user_id
       WHERE bm.business_id=$1 AND bm.role='owner' LIMIT 1`,
      [biz.id],
    )
  ).rows[0];
  if (!member) throw new Error('no owner membership');

  const token = jwt.sign(
    {
      sub: member.user_id,
      email: String(member.email).toLowerCase(),
      role: member.user_role,
      businessId: biz.id,
      membershipRole: member.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: '2h' },
  );
  await c.end();

  const results = [];

  async function dashboardAi(prompt, locale) {
    const res = await request('POST', `/businesses/${biz.id}/ai/command`, {
      token,
      body: {
        prompt,
        context: {
          confirmed: true,
          sessionId: `e289-${Date.now()}`,
          ...(locale ? { locale } : {}),
        },
      },
    });
    return { status: res.status, data: unwrap(res.body) };
  }

  function record(id, pass, detail) {
    results.push({ id, pass, detail });
    console.log(
      `${pass ? 'PASS' : 'FAIL'}  ${id} — ${JSON.stringify(detail).slice(0, 400)}`,
    );
  }

  console.log(`e2e-bug.289 QA → ${API} ${SLUG}\n`);

  // Unit-side guards (compiled dist).
  record(
    'det-skip-enrich-action',
    isAiDateGroundedBookingAction('list_tour_calendar_week') === true,
    { grounded: isAiDateGroundedBookingAction('list_tour_calendar_week') },
  );
  record(
    'det-hy-locale-from-prompt',
    resolveTourCalendarWeekLocale({}, 'Ցուցադրիր այս շաբաթվա էքսկուրսիաները') ===
      'hy',
    {
      locale: resolveTourCalendarWeekLocale(
        {},
        'Ցուցադրիր այս շաբաթվա էքսկուրսիաները',
      ),
    },
  );
  record(
    'det-hy-beats-en-session',
    resolveTourCalendarWeekLocale(
      { locale: 'en' },
      'Ցուցադրիր այս շաբաթվա էքսկուրսիաները',
    ) === 'hy',
    {
      locale: resolveTourCalendarWeekLocale(
        { locale: 'en' },
        'Ցուցադրիր այս շաբաթվա էքսկուրսիաները',
      ),
    },
  );
  record(
    'det-ru-locale-from-prompt',
    resolveTourCalendarWeekLocale({}, 'Покажи туры на этой неделе') === 'ru',
    {
      locale: resolveTourCalendarWeekLocale({}, 'Покажи туры на этой неделе'),
    },
  );

  const liveCases = [
    {
      id: 'live-hy-canonical-pax',
      prompt: 'Ցուցադրիր այս շաբաթվա էքսկուրսիաները օրացույցում pax-ով',
      locale: 'hy',
      expectAction: 'list_tour_calendar_week',
      expectLang: 'hy',
    },
    {
      id: 'live-hy-short',
      prompt: 'Այս շաբաթվա էքսկուրսիաները օրացույցում',
      locale: 'hy',
      expectAction: 'list_tour_calendar_week',
      expectLang: 'hy',
    },
    {
      id: 'live-hy-next-week',
      prompt: 'Ցույց տուր հաջորդ շաբաթվա էքսկուրսիաները օրացույցում',
      locale: 'hy',
      expectAction: 'list_tour_calendar_week',
      expectLang: 'hy',
    },
    {
      id: 'live-hy-last-week',
      prompt: 'Անցած շաբաթվա էքսկուրսիաները օրացույցում',
      locale: 'hy',
      expectAction: 'list_tour_calendar_week',
      expectLang: 'hy',
    },
    {
      id: 'live-hy-no-context-locale',
      prompt: 'Ցուցադրիր այս շաբաթվա էքսկուրսիաները օրացույցում pax-ով',
      expectAction: 'list_tour_calendar_week',
      expectLang: 'hy',
    },
    {
      id: 'live-hy-with-en-context',
      prompt: 'Ցուցադրիր այս շաբաթվա էքսկուրսիաները օրացույցում',
      locale: 'en',
      expectAction: 'list_tour_calendar_week',
      expectLang: 'hy',
    },
    {
      id: 'live-ru-canonical',
      prompt: 'Покажи туры на этой неделе в календаре с pax',
      locale: 'ru',
      expectAction: 'list_tour_calendar_week',
      expectLang: 'ru',
    },
    {
      id: 'live-ru-this-week-calendar',
      prompt: 'Какие туры на этой неделе в календаре?',
      locale: 'ru',
      expectAction: 'list_tour_calendar_week',
      expectLang: 'ru',
    },
    // Residual probe e2e-bug.309 — must NOT fail this suite; logged separately.
    {
      id: 'live-ru-next-week-residual-309',
      prompt: 'Какие туры на следующей неделе в календаре?',
      locale: 'ru',
      expectAction: 'list_tour_calendar_week',
      expectLang: 'ru',
      residual: true,
    },
    {
      id: 'live-en-canonical',
      prompt: 'List tour departures on the provider calendar this week',
      locale: 'en',
      expectAction: 'list_tour_calendar_week',
      expectLang: 'en',
    },
    {
      id: 'live-en-any-this-week',
      prompt: 'Any tours this week?',
      expectAction: 'list_tour_calendar_week',
      expectLang: 'en',
    },
    {
      id: 'live-en-any-last-week-no-slash',
      prompt: 'Any tours last week?',
      expectAction: 'list_tour_calendar_week',
      expectLang: 'en',
      forbidSlash: true,
    },
    {
      id: 'live-en-any-next-week-no-slash',
      prompt: 'Any tours next week?',
      expectAction: 'list_tour_calendar_week',
      expectLang: 'en',
      forbidSlash: true,
    },
  ];

  for (const caze of liveCases) {
    const { status, data } = await dashboardAi(caze.prompt, caze.locale);
    const action = data?.action;
    const summary = String(data?.summary || '');
    const actionOk = action === caze.expectAction;
    let langOk = false;
    if (caze.expectLang === 'hy') {
      langOk =
        HY_EMPTY_RE.test(summary) &&
        !EN_BUG_CUES.some((cue) => summary.includes(cue));
    } else if (caze.expectLang === 'ru') {
      langOk =
        RU_EMPTY_RE.test(summary) &&
        !EN_BUG_CUES.some((cue) => summary.includes(cue));
    } else {
      langOk = EN_EMPTY_RE.test(summary);
    }
    const noSlash =
      caze.forbidSlash === false ? true : !SLASH_DDMM_RE.test(summary);
    const pass =
      status >= 200 &&
      status < 300 &&
      actionOk &&
      langOk &&
      noSlash &&
      action !== 'error';
    if (caze.residual) {
      console.log(
        `${pass ? 'NOTE' : 'RESIDUAL'}  ${caze.id} — ${JSON.stringify({
          status,
          action,
          expect: caze.expectAction,
          summary: summary.slice(0, 180),
        }).slice(0, 400)}`,
      );
      continue;
    }
    record(caze.id, pass, {
      status,
      action,
      expectLang: caze.expectLang,
      langOk,
      noSlash,
      summary: summary.slice(0, 220),
    });
  }

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass);
  console.log(
    `\ne2e-bug.289 QA → ${API} ${SLUG} — ${passed}/${results.length} PASS`,
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
