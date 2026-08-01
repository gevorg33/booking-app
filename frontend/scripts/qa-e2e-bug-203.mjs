/**
 * Manual QA for e2e-bug.203 — guest_book_and_manage / guest_pay_cash_manage
 * must not be stolen by explain_guest_checkout_fields when a service is named.
 *
 * Salon: gevgas-operations-7c299253 (anonymous /public/:slug/assistant)
 * PASS: compound_intent (may stop at book for missing service / unicorn)
 * FAIL: action === explain_guest_checkout_fields for mutate compounds
 * FAQ controls must still land on explain_guest_checkout_fields
 */
const SLUG = process.env.SALON_SLUG || 'gevgas-operations-7c299253';
const API = process.env.API_BASE || 'http://127.0.0.1:3001';

async function assistant(prompt) {
  const res = await fetch(`${API}/public/${SLUG}/assistant`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      assistantMode: 'act',
      locale: 'en',
      context: { slug: SLUG },
    }),
  });
  const raw = await res.json();
  return raw.data || raw;
}

const FAQ = 'explain_guest_checkout_fields';
const COMPOUND = 'compound_intent';

const CASES = [
  // —— Named service: must compound, never FAQ ——
  {
    id: 'swedish-guest-book-manage',
    prompt: 'Book as guest a Swedish massage and email me the manage link',
    expectAction: COMPOUND,
    forbidAction: FAQ,
  },
  {
    id: 'swedish-guest-book-manage-alt',
    prompt:
      'Book Swedish massage as a guest and send me the booking manage link',
    expectAction: COMPOUND,
    forbidAction: FAQ,
  },
  {
    id: 'hairstyle-without-account-manage',
    prompt: 'Book hairstyle without an account and email me the manage link',
    expectAction: COMPOUND,
    forbidAction: FAQ,
  },
  {
    id: 'unicorn-guest-book-manage',
    prompt: 'Book as guest a unicorn-laser-trim and email me the manage link',
    expectAction: COMPOUND,
    forbidAction: FAQ,
    // may fail book step — must not soft-FAQ
    forbidSummary: /guest checkout (?:fields|contact)/i,
  },
  {
    id: 'swedish-guest-pay-cash-manage',
    prompt:
      'Book as guest Swedish massage, pay cash at visit, email manage link',
    expectAction: COMPOUND,
    forbidAction: FAQ,
  },
  {
    id: 'swedish-guest-pay-cash-manage-full',
    prompt:
      'Book as guest a Swedish massage, pay cash at visit, and email me the manage link',
    expectAction: COMPOUND,
    forbidAction: FAQ,
  },
  {
    id: 'neck-guest-pay-cash-manage',
    prompt:
      'Book Neck Massage as guest, pay at visit, email me the manage link',
    expectAction: COMPOUND,
    forbidAction: FAQ,
  },
  {
    id: 'unicorn-guest-pay-cash-manage',
    prompt:
      'Book as guest unicorn-laser-trim, pay cash at visit, email manage link',
    expectAction: COMPOUND,
    forbidAction: FAQ,
  },

  // —— Canonical no-service (still compound; may clarify service) ——
  {
    id: 'canonical-no-service-guest-manage',
    prompt: 'Book as guest and email me the manage link',
    expectAction: COMPOUND,
    forbidAction: FAQ,
  },
  {
    id: 'canonical-no-service-pay-cash-manage',
    prompt: 'Book as guest, pay cash at visit, and email me the manage link',
    expectAction: COMPOUND,
    forbidAction: FAQ,
  },

  // —— FAQ controls (must stay FAQ; use live-stable phrasings) ——
  {
    id: 'faq-why-email-checkout',
    prompt: 'Why do you need my email at checkout?',
    expectAction: FAQ,
    forbidAction: COMPOUND,
  },
  {
    id: 'faq-why-email-guest-book',
    prompt: 'Why do you need my email to book as a guest?',
    expectAction: FAQ,
    forbidAction: COMPOUND,
  },
  {
    id: 'faq-name-field-checkout',
    prompt: 'What is the name field for on checkout?',
    expectAction: FAQ,
    forbidAction: COMPOUND,
  },
  {
    id: 'faq-merge-after-sign-in',
    prompt:
      'Will my guest booking link if I sign in with the same email later?',
    expectAction: FAQ,
    forbidAction: COMPOUND,
  },
  {
    id: 'faq-contact-details-confirm',
    prompt: 'Why do you ask for contact details when I confirm my booking?',
    expectAction: FAQ,
    forbidAction: COMPOUND,
  },
];

function passCase(c, data) {
  const summary = String(data.summary || '');
  const reasons = [];
  let pass = true;

  if (c.expectAction) {
    const ok = data.action === c.expectAction;
    if (!ok) reasons.push(`action=${data.action} want ${c.expectAction}`);
    pass = pass && ok;
  }
  if (c.forbidAction) {
    const ok = data.action !== c.forbidAction;
    if (!ok) reasons.push(`forbidAction ${c.forbidAction}`);
    pass = pass && ok;
  }
  if (c.forbidSummary) {
    const ok = !c.forbidSummary.test(summary);
    if (!ok) reasons.push(`forbidSummary matched`);
    pass = pass && ok;
  }

  return { pass, reasons, summary, action: data.action, success: data.success };
}

async function main() {
  console.log(`e2e-bug.203 QA → ${API}/public/${SLUG}/assistant\n`);
  let failed = 0;
  for (const c of CASES) {
    let data;
    try {
      data = await assistant(c.prompt);
    } catch (err) {
      console.log(`FAIL ${c.id} — fetch error: ${err.message}`);
      failed += 1;
      continue;
    }
    const result = passCase(c, data);
    if (result.pass) {
      console.log(
        `PASS ${c.id} action=${result.action} success=${result.success}`,
      );
    } else {
      failed += 1;
      console.log(
        `FAIL ${c.id} — ${result.reasons.join('; ')} | summary=${result.summary.slice(0, 160)}`,
      );
    }
  }
  console.log(`\n${CASES.length - failed}/${CASES.length} passed`);
  process.exit(failed ? 1 : 0);
}

main();
