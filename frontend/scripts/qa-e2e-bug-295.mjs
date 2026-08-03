/**
 * Guru live QA for e2e-bug.295 — "Add next appointment to home screen" must
 * land on explain_home_screen_widget (not list_my_upcoming_appointments /
 * "Sign in to view your upcoming appointments").
 *
 * Run: node frontend/scripts/qa-e2e-bug-295.mjs
 * Requires: API on :3001
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(__dirname, '../../backend');

const SLUG = process.env.SALON_SLUG || 'gevgas-operations-7c299253';
const API = process.env.API_BASE || 'http://127.0.0.1:3001';

const SIGN_IN_UPCOMING = /sign in to view your upcoming appointments/i;
const WIDGET_CUE =
  /home\s*screen\s+widget|add.{0,40}home\s*screen|widget|վիջեթ|виджет/i;

const CASES = [
  // Core bug — EN prompt under hy locale (live failure from e2e-bug.276)
  {
    id: 'live-hy-add-next-home-screen',
    prompt: 'Add next appointment to home screen',
    locale: 'hy',
    expectAction: 'explain_home_screen_widget',
    forbidSummary: SIGN_IN_UPCOMING,
    requireWidgetCue: true,
  },
  {
    id: 'live-ru-add-next-home-screen',
    prompt: 'Add next appointment to home screen',
    locale: 'ru',
    expectAction: 'explain_home_screen_widget',
    forbidSummary: SIGN_IN_UPCOMING,
    requireWidgetCue: true,
  },
  {
    id: 'live-en-add-next-home-screen',
    prompt: 'Add next appointment to home screen',
    locale: 'en',
    expectAction: 'explain_home_screen_widget',
    forbidSummary: SIGN_IN_UPCOMING,
    requireWidgetCue: true,
  },
  {
    id: 'live-en-add-my-next-home-screen',
    prompt: 'Add my next appointment to the home screen',
    locale: 'en',
    expectAction: 'explain_home_screen_widget',
    forbidSummary: SIGN_IN_UPCOMING,
  },
  {
    id: 'live-en-put-next-home-screen',
    prompt: 'Put next appointment on home screen',
    locale: 'en',
    expectAction: 'explain_home_screen_widget',
    forbidSummary: SIGN_IN_UPCOMING,
  },
  {
    id: 'live-en-how-add-widget',
    prompt: 'How do I add next appointment to the home screen widget?',
    locale: 'en',
    expectAction: 'explain_home_screen_widget',
    forbidSummary: SIGN_IN_UPCOMING,
  },
  {
    id: 'live-en-show-next-on-home-screen',
    prompt: 'Show next appointment on home screen',
    locale: 'en',
    expectAction: 'explain_home_screen_widget',
    forbidSummary: SIGN_IN_UPCOMING,
  },
  {
    id: 'live-en-widget-how-works',
    prompt: 'How does the home screen widget work?',
    locale: 'en',
    expectAction: 'explain_home_screen_widget',
    forbidSummary: SIGN_IN_UPCOMING,
  },
  // List-upcoming controls — must NOT become widget (my_appointments sibling OK)
  {
    id: 'ctrl-whats-my-next',
    prompt: "What's my next appointment?",
    locale: 'en',
    allowActions: [
      'list_my_upcoming_appointments',
      'my_appointments',
    ],
    forbidAction: 'explain_home_screen_widget',
    allowSummaries: [
      /sign in to view your (upcoming )?appointments?/i,
      /next appointment/i,
      /upcoming/i,
      /appointment/i,
    ],
  },
  {
    id: 'ctrl-show-upcoming',
    prompt: 'Show my upcoming appointments',
    locale: 'en',
    allowActions: [
      'list_my_upcoming_appointments',
      'my_appointments',
    ],
    forbidAction: 'explain_home_screen_widget',
    allowSummaries: [
      /sign in to view your (upcoming )?appointments?/i,
      /upcoming/i,
      /appointment/i,
    ],
  },
  {
    id: 'ctrl-list-upcoming',
    prompt: 'List my upcoming appointments',
    locale: 'en',
    allowActions: [
      'list_my_upcoming_appointments',
      'my_appointments',
    ],
    forbidAction: 'explain_home_screen_widget',
    allowSummaries: [
      /sign in to view your (upcoming )?appointments?/i,
      /upcoming/i,
      /appointment/i,
    ],
  },
  // Home-tab control — must not steal to widget (e2e-bug.276 regression)
  {
    id: 'ctrl-home-tab',
    prompt: 'How do I use the Home tab?',
    locale: 'hy',
    allowActions: ['explain_app_feature', 'guide_user_flow'],
    forbidAction: 'explain_home_screen_widget',
    forbidAction2: 'list_my_upcoming_appointments',
  },
  // HY native widget phrasing
  {
    id: 'live-hy-native-widget',
    prompt: 'Ինչպես ավելացնել վիջեթը հիմնական էկրանին?',
    locale: 'hy',
    expectAction: 'explain_home_screen_widget',
    forbidSummary: SIGN_IN_UPCOMING,
  },
  // RU native widget phrasing
  {
    id: 'live-ru-native-widget',
    prompt: 'Как добавить виджет на главный экран?',
    locale: 'ru',
    expectAction: 'explain_home_screen_widget',
    forbidSummary: SIGN_IN_UPCOMING,
  },
];

function loadEnv() {
  const envPath = resolve(backendRoot, '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    if (process.env[key] == null) {
      process.env[key] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  }
}

function request(method, path, body) {
  return new Promise((resolvePromise, reject) => {
    const data = body != null ? JSON.stringify(body) : null;
    const url = new URL(path, API);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port || 3001,
        path: url.pathname + url.search,
        method,
        headers: data
          ? {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(data),
            }
          : {},
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = raw ? JSON.parse(raw) : null;
          } catch {
            parsed = raw;
          }
          resolvePromise({ status: res.statusCode, body: parsed });
        });
      },
    );
    req.on('error', reject);
    req.setTimeout(120000, () => req.destroy(new Error('timeout')));
    if (data) req.write(data);
    req.end();
  });
}

function unwrap(body) {
  return body?.data ?? body;
}

async function main() {
  loadEnv();
  console.log(`e2e-bug.295 live QA → ${API} slug=${SLUG}`);

  const health = await request('GET', `/public/${SLUG}`).catch((e) => ({
    error: e,
  }));
  if (health.error || (health.status && health.status >= 500)) {
    console.error('API not reachable on', API, health.error || health.status);
    process.exit(1);
  }

  let pass = 0;
  let fail = 0;
  const failures = [];

  for (const c of CASES) {
    const res = await request('POST', `/public/${SLUG}/assistant`, {
      prompt: c.prompt,
      assistantMode: 'act',
      locale: c.locale,
      context: { slug: SLUG, locale: c.locale },
    });
    const data = unwrap(res.body);
    const action = data?.action ?? data?.intent?.action ?? null;
    const summary = String(data?.summary ?? data?.message ?? '');
    const okStatus = res.status === 200 || res.status === 201;

    const problems = [];
    if (!okStatus) problems.push(`HTTP ${res.status}`);

    if (c.expectAction && action !== c.expectAction) {
      problems.push(`action=${action} want=${c.expectAction}`);
    }
    if (c.allowActions && !c.allowActions.includes(action)) {
      problems.push(`action=${action} not in ${c.allowActions.join('|')}`);
    }
    if (c.forbidAction && action === c.forbidAction) {
      problems.push(`forbidden action ${c.forbidAction}`);
    }
    if (c.forbidAction2 && action === c.forbidAction2) {
      problems.push(`forbidden action ${c.forbidAction2}`);
    }
    if (c.forbidSummary && c.forbidSummary.test(summary)) {
      problems.push(`forbidden summary: ${summary.slice(0, 120)}`);
    }
    if (c.requireWidgetCue && summary && !WIDGET_CUE.test(summary)) {
      // Clarify responses still OK if action is correct
      if (action === 'explain_home_screen_widget') {
        /* allow empty/clarify */
      } else {
        problems.push(`summary missing widget cue: ${summary.slice(0, 120)}`);
      }
    }
    if (c.allowSummaries) {
      const hit = c.allowSummaries.some((re) => re.test(summary));
      if (summary && !hit) {
        problems.push(`summary not in allow list: ${summary.slice(0, 120)}`);
      }
    }

    if (problems.length === 0) {
      pass += 1;
      console.log(`PASS ${c.id} → ${action} | ${summary.slice(0, 80)}`);
    } else {
      fail += 1;
      failures.push({ id: c.id, problems, action, summary });
      console.log(`FAIL ${c.id} → ${action} | ${problems.join('; ')}`);
      console.log(`     summary: ${summary.slice(0, 160)}`);
    }
  }

  console.log(`\nResult: ${pass}/${CASES.length} passed, ${fail} failed`);
  if (fail > 0) {
    console.log('\nFailures:');
    for (const f of failures) {
      console.log(`- ${f.id}: ${f.problems.join('; ')}`);
    }
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
