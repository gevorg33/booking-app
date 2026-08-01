/**
 * Manual QA for e2e-bug.193 — list_services catalog browse.
 * Must not treat "you offer" / "are available" as service filters, and must not
 * route catalog asks to check_multi_service_block_availability.
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

const CASES = [
  {
    id: 'what-services-do-you-offer',
    prompt: 'What services do you offer?',
    expectAction: 'list_services',
    expectSuccess: true,
    forbidSummary: /couldn't find ["']?you offer/i,
    requireSummary: /Face Pilling|Swedish massage|hairstyle/i,
  },
  {
    id: 'what-services-do-you-offer-lower',
    prompt: 'what services do you offer',
    expectAction: 'list_services',
    expectSuccess: true,
    forbidSummary: /couldn't find ["']?you offer/i,
  },
  {
    id: 'what-services-are-available',
    prompt: 'What services are available?',
    expectAction: 'list_services',
    expectSuccess: true,
    forbidAction: 'check_multi_service_block_availability',
    forbidSummary: /Specify which services to check/i,
  },
  {
    id: 'what-services-do-you-have',
    prompt: 'What services do you have?',
    expectAction: 'list_services',
    expectSuccess: true,
  },
  {
    id: 'show-me-your-services',
    prompt: 'Show me your services',
    expectAction: 'list_services',
    expectSuccess: true,
  },
  {
    id: 'list-services',
    prompt: 'list services',
    expectAction: 'list_services',
    expectSuccess: true,
  },
  {
    id: 'list-all-services',
    prompt: 'list all services',
    expectAction: 'list_services',
    expectSuccess: true,
  },
  {
    id: 'what-services-do-we-offer',
    prompt: 'What services do we offer?',
    expectAction: 'list_services',
    expectSuccess: true,
    forbidSummary: /couldn't find/i,
  },
  {
    id: 'services-menu',
    prompt: 'show the service menu',
    allowActions: ['list_services'],
    expectSuccess: true,
  },
  {
    id: 'do-you-offer-swedish',
    prompt: 'do you offer Swedish massage?',
    expectAction: 'list_services',
    expectSuccess: true,
    requireSummary: /Swedish massage/i,
  },
  {
    id: 'neg-under-budget',
    prompt: 'services under $50',
    allowActions: ['find_services_under_budget', 'list_services'],
    expectSuccess: true,
    forbidAction: 'check_multi_service_block_availability',
  },
  {
    id: 'neg-who-is-free',
    prompt: 'Who is free for Swedish massage tomorrow?',
    allowActions: ['check_availability', 'check_providers_for_service'],
    forbidAction: 'list_services',
  },
  {
    id: 'neg-multi-service-block',
    prompt: 'Check multi-service block availability for Swedish massage and Face Pilling tomorrow',
    allowActions: [
      'check_multi_service_block_availability',
      'check_multi_service_availability',
      'compound_intent',
    ],
    forbidAction: undefined,
    // Must not collapse to plain list_services
    forbidOnlyAction: 'list_services',
  },
];

async function main() {
  const results = [];
  for (const c of CASES) {
    const data = await assistant(c.prompt);
    const action = data.action;
    const summary = String(data.summary || '');
    let pass = true;

    if (c.expectAction) pass = pass && action === c.expectAction;
    if (c.allowActions) pass = pass && c.allowActions.includes(action);
    if (c.forbidAction) pass = pass && action !== c.forbidAction;
    if (c.forbidOnlyAction) pass = pass && action !== c.forbidOnlyAction;
    if (c.expectSuccess != null) pass = pass && data.success === c.expectSuccess;
    if (c.forbidSummary) pass = pass && !c.forbidSummary.test(summary);
    if (c.requireSummary) pass = pass && c.requireSummary.test(summary);

    results.push({
      id: c.id,
      pass,
      detail: {
        action,
        success: data.success,
        summary: summary.slice(0, 160),
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
