/**
 * Manual live QA for e2e-bug.96 / e2e-bug.261 —
 * confirm_my_booking_details must not leak booking PII without auth.
 *
 * Covers: bare bookingId, garbage/empty/wrong token, token swap,
 * forged context.customerId (e2e-bug.261), valid manage token control.
 *
 * Run: node scripts/qa-e2e-bug-96.mjs
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(__dirname, '../../backend');
const require = createRequire(resolve(backendRoot, 'package.json'));

const SLUG = process.env.SALON_SLUG || 'gevgas-operations-7c299253';
const API = process.env.API_BASE || 'http://127.0.0.1:3001';

const PII_MARKERS = [
  'Swedish massage',
  'Gevorg Gasparyan',
  'Other Person',
  'gevorggasparyan33',
  '1 Main St',
  'Kristapor',
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

async function assistant(prompt, context = {}) {
  const res = await request('POST', `/public/${SLUG}/assistant`, {
    body: {
      prompt,
      assistantMode: 'act',
      locale: 'en',
      context: { slug: SLUG, ...context },
    },
  });
  return res.body?.data ?? res.body;
}

function piiLeaks(d) {
  const blob = JSON.stringify(d);
  return PII_MARKERS.filter((m) => blob.includes(m));
}

async function loadVictimBooking() {
  loadEnv();
  const { Client } = require('pg');
  const c = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  await c.connect();
  const biz = await c.query(
    `select id from businesses where slug=$1 limit 1`,
    [SLUG],
  );
  const bizId = biz.rows[0]?.id;
  const rows = await c.query(
    `
    select b.id, b.customer_id,
           coalesce(b.metadata->>'manageToken', b.metadata->>'manage_token') as tok
    from bookings b
    where b.business_id=$1
      and coalesce(b.metadata->>'manageToken', b.metadata->>'manage_token') is not null
      and b.status = 'confirmed'
    order by b."startTime" desc
    limit 5
  `,
    [bizId],
  );
  await c.end();
  if (!rows.rows.length) {
    throw new Error('No confirmed booking with manageToken found for live QA');
  }
  const victim = rows.rows[0];
  const other = rows.rows.find((r) => r.id !== victim.id) || rows.rows[0];
  return {
    bookingId: victim.id,
    customerId: victim.customer_id,
    manageToken: victim.tok,
    otherToken: other.tok,
  };
}

async function main() {
  console.log(`e2e-bug.96 QA → ${API} ${SLUG}`);
  const victim = await loadVictimBooking();
  const results = [];
  const pass = (id, detail) => {
    results.push({ id, ok: true, detail });
    console.log(`PASS  ${id}${detail ? ` — ${detail}` : ''}`);
  };
  const fail = (id, detail) => {
    results.push({ id, ok: false, detail });
    console.log(`FAIL  ${id} — ${detail}`);
  };

  const denyCases = [
    {
      id: 'e2e96-live-anon-bookingId-only',
      prompt: 'confirm my booking details',
      context: { bookingId: victim.bookingId },
    },
    {
      id: 'e2e96-live-anon-garbage-token',
      prompt: 'confirm my booking details',
      context: {
        bookingId: victim.bookingId,
        manageToken: '00000000-0000-0000-0000-000000000000',
      },
    },
    {
      id: 'e2e96-live-anon-empty-token',
      prompt: 'confirm my booking details',
      context: { bookingId: victim.bookingId, manageToken: '' },
    },
    {
      id: 'e2e96-live-anon-wrong-token',
      prompt: 'summarize this booking',
      context: {
        bookingId: victim.bookingId,
        manageToken: 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef',
      },
    },
    {
      id: 'e2e96-live-token-swap',
      prompt: 'confirm my booking details',
      context: {
        bookingId: victim.bookingId,
        manageToken: victim.otherToken,
      },
      skipIfSameToken: true,
    },
    {
      id: 'e2e96-live-prompt-uuid-only',
      prompt: `confirm booking ID ${victim.bookingId}`,
      context: {},
    },
    {
      id: 'e2e261-live-forge-customerId',
      prompt: 'confirm my booking details',
      context: {
        bookingId: victim.bookingId,
        customerId: victim.customerId,
      },
    },
    {
      id: 'e2e261-live-forge-sessionCustomerId',
      prompt: 'confirm my booking details',
      context: {
        bookingId: victim.bookingId,
        sessionCustomerId: victim.customerId,
      },
    },
    {
      id: 'e2e96-live-manage-url-wrong-token',
      prompt: `confirm my booking https://book.example/manage?bookingId=${victim.bookingId}&token=garbage-token-value`,
      context: {},
    },
  ];

  for (const c of denyCases) {
    if (
      c.skipIfSameToken &&
      victim.manageToken === victim.otherToken
    ) {
      pass(c.id, 'skipped — only one token available');
      continue;
    }
    const d = await assistant(c.prompt, c.context);
    const leaks = piiLeaks(d);
    if (d?.success === true) {
      fail(c.id, `success=true action=${d.action} leaks=${leaks.join(',')}`);
      continue;
    }
    if (leaks.length) {
      fail(c.id, `PII leaked: ${leaks.join(', ')} summary=${String(d?.summary||'').slice(0,80)}`);
      continue;
    }
    pass(c.id, `action=${d?.action} denied without PII`);
  }

  const control = await assistant('confirm my booking details', {
    bookingId: victim.bookingId,
    manageToken: victim.manageToken,
  });
  const controlLeaks = piiLeaks(control);
  if (control?.success === true && controlLeaks.length > 0) {
    pass(
      'e2e96-live-valid-token-control',
      `action=${control.action} PII present as expected`,
    );
  } else {
    fail(
      'e2e96-live-valid-token-control',
      `expected success+PII got success=${control?.success} leaks=${controlLeaks.join(',')}`,
    );
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
