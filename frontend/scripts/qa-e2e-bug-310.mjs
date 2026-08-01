/**
 * Guru live QA for e2e-bug.310 — HY last-week (անցած/նախորդ/անցյալ/վերջին)
 * calendar tour lists must deterministically anchor last Mon–Sun.
 *
 * Run: node frontend/scripts/qa-e2e-bug-310.mjs
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

function mondayOf(anchor, addDaysToDateKey) {
  const d = new Date(`${anchor}T12:00:00.000Z`);
  const day = d.getUTCDay();
  const delta = day === 0 ? -6 : 1 - day;
  return addDaysToDateKey(anchor, delta, 'UTC');
}

async function main() {
  loadEnv();
  process.chdir(backendRoot);

  const {
    isListTourCalendarWeekPrompt,
    parseListTourCalendarWeekFromPrompt,
  } = require(resolve(
    backendRoot,
    'dist/modules/ai/ai-tour-calendar-week.util.js',
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
  const nextMon = mondayOf(addDaysToDateKey(today, 7, 'UTC'), addDaysToDateKey);
  const lastMon = mondayOf(addDaysToDateKey(today, -7, 'UTC'), addDaysToDateKey);
  const thisMon = mondayOf(today, addDaysToDateKey);
  const expectedByRelative = {
    next: nextMon,
    last: lastMon,
    this: thisMon,
  };

  const canonical = 'Անցած շաբաթվա էքսկուրսիաները օրացույցում';
  record(
    'unit-hy-ancac-detect',
    isListTourCalendarWeekPrompt(canonical) === true,
    { isWeek: isListTourCalendarWeekPrompt(canonical) },
  );
  record(
    'unit-hy-ancac-weekStart',
    parseListTourCalendarWeekFromPrompt(canonical)?.weekStartDate ===
      addDaysToDateKey(today, -7, 'UTC'),
    {
      weekStart: parseListTourCalendarWeekFromPrompt(canonical)?.weekStartDate,
      expected: addDaysToDateKey(today, -7, 'UTC'),
    },
  );
  record(
    'unit-hy-nakhord-weekStart',
    parseListTourCalendarWeekFromPrompt(
      'Նախորդ շաբաթվա էքսկուրսիաները օրացույցում',
    )?.weekStartDate === addDaysToDateKey(today, -7, 'UTC'),
    {
      weekStart: parseListTourCalendarWeekFromPrompt(
        'Նախորդ շաբաթվա էքսկուրսիաները օրացույցում',
      )?.weekStartDate,
    },
  );
  record(
    'unit-hy-override-classifier',
    parseListTourCalendarWeekFromPrompt(canonical, {
      weekStartDate: 'this week',
    })?.weekStartDate === addDaysToDateKey(today, -7, 'UTC'),
    {
      weekStart: parseListTourCalendarWeekFromPrompt(canonical, {
        weekStartDate: 'this week',
      })?.weekStartDate,
    },
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

  console.log(`e2e-bug.310 QA → ${API} ${SLUG}\n`);

  const liveCases = [
    {
      id: 'live-hy-ancac-canonical',
      prompt: canonical,
      locale: 'hy',
      expectWeekRelative: 'last',
    },
    {
      id: 'live-hy-ancac-show',
      prompt: 'Ցույց տուր անցած շաբաթվա էքսկուրսիաները օրացույցում',
      locale: 'hy',
      expectWeekRelative: 'last',
    },
    {
      id: 'live-hy-nakhord',
      prompt: 'Նախորդ շաբաթվա էքսկուրսիաները օրացույցում',
      locale: 'hy',
      expectWeekRelative: 'last',
    },
    {
      id: 'live-hy-ancyal',
      prompt: 'անցյալ շաբաթվա տուրերը օրացույցում',
      locale: 'hy',
      expectWeekRelative: 'last',
    },
    {
      id: 'live-hy-verjin',
      prompt: 'Վերջին շաբաթվա էքսկուրսիաները օրացույցում',
      locale: 'hy',
      expectWeekRelative: 'last',
    },
    {
      id: 'live-hy-next-control',
      prompt: 'Ցույց տուր հաջորդ շաբաթվա էքսկուրսիաները օրացույցում',
      locale: 'hy',
      expectWeekRelative: 'next',
    },
    {
      id: 'live-hy-this-control',
      prompt: 'այս շաբաթվա էքսկուրսիաները օրացույցում',
      locale: 'hy',
      expectWeekRelative: 'this',
    },
    {
      id: 'live-en-last-regression',
      prompt: 'Any tours last week?',
      locale: 'en',
      expectWeekRelative: 'last',
    },
    {
      id: 'live-ru-last-regression',
      prompt: 'Туры на прошлой неделе в календаре',
      locale: 'ru',
      expectWeekRelative: 'last',
    },
  ];

  // Stability: same canonical last-week prompt must never flip to this week.
  for (let i = 1; i <= 5; i++) {
    liveCases.push({
      id: `live-hy-ancac-stability-${i}`,
      prompt: canonical,
      locale: 'hy',
      expectWeekRelative: 'last',
    });
  }

  for (const c of liveCases) {
    const { status, data } = await dashboardAi(c.prompt, c.locale);
    const action = data?.action || data?.intent || '';
    const summary = String(data?.summary || '');
    const weekStart =
      data?.weekStartDate ||
      data?.params?.weekStartDate ||
      data?.details?.weekStartDate ||
      data?.result?.weekStartDate;
    const expectMon = expectedByRelative[c.expectWeekRelative];
    const actionOk = action === 'list_tour_calendar_week';
    const weekOk = weekStart === expectMon;
    const forbidThisWhenLast =
      c.expectWeekRelative !== 'last' || weekStart !== thisMon;
    const pass =
      (status === 200 || status === 201) &&
      actionOk &&
      weekOk &&
      forbidThisWhenLast;
    record(c.id, pass, {
      status,
      action,
      summary: summary.slice(0, 160),
      weekStart,
      expectMon,
      actionOk,
      weekOk,
    });
  }

  const failed = results.filter((r) => !r.pass);
  console.log(
    `\ne2e-bug.310: ${results.length - failed.length}/${results.length} passed`,
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
