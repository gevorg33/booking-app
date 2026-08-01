/**
 * Manual QA for e2e-bug.222 — pay-at-visit checkout must not offer Pay online.
 */
import puppeteer from 'puppeteer-core';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CHROME =
  process.env.CHROME_PATH ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SLUG = 'gevgas-operations-7c299253';
const BASE = process.env.BOOKING_BASE || `http://127.0.0.1:3002/book/${SLUG}`;
const API = process.env.API_BASE || 'http://127.0.0.1:3001';
const SWEDISH_ID = '6c9efdb8-27d1-4558-b025-8785583e4c94';
const FULL_ID = '69adc9ef-3a25-486b-b12d-13fc4855e44c'; // Face Pilling $5 full

function loadEnv() {
  const raw = readFileSync(resolve(__dirname, '../../backend/.env'), 'utf8');
  const env = {};
  for (const line of raw.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

function request(method, path, body) {
  return new Promise((resolvePromise, reject) => {
    const data = body != null ? JSON.stringify(body) : null;
    const url = new URL(path, API);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
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
          try {
            resolvePromise({ status: res.statusCode, body: JSON.parse(raw || 'null') });
          } catch {
            resolvePromise({ status: res.statusCode, body: raw });
          }
        });
      },
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function findSlot(serviceId) {
  for (let i = 1; i <= 10; i++) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + i);
    const date = d.toISOString().slice(0, 10);
    const res = await request(
      'GET',
      `/public/${SLUG}/services/${serviceId}/slots?date=${date}`,
    );
    const slots = res.body?.data?.slots || res.body?.slots || [];
    if (slots[0]?.startTime) return slots[0];
  }
  return null;
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
  const prev = (
    await client.query(
      `SELECT prepayment_mode, deposit_amount FROM services WHERE id=$1`,
      [SWEDISH_ID],
    )
  ).rows[0];

  const results = [];
  try {
    await client.query(
      `UPDATE services SET prepayment_mode='none', deposit_amount=NULL WHERE id=$1`,
      [SWEDISH_ID],
    );

    // API quotes
    for (const [id, label, expect] of [
      [SWEDISH_ID, 'swedish-none', { servicePrice: 80, subtotal: 0, amountDue: 0 }],
      [FULL_ID, 'face-full', { servicePrice: 5, subtotal: 5, amountDue: 5 }],
    ]) {
      const r = await request('POST', `/public/${SLUG}/bookings/quote`, {
        serviceId: id,
      });
      const data = r.body?.data ?? r.body;
      results.push({
        id: `api-quote-${label}`,
        pass:
          r.status < 300 &&
          Number(data.servicePrice) === expect.servicePrice &&
          Number(data.amountDue) === expect.amountDue,
        detail: {
          status: r.status,
          servicePrice: data.servicePrice,
          amountDue: data.amountDue,
          subtotal: data.subtotal,
        },
      });
    }

    await client.query(
      `UPDATE services SET prepayment_mode='deposit', deposit_amount=25 WHERE id=$1`,
      [SWEDISH_ID],
    );
    {
      const r = await request('POST', `/public/${SLUG}/bookings/quote`, {
        serviceId: SWEDISH_ID,
      });
      const data = r.body?.data ?? r.body;
      results.push({
        id: 'api-quote-swedish-deposit',
        pass:
          r.status < 300 &&
          Number(data.servicePrice) === 80 &&
          Number(data.amountDue) === 25,
        detail: data,
      });
    }

    await client.query(
      `UPDATE services SET prepayment_mode='none', deposit_amount=NULL WHERE id=$1`,
      [SWEDISH_ID],
    );

    const slot = await findSlot(SWEDISH_ID);
    results.push({
      id: 'slot',
      pass: Boolean(slot),
      detail: slot?.startTime,
    });

    if (slot) {
      const co = await request('POST', `/public/${SLUG}/bookings/checkout`, {
        serviceId: SWEDISH_ID,
        employeeId: slot.employeeId,
        startTime: slot.startTime,
        customer: {
          name: 'QA 222',
          email: 'qa222@example.com',
          phone: '+15555550122',
        },
      });
      const msg = String(
        Array.isArray(co.body?.message)
          ? co.body.message.join(' ')
          : co.body?.message || '',
      );
      results.push({
        id: 'api-checkout-none-blocked',
        pass:
          co.status === 400 &&
          (/does not require online payment/i.test(msg) ||
            /no payment is due/i.test(msg)),
        detail: { status: co.status, message: msg },
      });
    }

    // UI
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

    if (slot) {
      const qs = new URLSearchParams({
        serviceId: SWEDISH_ID,
        startTime: slot.startTime,
        ...(slot.employeeId ? { employeeId: slot.employeeId } : {}),
      });
      await page.goto(`${BASE}/checkout?${qs}`, {
        waitUntil: 'networkidle2',
        timeout: 60000,
      });
      await new Promise((r) => setTimeout(r, 2000));

      const ui = await page.evaluate(() => {
        const body = document.body.innerText;
        const payOnlineBtns = [...document.querySelectorAll('button')].filter(
          (b) => /pay online/i.test(b.textContent || ''),
        );
        const submit = document.querySelector('[data-testid="checkout-submit"]');
        const stickyAmt = document.querySelector(
          '[data-testid="checkout-sticky-amount"]',
        );
        const paymentMethodLabel = /payment method/i.test(body);
        return {
          payOnlineCount: payOnlineBtns.length,
          paymentMethodLabel,
          submitText: (submit?.textContent || '').replace(/\s+/g, ' ').trim(),
          stickyAmount: (stickyAmt?.textContent || '').trim(),
          cartTotal: (document.querySelector('[data-testid="checkout-cart-total"]')?.textContent || '').trim(),
          hasConfirmBooking: /confirm booking/i.test(submit?.textContent || ''),
          hasPayAndBook: /pay .+ & book/i.test(submit?.textContent || ''),
          snippet: body.slice(0, 400),
        };
      });

      results.push({
        id: 'ui-no-pay-online',
        pass: ui.payOnlineCount === 0 && !ui.paymentMethodLabel,
        detail: ui,
      });
      results.push({
        id: 'ui-confirm-booking-cta',
        pass: ui.hasConfirmBooking && !ui.hasPayAndBook,
        detail: { submitText: ui.submitText },
      });
      results.push({
        id: 'ui-sticky-catalog-total',
        pass: /80/.test(ui.stickyAmount) && !/^US\$0/.test(ui.stickyAmount),
        detail: { stickyAmount: ui.stickyAmount },
      });
      results.push({
        id: 'ui-form-total-not-zero',
        pass: /80/.test(ui.cartTotal || '') && !/^US\$0/.test(ui.cartTotal || ''),
        detail: { cartTotal: ui.cartTotal },
      });
    }

    // Full prepay regression UI
    const fullSlot = await findSlot(FULL_ID);
    if (fullSlot) {
      const qs = new URLSearchParams({
        serviceId: FULL_ID,
        startTime: fullSlot.startTime,
        ...(fullSlot.employeeId ? { employeeId: fullSlot.employeeId } : {}),
      });
      await page.goto(`${BASE}/checkout?${qs}`, {
        waitUntil: 'networkidle2',
        timeout: 60000,
      });
      await new Promise((r) => setTimeout(r, 2000));
      const ui = await page.evaluate(() => {
        const submit = document.querySelector('[data-testid="checkout-submit"]');
        const payOnline = [...document.querySelectorAll('button')].some((b) =>
          /pay online/i.test(b.textContent || ''),
        );
        return {
          submitText: (submit?.textContent || '').replace(/\s+/g, ' ').trim(),
          payOnline,
        };
      });
      results.push({
        id: 'ui-full-pay-and-book',
        pass: /pay .+ & book/i.test(ui.submitText) && !ui.payOnline,
        detail: ui,
      });
    }

    await browser.close();
  } finally {
    // Prefer original deposit if that was the seeded shape; else restore prev.
    const mode = prev?.prepayment_mode === 'none' ? 'deposit' : prev.prepayment_mode;
    const deposit =
      prev?.prepayment_mode === 'none' ? 25 : prev.deposit_amount;
    await client.query(
      `UPDATE services SET prepayment_mode=$2, deposit_amount=$3 WHERE id=$1`,
      [SWEDISH_ID, mode, deposit],
    );
    await client.end();
  }

  console.log(JSON.stringify({ results }, null, 2));
  const failed = results.filter((r) => !r.pass);
  if (failed.length) {
    console.error(`FAIL ${failed.length}/${results.length}`);
    process.exit(1);
  }
  console.log(`PASS ${results.length}/${results.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
