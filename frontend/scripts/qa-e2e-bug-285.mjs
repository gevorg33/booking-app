/**
 * Guru live QA for e2e-bug.285 — AI success summaries must not misread
 * DD/MM (01/08/2026) as US "January 8" when startTime is August.
 *
 * Run: node scripts/qa-e2e-bug-285.mjs
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

const MONTHS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
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
    req.setTimeout(180000, () => req.destroy(new Error('timeout')));
    if (data) req.write(data);
    req.end();
  });
}

function unwrap(body) {
  return body?.data ?? body;
}

function extractStartTimes(data) {
  const out = [];
  // Only booking/plan startTimes — ignore createdAt/updatedAt noise.
  const planSteps =
    data?.details?.plan?.steps || data?.plan?.steps || data?.details?.steps || [];
  for (const step of planSteps) {
    const st = step?.params?.startTime || step?.startTime;
    if (typeof st === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(st)) out.push(st);
  }
  const orchSteps = data?.details?.result?.steps || data?.details?.orchestration?.steps || [];
  for (const step of orchSteps) {
    const st = step?.result?.startTime || step?.params?.startTime;
    if (typeof st === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(st)) out.push(st);
  }
  for (const key of ['startTime', 'bookingStartTime']) {
    const v = data?.details?.[key];
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) out.push(v);
  }
  // partialParams / enrichedParams date as ISO day noon UTC for month check
  const day =
    data?.details?.enrichedParams?.date ||
    data?.details?.partialParams?.date ||
    data?.details?.plan?.steps?.[0]?.params?.date;
  if (typeof day === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(day)) {
    out.push(`${day}T12:00:00.000Z`);
  }
  return [...new Set(out)];
}

function monthIndexFromIso(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.getUTCMonth();
}

function summaryMonthMismatch(summary, startTimes) {
  const lower = String(summary || '').toLowerCase();
  const mentioned = MONTHS.map((name, i) => ({ name, i })).filter(({ name }) =>
    lower.includes(name),
  );
  if (mentioned.length === 0) return { mismatch: false, mentioned: [] };
  for (const start of startTimes) {
    const mi = monthIndexFromIso(start);
    if (mi == null) continue;
    if (mentioned.some(({ i }) => i !== mi)) {
      return { mismatch: true, mentioned: mentioned.map((m) => m.name), startMonth: MONTHS[mi] };
    }
  }
  return { mismatch: false, mentioned: mentioned.map((m) => m.name) };
}

async function main() {
  loadEnv();
  process.chdir(backendRoot);

  const {
    formatDateForAiLabel,
    summaryMisreadsStartTimeMonth,
  } = require(resolve(backendRoot, 'dist/modules/ai/ai-date-label.util.js'));

  const unitLabel = formatDateForAiLabel('2026-08-01');
  const unitPass =
    /august/i.test(unitLabel) &&
    !unitLabel.includes('01/08/2026') &&
    summaryMisreadsStartTimeMonth(
      'Booked for tomorrow, January 8, 2026',
      '2026-08-01T09:00:00.000Z',
    ) === true &&
    summaryMisreadsStartTimeMonth(
      'Booking created — 1 August 2026 09:00',
      '2026-08-01T09:00:00.000Z',
    ) === false;
  console.log(
    `${unitPass ? 'PASS' : 'FAIL'}  unit-ai-date-label — ${JSON.stringify({
      unitLabel,
    })}`,
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
  const emp = (
    await c.query(
      `SELECT id, name FROM employees WHERE business_id=$1 AND "isActive"=true LIMIT 1`,
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
    },
    process.env.JWT_SECRET,
    { expiresIn: '2h' },
  );
  await c.end();

  const empName = emp?.name?.split(/\s+/)[0] || 'Gevorg';
  console.log(`e2e-bug.285 QA → ${API} ${SLUG}`);

  const CASES = [
    {
      id: 'live-book-nearest-tomorrow',
      prompt: 'Book the nearest available slot for Swedish massage tomorrow',
      expectActions: ['create_booking', 'book_nearest_slot'],
      requireSuccess: false,
    },
    {
      id: 'live-book-soonest-any',
      prompt:
        'Book the soonest free slot for Face Pilling with any provider',
      expectActions: ['create_booking', 'book_nearest_slot'],
      requireSuccess: false,
    },
    {
      id: 'live-book-monday-first-available',
      prompt:
        'Book the first available Swedish massage slot on Monday for any provider',
      expectActions: ['create_booking', 'book_nearest_slot'],
      requireSuccess: false,
    },
    {
      id: 'live-reschedule-soonest-tomorrow',
      prompt: `Reschedule ${empName} appointment to the soonest free slot tomorrow`,
      expectActions: ['reschedule_booking'],
      requireSuccess: false,
    },
    {
      id: 'live-reschedule-monday-first',
      prompt: `Move ${empName}'s appointment to the first available slot Monday`,
      expectActions: ['reschedule_booking'],
      requireSuccess: false,
    },
    {
      id: 'live-reschedule-semicolon-nearest',
      prompt: `Move ${empName}'s appointment on June 1; put it June 2 nearest free time`,
      expectActions: ['reschedule_booking'],
      requireSuccess: false,
    },
  ];

  let failed = unitPass ? 0 : 1;

  for (const caze of CASES) {
    const res = await request('POST', `/businesses/${biz.id}/ai/command`, {
      token,
      body: { prompt: caze.prompt, context: { confirmed: true } },
    });
    const d = unwrap(res.body);
    const summary = String(d.summary || '');
    const starts = extractStartTimes(d);
    const planReasoning = String(
      d.details?.plan?.reasoning || d.plan?.reasoning || '',
    );
    const blob = `${summary}\n${planReasoning}`;
    const mismatch = summaryMonthMismatch(blob, starts);

    let pass = res.status >= 200 && res.status < 300;
    pass = pass && caze.expectActions.includes(d.action);
    // Core gate: if we have a startTime and the summary/reasoning names a month,
    // it must match. Also forbid classic January/March misreads when start is Aug+.
    if (starts.length > 0) {
      pass = pass && !mismatch.mismatch;
    } else if (d.success === true) {
      // Successful booking without extractable startTime — still forbid January/March
      // misreads of DD/MM when summary has slash-looking rewrite cues.
      pass = pass && !/january\s+8|march\s+8/i.test(summary);
    }
    // Ambiguous slash in plan reasoning that could feed an LLM — prefer absent.
    // Soft: if success summary uses August words or no wrong month, OK.
    const slashAmbiguous = /\b0[1-3]\/0[1-9]\/2026\b/.test(planReasoning);
    if (d.success === true && slashAmbiguous && /january|march/i.test(summary)) {
      pass = false;
    }

    console.log(
      `${pass ? 'PASS' : 'FAIL'}  ${caze.id} — ${JSON.stringify({
        status: res.status,
        action: d.action,
        success: d.success,
        starts: starts.slice(0, 3),
        mismatch,
        slashInReasoning: slashAmbiguous,
        summary: summary.slice(0, 160),
        reasoning: planReasoning.slice(0, 120),
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
