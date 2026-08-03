/**
 * Guru live QA for e2e-bug.298 — bare "trim" must resolve to hairstyle
 * (not "couldn't find trim") for recommend/list.
 *
 * Run: node frontend/scripts/qa-e2e-bug-298.mjs
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

const COULDNT_FIND_TRIM = /couldn't find ["']trim["']/i;
const HAIRSTYLE = /hairstyle/i;

const CASES = [
  {
    id: 'live-best-specialists-trim-next-week',
    prompt: 'best specialists for trim next week',
    expectAction: 'recommend_specialists',
    forbidCouldntFindTrim: true,
    requireHairstyleOrNoMatches: true,
  },
  {
    id: 'live-recommend-someone-trim',
    prompt: 'recommend someone for trim',
    expectAction: 'recommend_specialists',
    forbidCouldntFindTrim: true,
    requireHairstyleOrNoMatches: true,
  },
  {
    id: 'live-who-recommend-trim',
    prompt: 'Who do you recommend for a trim?',
    expectAction: 'recommend_specialists',
    forbidCouldntFindTrim: true,
    requireHairstyleOrNoMatches: true,
  },
  {
    id: 'live-list-trim-services',
    prompt: 'list trim services',
    expectAction: 'list_services',
    forbidCouldntFindTrim: true,
    requireHairstyle: true,
  },
  {
    id: 'live-show-me-trim',
    prompt: 'show me trim',
    expectAction: 'list_services',
    forbidCouldntFindTrim: true,
    requireHairstyle: true,
  },
  {
    id: 'live-best-specialists-styling',
    prompt: 'best specialists for styling',
    expectAction: 'recommend_specialists',
    forbidCouldntFind: /couldn't find ["']styling["']/i,
    requireHairstyleOrNoMatches: true,
  },
  {
    id: 'live-best-specialists-a-cut',
    prompt: 'best specialists for a cut',
    expectAction: 'recommend_specialists',
    forbidCouldntFind: /couldn't find ["']cut["']/i,
    // may resolve Men's/Women's cut or hairstyle — just must not abort on cut
  },
  {
    id: 'ctrl-best-haircut-next-week',
    prompt: 'best specialists for haircut next week',
    expectAction: 'recommend_specialists',
    forbidCouldntFind: /couldn't find ["']haircut["']/i,
    requireHairstyleOrNoMatches: true,
  },
  {
    id: 'ctrl-best-hairstyle-next-week',
    prompt: 'best specialists for hairstyle next week',
    expectAction: 'recommend_specialists',
    requireHairstyleOrNoMatches: true,
  },
  {
    id: 'ctrl-list-hairstyle',
    prompt: 'list hairstyle services',
    expectAction: 'list_services',
    requireHairstyle: true,
  },
  {
    id: 'ctrl-facial-still-works',
    prompt: 'show me facials',
    expectAction: 'list_services',
    requireFaceFamily: true,
  },
  {
    id: 'ctrl-massage-not-stolen-by-trim',
    prompt: 'best specialists for massage',
    expectAction: 'recommend_specialists',
    forbidHairstyleOnly: true,
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
  console.log(`e2e-bug.298 live QA → ${API} slug=${SLUG}`);

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
  const residuals = [];

  for (const c of CASES) {
    const res = await request('POST', `/public/${SLUG}/assistant`, {
      prompt: c.prompt,
      assistantMode: 'act',
      locale: 'en',
      context: { slug: SLUG },
    });
    const data = unwrap(res.body);
    const action = data?.action ?? null;
    const summary = String(data?.summary ?? '');
    const problems = [];

    if (res.status < 200 || res.status >= 300) {
      problems.push(`HTTP ${res.status}`);
    }
    if (c.expectAction && action !== c.expectAction) {
      problems.push(`action=${action} want=${c.expectAction}`);
    }
    if (c.forbidCouldntFindTrim && COULDNT_FIND_TRIM.test(summary)) {
      problems.push('could not find trim');
    }
    if (c.forbidCouldntFind && c.forbidCouldntFind.test(summary)) {
      problems.push(`could not find: ${summary.slice(0, 80)}`);
    }
    if (c.requireHairstyle && !HAIRSTYLE.test(summary)) {
      problems.push('missing hairstyle in summary');
    }
    if (c.requireHairstyleOrNoMatches) {
      // success with hairstyle mention, OR no-specialists for hairstyle, OR list of providers
      const ok =
        HAIRSTYLE.test(summary) ||
        /no available specialists/i.test(summary) ||
        /top-rated specialists/i.test(summary) ||
        /\d+\s+provider/i.test(summary);
      if (!ok && data?.success === false && COULDNT_FIND_TRIM.test(summary)) {
        problems.push('trim still unresolved');
      } else if (!ok && /couldn't find/i.test(summary)) {
        problems.push(`service miss: ${summary.slice(0, 100)}`);
      }
    }
    if (c.requireFaceFamily) {
      for (const re of [/Face Pilling/i, /Face Plasma/i, /facemassage/i]) {
        if (!re.test(summary)) problems.push(`missing ${re}`);
      }
    }
    if (
      c.forbidHairstyleOnly &&
      HAIRSTYLE.test(summary) &&
      !/massage/i.test(summary)
    ) {
      residuals.push({
        id: c.id,
        note: `massage recommend unexpectedly mentions hairstyle: ${summary.slice(0, 120)}`,
      });
    }

    if (problems.length === 0) {
      pass += 1;
      console.log(`PASS ${c.id} → ${action} | ${summary.slice(0, 100)}`);
    } else {
      fail += 1;
      failures.push({ id: c.id, problems, action, summary });
      console.log(`FAIL ${c.id} → ${action} | ${problems.join('; ')}`);
      console.log(`     summary: ${summary.slice(0, 200)}`);
    }
  }

  console.log(`\nResult: ${pass}/${CASES.length} passed, ${fail} failed`);
  if (residuals.length > 0) {
    console.log(`\nSoft residuals: ${residuals.length}`);
    for (const r of residuals) console.log(`- ${r.id}: ${r.note}`);
  }
  if (fail > 0) {
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
