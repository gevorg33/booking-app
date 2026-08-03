/**
 * Guru live QA for e2e-bug.347 — "create a category WITH these services" built
 * the category but silently dropped every service line.
 *
 * Root causes fixed (all in backend/src/modules/ai/):
 *  1. `parseServiceLinesFromText` only matched `Name 60m $65`; the shapes users
 *     actually type (`Name, 30 minutes, $50` and `Name (30 min, $50)`) parsed to
 *     zero services, so bulk_create_catalog clarified instead of creating.
 *  2. `parseBulkCatalogFromPrompt`'s `{1,40}?` category capture required >= 2
 *     characters, so single-letter categories ("category Y with …") returned null.
 *  3. The first service name absorbed the command preamble, and the compound
 *     path's category name absorbed the trailing service clause ("Y with services A").
 *  4. COMPOUND_SPLIT split on EVERY ";", shredding the service enumeration into
 *     separate "steps"; a semicolon now only splits when a catalog verb follows.
 *  5. `handleBulkCreateCatalogLogic` treated a classifier-supplied `categoryName`
 *     as terminal, never falling back to parsing services out of the prompt.
 *
 * NOTE: this script MUTATES the catalog (that is the only way to prove services
 * are really created) and deletes everything it created before exiting.
 *
 * Known-open residuals, asserted loosely on purpose — see e2e-bug.348/.349:
 *  - Case 1 creates the services but the LLM's own compound decomposition routes
 *    them to `create_services`, so the category link is lost (e2e-bug.348).
 *  - Case 3 ("Under Y add …") is stolen by `add_services_to_cart` (e2e-bug.349).
 *
 * Run: node frontend/scripts/qa-e2e-bug-347.mjs
 * Requires: API on :3001, salon `gevgas-operations-7c299253`, DB reachable.
 */
import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(__dirname, '../../backend');
const require = createRequire(resolve(backendRoot, 'package.json'));
const jwt = require('jsonwebtoken');
const { Client } = require('pg');

const JWT_SECRET =
  process.env.JWT_SECRET || 'dev-secret-change-in-production-f8a3b2c1d4e5';
const SLUG = 'gevgas-operations-7c299253';

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

function request(method, path, body, headers = {}) {
  return new Promise((resolvePromise, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: 3001,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          ...headers,
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = raw;
          }
          resolvePromise({ status: res.statusCode, body: parsed });
        });
      },
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  loadEnv();
  const dbUrl =
    process.env.DATABASE_URL ||
    'postgresql://gevorggasparyan@localhost:5432/booking_platform';
  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  const { rows: bizRows } = await client.query(
    `SELECT id FROM businesses WHERE slug = $1`,
    [SLUG],
  );
  const businessId = bizRows[0].id;
  const { rows: memberRows } = await client.query(
    `SELECT user_id, role FROM business_members WHERE business_id = $1 AND role = 'owner' LIMIT 1`,
    [businessId],
  );
  const token = jwt.sign(
    { sub: memberRows[0].user_id, businessId, membershipRole: memberRows[0].role },
    JWT_SECRET,
    { expiresIn: '1h' },
  );
  const authHeaders = { Authorization: `Bearer ${token}` };

  async function ask(prompt) {
    const res = await request(
      'POST',
      `/businesses/${businessId}/ai/command`,
      { prompt },
      authHeaders,
    );
    const data = res.body?.data ?? res.body;
    return {
      action: data?.action,
      success: data?.success,
      summary: String(data?.summary ?? data?.message ?? ''),
      compoundActions: data?.details?.compoundActions,
      requiresConfirm: data?.requiresExecutionConfirmation,
    };
  }

  async function listAll() {
    const { rows: cats } = await client.query(
      `SELECT id, name FROM service_categories WHERE business_id = $1`,
      [businessId],
    );
    const { rows: svcs } = await client.query(
      `SELECT s.id, s.name, s."durationMinutes" AS dur, s.price, s.prepayment_mode, c.name AS cat
         FROM services s LEFT JOIN service_categories c ON c.id = s.category_id
        WHERE s.business_id = $1`,
      [businessId],
    );
    return { cats, svcs };
  }

  const CASES = [
    {
      id: 'case1-single-category-three-services',
      prompt:
        'Create a category Y with three services: service A, 30 minutes, $50; service B, 45 minutes, $45; service C, 60 minutes, $70 — and enable online payment for all of them.',
      expect: 'category Y + services A/B/C under it',
    },
    {
      id: 'case2-two-categories-two-services-each',
      prompt:
        'Create category Y with services A (30 min, $50) and B (45 min, $45), and create category Z with services C (60 min, $70) and D (20 min, $30) — enable online payment for all of them.',
      expect: 'categories Y,Z + A,B under Y and C,D under Z',
    },
    {
      id: 'case3-categories-then-under-assignments',
      prompt:
        'Create categories Y and Z. Under Y add service A (30 min, $50) and service B (45 min, $45). Under Z add service C (60 min, $70). Turn on online payment for everything.',
      expect: 'categories Y,Z + A,B under Y and C under Z',
    },
  ];

  const createdCatIds = new Set();
  const createdSvcIds = new Set();

  for (const c of CASES) {
    console.log(`\n=== ${c.id} ===`);
    const before = await listAll();
    const beforeCat = new Set(before.cats.map((x) => x.id));
    const beforeSvc = new Set(before.svcs.map((x) => x.id));

    const r = await ask(c.prompt);
    console.log(`  action=${r.action} success=${r.success} requiresConfirm=${r.requiresConfirm}`);
    console.log(`  compoundActions=${JSON.stringify(r.compoundActions)}`);
    console.log(`  summary=${r.summary.slice(0, 240)}`);

    const after = await listAll();
    const newCats = after.cats.filter((x) => !beforeCat.has(x.id));
    const newSvcs = after.svcs.filter((x) => !beforeSvc.has(x.id));
    newCats.forEach((x) => createdCatIds.add(x.id));
    newSvcs.forEach((x) => createdSvcIds.add(x.id));

    console.log(`  EXPECTED: ${c.expect}`);
    console.log(`  NEW categories(${newCats.length}):`, newCats.map((x) => x.name));
    console.log(
      `  NEW services(${newSvcs.length}):`,
      newSvcs.map((s) => `${s.name} dur=${s.dur} price=${s.price} prepay=${s.prepayment_mode} cat=${s.cat ?? 'NONE'}`),
    );
  }

  console.log('\n=== CLEANUP ===');
  if (createdSvcIds.size) {
    const d = await client.query(`DELETE FROM services WHERE id = ANY($1::uuid[])`, [
      [...createdSvcIds],
    ]);
    console.log(`  deleted services=${d.rowCount}`);
  } else console.log('  deleted services=0');
  if (createdCatIds.size) {
    const d = await client.query(
      `DELETE FROM service_categories WHERE id = ANY($1::uuid[])`,
      [[...createdCatIds]],
    );
    console.log(`  deleted categories=${d.rowCount}`);
  } else console.log('  deleted categories=0');

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
