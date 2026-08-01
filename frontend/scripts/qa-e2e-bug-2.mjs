/**
 * Manual live QA for e2e-bug.2 — salon-tab-active on cold vs warm loads.
 *
 * Consumer app: http://127.0.0.1:5174/s/gevgas-operations-7c299253/home
 * FAIL if body lacks salon-tab-active on hard load (CTA/tab offset broken).
 */
import puppeteer from 'puppeteer-core';

const CHROME =
  process.env.CHROME_PATH ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SLUG = process.env.SALON_SLUG || 'gevgas-operations-7c299253';
const BASE = process.env.CONSUMER_BASE || 'http://127.0.0.1:5174';
const HOME = `${BASE}/s/${SLUG}/home`;
const SERVICES = `${BASE}/s/${SLUG}/services`;
const ACCOUNT = `${BASE}/s/${SLUG}/account`;
const VW = 390;
const VH = 844;

async function snapshot(page) {
  return page.evaluate(() => {
    const bodyHas = document.body.classList.contains('salon-tab-active');
    const tabBar = document.querySelector('.salon-bottom-tab-bar');
    const fab =
      document.querySelector('.consumer-ai-fab') ||
      document.querySelector('[aria-label*="assistant" i]') ||
      document.querySelector('[aria-label*="Ask" i]');
    const tabRect = tabBar?.getBoundingClientRect();
    const fabRect = fab?.getBoundingClientRect();
    const bookCta = [...document.querySelectorAll('a,button,ion-button')].find(
      (el) => /book an appointment|ամրագր|записаться/i.test(el.textContent || ''),
    );
    const bookRect = bookCta?.getBoundingClientRect();
    return {
      bodyHasSalonTabActive: bodyHas,
      tabBar: tabBar
        ? {
            visible: tabRect.height > 0 && tabRect.width > 0,
            top: tabRect.top,
            bottom: tabRect.bottom,
            height: tabRect.height,
          }
        : null,
      fab: fab
        ? {
            top: fabRect.top,
            bottom: fabRect.bottom,
            height: fabRect.height,
          }
        : null,
      bookCta: bookCta
        ? {
            text: (bookCta.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
            top: bookRect.top,
            bottom: bookRect.bottom,
          }
        : null,
      viewport: { w: window.innerWidth, h: window.innerHeight },
    };
  });
}

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
    // —— cold hard load home ——
    await page.goto(HOME, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 800));
    let snap = await snapshot(page);
    results.push({
      id: 'cold-hard-load-home',
      pass: snap.bodyHasSalonTabActive === true,
      detail: snap,
    });

    results.push({
      id: 'tab-bar-visible-cold',
      pass: !!(
        snap.tabBar?.visible &&
        snap.tabBar.top < VH &&
        snap.tabBar.bottom <= VH + 2
      ),
      detail: { tabBar: snap.tabBar },
    });

    if (snap.fab && snap.tabBar) {
      const fabAboveTab = snap.fab.bottom <= snap.tabBar.top + 2;
      results.push({
        id: 'ai-fab-not-under-tab-bar',
        pass: fabAboveTab,
        detail: { fab: snap.fab, tabBar: snap.tabBar },
      });
    } else {
      results.push({
        id: 'ai-fab-not-under-tab-bar',
        pass: true,
        detail: { skipped: !snap.fab ? 'no FAB' : 'no tab bar', snap },
      });
    }

    // —— cold hard load services ——
    await page.goto(SERVICES, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 800));
    snap = await snapshot(page);
    results.push({
      id: 'cold-hard-load-services',
      pass: snap.bodyHasSalonTabActive === true,
      detail: {
        bodyHasSalonTabActive: snap.bodyHasSalonTabActive,
        tabBar: snap.tabBar,
      },
    });

    // —— warm: account then home ——
    await page.goto(ACCOUNT, { waitUntil: 'networkidle2', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 600));
    const onAccount = await snapshot(page);
    // Click Home tab if present
    const homeTab = await page.evaluate(() => {
      const btns = [...document.querySelectorAll('.salon-tab-btn, button, a')];
      const el = btns.find((b) =>
        /home|գլխավոր|главн/i.test(
          (b.getAttribute('aria-label') || '') + (b.textContent || ''),
        ),
      );
      if (!el) return false;
      el.click();
      return true;
    });
    if (!homeTab) {
      await page.goto(HOME, { waitUntil: 'networkidle2', timeout: 60000 });
    }
    await new Promise((r) => setTimeout(r, 900));
    const onHomeWarm = await snapshot(page);
    results.push({
      id: 'warm-tab-switch-account-then-home',
      pass:
        onHomeWarm.bodyHasSalonTabActive === true &&
        !!onHomeWarm.tabBar?.visible,
      detail: {
        onAccountActive: onAccount.bodyHasSalonTabActive,
        onHomeActive: onHomeWarm.bodyHasSalonTabActive,
        homeTabClicked: homeTab,
      },
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
  console.log(`e2e-bug.2 QA → ${HOME}\n`);
  for (const row of results) {
    if (row.pass) {
      console.log(`PASS ${row.id}`, JSON.stringify(row.detail).slice(0, 200));
    } else {
      failed += 1;
      console.log(`FAIL ${row.id}`, JSON.stringify(row.detail).slice(0, 280));
    }
  }
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
}

main();
