/**
 * Manual live QA for e2e-bug.165 — dashboard cancel refunds paid bookings and
 * concurrent cancels do not silently clobber each other.
 *
 * Salon: gevgas-operations-7c299253
 * Creates disposable future bookings, cancels via dashboard + guest manage,
 * cleans up rows after.
 */
import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { randomBytes } from 'crypto';
import http from 'http';

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
    if (process.env[key] == null) {
      process.env[key] = m[2].trim().replace(/^["']|["']$/g, '');
    }
    env[key] = process.env[key];
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
    req.setTimeout(60000, () => req.destroy(new Error('timeout')));
    if (data) req.write(data);
    req.end();
  });
}

function manageToken() {
  return randomBytes(24).toString('hex');
}

async function main() {
  loadEnv();
  const { Client } = require('pg');
  const jwt = require('jsonwebtoken');
  const Stripe = require('stripe');

  const c = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD || undefined,
    database: process.env.DB_NAME,
  });
  await c.connect();

  const biz = (
    await c.query('SELECT id, settings FROM businesses WHERE slug=$1', [SLUG])
  ).rows[0];
  if (!biz) throw new Error(`business not found: ${SLUG}`);

  const member = (
    await c.query(
      `SELECT bm.user_id, bm.role, u.email, u.role AS user_role
       FROM business_members bm
       JOIN users u ON u.id = bm.user_id
       WHERE bm.business_id=$1 AND bm.role='owner' LIMIT 1`,
      [biz.id],
    )
  ).rows[0];
  if (!member) throw new Error('no owner membership');

  const emp = (
    await c.query(
      `SELECT id FROM employees WHERE business_id=$1 AND "isActive"=true LIMIT 1`,
      [biz.id],
    )
  ).rows[0];
  const svc = (
    await c.query(
      `SELECT id, price FROM services WHERE business_id=$1 AND "isActive"=true LIMIT 1`,
      [biz.id],
    )
  ).rows[0];
  if (!emp || !svc) throw new Error('need employee + service');

  const ownerToken = jwt.sign(
    {
      sub: member.user_id,
      email: String(member.email).toLowerCase(),
      role: member.user_role,
      businessId: biz.id,
      membershipRole: member.role,
      employeeId: null,
    },
    process.env.JWT_SECRET,
    { expiresIn: '2h' },
  );

  const createdIds = [];
  const results = [];

  async function insertBooking({
    paymentStatus = 'pending',
    metadata = {},
    startOffsetHours = 48,
  } = {}) {
    const id = cryptoRandomUuid();
    const tok = manageToken();
    const start = new Date(Date.now() + startOffsetHours * 3600 * 1000);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    const meta = { ...metadata, manageToken: tok };
    await c.query(
      `INSERT INTO bookings (
         id, business_id, employee_id, service_id, customer_id,
         status, "paymentStatus", "startTime", "endTime",
         "cancellationReason", metadata, "createdAt", "updatedAt"
       ) VALUES (
         $1,$2,$3,$4,NULL,
         'confirmed',$5,$6,$7,
         NULL,$8::jsonb,NOW(),NOW()
       )`,
      [
        id,
        biz.id,
        emp.id,
        svc.id,
        paymentStatus,
        start.toISOString(),
        end.toISOString(),
        JSON.stringify(meta),
      ],
    );
    createdIds.push(id);
    const row = (
      await c.query(
        `SELECT id, status, "paymentStatus", "cancellationReason", "updatedAt", metadata
         FROM bookings WHERE id=$1`,
        [id],
      )
    ).rows[0];
    return { ...row, manageToken: tok };
  }

  function cryptoRandomUuid() {
    // node 22
    return require('crypto').randomUUID();
  }

  // —— 1) concurrent dashboard + guest manage (unpaid) ——
  {
    const b = await insertBooking({ paymentStatus: 'pending' });
    const dash = request(
      'PUT',
      `/businesses/${biz.id}/bookings/${b.id}/cancel`,
      {
        token: ownerToken,
        body: { reason: 'QA165 dashboard concurrent' },
      },
    );
    // PublicBookingManageCancelDto rejects unknown props (e.g. reason).
    const guest = request(
      'POST',
      `/public/${SLUG}/bookings/manage/cancel`,
      {
        body: {
          bookingId: b.id,
          token: b.manageToken,
        },
      },
    );
    const [dRes, gRes] = await Promise.all([dash, guest]);
    const final = (
      await c.query(
        `SELECT status, "paymentStatus", "cancellationReason", metadata
         FROM bookings WHERE id=$1`,
        [b.id],
      )
    ).rows[0];
    const reasonOk =
      final.cancellationReason === 'QA165 dashboard concurrent' ||
      final.cancellationReason === 'Cancelled by customer' ||
      String(final.cancellationReason || '').length > 0;
    // Both surfaces may return 2xx; loser is idempotent (no clobber).
    const pass =
      (dRes.status === 200 || dRes.status === 201) &&
      (gRes.status === 200 || gRes.status === 201) &&
      final.status === 'cancelled' &&
      reasonOk &&
      final.paymentStatus === 'not_applicable';
    results.push({
      id: 'concurrent-dashboard-vs-guest',
      pass,
      detail: {
        dashStatus: dRes.status,
        guestStatus: gRes.status,
        finalStatus: final.status,
        paymentStatus: final.paymentStatus,
        reason: final.cancellationReason,
        dashBody: summarize(dRes.body),
        guestBody: summarize(gRes.body),
      },
    });
  }

  // —— 2) stale expectedUpdatedAt → 409 ——
  {
    const b = await insertBooking();
    const r = await request(
      'PUT',
      `/businesses/${biz.id}/bookings/${b.id}/cancel`,
      {
        token: ownerToken,
        body: {
          reason: 'QA165 stale',
          expectedUpdatedAt: '2000-01-01T00:00:00.000Z',
        },
      },
    );
    const still = (
      await c.query(`SELECT status FROM bookings WHERE id=$1`, [b.id])
    ).rows[0];
    const msg = JSON.stringify(r.body || {});
    const pass =
      r.status === 409 &&
      /BOOKING_VERSION_CONFLICT|updated by someone else|Conflict/i.test(msg) &&
      still.status === 'confirmed';
    results.push({
      id: 'stale-expectedUpdatedAt',
      pass,
      detail: { status: r.status, still: still.status, body: summarize(r.body) },
    });
  }

  // —— 3) fresh expectedUpdatedAt → cancel ——
  {
    const b = await insertBooking();
    const r = await request(
      'PUT',
      `/businesses/${biz.id}/bookings/${b.id}/cancel`,
      {
        token: ownerToken,
        body: {
          reason: 'QA165 fresh expectedUpdatedAt',
          expectedUpdatedAt: new Date(b.updatedAt).toISOString(),
        },
      },
    );
    const data = r.body?.data || r.body;
    const pass =
      r.status === 200 &&
      data?.status === 'cancelled' &&
      data?.cancellationReason === 'QA165 fresh expectedUpdatedAt';
    results.push({
      id: 'fresh-expectedUpdatedAt',
      pass,
      detail: {
        status: r.status,
        bookingStatus: data?.status,
        reason: data?.cancellationReason,
        paymentStatus: data?.paymentStatus,
      },
    });
  }

  // —— 4) second cancel idempotent (reason preserved) ——
  {
    const b = await insertBooking();
    const first = await request(
      'PUT',
      `/businesses/${biz.id}/bookings/${b.id}/cancel`,
      {
        token: ownerToken,
        body: { reason: 'QA165 first cancel' },
      },
    );
    const second = await request(
      'PUT',
      `/businesses/${biz.id}/bookings/${b.id}/cancel`,
      {
        token: ownerToken,
        body: { reason: 'QA165 second cancel SHOULD NOT WIN' },
      },
    );
    const final = (
      await c.query(
        `SELECT status, "cancellationReason" FROM bookings WHERE id=$1`,
        [b.id],
      )
    ).rows[0];
    const pass =
      first.status === 200 &&
      second.status === 200 &&
      final.status === 'cancelled' &&
      final.cancellationReason === 'QA165 first cancel';
    results.push({
      id: 'second-cancel-idempotent',
      pass,
      detail: {
        first: first.status,
        second: second.status,
        reason: final.cancellationReason,
      },
    });
  }

  // —— 5) paid dashboard refund via Stripe test PI (if configured) ——
  {
    const stripeKey = process.env.STRIPE_SECRET_KEY || '';
    if (!stripeKey.startsWith('sk_test_')) {
      results.push({
        id: 'paid-dashboard-refund',
        pass: false,
        detail: { skip: false, error: 'STRIPE_SECRET_KEY is not sk_test_' },
      });
    } else {
      try {
        const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' });
        const settings = biz.settings || {};
        const connectId =
          settings?.integrations?.stripe?.connectAccountId ||
          settings.stripeConnectAccountId ||
          settings.stripeAccountId ||
          null;
        if (!connectId) {
          throw new Error(
            'business has no integrations.stripe.connectAccountId — cannot create Connect PI',
          );
        }
        // Real checkout charges land on the Connect account; refunds must too.
        const piParams = {
          amount: Math.max(100, Math.round(Number(svc.price || 40) * 100)),
          currency: 'usd',
          payment_method: 'pm_card_visa',
          confirm: true,
          automatic_payment_methods: {
            enabled: true,
            allow_redirects: 'never',
          },
        };
        const pi = await stripe.paymentIntents.create(piParams, {
          stripeAccount: connectId,
        });
        const b = await insertBooking({
          paymentStatus: 'paid',
          metadata: {
            stripePaymentIntentId: pi.id,
            stripeConnectAccountId: connectId,
          },
        });
        const r = await request(
          'PUT',
          `/businesses/${biz.id}/bookings/${b.id}/cancel`,
          {
            token: ownerToken,
            body: { reason: 'QA165 paid refund' },
          },
        );
        const data = r.body?.data || r.body;
        const final = (
          await c.query(
            `SELECT status, "paymentStatus", metadata FROM bookings WHERE id=$1`,
            [b.id],
          )
        ).rows[0];
        const meta = final.metadata || {};
        const pass =
          r.status === 200 &&
          final.status === 'cancelled' &&
          final.paymentStatus === 'refunded' &&
          typeof meta.stripeRefundId === 'string' &&
          meta.stripeRefundId.length > 0 &&
          final.paymentStatus !== 'not_applicable';
        results.push({
          id: 'paid-dashboard-refund',
          pass,
          detail: {
            status: r.status,
            paymentStatus: final.paymentStatus,
            stripeRefundId: meta.stripeRefundId || null,
            pi: pi.id,
            body: summarize(data),
          },
        });
      } catch (err) {
        results.push({
          id: 'paid-dashboard-refund',
          pass: false,
          detail: { error: String(err.message || err).slice(0, 240) },
        });
      }
    }
  }

  // cleanup disposable bookings
  if (createdIds.length) {
    await c.query(`DELETE FROM bookings WHERE id = ANY($1::uuid[])`, [
      createdIds,
    ]);
  }
  await c.end();

  let failed = 0;
  console.log(`e2e-bug.165 QA → ${API} / ${SLUG}\n`);
  for (const row of results) {
    if (row.pass) {
      console.log(`PASS ${row.id}`, JSON.stringify(row.detail).slice(0, 180));
    } else {
      failed += 1;
      console.log(`FAIL ${row.id}`, JSON.stringify(row.detail).slice(0, 280));
    }
  }
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
}

function summarize(body) {
  if (!body) return null;
  if (typeof body === 'string') return body.slice(0, 120);
  const d = body.data || body;
  return {
    status: d.status,
    paymentStatus: d.paymentStatus,
    cancellationReason: d.cancellationReason,
    message: body.message || d.message,
    code: body.code || d.code || body.error,
  };
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
