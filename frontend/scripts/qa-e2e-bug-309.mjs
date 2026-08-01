/**
 * Guru live QA for e2e-bug.309 — RU next/last-week calendar tour lists must
 * route to list_tour_calendar_week (not upcoming-departures clarify).
 *
 * Run: node frontend/scripts/qa-e2e-bug-309.mjs
 * Requires: API on :3001
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

const UPCOMING_CLARIFY_RE =
  /Ask to list upcoming tour departures|remaining capacity/i;

async function main() {
  loadEnv();
  process.chdir(backendRoot);

  const {
    isListTourCalendarWeekPrompt,
    parseListTourCalendarWeekFromPrompt,
    rescueListTourCalendarWeekIntent,
  } = require(resolve(
    backendRoot,
    'dist/modules/ai/ai-tour-calendar-week.util.js',
  ));
  const { AiIntentRescueService } = require(resolve(
    backendRoot,
    'dist/modules/ai/ai-intent-rescue.service.js',
  ));
  const { addDaysToDateKey } = require(resolve(
    backendRoot,
    'dist/common/utils/timezone.util.js',
  ));
  const { getTodayDateKey } = require(resolve(
    backendRoot,
    'dist/common/utils/date-format.util.js',
  ));

  const results = [];
  function record(id, pass, detail) {
    results.push({ id, pass, detail });
    console.log(
      `${pass ? 'PASS' : 'FAIL'}  ${id} — ${JSON.stringify(detail).slice(0, 360)}`,
    );
  }

  const today = getTodayDateKey('UTC');
  const nextWeek = addDaysToDateKey(today, 7, 'UTC');
  const lastWeek = addDaysToDateKey(today, -7, 'UTC');
  // buildWeekDateKeys snaps anchors to Monday — compare Mon keys.
  function mondayOf(anchor) {
    const d = new Date(`${anchor}T12:00:00.000Z`);
    const day = d.getUTCDay(); // 0 Sun … 6 Sat
    const delta = day === 0 ? -6 : 1 - day;
    return addDaysToDateKey(anchor, delta, 'UTC');
  }
  const nextMon = mondayOf(nextWeek);
  const lastMon = mondayOf(lastWeek);
  const thisMon = mondayOf(today);

  const canonical = 'Какие туры на следующей неделе в календаре?';
  record(
    'unit-ru-next-detect',
    isListTourCalendarWeekPrompt(canonical) === true,
    { isWeek: isListTourCalendarWeekPrompt(canonical) },
  );
  record(
    'unit-ru-next-weekStart',
    parseListTourCalendarWeekFromPrompt(canonical)?.weekStartDate === nextWeek,
    {
      weekStart: parseListTourCalendarWeekFromPrompt(canonical)?.weekStartDate,
      expected: nextWeek,
    },
  );
  record(
    'unit-ru-next-rescue',
    rescueListTourCalendarWeekIntent(
      canonical,
      'list_upcoming_tour_departures',
    )?.action === 'list_tour_calendar_week',
    {
      action: rescueListTourCalendarWeekIntent(
        canonical,
        'list_upcoming_tour_departures',
      )?.action,
    },
  );
  record(
    'unit-ru-last-detect',
    isListTourCalendarWeekPrompt('Туры на прошлой неделе в календаре') === true &&
      parseListTourCalendarWeekFromPrompt('Туры на прошлой неделе в календаре')
        ?.weekStartDate === lastWeek,
    {
      weekStart: parseListTourCalendarWeekFromPrompt(
        'Туры на прошлой неделе в календаре',
      )?.weekStartDate,
      expected: lastWeek,
    },
  );
  record(
    'unit-ru-this-still',
    isListTourCalendarWeekPrompt('Какие туры на этой неделе в календаре?') ===
      true,
    {},
  );

  const rescue = new AiIntentRescueService();
  const rescued = rescue.rescue({
    prompt: canonical,
    action: 'list_upcoming_tour_departures',
    params: {},
    surface: 'dashboard',
  });
  record(
    'unit-rescue-service',
    rescued.action === 'list_tour_calendar_week',
    { action: rescued.action, reason: rescued.rescueReason },
  );

  const { Client } = require('pg');
  const jwt = require('jsonwebtoken');

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

  const emp = (
    await c.query(
      `SELECT id FROM employees WHERE business_id=$1 AND "isActive"=true LIMIT 1`,
      [biz.id],
    )
  ).rows[0];

  const token = jwt.sign(
    {
      sub: member.user_id,
      email: String(member.email).toLowerCase(),
      role: member.user_role,
      businessId: biz.id,
      membershipRole: member.role,
      employeeId: emp?.id ?? null,
    },
    process.env.JWT_SECRET,
    { expiresIn: '2h' },
  );
  await c.end();

  async function dashboardAi(prompt, locale) {
    const res = await request('POST', `/businesses/${biz.id}/ai/command`, {
      token,
      body: {
        prompt,
        context: {
          ...(locale ? { locale } : {}),
        },
      },
    });
    return { status: res.status, data: unwrap(res.body) };
  }

  console.log(`e2e-bug.309 QA → ${API} ${SLUG}\n`);

  const liveCases = [
    {
      id: 'live-ru-next-week-calendar',
      prompt: canonical,
      locale: 'ru',
      expectAction: 'list_tour_calendar_week',
      forbidUpcoming: true,
      expectWeekStart: nextMon,
    },
    {
      id: 'live-ru-next-week-short',
      prompt: 'Какие туры на следующей неделе?',
      locale: 'ru',
      expectAction: 'list_tour_calendar_week',
      forbidUpcoming: true,
      expectWeekStart: nextMon,
    },
    {
      id: 'live-ru-last-week-calendar',
      prompt: 'Туры на прошлой неделе в календаре',
      locale: 'ru',
      expectAction: 'list_tour_calendar_week',
      forbidUpcoming: true,
      expectWeekStart: lastMon,
    },
    {
      id: 'live-ru-last-week-question',
      prompt: 'Какие туры были на прошлой неделе в календаре?',
      locale: 'ru',
      expectAction: 'list_tour_calendar_week',
      forbidUpcoming: true,
      expectWeekStart: lastMon,
    },
    {
      id: 'live-ru-this-week-control',
      prompt: 'Какие туры на этой неделе в календаре?',
      locale: 'ru',
      expectAction: 'list_tour_calendar_week',
      forbidUpcoming: true,
      expectWeekStart: thisMon,
    },
    {
      id: 'live-ru-next-provider-calendar',
      prompt: 'Покажи туры на следующей неделе на календаре провайдера',
      locale: 'ru',
      expectAction: 'list_tour_calendar_week',
      forbidUpcoming: true,
      forbidSpan: true,
      expectWeekStart: nextMon,
    },
    {
      id: 'live-ru-excursions-next',
      prompt: 'Какие экскурсии на следующей неделе в календаре?',
      locale: 'ru',
      expectAction: 'list_tour_calendar_week',
      forbidUpcoming: true,
      expectWeekStart: nextMon,
    },
    {
      id: 'live-ru-next-calendar-week-word',
      prompt: 'Покажи туры на следующей календарной неделе',
      locale: 'ru',
      expectAction: 'list_tour_calendar_week',
      forbidUpcoming: true,
      expectWeekStart: nextMon,
    },
    {
      id: 'live-en-next-regression',
      prompt: 'Any tours next week?',
      locale: 'en',
      expectAction: 'list_tour_calendar_week',
      forbidUpcoming: true,
      expectWeekStart: nextMon,
    },
    {
      id: 'live-en-provider-next-regression',
      prompt: 'Show tours for next week on the provider calendar',
      locale: 'en',
      expectAction: 'list_tour_calendar_week',
      forbidUpcoming: true,
      forbidSpan: true,
      expectWeekStart: nextMon,
      forbidProviderMissing: true,
    },
    {
      id: 'live-hy-next-regression',
      prompt: 'Ցույց տուր հաջորդ շաբաթվա էքսկուրսիաները օրացույցում',
      locale: 'hy',
      expectAction: 'list_tour_calendar_week',
      forbidUpcoming: true,
      expectWeekStart: nextMon,
    },
    {
      id: 'live-neg-ru-upcoming-capacity',
      prompt: 'Покажи предстоящие выезды туров с оставшимися местами',
      locale: 'ru',
      forbidWeek: true,
    },
    {
      id: 'live-neg-ru-span-explain',
      prompt:
        'Почему тур отображается на несколько дней на календаре провайдера',
      locale: 'ru',
      expectAction: 'explain_tour_calendar_span',
      forbidWeek: true,
    },
  ];

  for (const c of liveCases) {
    const { status, data } = await dashboardAi(c.prompt, c.locale);
    const action = data?.action || data?.intent || '';
    const summary = String(data?.summary || '');
    const actionOk = c.expectAction
      ? action === c.expectAction
      : c.forbidWeek
        ? action !== 'list_tour_calendar_week'
        : true;
    const forbidOk = c.forbidUpcoming
      ? action !== 'list_upcoming_tour_departures'
      : true;
    const spanOk = c.forbidSpan
      ? action !== 'explain_tour_calendar_span'
      : true;
    const clarifyOk = !UPCOMING_CLARIFY_RE.test(summary);
    const weekStart =
      data?.weekStartDate ||
      data?.params?.weekStartDate ||
      data?.details?.weekStartDate ||
      data?.result?.weekStartDate ||
      data?.data?.weekStartDate;
    const weekOk = c.expectWeekStart
      ? weekStart === c.expectWeekStart
      : true;
    const providerOk = c.forbidProviderMissing
      ? !/Could not find provider|не найден провайдер/i.test(summary)
      : true;
    const pass =
      (status === 200 || status === 201) &&
      actionOk &&
      forbidOk &&
      spanOk &&
      clarifyOk &&
      weekOk &&
      providerOk;
    record(c.id, pass, {
      status,
      action,
      summary: summary.slice(0, 180),
      weekStart,
      expectWeekStart: c.expectWeekStart,
      actionOk,
      forbidOk,
      spanOk,
      clarifyOk,
      weekOk,
      providerOk,
    });
  }

  const failed = results.filter((r) => !r.pass);
  console.log(
    `\ne2e-bug.309: ${results.length - failed.length}/${results.length} passed`,
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
