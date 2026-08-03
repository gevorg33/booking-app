/**
 * Manual live QA for api-bug.5 — concurrent cancel of the same booking must be
 * idempotent (manage-token + authenticated /me paths). No 500; final cancelled.
 *
 * Run: node scripts/qa-api-bug-5.mjs
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { randomUUID } from 'crypto';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(__dirname, '../../backend');
const require = createRequire(resolve(backendRoot, 'package.json'));
const { Client } = require('pg');
const jwt = require('jsonwebtoken');

const SLUG = process.env.SALON_SLUG || 'gevgas-operations-7c299253';
const API = process.env.API_BASE || 'http://127.0.0.1:3001';

const CRASH_MARKERS = [
  'invalid input syntax for type uuid',
  'QueryFailedError',
  '22P02',
  'FOR UPDATE cannot be applied',
  'nullable side of an outer join',
  'duplicate key value violates unique constraint',
  '23505',
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

function request(method, path, { body, token } = {}) {
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

function hasCrash(body) {
  const blob = JSON.stringify(body || {});
  return CRASH_MARKERS.filter((m) => blob.includes(m));
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

async function getBookingStatus(bookingId) {
  return withPg(async (c) => {
    const r = await c.query(
      `select status, "cancellationReason" from bookings where id=$1`,
      [bookingId],
    );
    return r.rows[0] || null;
  });
}

async function cleanupBookings(bookingIds) {
  if (!bookingIds?.length) return;
  await withPg(async (c) => {
    await c.query(`delete from bookings where id = any($1::uuid[])`, [
      bookingIds,
    ]);
  }).catch((err) => console.warn('  warn cleanup bookings:', err.message));
}

async function cleanupCustomers(customerIds) {
  if (!customerIds?.length) return;
  await withPg(async (c) => {
    await c.query(`delete from customers where id = any($1::uuid[])`, [
      customerIds,
    ]);
  }).catch((err) => console.warn('  warn cleanup customers:', err.message));
}

async function pickCashableSlot() {
  const servicesRes = await request('GET', `/public/${SLUG}/services`);
  const services = unwrap(servicesRes.body)?.services || [];
  const cashable = services.filter(
    (s) => s.prepaymentMode !== 'full' && s.onlinePaymentEnabled !== true,
  );
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

  // Self-service cancel requires ≥24h notice — prefer starts ≥48h out.
  const minStartMs = Date.now() + 48 * 3600 * 1000;
  const from = '2026-08-03';
  const to = '2026-09-30';

  for (const svc of candidates) {
    const durationMinutes = Number(svc.durationMinutes) || 60;
    const datesRes = await request(
      'GET',
      `/public/${SLUG}/services/${svc.id}/bookable-dates?from=${from}&to=${to}`,
    );
    const dates = unwrap(datesRes.body)?.dates || [];
    const collected = [];
    for (const d of dates.slice(0, 20)) {
      const dateStr = String(d).slice(0, 10);
      const slotsRes = await request(
        'GET',
        `/public/${SLUG}/services/${svc.id}/slots?date=${dateStr}`,
      );
      const slots = (unwrap(slotsRes.body)?.slots || []).filter(
        (s) => (s.employeeId || s.employee?.id) === gevorg.id,
      );
      for (const s of slots) {
        const startMs = new Date(s.startTime).getTime();
        if (startMs < minStartMs) continue;
        const n = await withPg(async (c) => {
          const start = new Date(s.startTime);
          const end = new Date(start.getTime() + durationMinutes * 60_000);
          const r = await c.query(
            `select count(*)::int as n from bookings
             where employee_id=$1 and status!='cancelled'
               and "startTime" < $3::timestamptz
               and "endTime" > $2::timestamptz`,
            [gevorg.id, start.toISOString(), end.toISOString()],
          );
          return r.rows[0].n;
        });
        if (n === 0) collected.push({ ...s, dateStr });
      }
      if (collected.length >= 8) break;
    }
    // Greedy non-overlapping picks so sequential creates don't 409 each other.
    const nonOverlap = [];
    for (const s of collected) {
      const sa = new Date(s.startTime).getTime();
      const ea = sa + durationMinutes * 60_000;
      const clashes = nonOverlap.some((o) => {
        const ob = new Date(o.startTime).getTime();
        const oe = ob + durationMinutes * 60_000;
        return sa < oe && ea > ob;
      });
      if (!clashes) nonOverlap.push(s);
      if (nonOverlap.length >= 8) break;
    }
    if (nonOverlap.length >= 6) {
      return {
        serviceId: svc.id,
        serviceName: svc.name,
        durationMinutes,
        employeeId: gevorg.id,
        dateStr: nonOverlap[0].dateStr,
        slots: nonOverlap,
      };
    }
  }
  throw new Error('Need ≥6 truly-free cancellable slots (≥48h out)');
}

async function createGuestBooking(catalog, startTime, label) {
  const res = await request('POST', `/public/${SLUG}/bookings`, {
    body: {
      serviceId: catalog.serviceId,
      employeeId: catalog.employeeId,
      startTime,
      customer: {
        name: `API Bug5 ${label}`,
        email: `api-bug5-${label}-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`,
        phone: `+1555${String(Date.now()).slice(-7)}`,
      },
      paymentMethod: 'cash',
    },
  });
  const body = unwrap(res.body);
  const booking = body.booking || body;
  return {
    status: res.status,
    bookingId: booking.id,
    manageToken: booking.manageToken || booking.metadata?.manageToken,
    customerId: booking.customer?.id || body.customer?.id,
    body,
  };
}

async function mintCustomerToken(customerId, email, businessId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET missing');
  return jwt.sign(
    {
      sub: customerId,
      email: String(email).toLowerCase(),
      businessId,
      type: 'public_customer',
    },
    secret,
    { expiresIn: '2h' },
  );
}

async function main() {
  loadEnv();
  console.log(`api-bug.5 QA → ${API} ${SLUG}\n`);

  let passed = 0;
  let failed = 0;
  const createdBookings = [];
  const createdCustomers = [];

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

  const biz = await withPg(async (c) => {
    const r = await c.query(`select id from businesses where slug=$1`, [SLUG]);
    return r.rows[0];
  });
  if (!biz) throw new Error(`business not found: ${SLUG}`);

  const catalog = await pickCashableSlot();
  console.log(
    `  catalog ${catalog.serviceName} / ${catalog.employeeId} date=${catalog.dateStr} free=${catalog.slots.length}\n`,
  );

  let slotIdx = 0;
  function nextSlot() {
    const s = catalog.slots[slotIdx++];
    if (!s) throw new Error('ran out of free slots');
    return s.startTime;
  }

  await check('api5-live-manage-parallel-three', async () => {
    const book = await createGuestBooking(catalog, nextSlot(), 'm3');
    if (!isSuccessStatus(book.status) || !book.bookingId || !book.manageToken) {
      throw new Error(
        `setup book failed ${book.status} ${JSON.stringify(book.body).slice(0, 180)}`,
      );
    }
    createdBookings.push(book.bookingId);

    const results = await Promise.all(
      Array.from({ length: 3 }, () =>
        request('POST', `/public/${SLUG}/bookings/manage/cancel`, {
          body: { bookingId: book.bookingId, token: book.manageToken },
        }),
      ),
    );
    const crashes = results.flatMap((r) => hasCrash(r.body));
    if (crashes.length) throw new Error(`crash: ${crashes.join(',')}`);
    if (!results.every((r) => isSuccessStatus(r.status))) {
      throw new Error(
        `statuses=${results.map((r) => r.status).join(',')} msgs=${results.map((r) => r.body?.message || '').join(' | ').slice(0, 200)}`,
      );
    }
    const final = await getBookingStatus(book.bookingId);
    if (final?.status !== 'cancelled') {
      throw new Error(`final status=${final?.status}`);
    }
    return `3×${results[0].status}; status=cancelled`;
  });

  await check('api5-live-manage-parallel-eight', async () => {
    const book = await createGuestBooking(catalog, nextSlot(), 'm8');
    if (!isSuccessStatus(book.status) || !book.bookingId || !book.manageToken) {
      throw new Error(`setup book failed ${book.status}`);
    }
    createdBookings.push(book.bookingId);

    const results = await Promise.all(
      Array.from({ length: 8 }, () =>
        request('POST', `/public/${SLUG}/bookings/manage/cancel`, {
          body: { bookingId: book.bookingId, token: book.manageToken },
        }),
      ),
    );
    if (results.some((r) => r.status >= 500)) {
      throw new Error(
        `got 5xx: ${results.map((r) => r.status).join(',')} ${JSON.stringify(results.find((r) => r.status >= 500)?.body).slice(0, 200)}`,
      );
    }
    if (!results.every((r) => isSuccessStatus(r.status))) {
      throw new Error(`statuses=${results.map((r) => r.status).join(',')}`);
    }
    const final = await getBookingStatus(book.bookingId);
    if (final?.status !== 'cancelled') {
      throw new Error(`final status=${final?.status}`);
    }
    return '8×2xx; cancelled';
  });

  await check('api5-live-me-parallel-three', async () => {
    const email = `api-bug5-me-${Date.now()}@example.com`;
    const customerId = randomUUID();
    await withPg(async (c) => {
      await c.query(
        `INSERT INTO customers (id, business_id, name, email, metadata, "isActive", "createdAt", "updatedAt")
         VALUES ($1,$2,$3,$4,'{}'::jsonb,true,NOW(),NOW())`,
        [customerId, biz.id, 'API Bug5 Me', email],
      );
    });
    createdCustomers.push(customerId);
    const token = await mintCustomerToken(customerId, email, biz.id);

    // Book as this customer via public API using same email so ownership links
    const bookRes = await request('POST', `/public/${SLUG}/bookings`, {
      body: {
        serviceId: catalog.serviceId,
        employeeId: catalog.employeeId,
        startTime: nextSlot(),
        customer: { name: 'API Bug5 Me', email, phone: '+15551234567' },
        paymentMethod: 'cash',
      },
      token,
    });
    const bookBody = unwrap(bookRes.body);
    const booking = bookBody.booking || bookBody;
    if (!isSuccessStatus(bookRes.status) || !booking.id) {
      throw new Error(
        `setup book failed ${bookRes.status} ${JSON.stringify(bookRes.body).slice(0, 200)}`,
      );
    }
    createdBookings.push(booking.id);

    // Ensure customer ownership matches JWT (public book may create a new customer)
    const ownedId = booking.customer?.id || bookBody.customer?.id;
    let authToken = token;
    if (ownedId && ownedId !== customerId) {
      createdCustomers.push(ownedId);
      authToken = await mintCustomerToken(ownedId, email, biz.id);
    }

    const results = await Promise.all(
      Array.from({ length: 3 }, () =>
        request(
          'POST',
          `/public/${SLUG}/me/bookings/${booking.id}/cancel`,
          { token: authToken },
        ),
      ),
    );
    const crashes = results.flatMap((r) => hasCrash(r.body));
    if (crashes.length) throw new Error(`crash: ${crashes.join(',')}`);
    if (!results.every((r) => isSuccessStatus(r.status))) {
      throw new Error(
        `statuses=${results.map((r) => r.status).join(',')} ${JSON.stringify(results.map((r) => r.body?.message)).slice(0, 240)}`,
      );
    }
    const final = await getBookingStatus(booking.id);
    if (final?.status !== 'cancelled') {
      throw new Error(`final status=${final?.status}`);
    }
    return `3×${results[0].status}; cancelled`;
  });

  await check('api5-live-sequential-recancel', async () => {
    const book = await createGuestBooking(catalog, nextSlot(), 'seq');
    if (!isSuccessStatus(book.status) || !book.bookingId || !book.manageToken) {
      throw new Error(`setup book failed ${book.status}`);
    }
    createdBookings.push(book.bookingId);

    const first = await request(
      'POST',
      `/public/${SLUG}/bookings/manage/cancel`,
      { body: { bookingId: book.bookingId, token: book.manageToken } },
    );
    const second = await request(
      'POST',
      `/public/${SLUG}/bookings/manage/cancel`,
      { body: { bookingId: book.bookingId, token: book.manageToken } },
    );
    if (!isSuccessStatus(first.status) || !isSuccessStatus(second.status)) {
      throw new Error(`statuses=${first.status}/${second.status}`);
    }
    if (hasCrash(first.body).length || hasCrash(second.body).length) {
      throw new Error('crash markers on sequential cancel');
    }
    const final = await getBookingStatus(book.bookingId);
    if (final?.status !== 'cancelled') {
      throw new Error(`final status=${final?.status}`);
    }
    return `${first.status} then ${second.status} idempotent`;
  });

  await check('api5-live-mixed-manage-and-me', async () => {
    const email = `api-bug5-mix-${Date.now()}@example.com`;
    const bookRes = await request('POST', `/public/${SLUG}/bookings`, {
      body: {
        serviceId: catalog.serviceId,
        employeeId: catalog.employeeId,
        startTime: nextSlot(),
        customer: { name: 'API Bug5 Mix', email, phone: '+15557654321' },
        paymentMethod: 'cash',
      },
    });
    const bookBody = unwrap(bookRes.body);
    const booking = bookBody.booking || bookBody;
    if (!isSuccessStatus(bookRes.status) || !booking.id) {
      throw new Error(`setup failed ${bookRes.status}`);
    }
    createdBookings.push(booking.id);
    const manageToken =
      booking.manageToken || booking.metadata?.manageToken;
    const customerId = booking.customer?.id || bookBody.customer?.id;
    if (!manageToken || !customerId) {
      throw new Error('missing manageToken or customerId');
    }
    createdCustomers.push(customerId);
    const authToken = await mintCustomerToken(customerId, email, biz.id);

    const [manageRes, meRes] = await Promise.all([
      request('POST', `/public/${SLUG}/bookings/manage/cancel`, {
        body: { bookingId: booking.id, token: manageToken },
      }),
      request('POST', `/public/${SLUG}/me/bookings/${booking.id}/cancel`, {
        token: authToken,
      }),
    ]);
    if (!isSuccessStatus(manageRes.status) || !isSuccessStatus(meRes.status)) {
      throw new Error(
        `statuses manage=${manageRes.status} me=${meRes.status} ${JSON.stringify(manageRes.body?.message)} / ${JSON.stringify(meRes.body?.message)}`,
      );
    }
    if (hasCrash(manageRes.body).length || hasCrash(meRes.body).length) {
      throw new Error('crash markers on mixed cancel');
    }
    const final = await getBookingStatus(booking.id);
    if (final?.status !== 'cancelled') {
      throw new Error(`final status=${final?.status}`);
    }
    return `manage=${manageRes.status} me=${meRes.status}; cancelled`;
  });

  await check('api5-live-bad-token-parallel', async () => {
    const book = await createGuestBooking(catalog, nextSlot(), 'bad');
    if (!isSuccessStatus(book.status) || !book.bookingId) {
      throw new Error(`setup book failed ${book.status}`);
    }
    createdBookings.push(book.bookingId);

    const results = await Promise.all(
      Array.from({ length: 3 }, () =>
        request('POST', `/public/${SLUG}/bookings/manage/cancel`, {
          body: {
            bookingId: book.bookingId,
            token: 'definitely-not-a-valid-manage-token',
          },
        }),
      ),
    );
    if (results.some((r) => r.status >= 500)) {
      throw new Error(`got 5xx: ${results.map((r) => r.status).join(',')}`);
    }
    if (!results.every((r) => r.status === 403)) {
      throw new Error(`expected all 403, got ${results.map((r) => r.status).join(',')}`);
    }
    const final = await getBookingStatus(book.bookingId);
    if (final?.status !== 'confirmed') {
      throw new Error(`expected still confirmed, got ${final?.status}`);
    }
    // cancel for cleanup via valid token
    await request('POST', `/public/${SLUG}/bookings/manage/cancel`, {
      body: { bookingId: book.bookingId, token: book.manageToken },
    });
    return '3×403; booking stayed confirmed';
  });

  await check('api5-live-no-postgres-leak', async () => {
    const book = await createGuestBooking(catalog, nextSlot(), 'leak');
    if (!isSuccessStatus(book.status) || !book.bookingId || !book.manageToken) {
      throw new Error(`setup book failed ${book.status}`);
    }
    createdBookings.push(book.bookingId);

    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        request('POST', `/public/${SLUG}/bookings/manage/cancel`, {
          body: { bookingId: book.bookingId, token: book.manageToken },
        }),
      ),
    );
    const crashes = results.flatMap((r) => hasCrash(r.body));
    if (crashes.length) throw new Error(crashes.join(','));
    if (results.some((r) => r.status >= 500)) {
      throw new Error(`5xx: ${results.map((r) => r.status).join(',')}`);
    }
    return '5× concurrent cancel clean';
  });

  console.log(
    `\n  cleanup bookings=${createdBookings.length} customers=${createdCustomers.length}`,
  );
  await cleanupBookings(createdBookings);
  await cleanupCustomers(createdCustomers);

  console.log(`\napi-bug.5 live QA: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
