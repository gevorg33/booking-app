/**
 * Guru live QA for e2e-bug.271 — voice "named X … please" must keep the full
 * categoryName (including unique suffixes), not truncate to the first word.
 *
 * Run: node scripts/qa-e2e-bug-271.mjs
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
const SUFFIX = `E2E271-${Date.now().toString(36)}`;

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
  } = require(resolve(backendRoot, 'dist/modules/ai/ai-catalog.util.js'));

  const results = [];
  function record(id, pass, detail) {
    results.push({ id, pass, detail });
    console.log(
      `${pass ? 'PASS' : 'FAIL'}  ${id} — ${JSON.stringify(detail).slice(0, 360)}`,
    );
  }

  // Unit probes against dist.
  const unitCases = [
    {
      id: 'unit-brows-suffix-please',
      prompt: `add catalog category named brows ${SUFFIX} please`,
      expectName: `brows ${SUFFIX}`,
      classifier: 'brows',
    },
    {
      id: 'unit-spa-please',
      prompt: 'Create a catalog category named Spa Treatments please.',
      expectName: 'Spa Treatments',
      classifier: 'Spa',
    },
    {
      id: 'unit-thanks',
      prompt: `Add a new catalog category called Wellness ${SUFFIX} thanks`,
      expectName: `Wellness ${SUFFIX}`,
      classifier: 'Wellness',
    },
  ];
  for (const u of unitCases) {
    const extracted = extractCreateServiceCategoryFromPrompt(u.prompt);
    const params = { categoryName: u.classifier };
    enrichServiceCategoryRescueParams(
      'create_service_category',
      params,
      u.prompt,
    );
    record(u.id, extracted === u.expectName && params.categoryName === u.expectName, {
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

  console.log(`e2e-bug.271 QA → ${API} ${SLUG} suffix=${SUFFIX}`);

  const createdCategoryIds = [];

  async function dashboardAi(prompt) {
    const res = await request('POST', `/businesses/${biz.id}/ai/command`, {
      token,
      body: { prompt, context: {} },
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
      id: 'live-voice-brows-suffix-please',
      prompt: `add catalog category named brows ${SUFFIX} please`,
      mustInclude: SUFFIX,
      mustNotBe: 'brows',
    },
    {
      id: 'live-voice-brows-please-only',
      prompt: `add catalog category named brows-only-${SUFFIX} please`,
      mustInclude: `brows-only-${SUFFIX}`,
    },
    {
      id: 'live-qa-nails-suffix',
      prompt: `Add a new catalog category named QA Nails ${SUFFIX}`,
      mustInclude: SUFFIX,
      mustNotBe: 'QA Nails',
    },
    {
      id: 'live-spa-treatments-please',
      prompt: `Create a catalog category named Spa ${SUFFIX} please.`,
      mustInclude: SUFFIX,
    },
    {
      id: 'live-lash-lift-question',
      prompt: `Can you add a new catalog category named Lash Lift ${SUFFIX}?`,
      mustInclude: SUFFIX,
    },
    {
      id: 'live-wellness-thanks',
      prompt: `Add a new catalog category called Wellness ${SUFFIX} thanks`,
      mustInclude: SUFFIX,
    },
    {
      id: 'live-service-category-voice',
      prompt: `add service category named Color ${SUFFIX} please`,
      mustInclude: SUFFIX,
    },
    {
      id: 'live-quoted-name',
      prompt: `Create catalog category "QA Cats ${SUFFIX}"`,
      mustInclude: SUFFIX,
    },
    {
      id: 'live-thank-you',
      prompt: `Add a new category named Pedicure ${SUFFIX} thank you`,
      mustInclude: SUFFIX,
    },
    {
      id: 'live-makeup-pls',
      prompt: `Create a new catalog category named Makeup ${SUFFIX} pls`,
      mustInclude: SUFFIX,
    },
    {
      id: 'live-no-please-regression',
      prompt: `Add a new catalog category named Extensions ${SUFFIX}`,
      mustInclude: SUFFIX,
    },
  ];

  for (const caze of liveCases) {
    const { status, data } = await dashboardAi(caze.prompt);
    const catName = categoryNameFrom(data) || nameFromSummary(data?.summary);
    const summary = String(data?.summary || '');
    const actionOk = data?.action === 'create_service_category';
    const hasSuffix =
      catName != null &&
      String(catName).includes(caze.mustInclude) &&
      !/please|thanks|thank you|\bpls\b|\bthx\b/i.test(String(catName));
    const notTruncated =
      caze.mustNotBe == null || String(catName) !== caze.mustNotBe;
    const pass =
      status >= 200 &&
      status < 300 &&
      actionOk &&
      hasSuffix &&
      notTruncated;
    const catId = data?.details?.categoryId ?? data?.details?.id ?? null;
    if (catId) createdCategoryIds.push(catId);
    record(caze.id, pass, {
      status,
      action: data?.action,
      success: data?.success,
      categoryName: catName,
      summary: summary.slice(0, 160),
    });
  }

  // Cleanup
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
    `\n${results.length - failed.length}/${results.length} passed` +
      (failed.length ? ` — FAILED: ${failed.map((f) => f.id).join(', ')}` : ''),
  );
  process.exit(failed.length ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
