/**
 * Manual live QA for e2e-bug.253 — Account booking-card / ConsumerBookingActions
 * CTAs must be light-DOM button.consumer-action-button (not IonButton hosts).
 *
 * Run from repo root: node frontend/scripts/qa-e2e-bug-253.mjs
 * Requires: consumer Vite on :5174, API on :3001, Postgres from backend/.env
 */
import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

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

  // Prefer a customer who already has bookings (most-recent email-only may be empty).
  const customer = (
    await client.query(
      `SELECT c.id, c.email, c.name
       FROM customers c
       INNER JOIN bookings b ON b.customer_id = c.id AND b.business_id = c.business_id
       WHERE c.business_id=$1 AND c.email IS NOT NULL AND c."isActive" = true
       GROUP BY c.id, c.email, c.name
       ORDER BY MAX(b."startTime") DESC NULLS LAST
       LIMIT 1`,
      [biz.id],
    )
  ).rows[0];
  if (!customer) throw new Error('no customer with email + bookings');

  let booking = (
    await client.query(
      `SELECT id, status, "startTime", "endTime"
       FROM bookings
       WHERE business_id=$1 AND customer_id=$2
         AND status IN ('pending','confirmed')
       ORDER BY "startTime" ASC LIMIT 1`,
      [biz.id, customer.id],
    )
  ).rows[0];

  if (!booking) {
    booking = (
      await client.query(
        `SELECT id, status, "startTime", "endTime"
         FROM bookings
         WHERE business_id=$1 AND customer_id=$2
         ORDER BY "startTime" DESC LIMIT 1`,
        [biz.id, customer.id],
      )
    ).rows[0];
  }
  if (!booking) throw new Error('no booking for customer');

  const start = new Date(Date.now() + 48 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  await client.query(
    `UPDATE bookings
     SET status='confirmed', "startTime"=$2, "endTime"=$3, "updatedAt"=NOW()
     WHERE id=$1`,
    [booking.id, start.toISOString(), end.toISOString()],
  );

  const completed = (
    await client.query(
      `SELECT id FROM bookings
       WHERE business_id=$1 AND customer_id=$2 AND id <> $3
       ORDER BY "startTime" DESC LIMIT 1`,
      [biz.id, customer.id, booking.id],
    )
  ).rows[0];
  if (completed) {
    await client.query(
      `UPDATE bookings SET status='completed', "updatedAt"=NOW() WHERE id=$1`,
      [completed.id],
    );
  }

  const token = jwt.sign(
    {
      sub: customer.id,
      email: String(customer.email).toLowerCase(),
      businessId: biz.id,
      type: 'public_customer',
    },
    env.JWT_SECRET,
    { expiresIn: '2h' },
  );

  await client.end();

  const results = [];
  const sourcePath = resolve(
    __dirname,
    '../../consumer-app/src/components/ConsumerBookingActions.tsx',
  );
  const source = readFileSync(sourcePath, 'utf8');
  push(
    results,
    'source-booking-actions-no-ion-button',
    !/\bIonButton\b/.test(source) && !/<IonButton\b/.test(source),
    { hasIonButton: /\bIonButton\b/.test(source) },
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
        id: customer.id,
        name: customer.name || 'QA Customer',
        email: customer.email,
      },
    );
    await page.reload({ waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 1800));

    const snap = await page.evaluate(() => {
      const textOf = (el) => (el.textContent || '').replace(/\s+/g, ' ').trim();
      const natives = [...document.querySelectorAll('button.consumer-action-button')];
      const ions = [...document.querySelectorAll('ion-button')];
      const findNative = (re) =>
        natives.find((b) => re.test(textOf(b)))
          ? {
              text: textOf(natives.find((b) => re.test(textOf(b)))).slice(0, 60),
              nested: !!natives.find((b) => re.test(textOf(b)))?.closest('ion-button'),
              small: natives
                .find((b) => re.test(textOf(b)))
                ?.classList.contains('consumer-action-button--small'),
            }
          : null;
      const findIon = (re) =>
        ions
          .filter((b) => re.test(textOf(b)))
          .map((b) => textOf(b).slice(0, 60));

      return {
        cancel: findNative(/cancel appointment/i),
        reschedule: findNative(/^reschedule$/i),
        rebook: findNative(/rebook/i),
        share: findNative(/share booking/i),
        review: findNative(/rate your visit/i),
        giftBuy: findNative(/buy gift card|gift card/i),
        ionCancel: findIon(/cancel appointment/i),
        ionReschedule: findIon(/^reschedule$/i),
        ionRebook: findIon(/rebook/i),
        ionShare: findIon(/share booking/i),
        ionGift: findIon(/buy gift card/i),
        nativeCount: natives.length,
        bodySnippet: document.body.innerText.slice(0, 400),
      };
    });

    push(
      results,
      'signed-in-cancel-native',
      snap.cancel && snap.cancel.nested === false,
      snap.cancel,
    );
    push(
      results,
      'signed-in-reschedule-native',
      snap.reschedule && snap.reschedule.nested === false,
      snap.reschedule,
    );
    push(
      results,
      'no-ion-button-for-booking-manage-ctas',
      snap.ionCancel.length === 0 && snap.ionReschedule.length === 0,
      { ionCancel: snap.ionCancel, ionReschedule: snap.ionReschedule },
    );

    const rebookOrShareVisible = Boolean(snap.rebook || snap.share || snap.review);
    push(
      results,
      'rebook-or-share-native-when-visible',
      !rebookOrShareVisible ||
        [
          snap.rebook,
          snap.share,
          snap.review,
        ].every((x) => !x || x.nested === false) &&
          snap.ionRebook.length === 0 &&
          snap.ionShare.length === 0,
      {
        rebook: snap.rebook,
        share: snap.share,
        review: snap.review,
        ionRebook: snap.ionRebook,
        ionShare: snap.ionShare,
      },
    );

    push(
      results,
      'gift-card-buy-native-when-visible',
      !snap.giftBuy || (snap.giftBuy.nested === false && snap.ionGift.length === 0),
      { giftBuy: snap.giftBuy, ionGift: snap.ionGift },
    );

    if (snap.reschedule) {
      await page.evaluate(() => {
        const btn = [...document.querySelectorAll('button.consumer-action-button')].find(
          (b) => /^reschedule$/i.test((b.textContent || '').replace(/\s+/g, ' ').trim()),
        );
        btn?.click();
      });
      await new Promise((r) => setTimeout(r, 700));
      const panel = await page.evaluate(() => {
        const confirm = [...document.querySelectorAll('button.consumer-action-button')].find(
          (b) => /confirm reschedule/i.test(b.textContent || ''),
        );
        const ionConfirm = [...document.querySelectorAll('ion-button')].filter((b) =>
          /confirm reschedule/i.test(b.textContent || ''),
        );
        return {
          hasConfirm: !!confirm,
          nested: !!confirm?.closest('ion-button'),
          disabled: confirm ? !!confirm.disabled : null,
          ionConfirm: ionConfirm.length,
          ariaExpanded: [...document.querySelectorAll('button.consumer-action-button')]
            .find((b) => /^reschedule$/i.test((b.textContent || '').trim()))
            ?.getAttribute('aria-expanded'),
        };
      });
      push(
        results,
        'reschedule-panel-confirm-native',
        panel.hasConfirm && panel.nested === false && panel.ionConfirm === 0,
        panel,
      );
    } else {
      push(results, 'reschedule-panel-confirm-native', false, {
        reason: 'reschedule CTA not found',
        bodySnippet: snap.bodySnippet,
      });
    }
  } finally {
    await browser.close();
  }

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
