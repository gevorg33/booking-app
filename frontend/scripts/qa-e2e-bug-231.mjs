/**
 * Manual QA for e2e-bug.231 — check_gift_card_balance by code must not be
 * stolen by gift_card_balance (sign-in) or apply_gift_card_code (checkout preview).
 */
const SLUG = 'gevgas-operations-7c299253';
const API = process.env.API_BASE || 'http://127.0.0.1:3001';
// Live Section I code with $20 balance (from TODO.md e2e-bug.231).
const CODE = process.env.GIFT_CARD_CODE || 'GCM-E5B7056C84';

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

const SIGN_IN_STEAL = /Sign in to check gift card balance/i;
const APPLY_STEAL = /can cover .+ at checkout/i;

const CASES = [
  {
    id: 'check-balance-by-code',
    prompt: `Check gift card balance by code ${CODE}`,
    expectAction: 'check_gift_card_balance',
    forbidSummary: SIGN_IN_STEAL,
  },
  {
    id: 'how-much-left',
    prompt: `How much is left on gift card code ${CODE}?`,
    expectAction: 'check_gift_card_balance',
    forbidSummary: APPLY_STEAL,
  },
  {
    id: 'what-is-balance',
    prompt: `What is the balance on gift card ${CODE}`,
    expectAction: 'check_gift_card_balance',
    forbidSummary: SIGN_IN_STEAL,
  },
  {
    id: 'what-is-value',
    prompt: `What is the value of gift card ${CODE}`,
    expectAction: 'check_gift_card_balance',
    forbidSummary: APPLY_STEAL,
  },
  {
    id: 'remaining-balance',
    prompt: `Remaining balance on gift card ${CODE}`,
    expectAction: 'check_gift_card_balance',
  },
  {
    id: 'whats-left',
    prompt: `What's left on gift card code ${CODE}`,
    expectAction: 'check_gift_card_balance',
  },
  {
    id: 'balance-for-code',
    prompt: `Gift card balance for code ${CODE}`,
    expectAction: 'check_gift_card_balance',
  },
  // Missing/unknown code still routes to check_gift_card_balance (not siblings)
  {
    id: 'unknown-code-still-check',
    prompt: 'Check gift card balance by code GCM-DOESNOTEXIST99',
    expectAction: 'check_gift_card_balance',
    forbidSummary: SIGN_IN_STEAL,
  },
  // Negatives
  {
    id: 'neg-my-gift-card-balance',
    prompt: 'What is my gift card balance?',
    allowActions: ['gift_card_balance', 'my_gift_cards'],
    forbidAction: 'check_gift_card_balance',
  },
  {
    id: 'neg-apply-at-checkout',
    prompt: `Apply gift card code ${CODE} at checkout`,
    expectAction: 'apply_gift_card_code',
    forbidAction: 'check_gift_card_balance',
  },
  {
    id: 'neg-explain-checkout',
    prompt: 'How do gift cards work at public booking checkout?',
    allowActions: [
      'explain_public_booking_checkout',
      'explain_checkout_currency',
    ],
    forbidAction: 'check_gift_card_balance',
  },
  {
    id: 'neg-claim-to-account',
    prompt: `Add gift card ${CODE} to my account`,
    allowActions: ['claim_gift_card_balance', 'my_gift_cards'],
    forbidAction: 'check_gift_card_balance',
  },
];

async function main() {
  const results = [];
  for (const c of CASES) {
    const data = await assistant(c.prompt);
    const summary = String(data.summary || '');
    let pass = true;
    if (c.expectAction) pass = pass && data.action === c.expectAction;
    if (c.allowActions) pass = pass && c.allowActions.includes(data.action);
    if (c.forbidAction) pass = pass && data.action !== c.forbidAction;
    if (c.forbidSummary) pass = pass && !c.forbidSummary.test(summary);

    results.push({
      id: c.id,
      pass,
      detail: {
        action: data.action,
        success: data.success,
        summary: summary.slice(0, 160),
      },
    });
    console.log(
      `${pass ? 'PASS' : 'FAIL'} ${c.id} → ${data.action} success=${data.success}`,
    );
  }

  console.log(JSON.stringify({ results }, null, 2));
  const failed = results.filter((r) => !r.pass);
  if (failed.length) {
    console.error(`FAIL ${failed.length}/${results.length}`);
    process.exit(1);
  }
  console.log(`PASS ${results.length}/${results.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
