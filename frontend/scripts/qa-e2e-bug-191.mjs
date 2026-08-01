/**
 * Manual QA for e2e-bug.191 — salon/business about cues must not become
 * explain_provider_specialty ("couldn't find a provider named this business…").
 *
 * Acceptable: explain_salon_profile (profile nav) or business_info (inline).
 * Forbidden: explain_provider_specialty + provider-not-found summary.
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

const SALON_OR_BUSINESS = ['explain_salon_profile', 'business_info'];

const CASES = [
  {
    id: 'bug-slash-business-salon-info',
    prompt: 'Tell me about this business / salon info',
    allowActions: SALON_OR_BUSINESS,
    expectSuccess: true,
    forbidAction: 'explain_provider_specialty',
    forbidSummary: /couldn't find a provider named/i,
  },
  {
    id: 'tell-me-about-this-salon',
    prompt: 'Tell me about this salon',
    allowActions: SALON_OR_BUSINESS,
    expectSuccess: true,
    forbidAction: 'explain_provider_specialty',
  },
  {
    id: 'tell-me-about-this-business',
    prompt: 'Tell me about this business',
    allowActions: SALON_OR_BUSINESS,
    expectSuccess: true,
    forbidAction: 'explain_provider_specialty',
  },
  {
    id: 'tell-me-about-the-salon',
    prompt: 'Tell me about the salon',
    allowActions: SALON_OR_BUSINESS,
    expectSuccess: true,
    forbidAction: 'explain_provider_specialty',
  },
  {
    id: 'tell-me-about-your-business',
    prompt: 'Tell me about your business',
    allowActions: SALON_OR_BUSINESS,
    expectSuccess: true,
    forbidAction: 'explain_provider_specialty',
  },
  {
    id: 'about-this-business',
    prompt: 'about this business',
    allowActions: SALON_OR_BUSINESS,
    expectSuccess: true,
    forbidAction: 'explain_provider_specialty',
  },
  {
    id: 'about-this-salon',
    prompt: 'About this salon',
    allowActions: SALON_OR_BUSINESS,
    expectSuccess: true,
    forbidAction: 'explain_provider_specialty',
  },
  {
    id: 'salon-info',
    prompt: 'salon info',
    allowActions: SALON_OR_BUSINESS,
    expectSuccess: true,
    forbidAction: 'explain_provider_specialty',
  },
  {
    id: 'business-info-please',
    prompt: 'business info please',
    allowActions: SALON_OR_BUSINESS,
    expectSuccess: true,
    forbidAction: 'explain_provider_specialty',
  },
  {
    id: 'salon-info-please',
    prompt: 'salon info please',
    allowActions: SALON_OR_BUSINESS,
    expectSuccess: true,
    forbidAction: 'explain_provider_specialty',
  },
  {
    id: 'what-is-this-place-like',
    prompt: 'What is this place like?',
    allowActions: SALON_OR_BUSINESS,
    expectSuccess: true,
    forbidAction: 'explain_provider_specialty',
  },
  {
    id: 'salon-profile',
    prompt: 'Salon profile',
    allowActions: SALON_OR_BUSINESS,
    expectSuccess: true,
    forbidAction: 'explain_provider_specialty',
  },
  // Negatives — named specialty must stay specialty.
  {
    id: 'neg-tell-me-about-anna',
    prompt: 'Tell me about Anna',
    allowActions: ['explain_provider_specialty'],
  },
  {
    id: 'neg-gevorg-specialty',
    prompt: "What is Gevorg's specialty?",
    allowActions: ['explain_provider_specialty'],
  },
  {
    id: 'neg-best-for-curly',
    prompt: 'Who is best for curly hair?',
    allowActions: ['explain_provider_specialty', 'recommend_specialists'],
  },
];

async function main() {
  const results = [];
  for (const c of CASES) {
    const data = await assistant(c.prompt);
    const action = data.action;
    const summary = String(data.summary || '');
    let pass = true;

    if (c.allowActions) pass = pass && c.allowActions.includes(action);
    if (c.forbidAction) pass = pass && action !== c.forbidAction;
    if (c.expectSuccess != null) pass = pass && data.success === c.expectSuccess;
    if (c.forbidSummary) pass = pass && !c.forbidSummary.test(summary);

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
