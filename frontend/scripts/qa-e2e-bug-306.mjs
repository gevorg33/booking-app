/**
 * Guru live QA for e2e-bug.306 — no-slot / empty availability failure
 * summaries must not embed DD/MM slash dates (02/08/2026).
 *
 * Run: node frontend/scripts/qa-e2e-bug-306.mjs
 * Requires: API on :3001
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(__dirname, '../../backend');
const require = createRequire(resolve(backendRoot, 'package.json'));

const SLUG = process.env.SALON_SLUG || 'gevgas-operations-7c299253';
const API = process.env.API_BASE || 'http://127.0.0.1:3001';
const SLASH_RE = /\b\d{2}\/\d{2}\/\d{4}\b/;

const CASES = [
  {
    id: 'live-first-available-far-sunday',
    // Far Sunday often yields no bookable slot on this salon.
    prompt:
      'Book the first available Swedish massage on Sunday August 2 2026 for any provider',
    expectActions: [
      'book_nearest_slot',
      'create_booking',
      'check_providers_for_service',
      'compound_intent',
    ],
    whenFailureForbidSlash: true,
  },
  {
    id: 'live-nearest-aug-3',
    prompt: 'Book nearest Swedish massage slot on 3 August 2026',
    expectActions: [
      'book_nearest_slot',
      'create_booking',
      'check_providers_for_service',
      'compound_intent',
    ],
    whenFailureForbidSlash: true,
  },
  {
    id: 'live-check-providers-evening-far',
    prompt:
      'Who is free for Swedish massage on Sunday August 2 2026 in the evening?',
    expectActions: [
      'check_providers_for_service',
      'check_availability',
      'compound_intent',
    ],
    whenFailureForbidSlash: true,
  },
  {
    id: 'live-reschedule-nearest-far',
    prompt:
      "Move Gevorg's appointment to the nearest free time on Sunday August 2 2026",
    expectActions: ['reschedule_booking', 'book_nearest_slot', 'compound_intent'],
    whenFailureForbidSlash: true,
  },
  // controls — success paths from 285 must still avoid slash
  {
    id: 'ctrl-success-create-label',
    prompt: 'Book a Swedish massage for Anna on Friday August 7 2026 at 10:00',
    expectActions: ['create_booking', 'compound_intent'],
    forbidSlashAlways: true,
  },
  {
    id: 'unit-shape-no-bookable',
    // exercised via API only if failure; also assert unit-shaped probe below
    skipLive: true,
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

function request(method, path, { token, body } = {}) {
  return new Promise((resolvePromise, reject) => {
    const data = body ? JSON.stringify(body) : '';
    const url = new URL(path, API);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (d) => (raw += d));
        res.on('end', () => {
          try {
            resolvePromise({
              status: res.statusCode,
              body: JSON.parse(raw || '{}'),
            });
          } catch (e) {
            reject(e);
          }
        });
      },
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function unwrap(body) {
  return body?.data ?? body;
}

function assertCase(c, d) {
  const errors = [];
  const summary = String(d?.summary || '');
  const detailsDate = d?.details?.date != null ? String(d.details.date) : '';
  const blob = `${summary}\n${detailsDate}`;

  if (c.expectActions && !c.expectActions.includes(d?.action)) {
    // soft: still check slash if we got a booking-ish failure
  }

  const looksLikeNoSlot =
    /no bookable slot|no open slot|no providers are free|no one is available/i.test(
      summary,
    );

  if (c.forbidSlashAlways && SLASH_RE.test(blob)) {
    errors.push(`slash date in summary/details: ${blob.match(SLASH_RE)?.[0]}`);
  }
  if (c.whenFailureForbidSlash && looksLikeNoSlot && SLASH_RE.test(blob)) {
    errors.push(
      `no-slot failure still has slash date ${blob.match(SLASH_RE)?.[0]}`,
    );
  }
  if (looksLikeNoSlot && !/August|June|July|September|October|November|December|January|February|March|April|May/i.test(summary) && /\d{4}/.test(summary)) {
    // if year present without month name, likely slash or ISO — ISO YYYY-MM-DD is ok
    if (SLASH_RE.test(summary)) {
      errors.push('no-slot has slash without month name');
    }
  }

  return { errors, looksLikeNoSlot, summary };
}

async function main() {
  loadEnv();
  process.chdir(backendRoot);

  // Unit-shaped probe against dist (always).
  const {
    buildNoNearestSlotMessage,
    buildNoProvidersAvailableMessage,
  } = await import(
    resolve(backendRoot, 'dist/modules/ai/ai-booking-slot-messages.util.js')
  );
  const { buildRescheduleFirstAvailableNoSlotMessage } = await import(
    resolve(backendRoot, 'dist/modules/ai/ai-booking-reschedule-hints.util.js')
  );

  console.log(`e2e-bug.306 QA → ${API} ${SLUG}`);
  let passed = 0;
  let total = 0;
  let noSlotSeen = 0;

  const unitCases = [
    {
      id: 'unit-no-bookable-aug-2',
      fn: () =>
        buildNoNearestSlotMessage({
          serviceName: 'Swedish massage',
          dateKey: '2026-08-02',
        }),
      expect: '2 August 2026',
      forbid: '02/08/2026',
    },
    {
      id: 'unit-no-providers-aug-3',
      fn: () =>
        buildNoProvidersAvailableMessage({
          serviceName: 'Swedish massage',
          dateKey: '2026-08-03',
        }),
      expect: '3 August 2026',
      forbid: '03/08/2026',
    },
    {
      id: 'unit-reschedule-open-slot',
      fn: () =>
        buildRescheduleFirstAvailableNoSlotMessage(
          'Swedish massage',
          'Gevorg',
          { date: '2026-08-02' },
          '',
        ),
      expect: '2 August 2026',
      forbid: '02/08/2026',
    },
  ];

  for (const u of unitCases) {
    total += 1;
    const msg = u.fn();
    if (!msg.includes(u.expect) || msg.includes(u.forbid) || SLASH_RE.test(msg)) {
      console.log(`FAIL ${u.id}`);
      console.log(`  msg=${JSON.stringify(msg)}`);
    } else {
      passed += 1;
      console.log(`PASS ${u.id}`);
    }
  }

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

  for (const caze of CASES) {
    if (caze.skipLive) continue;
    total += 1;
    const res = await request('POST', `/businesses/${biz.id}/ai/command`, {
      token,
      body: { prompt: caze.prompt, context: { confirmed: true } },
    });
    const d = unwrap(res.body);
    const { errors, looksLikeNoSlot, summary } = assertCase(caze, d);
    if (looksLikeNoSlot) noSlotSeen += 1;
    if (errors.length) {
      console.log(`FAIL ${caze.id}`);
      for (const e of errors) console.log(`  - ${e}`);
      console.log(
        `  action=${d.action} success=${d.success} summary=${JSON.stringify(summary.slice(0, 180))}`,
      );
    } else {
      passed += 1;
      const note = looksLikeNoSlot ? ' [no-slot failure — no slash]' : '';
      console.log(`PASS ${caze.id}${note}`);
    }
  }

  console.log(
    `\n${passed}/${total} passed (live no-slot failures seen: ${noSlotSeen})`,
  );
  if (noSlotSeen === 0) {
    console.log(
      'WARN: no live no-slot failure this run — unit probes still gate slash dates.',
    );
  }
  if (passed !== total) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
