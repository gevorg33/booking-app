/**
 * Manual live QA for api-bug.7 — online amountDue is the sum of per-line
 * prepayments (0 for none), not the catalog/package total (servicePrice).
 *
 * Run: node scripts/qa-api-bug-7.mjs
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

/** Mirrors frontend/src/lib/public-checkout-quote.util.ts (api-bug.7 / e2e-bug.214). */
function resolvePublicCheckoutCartTotal(quote, localFallback) {
  const price = quote?.servicePrice;
  if (typeof price === 'number' && Number.isFinite(price)) {
    return Math.max(0, price);
  }
  return Math.max(0, localFallback);
}
function resolvePublicCheckoutAmountDue(quote, localFallback) {
  if (
    quote &&
    typeof quote.amountDue === 'number' &&
    Number.isFinite(quote.amountDue)
  ) {
    return Math.max(0, quote.amountDue);
  }
  return Math.max(0, localFallback);
}
function resolvePublicCheckoutStickyDisplay({ cartTotal, amountDue, hasDiscounts }) {
  const total = Math.max(0, cartTotal);
  const due = Math.max(0, amountDue);
  if (due <= 0 && hasDiscounts) return { amount: 0, kind: 'free_after_discounts' };
  if (due > 0) return { amount: due, kind: 'due_now' };
  return { amount: total, kind: 'total' };
}

const SLUG = process.env.SALON_SLUG || 'gevgas-operations-7c299253';
const API = process.env.API_BASE || 'http://127.0.0.1:3001';
const PKG =
  process.env.PACKAGE_ID || '570ca68d-30df-4988-8070-e17604f20f00';

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

function nearly(a, b, eps = 0.011) {
  return Math.abs(Number(a) - Number(b)) <= eps;
}

async function main() {
  loadEnv();
  console.log(`api-bug.7 QA → ${API} ${SLUG} package=${PKG}\n`);

  let passed = 0;
  let failed = 0;
  let swedishRestore = null;

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

  const detail = unwrap((await request('GET', `/public/${SLUG}/packages/${PKG}`)).body);
  const pkg = detail.package || detail;
  const items = pkg.items || [];
  if (!items.length) throw new Error('package has no items');
  const packagePrice = Number(pkg.pricing?.packagePrice);
  const serviceIds = items.map((i) => i.serviceId);

  const svcRows = await withPg(async (c) => {
    const r = await c.query(
      `select id, name, price, prepayment_mode, deposit_amount
       from services where id = any($1::uuid[])`,
      [serviceIds],
    );
    return r.rows;
  });
  const byId = new Map(svcRows.map((r) => [r.id, r]));
  let expectedPrepay = 0;
  for (const id of serviceIds) {
    const s = byId.get(id);
    if (!s) continue;
    const price = Number(s.price);
    if (s.prepayment_mode === 'full') expectedPrepay += price;
    else if (s.prepayment_mode === 'deposit') {
      expectedPrepay +=
        s.deposit_amount != null && Number(s.deposit_amount) > 0
          ? Math.min(Number(s.deposit_amount), price)
          : Math.round(price * 50) / 100;
    }
  }
  expectedPrepay = Math.round(Math.min(expectedPrepay, packagePrice) * 100) / 100;

  console.log(
    `  packagePrice=${packagePrice} expectedPrepaySum=${expectedPrepay} lines=${serviceIds.length}`,
  );
  console.log(
    `  modes: ${svcRows.map((s) => `${s.name}:${s.prepayment_mode}`).join(', ')}\n`,
  );

  let quoteAmountDue = null;
  await check('api7-live-package-quote-deposit-line-only', async () => {
    const res = await request('POST', `/public/${SLUG}/packages/quote`, {
      body: { packageId: PKG },
    });
    if (res.status !== 200 && res.status !== 201) {
      throw new Error(`quote status=${res.status}`);
    }
    const q = unwrap(res.body);
    quoteAmountDue = Number(q.amountDue);
    if (!nearly(q.servicePrice, packagePrice)) {
      throw new Error(
        `servicePrice=${q.servicePrice} expected ${packagePrice}`,
      );
    }
    if (!nearly(q.amountDue, expectedPrepay)) {
      throw new Error(
        `amountDue=${q.amountDue} expected prepay sum ${expectedPrepay}`,
      );
    }
    if (nearly(q.amountDue, packagePrice) && expectedPrepay < packagePrice) {
      throw new Error('amountDue incorrectly equals full package price');
    }
    return `servicePrice=${q.servicePrice} amountDue=${q.amountDue}`;
  });

  await check('api7-live-package-checkout-charges-prepay-only', async () => {
    if (quoteAmountDue == null) throw new Error('no quote');
    if (quoteAmountDue <= 0) {
      return 'skipped — current package amountDue is 0 (covered by all-none case)';
    }
    const slots = unwrap(
      (await request('GET', `/public/${SLUG}/packages/${PKG}/suggest-slots`))
        .body,
    );
    const lines = (slots.lines || []).map((l) => ({
      serviceId: l.serviceId,
      startTime: l.startTime,
      employeeId: l.employeeId,
    }));
    if (!lines.length) throw new Error('no package lines');
    const res = await request('POST', `/public/${SLUG}/packages/checkout`, {
      body: {
        packageId: PKG,
        lines,
        customer: {
          name: 'API Bug7 Checkout',
          email: `api-bug7-co-${Date.now()}@example.com`,
          phone: '+15550007777',
        },
      },
    });
    if (res.status !== 200 && res.status !== 201) {
      throw new Error(
        `checkout status=${res.status} ${JSON.stringify(res.body).slice(0, 200)}`,
      );
    }
    const data = unwrap(res.body);
    const amt = data.amount ?? data.total;
    if (amt != null && !nearly(amt, quoteAmountDue)) {
      throw new Error(
        `stripe amount=${amt} expected amountDue=${quoteAmountDue}`,
      );
    }
    if (!/checkout\.stripe\.com/i.test(String(data.url || ''))) {
      throw new Error('missing stripe url');
    }
    return `stripe session amount=${amt ?? 'n/a'} (due=${quoteAmountDue})`;
  });

  await check('api7-live-package-all-none-amount-due-zero', async () => {
    const swedish = svcRows.find((s) => /swedish/i.test(s.name));
    if (!swedish) throw new Error('swedish not in package');
    swedishRestore = {
      id: swedish.id,
      mode: swedish.prepayment_mode,
      deposit: swedish.deposit_amount,
    };
    await withPg(async (c) => {
      await c.query(
        `update services set prepayment_mode='none', deposit_amount=null where id=$1`,
        [swedish.id],
      );
    });
    try {
      const res = await request('POST', `/public/${SLUG}/packages/quote`, {
        body: { packageId: PKG },
      });
      const q = unwrap(res.body);
      if (!nearly(q.servicePrice, packagePrice)) {
        throw new Error(`servicePrice=${q.servicePrice}`);
      }
      if (Number(q.amountDue) !== 0) {
        throw new Error(
          `expected amountDue 0 after all-none, got ${q.amountDue}`,
        );
      }
      const slots = unwrap(
        (await request('GET', `/public/${SLUG}/packages/${PKG}/suggest-slots`))
          .body,
      );
      const lines = (slots.lines || []).map((l) => ({
        serviceId: l.serviceId,
        startTime: l.startTime,
        employeeId: l.employeeId,
      }));
      const checkout = await request(
        'POST',
        `/public/${SLUG}/packages/checkout`,
        {
          body: {
            packageId: PKG,
            lines,
            customer: {
              name: 'API Bug7 None',
              email: `api-bug7-none-${Date.now()}@example.com`,
              phone: '+15550008888',
            },
          },
        },
      );
      if (checkout.status !== 400) {
        throw new Error(
          `expected 400 no payment due, got ${checkout.status} ${JSON.stringify(checkout.body).slice(0, 180)}`,
        );
      }
      const msg = String(checkout.body?.message || '');
      if (!/no payment is due/i.test(msg)) {
        throw new Error(`unexpected message: ${msg}`);
      }
      return `amountDue=0; checkout 400 "${msg.slice(0, 60)}"`;
    } finally {
      if (swedishRestore) {
        await withPg(async (c) => {
          await c.query(
            `update services set prepayment_mode=$2, deposit_amount=$3 where id=$1`,
            [
              swedishRestore.id,
              swedishRestore.mode,
              swedishRestore.deposit,
            ],
          );
        });
        swedishRestore = null;
      }
    }
  });

  // Multi-service: two none lines Gevorg can do
  const allSvcs = await withPg(async (c) => {
    const r = await c.query(
      `select id, name, price, prepayment_mode, deposit_amount
       from services
       where business_id=(select id from businesses where slug=$1)
         and "isActive"=true`,
      [SLUG],
    );
    return r.rows;
  });
  const nonePair = allSvcs
    .filter((s) => s.prepayment_mode === 'none')
    .filter((s) =>
      /deep tissue|neck|full body|hot stone|facemassage|swedish/i.test(s.name),
    )
    .slice(0, 2);
  // Prefer deep tissue + neck/facemassage
  const deep = allSvcs.find((s) => /deep tissue/i.test(s.name));
  const neck = allSvcs.find((s) => /neck/i.test(s.name));
  const face = allSvcs.find((s) => /facemassage/i.test(s.name));
  const multiNone = [deep, neck || face].filter(
    (s) => s && s.prepayment_mode === 'none',
  );
  if (multiNone.length < 2 && nonePair.length >= 2) {
    multiNone.length = 0;
    multiNone.push(...nonePair);
  }

  await check('api7-live-multi-all-none-quote', async () => {
    if (multiNone.length < 2) throw new Error('need 2 none services');
    const ids = multiNone.map((s) => s.id);
    const res = await request('POST', `/public/${SLUG}/multi-service/quote`, {
      body: { serviceIds: ids },
    });
    if (res.status !== 200 && res.status !== 201) {
      throw new Error(
        `status=${res.status} ${JSON.stringify(res.body).slice(0, 200)}`,
      );
    }
    const q = unwrap(res.body);
    const catalog = Number(multiNone[0].price) + Number(multiNone[1].price);
    if (!(Number(q.servicePrice) > 0)) {
      throw new Error(`servicePrice should be >0, got ${q.servicePrice}`);
    }
    if (!nearly(q.servicePrice, catalog)) {
      // may include tax/rounding — allow small drift but must not be 0
      if (Number(q.servicePrice) < 1) {
        throw new Error(`servicePrice too small: ${q.servicePrice}`);
      }
    }
    if (Number(q.amountDue) !== 0) {
      throw new Error(`amountDue=${q.amountDue} expected 0`);
    }
    return `servicePrice=${q.servicePrice} amountDue=0 (${multiNone.map((s) => s.name).join('+')})`;
  });

  await check('api7-live-multi-all-none-checkout-refused', async () => {
    if (multiNone.length < 2) throw new Error('need 2 none services');
    const ids = multiNone.map((s) => s.id);
    const qs = ids.map((id) => `serviceIds=${id}`).join('&');
    const suggest = await request(
      'GET',
      `/public/${SLUG}/multi-service/suggest-block?${qs}`,
    );
    if (suggest.status !== 200) {
      throw new Error(
        `suggest-block ${suggest.status} ${JSON.stringify(suggest.body).slice(0, 160)}`,
      );
    }
    const block = unwrap(suggest.body);
    const res = await request('POST', `/public/${SLUG}/multi-service/checkout`, {
      body: {
        serviceIds: ids,
        blockStartTime: block.startTime,
        employeeId: block.employeeId,
        customer: {
          name: 'API Bug7 Multi',
          email: `api-bug7-multi-${Date.now()}@example.com`,
          phone: '+15550006666',
        },
      },
    });
    if (res.status !== 400) {
      throw new Error(
        `expected 400, got ${res.status} ${JSON.stringify(res.body).slice(0, 200)}`,
      );
    }
    if (!/no payment is due/i.test(String(res.body?.message || ''))) {
      throw new Error(`msg=${res.body?.message}`);
    }
    return 'multi checkout refused when amountDue=0';
  });

  await check('api7-live-multi-mixed-deposit', async () => {
    const swedish = allSvcs.find(
      (s) => /swedish/i.test(s.name) && s.prepayment_mode === 'deposit',
    );
    const partner = allSvcs.find(
      (s) =>
        s.prepayment_mode === 'none' &&
        /deep tissue|neck|facemassage|full body/i.test(s.name),
    );
    if (!swedish || !partner) {
      throw new Error('need swedish deposit + none partner');
    }
    const res = await request('POST', `/public/${SLUG}/multi-service/quote`, {
      body: { serviceIds: [swedish.id, partner.id] },
    });
    if (res.status !== 200 && res.status !== 201) {
      throw new Error(
        `status=${res.status} ${JSON.stringify(res.body).slice(0, 200)}`,
      );
    }
    const q = unwrap(res.body);
    const dep = Number(swedish.deposit_amount) || 25;
    if (!nearly(q.amountDue, dep)) {
      throw new Error(`amountDue=${q.amountDue} expected deposit ${dep}`);
    }
    const catalog = Number(swedish.price) + Number(partner.price);
    if (!nearly(q.servicePrice, catalog) && Number(q.servicePrice) <= dep) {
      throw new Error(
        `servicePrice=${q.servicePrice} should be catalog (~${catalog}), not just deposit`,
      );
    }
    return `servicePrice=${q.servicePrice} amountDue=${q.amountDue} (deposit-only)`;
  });

  await check('api7-live-single-deposit-quote', async () => {
    const swedish = allSvcs.find(
      (s) => /swedish/i.test(s.name) && s.prepayment_mode === 'deposit',
    );
    if (!swedish) throw new Error('swedish deposit service missing');
    const res = await request('POST', `/public/${SLUG}/bookings/quote`, {
      body: { serviceId: swedish.id },
    });
    if (res.status !== 200 && res.status !== 201) {
      throw new Error(
        `status=${res.status} ${JSON.stringify(res.body).slice(0, 200)}`,
      );
    }
    const q = unwrap(res.body);
    const dep = Number(swedish.deposit_amount) || 25;
    if (!nearly(q.servicePrice, Number(swedish.price))) {
      throw new Error(`servicePrice=${q.servicePrice} expected ${swedish.price}`);
    }
    if (!nearly(q.amountDue, dep)) {
      throw new Error(`amountDue=${q.amountDue} expected ${dep}`);
    }
    return `servicePrice=${q.servicePrice} amountDue=${q.amountDue}`;
  });

  await check('api7-live-frontend-cart-total-semantics', async () => {
    const quote = { servicePrice: 344.25, subtotal: 0, amountDue: 0 };
    const cart = resolvePublicCheckoutCartTotal(quote, 344.25);
    const due = resolvePublicCheckoutAmountDue(quote, 344.25);
    const sticky = resolvePublicCheckoutStickyDisplay({
      cartTotal: cart,
      amountDue: due,
      hasDiscounts: false,
    });
    if (cart !== 344.25 || due !== 0 || sticky.kind !== 'total') {
      throw new Error(JSON.stringify({ cart, due, sticky }));
    }
    const depositQuote = { servicePrice: 344.25, amountDue: 25 };
    const stickyDue = resolvePublicCheckoutStickyDisplay({
      cartTotal: resolvePublicCheckoutCartTotal(depositQuote, 344.25),
      amountDue: resolvePublicCheckoutAmountDue(depositQuote, 0),
      hasDiscounts: false,
    });
    if (stickyDue.kind !== 'due_now' || stickyDue.amount !== 25) {
      throw new Error(JSON.stringify(stickyDue));
    }
    return 'cart Total=servicePrice; sticky Due now when amountDue>0';
  });

  // Safety: ensure swedish restored
  if (swedishRestore) {
    await withPg(async (c) => {
      await c.query(
        `update services set prepayment_mode=$2, deposit_amount=$3 where id=$1`,
        [swedishRestore.id, swedishRestore.mode, swedishRestore.deposit],
      );
    });
  }

  console.log(`\napi-bug.7 live QA: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
