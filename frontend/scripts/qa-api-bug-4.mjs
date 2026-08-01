/**
 * Manual live QA for api-bug.4 — concurrent public POST /bookings for the same
 * employee+startTime must yield exactly one winner; losers 409; DB overlap = 1.
 *
 * Run: node scripts/qa-api-bug-4.mjs
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(__dirname, '../../backend');
const require = createRequire(resolve(backendRoot, 'package.json'));
const { Client } = require('pg');

const SLUG = process.env.SALON_SLUG || 'gevgas-operations-7c299253';
const API = process.env.API_BASE || 'http://127.0.0.1:3001';

const CRASH_MARKERS = [
  'invalid input syntax for type uuid',
  'QueryFailedError',
  '22P02',
  'FOR UPDATE cannot be applied',
  'nullable side of an outer join',
];

function loadEnv() {
  const envPath = resolve(backendRoot, '.env');
  if (!existsSync(envPath)) return {};
  const env = {};
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    const val = m[2].trim().replace(/^["']|["']$/g, '');
    env[key] = val;
    if (process.env[key] == null) process.env[key] = val;
  }
  return env;
}

function request(method, path, { body } = {}) {
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

function hasCrash(body) {
  const blob = JSON.stringify(body || {});
  return CRASH_MARKERS.filter((m) => blob.includes(m));
}

function isConflictStatus(status) {
  return status === 409;
}

function isSuccessStatus(status) {
  return status === 200 || status === 201;
}

async function withPg(fn) {
  const c = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  await c.connect();
  try {
    return await fn(c);
  } finally {
    await c.end();
  }
}

async function countActiveOverlaps(employeeId, startTimeIso, durationMinutes) {
  return withPg(async (c) => {
    const start = new Date(startTimeIso);
    const end = new Date(start.getTime() + durationMinutes * 60_000);
    const r = await c.query(
      `select count(*)::int as n
       from bookings
       where employee_id = $1
         and status != 'cancelled'
         and "startTime" < $3::timestamptz
         and "endTime" > $2::timestamptz`,
      [employeeId, start.toISOString(), end.toISOString()],
    );
    return r.rows[0].n;
  });
}

async function countExactStart(employeeId, startTimeIso) {
  return withPg(async (c) => {
    const r = await c.query(
      `select count(*)::int as n
       from bookings
       where employee_id = $1
         and status != 'cancelled'
         and "startTime" = $2::timestamptz`,
      [employeeId, new Date(startTimeIso).toISOString()],
    );
    return r.rows[0].n;
  });
}

async function cleanupBookings(bookingIds) {
  if (!bookingIds?.length) return;
  await withPg(async (c) => {
    await c.query(`delete from bookings where id = any($1::uuid[])`, [
      bookingIds,
    ]);
  }).catch((err) => console.warn('  warn cleanup:', err.message));
}

async function pickCashableCatalog() {
  const servicesRes = await request('GET', `/public/${SLUG}/services`);
  const services = unwrap(servicesRes.body)?.services || [];
  const cashable = services.filter(
    (s) => s.prepaymentMode !== 'full' && s.onlinePaymentEnabled !== true,
  );
  if (!cashable.length) throw new Error('No cashable service found');

  const ordered = [
    ...cashable.filter((s) =>
      /swedish|deep tissue|neck|full body|hot stone|facemassage/i.test(s.name),
    ),
    ...cashable,
  ];
  const seen = new Set();
  const candidates = ordered.filter((s) => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });

  const providersRes = await request('GET', `/public/${SLUG}/providers`);
  const providers = unwrap(providersRes.body)?.providers || [];
  const gevorg =
    providers.find((p) => /gevorg/i.test(p.name)) || providers[0];
  if (!gevorg) throw new Error('No provider found');

  const from = '2026-07-31';
  const to = '2026-09-15';

  for (const svc of candidates) {
    const durationMinutes = Number(svc.durationMinutes) || 60;
    const datesRes = await request(
      'GET',
      `/public/${SLUG}/services/${svc.id}/bookable-dates?from=${from}&to=${to}`,
    );
    const dates = unwrap(datesRes.body)?.dates || [];
    for (const d of dates.slice(0, 12)) {
      const dateStr = String(d).slice(0, 10);
      const slotsRes = await request(
        'GET',
        `/public/${SLUG}/services/${svc.id}/slots?date=${dateStr}`,
      );
      const slots = unwrap(slotsRes.body)?.slots || unwrap(slotsRes.body) || [];
      const mine = slots.filter(
        (s) => (s.employeeId || s.employee?.id) === gevorg.id,
      );
      const free = [];
      for (const s of mine) {
        const n = await countActiveOverlaps(
          gevorg.id,
          s.startTime,
          durationMinutes,
        );
        if (n === 0) free.push(s);
      }
      if (free.length >= 3) {
        return {
          serviceId: svc.id,
          serviceName: svc.name,
          durationMinutes,
          employeeId: gevorg.id,
          dateStr,
          slots: free,
          listedCount: mine.length,
          phantomCount: mine.length - free.length,
        };
      }
    }
  }
  throw new Error('Need ≥3 truly-free slots for the same provider');
}

function bookBody(catalog, startTime, label, idx) {
  return {
    serviceId: catalog.serviceId,
    employeeId: catalog.employeeId,
    startTime,
    customer: {
      name: `API Bug4 ${label} ${idx}`,
      email: `api-bug4-${label}-${idx}-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
      phone: `+1555${String(1000000 + idx).slice(0, 7)}`,
    },
    paymentMethod: 'cash',
  };
}

async function raceBookings(catalog, startTime, n, label) {
  const requests = Array.from({ length: n }, (_, i) =>
    request('POST', `/public/${SLUG}/bookings`, {
      body: bookBody(catalog, startTime, label, i),
    }),
  );
  const results = await Promise.all(requests);
  const successes = results.filter((r) => isSuccessStatus(r.status));
  const conflicts = results.filter((r) => isConflictStatus(r.status));
  const others = results.filter(
    (r) => !isSuccessStatus(r.status) && !isConflictStatus(r.status),
  );
  const bookingIds = successes
    .map((r) => unwrap(r.body)?.booking?.id || unwrap(r.body)?.id)
    .filter(Boolean);
  const crashHits = results.flatMap((r) => hasCrash(r.body));
  return { results, successes, conflicts, others, bookingIds, crashHits };
}

async function main() {
  loadEnv();
  console.log(`api-bug.4 QA → ${API} ${SLUG}\n`);

  let passed = 0;
  let failed = 0;
  const allCreated = [];

  async function check(id, fn) {
    try {
      const detail = await fn();
      passed += 1;
      console.log(`  PASS  ${id}${detail ? ` — ${detail}` : ''}`);
    } catch (err) {
      failed += 1;
      console.log(`  FAIL  ${id} — ${err.message || String(err)}`);
    }
  }

  const catalog = await pickCashableCatalog();
  console.log(
    `  catalog ${catalog.serviceName} (${catalog.durationMinutes}m) / ${catalog.employeeId}`,
  );
  console.log(
    `  date=${catalog.dateStr} trulyFree=${catalog.slots.length} listed=${catalog.listedCount} phantomBlocked=${catalog.phantomCount}\n`,
  );

  // Note phantom slots for residual filing (e2e-bug.262) — not a fail of api-bug.4.
  if (catalog.phantomCount > 0) {
    console.log(
      `  note: e2e-bug.262 — ${catalog.phantomCount} public slot(s) listed but blocked by employee overlap\n`,
    );
  }

  const raceSlot = catalog.slots[0].startTime;
  const distinctA = catalog.slots[1].startTime;
  const distinctB = catalog.slots[2].startTime;

  let fourWinnerIds = [];
  await check('api4-live-parallel-four-one-wins', async () => {
    const race = await raceBookings(catalog, raceSlot, 4, 'p4');
    allCreated.push(...race.bookingIds);
    fourWinnerIds = race.bookingIds;
    if (race.successes.length !== 1) {
      throw new Error(
        `expected 1 success, got ${race.successes.length}; statuses=${race.results.map((r) => r.status).join(',')} msgs=${race.results.map((r) => r.body?.message || '').join(' | ').slice(0, 200)}`,
      );
    }
    if (race.conflicts.length !== 3) {
      throw new Error(
        `expected 3×409, got ${race.conflicts.length}; others=${JSON.stringify(race.others.map((r) => ({ s: r.status, m: r.body?.message }))).slice(0, 240)}`,
      );
    }
    if (race.others.length) {
      throw new Error(
        `unexpected statuses: ${race.others.map((r) => r.status).join(',')}`,
      );
    }
    const dbN = await countExactStart(catalog.employeeId, raceSlot);
    if (dbN !== 1) throw new Error(`DB exact-start count=${dbN}, expected 1`);
    return `1×${race.successes[0].status} + 3×409; DB=1`;
  });

  await check('api4-live-db-single-active-row', async () => {
    const dbN = await countExactStart(catalog.employeeId, raceSlot);
    if (dbN !== 1) throw new Error(`DB exact-start count=${dbN}, expected 1`);
    if (!fourWinnerIds.length) throw new Error('no winner id from prior race');
    return `bookingId=${fourWinnerIds[0]}`;
  });

  await check('api4-live-sequential-second-conflict', async () => {
    const res = await request('POST', `/public/${SLUG}/bookings`, {
      body: bookBody(catalog, raceSlot, 'seq', 99),
    });
    if (isSuccessStatus(res.status)) {
      const id = unwrap(res.body)?.booking?.id || unwrap(res.body)?.id;
      if (id) allCreated.push(id);
      throw new Error(`expected 409, got ${res.status} (double-booked!)`);
    }
    if (!isConflictStatus(res.status)) {
      throw new Error(
        `expected 409, got ${res.status} ${JSON.stringify(res.body).slice(0, 200)}`,
      );
    }
    if (hasCrash(res.body).length) {
      throw new Error(`crash markers: ${hasCrash(res.body).join(',')}`);
    }
    return String(res.body?.message || '').slice(0, 120);
  });

  await check('api4-live-winner-removed-from-slots', async () => {
    const slotsRes = await request(
      'GET',
      `/public/${SLUG}/services/${catalog.serviceId}/slots?date=${catalog.dateStr}`,
    );
    if (slotsRes.status !== 200) {
      throw new Error(`slots status=${slotsRes.status}`);
    }
    const slots = unwrap(slotsRes.body)?.slots || unwrap(slotsRes.body) || [];
    const stillOpen = slots.some(
      (s) =>
        (s.employeeId || s.employee?.id) === catalog.employeeId &&
        s.startTime === raceSlot,
    );
    if (stillOpen) {
      // e2e-bug.262 Fixed: listed + 409 is no longer acceptable.
      const probe = await request('POST', `/public/${SLUG}/bookings`, {
        body: bookBody(catalog, raceSlot, 'phantom', 1),
      });
      if (isSuccessStatus(probe.status)) {
        const id = unwrap(probe.body)?.booking?.id || unwrap(probe.body)?.id;
        if (id) allCreated.push(id);
        throw new Error(
          `winning startTime still bookable (double-book): ${raceSlot}`,
        );
      }
      if (isConflictStatus(probe.status)) {
        throw new Error(
          `winning startTime still listed but book 409 (phantom availability): ${raceSlot}`,
        );
      }
      throw new Error(
        `unexpected probe ${probe.status} ${JSON.stringify(probe.body).slice(0, 160)}`,
      );
    }
    return 'winner slot absent from public slots';
  });

  await check('api4-live-parallel-eight-one-wins', async () => {
    // Refresh truly-free slots after the first race consumed raceSlot.
    const slotsRes = await request(
      'GET',
      `/public/${SLUG}/services/${catalog.serviceId}/slots?date=${catalog.dateStr}`,
    );
    const listed = (unwrap(slotsRes.body)?.slots || []).filter(
      (s) => (s.employeeId || s.employee?.id) === catalog.employeeId,
    );
    let eightSlot = null;
    for (const s of listed) {
      const n = await countActiveOverlaps(
        catalog.employeeId,
        s.startTime,
        catalog.durationMinutes,
      );
      if (n === 0) {
        eightSlot = s.startTime;
        break;
      }
    }
    if (!eightSlot) {
      // try next dates
      const datesRes = await request(
        'GET',
        `/public/${SLUG}/services/${catalog.serviceId}/bookable-dates?from=2026-07-31&to=2026-09-15`,
      );
      for (const d of unwrap(datesRes.body)?.dates || []) {
        const ds = String(d).slice(0, 10);
        const sr = await request(
          'GET',
          `/public/${SLUG}/services/${catalog.serviceId}/slots?date=${ds}`,
        );
        for (const s of unwrap(sr.body)?.slots || []) {
          if ((s.employeeId || s.employee?.id) !== catalog.employeeId) continue;
          const n = await countActiveOverlaps(
            catalog.employeeId,
            s.startTime,
            catalog.durationMinutes,
          );
          if (n === 0) {
            eightSlot = s.startTime;
            break;
          }
        }
        if (eightSlot) break;
      }
    }
    if (!eightSlot) throw new Error('no free slot for 8-way race');

    const race = await raceBookings(catalog, eightSlot, 8, 'p8');
    allCreated.push(...race.bookingIds);
    if (race.successes.length !== 1) {
      throw new Error(
        `expected 1 success, got ${race.successes.length}; statuses=${race.results.map((r) => r.status).join(',')}`,
      );
    }
    if (race.conflicts.length !== 7) {
      throw new Error(
        `expected 7×409, got ${race.conflicts.length}; others=${race.others.map((r) => r.status).join(',')}`,
      );
    }
    if (race.others.length || race.crashHits.length) {
      throw new Error(
        `bad responses others=${race.others.length} crash=${race.crashHits.join(',')}`,
      );
    }
    const dbN = await countExactStart(catalog.employeeId, eightSlot);
    if (dbN !== 1) throw new Error(`DB exact-start count=${dbN}, expected 1`);
    return `1×${race.successes[0].status} + 7×409; DB=1 start=${eightSlot}`;
  });

  await check('api4-live-two-distinct-slots-both-ok', async () => {
    // Re-resolve two free non-overlapping starts (duration-aware).
    const slotsRes = await request(
      'GET',
      `/public/${SLUG}/services/${catalog.serviceId}/slots?date=${catalog.dateStr}`,
    );
    const listed = (unwrap(slotsRes.body)?.slots || []).filter(
      (s) => (s.employeeId || s.employee?.id) === catalog.employeeId,
    );
    const free = [];
    for (const s of listed) {
      const n = await countActiveOverlaps(
        catalog.employeeId,
        s.startTime,
        catalog.durationMinutes,
      );
      if (n === 0) free.push(s);
    }
    // Pick two starts that don't overlap each other.
    let a = null;
    let b = null;
    outer: for (let i = 0; i < free.length; i++) {
      for (let j = i + 1; j < free.length; j++) {
        const sa = new Date(free[i].startTime).getTime();
        const sb = new Date(free[j].startTime).getTime();
        const ea = sa + catalog.durationMinutes * 60_000;
        const eb = sb + catalog.durationMinutes * 60_000;
        if (sa < eb && ea > sb) continue; // overlap
        a = free[i].startTime;
        b = free[j].startTime;
        break outer;
      }
    }
    if (!a || !b) {
      // fall back to pre-picked distinct slots if still free
      const na = await countActiveOverlaps(
        catalog.employeeId,
        distinctA,
        catalog.durationMinutes,
      );
      const nb = await countActiveOverlaps(
        catalog.employeeId,
        distinctB,
        catalog.durationMinutes,
      );
      if (na === 0 && nb === 0) {
        a = distinctA;
        b = distinctB;
      }
    }
    if (!a || !b) throw new Error('need 2 non-overlapping free slots');

    const [ra, rb] = await Promise.all([
      request('POST', `/public/${SLUG}/bookings`, {
        body: bookBody(catalog, a, 'dist', 1),
      }),
      request('POST', `/public/${SLUG}/bookings`, {
        body: bookBody(catalog, b, 'dist', 2),
      }),
    ]);
    for (const r of [ra, rb]) {
      const id = unwrap(r.body)?.booking?.id || unwrap(r.body)?.id;
      if (id) allCreated.push(id);
    }
    if (!isSuccessStatus(ra.status) || !isSuccessStatus(rb.status)) {
      throw new Error(
        `expected both success, got ${ra.status}/${rb.status} ${JSON.stringify(ra.body?.message)} / ${JSON.stringify(rb.body?.message)}`,
      );
    }
    return `both ok ${a} + ${b}`;
  });

  await check('api4-live-no-postgres-leak', async () => {
    const res = await request('POST', `/public/${SLUG}/bookings`, {
      body: bookBody(catalog, raceSlot, 'leak', 1),
    });
    const crashes = hasCrash(res.body);
    if (crashes.length) throw new Error(crashes.join(','));
    if (isSuccessStatus(res.status)) {
      const id = unwrap(res.body)?.booking?.id || unwrap(res.body)?.id;
      if (id) allCreated.push(id);
      throw new Error('unexpected success on taken slot');
    }
    if (!isConflictStatus(res.status) && res.status !== 400) {
      throw new Error(`unexpected status ${res.status}`);
    }
    return `status=${res.status} clean`;
  });

  if (allCreated.length) {
    console.log(`\n  cleanup bookings=${allCreated.length}`);
    await cleanupBookings(allCreated);
  }

  console.log(`\napi-bug.4 live QA: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
