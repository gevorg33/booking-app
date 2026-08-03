/**
 * Manual QA for e2e-bug.195 — booking_help funnel walkthrough must not
 * misroute to explain_app_feature consumer Home guide ("Step 1 of 3: Check Home").
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

const HOME_TOUR = /Check Home|consumer-tabs|Home shows upcoming/i;
const FUNNEL_CUE =
  /Select (?:a )?(?:Service|Professional)|Pick a (?:service|professional)|checkout|payment|professionals|services|book/i;

const CASES = [
  {
    id: 'how-do-i-book-appointment-step-by-step',
    prompt: 'How do I book an appointment step by step?',
    expectAction: 'booking_help',
    forbidSummary: HOME_TOUR,
    requireSummary: FUNNEL_CUE,
  },
  {
    id: 'how-do-i-book-with-you',
    prompt: 'how do I book with you?',
    expectAction: 'booking_help',
    forbidSummary: HOME_TOUR,
  },
  {
    id: 'walk-me-through-booking',
    prompt: 'walk me through booking',
    expectAction: 'booking_help',
    forbidSummary: HOME_TOUR,
    requireSummary: FUNNEL_CUE,
  },
  {
    id: 'walk-me-through-booking-step-by-step',
    prompt: 'Walk me through booking step by step',
    expectAction: 'booking_help',
    forbidSummary: HOME_TOUR,
  },
  {
    id: 'i-need-booking-help',
    prompt: 'I need booking help',
    expectAction: 'booking_help',
    forbidSummary: HOME_TOUR,
  },
  {
    id: 'how-do-i-book-an-appointment',
    prompt: 'How do I book an appointment?',
    expectAction: 'booking_help',
    forbidSummary: HOME_TOUR,
  },
  {
    id: 'how-do-i-book-online',
    prompt: 'How do I book online?',
    expectAction: 'booking_help',
    forbidSummary: HOME_TOUR,
  },
  {
    id: 'booking-funnel-help',
    prompt: 'Show me the booking funnel',
    allowActions: ['booking_help', 'guide_user_flow'],
    forbidSummary: HOME_TOUR,
  },
  {
    id: 'what-happens-after-i-pick-a-time',
    prompt: 'What happens after I pick a time?',
    expectAction: 'booking_help',
    forbidSummary: HOME_TOUR,
  },
  {
    id: 'how-do-i-pick-service-and-provider',
    prompt: 'How do I pick a service and provider?',
    expectAction: 'booking_help',
    forbidSummary: HOME_TOUR,
  },
  // Negatives — consumer/app tours must stay off booking_help funnel steal
  {
    id: 'neg-home-tab',
    prompt: 'How do I use the Home tab?',
    allowActions: ['explain_app_feature', 'guide_user_flow', 'explain_current_screen'],
    forbidAction: 'booking_help',
  },
  {
    id: 'neg-home-step-by-step',
    prompt: 'How do I use the Home tab step by step?',
    allowActions: [
      'explain_app_feature',
      'guide_user_flow',
      'explain_current_screen',
      'unknown',
    ],
    forbidAction: 'booking_help',
  },
  {
    id: 'neg-account-screen',
    prompt: 'Show me how to use the account screen',
    allowActions: [
      'explain_app_feature',
      'guide_user_flow',
      'explain_why_sign_in',
      'explain_current_screen',
      'unknown',
    ],
    forbidAction: 'booking_help',
  },
  {
    id: 'neg-timed-book',
    prompt: 'Book a Swedish massage with Gevorg tomorrow at 11am',
    allowActions: ['book_appointment', 'book_nearest_slot'],
    forbidAction: 'booking_help',
  },
];

async function main() {
  const results = [];
  for (const c of CASES) {
    const data = await assistant(c.prompt);
    const action = data.action;
    const summary = String(data.summary || '');
    const topicId =
      data.guide?.topicId ||
      data.details?.guide?.topicId ||
      data.details?.topicId ||
      '';
    let pass = true;

    if (c.expectAction) pass = pass && action === c.expectAction;
    if (c.allowActions) pass = pass && c.allowActions.includes(action);
    if (c.forbidAction) pass = pass && action !== c.forbidAction;
    if (c.forbidSummary) {
      pass = pass && !c.forbidSummary.test(summary) && !c.forbidSummary.test(topicId);
    }
    if (c.requireSummary) pass = pass && c.requireSummary.test(summary);

    results.push({
      id: c.id,
      pass,
      detail: {
        action,
        success: data.success,
        summary: summary.slice(0, 160),
        topicId,
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
