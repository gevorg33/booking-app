/**
 * Guru live QA for e2e-bug.311 — HY/RU explain_clinic_services empty
 * summaries must stay localized (not flake to English via enrich).
 *
 * Run: node frontend/scripts/qa-e2e-bug-311.mjs
 * Requires: API on :3001
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

const EN_EMPTY_RE =
  /No clinic catalog services are currently available|No clinic catalog services found/i;
const HY_EMPTY_RE = /կլինիկական կատալոգում|հասանելի չեն/i;
const RU_EMPTY_RE = /каталоге клиники|нет доступных/i;

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
  process.chdir(backendRoot);

  const {
    resolveExplainClinicServicesLocale,
    buildExplainClinicServicesSummary,
  } = require(resolve(
    backendRoot,
    'dist/modules/ai/ai-clinic-service.logic.js',
  ));
  const { isAiDateGroundedBookingAction } = require(resolve(
    backendRoot,
    'dist/modules/ai/ai-date-label.util.js',
  ));
  const { t } = require(resolve(
    backendRoot,
    'dist/common/i18n/messages.js',
  ));

  const results = [];
  function record(id, pass, detail) {
    results.push({ id, pass, detail });
    console.log(
      `${pass ? 'PASS' : 'FAIL'}  ${id} — ${JSON.stringify(detail).slice(0, 360)}`,
    );
  }

  const bugPrompt = 'Քանի խորհրդատվություն ունենք կատալոգում';
  record(
    'unit-hy-locale-from-prompt',
    resolveExplainClinicServicesLocale({ locale: 'en' }, bugPrompt) === 'hy',
    {
      locale: resolveExplainClinicServicesLocale({ locale: 'en' }, bugPrompt),
    },
  );
  const hyEmpty = buildExplainClinicServicesSummary(
    {},
    [],
    {
      total: 0,
      consultation: 0,
      labTest: 0,
      procedure: 0,
      unclassified: 0,
      fastingLabTests: 0,
      departments: [],
    },
    'hy',
  );
  record(
    'unit-hy-empty-copy',
    HY_EMPTY_RE.test(hyEmpty) && !EN_EMPTY_RE.test(hyEmpty),
    { hyEmpty },
  );
  record(
    'unit-skip-enrich',
    isAiDateGroundedBookingAction('explain_clinic_services') === true,
    {},
  );
  record(
    'unit-i18n-key',
    t('hy', 'assistant.clinicServicesEmpty', { filterNote: '' }) === hyEmpty,
    {},
  );

  const { Client } = require('pg');
  const jwt = require('jsonwebtoken');

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
  await c.end();

  async function dashboardAi(prompt, locale) {
    const res = await request('POST', `/businesses/${biz.id}/ai/command`, {
      token,
      body: {
        prompt,
        context: {
          ...(locale ? { locale } : {}),
        },
      },
    });
    return { status: res.status, data: unwrap(res.body) };
  }

  console.log(`e2e-bug.311 QA → ${API} ${SLUG}\n`);

  const liveCases = [
    {
      id: 'live-hy-lab-fasting',
      prompt: 'Որ լաբ թեստերն են ծոմավոր պահանջող',
      locale: 'hy',
      expect: 'hy',
    },
    {
      id: 'live-hy-consultation-count',
      prompt: bugPrompt,
      locale: 'hy',
      expect: 'hy',
    },
    {
      id: 'live-hy-fasting-in-catalog',
      prompt: 'Որ լաբ թեստերն են ծոմավոր պահանջող կատալոգում',
      locale: 'hy',
      expect: 'hy',
    },
    {
      id: 'live-hy-department-counts',
      prompt: 'Ցույց տուր բաժինների քանակը',
      locale: 'hy',
      expect: 'hy',
    },
    {
      id: 'live-ru-consultation',
      prompt: 'Сколько консультаций в каталоге?',
      locale: 'ru',
      expect: 'ru',
    },
    {
      id: 'live-ru-fasting',
      prompt: 'Какие лабораторные тесты требуют голодания?',
      locale: 'ru',
      expect: 'ru',
    },
    {
      id: 'live-en-fasting',
      prompt: 'Which lab tests require fasting?',
      locale: 'en',
      expect: 'en',
    },
    {
      id: 'live-en-explain',
      prompt: 'Explain our clinic services and department counts',
      locale: 'en',
      expect: 'en',
    },
  ];

  // Stability: bug repro must never flip to English across repeats.
  for (let i = 1; i <= 5; i++) {
    liveCases.push({
      id: `live-hy-consultation-stability-${i}`,
      prompt: bugPrompt,
      locale: 'hy',
      expect: 'hy',
    });
  }

  for (const caze of liveCases) {
    const { status, data } = await dashboardAi(caze.prompt, caze.locale);
    const action = data?.action || data?.intent || '';
    const summary = String(data?.summary || '');
    const actionOk = action === 'explain_clinic_services';
    const hyOk =
      caze.expect !== 'hy' ||
      (HY_EMPTY_RE.test(summary) && !EN_EMPTY_RE.test(summary));
    const ruOk =
      caze.expect !== 'ru' ||
      (RU_EMPTY_RE.test(summary) && !EN_EMPTY_RE.test(summary));
    const enOk = caze.expect !== 'en' || EN_EMPTY_RE.test(summary);
    const pass =
      (status === 200 || status === 201) && actionOk && hyOk && ruOk && enOk;
    record(caze.id, pass, {
      status,
      action,
      summary: summary.slice(0, 180),
      actionOk,
      hyOk,
      ruOk,
      enOk,
    });
  }

  // Residual probe (does not fail the suite) — e2e-bug.337.
  {
    const residualPrompt = 'Բացատրի՛ր մեր կլինիկական ծառայությունները';
    const { status, data } = await dashboardAi(residualPrompt, 'hy');
    const action = data?.action || '';
    const summary = String(data?.summary || '');
    const stolenByHours = action === 'explain_business_hours_and_location';
    console.log(
      `NOTE  residual-hy-explain-clinic-vs-hours — ${JSON.stringify({
        status,
        action,
        stolenByHours,
        summary: summary.slice(0, 120),
      })}`,
    );
    if (stolenByHours) {
      console.log(
        'NOTE  File/keep e2e-bug.337 — HY բացատրի՛ր կլինիկական ծառայությունները → explain_business_hours_and_location',
      );
    }
  }

  const failed = results.filter((r) => !r.pass);
  console.log(
    `\ne2e-bug.311: ${results.length - failed.length}/${results.length} passed`,
  );
  if (failed.length) {
    console.error('FAILED:', failed.map((f) => f.id).join(', '));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
