/**
 * Manual live QA for e2e-bug.10 — Stripe Connect required for online checkout.
 *
 * Env gap (not an app bug): checkout correctly 400s without Connect.
 * Unblocked on gevgas-operations once Connect acct was linked.
 *
 * Run: node scripts/qa-e2e-bug-10.mjs
 */
const API = process.env.API_BASE || 'http://127.0.0.1:3001';
const READY_SLUG = process.env.SALON_SLUG || 'gevgas-operations-7c299253';
const NO_CONNECT_SLUG = process.env.NO_CONNECT_SLUG || 'qa-test-clinic-cf58d2a9';

async function getJson(path) {
  const res = await fetch(`${API}${path}`);
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function postJson(path, payload) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

function unwrap(body) {
  return body?.data ?? body;
}

async function main() {
  const results = [];

  // —— profile Connect readiness ——
  {
    const { status, body } = await getJson(`/public/${READY_SLUG}`);
    const data = unwrap(body);
    const pass = status === 200 && data.onlinePaymentsEnabled === true;
    results.push({
      id: 'profile-online-payments-enabled',
      pass,
      detail: {
        status,
        onlinePaymentsEnabled: data.onlinePaymentsEnabled,
        name: data.name,
      },
    });
  }

  // —— services online flags ——
  let services = [];
  let facePilling = null;
  let facePlasma = null;
  let onlineService = null;
  {
    const { status, body } = await getJson(`/public/${READY_SLUG}/services`);
    services = unwrap(body).services || [];
    facePilling = services.find((s) => /Face Pilling/i.test(s.name || ''));
    facePlasma = services.find((s) => /Face Plasma/i.test(s.name || ''));
    onlineService =
      services.find((s) => s.onlinePaymentEnabled === true && /Swedish/i.test(s.name || '')) ||
      services.find((s) => s.onlinePaymentEnabled === true);
    results.push({
      id: 'full-prepay-service-online-flag',
      pass:
        status === 200 &&
        !!facePilling &&
        facePilling.prepaymentMode === 'full' &&
        facePilling.onlinePaymentEnabled === true,
      detail: facePilling
        ? {
            name: facePilling.name,
            prepaymentMode: facePilling.prepaymentMode,
            onlinePaymentEnabled: facePilling.onlinePaymentEnabled,
          }
        : { status, count: services.length },
    });
    results.push({
      id: 'pay-at-visit-service-not-online',
      pass:
        status === 200 &&
        !!facePlasma &&
        facePlasma.prepaymentMode === 'none' &&
        facePlasma.onlinePaymentEnabled === false,
      detail: facePlasma
        ? {
            name: facePlasma.name,
            prepaymentMode: facePlasma.prepaymentMode,
            onlinePaymentEnabled: facePlasma.onlinePaymentEnabled,
          }
        : { status },
    });
  }

  // —— real checkout session with Connect ——
  {
    if (!onlineService) {
      results.push({
        id: 'create-checkout-session-with-connect',
        pass: false,
        detail: { error: 'no onlinePaymentEnabled service' },
      });
    } else {
      const from = new Date().toISOString().slice(0, 10);
      const toDate = new Date();
      toDate.setUTCDate(toDate.getUTCDate() + 21);
      const to = toDate.toISOString().slice(0, 10);
      const datesRes = await getJson(
        `/public/${READY_SLUG}/services/${onlineService.id}/bookable-dates?from=${from}&to=${to}`,
      );
      const dates = unwrap(datesRes.body).dates || [];
      const dateList = Array.isArray(dates) ? dates : [];
      const date =
        typeof dateList[0] === 'string'
          ? dateList[0]
          : dateList[0]?.date || dateList[0]?.value;
      let startTime = null;
      let employeeId = null;
      if (date) {
        const slotsRes = await getJson(
          `/public/${READY_SLUG}/services/${onlineService.id}/slots?date=${encodeURIComponent(date)}`,
        );
        const slots = unwrap(slotsRes.body).slots || [];
        if (Array.isArray(slots) && slots[0]?.startTime) {
          startTime = slots[0].startTime;
          employeeId = slots[0].employeeId;
        }
      }
      if (!startTime) {
        results.push({
          id: 'create-checkout-session-with-connect',
          pass: false,
          detail: {
            error: 'no slot',
            service: onlineService.name,
            date,
            datesRes: datesRes.status,
            datesCount: dateList.length,
          },
        });
      } else {
        const payload = {
          serviceId: onlineService.id,
          startTime,
          ...(employeeId ? { employeeId } : {}),
          customer: {
            name: 'E2E10 Connect QA',
            email: `e2e10-connect+${Date.now()}@example.com`,
            phone: '+15551234567',
          },
        };
        const { status, body } = await postJson(
          `/public/${READY_SLUG}/bookings/checkout`,
          payload,
        );
        const data = unwrap(body);
        const url = data.url || data.checkoutUrl || data.sessionUrl;
        const sessionId = data.sessionId || data.id;
        const ok =
          status >= 200 &&
          status < 300 &&
          !!(
            sessionId ||
            (url && String(url).includes('checkout.stripe.com'))
          );
        results.push({
          id: 'create-checkout-session-with-connect',
          pass: ok,
          detail: {
            status,
            service: onlineService.name,
            hasUrl: !!url,
            sessionId: sessionId ? String(sessionId).slice(0, 24) : null,
            message: body.message || data.message || null,
            startTime,
          },
        });
      }
    }
  }

  // —— clinic without Connect ——
  {
    const { status, body } = await getJson(`/public/${NO_CONNECT_SLUG}`);
    const data = unwrap(body);
    results.push({
      id: 'clinic-without-connect-online-disabled',
      pass: status === 200 && data.onlinePaymentsEnabled === false,
      detail: {
        status,
        onlinePaymentsEnabled: data.onlinePaymentsEnabled,
        name: data.name,
      },
    });
  }

  // —— checkout without Connect → clear message ——
  {
    const svcRes = await getJson(`/public/${NO_CONNECT_SLUG}/services`);
    const services = unwrap(svcRes.body).services || [];
    const svc = services[0];
    if (!svc) {
      results.push({
        id: 'clinic-checkout-clear-connect-message',
        pass: false,
        detail: { error: 'no services on no-connect clinic' },
      });
    } else {
      // Prefer a date/slot if available; otherwise send a plausible future ISO.
      const startTime = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString();
      const { status, body } = await postJson(
        `/public/${NO_CONNECT_SLUG}/bookings/checkout`,
        {
          serviceId: svc.id,
          startTime,
          customer: {
            name: 'E2E10 NoConnect',
            email: `e2e10-noconnect+${Date.now()}@example.com`,
            phone: '+15559876543',
          },
        },
      );
      const msg = String(
        body.message ||
          unwrap(body).message ||
          (Array.isArray(body.message) ? body.message.join(' ') : '') ||
          JSON.stringify(body),
      );
      const pass =
        status >= 400 &&
        status < 500 &&
        /Connect your Stripe account|Dashboard|Billing|online payment/i.test(msg) &&
        !/sk_test_|sk_live_/i.test(msg);
      results.push({
        id: 'clinic-checkout-clear-connect-message',
        pass,
        detail: { status, message: msg.slice(0, 180), service: svc.name },
      });
    }
  }

  let failed = 0;
  console.log(`e2e-bug.10 QA → ${API} ready=${READY_SLUG} noConnect=${NO_CONNECT_SLUG}\n`);
  for (const row of results) {
    if (row.pass) {
      console.log(`PASS ${row.id}`, JSON.stringify(row.detail).slice(0, 240));
    } else {
      failed += 1;
      console.log(`FAIL ${row.id}`, JSON.stringify(row.detail).slice(0, 320));
    }
  }
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
