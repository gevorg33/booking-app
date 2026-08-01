/**
 * Manual QA for e2e-bug.200 — OR+budget+book compound must keep service and
 * form compound for hairstyle / Swedish massage / Neck Massage parity.
 *
 * Salon: gevgas-operations-7c299253
 * - Neck Massage $40 → under $50 book compound can complete
 * - hairstyle $15 → under $50 must enter compound (not collapse to single book)
 * - Swedish massage $80 → under $50 must enter compound, fail step 1 with
 *   budget message (NOT "Specify which service to check providers for")
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

const MISSING_SERVICE = /Specify which service to check providers for/i;
const BUDGET_MISS = /Nothing (?:found )?under|under \$50|Closest options/i;

const CASES = [
  // —— Happy / parity ——
  {
    id: 'neck-massage-compound-success',
    prompt:
      'I want a Neck Massage tomorrow evening or Friday afternoon, I have $50, book the soonest',
    expectAction: 'compound_intent',
    forbidSummary: MISSING_SERVICE,
    requireCompoundOrSuccess: true,
  },
  {
    id: 'hairstyle-must-be-compound',
    prompt:
      'I want a hairstyle tomorrow evening or Friday afternoon, I have $50, book the soonest',
    expectAction: 'compound_intent',
    forbidSummary: MISSING_SERVICE,
    forbidAction: 'book_appointment',
  },
  {
    id: 'hairstyle-alt-phrasing',
    prompt:
      "Who's free for a hairstyle tomorrow evening or Friday afternoon under $50, book the soonest",
    expectAction: 'compound_intent',
    forbidSummary: MISSING_SERVICE,
  },
  {
    id: 'swedish-compound-budget-abort-clean',
    prompt:
      "Who's free for a Swedish massage tomorrow evening or Friday afternoon under $50, book the soonest",
    expectAction: 'compound_intent',
    forbidSummary: MISSING_SERVICE,
    requireSummary: BUDGET_MISS,
    expectSuccess: false,
  },
  {
    id: 'swedish-want-budget-abort-clean',
    prompt:
      'I want a Swedish massage tomorrow evening or Friday afternoon under $50, book the soonest',
    expectAction: 'compound_intent',
    forbidSummary: MISSING_SERVICE,
    requireSummary: BUDGET_MISS,
    expectSuccess: false,
  },
  {
    id: 'swedish-under-100-can-resolve',
    prompt:
      "Who's free for a Swedish massage tomorrow evening or Friday afternoon under $100, book the soonest",
    expectAction: 'compound_intent',
    forbidSummary: MISSING_SERVICE,
  },
  {
    id: 'full-body-under-50',
    prompt:
      'I want a full body massage tomorrow evening or Friday afternoon, I have $50, book the soonest',
    expectAction: 'compound_intent',
    forbidSummary: MISSING_SERVICE,
  },
  {
    id: 'haircut-synonym-compound',
    prompt:
      "Who's free for a haircut tomorrow evening or Friday afternoon under $50, book the soonest",
    expectAction: 'compound_intent',
    forbidSummary: MISSING_SERVICE,
  },

  // —— Edge ——
  {
    id: 'deep-tissue-over-budget-clean',
    prompt:
      'I want a Deep tissue massage tomorrow evening or Friday afternoon under $50, book the soonest',
    expectAction: 'compound_intent',
    forbidSummary: MISSING_SERVICE,
    requireSummary: BUDGET_MISS,
    expectSuccess: false,
  },
  {
    id: 'control-list-then-or-hairstyle',
    prompt:
      'Show hairstyle under $50, then check tomorrow evening or Friday afternoon',
    expectAction: 'compound_intent',
    forbidSummary: MISSING_SERVICE,
  },

  // —— Negatives ——
  {
    id: 'neg-budget-or-without-book',
    prompt: 'I want a hairstyle tomorrow evening or Friday afternoon, I have $50',
    forbidAction: 'compound_intent',
    // single check / list / availability — not the book compound
    forbidSummary: MISSING_SERVICE,
  },
  {
    id: 'neg-missing-service-still-clarifies',
    prompt:
      'I want something tomorrow evening or Friday afternoon under $50, book the soonest',
    allowActions: ['compound_intent', 'check_providers_for_service', 'unknown'],
    // If compound, step 1 may clarify missing service — that is OK here
  },
  {
    id: 'neg-unicorn-service',
    prompt:
      'I want a unicorn trim tomorrow evening or Friday afternoon under $50, book the soonest',
    forbidSummary: /Completed 2 customer step/i,
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
  if (c.allowActions) {
    const ok = c.allowActions.includes(data.action);
    if (!ok) reasons.push(`action=${data.action} not in allow`);
    pass = pass && ok;
  }
  if (c.expectSuccess != null) {
    const ok = data.success === c.expectSuccess;
    if (!ok) reasons.push(`success=${data.success}`);
    pass = pass && ok;
  }
  if (c.forbidSummary) {
    const ok = !c.forbidSummary.test(summary);
    if (!ok) reasons.push(`forbidSummary matched`);
    pass = pass && ok;
  }
  if (c.requireSummary) {
    const ok = c.requireSummary.test(summary);
    if (!ok) reasons.push(`requireSummary missed: ${summary.slice(0, 140)}`);
    pass = pass && ok;
  }
  if (c.requireCompoundOrSuccess) {
    const ok =
      data.action === 'compound_intent' &&
      (data.success === true || !MISSING_SERVICE.test(summary));
    if (!ok) reasons.push('compound/success parity failed');
    pass = pass && ok;
  }

  return { pass, reasons, summary, action: data.action, success: data.success };
}

async function main() {
  console.log(`e2e-bug.200 QA → ${API}/public/${SLUG}/assistant\n`);
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
        `FAIL ${c.id} action=${result.action} success=${result.success}`,
      );
      console.log(`  prompt: ${c.prompt}`);
      console.log(`  reasons: ${result.reasons.join('; ')}`);
      console.log(`  summary: ${result.summary.slice(0, 240)}`);
    }
  }
  console.log(`\n${CASES.length - failed}/${CASES.length} passed`);
  process.exit(failed ? 1 : 0);
}

main();
