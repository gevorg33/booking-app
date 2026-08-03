/**
 * Manual live QA for e2e-bug.83 — claim_referral_code must not be stolen by
 * apply_gift_card_code (original) or apply_promo_code_checkout (e2e-bug.232).
 *
 * Run: node scripts/qa-e2e-bug-83.mjs
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

const CLAIM_CASES = [
  {
    id: 'redeem-referral-abc123',
    prompt: 'I want to redeem referral code ABC123',
    expectCode: 'ABC123',
  },
  {
    id: 'claim-referral-friend10',
    prompt: 'Claim referral code FRIEND10',
    expectCode: 'FRIEND10',
  },
  {
    id: 'apply-referral-save20',
    prompt: 'Apply referral code SAVE20',
    expectCode: 'SAVE20',
  },
  {
    id: 'redeem-invite-hello1',
    prompt: "Redeem my friend's invite code HELLO1",
    expectCode: 'HELLO1',
  },
  {
    id: 'redeem-referral-friend10',
    prompt: 'Redeem referral code FRIEND10',
    expectCode: 'FRIEND10',
  },
  {
    id: 'use-referral-welcome1',
    prompt: 'Use referral code WELCOME1',
    expectCode: 'WELCOME1',
  },
  {
    id: 'enter-invite-party99',
    prompt: 'Enter invite code PARTY99',
    expectCode: 'PARTY99',
  },
  {
    id: 'attach-referral-my-account',
    prompt: 'Attach referral code SAVE20 to my account',
    expectCode: 'SAVE20',
  },
  {
    id: 'casual-redeem-referral',
    prompt: 'can i redeem referral code XYZ999 please',
    expectCode: 'XYZ999',
  },
  {
    id: 'apply-invite-joinme',
    prompt: 'Apply invite code JOINME',
    expectCode: 'JOINME',
  },
];

const STEAL_ACTIONS = [
  'apply_gift_card_code',
  'apply_promo_code_checkout',
  'promo_code_help',
  'my_profile',
  'refer_a_friend',
  'guide_user_flow',
];

const CONTROLS = [
  {
    id: 'ctrl-apply-gift-card',
    prompt: 'Apply gift card code GCM-ABCD1234 at checkout',
    expectAction: 'apply_gift_card_code',
  },
  {
    id: 'ctrl-apply-gift-card-generic',
    prompt: 'Apply my gift card at checkout',
    expectAction: 'apply_gift_card_code',
  },
  {
    id: 'ctrl-use-gcm-checkout',
    prompt: 'Use code GCM-ABCD1234 at checkout',
    expectAction: 'apply_gift_card_code',
  },
  {
    id: 'ctrl-apply-promo',
    prompt: 'Apply code SAVE10 at checkout',
    expectAction: 'apply_promo_code_checkout',
  },
  {
    id: 'ctrl-redeem-discount',
    prompt: 'Redeem discount code SPRING15',
    expectAction: 'apply_promo_code_checkout',
  },
  {
    id: 'ctrl-refer-a-friend',
    prompt: 'How do I refer a friend and get my referral code?',
    expectAction: 'refer_a_friend',
  },
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
  return res.body?.data ?? res.body;
}

function detailOf(data) {
  return {
    action: data?.action,
    success: data?.success,
    summary: String(data?.summary ?? '').slice(0, 160),
    referralCode: data?.sessionContext?.referralCode ?? data?.details?.referralCode,
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

  const customerId = randomUUID();
  const email = `e2e83-qa-${Date.now()}@example.com`;
  await c.query(
    `INSERT INTO customers (id, business_id, name, email, metadata, "isActive", "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,'{}'::jsonb,true,NOW(),NOW())`,
    [customerId, biz.id, 'e2e83 QA', email],
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

  console.log(`e2e-bug.83 QA → ${API} ${SLUG}\n`);

  try {
    // Original e2e-bug.83: anon + auth claim prompts must not be gift/promo steals
    for (const auth of [
      { label: 'anon', token: undefined },
      { label: 'auth', token },
    ]) {
      for (const caze of CLAIM_CASES) {
        const data = await assistant(caze.prompt, auth.token);
        const stolen = STEAL_ACTIONS.includes(data?.action);
        const ok =
          data?.action === 'claim_referral_code' &&
          !stolen &&
          data?.action !== 'apply_gift_card_code';
        push(`${auth.label}-${caze.id}`, ok, {
          ...detailOf(data),
          expected: 'claim_referral_code',
          expectCode: caze.expectCode,
        });
      }
    }

    // Controls: gift/promo/refer must stay correct
    for (const ctrl of CONTROLS) {
      const data = await assistant(ctrl.prompt, token);
      push(ctrl.id, data?.action === ctrl.expectAction, {
        ...detailOf(data),
        expected: ctrl.expectAction,
      });
    }
  } finally {
    await c.query(`DELETE FROM customers WHERE id=$1`, [customerId]);
    await c.end();
  }

  const passed = results.filter((r) => r.pass).length;
  console.log(`\n${passed}/${results.length} passed`);
  const failed = results.filter((r) => !r.pass);
  if (failed.length) {
    console.error('FAILED', failed.map((f) => f.id));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
