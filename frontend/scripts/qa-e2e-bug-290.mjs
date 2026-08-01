/**
 * Guru live QA for e2e-bug.290 — trailing "kindly" (and similar softeners)
 * must not be absorbed into create_service_category categoryName.
 *
 * Run: node scripts/qa-e2e-bug-290.mjs
 */
import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(__dirname, '../../backend');
const require = createRequire(resolve(backendRoot, 'package.json'));

const SLUG = process.env.SALON_SLUG || 'gevgas-operations-7c299253';
const API = process.env.API_BASE || 'http://127.0.0.1:3001';
const SUFFIX = `E2E290-${Date.now().toString(36)}`;

const SOFTENER_RE =
  /\b(?:please|kindly|thanks|thank you|pls|thx|cheers|appreciate(?:\s+it)?)\b/i;

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

function request(method, path, { token, body } = {}) {
  return new Promise((resolvePromise, reject) => {
    const data = body != null ? JSON.stringify(body) : null;
    const url = new URL(path, API);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port || 3001,
        path: url.pathname + url.search,
        method,
        headers: {
          ...(data
            ? {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
              }
            : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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
  const { Client } = require('pg');
  const jwt = require('jsonwebtoken');
  const {
    extractCreateServiceCategoryFromPrompt,
    enrichServiceCategoryRescueParams,
    stripTrailingCategoryNamePoliteness,
  } = require(resolve(backendRoot, 'dist/modules/ai/ai-catalog.util.js'));

  const results = [];
  function record(id, pass, detail) {
    results.push({ id, pass, detail });
    console.log(
      `${pass ? 'PASS' : 'FAIL'}  ${id} — ${JSON.stringify(detail).slice(0, 400)}`,
    );
  }

  console.log(`e2e-bug.290 QA → ${API} ${SLUG} suffix=${SUFFIX}\n`);

  const unitCases = [
    {
      id: 'unit-kindly-please-canonical',
      prompt: `add catalog category named KindlyCat ${SUFFIX} kindly please`,
      expectName: `KindlyCat ${SUFFIX}`,
      classifier: `KindlyCat ${SUFFIX} kindly`,
    },
    {
      id: 'unit-kindly-alone',
      prompt: `add catalog category named Brow Bar ${SUFFIX} kindly`,
      expectName: `Brow Bar ${SUFFIX}`,
      classifier: 'Brow Bar',
    },
    {
      id: 'unit-please-kindly',
      prompt: `Create a catalog category named Spa ${SUFFIX} please kindly`,
      expectName: `Spa ${SUFFIX}`,
      classifier: 'Spa',
    },
    {
      id: 'unit-cheers',
      prompt: `Create a new catalog category named Color ${SUFFIX} cheers`,
      expectName: `Color ${SUFFIX}`,
      classifier: 'Color',
    },
    {
      id: 'unit-kindlycat-prefix',
      prompt: `add catalog category named KindlyCat ${SUFFIX} please`,
      expectName: `KindlyCat ${SUFFIX}`,
      classifier: 'KindlyCat',
    },
    {
      id: 'unit-strip-kindly-stack',
      stripOnly: true,
      input: `KindlyCat ${SUFFIX} kindly please`,
      expectName: `KindlyCat ${SUFFIX}`,
    },
  ];

  for (const u of unitCases) {
    if (u.stripOnly) {
      const stripped = stripTrailingCategoryNamePoliteness(u.input);
      record(u.id, stripped === u.expectName && !SOFTENER_RE.test(stripped), {
        stripped,
        expectName: u.expectName,
      });
      continue;
    }
    const extracted = extractCreateServiceCategoryFromPrompt(u.prompt);
    const params = { categoryName: u.classifier };
    enrichServiceCategoryRescueParams(
      'create_service_category',
      params,
      u.prompt,
    );
    const pass =
      extracted === u.expectName &&
      params.categoryName === u.expectName &&
      !SOFTENER_RE.test(String(params.categoryName));
    record(u.id, pass, {
      extracted,
      enriched: params.categoryName,
      expectName: u.expectName,
    });
  }

  const c = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD || undefined,
    database: process.env.DB_NAME,
  });
  await c.connect();

  const biz = (
    await c.query('SELECT id FROM businesses WHERE slug=$1', [SLUG])
  ).rows[0];
  if (!biz) throw new Error(`business not found: ${SLUG}`);

  const member = (
    await c.query(
      `SELECT bm.user_id, bm.role, u.email, u.role AS user_role
       FROM business_members bm
       JOIN users u ON u.id = bm.user_id
       WHERE bm.business_id=$1 AND bm.role='owner' LIMIT 1`,
      [biz.id],
    )
  ).rows[0];
  if (!member) throw new Error('no owner membership');

  const emp = (
    await c.query(
      `SELECT id FROM employees WHERE business_id=$1 AND "isActive"=true LIMIT 1`,
      [biz.id],
    )
  ).rows[0];

  const token = jwt.sign(
    {
      sub: member.user_id,
      email: String(member.email).toLowerCase(),
      role: member.user_role,
      businessId: biz.id,
      membershipRole: member.role,
      employeeId: emp?.id ?? null,
    },
    process.env.JWT_SECRET,
    { expiresIn: '2h' },
  );

  const createdCategoryIds = [];

  async function dashboardAi(prompt) {
    const res = await request('POST', `/businesses/${biz.id}/ai/command`, {
      token,
      body: {
        prompt,
        context: { confirmed: true, sessionId: `e290-${Date.now()}` },
      },
    });
    return { status: res.status, data: unwrap(res.body) };
  }

  function categoryNameFrom(data) {
    return (
      data?.details?.categoryName ??
      data?.details?.partialParams?.categoryName ??
      data?.params?.categoryName ??
      data?.details?.sessionContext?.categoryName ??
      null
    );
  }

  function nameFromSummary(summary) {
    const m = String(summary || '').match(
      /[Cc]reated category ["']([^"']+)["']/,
    );
    return m?.[1] ?? null;
  }

  const liveCases = [
    {
      id: 'live-kindly-please-canonical',
      prompt: `add catalog category named KindlyCat ${SUFFIX} kindly please`,
      mustInclude: SUFFIX,
      mustIncludeName: 'KindlyCat',
      forbidSoftener: true,
    },
    {
      id: 'live-kindly-alone',
      prompt: `add catalog category named Brow Bar ${SUFFIX} kindly`,
      mustInclude: SUFFIX,
      forbidSoftener: true,
    },
    {
      id: 'live-please-kindly',
      prompt: `Create a catalog category named Spa ${SUFFIX} please kindly`,
      mustInclude: SUFFIX,
      forbidSoftener: true,
    },
    {
      id: 'live-kindly-period',
      prompt: `Add a new catalog category named Nails ${SUFFIX} kindly.`,
      mustInclude: SUFFIX,
      forbidSoftener: true,
    },
    {
      id: 'live-kindly-thanks',
      prompt: `Add a new catalog category called Wellness ${SUFFIX} kindly thanks`,
      mustInclude: SUFFIX,
      forbidSoftener: true,
    },
    {
      id: 'live-kindlycat-prefix-please',
      prompt: `add catalog category named KindlyCatKeep ${SUFFIX} please`,
      mustInclude: SUFFIX,
      mustIncludeName: 'KindlyCatKeep',
      forbidSoftener: true,
    },
    {
      id: 'live-cheers',
      prompt: `Create a new catalog category named Color ${SUFFIX} cheers`,
      mustInclude: SUFFIX,
      forbidSoftener: true,
    },
    {
      id: 'live-appreciate-it',
      prompt: `Add a new catalog category named Makeup ${SUFFIX} appreciate it`,
      mustInclude: SUFFIX,
      forbidSoftener: true,
    },
    {
      id: 'live-service-category-kindly',
      prompt: `add service category named Lash ${SUFFIX} kindly please`,
      mustInclude: SUFFIX,
      forbidSoftener: true,
    },
    {
      id: 'live-please-only-regression',
      prompt: `add catalog category named brows ${SUFFIX} please`,
      mustInclude: SUFFIX,
      forbidSoftener: true,
    },
    {
      id: 'live-no-softener-regression',
      prompt: `Add a new catalog category named Extensions ${SUFFIX}`,
      mustInclude: SUFFIX,
    },
  ];

  for (const caze of liveCases) {
    const { status, data } = await dashboardAi(caze.prompt);
    const catName = categoryNameFrom(data) || nameFromSummary(data?.summary);
    const summary = String(data?.summary || '');
    const actionOk = data?.action === 'create_service_category';
    const nameStr = String(catName || '');
    const hasSuffix = nameStr.includes(caze.mustInclude);
    const hasPrefix =
      !caze.mustIncludeName || nameStr.includes(caze.mustIncludeName);
    const noSoftener =
      caze.forbidSoftener === false
        ? true
        : !SOFTENER_RE.test(nameStr) && !SOFTENER_RE.test(summary.slice(0, 120));
    // KindlyCatKeep / KindlyCat are names — allow "Kindly" only as prefix token.
    const noTrailingKindly = !/\skindly\b/i.test(nameStr);
    const pass =
      status >= 200 &&
      status < 300 &&
      actionOk &&
      hasSuffix &&
      hasPrefix &&
      noTrailingKindly &&
      (caze.forbidSoftener
        ? !/\s(?:please|thanks|thank you|pls|thx|cheers|appreciate)\b/i.test(
            nameStr,
          )
        : true);
    const catId = data?.details?.categoryId ?? data?.details?.id ?? null;
    if (catId) createdCategoryIds.push(catId);
    record(caze.id, pass, {
      status,
      action: data?.action,
      success: data?.success,
      categoryName: catName,
      noSoftener,
      summary: summary.slice(0, 160),
    });
  }

  // Residual probes (e2e-bug.291 / e2e-bug.292) — do not fail this suite.
  const residualProbes = [
    {
      id: 'residual-291-hy-catalog-category',
      prompt: `Ավելացրու կատալոգի կատեգորիա անունով HYCat ${SUFFIX}`,
      expectAction: 'create_service_category',
      bug: 'e2e-bug.291',
    },
    {
      id: 'residual-292-ru-catalog-category',
      prompt: `Добавь категорию каталога с названием RUCat ${SUFFIX}`,
      expectAction: 'create_service_category',
      bug: 'e2e-bug.292',
    },
  ];
  for (const probe of residualProbes) {
    const { status, data } = await dashboardAi(probe.prompt);
    const ok = data?.action === probe.expectAction;
    console.log(
      `${ok ? 'NOTE' : 'RESIDUAL'}  ${probe.id} (${probe.bug}) — ${JSON.stringify(
        {
          status,
          action: data?.action,
          expect: probe.expectAction,
          summary: String(data?.summary || '').slice(0, 140),
        },
      ).slice(0, 360)}`,
    );
  }

  for (const id of createdCategoryIds) {
    try {
      await c.query(
        `DELETE FROM service_categories WHERE id=$1 AND business_id=$2`,
        [id, biz.id],
      );
    } catch {
      /* ignore */
    }
  }
  try {
    await c.query(
      `DELETE FROM service_categories
       WHERE business_id=$1 AND name ILIKE $2`,
      [biz.id, `%${SUFFIX}%`],
    );
  } catch {
    /* ignore */
  }
  await c.end();

  const failed = results.filter((r) => !r.pass);
  console.log(
    `\ne2e-bug.290 QA → ${API} ${SLUG} — ${results.length - failed.length}/${results.length} PASS`,
  );
  if (failed.length) {
    console.log('FAILED:', failed.map((f) => f.id).join(', '));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
