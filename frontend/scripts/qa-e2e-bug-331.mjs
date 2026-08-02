/**
 * Guru live QA for e2e-bug.331 — the public web booking assistant is
 * dispatched through the shared 'customer' AI gateway pipeline
 * (PublicBookingController.assistant() → CustomerAiCommandService), so its
 * bare /book/services|professionals|checkout screens were mis-resolved by
 * the customer-app route mapper (collapses anything under /book into one
 * generic /s/book bucket), leaking native-app "Pick a professional"
 * consumer-booking-flow content into the public web checkout/services pages.
 *
 * Run: cd backend && npm run build, restart the backend, then
 *      node frontend/scripts/qa-e2e-bug-331.mjs
 * Requires: API on :3001, business slug gevgas-operations-7c299253.
 */
import http from 'http';

const API = process.env.API_BASE || 'http://127.0.0.1:3001';
const SLUG = 'gevgas-operations-7c299253';

function request(method, path, body) {
  return new Promise((resolvePromise, reject) => {
    const data = JSON.stringify(body);
    const url = new URL(path, API);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port || 3001,
        path: url.pathname,
        method,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = raw;
          }
          resolvePromise({ status: res.statusCode, body: parsed });
        });
      },
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function assist(screen, prompt) {
  const res = await request('POST', `/public/${SLUG}/assistant`, {
    prompt,
    assistantMode: 'act',
    locale: 'en',
    context: { slug: SLUG, screen },
  });
  const data = res.body?.data ?? res.body;
  return { action: data?.action, summary: String(data?.summary || '') };
}

let pass = 0;
let fail = 0;

function check(id, condition, detail) {
  if (condition) {
    pass += 1;
    console.log(`  PASS  ${id}`);
  } else {
    fail += 1;
    console.log(`  FAIL  ${id} — ${detail}`);
  }
}

async function main() {
  console.log('e2e-bug.331 — public booking funnel surface detection\n');

  // Original 4 reported symptoms.
  {
    const r = await assist('/book/services', 'Help me with this page');
    check(
      'services-help-no-consumer-flow-leak',
      !/pick a professional/i.test(r.summary),
      `got: ${r.summary}`,
    );
  }
  {
    const r = await assist('/book/checkout', 'Help me with this page');
    check(
      'checkout-help-no-consumer-flow-leak',
      !/pick a professional/i.test(r.summary) &&
        /checkout|price|duration|cancella|review details/i.test(r.summary),
      `got: ${r.summary}`,
    );
  }
  {
    const r = await assist('/book/services', 'How do I book an appointment?');
    check(
      'services-booking-help-step-1-open-services',
      /open services/i.test(r.summary),
      `got: ${r.summary}`,
    );
  }
  {
    const r = await assist('/book/checkout', 'How do I book an appointment?');
    check(
      'checkout-booking-help-step-1-review-details',
      /review details/i.test(r.summary) && !/pick a professional/i.test(r.summary),
      `got: ${r.summary}`,
    );
  }

  // Explicit explain_current_screen phrasing on checkout — the path that
  // originally still leaked "Step 1 of 4: Pick a professional" even after
  // the first (route-presence-gated) surface fix.
  {
    const r = await assist('/book/checkout', 'What is this page?');
    check(
      'checkout-explicit-screen-question-no-leak',
      !/pick a professional/i.test(r.summary),
      `got: ${r.summary}`,
    );
  }

  // Regression: generic funnel overview route (no specific step) still
  // resolves to the whole-funnel overview, not a wrongly-specific step.
  {
    const r = await assist('/book', 'Help me with this page');
    check(
      'bare-book-overview-still-generic',
      /pick a service/i.test(r.summary) && !/checkout|professional/i.test(r.summary),
      `got: ${r.summary}`,
    );
  }

  // Regression: real customer-app booking route (/s/book) must stay on the
  // customer-app pipeline, not get misdetected as 'public'.
  {
    const r = await assist('/s/book', 'Help me with this page');
    check(
      'customer-app-book-route-unaffected',
      !/public checkout|public booking page/i.test(r.summary),
      `got: ${r.summary}`,
    );
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
