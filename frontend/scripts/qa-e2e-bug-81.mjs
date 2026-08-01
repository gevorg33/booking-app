/**
 * Manual live QA for e2e-bug.81 — my_gift_cards must return a data-bearing
 * summary (counts/balances) + account navigate; never the static
 * "Your gift cards." string. Public assistant must strip details.account.
 *
 * Run: node scripts/qa-e2e-bug-81.mjs
 */
import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { randomUUID } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(__dirname, '../../backend');
const require = createRequire(resolve(backendRoot, 'package.json'));

const SLUG = process.env.SALON_SLUG || 'gevgas-operations-7c299253';
const API = process.env.API_BASE || 'http://127.0.0.1:3001';
const FORBIDDEN = 'Your gift cards.';

const NL_PROMPTS = [
  { id: 'show-me-my-gift-cards', prompt: 'Show me my gift cards' },
  { id: 'list-my-gift-cards', prompt: 'List my gift cards' },
  { id: 'what-gift-cards-do-i-have', prompt: 'What gift cards do I have?' },
  { id: 'my-gift-card-orders', prompt: 'Show my gift card orders' },
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
    req.setTimeout(90000, () => req.destroy(new Error('timeout')));
    if (data) req.write(data);
    req.end();
  });
}

async function assistant(prompt, token) {
  const res = await request('POST', `/public/${SLUG}/assistant`, {
    token,
    body: {
      prompt,
      assistantMode: 'act',
      locale: 'en',
      context: { slug: SLUG },
    },
  });
  const data = res.body?.data ?? res.body;
  return { status: res.status, data };
}

function summarizeResult(data) {
  return {
    action: data?.action,
    success: data?.success,
    summary: String(data?.summary ?? '').slice(0, 200),
    navigate: data?.navigate ?? null,
    hasAccountDetail: data?.details?.account != null,
  };
}

async function main() {
  const env = loadEnv();
  const { Client } = require('pg');
  const jwt = require('jsonwebtoken');

  const c = new Client({
    host: process.env.DB_HOST || env.DB_HOST,
    port: process.env.DB_PORT || env.DB_PORT,
    user: process.env.DB_USERNAME || env.DB_USERNAME,
    password: process.env.DB_PASSWORD || env.DB_PASSWORD || undefined,
    database: process.env.DB_NAME || env.DB_NAME,
  });
  await c.connect();

  const biz = (
    await c.query('SELECT id FROM businesses WHERE slug=$1', [SLUG])
  ).rows[0];
  if (!biz) throw new Error(`business not found: ${SLUG}`);

  const secret = process.env.JWT_SECRET || env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET missing');

  const stamp = Date.now();
  const customerId = randomUUID();
  const email = `e2e81-qa-${stamp}@example.com`;
  const giftIds = [];

  await c.query(
    `INSERT INTO customers (id, business_id, name, email, metadata, "isActive", "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,'{}'::jsonb,true,NOW(),NOW())`,
    [customerId, biz.id, 'e2e81 QA', email],
  );

  const token = jwt.sign(
    {
      sub: customerId,
      email: email.toLowerCase(),
      businessId: biz.id,
      type: 'public_customer',
    },
    secret,
    { expiresIn: '2h' },
  );

  const results = [];
  const push = (id, pass, detail) => {
    results.push({ id, pass, detail });
    console.log(`${pass ? 'PASS' : 'FAIL'} ${id}`, JSON.stringify(detail));
  };

  try {
    // 1) Anonymous sign-in gate
    {
      const { data } = await assistant('Show me my gift cards');
      const summary = String(data?.summary ?? '');
      push(
        'anon-sign-in-gate',
        data?.action === 'my_gift_cards' &&
          data?.success === false &&
          /sign in/i.test(summary) &&
          summary !== FORBIDDEN,
        summarizeResult(data),
      );
    }

    // 2) Empty account
    {
      const { data } = await assistant('Show me my gift cards', token);
      const summary = String(data?.summary ?? '');
      const navOk =
        data?.navigate?.path === 'account' &&
        data?.navigate?.query?.tab === 'giftCards';
      push(
        'empty-account-summary',
        data?.action === 'my_gift_cards' &&
          data?.success === true &&
          summary === 'You have no gift cards.' &&
          summary !== FORBIDDEN &&
          navOk &&
          data?.details?.account == null,
        summarizeResult(data),
      );
    }

    // Seed: 2 purchaser orders (balances 30 + 20) + 1 claimed-only redeemed
    const orderA = randomUUID();
    const orderB = randomUUID();
    const redeemed = randomUUID();
    giftIds.push(orderA, orderB, redeemed);
    const codeA = `GCM-E281A${stamp.toString(36).slice(-6).toUpperCase()}`;
    const codeB = `GCM-E281B${stamp.toString(36).slice(-6).toUpperCase()}`;
    const codeR = `GCM-E281R${stamp.toString(36).slice(-6).toUpperCase()}`;

    for (const row of [
      {
        id: orderA,
        code: codeA,
        balance: 30,
        purchaser: customerId,
        claimedBy: null,
        claimedAt: null,
        revealed: true,
      },
      {
        id: orderB,
        code: codeB,
        balance: 20,
        purchaser: customerId,
        claimedBy: null,
        claimedAt: null,
        revealed: true,
      },
      {
        id: redeemed,
        code: codeR,
        balance: 0,
        purchaser: null,
        claimedBy: customerId,
        claimedAt: new Date().toISOString(),
        revealed: true,
      },
    ]) {
      await c.query(
        `INSERT INTO gift_cards (
           id, business_id, code, "initialBalance", balance, currency,
           purchaser_customer_id, claimed_by_customer_id, claimed_at,
           "isActive", card_type, delivery_method, fulfillment_status,
           code_revealed, "createdAt", "updatedAt"
         ) VALUES (
           $1,$2,$3,$4,$4,'USD',
           $5,$6,$7,
           true,'monetary','digital','delivered',
           $8,NOW(),NOW()
         )`,
        [
          row.id,
          biz.id,
          row.code,
          row.balance,
          row.purchaser,
          row.claimedBy,
          row.claimedAt,
          row.revealed,
        ],
      );
    }

    // Ground-truth REST account
    {
      const rest = await request('GET', `/public/${SLUG}/gift-cards/orders`, {
        token,
      });
      const account = rest.body?.data ?? rest.body;
      const orderCount = account?.orders?.length ?? 0;
      const redeemedCount = account?.redeemed?.length ?? 0;
      push(
        'rest-account-seeded',
        rest.status < 300 && orderCount === 2 && redeemedCount === 1,
        {
          status: rest.status,
          orderCount,
          redeemedCount,
          balances: (account?.orders ?? []).map((o) => o.balance),
        },
      );
    }

    // 3) Seeded account via assistant
    {
      const { data } = await assistant('Show me my gift cards', token);
      const summary = String(data?.summary ?? '');
      const expected =
        'You have 2 gift card(s), 1 redeemed. Order balances total 50.';
      const navOk =
        data?.navigate?.path === 'account' &&
        data?.navigate?.query?.tab === 'giftCards';
      push(
        'seeded-account-summary',
        data?.action === 'my_gift_cards' &&
          data?.success === true &&
          summary === expected &&
          summary !== FORBIDDEN &&
          navOk,
        { ...summarizeResult(data), expected },
      );
    }

    // 4) Public strips account, keeps navigate
    {
      const { data } = await assistant('List my gift cards', token);
      push(
        'public-strips-account-keeps-navigate',
        data?.action === 'my_gift_cards' &&
          data?.navigate?.path === 'account' &&
          data?.details?.account == null &&
          String(data?.summary ?? '') !== FORBIDDEN &&
          /\d+\s+gift card/i.test(String(data?.summary ?? '')),
        summarizeResult(data),
      );
    }

    // 5) NL prompt matrix
    let nlPass = 0;
    const nlDetails = [];
    for (const p of NL_PROMPTS) {
      const { data } = await assistant(p.prompt, token);
      const summary = String(data?.summary ?? '');
      const ok =
        data?.action === 'my_gift_cards' &&
        data?.success === true &&
        summary !== FORBIDDEN &&
        /gift card/i.test(summary) &&
        /\d+/.test(summary);
      if (ok) nlPass += 1;
      nlDetails.push({ id: p.id, ...summarizeResult(data), ok });
    }
    push(
      'nl-prompts-route-my-gift-cards',
      nlPass === NL_PROMPTS.length,
      { nlPass, total: NL_PROMPTS.length, nlDetails },
    );
  } finally {
    if (giftIds.length) {
      await c.query(`DELETE FROM gift_cards WHERE id = ANY($1::uuid[])`, [
        giftIds,
      ]);
    }
    await c.query(`DELETE FROM customers WHERE id=$1`, [customerId]);
    await c.end();
  }

  console.log(`\ne2e-bug.81 QA → ${API} ${SLUG}`);
  const failed = results.filter((r) => !r.pass);
  console.log(`${results.filter((r) => r.pass).length}/${results.length} passed`);
  if (failed.length) {
    console.error('FAILED', failed.map((f) => f.id));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
