/**
 * Manual live QA for e2e-bug.255 — concurrent provider ready_now / running_late
 * serialization (e2e-bug.74 sibling). Same e2e-bug.184 residual: FOR UPDATE must
 * not LEFT JOIN nullable relations.
 *
 * Guru edge coverage: first write, idempotent re-tap, concurrent notify-once,
 * late minutes change renotify, ready-after-late, not-checked-in / cancelled /
 * completed rejects.
 *
 * Run: node scripts/qa-e2e-bug-255.mjs
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
    req.setTimeout(60000, () => req.destroy(new Error('timeout')));
    if (data) req.write(data);
    req.end();
  });
}

function msgOf(body) {
  const m = body?.message ?? body?.data?.message ?? body;
  return String(Array.isArray(m) ? m.join(' ') : m ?? '');
}

function payload(res) {
  return res.body?.data ?? res.body;
}

function notified(res) {
  return payload(res)?.notifications != null;
}

function is2xx(res) {
  return res.status >= 200 && res.status < 300;
}

function is4xx(res) {
  return res.status >= 400 && res.status < 500;
}

function joinLeakIn(responses) {
  return responses.some((r) =>
    /FOR UPDATE|nullable side of an outer join/i.test(msgOf(r.body)),
  );
}

async function main() {
  loadEnv();
  const { Client } = require('pg');
  const jwt = require('jsonwebtoken');
  const crypto = require('crypto');

  const c = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD || undefined,
    database: process.env.DB_NAME,
  });
  await c.connect();

  const biz = (
    await c.query('SELECT id, settings FROM businesses WHERE slug=$1', [SLUG])
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
  const svc = (
    await c.query(
      `SELECT id FROM services WHERE business_id=$1 AND "isActive"=true LIMIT 1`,
      [biz.id],
    )
  ).rows[0];
  if (!emp || !svc) throw new Error('need employee + service');

  const token = jwt.sign(
    {
      sub: member.user_id,
      email: String(member.email).toLowerCase(),
      role: member.user_role,
      businessId: biz.id,
      membershipRole: member.role,
      employeeId: null,
    },
    process.env.JWT_SECRET,
    { expiresIn: '2h' },
  );

  const createdIds = [];
  const results = [];
  const priorSettings = biz.settings ?? {};
  let settingsRestored = false;

  async function enableVisitStatusNotify() {
    const next = {
      ...(typeof priorSettings === 'object' && priorSettings
        ? priorSettings
        : {}),
      providerMobile: {
        ...((priorSettings && priorSettings.providerMobile) || {}),
        notifyCustomerOnVisitStatus: true,
      },
    };
    await c.query(`UPDATE businesses SET settings=$2::jsonb WHERE id=$1`, [
      biz.id,
      JSON.stringify(next),
    ]);
  }

  async function restoreSettings() {
    if (settingsRestored) return;
    await c.query(`UPDATE businesses SET settings=$2::jsonb WHERE id=$1`, [
      biz.id,
      JSON.stringify(priorSettings ?? {}),
    ]);
    settingsRestored = true;
  }

  async function insertBooking({
    status = 'confirmed',
    checkedIn = true,
  } = {}) {
    const id = crypto.randomUUID();
    const start = new Date(Date.now() + 48 * 3600 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    await c.query(
      `INSERT INTO bookings (
         id, business_id, employee_id, service_id, customer_id,
         status, "paymentStatus", "startTime", "endTime",
         checked_in_at, metadata, "createdAt", "updatedAt"
       ) VALUES (
         $1,$2,$3,$4,NULL,
         $5,'pending',$6,$7,
         $8,'{}'::jsonb,NOW(),NOW()
       )`,
      [
        id,
        biz.id,
        emp.id,
        svc.id,
        status,
        start.toISOString(),
        end.toISOString(),
        checkedIn ? new Date().toISOString() : null,
      ],
    );
    createdIds.push(id);
    return id;
  }

  function readyNow(bookingId) {
    return request(
      'POST',
      `/businesses/${biz.id}/provider/bookings/${bookingId}/ready-now`,
      { token },
    );
  }

  function runningLate(bookingId, minutesLate = 10) {
    return request(
      'POST',
      `/businesses/${biz.id}/provider/bookings/${bookingId}/running-late`,
      { token, body: { minutesLate } },
    );
  }

  await enableVisitStatusNotify();

  try {
    // —— first ready-now succeeds ——
    {
      const id = await insertBooking();
      const res = await readyNow(id);
      const data = payload(res);
      const msg = msgOf(res.body);
      const pass =
        is2xx(res) &&
        data?.visitStatus?.kind === 'ready_now' &&
        !/FOR UPDATE|nullable side of an outer join/i.test(msg);
      results.push({
        id: 'first-ready-now-succeeds',
        pass,
        detail: {
          status: res.status,
          kind: data?.visitStatus?.kind,
          notified: notified(res),
          message: msg.slice(0, 160),
        },
      });
    }

    // —— sequential same ready: first notifies, second idempotent ——
    {
      const id = await insertBooking();
      const first = await readyNow(id);
      const second = await readyNow(id);
      const pass =
        is2xx(first) &&
        is2xx(second) &&
        payload(second)?.visitStatus?.kind === 'ready_now' &&
        notified(first) &&
        !notified(second);
      results.push({
        id: 'sequential-same-ready-idempotent',
        pass,
        detail: {
          first: first.status,
          second: second.status,
          firstNotified: notified(first),
          secondNotified: notified(second),
        },
      });
    }

    // —— 5 concurrent ready-now: all 2xx, notify ≤1 ——
    {
      const id = await insertBooking();
      const responses = await Promise.all(
        Array.from({ length: 5 }, () => readyNow(id)),
      );
      const ok = responses.filter(is2xx);
      const serverErr = responses.filter((r) => r.status >= 500);
      const notifyCount = responses.filter(notified).length;
      const kinds = responses.map((r) => payload(r)?.visitStatus?.kind);
      results.push({
        id: 'concurrent-five-ready-only-one-notifies',
        pass:
          ok.length === 5 &&
          notifyCount === 1 &&
          serverErr.length === 0 &&
          kinds.every((k) => k === 'ready_now'),
        detail: {
          statuses: responses.map((r) => r.status),
          notifyCount,
          serverErr: serverErr.length,
          joinLeak: joinLeakIn(responses),
        },
      });
      results.push({
        id: 'no-for-update-outer-join-500',
        pass: !joinLeakIn(responses) && serverErr.length === 0,
        detail: {
          joinLeak: joinLeakIn(responses),
          serverErr: serverErr.length,
          sample: responses
            .map((r) => msgOf(r.body))
            .find((m) => /FOR UPDATE|nullable/i.test(m))
            ?.slice(0, 160),
        },
      });
    }

    // —— first running-late succeeds ——
    {
      const id = await insertBooking();
      const res = await runningLate(id, 12);
      const data = payload(res);
      const pass =
        is2xx(res) &&
        data?.visitStatus?.kind === 'running_late' &&
        Number(data?.visitStatus?.minutesLate) === 12;
      results.push({
        id: 'first-running-late-succeeds',
        pass,
        detail: {
          status: res.status,
          kind: data?.visitStatus?.kind,
          minutesLate: data?.visitStatus?.minutesLate,
          notified: notified(res),
        },
      });
    }

    // —— late minutes change re-enters notify path ——
    {
      const id = await insertBooking();
      const first = await runningLate(id, 10);
      const second = await runningLate(id, 15);
      const pass =
        is2xx(first) &&
        is2xx(second) &&
        Number(payload(second)?.visitStatus?.minutesLate) === 15 &&
        notified(first) &&
        notified(second);
      results.push({
        id: 'sequential-late-minutes-change-renotifies',
        pass,
        detail: {
          first: first.status,
          second: second.status,
          minutes: payload(second)?.visitStatus?.minutesLate,
          firstNotified: notified(first),
          secondNotified: notified(second),
        },
      });
    }

    // —— ready after late clears late + notifies ——
    {
      const id = await insertBooking();
      const late = await runningLate(id, 10);
      const ready = await readyNow(id);
      const pass =
        is2xx(late) &&
        is2xx(ready) &&
        payload(ready)?.visitStatus?.kind === 'ready_now' &&
        notified(ready);
      results.push({
        id: 'ready-after-late-clears-and-notifies',
        pass,
        detail: {
          late: late.status,
          ready: ready.status,
          kind: payload(ready)?.visitStatus?.kind,
          readyNotified: notified(ready),
        },
      });
    }

    // —— 5 concurrent late same minutes: notify ≤1 ——
    {
      const id = await insertBooking();
      const responses = await Promise.all(
        Array.from({ length: 5 }, () => runningLate(id, 10)),
      );
      const ok = responses.filter(is2xx);
      const serverErr = responses.filter((r) => r.status >= 500);
      const notifyCount = responses.filter(notified).length;
      results.push({
        id: 'concurrent-five-late-same-minutes-one-notify',
        pass: ok.length === 5 && notifyCount === 1 && serverErr.length === 0,
        detail: {
          statuses: responses.map((r) => r.status),
          notifyCount,
          serverErr: serverErr.length,
          joinLeak: joinLeakIn(responses),
        },
      });
    }

    // —— not checked in ——
    {
      const id = await insertBooking({ checkedIn: false });
      const res = await readyNow(id);
      const msg = msgOf(res.body);
      const pass = is4xx(res) && /Check in the client/i.test(msg);
      results.push({
        id: 'not-checked-in-rejected',
        pass,
        detail: { status: res.status, message: msg.slice(0, 160) },
      });
    }

    // —— cancelled ——
    {
      const id = await insertBooking({ status: 'cancelled' });
      const res = await runningLate(id, 10);
      const msg = msgOf(res.body);
      const pass =
        is4xx(res) &&
        /cancel|not available|not allowed|Visit status|cannot/i.test(msg);
      results.push({
        id: 'cancelled-booking-rejected',
        pass,
        detail: { status: res.status, message: msg.slice(0, 160) },
      });
    }

    // —— completed ——
    {
      const id = await insertBooking({ status: 'completed' });
      const res = await readyNow(id);
      const msg = msgOf(res.body);
      const pass =
        is4xx(res) && /completed|cannot|not available|Visit/i.test(msg);
      results.push({
        id: 'completed-booking-rejected',
        pass,
        detail: { status: res.status, message: msg.slice(0, 160) },
      });
    }
  } finally {
    if (createdIds.length) {
      await c.query(`DELETE FROM bookings WHERE id = ANY($1::uuid[])`, [
        createdIds,
      ]);
    }
    await restoreSettings();
    await c.end();
  }

  let failed = 0;
  console.log(`e2e-bug.255 QA → ${API} ${SLUG}\n`);
  for (const row of results) {
    if (row.pass) {
      console.log(`PASS ${row.id}`, JSON.stringify(row.detail).slice(0, 240));
    } else {
      failed += 1;
      console.log(`FAIL ${row.id}`, JSON.stringify(row.detail).slice(0, 320));
    }
  }
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
