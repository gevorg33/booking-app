/**
 * Manual live QA for e2e-bug.4 — primary CTAs expose native button/link roles
 * (not IonButton/IonItem shadow hosts reported as generic).
 *
 * Run: node scripts/qa-e2e-bug-4.mjs
 */
import puppeteer from 'puppeteer-core';

const CHROME =
  process.env.CHROME_PATH ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SLUG = process.env.SALON_SLUG || 'gevgas-operations-7c299253';
const BASE = process.env.CONSUMER_BASE || 'http://127.0.0.1:5174';
const ACCOUNT = `${BASE}/s/${SLUG}/account`;
const SERVICES = `${BASE}/s/${SLUG}/services`;
const PROS = `${BASE}/s/${SLUG}/professionals`;
const HOME = `${BASE}/s/${SLUG}/home`;
const MISSING = `${BASE}/s/not-a-real-salon-xyz-e2e4/home`;
const VW = 390;
const VH = 844;

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', `--window-size=${VW},${VH}`],
    defaultViewport: { width: VW, height: VH },
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(45000);
  const results = [];

  try {
    await page.goto(ACCOUNT, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 700));
    const accountSnap = await page.evaluate(() => {
      const btns = [...document.querySelectorAll('button.consumer-action-button')];
      const signIn = btns.find((b) => /sign in|google/i.test(b.textContent || ''));
      return {
        nativeCount: btns.length,
        signInText: signIn
          ? (signIn.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80)
          : null,
        nestedInIonButton: btns.filter((b) => b.closest('ion-button')).length,
      };
    });
    results.push({
      id: 'account-sign-in-native-button',
      pass: !!accountSnap.signInText && accountSnap.nestedInIonButton === 0,
      detail: accountSnap,
    });

    await page.goto(HOME, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 900));
    const homeSnap = await page.evaluate(() => {
      const labels = [/book an appointment/i, /salon profile/i, /my account/i];
      const btns = [...document.querySelectorAll('button.consumer-action-button')];
      const matched = labels.map((re) => {
        const b = btns.find((el) => re.test(el.textContent || ''));
        return b
          ? {
              text: (b.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40),
              nested: !!b.closest('ion-button'),
            }
          : null;
      });
      const ionPrimary = [...document.querySelectorAll('ion-button')].filter((el) =>
        /book an appointment|buy gift card|salon profile|my account|book to redeem/i.test(
          el.textContent || '',
        ),
      );
      return {
        matched,
        ionPrimaryLeft: ionPrimary.map((el) =>
          (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40),
        ),
      };
    });
    results.push({
      id: 'home-primary-ctas-native-buttons',
      pass:
        homeSnap.matched.every((m) => m && m.nested === false) &&
        homeSnap.ionPrimaryLeft.length === 0,
      detail: homeSnap,
    });

    await page.goto(SERVICES, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 1000));
    // Multi-select toggles via ion-item onClick (checkbox alone may not fire React path).
    await page.evaluate(() => {
      const items = [...document.querySelectorAll('ion-item')];
      const target =
        items.find((el) =>
          /Swedish massage|Face Pilling|Neck Massage/i.test(el.textContent || ''),
        ) || items[0];
      target?.click();
    });
    await new Promise((r) => setTimeout(r, 900));
    const servicesSnap = await page.evaluate(() => {
      const fab = document.querySelector('button.consumer-fixed-action-bar__button');
      return {
        hasFixedButton: !!fab,
        label: fab
          ? (fab.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80)
          : null,
        nestedInIonButton: !!fab?.closest('ion-button'),
        disabled: fab ? !!fab.disabled : null,
        checkedCount: [...document.querySelectorAll('ion-checkbox.checkbox-checked')].length,
      };
    });
    results.push({
      id: 'services-continue-native-fixed-bar',
      pass: servicesSnap.hasFixedButton === true && servicesSnap.nestedInIonButton === false,
      detail: servicesSnap,
    });
    results.push({
      id: 'no-ion-button-for-fixed-continue',
      pass: !servicesSnap.hasFixedButton || servicesSnap.nestedInIonButton === false,
      detail: { nestedInIonButton: servicesSnap.nestedInIonButton },
    });

    await page.goto(PROS, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 900));
    const prosSnap = await page.evaluate(() => {
      const link = document.querySelector('a.consumer-provider-list__profile-link');
      const anyBtn = document.querySelector(
        'button.consumer-provider-list__row-button[type="button"]',
      );
      return {
        profileHref: link?.getAttribute('href') || null,
        profileInIonItem: !!link?.closest('ion-item'),
        profileName: link
          ? (link.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60)
          : null,
        anySpecialist: anyBtn
          ? (anyBtn.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60)
          : null,
        anyInIonItem: !!anyBtn?.closest('ion-item'),
      };
    });
    results.push({
      id: 'professionals-profile-link-light-dom',
      pass: !!prosSnap.profileHref && prosSnap.profileInIonItem === false,
      detail: prosSnap,
    });
    results.push({
      id: 'professionals-any-specialist-button',
      pass: !!prosSnap.anySpecialist && prosSnap.anyInIonItem === false,
      detail: {
        anySpecialist: prosSnap.anySpecialist,
        anyInIonItem: prosSnap.anyInIonItem,
      },
    });

    await page.goto(HOME, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 900));
    const fabHandle = await page.$('button.consumer-ai-fab');
    if (fabHandle) {
      const box = await fabHandle.boundingBox();
      if (box) {
        const x = box.x + box.width / 2;
        const y = box.y + box.height / 2;
        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.mouse.up();
      }
    }
    await new Promise((r) => setTimeout(r, 900));
    if (await page.$('button.consumer-ai-fab')) {
      await page.focus('button.consumer-ai-fab');
      await page.keyboard.press('Enter');
      await new Promise((r) => setTimeout(r, 800));
    }
    const assistantSnap = await page.evaluate(() => {
      const send = [...document.querySelectorAll('button.consumer-action-button')].find((b) =>
        /send/i.test(b.textContent || ''),
      );
      const sendAria = [...document.querySelectorAll('button')].find((b) =>
        /send/i.test(b.getAttribute('aria-label') || ''),
      );
      const btn = send || sendAria;
      return {
        hasSend: !!btn,
        sendText: btn
          ? (btn.textContent || btn.getAttribute('aria-label') || '')
              .replace(/\s+/g, ' ')
              .trim()
              .slice(0, 40)
          : null,
        nestedInIonButton: !!btn?.closest('ion-button'),
        fabGone: !document.querySelector('button.consumer-ai-fab'),
        hasComposer: !!document.querySelector('textarea, ion-textarea, input[type="text"]'),
      };
    });
    results.push({
      id: 'assistant-send-native-button',
      pass: assistantSnap.hasSend === true && assistantSnap.nestedInIonButton === false,
      detail: assistantSnap,
    });

    await page.goto(MISSING, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 900));
    const missingSnap = await page.evaluate(() => {
      const back = [...document.querySelectorAll('button.consumer-action-button')].find((b) =>
        /find a salon/i.test(b.textContent || ''),
      );
      return {
        alert: document.querySelector('[role="alert"]')?.textContent || null,
        backText: back
          ? (back.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40)
          : null,
        ionBack: [...document.querySelectorAll('ion-button')].some((el) =>
          /find a salon/i.test(el.textContent || ''),
        ),
      };
    });
    results.push({
      id: 'salon-not-found-native-back',
      pass: !!missingSnap.backText && missingSnap.ionBack === false,
      detail: missingSnap,
    });
  } catch (err) {
    results.push({
      id: 'runtime',
      pass: false,
      detail: { error: String(err.message || err).slice(0, 240) },
    });
  } finally {
    await browser.close();
  }

  let failed = 0;
  console.log(`e2e-bug.4 QA → ${ACCOUNT}\n`);
  for (const row of results) {
    if (row.pass) {
      console.log(`PASS ${row.id}`, JSON.stringify(row.detail).slice(0, 220));
    } else {
      failed += 1;
      console.log(`FAIL ${row.id}`, JSON.stringify(row.detail).slice(0, 320));
    }
  }
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
}

main();
