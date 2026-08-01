/**
 * Manual QA for e2e-bug.198 — customer_clinic_compound must not die on step 2
 * (notify_when_results_ready) when the prompt already asks to notify.
 *
 * Clinic: qa-test-clinic-cf58d2a9 (lipid panel catalog).
 * Step 1 book may soft-succeed (navigate/handoff) — PASS if compound reaches
 * notify step successfully OR full compound succeeds. FAIL only if stopped at
 * notify with "Ask how result-ready notifications work".
 */
const SLUG = process.env.CLINIC_SLUG || 'qa-test-clinic-cf58d2a9';
const API = process.env.API_BASE || 'http://127.0.0.1:3001';

async function assistant(prompt, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API}/public/${SLUG}/assistant`, {
    method: 'POST',
    headers,
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

const NOTIFY_CLARIFY = /Ask how result-ready notifications work/i;
const STOPPED_NOTIFY = /Stopped at step 2 \(notify_when_results_ready\)/i;

const CASES = [
  {
    id: 'compound-lipid-notify',
    prompt: 'Book lipid panel and notify me when results are ready',
    expectCompound: true,
    forbidNotifyClarify: true,
  },
  {
    id: 'compound-lipid-then-notify',
    prompt: 'Book lipid panel then notify me when results are ready',
    expectCompound: true,
    forbidNotifyClarify: true,
  },
  {
    id: 'compound-reserve-tell-me',
    prompt: 'Reserve lipid panel and tell me when lab results are ready',
    expectCompound: true,
    forbidNotifyClarify: true,
  },
  {
    id: 'compound-schedule-alert',
    prompt: 'Schedule lipid panel then alert me when results are ready',
    expectCompound: true,
    forbidNotifyClarify: true,
  },
  {
    id: 'compound-cbc-alert',
    prompt: 'Book blood work CBC and alert me when results are available',
    expectCompound: true,
    forbidNotifyClarify: true,
  },
  {
    id: 'compound-push',
    prompt: 'Reserve CBC and notify me with push when results are ready',
    expectCompound: true,
    forbidNotifyClarify: true,
  },
  {
    id: 'standalone-notify',
    prompt: 'Notify me when results are ready',
    expectAction: 'notify_when_results_ready',
    expectSuccess: true,
  },
  {
    id: 'standalone-text',
    prompt: 'Text me when results are ready',
    expectAction: 'notify_when_results_ready',
    expectSuccess: true,
  },
  {
    id: 'standalone-email',
    prompt: 'Email me when my lab results are ready',
    expectAction: 'notify_when_results_ready',
    expectSuccess: true,
  },
  {
    id: 'standalone-remind',
    prompt: 'Remind me when my results are ready',
    expectAction: 'notify_when_results_ready',
    expectSuccess: true,
  },
  {
    id: 'compound-must-not-notify-clarify',
    prompt: 'Book lipid panel and notify me when results are ready',
    forbidSummary: /Ask how result-ready notifications work/i,
    expectCompoundSuccessOrBookFail: true,
  },
  // Negatives — must not become the broken compound notify clarify
  {
    id: 'neg-track-ready',
    prompt: 'Are my results ready yet?',
    forbidAction: 'compound_intent',
    forbidNotifyClarify: true,
  },
  {
    id: 'neg-book-only',
    prompt: 'Book lipid panel nearest slot',
    forbidNotifyClarify: true,
  },
];

function passCase(c, data) {
  const summary = String(data.summary || '');
  let pass = true;
  if (c.expectAction) pass = pass && data.action === c.expectAction;
  if (c.expectSuccess != null) pass = pass && data.success === c.expectSuccess;
  if (c.forbidAction) pass = pass && data.action !== c.forbidAction;
  if (c.forbidSummary) pass = pass && !c.forbidSummary.test(summary);
  if (c.forbidNotifyClarify) {
    pass = pass && !NOTIFY_CLARIFY.test(summary);
    if (STOPPED_NOTIFY.test(summary) && NOTIFY_CLARIFY.test(summary)) {
      pass = false;
    }
  }
  if (c.expectCompoundSuccessOrBookFail) {
    const stoppedAtNotifyClarify =
      STOPPED_NOTIFY.test(summary) && NOTIFY_CLARIFY.test(summary);
    pass = pass && !stoppedAtNotifyClarify;
  }
  if (c.expectCompound) {
    const stoppedAtNotifyClarify =
      STOPPED_NOTIFY.test(summary) && NOTIFY_CLARIFY.test(summary);
    pass = pass && !stoppedAtNotifyClarify;
    if (data.action === 'compound_intent' && data.success === true) {
      pass = true && !NOTIFY_CLARIFY.test(summary);
    }
  }
  return pass;
}

async function main() {
  const results = [];
  for (const c of CASES) {
    const data = await assistant(c.prompt);
    const pass = passCase(c, data);
    results.push({
      id: c.id,
      pass,
      detail: {
        action: data.action,
        success: data.success,
        summary: String(data.summary || '').slice(0, 180),
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
