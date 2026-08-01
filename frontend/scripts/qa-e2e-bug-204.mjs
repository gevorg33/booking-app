/**
 * Manual QA for e2e-bug.204 — public_assistant_compound must reach
 * compound_intent on live /public/:slug/assistant (surface:customer).
 *
 * Salon: gevgas-operations-7c299253
 * PASS: registry examples + paraphrases → compound_intent
 * FAIL: collapse to former single-intent steals
 * Negatives: single-intent prompts must NOT become this compound
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

const COMPOUND = 'compound_intent';

const CASES = [
  // —— Registry examples (must compound) ——
  {
    id: 'registry-list-check',
    prompt: 'List providers and check availability',
    expectAction: COMPOUND,
    forbidActions: ['check_providers_for_service'],
    requireSummary: /list providers/i,
  },
  {
    id: 'registry-discover-recommend',
    prompt: 'Discover packages and recommend specialists',
    expectAction: COMPOUND,
    forbidActions: ['discover_packages'],
    requireSummary: /discover packages|recommend specialists/i,
  },
  {
    id: 'registry-book-business-info',
    prompt: 'Book appointment and show business info',
    expectAction: COMPOUND,
    forbidActions: ['book_multi_service'],
    // may stop at book for missing fields — still must be compound
    requireSummary: /book_appointment|business info|Completed 2/i,
  },
  {
    id: 'registry-find50-list',
    prompt: 'Find services under $50 and list providers',
    expectAction: COMPOUND,
    requireSummary: /find services under budget|list providers/i,
  },
  {
    id: 'registry-list-booking-help',
    prompt: 'List providers and walk me through booking',
    expectAction: COMPOUND,
    requireSummary: /list providers|booking help/i,
  },

  // —— Paraphrases ——
  {
    id: 'para-show-then-check',
    prompt: 'Show providers and then check availability',
    expectAction: COMPOUND,
    forbidActions: ['check_providers_for_service'],
  },
  {
    id: 'para-browse-recommend',
    prompt: 'Browse packages and recommend specialists',
    expectAction: COMPOUND,
  },
  {
    id: 'para-book-salon-info',
    prompt: 'Book an appointment and show salon info',
    expectAction: COMPOUND,
    forbidActions: ['book_multi_service'],
  },

  // —— Edge: semicolon glue ——
  {
    id: 'edge-semicolon-list-check',
    prompt: 'List providers; check availability',
    expectAction: COMPOUND,
  },

  // —— Negatives (must NOT be this compound) ——
  {
    id: 'neg-list-alone',
    prompt: 'List providers',
    forbidAction: COMPOUND,
    expectAction: 'list_providers',
  },
  {
    id: 'neg-discover-alone',
    prompt: 'Discover packages',
    forbidAction: COMPOUND,
    expectAction: 'discover_packages',
  },
  {
    id: 'neg-book-alone',
    prompt: 'Book appointment tomorrow',
    forbidAction: COMPOUND,
  },
  {
    id: 'neg-check-alone',
    prompt: 'Check availability for Swedish massage',
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
  if (c.forbidActions) {
    for (const a of c.forbidActions) {
      // forbid as the *top-level* action (compound is OK even if step names match)
      if (data.action === a) {
        reasons.push(`forbidActions hit ${a}`);
        pass = false;
      }
    }
  }
  if (c.requireSummary) {
    const ok = c.requireSummary.test(summary);
    if (!ok) reasons.push(`requireSummary missed: ${summary.slice(0, 140)}`);
    pass = pass && ok;
  }

  return { pass, reasons, summary, action: data.action, success: data.success };
}

async function main() {
  console.log(`e2e-bug.204 QA → ${API}/public/${SLUG}/assistant\n`);
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
