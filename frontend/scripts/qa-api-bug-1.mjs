/**
 * Manual live QA for api-bug.1 — guest manage reschedule/cancel must not
 * crash with Postgres "invalid input syntax for type uuid" when the actor is
 * `customer:<uuid>`.
 *
 * Run: node scripts/qa-api-bug-1.mjs
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(__dirname, '../../backend');

const SLUG = process.env.SALON_SLUG || 'gevgas-operations-7c299253';
const API = process.env.API_BASE || 'http://127.0.0.1:3001';

const CRASH_MARKERS = [
  'invalid input syntax for type uuid',
  'QueryFailedError',
  '22P02',
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
    req.setTimeout(90000, () => req.destroy(new Error('timeout')));
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

function hasCustomerActorLeak(body) {
  const blob = JSON.stringify(body || {});
  return /customer:[0-9a-f-]{36}/i.test(blob);
}

async function pickCashableServiceAndSlots() {
  const servicesRes = await request('GET', `/public/${SLUG}/services`);
  const services = unwrap(servicesRes.body)?.services || [];
  const svc =
    services.find(
      (s) =>
        /deep tissue|facemassage|neck|full body/i.test(s.name) &&
        s.prepaymentMode !== 'full' &&
        s.onlinePaymentEnabled !== true,
    ) ||
    services.find(
      (s) => s.prepaymentMode !== 'full' && s.onlinePaymentEnabled !== true,
    );
  if (!svc) throw new Error('No cashable service found');

  const providersRes = await request('GET', `/public/${SLUG}/providers`);
  const providers = unwrap(providersRes.body)?.providers || [];
  const gevorg =
    providers.find((p) => /gevorg/i.test(p.name)) || providers[0];
  if (!gevorg) throw new Error('No provider found');

  const datesRes = await request(
    'GET',
    `/public/${SLUG}/services/${svc.id}/bookable-dates?from=2026-08-10&to=2026-08-31`,
  );
  const dates = unwrap(datesRes.body)?.dates || [];
  if (!dates.length) throw new Error('No bookable dates');
  const dateStr = String(dates[0]).slice(0, 10);

  const slotsRes = await request(
    'GET',
    `/public/${SLUG}/services/${svc.id}/slots?date=${dateStr}`,
  );
  const slots = unwrap(slotsRes.body)?.slots || unwrap(slotsRes.body) || [];
  const mine = slots.filter(
    (s) => (s.employeeId || s.employee?.id) === gevorg.id,
  );
  if (mine.length < 3) {
    throw new Error(`Need ≥3 open slots, got ${mine.length} on ${dateStr}`);
  }
  return {
    serviceId: svc.id,
    serviceName: svc.name,
    employeeId: gevorg.id,
    slots: mine,
  };
}

async function createGuestBooking(catalog, startTime, label) {
  const res = await request('POST', `/public/${SLUG}/bookings`, {
    body: {
      serviceId: catalog.serviceId,
      employeeId: catalog.employeeId,
      startTime,
      customer: {
        name: `API Bug1 ${label}`,
        email: `api-bug1-${label}-${Date.now()}@example.com`,
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
    startTime: booking.startTime,
    body,
  };
}

async function main() {
  loadEnv();
  console.log(`api-bug.1 QA → ${API} ${SLUG}`);
  const results = [];
  const pass = (id, detail) => {
    results.push({ id, ok: true, detail });
    console.log(`PASS  ${id}${detail ? ` — ${detail}` : ''}`);
  };
  const fail = (id, detail) => {
    results.push({ id, ok: false, detail });
    console.log(`FAIL  ${id} — ${detail}`);
  };

  const catalog = await pickCashableServiceAndSlots();
  console.log(
    `catalog ${catalog.serviceName} / ${catalog.employeeId} slots=${catalog.slots.length}`,
  );

  // Book cancel target first (uses late slots) so reschedule doesn't consume them.
  const book2 = await createGuestBooking(
    catalog,
    catalog.slots[catalog.slots.length - 1].startTime,
    'cancel',
  );

  // 1) Happy reschedule via manage token (customer: actor path)
  const book1 = await createGuestBooking(
    catalog,
    catalog.slots[0].startTime,
    'reschedule',
  );
  if (book1.status !== 201 || !book1.bookingId || !book1.manageToken) {
    fail(
      'api1-live-manage-reschedule',
      `setup book failed status=${book1.status} ${JSON.stringify(book1.body).slice(0, 160)}`,
    );
  } else {
    const reschedule = await request(
      'POST',
      `/public/${SLUG}/bookings/manage/reschedule`,
      {
        body: {
          bookingId: book1.bookingId,
          token: book1.manageToken,
          startTime: catalog.slots[1].startTime,
          employeeId: catalog.employeeId,
        },
      },
    );
    const body = unwrap(reschedule.body);
    const crash = hasCrash(body);
    const leak = hasCustomerActorLeak(body);
    if (reschedule.status === 201 && !crash.length && !leak) {
      pass(
        'api1-live-manage-reschedule',
        `201 previous=${body.previousStartTime} → ${body.booking?.startTime}`,
      );
    } else {
      fail(
        'api1-live-manage-reschedule',
        `status=${reschedule.status} crash=${crash.join(',')} leak=${leak} msg=${JSON.stringify(body).slice(0, 180)}`,
      );
    }
  }

  // 2) Happy cancel via manage token
  if (book2.status !== 201 || !book2.bookingId || !book2.manageToken) {
    fail(
      'api1-live-manage-cancel',
      `setup book failed status=${book2.status} ${JSON.stringify(book2.body).slice(0, 200)}`,
    );
  } else {
    const cancel = await request(
      'POST',
      `/public/${SLUG}/bookings/manage/cancel`,
      {
        body: {
          bookingId: book2.bookingId,
          token: book2.manageToken,
        },
      },
    );
    const body = unwrap(cancel.body);
    const crash = hasCrash(body);
    const leak = hasCustomerActorLeak(body);
    if (cancel.status === 201 && !crash.length && !leak) {
      pass(
        'api1-live-manage-cancel',
        `201 status=${body.booking?.status || body.status}`,
      );
    } else {
      fail(
        'api1-live-manage-cancel',
        `status=${cancel.status} crash=${crash.join(',')} leak=${leak} msg=${JSON.stringify(body).slice(0, 180)}`,
      );
    }
  }

  // 3) Garbage token — must deny without uuid crash
  if (book1.bookingId) {
    const bad = await request(
      'POST',
      `/public/${SLUG}/bookings/manage/reschedule`,
      {
        body: {
          bookingId: book1.bookingId,
          token: 'garbage-token-not-valid',
          startTime: catalog.slots[0].startTime,
          employeeId: catalog.employeeId,
        },
      },
    );
    const body = unwrap(bad.body);
    const crash = hasCrash(body);
    if (bad.status >= 400 && bad.status < 500 && !crash.length) {
      pass('api1-live-garbage-token-reschedule', `status=${bad.status}`);
    } else {
      fail(
        'api1-live-garbage-token-reschedule',
        `status=${bad.status} crash=${crash.join(',')} ${JSON.stringify(body).slice(0, 160)}`,
      );
    }
  } else {
    fail('api1-live-garbage-token-reschedule', 'no bookingId from setup');
  }

  // 4) Missing token
  if (book1.bookingId) {
    const missing = await request(
      'POST',
      `/public/${SLUG}/bookings/manage/reschedule`,
      {
        body: {
          bookingId: book1.bookingId,
          startTime: catalog.slots[0].startTime,
          employeeId: catalog.employeeId,
        },
      },
    );
    const body = unwrap(missing.body);
    const crash = hasCrash(body);
    if (missing.status >= 400 && missing.status < 500 && !crash.length) {
      pass('api1-live-missing-token-reschedule', `status=${missing.status}`);
    } else {
      fail(
        'api1-live-missing-token-reschedule',
        `status=${missing.status} crash=${crash.join(',')}`,
      );
    }
  } else {
    fail('api1-live-missing-token-reschedule', 'no bookingId from setup');
  }

  // 5) Reschedule to same slot (idempotent-ish) — still no uuid crash
  if (book1.bookingId && book1.manageToken) {
    const same = await request(
      'POST',
      `/public/${SLUG}/bookings/manage/reschedule`,
      {
        body: {
          bookingId: book1.bookingId,
          token: book1.manageToken,
          startTime: catalog.slots[1].startTime,
          employeeId: catalog.employeeId,
        },
      },
    );
    const body = unwrap(same.body);
    const crash = hasCrash(body);
    const leak = hasCustomerActorLeak(body);
    if (!crash.length && !leak && same.status < 500) {
      pass(
        'api1-live-reschedule-same-slot',
        `status=${same.status} (no 5xx / uuid leak)`,
      );
    } else {
      fail(
        'api1-live-reschedule-same-slot',
        `status=${same.status} crash=${crash.join(',')} leak=${leak}`,
      );
    }
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
