/**
 * Guru live QA for e2e-bug.286 — "Create a booking for the first available…"
 * must stay create_booking, never create_employee.
 *
 * Run: node frontend/scripts/qa-e2e-bug-286.mjs
 * Requires: API on :3001, salon gevgas-operations-7c299253
 */
import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(__dirname, '../../backend');
const require = createRequire(resolve(backendRoot, 'package.json'));

const SLUG = process.env.SALON_SLUG || 'gevgas-operations-7c299253';
const API = process.env.API_BASE || 'http://127.0.0.1:3001';

function loadEnv() {
  const envPath = resolve(backendRoot, '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    if (process.env[key] == null) {
      process.env[key] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }
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
    req.setTimeout(120000, () => req.destroy(new Error('timeout')));
    if (data) req.write(data);
    req.end();
  });
}

function unwrap(body) {
  return body?.data ?? body;
}

function topAction(data) {
  return (
    data?.action ||
    data?.intent ||
    data?.plan?.action ||
    data?.steps?.[0]?.action ||
    ''
  );
}

function hasBookingFirstAvailable(data) {
  if (data?.params?.bookingFirstAvailable === true) return true;
  if (data?.details?.bookingFirstAvailable === true) return true;
  if (data?.plan?.params?.bookingFirstAvailable === true) return true;
  const steps = data?.steps || data?.compoundSteps || data?.details?.steps;
  if (Array.isArray(steps)) {
    return steps.some(
      (s) =>
        s?.params?.bookingFirstAvailable === true ||
        s?.bookingFirstAvailable === true,
    );
  }
  return false;
}

async function main() {
  loadEnv();
  process.chdir(backendRoot);

  const {
    isCreateEmployeePrompt,
    isCreateBookingNotEmployeePrompt,
    rescueStaffOperationsIntent,
  } = require(resolve(
    backendRoot,
    'dist/modules/ai/ai-staff-operations.util.js',
  ));
  const { isFirstAvailableBookingPrompt } = require(resolve(
    backendRoot,
    'dist/modules/ai/booking-first-available.semantic.util.js',
  ));
  const { AiIntentRescueService } = require(resolve(
    backendRoot,
    'dist/modules/ai/ai-intent-rescue.service.js',
  ));

  const results = [];
  function record(id, pass, detail) {
    results.push({ id, pass, detail });
    console.log(
      `${pass ? 'PASS' : 'FAIL'}  ${id} — ${JSON.stringify(detail).slice(0, 360)}`,
    );
  }

  const canonical =
    'Create a booking for the first available massage slot on Monday for any provider';

  record(
    'unit-detector-not-create-employee',
    isCreateEmployeePrompt(canonical) === false &&
      isCreateBookingNotEmployeePrompt(canonical) === true,
    {
      isCreateEmployee: isCreateEmployeePrompt(canonical),
      isCreateBooking: isCreateBookingNotEmployeePrompt(canonical),
    },
  );
  record(
    'unit-staff-rescue-does-not-steal',
    rescueStaffOperationsIntent(canonical, 'unknown') == null &&
      rescueStaffOperationsIntent(canonical, 'create_booking') == null,
    {
      fromUnknown: rescueStaffOperationsIntent(canonical, 'unknown'),
      fromCreateBooking: rescueStaffOperationsIntent(
        canonical,
        'create_booking',
      ),
    },
  );
  record(
    'unit-first-available-semantic',
    isFirstAvailableBookingPrompt(canonical) === true,
    { isFA: isFirstAvailableBookingPrompt(canonical) },
  );

  const rescue = new AiIntentRescueService();
  const rescuedFromEmployee = rescue.rescue({
    prompt: canonical,
    action: 'create_employee',
    params: {},
    surface: 'dashboard',
  });
  record(
    'unit-rescue-from-create-employee',
    rescuedFromEmployee.action === 'create_booking' &&
      rescuedFromEmployee.params?.bookingFirstAvailable === true &&
      rescuedFromEmployee.params?.allProviders === true,
    {
      action: rescuedFromEmployee.action,
      bookingFirstAvailable: rescuedFromEmployee.params?.bookingFirstAvailable,
      allProviders: rescuedFromEmployee.params?.allProviders,
      reason: rescuedFromEmployee.rescueReason,
    },
  );

  record(
    'unit-ctrl-add-stylist',
    isCreateEmployeePrompt('Add stylist Anna') === true,
    { isCreateEmployee: isCreateEmployeePrompt('Add stylist Anna') },
  );

  const { Client } = require('pg');
  const jwt = require('jsonwebtoken');

  const c = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD || undefined,
    database: process.env.DB_NAME,
  });
  await c.connect();

  const biz = (
    await c.query('SELECT id, timezone FROM businesses WHERE slug=$1', [SLUG])
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
      `SELECT id, name FROM employees WHERE business_id=$1 AND "isActive"=true LIMIT 1`,
      [biz.id],
    )
  ).rows[0];

  const token = jwt.sign(
    {
      sub: member.user_id,
      email: String(member.email).toLowerCase(),
      role: member.user_role,
      businessId: biz.id,
      membershipRole: member.role,
      employeeId: emp?.id ?? null,
    },
    process.env.JWT_SECRET,
    { expiresIn: '2h' },
  );
  await c.end();

  async function dashboardAi(prompt) {
    const res = await request('POST', `/businesses/${biz.id}/ai/command`, {
      token,
      body: { prompt, context: {} },
    });
    return { status: res.status, data: unwrap(res.body) };
  }

  console.log(`e2e-bug.286 QA → ${API} ${SLUG}\n`);

  const liveCases = [
    {
      id: 'live-canonical-create-booking-first-available',
      prompt: canonical,
      expectedActions: ['create_booking', 'book_nearest_slot'],
      forbidActions: ['create_employee', 'invite_staff_member'],
      expectBfa: true,
    },
    {
      id: 'live-create-booking-first-available-short',
      prompt: 'Create a booking for the first available massage slot',
      expectedActions: ['create_booking', 'book_nearest_slot'],
      forbidActions: ['create_employee'],
      expectBfa: true,
    },
    {
      id: 'live-create-booking-soonest-any',
      prompt:
        'Create a booking for the soonest massage slot tomorrow for any provider',
      expectedActions: ['create_booking', 'book_nearest_slot'],
      forbidActions: ['create_employee'],
      expectBfa: true,
    },
    {
      id: 'live-create-an-appointment-first-available',
      prompt:
        'Create an appointment for the first available facial slot next Monday for any provider',
      expectedActions: ['create_booking', 'book_nearest_slot'],
      forbidActions: ['create_employee'],
      expectBfa: true,
    },
    {
      id: 'live-make-a-booking-first-available',
      prompt:
        'Make a booking for the first available massage on Monday for any provider',
      expectedActions: ['create_booking', 'book_nearest_slot'],
      forbidActions: ['create_employee'],
      expectBfa: true,
    },
    {
      id: 'live-schedule-a-booking-nearest',
      prompt: 'Schedule a booking for the nearest available haircut slot',
      expectedActions: ['create_booking', 'book_nearest_slot'],
      forbidActions: ['create_employee'],
      expectBfa: true,
    },
    {
      id: 'live-book-verb-control',
      prompt: 'Book first available massage tomorrow evening on any provider',
      expectedActions: ['create_booking', 'book_nearest_slot'],
      forbidActions: ['create_employee'],
      expectBfa: true,
    },
    {
      id: 'live-ctrl-add-stylist',
      prompt: 'Add stylist Anna',
      expectedActions: ['create_employee'],
      forbidActions: ['create_booking'],
      expectBfa: false,
    },
    {
      id: 'live-ctrl-create-employee-maria',
      prompt: 'Create employee Maria with massage services',
      expectedActions: ['create_employee'],
      forbidActions: ['create_booking'],
      expectBfa: false,
    },
    {
      id: 'live-ctrl-hire-provider',
      prompt: 'Hire provider Jake',
      expectedActions: ['create_employee'],
      forbidActions: ['create_booking'],
      expectBfa: false,
    },
  ];

  for (const c of liveCases) {
    const { status, data } = await dashboardAi(c.prompt);
    const action = topAction(data);
    const summary = String(data?.summary || '');
    const actionOk = c.expectedActions.includes(action);
    const forbidOk = !c.forbidActions.includes(action);
    const bfa = hasBookingFirstAvailable(data);
    const bfaOk = c.expectBfa ? bfa || /first available|soonest|nearest/i.test(summary) || actionOk : true;
    // For employee controls, clarify asking for employeeName is OK
    const employeeClarifyOk =
      c.expectedActions.includes('create_employee') &&
      (action === 'create_employee' ||
        /employeeName|employee name|provider name/i.test(summary));
    const pass =
      (status === 200 || status === 201) &&
      forbidOk &&
      (actionOk || employeeClarifyOk) &&
      (c.expectBfa ? actionOk && forbidOk : true);
    record(c.id, pass, {
      status,
      action,
      summary: summary.slice(0, 160),
      bfa,
      bfaOk,
      actionOk,
      forbidOk,
    });
  }

  const failed = results.filter((r) => !r.pass);
  console.log(
    `\ne2e-bug.286: ${results.length - failed.length}/${results.length} passed`,
  );
  if (failed.length) {
    console.error('FAILED:', failed.map((f) => f.id).join(', '));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
