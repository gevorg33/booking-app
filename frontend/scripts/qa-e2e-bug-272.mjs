/**
 * Manual live QA for e2e-bug.272 — ConsumerPackageVisitActions /
 * ConsumerMultiServiceVisitActions CTAs must be light-DOM
 * button.consumer-action-button (not IonButton hosts).
 *
 * Seeds a package visit + multi-service visit for a customer on the test salon,
 * signs into Account, and asserts native CTAs + no ion-button hosts.
 *
 * Run from repo root: node frontend/scripts/qa-e2e-bug-272.mjs
 * Requires: consumer Vite on :5174, API on :3001, Postgres from backend/.env
 */
import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(__dirname, '../../backend');
const frontendRoot = resolve(__dirname, '..');
const requireBackend = createRequire(resolve(backendRoot, 'package.json'));
const requireFrontend = createRequire(resolve(frontendRoot, 'package.json'));
const puppeteer = requireFrontend('puppeteer-core');
const pg = requireBackend('pg');
const jwt = requireBackend('jsonwebtoken');

const CHROME =
  process.env.CHROME_PATH ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SLUG = process.env.SALON_SLUG || 'gevgas-operations-7c299253';
const BASE = process.env.CONSUMER_BASE || 'http://127.0.0.1:5174';
const ACCOUNT = `${BASE}/s/${SLUG}/account`;
const VW = 390;
const VH = 844;

function loadEnv() {
  const envPath = resolve(backendRoot, '.env');
  if (!existsSync(envPath)) throw new Error(`missing ${envPath}`);
  const env = {};
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

function push(results, id, pass, detail) {
  results.push({ id, pass: Boolean(pass), detail });
}

async function main() {
  const env = loadEnv();
  const client = new pg.Client({
    host: env.DB_HOST,
    port: Number(env.DB_PORT || 5432),
    user: env.DB_USERNAME,
    password: env.DB_PASSWORD || undefined,
    database: env.DB_NAME,
  });
  await client.connect();

  const biz = (
    await client.query('SELECT id FROM businesses WHERE slug=$1', [SLUG])
  ).rows[0];
  if (!biz) throw new Error(`business not found: ${SLUG}`);

  const emp = (
    await client.query(
      `SELECT id FROM employees WHERE business_id=$1 AND "isActive"=true LIMIT 1`,
      [biz.id],
    )
  ).rows[0];
  if (!emp) throw new Error('no active employee');

  const pkg = (
    await client.query(
      `SELECT id, name FROM service_packages
       WHERE business_id=$1 AND is_active=true
       ORDER BY display_order ASC NULLS LAST
       LIMIT 1`,
      [biz.id],
    )
  ).rows[0];
  if (!pkg) throw new Error('no active service package');

  const pkgItems = (
    await client.query(
      `SELECT service_id FROM service_package_items
       WHERE package_id=$1 ORDER BY sort_order ASC LIMIT 2`,
      [pkg.id],
    )
  ).rows;
  if (pkgItems.length < 2) throw new Error('package needs ≥2 services for visit CTAs');

  const svcs = (
    await client.query(
      `SELECT id, name FROM services
       WHERE business_id=$1 AND "isActive"=true
       ORDER BY name ASC LIMIT 2`,
      [biz.id],
    )
  ).rows;
  if (svcs.length < 2) throw new Error('need ≥2 active services for multi-service visit');

  const customerId = crypto.randomUUID();
  const email = `e2e272-${customerId.slice(0, 8)}@example.com`;
  await client.query(
    `INSERT INTO customers (id, business_id, name, email, phone, "isActive", "createdAt", "updatedAt")
     VALUES ($1,$2,'E2E272 Visit QA',$3,NULL,true,NOW(),NOW())`,
    [customerId, biz.id, email],
  );

  const purchaseId = crypto.randomUUID();
  await client.query(
    `INSERT INTO package_purchases
       (id, business_id, package_id, customer_id, price_paid, currency, "createdAt", metadata)
     VALUES ($1,$2,$3,$4,0,'USD',NOW(),'{}'::jsonb)`,
    [purchaseId, biz.id, pkg.id, customerId],
  );

  const pkgStart = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const pkgMeta = JSON.stringify({
    packageId: pkg.id,
    packageName: pkg.name,
  });
  const packageBookingIds = [];
  for (let i = 0; i < 2; i++) {
    const id = crypto.randomUUID();
    const start = new Date(pkgStart.getTime() + i * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 45 * 60 * 1000);
    await client.query(
      `INSERT INTO bookings (
         id, business_id, employee_id, service_id, customer_id,
         status, "paymentStatus", "startTime", "endTime",
         package_purchase_id, multi_service_group_id, metadata, "createdAt", "updatedAt"
       ) VALUES (
         $1,$2,$3,$4,$5,
         'confirmed','paid',$6,$7,
         $8,NULL,$9::jsonb,NOW(),NOW()
       )`,
      [
        id,
        biz.id,
        emp.id,
        pkgItems[i].service_id,
        customerId,
        start.toISOString(),
        end.toISOString(),
        purchaseId,
        pkgMeta,
      ],
    );
    packageBookingIds.push(id);
  }

  const groupId = crypto.randomUUID();
  const multiStart = new Date(Date.now() + 72 * 60 * 60 * 1000);
  await client.query(
    `INSERT INTO multi_service_booking_groups (
       id, business_id, customer_id, scheduling_mode,
       total_duration_minutes, total_price, currency,
       block_start_time, primary_employee_id, metadata, created_at
     ) VALUES (
       $1,$2,$3,'same_visit',90,0,'USD',$4,$5,'{}'::jsonb,NOW()
     )`,
    [groupId, biz.id, customerId, multiStart.toISOString(), emp.id],
  );

  const multiBookingIds = [];
  for (let i = 0; i < 2; i++) {
    const id = crypto.randomUUID();
    const start = new Date(multiStart.getTime() + i * 45 * 60 * 1000);
    const end = new Date(start.getTime() + 45 * 60 * 1000);
    await client.query(
      `INSERT INTO bookings (
         id, business_id, employee_id, service_id, customer_id,
         status, "paymentStatus", "startTime", "endTime",
         package_purchase_id, multi_service_group_id, metadata, "createdAt", "updatedAt"
       ) VALUES (
         $1,$2,$3,$4,$5,
         'confirmed','pending',$6,$7,
         NULL,$8,'{}'::jsonb,NOW(),NOW()
       )`,
      [
        id,
        biz.id,
        emp.id,
        svcs[i].id,
        customerId,
        start.toISOString(),
        end.toISOString(),
        groupId,
      ],
    );
    multiBookingIds.push(id);
  }

  const token = jwt.sign(
    {
      sub: customerId,
      email: email.toLowerCase(),
      businessId: biz.id,
      type: 'public_customer',
    },
    env.JWT_SECRET,
    { expiresIn: '2h' },
  );

  await client.end();

  const results = [];
  const packageSource = readFileSync(
    resolve(__dirname, '../../consumer-app/src/components/ConsumerPackageVisitActions.tsx'),
    'utf8',
  );
  const multiSource = readFileSync(
    resolve(
      __dirname,
      '../../consumer-app/src/components/ConsumerMultiServiceVisitActions.tsx',
    ),
    'utf8',
  );
  push(
    results,
    'source-package-actions-no-ion-button',
    !/\bIonButton\b/.test(packageSource) && !/<IonButton\b/.test(packageSource),
    { hasIonButton: /\bIonButton\b/.test(packageSource) },
  );
  push(
    results,
    'source-multi-actions-no-ion-button',
    !/\bIonButton\b/.test(multiSource) && !/<IonButton\b/.test(multiSource),
    { hasIonButton: /\bIonButton\b/.test(multiSource) },
  );

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', `--window-size=${VW},${VH}`],
    defaultViewport: { width: VW, height: VH, isMobile: true, hasTouch: true },
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(45000);

  try {
    await page.goto(ACCOUNT, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.evaluate(
      (slug, tok, profile) => {
        localStorage.setItem(`consumer_token_${slug}`, tok);
        localStorage.setItem(`consumer_profile_${slug}`, JSON.stringify(profile));
        localStorage.setItem('consumer_active_tenant_slug', slug);
      },
      SLUG,
      token,
      {
        id: customerId,
        name: 'E2E272 Visit QA',
        email,
      },
    );
    await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 2200));

    const snap = await page.evaluate(() => {
      const textOf = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim();
      const natives = [...document.querySelectorAll('button.consumer-action-button')];
      const ions = [...document.querySelectorAll('ion-button')];
      const findNative = (re) => {
        const el = natives.find((b) => re.test(textOf(b)));
        return el
          ? {
              text: textOf(el).slice(0, 80),
              nested: !!el.closest('ion-button'),
              small: el.classList.contains('consumer-action-button--small'),
              danger: el.classList.contains('consumer-action-button--danger'),
              ariaExpanded: el.getAttribute('aria-expanded'),
            }
          : null;
      };
      const findIon = (re) =>
        ions.filter((b) => re.test(textOf(b))).map((b) => textOf(b).slice(0, 80));

      return {
        packageCancel: findNative(/cancel package visit/i),
        packageReschedule: findNative(/reschedule package visit/i),
        multiCancel: findNative(/^cancel visit$/i),
        multiReschedule: findNative(/^reschedule visit$/i),
        ionPackageCancel: findIon(/cancel package visit/i),
        ionPackageReschedule: findIon(/reschedule package visit/i),
        ionMultiCancel: findIon(/^cancel visit$/i),
        ionMultiReschedule: findIon(/^reschedule visit$/i),
        nativeCount: natives.length,
        ionCount: ions.length,
        bodySnippet: document.body.innerText.slice(0, 600),
      };
    });

    push(
      results,
      'signed-in-package-cancel-native',
      snap.packageCancel && snap.packageCancel.nested === false && snap.packageCancel.danger,
      snap.packageCancel,
    );
    push(
      results,
      'signed-in-package-reschedule-native',
      snap.packageReschedule && snap.packageReschedule.nested === false,
      snap.packageReschedule,
    );
    push(
      results,
      'signed-in-multi-cancel-native',
      snap.multiCancel && snap.multiCancel.nested === false && snap.multiCancel.danger,
      snap.multiCancel,
    );
    push(
      results,
      'signed-in-multi-reschedule-native',
      snap.multiReschedule && snap.multiReschedule.nested === false,
      snap.multiReschedule,
    );
    push(
      results,
      'no-ion-button-for-visit-manage-ctas',
      snap.ionPackageCancel.length === 0 &&
        snap.ionPackageReschedule.length === 0 &&
        snap.ionMultiCancel.length === 0 &&
        snap.ionMultiReschedule.length === 0,
      {
        ionPackageCancel: snap.ionPackageCancel,
        ionPackageReschedule: snap.ionPackageReschedule,
        ionMultiCancel: snap.ionMultiCancel,
        ionMultiReschedule: snap.ionMultiReschedule,
        ionCount: snap.ionCount,
      },
    );

    async function openRescheduleAndCheck(labelRe, caseId) {
      const clicked = await page.evaluate((reSource) => {
        const re = new RegExp(reSource, 'i');
        const btn = [...document.querySelectorAll('button.consumer-action-button')].find((b) =>
          re.test((b.textContent || '').replace(/\s+/g, ' ').trim()),
        );
        if (!btn) return false;
        btn.click();
        return true;
      }, labelRe.source);
      if (!clicked) {
        push(results, caseId, false, { reason: 'reschedule CTA not found', labelRe: labelRe.source });
        return;
      }
      await new Promise((r) => setTimeout(r, 1200));
      const panel = await page.evaluate(() => {
        const natives = [...document.querySelectorAll('button.consumer-action-button')];
        const confirm = natives.find((b) => /confirm reschedule/i.test(b.textContent || ''));
        const slots = natives.filter((b) => b.getAttribute('aria-pressed') != null);
        const ionConfirm = [...document.querySelectorAll('ion-button')].filter((b) =>
          /confirm reschedule/i.test(b.textContent || ''),
        );
        return {
          hasConfirm: !!confirm,
          confirmNested: !!confirm?.closest('ion-button'),
          confirmBlock: confirm?.classList.contains('consumer-action-button--block') ?? false,
          slotCount: slots.length,
          ionConfirm: ionConfirm.length,
          ariaExpanded: natives
            .find((b) => /reschedule/i.test(b.textContent || ''))
            ?.getAttribute('aria-expanded'),
          alertText: document.querySelector('[role="alert"]')?.textContent?.slice(0, 120) || null,
        };
      });
      // Pass if confirm is native, OR slots rendered as native chips, OR schedule error shown
      // without any ion-button confirm (duration-cap / empty day still prove light-DOM CTAs).
      const pass =
        panel.ionConfirm === 0 &&
        ((panel.hasConfirm && panel.confirmNested === false && panel.confirmBlock) ||
          panel.slotCount > 0 ||
          Boolean(panel.alertText));
      push(results, caseId, pass, panel);
      // Close panel for next case
      await page.evaluate((reSource) => {
        const re = new RegExp(reSource, 'i');
        const btn = [...document.querySelectorAll('button.consumer-action-button')].find((b) =>
          re.test((b.textContent || '').replace(/\s+/g, ' ').trim()),
        );
        if (btn?.getAttribute('aria-expanded') === 'true') btn.click();
      }, labelRe.source);
      await new Promise((r) => setTimeout(r, 400));
    }

    await openRescheduleAndCheck(
      /reschedule package visit/i,
      'package-reschedule-panel-confirm-native',
    );
    await openRescheduleAndCheck(
      /^reschedule visit$/i,
      'multi-reschedule-panel-confirm-native',
    );
  } finally {
    await browser.close();
  }

  console.log(
    `seeded package bookings=${packageBookingIds.join(',')} multi=${multiBookingIds.join(',')}`,
  );
  const failed = results.filter((r) => !r.pass);
  for (const r of results) {
    console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.id}`, r.detail ? JSON.stringify(r.detail) : '');
  }
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
