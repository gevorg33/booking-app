/**
 * Manual QA for e2e-bug.189 — list_providers roster must not collapse to
 * check_providers_for_service ("Specify which service…").
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
    id: 'who-are-your-providers',
    prompt: 'Who are your providers?',
    expectAction: 'list_providers',
    expectSuccess: true,
  },
  {
    id: 'who-are-your-specialists',
    prompt: 'Who are your specialists?',
    expectAction: 'list_providers',
    expectSuccess: true,
  },
  {
    id: 'who-are-your-providers-slash-specialists',
    prompt: 'Who are your providers / specialists?',
    expectAction: 'list_providers',
    expectSuccess: true,
  },
  {
    id: 'who-works-here',
    prompt: 'who works here?',
    expectAction: 'list_providers',
    expectSuccess: true,
  },
  {
    id: 'list-all-specialists',
    prompt: 'list all specialists',
    expectAction: 'list_providers',
    expectSuccess: true,
  },
  {
    id: 'list-providers',
    prompt: 'list providers',
    expectAction: 'list_providers',
    expectSuccess: true,
  },
  {
    id: 'show-me-your-team',
    prompt: 'show me your team',
    expectAction: 'list_providers',
    expectSuccess: true,
  },
  {
    id: 'what-specialists-do-you-have',
    prompt: 'what specialists do you have?',
    expectAction: 'list_providers',
    expectSuccess: true,
  },
  // Negatives — must NOT become list_providers
  {
    id: 'neg-who-available-massage',
    prompt: 'Who is available tomorrow for Swedish massage?',
    forbidAction: 'list_providers',
    forbidSummary: /Specify which service/i,
  },
  {
    id: 'neg-recommend',
    prompt: 'Who do you recommend for a massage?',
    expectAction: 'recommend_specialists',
    expectSuccess: true,
  },
  {
    id: 'neg-providers-for-service',
    prompt: 'Who are your providers for Swedish massage?',
    forbidAction: 'list_providers',
  },
];

async function main() {
  const results = [];
  for (const c of CASES) {
    const data = await assistant(c.prompt);
    const action = data.action;
    const summary = String(data.summary || '');
    let pass = true;
    const detail = {
      action,
      success: data.success,
      summary: summary.slice(0, 140),
      navigate: data.navigate,
    };

    if (c.expectAction) {
      pass = pass && action === c.expectAction;
    }
    if (c.expectSuccess != null) {
      pass = pass && data.success === c.expectSuccess;
    }
    if (c.forbidAction) {
      pass = pass && action !== c.forbidAction;
    }
    if (c.forbidSummary) {
      pass = pass && !c.forbidSummary.test(summary);
    }
    if (c.expectAction === 'list_providers') {
      pass =
        pass &&
        data.success === true &&
        !/Specify which service/i.test(summary) &&
        action !== 'check_providers_for_service';
    }

    results.push({ id: c.id, pass, detail });
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
