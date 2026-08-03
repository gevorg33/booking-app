/**
 * Manual QA for e2e-bug.192 — timed NL book prompts must reach book_appointment
 * with checkout navigate (or create), never check_providers_for_service / unknown.
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

function navigatePath(data) {
  return data?.navigate?.path || data?.details?.navigate?.path || null;
}

function navigateQuery(data) {
  return data?.navigate?.query || data?.details?.navigate?.query || {};
}

const CASES = [
  {
    id: 'book-swedish-gevorg-11am',
    prompt: 'Book a Swedish massage with Gevorg tomorrow at 11am',
    expectAction: 'book_appointment',
    expectSuccess: true,
    expectNavigate: 'checkout',
    requireQuery: ['serviceId', 'employeeId', 'startTime'],
    forbidAction: 'check_providers_for_service',
  },
  {
    id: 'want-to-book-at-11am-tomorrow',
    prompt: 'I want to book Swedish massage with Gevorg at 11am tomorrow',
    expectAction: 'book_appointment',
    expectSuccess: true,
    expectNavigate: 'checkout',
    requireQuery: ['serviceId', 'employeeId', 'startTime'],
  },
  {
    id: 'create-a-booking',
    prompt:
      'create a booking for Swedish massage with Gevorg tomorrow at 11am',
    expectAction: 'book_appointment',
    forbidActions: ['check_availability', 'check_providers_for_service', 'unknown'],
    // success may be true (checkout) even without contact
    expectNavigate: 'checkout',
    requireQuery: ['serviceId', 'employeeId', 'startTime'],
  },
  {
    id: 'schedule-me',
    prompt:
      'please schedule me for a Swedish massage tomorrow at 11am with Gevorg',
    expectAction: 'book_appointment',
    expectSuccess: true,
    expectNavigate: 'checkout',
  },
  {
    id: 'can-i-book-3pm',
    prompt: 'Can I book a Swedish massage tomorrow at 3pm with Gevorg?',
    expectAction: 'book_appointment',
    expectSuccess: true,
    expectNavigate: 'checkout',
  },
  {
    id: 'book-me-neck',
    prompt: 'Book me a neck massage with Gevorg tomorrow at 1pm',
    expectAction: 'book_appointment',
    expectSuccess: true,
    expectNavigate: 'checkout',
  },
  {
    id: 'schedule-bare',
    prompt: 'schedule Swedish massage Gevorg tomorrow 11:00',
    expectAction: 'book_appointment',
    expectSuccess: true,
    expectNavigate: 'checkout',
  },
  {
    id: 'make-a-booking',
    prompt: 'make a booking for Swedish massage with Gevorg tomorrow at 2pm',
    expectAction: 'book_appointment',
    expectNavigate: 'checkout',
    requireQuery: ['serviceId', 'employeeId', 'startTime'],
  },
  {
    id: 'with-contact',
    prompt:
      'Book a Swedish massage with Gevorg tomorrow at 11am, name Test User email test192-qa@example.com',
    expectAction: 'book_appointment',
    // Online deposit required on this salon → payment handoff OR booking created
    allowSummaries: [
      /checkout/i,
      /online payment/i,
      /deposit/i,
      /confirmed/i,
      /booking/i,
      /Great —/i,
    ],
    forbidActions: ['unknown', 'check_providers_for_service', 'check_availability'],
  },
  {
    id: 'reserve-friday',
    prompt: 'Reserve a Neck Massage with Gevorg on Friday at 10am',
    expectAction: 'book_appointment',
    // Slot may be unfit — still must be book_appointment, not discovery
    forbidActions: ['check_providers_for_service', 'check_availability', 'unknown'],
  },
  // Negatives
  {
    id: 'neg-who-is-free',
    prompt: 'Who is free for Swedish massage tomorrow?',
    allowActions: ['check_availability', 'check_providers_for_service'],
    forbidAction: 'book_appointment',
  },
  {
    id: 'neg-check-availability',
    prompt: 'check availability for Swedish massage tomorrow',
    expectAction: 'check_availability',
    forbidAction: 'book_appointment',
  },
  {
    id: 'neg-book-nearest',
    prompt: 'Book nearest Swedish massage',
    allowActions: ['book_nearest_slot', 'book_appointment'],
    // nearest may stay book_nearest_slot or flexible book_appointment
    forbidAction: 'check_providers_for_service',
  },
];

async function main() {
  const results = [];
  for (const c of CASES) {
    const data = await assistant(c.prompt);
    const action = data.action;
    const summary = String(data.summary || '');
    const nav = navigatePath(data);
    const query = navigateQuery(data);
    let pass = true;

    if (c.expectAction) pass = pass && action === c.expectAction;
    if (c.allowActions) pass = pass && c.allowActions.includes(action);
    if (c.forbidAction) pass = pass && action !== c.forbidAction;
    if (c.forbidActions) pass = pass && !c.forbidActions.includes(action);
    if (c.expectSuccess != null) pass = pass && data.success === c.expectSuccess;
    if (c.expectNavigate) pass = pass && nav === c.expectNavigate;
    if (c.requireQuery) {
      for (const key of c.requireQuery) {
        pass = pass && !!query[key];
      }
    }
    if (c.allowSummaries) {
      pass = pass && c.allowSummaries.some((re) => re.test(summary));
    }

    results.push({
      id: c.id,
      pass,
      detail: {
        action,
        success: data.success,
        navigate: nav,
        query,
        summary: summary.slice(0, 160),
      },
    });
    console.log(
      `${pass ? 'PASS' : 'FAIL'} ${c.id} → ${action} success=${data.success} nav=${nav}`,
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
