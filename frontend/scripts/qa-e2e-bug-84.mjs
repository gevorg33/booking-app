/**
 * Manual live QA for e2e-bug.84 — privacy_delete must preview before erasure.
 * Also covers e2e-bug.257 — pending flags echo + confirm rescue on customer surface.
 *
 * Run: node scripts/qa-e2e-bug-84.mjs
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

async function assistant(prompt, { token, context, history } = {}) {
  const res = await request('POST', `/public/${SLUG}/assistant`, {
    token,
    body: {
      prompt,
      assistantMode: 'act',
      locale: 'en',
      context: { slug: SLUG, ...(context || {}) },
      ...(history ? { history } : {}),
    },
  });
  return res.body?.data ?? res.body;
}

function isAnonymized(row) {
  return (
    row &&
    row.isActive === false &&
    /anonymized\.local$/i.test(String(row.email || ''))
  );
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

  const results = [];
  const push = (id, pass, detail) => {
    results.push({ id, pass, detail });
    console.log(`${pass ? 'PASS' : 'FAIL'} ${id}`, JSON.stringify(detail));
  };

  console.log(`e2e-bug.84 QA → ${API} ${SLUG}\n`);

  // --- anon ---
  {
    const data = await assistant('Delete my account data');
    push(
      'anon-sign-in-gate',
      data?.action === 'privacy_delete' &&
        data?.success === false &&
        /sign in/i.test(String(data?.summary || '')),
      {
        action: data?.action,
        success: data?.success,
        summary: String(data?.summary || '').slice(0, 120),
      },
    );
  }

  const mkCustomer = async (label) => {
    const id = randomUUID();
    const email = `e2e84-${label}-${Date.now()}@example.com`;
    await c.query(
      `INSERT INTO customers (id, business_id, name, email, phone, metadata, "isActive", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,'{}'::jsonb,true,NOW(),NOW())`,
      [id, biz.id, `e2e84 ${label}`, email, '+15555550884'],
    );
    const token = jwt.sign(
      {
        sub: id,
        email: email.toLowerCase(),
        businessId: biz.id,
        type: 'public_customer',
      },
      secret,
      { expiresIn: '2h' },
    );
    return { id, email, token };
  };

  const readCust = async (id) =>
    (
      await c.query(
        `SELECT name, email, phone, "isActive" FROM customers WHERE id=$1`,
        [id],
      )
    ).rows[0];

  const cleanup = async (id) => {
    await c.query(`DELETE FROM customers WHERE id=$1`, [id]);
  };

  try {
    // --- first turn preview ---
    {
      const cust = await mkCustomer('preview');
      const data = await assistant('Delete my account data', {
        token: cust.token,
      });
      const row = await readCust(cust.id);
      const pending =
        data?.sessionContext?.privacyDeletePending === 'true' ||
        data?.sessionContext?.privacyDeletePending === true;
      push(
        'first-turn-previews',
        data?.action === 'privacy_delete' &&
          data?.success === false &&
          /Reply yes to confirm/i.test(String(data?.summary || '')) &&
          pending &&
          !isAnonymized(row) &&
          row.isActive === true,
        {
          action: data?.action,
          success: data?.success,
          summary: String(data?.summary || '').slice(0, 120),
          sessionContext: data?.sessionContext,
          db: row,
        },
      );
      await cleanup(cust.id);
    }

    // --- bare yes without pending ---
    {
      const cust = await mkCustomer('bareyes');
      await assistant('Delete my account data', { token: cust.token });
      const data = await assistant('yes', { token: cust.token });
      const row = await readCust(cust.id);
      push(
        'bare-yes-without-pending-no-op',
        !isAnonymized(row) && row.isActive === true,
        {
          action: data?.action,
          success: data?.success,
          summary: String(data?.summary || '').slice(0, 120),
          db: row,
        },
      );
      await cleanup(cust.id);
    }

    // --- yes with pending context (e2e-bug.257) ---
    {
      const cust = await mkCustomer('pending');
      const t1 = await assistant('Delete my account data', {
        token: cust.token,
      });
      const pendingCtx = {
        privacyDeletePending: true,
        requiresConfirmation: true,
        pendingAction: 'privacy_delete',
        ...(t1?.sessionContext || {}),
      };
      const data = await assistant('yes', {
        token: cust.token,
        context: pendingCtx,
      });
      const row = await readCust(cust.id);
      push(
        'yes-with-pending-context-erases',
        data?.action === 'privacy_delete' &&
          data?.success === true &&
          isAnonymized(row),
        {
          action: data?.action,
          success: data?.success,
          summary: String(data?.summary || '').slice(0, 120),
          db: row,
        },
      );
      await cleanup(cust.id);
    }

    // --- yes with history ---
    {
      const cust = await mkCustomer('history');
      const t1 = await assistant('Delete my account data', {
        token: cust.token,
      });
      const data = await assistant('yes', {
        token: cust.token,
        history: [
          { role: 'user', content: 'Delete my account data' },
          { role: 'assistant', content: String(t1?.summary || '') },
        ],
      });
      const row = await readCust(cust.id);
      push(
        'yes-with-history-erases',
        data?.action === 'privacy_delete' &&
          data?.success === true &&
          isAnonymized(row),
        {
          action: data?.action,
          success: data?.success,
          summary: String(data?.summary || '').slice(0, 120),
          db: row,
        },
      );
      await cleanup(cust.id);
    }

    // --- first-turn paraphrases (no erasure) ---
    const paraphrases = [
      'Erase my personal data',
      'Anonymize my account',
      'GDPR delete my data',
    ];
    for (const prompt of paraphrases) {
      const cust = await mkCustomer('para');
      const data = await assistant(prompt, { token: cust.token });
      const row = await readCust(cust.id);
      const id = `paraphrase-${prompt.slice(0, 24).replace(/\s+/g, '-')}`;
      push(
        id,
        data?.action === 'privacy_delete' &&
          data?.success === false &&
          !isAnonymized(row),
        {
          prompt,
          action: data?.action,
          success: data?.success,
          summary: String(data?.summary || '').slice(0, 100),
        },
      );
      await cleanup(cust.id);
    }
  } finally {
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
