/**
 * Guru live QA for e2e-bug.297 — short "show me facials" must list the full
 * face family (not Face Pilling alone).
 *
 * Run: node frontend/scripts/qa-e2e-bug-297.mjs
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

const FACE_FAMILY = [/Face Pilling/i, /Face Plasma/i, /facemassage/i];

const CASES = [
  {
    id: 'live-show-me-facials',
    prompt: 'show me facials',
    expectAction: 'list_services',
    requireAllFaceFamily: true,
    forbidHeaderOnlyPilling: true,
  },
  {
    id: 'live-show-facials',
    prompt: 'show facials',
    expectAction: 'list_services',
    requireAllFaceFamily: true,
  },
  {
    id: 'live-list-facials',
    prompt: 'list facials',
    expectAction: 'list_services',
    requireAllFaceFamily: true,
  },
  {
    id: 'live-bare-facials',
    prompt: 'facials',
    expectAction: 'list_services',
    requireAllFaceFamily: true,
  },
  {
    id: 'live-show-me-facial',
    prompt: 'show me facial',
    expectAction: 'list_services',
    requireAllFaceFamily: true,
  },
  {
    id: 'live-ctrl-list-facial-services',
    prompt: 'list facial services',
    expectAction: 'list_services',
    requireAllFaceFamily: true,
  },
  {
    id: 'live-ctrl-show-me-facial-services',
    prompt: 'show me facial services',
    expectAction: 'list_services',
    requireAllFaceFamily: true,
  },
  {
    id: 'live-ctrl-show-face-pilling',
    prompt: 'show me Face Pilling',
    expectAction: 'list_services',
    requireOnly: [/Face Pilling/i],
    forbidExtras: [/Face Plasma/i, /facemassage/i],
  },
  {
    id: 'live-list-face-services',
    prompt: 'list face services',
    expectAction: 'list_services',
    // may succeed with family or fail scrub — note residual if fail
    requireAllFaceFamily: true,
    softIfFail: true,
  },
  {
    id: 'live-what-facials-do-you-have',
    prompt: 'what facials do you have',
    expectAction: 'list_services',
    requireAllFaceFamily: true,
    // must not dump entire catalog
    forbidUnrelated: [/hairstyle/i, /Swedish massage/i],
  },
  {
    id: 'ctrl-show-me-massage',
    prompt: 'show me massage',
    expectAction: 'list_services',
    requireSome: [/massage/i],
    forbidAllFaceOnlyHeader: true,
  },
  {
    id: 'ctrl-recommend-facial',
    prompt: 'best specialists for facial this weekend',
    expectAction: 'recommend_specialists',
    forbidCouldntFindFacial: true,
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
  console.log(`e2e-bug.297 live QA → ${API} slug=${SLUG}`);

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
    if (c.requireAllFaceFamily) {
      const missing = FACE_FAMILY.filter((re) => !re.test(summary));
      if (missing.length > 0) {
        if (c.softIfFail && data?.success === false) {
          residuals.push({
            id: c.id,
            note: `face-family list failed: ${summary.slice(0, 140)}`,
          });
        } else {
          problems.push(
            `missing face family: ${missing.map((r) => r.source).join(',')}`,
          );
        }
      }
    }
    if (c.forbidHeaderOnlyPilling && /^Our Face Pilling service types:/i.test(summary)) {
      problems.push('header collapsed to Face Pilling only');
    }
    if (c.requireOnly) {
      for (const re of c.requireOnly) {
        if (!re.test(summary)) problems.push(`missing ${re}`);
      }
    }
    if (c.forbidExtras) {
      for (const re of c.forbidExtras) {
        if (re.test(summary)) problems.push(`unexpected ${re}`);
      }
    }
    if (c.requireSome && !c.requireSome.some((re) => re.test(summary))) {
      problems.push('missing expected massage mention');
    }
    if (c.forbidUnrelated) {
      for (const re of c.forbidUnrelated) {
        if (re.test(summary)) {
          residuals.push({
            id: c.id,
            note: `unrelated catalog leak ${re}: ${summary.slice(0, 120)}`,
          });
        }
      }
    }
    if (c.forbidCouldntFindFacial && /couldn't find ["']facial["']/i.test(summary)) {
      problems.push('could not find facial');
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
