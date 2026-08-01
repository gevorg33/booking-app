/**
 * Manual QA for e2e-bug.199 — haircut must resolve to catalog `hairstyle`
 * on gevgas-operations-7c299253 (no exact service named haircut).
 *
 * FAIL if step 1 / list_services / availability aborts with
 * `couldn't find "haircut"`. Controls with hairstyle/massage must still work.
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

const HAIRCUT_ABORT = /couldn't find ["']?haircut/i;
const STOPPED_STEP1 = /Stopped at step 1/i;

const CASES = [
  // —— Primary regressions from TODO.md Section M ——
  {
    id: 'flex-list-budget-then-or-haircuts',
    prompt:
      'Show haircuts under $50, then check tomorrow evening or Friday afternoon',
    forbidSummary: HAIRCUT_ABORT,
    requireNotStoppedOnHaircut: true,
  },
  {
    id: 'budget-book-haircut-nearest',
    prompt: 'Book a haircut under $50 tomorrow, nearest slot',
    forbidSummary: HAIRCUT_ABORT,
    requireNotStoppedOnHaircut: true,
  },
  {
    id: 'cheapest-haircut',
    prompt: "What's the cheapest haircut you offer?",
    forbidSummary: HAIRCUT_ABORT,
    requireSummary: /hairstyle/i,
  },
  {
    id: 'want-haircut-or-windows',
    prompt: 'I want a haircut tomorrow evening or Friday afternoon',
    forbidSummary: HAIRCUT_ABORT,
  },
  {
    id: 'who-free-haircut-budget-book',
    prompt:
      "Who's free for a haircut tomorrow evening or Friday afternoon under $50, book the soonest",
    forbidSummary: HAIRCUT_ABORT,
    requireNotStoppedOnHaircut: true,
  },
  {
    id: 'list-haircut-services',
    prompt: 'Show haircut services under $50',
    forbidSummary: HAIRCUT_ABORT,
    requireSummary: /hairstyle/i,
  },
  {
    id: 'haircuts-plural-list',
    prompt: 'List haircuts under $60',
    forbidSummary: HAIRCUT_ABORT,
    requireSummary: /hairstyle/i,
  },
  {
    id: 'book-haircut-tomorrow',
    prompt: 'Book a haircut tomorrow',
    forbidSummary: HAIRCUT_ABORT,
  },
  {
    id: 'do-you-offer-haircut',
    prompt: 'Do you offer haircut?',
    forbidSummary: HAIRCUT_ABORT,
    allowActions: ['list_services', 'check_providers_for_service', 'compound_intent'],
  },
  {
    id: 'premium-facial-family-note',
    prompt: "What's the cheapest haircut?",
    forbidSummary: HAIRCUT_ABORT,
    requireSummary: /hairstyle/i,
  },

  // —— Catalog-real controls (must keep working) ——
  {
    id: 'control-hairstyle-budget-or',
    prompt:
      'Show hairstyle under $50, then check tomorrow evening or Friday afternoon',
    forbidSummary: HAIRCUT_ABORT,
    requireNotStoppedOnHaircut: true,
  },
  {
    id: 'control-massage-budget',
    prompt: 'Show massage under $50',
    expectSuccess: true,
    forbidSummary: /couldn't find ["']?massage/i,
    requireSummary: /massage/i,
  },
  {
    id: 'control-swedish-book',
    prompt: 'Book a Swedish massage under $50 tomorrow, nearest slot',
    forbidSummary: /couldn't find ["']?Swedish/i,
  },
  {
    id: 'control-list-all',
    prompt: 'What services do you offer?',
    expectAction: 'list_services',
    expectSuccess: true,
    requireSummary: /hairstyle/i,
  },

  // —— Negatives / edge ——
  {
    id: 'neg-unicorn-still-fails',
    prompt: 'Show unicorn trim under $50',
    requireSummary: /couldn't find ["']?unicorn/i,
  },
  {
    id: 'neg-gibberish-service',
    prompt: 'Book a xyzzy-service-qq tomorrow',
    forbidSummary: HAIRCUT_ABORT,
    requireSummary: /couldn't find|not found|Specify which service|No matching|available services|Available:/i,
  },
  {
    id: 'edge-hair-style-spaced',
    prompt: 'Show hair style under $50',
    forbidSummary: /couldn't find ["']?hair style/i,
    requireSummary: /hairstyle/i,
  },
  {
    id: 'edge-list-hairstyle-services',
    prompt: 'Show hairstyle services',
    forbidSummary: /couldn't find/i,
    requireSummary: /hairstyle/i,
    allowActions: ['list_services', 'find_services_under_budget'],
  },
];

function passCase(c, data) {
  const summary = String(data.summary || '');
  let pass = true;
  const reasons = [];

  if (c.expectAction) {
    const ok = data.action === c.expectAction;
    if (!ok) reasons.push(`action=${data.action} want ${c.expectAction}`);
    pass = pass && ok;
  }
  if (c.allowActions) {
    const ok = c.allowActions.includes(data.action);
    if (!ok) reasons.push(`action=${data.action} not in ${c.allowActions}`);
    pass = pass && ok;
  }
  if (c.expectSuccess != null) {
    const ok = data.success === c.expectSuccess;
    if (!ok) reasons.push(`success=${data.success}`);
    pass = pass && ok;
  }
  if (c.forbidSummary) {
    const ok = !c.forbidSummary.test(summary);
    if (!ok) reasons.push(`forbidSummary matched: ${summary.slice(0, 120)}`);
    pass = pass && ok;
  }
  if (c.requireSummary) {
    const ok = c.requireSummary.test(summary);
    if (!ok) reasons.push(`requireSummary missed: ${summary.slice(0, 120)}`);
    pass = pass && ok;
  }
  if (c.requireNotStoppedOnHaircut) {
    const aborted =
      HAIRCUT_ABORT.test(summary) ||
      (STOPPED_STEP1.test(summary) && HAIRCUT_ABORT.test(summary));
    if (aborted) {
      reasons.push('stopped/aborted on haircut resolve');
      pass = false;
    }
  }

  return { pass, reasons, summary, action: data.action, success: data.success };
}

async function main() {
  console.log(`e2e-bug.199 QA → ${API}/public/${SLUG}/assistant\n`);
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
      console.log(`FAIL ${c.id} action=${result.action} success=${result.success}`);
      console.log(`  prompt: ${c.prompt}`);
      console.log(`  reasons: ${result.reasons.join('; ')}`);
      console.log(`  summary: ${result.summary.slice(0, 220)}`);
    }
  }
  console.log(`\n${CASES.length - failed}/${CASES.length} passed`);
  process.exit(failed ? 1 : 0);
}

main();
