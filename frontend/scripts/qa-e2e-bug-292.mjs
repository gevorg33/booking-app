/**
 * Guru live QA for e2e-bug.292 — RU catalog-category create must route to
 * create_service_category, not bulk_create_catalog confirm.
 *
 * Run: node scripts/qa-e2e-bug-292.mjs
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
const SUFFIX = `E2E292-${Date.now().toString(36)}`;

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
    isCreateServiceCategoryPrompt,
    isBulkCreateCatalogPrompt,
    extractCreateServiceCategoryFromPrompt,
    rescueCatalogIntent,
  } = require(resolve(backendRoot, 'dist/modules/ai/ai-catalog.util.js'));
  const { isCreateEmployeePrompt } = require(resolve(
    backendRoot,
    'dist/modules/ai/ai-staff-operations.util.js',
  ));
  const { AiIntentRescueService } = require(resolve(
    backendRoot,
    'dist/modules/ai/ai-intent-rescue.service.js',
  ));

  const results = [];
  function record(id, pass, detail) {
    results.push({ id, pass, detail });
    console.log(
      `${pass ? 'PASS' : 'FAIL'}  ${id} — ${JSON.stringify(detail).slice(0, 400)}`,
    );
  }

  console.log(`e2e-bug.292 QA → ${API} ${SLUG} suffix=${SUFFIX}\n`);

  const rescue = new AiIntentRescueService();
  const detectorCases = [
    {
      id: 'det-ru-canonical',
      prompt: `Добавь категорию каталога с названием RUCat ${SUFFIX} пожалуйста`,
      expectName: `RUCat ${SUFFIX}`,
    },
    {
      id: 'det-ru-sozdai',
      prompt: `Создай категорию каталога с названием Spa ${SUFFIX}`,
      expectName: `Spa ${SUFFIX}`,
    },
    {
      id: 'det-ru-color',
      prompt: `Добавь категорию с названием Color ${SUFFIX}`,
      expectName: `Color ${SUFFIX}`,
      forbidEmployee: true,
    },
    {
      id: 'det-ru-pod-nazvaniem',
      prompt: `Создай новую категорию каталога под названием Wellness ${SUFFIX}`,
      expectName: `Wellness ${SUFFIX}`,
    },
    {
      id: 'det-keep-bulk',
      prompt:
        "Create category Hair with Women's cut 60m $65, Men's cut 30m $35",
      keepBulk: true,
    },
  ];

  for (const caze of detectorCases) {
    const create = isCreateServiceCategoryPrompt(caze.prompt);
    const bulk = isBulkCreateCatalogPrompt(caze.prompt);
    if (caze.keepBulk) {
      record(caze.id, create === false && bulk === true, { create, bulk });
      continue;
    }
    const extracted = extractCreateServiceCategoryFromPrompt(caze.prompt);
    const catalogRescue = rescueCatalogIntent(
      caze.prompt,
      'bulk_create_catalog',
    );
    const gateway = rescue.rescue({
      prompt: caze.prompt,
      action: 'bulk_create_catalog',
      params: {},
      surface: 'dashboard',
    });
    const notEmployee = caze.forbidEmployee
      ? isCreateEmployeePrompt(caze.prompt) === false
      : true;
    const pass =
      create === true &&
      bulk === false &&
      extracted === caze.expectName &&
      catalogRescue?.action === 'create_service_category' &&
      gateway?.action === 'create_service_category' &&
      notEmployee;
    record(caze.id, pass, {
      create,
      bulk,
      extracted,
      catalogRescue: catalogRescue?.action,
      gateway: gateway?.action,
      employee: isCreateEmployeePrompt(caze.prompt),
      expectName: caze.expectName,
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

  async function dashboardAi(prompt, locale) {
    const res = await request('POST', `/businesses/${biz.id}/ai/command`, {
      token,
      body: {
        prompt,
        context: {
          confirmed: true,
          sessionId: `e292-${Date.now()}`,
          ...(locale ? { locale } : {}),
        },
      },
    });
    return { status: res.status, data: unwrap(res.body) };
  }

  function categoryNameFrom(data) {
    return (
      data?.details?.categoryName ??
      data?.details?.partialParams?.categoryName ??
      data?.params?.categoryName ??
      null
    );
  }

  function nameFromSummary(summary) {
    const m = String(summary || '').match(
      /[Cc]reated (?:the )?(?:new )?(?:catalog |service )?category ["']([^"']+)["']/i,
    );
    return m?.[1] ?? null;
  }

  const liveCases = [
    {
      id: 'live-ru-canonical',
      prompt: `Добавь категорию каталога с названием RUCat ${SUFFIX} пожалуйста`,
      locale: 'ru',
      mustInclude: SUFFIX,
    },
    {
      id: 'live-ru-sozdai',
      prompt: `Создай категорию каталога с названием Spa ${SUFFIX}`,
      locale: 'ru',
      mustInclude: SUFFIX,
    },
    {
      id: 'live-ru-category-only',
      prompt: `Добавь категорию с названием Nails ${SUFFIX}`,
      locale: 'ru',
      mustInclude: SUFFIX,
    },
    {
      id: 'live-ru-pod-nazvaniem',
      prompt: `Создай новую категорию каталога под названием Wellness ${SUFFIX}`,
      locale: 'ru',
      mustInclude: SUFFIX,
    },
    {
      id: 'live-ru-color-not-employee',
      prompt: `Добавь категорию с названием Color ${SUFFIX}`,
      locale: 'ru',
      mustInclude: SUFFIX,
      forbidAction: 'create_employee',
    },
    {
      id: 'live-ru-quotes',
      prompt: `Создай категорию каталога «Brow ${SUFFIX}»`,
      locale: 'ru',
      mustInclude: SUFFIX,
    },
    {
      id: 'live-ru-no-locale-context',
      prompt: `Добавь категорию каталога с названием NoLoc ${SUFFIX}`,
      mustInclude: SUFFIX,
    },
    {
      id: 'live-en-regression',
      prompt: `Add a new catalog category named QA Nails ${SUFFIX}`,
      mustInclude: SUFFIX,
    },
    {
      id: 'live-hy-regression',
      prompt: `Ավելացրու կատալոգի կատեգորիա անունով HYCat ${SUFFIX}`,
      locale: 'hy',
      mustInclude: SUFFIX,
    },
    {
      id: 'live-keep-bulk',
      prompt: `Create category HairBulk${SUFFIX} with Women's cut 60m $65, Men's cut 30m $35`,
      expectAction: 'bulk_create_catalog',
      allowConfirm: true,
    },
  ];

  for (const caze of liveCases) {
    const { status, data } = await dashboardAi(caze.prompt, caze.locale);
    const action = data?.action;
    const summary = String(data?.summary || '');

    if (caze.expectAction) {
      const pass =
        status >= 200 &&
        status < 300 &&
        action === caze.expectAction &&
        action !== 'create_service_category';
      record(caze.id, pass, {
        status,
        action,
        expect: caze.expectAction,
        summary: summary.slice(0, 160),
      });
      continue;
    }

    const catName = categoryNameFrom(data) || nameFromSummary(summary);
    const actionOk = action === 'create_service_category';
    const notBulk = action !== 'bulk_create_catalog';
    const notForbidden =
      !caze.forbidAction || action !== caze.forbidAction;
    const hasSuffix =
      catName != null && String(catName).includes(caze.mustInclude);
    const pass =
      status >= 200 &&
      status < 300 &&
      actionOk &&
      notBulk &&
      notForbidden &&
      hasSuffix &&
      data?.success === true;
    const catId = data?.details?.categoryId ?? data?.details?.id ?? null;
    if (catId) createdCategoryIds.push(catId);
    record(caze.id, pass, {
      status,
      action,
      success: data?.success,
      categoryName: catName,
      summary: summary.slice(0, 160),
    });
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
    `\ne2e-bug.292 QA → ${API} ${SLUG} — ${results.length - failed.length}/${results.length} PASS`,
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
