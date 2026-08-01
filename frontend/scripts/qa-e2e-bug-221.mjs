/**
 * Manual QA for e2e-bug.221 — web running-late self-service.
 * Mints a public_customer JWT, puts a booking in the notify window,
 * exercises API edge cases + account UI.
 */
import puppeteer from 'puppeteer-core';
import { createRequire } from 'module';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CHROME =
  process.env.CHROME_PATH ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SLUG = 'gevgas-operations-7c299253';
const BASE = process.env.BOOKING_BASE || `http://127.0.0.1:3002/book/${SLUG}`;
const API = process.env.API_BASE || 'http://127.0.0.1:3001';

function loadEnv() {
  const envPath = resolve(__dirname, '../../backend/.env');
  const raw = readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of raw.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

function request(method, path, { token, body } = {}) {
  return new Promise((resolvePromise, reject) => {
    const data = body != null ? JSON.stringify(body) : null;
    const url = new URL(path, API);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
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
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  const env = loadEnv();
  const client = new pg.Client({
    host: env.DB_HOST,
    port: Number(env.DB_PORT || 5432),
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD || undefined,
    database: env.DB_NAME,
  });
  await client.connect();

  const biz = (
    await client.query('SELECT id FROM businesses WHERE slug=$1', [SLUG])
  ).rows[0];
  if (!biz) throw new Error('business not found');

  const customer = (
    await client.query(
      `SELECT id, email, name FROM customers
       WHERE business_id=$1 AND email IS NOT NULL
       ORDER BY "createdAt" DESC NULLS LAST LIMIT 1`,
      [biz.id],
    )
  ).rows[0];
  if (!customer) throw new Error('no customer');

  // Prefer an active booking; otherwise any recent booking to retarget in window.
  let booking = (
    await client.query(
      `SELECT id, status, "startTime", "endTime", customer_id
       FROM bookings
       WHERE business_id=$1 AND customer_id=$2
         AND status IN ('pending','confirmed','in_progress')
       ORDER BY "startTime" ASC LIMIT 1`,
      [biz.id, customer.id],
    )
  ).rows[0];

  if (!booking) {
    booking = (
      await client.query(
        `SELECT id, status, "startTime", "endTime", customer_id
         FROM bookings
         WHERE business_id=$1 AND customer_id=$2
         ORDER BY "startTime" DESC LIMIT 1`,
        [biz.id, customer.id],
      )
    ).rows[0];
  }
  if (!booking) throw new Error('no booking for customer');

  const start = new Date(Date.now() + 60 * 60 * 1000); // +1h (inside 6h window)
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  await client.query(
    `UPDATE bookings
     SET status='confirmed', "startTime"=$2, "endTime"=$3, "updatedAt"=NOW()
     WHERE id=$1`,
    [booking.id, start.toISOString(), end.toISOString()],
  );

  // Completed booking for negative UI/API case
  const completed = (
    await client.query(
      `SELECT id FROM bookings
       WHERE business_id=$1 AND customer_id=$2 AND id <> $3
       ORDER BY "startTime" DESC LIMIT 1`,
      [biz.id, customer.id, booking.id],
    )
  ).rows[0];

  const token = jwt.sign(
    {
      sub: customer.id,
      email: String(customer.email).toLowerCase(),
      businessId: biz.id,
      type: 'public_customer',
    },
    env.JWT_SECRET,
    { expiresIn: '2h' },
  );

  const results = [];

  // --- API cases ---
  {
    const r = await request(
      'POST',
      `/public/${SLUG}/me/bookings/${booking.id}/running-late`,
      { body: {} },
    );
    results.push({
      id: 'api-unauth-401',
      pass: r.status === 401,
      detail: r.status,
    });
  }

  {
    const r = await request(
      'POST',
      `/public/${SLUG}/me/bookings/${booking.id}/running-late`,
      { token, body: { minutesLate: 15 } },
    );
    const data = r.body?.data ?? r.body;
    results.push({
      id: 'api-happy-15',
      pass:
        r.status >= 200 &&
        r.status < 300 &&
        data?.minutesLate === 15 &&
        Boolean(data?.notifiedAt),
      detail: { status: r.status, body: data },
    });
  }

  {
    const r = await request(
      'POST',
      `/public/${SLUG}/me/bookings/${booking.id}/running-late`,
      { token, body: { minutesLate: 20 } },
    );
    const data = r.body?.data ?? r.body;
    results.push({
      id: 'api-renotify-overwrite',
      pass: r.status >= 200 && r.status < 300 && data?.minutesLate === 20,
      detail: { status: r.status, minutesLate: data?.minutesLate },
    });
  }

  {
    const r = await request(
      'POST',
      `/public/${SLUG}/me/bookings/${booking.id}/running-late`,
      { token, body: { minutesLate: 0 } },
    );
    results.push({
      id: 'api-minutes-0-rejected-or-normalized',
      // DTO Min(1) → 400, or service clamp — either is acceptable if not 500
      pass: r.status === 400 || (r.status < 300 && (r.body?.data ?? r.body)?.minutesLate >= 1),
      detail: { status: r.status, body: r.body },
    });
  }

  {
    const r = await request(
      'POST',
      `/public/${SLUG}/me/bookings/${booking.id}/running-late`,
      { token, body: { minutesLate: 999 } },
    );
    results.push({
      id: 'api-minutes-999-rejected-or-clamped',
      pass: r.status === 400 || (r.status < 300 && (r.body?.data ?? r.body)?.minutesLate <= 120),
      detail: { status: r.status, body: r.body },
    });
  }

  // Move booking outside window → 403
  await client.query(
    `UPDATE bookings SET "startTime"=$2, "endTime"=$3 WHERE id=$1`,
    [
      booking.id,
      new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      new Date(Date.now() + 49 * 60 * 60 * 1000).toISOString(),
    ],
  );
  {
    const r = await request(
      'POST',
      `/public/${SLUG}/me/bookings/${booking.id}/running-late`,
      { token, body: { minutesLate: 10 } },
    );
    results.push({
      id: 'api-too-early-403',
      pass: r.status === 403,
      detail: { status: r.status, message: r.body?.message },
    });
  }

  // Restore in-window for UI
  await client.query(
    `UPDATE bookings SET "startTime"=$2, "endTime"=$3, status='confirmed' WHERE id=$1`,
    [booking.id, start.toISOString(), end.toISOString()],
  );

  if (completed) {
    await client.query(
      `UPDATE bookings SET status='completed' WHERE id=$1`,
      [completed.id],
    );
  }

  await client.end();

  // --- UI cases ---
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--window-size=390,844'],
    defaultViewport: {
      width: 390,
      height: 844,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2,
    },
  });
  const page = await browser.newPage();

  const storageKey = `public-customer:${SLUG}`;
  const session = {
    token,
    customer: {
      id: customer.id,
      email: customer.email,
      name: customer.name || 'Test User',
    },
  };

  await page.goto(`${BASE}/account`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.evaluate(
    (key, sess) => {
      localStorage.setItem(key, JSON.stringify(sess));
    },
    storageKey,
    session,
  );
  await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1500));

  const ui = await page.evaluate((targetBookingId) => {
    const fabs = [...document.querySelectorAll('[data-testid="account-running-late"]')];
    const forTarget = fabs.find(
      (el) => el.getAttribute('data-booking-id') === targetBookingId,
    );
    const labels = fabs.map((el) => ({
      id: el.getAttribute('data-booking-id'),
      text: (el.textContent || '').trim(),
    }));
    return {
      count: fabs.length,
      hasTarget: Boolean(forTarget),
      labels,
      aria: forTarget?.getAttribute('aria-expanded') ?? null,
      pageText: document.body.innerText.slice(0, 500),
    };
  }, booking.id);

  results.push({
    id: 'ui-cta-visible-in-window',
    pass: ui.hasTarget === true,
    detail: ui,
  });

  if (ui.hasTarget) {
    await page.click(
      `[data-testid="account-running-late"][data-booking-id="${booking.id}"]`,
    );
    await new Promise((r) => setTimeout(r, 400));
    const panel = await page.$('[data-testid="account-running-late-panel"]');
    results.push({
      id: 'ui-panel-opens',
      pass: Boolean(panel),
      detail: { panel: Boolean(panel) },
    });

    const mins15 = await page.$('[data-testid="account-running-late-mins-15"]');
    if (mins15) await mins15.click();
    await new Promise((r) => setTimeout(r, 200));

    const waitResp = page.waitForResponse(
      (r) =>
        r.url().includes(`/me/bookings/${booking.id}/running-late`) &&
        r.request().method() === 'POST',
      { timeout: 20000 },
    );
    await page.click('[data-testid="account-running-late-confirm"]');
    const resp = await waitResp.catch(() => null);
    let status = null;
    let body = null;
    if (resp) {
      status = resp.status();
      body = await resp.json().catch(() => null);
    }
    await new Promise((r) => setTimeout(r, 800));
    const success = await page.$('[data-testid="account-running-late-success"]');
    const successText = success
      ? await page.evaluate((el) => el.textContent, success)
      : null;
    results.push({
      id: 'ui-notify-success',
      pass:
        Boolean(success) &&
        status >= 200 &&
        status < 300 &&
        /notified|minutes late/i.test(successText || ''),
      detail: { status, successText, body },
    });
  } else {
    results.push({ id: 'ui-panel-opens', pass: false, detail: 'skipped' });
    results.push({ id: 'ui-notify-success', pass: false, detail: 'skipped' });
  }

  // Guest (clear session) — CTA must hide
  await page.evaluate((key) => localStorage.removeItem(key), storageKey);
  await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise((r) => setTimeout(r, 800));
  const guestCount = await page.evaluate(
    () => document.querySelectorAll('[data-testid="account-running-late"]').length,
  );
  results.push({
    id: 'ui-guest-no-cta',
    pass: guestCount === 0,
    detail: { guestCount },
  });

  await browser.close();

  console.log(JSON.stringify({ bookingId: booking.id, customerId: customer.id, results }, null, 2));
  const failed = results.filter((r) => !r.pass);
  if (failed.length) {
    console.error(`\nFAIL ${failed.length}/${results.length}`);
    process.exit(1);
  }
  console.log(`\nPASS ${results.length}/${results.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
