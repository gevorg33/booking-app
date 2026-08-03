/**
 * Manual QA for e2e-bug.194 — explain_provider_availability with named
 * provider + service + relative day must not return the generic clarify
 * ("Ask if a stylist is working…"), including "Explain X availability for Y".
 */
const SLUG = 'gevgas-operations-7c299253';
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

const GENERIC_CLARIFY =
  /Ask if a stylist is working on a day or who has openings/i;

const CASES = [
  {
    id: 'explain-gevorg-availability-swedish-next-tuesday',
    prompt: 'Explain Gevorg availability for Swedish massage next Tuesday',
    expectAction: 'explain_provider_availability',
    forbidSummary: GENERIC_CLARIFY,
    requireSummary: /Gevorg|Swedish|open slots|No open slots|04\/08|August/i,
    requireEmployee: /Gevorg/i,
    requireService: /Swedish/i,
  },
  {
    id: 'is-gevorg-available-swedish-next-tuesday',
    prompt: 'Is Gevorg available for Swedish massage next Tuesday?',
    expectAction: 'explain_provider_availability',
    forbidSummary: GENERIC_CLARIFY,
    requireSummary: /Gevorg|Swedish|open slots|No open slots/i,
  },
  {
    id: 'when-is-gevorg-available-this-week',
    prompt: 'When is Gevorg available this week?',
    expectAction: 'explain_provider_availability',
    forbidSummary: GENERIC_CLARIFY,
    requireSummary: /open slots|Gevorg/i,
  },
  {
    id: 'show-gevorgs-availability-swedish-tomorrow',
    prompt: "Show Gevorg's availability for Swedish massage tomorrow",
    expectAction: 'explain_provider_availability',
    forbidSummary: GENERIC_CLARIFY,
    requireSummary: /Gevorg|Swedish|open slots|No open slots/i,
  },
  {
    id: 'gevorg-availability-for-swedish-friday',
    prompt: 'Gevorg availability for Swedish massage on Friday',
    expectAction: 'explain_provider_availability',
    forbidSummary: GENERIC_CLARIFY,
    requireSummary: /Gevorg|Swedish|open slots|No open slots/i,
  },
  {
    id: 'does-gevorg-work-tomorrow',
    prompt: 'Does Gevorg work tomorrow?',
    expectAction: 'explain_provider_availability',
    forbidSummary: GENERIC_CLARIFY,
  },
  {
    id: 'is-gevorg-working-saturday',
    prompt: 'Is Gevorg working Saturday?',
    expectAction: 'explain_provider_availability',
    forbidSummary: GENERIC_CLARIFY,
  },
  {
    id: 'explain-gevorg-availability-next-tuesday-no-service',
    prompt: 'Explain Gevorg availability next Tuesday',
    expectAction: 'explain_provider_availability',
    forbidSummary: GENERIC_CLARIFY,
    requireEmployee: /Gevorg/i,
  },
  {
    id: 'who-has-openings-tomorrow',
    prompt: 'Who has openings tomorrow?',
    expectAction: 'explain_provider_availability',
    forbidSummary: GENERIC_CLARIFY,
    requireSummary: /open|slot|provider|stylist|Gevorg|Karo|Mariam/i,
  },
  {
    id: 'which-stylists-available-friday',
    prompt: 'Which stylists are available Friday?',
    expectAction: 'explain_provider_availability',
    forbidSummary: GENERIC_CLARIFY,
  },
  // Negatives — must not collapse to explain_provider_availability clarify path
  {
    id: 'neg-plain-availability-for-service',
    prompt: 'availability for Swedish massage tomorrow',
    allowActions: [
      'check_availability',
      'check_providers_for_service',
      'explain_provider_availability',
    ],
    // If it does explain_provider_availability, still must not generic-clarify
    forbidSummary: GENERIC_CLARIFY,
  },
  {
    id: 'neg-free-slots-monday',
    prompt: 'free slots on Monday for Gevorg',
    allowActions: [
      'check_availability',
      'check_providers_for_service',
      'explain_provider_availability',
    ],
    forbidSummary: GENERIC_CLARIFY,
  },
  {
    id: 'neg-book-timed',
    prompt: 'Book a Swedish massage with Gevorg tomorrow at 11am',
    allowActions: ['book_appointment', 'book_nearest_slot'],
    forbidAction: 'explain_provider_availability',
  },
  {
    id: 'neg-specialty',
    prompt: "What is Gevorg's specialty?",
    allowActions: ['explain_provider_specialty', 'explain_professional_profile'],
    forbidAction: 'explain_provider_availability',
  },
];

async function main() {
  const results = [];
  for (const c of CASES) {
    const data = await assistant(c.prompt);
    const action = data.action;
    const summary = String(data.summary || '');
    const ctx = data.sessionContext || {};
    let pass = true;

    if (c.expectAction) pass = pass && action === c.expectAction;
    if (c.allowActions) pass = pass && c.allowActions.includes(action);
    if (c.forbidAction) pass = pass && action !== c.forbidAction;
    if (c.forbidSummary) pass = pass && !c.forbidSummary.test(summary);
    if (c.requireSummary) pass = pass && c.requireSummary.test(summary);
    if (c.requireEmployee) {
      pass =
        pass &&
        c.requireEmployee.test(
          String(ctx.employeeName || summary || ''),
        );
    }
    if (c.requireService) {
      pass =
        pass &&
        c.requireService.test(String(ctx.serviceName || summary || ''));
    }

    results.push({
      id: c.id,
      pass,
      detail: {
        action,
        success: data.success,
        summary: summary.slice(0, 180),
        employeeName: ctx.employeeName,
        serviceName: ctx.serviceName,
        date: ctx.date,
      },
    });
    console.log(
      `${pass ? 'PASS' : 'FAIL'} ${c.id} → ${action} success=${data.success}`,
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
