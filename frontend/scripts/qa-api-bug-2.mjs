/**
 * Manual live QA for api-bug.2 — curated packages must remain bookable even when
 * total duration exceeds multi-service maxDurationMinutes; ad-hoc multi-service
 * carts with the same services must still hit the duration cap.
 *
 * Run: node scripts/qa-api-bug-2.mjs
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(__dirname, '../../backend');

const SLUG = process.env.SALON_SLUG || 'gevgas-operations-7c299253';
const API = process.env.API_BASE || 'http://127.0.0.1:3001';
const PKG =
  process.env.PACKAGE_ID || '570ca68d-30df-4988-8070-e17604f20f00';

const DURATION_RE = /exceeds the \d+ minute limit/i;

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

function hasDurationError(body) {
  return DURATION_RE.test(JSON.stringify(body || {}));
}

async function cleanupBookings(bookingIds) {
  if (!bookingIds?.length) return;
  try {
    const { Client } = await import('pg');
    const c = new Client({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 5432),
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });
    await c.connect();
    const groups = await c.query(
      `select distinct multi_service_group_id as id from bookings
       where id = any($1::uuid[]) and multi_service_group_id is not null`,
      [bookingIds],
    );
    const purchaseIds = await c.query(
      `select distinct (metadata->>'packagePurchaseId')::uuid as id from bookings
       where id = any($1::uuid[])
         and metadata->>'packagePurchaseId' is not null`,
      [bookingIds],
    );
    await c.query(`delete from bookings where id = any($1::uuid[])`, [
      bookingIds,
    ]);
    const gids = groups.rows.map((r) => r.id).filter(Boolean);
    if (gids.length) {
      await c.query(
        `delete from multi_service_booking_groups where id = any($1::uuid[])`,
        [gids],
      );
    }
    const pids = purchaseIds.rows.map((r) => r.id).filter(Boolean);
    if (pids.length) {
      await c
        .query(
          `delete from service_package_purchases where id = any($1::uuid[])`,
          [pids],
        )
        .catch(() => {});
    }
    await c.end();
  } catch (err) {
    console.warn('  warn cleanup:', err.message);
  }
}

async function main() {
  loadEnv();
  console.log(`api-bug.2 QA → ${API} ${SLUG} package=${PKG}\n`);

  let passed = 0;
  let failed = 0;
  const createdBookingIds = [];

  const biz = unwrap((await request('GET', `/public/${SLUG}`)).body);
  const ms =
    biz?.business?.settings?.publicBooking?.multiService ||
    biz?.multiService ||
    biz?.settings?.publicBooking?.multiService;
  const maxDur = ms?.maxDurationMinutes ?? 180;
  console.log(
    `  context maxDurationMinutes=${maxDur} multiService.enabled=${ms?.enabled}\n`,
  );

  const detailRes = await request('GET', `/public/${SLUG}/packages/${PKG}`);
  const pkg = unwrap(detailRes.body)?.package || unwrap(detailRes.body);
  const items = pkg?.items || [];
  if (!items.length) {
    console.error('No package items — abort');
    process.exit(1);
  }
  const serviceIds = items.map((i) => i.serviceId);
  const serviceMinutes = items.reduce(
    (s, i) => s + (i.durationMinutes || 0) * (i.quantity || 1),
    0,
  );
  console.log(
    `  package services=${serviceIds.length} rawMinutes≈${serviceMinutes}\n`,
  );

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

  let bookableDate = null;
  let blockStart = null;
  let packageLines = null;

  await check('api2-live-pkg-suggest-block', async () => {
    const res = await request(
      'GET',
      `/public/${SLUG}/packages/${PKG}/suggest-block`,
    );
    if (res.status !== 200 || hasDurationError(res.body)) {
      throw new Error(
        `status=${res.status} ${JSON.stringify(res.body).slice(0, 200)}`,
      );
    }
    blockStart = unwrap(res.body)?.startTime;
    return `start=${blockStart}`;
  });

  await check('api2-live-pkg-bookable-dates', async () => {
    const res = await request(
      'GET',
      `/public/${SLUG}/packages/${PKG}/bookable-dates?from=2026-08-01&to=2026-08-31`,
    );
    if (res.status !== 200 || hasDurationError(res.body)) {
      throw new Error(
        `status=${res.status} ${JSON.stringify(res.body).slice(0, 200)}`,
      );
    }
    const dates = unwrap(res.body)?.dates || [];
    if (!dates.length) throw new Error('no bookable dates');
    bookableDate = dates[0];
    return `dates=${dates.length} first=${bookableDate}`;
  });

  await check('api2-live-pkg-block-slots', async () => {
    const date = bookableDate || '2026-08-01';
    const res = await request(
      'GET',
      `/public/${SLUG}/packages/${PKG}/block-slots?date=${date}`,
    );
    if (res.status !== 200 || hasDurationError(res.body)) {
      throw new Error(
        `status=${res.status} ${JSON.stringify(res.body).slice(0, 200)}`,
      );
    }
    const slots = unwrap(res.body)?.slots || [];
    if (!slots.length) throw new Error('no slots');
    blockStart = slots[0].startTime;
    const total = unwrap(res.body)?.totalDurationMinutes;
    return `slots=${slots.length} totalDurationMinutes=${total}`;
  });

  await check('api2-live-pkg-suggest-slots', async () => {
    const res = await request(
      'GET',
      `/public/${SLUG}/packages/${PKG}/suggest-slots`,
    );
    if (res.status !== 200 || hasDurationError(res.body)) {
      throw new Error(
        `status=${res.status} ${JSON.stringify(res.body).slice(0, 200)}`,
      );
    }
    const lines = unwrap(res.body)?.lines || [];
    if (lines.length !== serviceIds.length) {
      throw new Error(
        `expected ${serviceIds.length} lines, got ${lines.length}`,
      );
    }
    packageLines = lines.map((l) => ({
      serviceId: l.serviceId,
      startTime: l.startTime,
      employeeId: l.employeeId,
    }));
    blockStart = unwrap(res.body)?.blockStartTime || blockStart;
    return `lines=${lines.length}`;
  });

  await check('api2-live-pkg-providers', async () => {
    if (!blockStart) throw new Error('no blockStart');
    const res = await request(
      'GET',
      `/public/${SLUG}/packages/${PKG}/providers?startTime=${encodeURIComponent(blockStart)}`,
    );
    if (res.status !== 200 || hasDurationError(res.body)) {
      throw new Error(
        `status=${res.status} ${JSON.stringify(res.body).slice(0, 200)}`,
      );
    }
    const providers = unwrap(res.body)?.providers || [];
    if (!providers.length) throw new Error('no providers');
    return `providers=${providers.length}`;
  });

  await check('api2-live-pkg-quote', async () => {
    // PublicPackageQuoteDto only accepts packageId (+ promo/loyalty) — not lines.
    const res = await request('POST', `/public/${SLUG}/packages/quote`, {
      body: { packageId: PKG },
    });
    if (hasDurationError(res.body)) {
      throw new Error(`duration error on quote: ${JSON.stringify(res.body)}`);
    }
    if (res.status !== 200 && res.status !== 201) {
      throw new Error(
        `quote status=${res.status} ${JSON.stringify(res.body).slice(0, 200)}`,
      );
    }
    return 'quote ok';
  });

  await check('api2-live-pkg-book-past-duration-gate', async () => {
    // Cash book may still 400 for "Online payment is required" when Connect is
    // ready and amountDue > 0 — that still proves skipDurationCap (duration
    // validation runs before the payment gate).
    if (!packageLines?.length) throw new Error('no package lines');
    const email = `api-bug2-book-${Date.now()}@example.com`;
    const res = await request('POST', `/public/${SLUG}/packages/book`, {
      body: {
        packageId: PKG,
        lines: packageLines,
        customer: { name: 'API Bug2 Book', email, phone: '+15550001111' },
        metadata: { paymentMethod: 'cash', payAtVenue: true },
      },
    });
    if (hasDurationError(res.body)) {
      throw new Error(`duration error on book: ${JSON.stringify(res.body)}`);
    }
    if (res.status === 200 || res.status === 201) {
      const bookings = unwrap(res.body)?.bookings || [];
      for (const b of bookings) {
        if (b.id) createdBookingIds.push(b.id);
      }
      return `booked bookings=${bookings.length}`;
    }
    const msg = String(res.body?.message || '');
    if (
      res.status === 400 &&
      /online payment is required/i.test(msg)
    ) {
      return 'past duration gate → online payment required (expected)';
    }
    throw new Error(
      `unexpected book status=${res.status} ${JSON.stringify(res.body).slice(0, 240)}`,
    );
  });

  await check('api2-live-pkg-checkout-over-cap', async () => {
    if (!packageLines?.length) throw new Error('no package lines');
    const res = await request('POST', `/public/${SLUG}/packages/checkout`, {
      body: {
        packageId: PKG,
        lines: packageLines,
        customer: {
          name: 'API Bug2 Checkout',
          email: `api-bug2-checkout-${Date.now()}@example.com`,
          phone: '+15550002222',
        },
      },
    });
    if (hasDurationError(res.body)) {
      throw new Error(
        `duration error on checkout: ${JSON.stringify(res.body)}`,
      );
    }
    if (res.status !== 200 && res.status !== 201) {
      throw new Error(
        `checkout status=${res.status} ${JSON.stringify(res.body).slice(0, 240)}`,
      );
    }
    const url = unwrap(res.body)?.url || '';
    if (!/checkout\.stripe\.com/i.test(url)) {
      throw new Error(`missing stripe url: ${JSON.stringify(res.body).slice(0, 200)}`);
    }
    return 'stripe checkout session created for over-cap package';
  });
  const qs = serviceIds.map((id) => `serviceIds=${id}`).join('&');

  await check('api2-live-ms-preview-over-cap', async () => {
    const res = await request('POST', `/public/${SLUG}/multi-service/preview`, {
      body: { serviceIds },
    });
    if (res.status === 400 && hasDurationError(res.body)) {
      return String(res.body?.message || '').slice(0, 120);
    }
    throw new Error(
      `expected 400 duration, got ${res.status} ${JSON.stringify(res.body).slice(0, 200)}`,
    );
  });

  await check('api2-live-ms-suggest-block-over-cap', async () => {
    const res = await request(
      'GET',
      `/public/${SLUG}/multi-service/suggest-block?${qs}`,
    );
    if (res.status === 400 && hasDurationError(res.body)) return 'rejected';
    throw new Error(
      `expected 400 duration, got ${res.status} ${JSON.stringify(res.body).slice(0, 200)}`,
    );
  });

  await check('api2-live-ms-providers-over-cap', async () => {
    if (!blockStart) throw new Error('no blockStart');
    const res = await request(
      'GET',
      `/public/${SLUG}/multi-service/providers?${qs}&startTime=${encodeURIComponent(blockStart)}`,
    );
    if (res.status === 400 && hasDurationError(res.body)) {
      return 'rejected (providers enforce cap)';
    }
    throw new Error(
      `expected 400 duration, got ${res.status} ${JSON.stringify(res.body).slice(0, 200)}`,
    );
  });

  const underQs = serviceIds
    .slice(0, 2)
    .map((id) => `serviceIds=${id}`)
    .join('&');
  await check('api2-live-ms-under-cap-suggest', async () => {
    const res = await request(
      'GET',
      `/public/${SLUG}/multi-service/suggest-block?${underQs}`,
    );
    if (res.status !== 200 || hasDurationError(res.body)) {
      throw new Error(
        `status=${res.status} ${JSON.stringify(res.body).slice(0, 200)}`,
      );
    }
    return `start=${unwrap(res.body)?.startTime}`;
  });

  await check('api2-live-ms-partial-over-preview', async () => {
    const res = await request('POST', `/public/${SLUG}/multi-service/preview`, {
      body: { serviceIds: serviceIds.slice(0, 3) },
    });
    if (res.status === 400 && hasDurationError(res.body)) {
      return String(res.body?.message || '').slice(0, 120);
    }
    throw new Error(
      `expected 400 duration, got ${res.status} ${JSON.stringify(res.body).slice(0, 200)}`,
    );
  });

  await check('api2-live-frontend-api-parity-block-slots', async () => {
    const date = bookableDate || '2026-08-01';
    const res = await request(
      'GET',
      `/public/${SLUG}/packages/${PKG}/block-slots?date=${date}`,
    );
    if (res.status !== 200 || hasDurationError(res.body)) {
      throw new Error(`frontend-shared API failed: ${res.status}`);
    }
    const total = unwrap(res.body)?.totalDurationMinutes;
    if (typeof total === 'number' && total > maxDur) {
      return `over-cap package slots OK (${total}>${maxDur})`;
    }
    return `slots OK total=${total}`;
  });

  if (createdBookingIds.length) {
    console.log(`\n  cleanup bookings=${createdBookingIds.length}`);
    await cleanupBookings(createdBookingIds);
  }

  console.log(`\napi-bug.2 live QA: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
