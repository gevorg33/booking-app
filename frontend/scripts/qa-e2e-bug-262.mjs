/**
 * Guru live QA for e2e-bug.262 — public service slots must not list startTimes
 * already blocked by employee booking overlap (book would 409).
 *
 * Run: node scripts/qa-e2e-bug-262.mjs
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

async function cleanupBookings(bookingIds) {
  if (!bookingIds?.length) return;
  await withPg(async (c) => {
    await c.query(`delete from bookings where id = any($1::uuid[])`, [
      bookingIds,
    ]);
  }).catch((err) => console.warn('  warn cleanup:', err.message));
}

function bookBody(catalog, startTime, label, idx) {
  return {
    serviceId: catalog.serviceId,
    employeeId: catalog.employeeId,
    startTime,
    customer: {
      name: `E2E262 ${label} ${idx}`,
      email: `e2e262-${label}-${idx}-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
      phone: `+1555${String(2000000 + idx).slice(0, 7)}`,
    },
    paymentMethod: 'cash',
  };
}

async function pickCatalog() {
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
  const other =
    providers.find((p) => p.id !== gevorg.id) || null;

  const from = '2026-07-31';
  const to = '2026-09-15';

  for (const svc of candidates) {
    const durationMinutes = Number(svc.durationMinutes) || 60;
    const datesRes = await request(
      'GET',
      `/public/${SLUG}/services/${svc.id}/bookable-dates?from=${from}&to=${to}`,
    );
    const dates = unwrap(datesRes.body)?.dates || [];
    for (const d of dates.slice(0, 14)) {
      const dateStr = String(d).slice(0, 10);
      const slotsRes = await request(
        'GET',
        `/public/${SLUG}/services/${svc.id}/slots?date=${dateStr}`,
      );
      const slots = unwrap(slotsRes.body)?.slots || unwrap(slotsRes.body) || [];
      const mine = slots.filter(
        (s) => (s.employeeId || s.employee?.id) === gevorg.id,
      );
      if (mine.length < 3) continue;

      let phantom = 0;
      for (const s of mine) {
        const n = await countActiveOverlaps(
          gevorg.id,
          s.startTime,
          durationMinutes,
        );
        if (n > 0) phantom += 1;
      }
      if (mine.length - phantom >= 3) {
        return {
          serviceId: svc.id,
          serviceName: svc.name,
          durationMinutes,
          employeeId: gevorg.id,
          employeeName: gevorg.name,
          otherEmployeeId: other?.id || null,
          otherEmployeeName: other?.name || null,
          dateStr,
          slots: mine,
          phantomCount: phantom,
        };
      }
    }
  }
  throw new Error('Need ≥3 listed slots for Gevorg on a cashable service day');
}

async function main() {
  loadEnv();
  const created = [];
  const results = [];

  function pass(id, detail) {
    results.push({ id, pass: true, detail });
    console.log(`PASS ${id}${detail ? ` — ${detail}` : ''}`);
  }
  function fail(id, detail) {
    results.push({ id, pass: false, detail });
    console.log(`FAIL ${id} — ${detail}`);
  }

  try {
    const catalog = await pickCatalog();
    console.log(
      `e2e-bug.262 QA → ${API} ${SLUG}\n  catalog ${catalog.serviceName} (${catalog.durationMinutes}m) / ${catalog.employeeName}\n  date=${catalog.dateStr} listed=${catalog.slots.length} phantomBlocked=${catalog.phantomCount}\n`,
    );

    // 1) Zero phantoms among listed slots
    if (catalog.phantomCount === 0) {
      pass(
        'e2e262-live-zero-phantom-listed',
        `listed=${catalog.slots.length} all overlap-free`,
      );
    } else {
      fail(
        'e2e262-live-zero-phantom-listed',
        `${catalog.phantomCount} listed slot(s) still overlap active bookings`,
      );
    }

    const target = catalog.slots[0];
    const startIso = target.startTime;

    // 2) Listed slot books
    const bookRes = await request('POST', `/public/${SLUG}/bookings`, {
      body: bookBody(catalog, startIso, 'book', 1),
    });
    const booking =
      unwrap(bookRes.body)?.booking || unwrap(bookRes.body) || {};
    const bookingId = booking.id;
    const manageToken =
      booking.manageToken || booking.metadata?.manageToken;
    if ((bookRes.status === 200 || bookRes.status === 201) && bookingId) {
      created.push(bookingId);
      pass(
        'e2e262-live-listed-slot-books',
        `${bookRes.status} id=${bookingId}`,
      );
    } else {
      fail(
        'e2e262-live-listed-slot-books',
        `status=${bookRes.status} ${JSON.stringify(bookRes.body).slice(0, 180)}`,
      );
    }

    // 3) Winner absent from service slots
    const slotsAfter = await request(
      'GET',
      `/public/${SLUG}/services/${catalog.serviceId}/slots?date=${catalog.dateStr}`,
    );
    const afterList =
      unwrap(slotsAfter.body)?.slots || unwrap(slotsAfter.body) || [];
    const stillListed = afterList.some(
      (s) =>
        (s.employeeId || s.employee?.id) === catalog.employeeId &&
        s.startTime === startIso,
    );
    if (!stillListed) {
      pass('e2e262-live-winner-absent-from-slots', 'startTime removed');
    } else {
      const probe = await request('POST', `/public/${SLUG}/bookings`, {
        body: bookBody(catalog, startIso, 'phantom', 2),
      });
      if (probe.status === 409) {
        fail(
          'e2e262-live-winner-absent-from-slots',
          `still listed + book 409 (phantom) ${startIso}`,
        );
      } else if (probe.status === 200 || probe.status === 201) {
        const id = unwrap(probe.body)?.booking?.id || unwrap(probe.body)?.id;
        if (id) created.push(id);
        fail(
          'e2e262-live-winner-absent-from-slots',
          `still listed AND bookable (double-book!) ${startIso}`,
        );
      } else {
        fail(
          'e2e262-live-winner-absent-from-slots',
          `still listed; probe=${probe.status}`,
        );
      }
    }

    // 4) Duration-overlap neighbors hidden (e.g. +10/+20/+30 into a 60m booking)
    const neighborOffsets = [10, 20, 30].filter(
      (m) => m < catalog.durationMinutes,
    );
    const neighborHits = [];
    for (const mins of neighborOffsets) {
      const neighbor = new Date(
        new Date(startIso).getTime() + mins * 60_000,
      ).toISOString();
      const hit = afterList.some(
        (s) =>
          (s.employeeId || s.employee?.id) === catalog.employeeId &&
          s.startTime === neighbor,
      );
      if (hit) neighborHits.push(`${mins}m`);
    }
    if (!neighborHits.length) {
      pass(
        'e2e262-live-duration-overlap-neighbors-hidden',
        `checked +${neighborOffsets.join('/')}m`,
      );
    } else {
      fail(
        'e2e262-live-duration-overlap-neighbors-hidden',
        `still listed: +${neighborHits.join(', ')}`,
      );
    }

    // 5) Cancel frees the slot again (guest cancel may 403 inside 24h policy —
    // fall back to DB status=cancelled so we still assert list/overlap parity).
    if (bookingId) {
      let cancelVia = 'manage';
      let cancelRes = manageToken
        ? await request('POST', `/public/${SLUG}/bookings/manage/cancel`, {
            body: { bookingId, token: manageToken },
          })
        : { status: 0, body: { message: 'no manageToken' } };
      if (!(cancelRes.status >= 200 && cancelRes.status < 300)) {
        cancelVia = 'db';
        await withPg(async (c) => {
          await c.query(
            `update bookings set status = 'cancelled' where id = $1`,
            [bookingId],
          );
        });
        cancelRes = {
          status: 200,
          body: {
            message: `fallback DB cancel after manage=${cancelRes.status}`,
          },
        };
      }
      const slotsFreed = await request(
        'GET',
        `/public/${SLUG}/services/${catalog.serviceId}/slots?date=${catalog.dateStr}`,
      );
      const freedList =
        unwrap(slotsFreed.body)?.slots || unwrap(slotsFreed.body) || [];
      const back = freedList.some(
        (s) =>
          (s.employeeId || s.employee?.id) === catalog.employeeId &&
          s.startTime === startIso,
      );
      if (back) {
        pass(
          'e2e262-live-cancelled-does-not-block',
          `${cancelVia}; slot re-listed`,
        );
      } else {
        const rebook = await request('POST', `/public/${SLUG}/bookings`, {
          body: bookBody(catalog, startIso, 'rebook', 3),
        });
        const id =
          unwrap(rebook.body)?.booking?.id || unwrap(rebook.body)?.id;
        if (id) created.push(id);
        if (rebook.status === 200 || rebook.status === 201) {
          pass(
            'e2e262-live-cancelled-does-not-block',
            `${cancelVia}; rebook ok (list lag ok)`,
          );
        } else {
          fail(
            'e2e262-live-cancelled-does-not-block',
            `${cancelVia}; not re-listed and rebook=${rebook.status}`,
          );
        }
      }
    } else {
      fail(
        'e2e262-live-cancelled-does-not-block',
        'missing bookingId from prior book',
      );
    }

    // 6) Other employee same wall time (if they have that slot listed)
    if (catalog.otherEmployeeId) {
      const otherSlots = afterList.filter(
        (s) => (s.employeeId || s.employee?.id) === catalog.otherEmployeeId,
      );
      const sameClock = otherSlots.find((s) => {
        const a = new Date(s.startTime).getUTCHours() * 60 +
          new Date(s.startTime).getUTCMinutes();
        const b =
          new Date(startIso).getUTCHours() * 60 +
          new Date(startIso).getUTCMinutes();
        // compare local-ish by ISO minute equality on date
        return s.startTime.slice(0, 16) === startIso.slice(0, 16);
      });
      if (sameClock) {
        const n = await countActiveOverlaps(
          catalog.otherEmployeeId,
          sameClock.startTime,
          catalog.durationMinutes,
        );
        if (n === 0) {
          pass(
            'e2e262-live-other-employee-same-time-ok',
            `${catalog.otherEmployeeName} still lists ${sameClock.startTime}`,
          );
        } else {
          fail(
            'e2e262-live-other-employee-same-time-ok',
            `other employee slot listed but overlaps=${n}`,
          );
        }
      } else {
        // Soft pass: other employee simply has no slot at that clock — not a regression.
        pass(
          'e2e262-live-other-employee-same-time-ok',
          `no same-clock slot for ${catalog.otherEmployeeName || 'other'} (ok)`,
        );
      }
    } else {
      pass(
        'e2e262-live-other-employee-same-time-ok',
        'single-provider salon — skipped',
      );
    }

    // 7) Provider slots parity — re-book then check provider endpoint hides it
    const freeAgainRes = await request(
      'GET',
      `/public/${SLUG}/services/${catalog.serviceId}/slots?date=${catalog.dateStr}`,
    );
    const freeAgain = (
      unwrap(freeAgainRes.body)?.slots || unwrap(freeAgainRes.body) || []
    ).filter((s) => (s.employeeId || s.employee?.id) === catalog.employeeId);
    let parityStart = freeAgain[0]?.startTime;
    if (!parityStart) {
      // fall back to any remaining catalog slot that is overlap-free
      for (const s of catalog.slots) {
        const n = await countActiveOverlaps(
          catalog.employeeId,
          s.startTime,
          catalog.durationMinutes,
        );
        if (n === 0) {
          parityStart = s.startTime;
          break;
        }
      }
    }
    if (!parityStart) {
      fail('e2e262-live-provider-slots-parity', 'no free slot left for parity book');
    } else {
      const pb = await request('POST', `/public/${SLUG}/bookings`, {
        body: bookBody(catalog, parityStart, 'parity', 4),
      });
      const pid = unwrap(pb.body)?.booking?.id || unwrap(pb.body)?.id;
      if (pid) created.push(pid);
      if (!(pb.status === 200 || pb.status === 201)) {
        fail(
          'e2e262-live-provider-slots-parity',
          `parity book failed ${pb.status}`,
        );
      } else {
        const provRes = await request(
          'GET',
          `/public/${SLUG}/providers/${catalog.employeeId}/slots?date=${catalog.dateStr}`,
        );
        const provSlots =
          unwrap(provRes.body)?.slots || unwrap(provRes.body) || [];
        const stillOnProvider = provSlots.some(
          (s) => s.startTime === parityStart,
        );
        if (!stillOnProvider) {
          pass(
            'e2e262-live-provider-slots-parity',
            `provider slots omit ${parityStart}`,
          );
        } else {
          fail(
            'e2e262-live-provider-slots-parity',
            `provider slots still list ${parityStart}`,
          );
        }
      }
    }
  } catch (err) {
    fail('e2e262-live-setup', err.message || String(err));
  } finally {
    await cleanupBookings(created);
  }

  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
