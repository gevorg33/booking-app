/**
 * Manual QA for e2e-bug.190 — check_availability must be reachable on
 * `/public/:slug/assistant` (not hard-remapped to check_providers_for_service).
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
    id: 'check-availability-phrase',
    prompt: 'check availability for Swedish massage tomorrow',
    expectAction: 'check_availability',
    expectSuccess: true,
    forbidSummary: /Specify which service/i,
  },
  {
    id: 'what-times-available',
    prompt: 'What times are available for Swedish massage tomorrow?',
    expectAction: 'check_availability',
    expectSuccess: true,
  },
  {
    id: 'available-times-neck',
    prompt: 'What available times do you have for Neck Massage tomorrow?',
    expectAction: 'check_availability',
    expectSuccess: true,
  },
  {
    id: 'named-available-for-service',
    prompt: 'Is Gevorg available for Swedish massage tomorrow?',
    // May be check_availability or useful sibling explain_provider_availability
    allowActions: ['check_availability', 'explain_provider_availability'],
    expectSuccess: true,
    forbidSummary: /Specify which service/i,
  },
  {
    id: 'open-slots-service',
    prompt: 'Open slots for Swedish massage on Friday',
    allowActions: ['check_availability', 'check_providers_for_service'],
    expectSuccess: true,
  },
  {
    id: 'neg-who-is-free',
    prompt: 'Who is free tomorrow evening for massage?',
    allowActions: ['check_providers_for_service', 'check_availability'],
    expectSuccess: true,
  },
  {
    id: 'neg-working-schedule',
    prompt: 'Is Gevorg working Saturday?',
    allowActions: ['explain_provider_availability'],
    expectSuccess: true,
  },
  {
    id: 'neg-list-providers',
    prompt: 'Who are your providers?',
    expectAction: 'list_providers',
    expectSuccess: true,
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
    if (c.expectSuccess != null) pass = pass && data.success === c.expectSuccess;
    if (c.forbidSummary) pass = pass && !c.forbidSummary.test(summary);

    // Core e2e-190: explicit check-availability phrasing must keep the label.
    if (
      c.id === 'check-availability-phrase' ||
      c.id === 'what-times-available'
    ) {
      pass = pass && action === 'check_availability';
    }

    results.push({
      id: c.id,
      pass,
      detail: {
        action,
        success: data.success,
        summary: summary.slice(0, 140),
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

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
