/**
 * Manual QA for e2e-bug.196 — previously-dead PUBLIC_ONLY compound steps must
 * execute via compound / executeDeterministicIntent (never "not supported yet").
 * Domain clarifies on step 2 (e.g. need provider name) still count as PASS —
 * they prove the action was dispatched.
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

const NOT_SUPPORTED = /not supported yet/i;

const CASES = [
  {
    id: 'budget-then-providers',
    prompt: 'Find services under $50 and list providers',
    expectCompound: true,
    expectStepActions: ['find_services_under_budget', 'list_providers'],
  },
  {
    id: 'evening-weekend-then-providers',
    prompt: 'Find evening weekend slots and list providers',
    expectCompound: true,
    expectStepActions: ['find_evening_weekend_slots', 'list_providers'],
  },
  {
    id: 'providers-then-booking-help',
    prompt: 'List providers and walk me through booking',
    expectCompound: true,
    expectStepActions: ['list_providers', 'booking_help'],
  },
  {
    id: 'services-then-preview-cart',
    prompt: 'List services and preview multi service cart',
    expectCompound: true,
    expectStepActions: ['list_services', 'preview_multi_service_cart'],
    allowStoppedAt: 'preview_multi_service_cart',
  },
  {
    id: 'providers-then-promotions',
    prompt: 'List providers and list public promotions',
    expectCompound: true,
    expectStepActions: ['list_providers', 'list_public_promotions'],
  },
  {
    id: 'providers-then-reviews',
    prompt: 'List providers and list provider reviews',
    expectCompound: true,
    expectStepActions: ['list_providers', 'list_provider_reviews'],
    allowStoppedAt: 'list_provider_reviews',
  },
  {
    id: 'services-then-package-block',
    prompt: 'List services and suggest package block',
    expectCompound: true,
    expectStepActions: ['list_services', 'suggest_package_block'],
    allowStoppedAt: 'suggest_package_block',
  },
  {
    id: 'smoke-providers-availability',
    prompt: 'List providers and check availability',
    expectCompound: true,
    expectStepActions: ['list_providers', 'check_availability'],
  },
  {
    id: 'smoke-book-business-info',
    prompt: 'Book appointment and show business info',
    expectCompound: true,
    expectStepActions: ['book_appointment', 'business_info'],
    allowStoppedAt: 'book_appointment',
  },
  {
    id: 'neg-list-services-alone',
    prompt: 'list services',
    expectAction: 'list_services',
  },
  {
    id: 'neg-booking-help-alone',
    prompt: 'How do I book an appointment step by step?',
    expectAction: 'booking_help',
  },
  {
    id: 'neg-under-budget-alone',
    prompt: 'services under $50',
    allowActions: ['find_services_under_budget', 'list_services'],
  },
];

function collectedActions(data) {
  const steps = data?.details?.steps;
  if (Array.isArray(steps) && steps.length) {
    return steps
      .map((s) => (typeof s === 'string' ? s : s?.action))
      .filter(Boolean);
  }
  const summary = String(data?.summary || '');
  const completed = summary.match(/Completed \d+ (?:customer )?step\(s\): ([^.]+)/i);
  if (completed) {
    return completed[1]
      .split(',')
      .map((s) => s.trim().replace(/\s+/g, '_'))
      .filter(Boolean);
  }
  const stopped = summary.match(/Stopped at step \d+ \(([^)]+)\)/i);
  if (stopped) return [data.action, stopped[1]].filter(Boolean);
  return data?.action ? [data.action] : [];
}

function compoundDispatched(data, c) {
  const summary = String(data.summary || '');
  if (NOT_SUPPORTED.test(summary)) return false;
  if (data.action !== 'compound_intent' && data.action !== 'compound_intent') {
    // Must be compound_intent (or customer rewrite still saying compound)
  }
  if (data.action !== 'compound_intent') return false;

  if (c.allowStoppedAt && new RegExp(`Stopped at step \\d+ \\(${c.allowStoppedAt}\\)`, 'i').test(summary)) {
    return true;
  }
  if (/Completed \d+ (?:customer )?step\(s\):/i.test(summary)) {
    for (const a of c.expectStepActions || []) {
      const phrase = a.replace(/_/g, ' ');
      if (!summary.toLowerCase().includes(phrase.toLowerCase()) && !summary.includes(a)) {
        // allow underscore or spaced form in summary
        const spaced = a.replace(/_/g, ' ');
        if (!summary.toLowerCase().includes(spaced.toLowerCase())) return false;
      }
    }
    return true;
  }
  const actions = collectedActions(data);
  if (c.expectStepActions) {
    return c.expectStepActions.every((a) => actions.includes(a));
  }
  return true;
}

async function main() {
  const results = [];
  for (const c of CASES) {
    const data = await assistant(c.prompt);
    const summary = String(data.summary || '');
    const actions = collectedActions(data);
    let pass = !NOT_SUPPORTED.test(summary);

    if (c.expectAction) pass = pass && data.action === c.expectAction;
    if (c.allowActions) pass = pass && c.allowActions.includes(data.action);
    if (c.expectCompound) pass = pass && compoundDispatched(data, c);

    results.push({
      id: c.id,
      pass,
      detail: {
        action: data.action,
        success: data.success,
        actions,
        summary: summary.slice(0, 200),
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
