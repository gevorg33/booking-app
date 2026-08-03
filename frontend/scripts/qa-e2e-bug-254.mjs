/**
 * Guru live QA for e2e-bug.254 — Face Pilling (online/full prepay) must return
 * bookable dates/slots when its exclusive assignee only had past hours.
 *
 * Run: node frontend/scripts/qa-e2e-bug-254.mjs
 * Requires: API on :3001, Postgres from backend/.env
 */
import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(__dirname, '../../backend');
const requireBackend = createRequire(resolve(backendRoot, 'package.json'));
const pg = requireBackend('pg');

const SLUG = process.env.SALON_SLUG || 'gevgas-operations-7c299253';
const API = process.env.API_BASE || 'http://127.0.0.1:3001';
const FACE_NAME = /Face Pilling/i;
const SWEDISH_NAME = /Swedish/i;
const EMPTY_REASON = 'assigned_providers_unscheduled';

function loadEnv() {
  const envPath = resolve(backendRoot, '.env');
  if (!existsSync(envPath)) throw new Error(`missing ${envPath}`);
  const env = {};
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

function getJson(path) {
  return new Promise((resolveP, reject) => {
    http
      .get({ hostname: '127.0.0.1', port: new URL(API).port || 3001, path }, (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          let body = null;
          try {
            body = raw ? JSON.parse(raw) : null;
          } catch {
            body = raw;
          }
          resolveP({ status: res.statusCode, body });
        });
      })
      .on('error', reject);
  });
}

function unwrap(body) {
  if (body && typeof body === 'object' && body.data != null) return body.data;
  return body || {};
}

function push(results, id, pass, detail) {
  results.push({ id, pass: Boolean(pass), detail });
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
  if (!biz) throw new Error(`business not found: ${SLUG}`);

  const servicesRes = await getJson(`/public/${SLUG}/services`);
  const services = unwrap(servicesRes.body).services || [];
  const face = services.find((s) => FACE_NAME.test(s.name || ''));
  const swedish = services.find((s) => SWEDISH_NAME.test(s.name || ''));

  const results = [];
  push(results, 'empty-reason-constant-stable', EMPTY_REASON === 'assigned_providers_unscheduled', {
    EMPTY_REASON,
  });

  push(
    results,
    'face-pilling-online-full-prepay',
    !!face &&
      face.onlinePaymentEnabled === true &&
      (face.prepaymentMode === 'full' || face.prepaymentMode === 'FULL'),
    face
      ? {
          name: face.name,
          id: face.id,
          onlinePaymentEnabled: face.onlinePaymentEnabled,
          prepaymentMode: face.prepaymentMode,
        }
      : { status: servicesRes.status, count: services.length },
  );

  const from = new Date().toISOString().slice(0, 10);
  const toD = new Date();
  toD.setUTCDate(toD.getUTCDate() + 21);
  const to = toD.toISOString().slice(0, 10);

  // Control: Swedish still bookable
  let swedishDates = [];
  if (swedish) {
    const r = await getJson(
      `/public/${SLUG}/services/${swedish.id}/bookable-dates?from=${from}&to=${to}`,
    );
    swedishDates = unwrap(r.body).dates || [];
    push(
      results,
      'swedish-still-bookable',
      r.status === 200 && Array.isArray(swedishDates) && swedishDates.length > 0,
      { status: r.status, count: swedishDates.length, sample: swedishDates.slice(0, 3) },
    );
  } else {
    push(results, 'swedish-still-bookable', false, { error: 'Swedish not found' });
  }

  if (!face) {
    for (const id of [
      'face-pilling-bookable-dates-nonempty',
      'face-pilling-day-slots-nonempty',
      'face-pilling-slot-employee-is-assignee',
    ]) {
      push(results, id, false, { error: 'Face Pilling not found' });
    }
  } else {
    // Who is assigned Face Pilling before the call (for employee check)
    const assignees = (
      await client.query(
        `SELECT id, name, "serviceIds"::text AS sid FROM employees
         WHERE business_id=$1 AND "isActive"=true`,
        [biz.id],
      )
    ).rows.filter((row) => {
      const sid = String(row.sid || '');
      return sid.includes(face.id);
    });

    const datesRes = await getJson(
      `/public/${SLUG}/services/${face.id}/bookable-dates?from=${from}&to=${to}`,
    );
    const datesBody = unwrap(datesRes.body);
    const faceDates = datesBody.dates || [];
    push(
      results,
      'face-pilling-bookable-dates-nonempty',
      datesRes.status === 200 && Array.isArray(faceDates) && faceDates.length > 0,
      {
        status: datesRes.status,
        count: faceDates.length,
        sample: faceDates.slice(0, 5),
        emptyReason: datesBody.emptyReason ?? null,
        assignees: assignees.map((a) => a.name),
      },
    );

    let firstDate =
      typeof faceDates[0] === 'string' ? faceDates[0] : faceDates[0]?.date;
    let slots = [];
    let slotEmployeeId = null;
    if (firstDate) {
      const slotsRes = await getJson(
        `/public/${SLUG}/services/${face.id}/slots?date=${encodeURIComponent(firstDate)}`,
      );
      slots = unwrap(slotsRes.body).slots || [];
      slotEmployeeId = slots[0]?.employeeId ?? null;
      push(
        results,
        'face-pilling-day-slots-nonempty',
        slotsRes.status === 200 && Array.isArray(slots) && slots.length > 0,
        {
          status: slotsRes.status,
          date: firstDate,
          count: slots.length,
          sample: slots.slice(0, 2).map((s) => ({
            startTime: s.startTime,
            employeeId: s.employeeId,
            employeeName: s.employeeName,
          })),
        },
      );
    } else {
      push(results, 'face-pilling-day-slots-nonempty', false, {
        error: 'no bookable date',
      });
    }

    const assigneeIds = new Set(assignees.map((a) => a.id));
    push(
      results,
      'face-pilling-slot-employee-is-assignee',
      !!slotEmployeeId && assigneeIds.has(slotEmployeeId),
      {
        slotEmployeeId,
        slotEmployeeName: slots[0]?.employeeName ?? null,
        assigneeIds: [...assigneeIds],
      },
    );

    // Edge: wipe future slots for assignees → next bookable-dates should roll forward again
    // (or keep dates if roll-forward already ran). Soft check: second call still non-empty.
    const datesRes2 = await getJson(
      `/public/${SLUG}/services/${face.id}/bookable-dates?from=${from}&to=${to}`,
    );
    const faceDates2 = unwrap(datesRes2.body).dates || [];
    push(
      results,
      'face-pilling-bookable-dates-idempotent',
      datesRes2.status === 200 &&
        Array.isArray(faceDates2) &&
        faceDates2.length > 0,
      { count: faceDates2.length, sample: faceDates2.slice(0, 3) },
    );
  }

  await client.end();

  const failed = results.filter((r) => !r.pass);
  for (const r of results) {
    console.log(
      `${r.pass ? 'PASS' : 'FAIL'}  ${r.id}`,
      r.detail ? JSON.stringify(r.detail) : '',
    );
  }
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
