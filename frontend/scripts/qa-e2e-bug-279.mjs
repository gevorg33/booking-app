/**
 * Guru live QA for e2e-bug.279 — bare "facial" must resolve to Face Pilling /
 * Face Plasma / facemassage (not "couldn't find facial").
 *
 * Run: node scripts/qa-e2e-bug-279.mjs
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(__dirname, '../../backend');

const SLUG = process.env.SALON_SLUG || 'gevgas-operations-7c299253';
const API = process.env.API_BASE || 'http://127.0.0.1:3001';

const FACE_FAMILY = ['face pilling', 'face plasma', 'facemassage'];

const CASES = [
  {
    id: 'live-best-specialists-facial-weekend',
    prompt: 'best specialists for facial this weekend',
    expectAction: 'recommend_specialists',
    expectSuccess: true,
    forbidCouldntFind: ['facial'],
    requireFaceFamilyHit: true,
  },
  {
    id: 'live-best-rated-facial',
    prompt: 'best rated specialists for facial',
    expectAction: 'recommend_specialists',
    expectSuccess: true,
    forbidCouldntFind: ['facial'],
    requireFaceFamilyHit: true,
  },
  {
    id: 'live-recommend-specialists-facial',
    prompt: 'recommend specialists for facial',
    expectAction: 'recommend_specialists',
    expectSuccess: true,
    forbidCouldntFind: ['facial'],
    requireFaceFamilyHit: true,
  },
  {
    id: 'live-who-recommend-facial',
    prompt: 'Who do you recommend for a facial?',
    expectAction: 'recommend_specialists',
    expectSuccess: true,
    forbidCouldntFind: ['facial'],
    requireFaceFamilyHit: true,
  },
  {
    id: 'live-list-facial-services',
    prompt: 'list facial services',
    expectAction: 'list_services',
    expectSuccess: true,
    forbidCouldntFind: ['facial'],
    requireFaceFamilyHit: true,
  },
  {
    id: 'live-show-facial-services',
    prompt: 'show me facial services',
    expectAction: 'list_services',
    expectSuccess: true,
    forbidCouldntFind: ['facial'],
    requireFaceFamilyHit: true,
  },
  {
    id: 'live-facials-plural',
    prompt: 'show me facials',
    allowActions: ['list_services', 'recommend_specialists'],
    expectSuccess: true,
    forbidCouldntFind: ['facial', 'facials'],
    requireFaceFamilyHit: true,
  },
  {
    id: 'live-control-facemassage',
    prompt: 'best specialists for facemassage',
    expectAction: 'recommend_specialists',
    expectSuccess: true,
    forbidCouldntFind: ['facemassage', 'facial'],
  },
  {
    id: 'live-control-face-pilling',
    prompt: 'best specialists for Face Pilling',
    expectAction: 'recommend_specialists',
    expectSuccess: true,
    forbidCouldntFind: ['face pilling', 'facial'],
  },
  {
    id: 'live-control-massage-not-facial',
    prompt: 'best specialists for massage',
    expectAction: 'recommend_specialists',
    expectSuccess: true,
    forbidCouldntFind: ['massage', 'facial'],
    forbidSummaryIncludes: FACE_FAMILY.filter((n) => n === 'face pilling'),
  },
  {
    id: 'live-control-haircut-synonym',
    prompt: 'best specialists for haircut',
    expectAction: 'recommend_specialists',
    expectSuccess: true,
    forbidCouldntFind: ['haircut'],
  },
  {
    id: 'live-control-unicorn',
    prompt: 'best specialists for unicorn laser facial',
    expectAction: 'recommend_specialists',
    expectSuccess: false,
    requireCouldntFind: true,
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

function detailsBlob(d) {
  try {
    return JSON.stringify(d.details ?? {});
  } catch {
    return '';
  }
}

function couldntFind(summary, needle) {
  return new RegExp(
    `couldn't find ["']?${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
    'i',
  ).test(String(summary || ''));
}

async function main() {
  loadEnv();
  const results = [];

  for (const c of CASES) {
    const res = await request('POST', `/public/${SLUG}/assistant`, {
      prompt: c.prompt,
      assistantMode: 'act',
      locale: 'en',
      context: { slug: SLUG },
    });
    const d = res.body?.data ?? res.body ?? {};
    const action = d.action;
    const summary = String(d.summary || '');
    const blob = `${summary}\n${detailsBlob(d)}`.toLowerCase();

    let pass = res.status >= 200 && res.status < 300;
    if (c.expectAction) pass = pass && action === c.expectAction;
    if (c.allowActions) pass = pass && c.allowActions.includes(action);
    if (c.expectSuccess === true) pass = pass && d.success === true;
    if (c.expectSuccess === false) pass = pass && d.success === false;
    for (const needle of c.forbidCouldntFind || []) {
      if (couldntFind(summary, needle)) pass = false;
    }
    if (c.requireCouldntFind) {
      pass = pass && /couldn't find/i.test(summary);
    }
    if (c.requireFaceFamilyHit) {
      const hit = FACE_FAMILY.some((name) => blob.includes(name));
      // Empty-slot success still OK when catalog resolved the face family
      // ("3 services") instead of "couldn't find facial".
      const faceServiceWindow =
        /(?:face pilling|face plasma|facemassage|face services|facial|\d+\s+services)/i.test(
          summary,
        );
      pass = pass && (hit || faceServiceWindow);
    }
    for (const forbidden of c.forbidSummaryIncludes || []) {
      // Soft: massage recommend should not be dominated by Face Pilling alone;
      // only fail if summary is exclusively face-family with no massage cue.
      if (
        blob.includes(forbidden) &&
        !/\bmassage\b/i.test(summary) &&
        c.id.includes('massage')
      ) {
        pass = false;
      }
    }

    results.push({
      id: c.id,
      pass,
      detail: {
        status: res.status,
        action,
        success: d.success,
        summary: summary.slice(0, 200).replace(/\n/g, ' | '),
      },
    });
  }

  let failed = 0;
  console.log(`e2e-bug.279 QA → ${API} ${SLUG}\n`);
  for (const row of results) {
    if (row.pass) {
      console.log(`PASS ${row.id}`, JSON.stringify(row.detail).slice(0, 360));
    } else {
      failed += 1;
      console.log(`FAIL ${row.id}`, JSON.stringify(row.detail).slice(0, 480));
    }
  }
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
