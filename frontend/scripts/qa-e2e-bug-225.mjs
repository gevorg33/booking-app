/**
 * Manual QA for e2e-bug.225 — auto-navigate on booking-verb + checkout.
 * Uses `public-assistant:run` (same as suggestion chips) to open+submit.
 */
import puppeteer from 'puppeteer-core';

const CHROME =
  process.env.CHROME_PATH ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SLUG = 'gevgas-operations-7c299253';
const BASE =
  process.env.BOOKING_BASE || `http://127.0.0.1:3002/book/${SLUG}`;

async function runViaEvent(page, prompt) {
  await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 });
  await page.evaluate(() => {
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith('public-ai-position-')) localStorage.removeItem(k);
    }
  });
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForSelector('[data-testid="public-assistant-fab"]', {
    timeout: 20000,
  });

  const waitResp = page.waitForResponse(
    (r) => r.url().includes('/assistant') && r.request().method() === 'POST',
    { timeout: 120000 },
  );
  await page.evaluate((p) => {
    window.dispatchEvent(
      new CustomEvent('public-assistant:run', {
        detail: { prompt: p, autoSubmit: true },
      }),
    );
    window.dispatchEvent(new CustomEvent('public-assistant:open'));
  }, prompt);
  const resp = await waitResp;
  const raw = await resp.json();
  return raw.data || raw;
}

async function main() {
  const results = [];
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox'],
    defaultViewport: {
      width: 390,
      height: 844,
      isMobile: true,
      hasTouch: true,
    },
  });
  const page = await browser.newPage();

  {
    const data = await runViaEvent(
      page,
      'Please book the nearest Swedish massage',
    );
    await page
      .waitForFunction(() => location.pathname.includes('/checkout'), {
        timeout: 25000,
      })
      .catch(() => null);
    const urlAfter = page.url();
    results.push({
      id: 'auto-nav-please-book',
      pass:
        data.success === true &&
        data.navigate?.path === 'checkout' &&
        /\/checkout/.test(urlAfter),
      detail: {
        success: data.success,
        action: data.action,
        navigate: data.navigate,
        urlAfter,
      },
    });
  }

  {
    const data = await runViaEvent(
      page,
      'What times are available for Swedish massage tomorrow?',
    );
    await new Promise((r) => setTimeout(r, 3500));
    const urlAfter = page.url();
    results.push({
      id: 'no-auto-nav-availability',
      pass: !/\/checkout/.test(urlAfter),
      detail: {
        success: data.success,
        action: data.action,
        navigate: data.navigate,
        urlAfter,
      },
    });
  }

  await browser.close();
  console.log(JSON.stringify({ results }, null, 2));
  const failed = results.filter((r) => !r.pass);
  if (failed.length) {
    console.error(`FAIL ${failed.length}/${results.length}`);
    process.exit(1);
  }
  console.log(`PASS ${results.length}/${results.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
