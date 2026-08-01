/**
 * Manual QA harness for e2e-bug.220 — mobile FAB vs sticky bottom CTAs.
 * Run: node scripts/qa-e2e-bug-220.mjs
 */
import puppeteer from 'puppeteer-core';

const CHROME =
  process.env.CHROME_PATH ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE =
  process.env.BOOKING_BASE ||
  'http://127.0.0.1:3002/book/gevgas-operations-7c299253';
const VW = 390;
const VH = 844;
const GAP = 12; // PUBLIC_STICKY_CTA_STACK_GAP_PX

function rectsOverlap(a, b, pad = 0) {
  return !(
    a.right + pad <= b.left ||
    a.left - pad >= b.right ||
    a.bottom + pad <= b.top ||
    a.top - pad >= b.bottom
  );
}

async function measure(page) {
  return page.evaluate(() => {
    const fab = document.querySelector('[data-testid="public-assistant-fab"]');
    const ctas = [...document.querySelectorAll('[data-public-sticky-cta]')];
    const fabRect = fab?.getBoundingClientRect();
    const ctaRects = ctas
      .map((el) => {
        const r = el.getBoundingClientRect();
        return {
          testId: el.getAttribute('data-testid'),
          height: r.height,
          top: r.top,
          bottom: r.bottom,
          left: r.left,
          right: r.right,
          text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80),
        };
      })
      .filter((r) => r.height > 0);
    return {
      fab: fab
        ? {
            ariaLabel: fab.getAttribute('aria-label'),
            title: fab.getAttribute('title'),
            top: fabRect.top,
            bottom: fabRect.bottom,
            left: fabRect.left,
            right: fabRect.right,
            height: fabRect.height,
            width: fabRect.width,
          }
        : null,
      ctas: ctaRects,
      viewport: { w: window.innerWidth, h: window.innerHeight },
    };
  });
}

function assertCase(name, data) {
  const failures = [];
  if (!data.fab) {
    failures.push('FAB missing');
    return { name, pass: false, failures, data };
  }
  if (!data.fab.ariaLabel || !/assistant/i.test(data.fab.ariaLabel)) {
    failures.push(
      `aria-label missing or weak: ${JSON.stringify(data.fab.ariaLabel)}`,
    );
  }
  if (data.ctas.length === 0) {
    failures.push('no visible sticky CTA (cannot verify clearance)');
  }
  for (const cta of data.ctas) {
    const fabBox = data.fab;
    const ctaBox = cta;
    if (rectsOverlap(fabBox, ctaBox)) {
      failures.push(
        `FAB overlaps sticky CTA (${cta.testId || 'cta'} h=${cta.height}): fab.top=${fabBox.top.toFixed(1)} cta.top=${ctaBox.top.toFixed(1)}`,
      );
    }
    // FAB should sit above CTA with at least a small gap when both in bottom-right
    if (fabBox.bottom > ctaBox.top - 2) {
      // only fail if horizontal overlap region exists
      const horizOverlap = !(fabBox.right <= ctaBox.left || fabBox.left >= ctaBox.right);
      if (horizOverlap) {
        failures.push(
          `FAB bottom (${fabBox.bottom.toFixed(1)}) not above CTA top (${ctaBox.top.toFixed(1)}) with clearance`,
        );
      }
    }
    const clearance = ctaBox.top - fabBox.bottom;
    if (clearance < GAP - 2 && !(fabBox.right <= ctaBox.left || fabBox.left >= ctaBox.right)) {
      failures.push(
        `clearance ${clearance.toFixed(1)}px < ${GAP}px gap`,
      );
    }
  }
  // Deduplicate
  const uniq = [...new Set(failures)];
  return { name, pass: uniq.length === 0, failures: uniq, data };
}

async function dismissNoise(page) {
  // Cookie / consent banners if any
  for (const sel of [
    'button:has-text("Accept")',
    '[data-testid="cookie-accept"]',
    'button[aria-label*="Close"]',
  ]) {
    try {
      const el = await page.$(sel);
      if (el) await el.click().catch(() => {});
    } catch {
      /* ignore */
    }
  }
  await page.evaluate(() => {
    localStorage.removeItem(
      `public-ai-position-${location.pathname.split('/')[2] || 'gevgas-operations-7c299253'}`,
    );
    // clear any slug-keyed position
    for (const k of Object.keys(localStorage)) {
      if (k.startsWith('public-ai-position-')) localStorage.removeItem(k);
    }
  });
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: [`--window-size=${VW},${VH}`, '--no-sandbox'],
    defaultViewport: { width: VW, height: VH, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  });
  const page = await browser.newPage();
  const results = [];

  // --- Case 1: gift-cards with sticky checkout bar ---
  {
    const name = 'gift-cards sticky Continue to checkout';
    await page.goto(`${BASE}/gift-cards`, { waitUntil: 'networkidle2', timeout: 60000 });
    await dismissNoise(page);
    await page.reload({ waitUntil: 'networkidle2' });
    // Try to select first gift amount / card so sticky CTA appears
    await page.waitForSelector('[data-testid="public-assistant-fab"]', { timeout: 15000 });
    // Click first selectable gift option if present
    const clicked = await page.evaluate(() => {
      const candidates = [
        ...document.querySelectorAll('button, [role="button"], a'),
      ].filter((el) => {
        const t = (el.textContent || '').toLowerCase();
        return (
          /\$\d+|select|choose|buy|amount/i.test(t) &&
          el.getBoundingClientRect().height > 20
        );
      });
      if (candidates[0]) {
        candidates[0].click();
        return candidates[0].textContent?.trim().slice(0, 40) || 'clicked';
      }
      // click first card-like tile
      const tile = document.querySelector(
        '[data-testid*="gift"], .gift-card, [class*="Gift"] button',
      );
      if (tile) {
        tile.click();
        return 'tile';
      }
      return null;
    });
    await new Promise((r) => setTimeout(r, 800));
    // If still no sticky, look for Continue button area
    let data = await measure(page);
    if (data.ctas.length === 0) {
      // Force-select via known gift catalog UI
      await page.evaluate(() => {
        const buttons = [...document.querySelectorAll('button')];
        const amount = buttons.find((b) => /\$\s*\d+/.test(b.textContent || ''));
        amount?.click();
      });
      await new Promise((r) => setTimeout(r, 600));
      data = await measure(page);
    }
    results.push({ ...assertCase(name, data), clicked });
  }

  // --- Case 2: professionals / FixedActionBar Select service ---
  {
    const name = 'professionals Select service bar';
    await page.goto(`${BASE}/professionals`, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });
    await dismissNoise(page);
    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForSelector('[data-testid="public-assistant-fab"]', {
      timeout: 15000,
    });
    // Select a provider then expect sticky CTA, or home may show Select service
    await page.evaluate(() => {
      const cards = [
        ...document.querySelectorAll('a, button, [role="button"]'),
      ].filter((el) => el.getBoundingClientRect().height > 40);
      // Prefer employee/provider links
      const provider = cards.find((el) =>
        /provider|\/providers\//i.test(el.getAttribute('href') || ''),
      );
      (provider || cards[0])?.click();
    });
    await new Promise((r) => setTimeout(r, 1000));
    let data = await measure(page);
    if (data.ctas.length === 0) {
      // Try home page with service selection flow
      await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 });
      await dismissNoise(page);
      await page.reload({ waitUntil: 'networkidle2' });
      await page.waitForSelector('[data-testid="public-assistant-fab"]', {
        timeout: 15000,
      });
      await page.evaluate(() => {
        const svc = [...document.querySelectorAll('button, a, [role="button"]')].find(
          (el) =>
            /massage|hair|service|swedish|select/i.test(el.textContent || '') &&
            el.getBoundingClientRect().height > 24,
        );
        svc?.click();
      });
      await new Promise((r) => setTimeout(r, 800));
      data = await measure(page);
    }
    results.push(assertCase(name, data));
  }

  // --- Case 3: home page — FAB present + aria-label even without sticky ---
  {
    const name = 'home — FAB aria-label discoverable (no sticky required)';
    await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 });
    await dismissNoise(page);
    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForSelector('[data-testid="public-assistant-fab"]', {
      timeout: 15000,
    });
    const data = await measure(page);
    const failures = [];
    if (!data.fab) failures.push('FAB missing');
    else if (!data.fab.ariaLabel) failures.push('aria-label missing');
    // If sticky present, also check overlap
    if (data.fab && data.ctas.length) {
      const r = assertCase(name, data);
      results.push(r);
    } else {
      results.push({ name, pass: failures.length === 0, failures, data });
    }
  }

  // --- Case 4: viewport resize (narrower phone) ---
  {
    const name = 'gift-cards @ 360×740';
    await page.setViewport({
      width: 360,
      height: 740,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    await page.goto(`${BASE}/gift-cards`, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });
    await dismissNoise(page);
    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForSelector('[data-testid="public-assistant-fab"]', {
      timeout: 15000,
    });
    await page.evaluate(() => {
      const amount = [...document.querySelectorAll('button')].find((b) =>
        /\$\s*\d+/.test(b.textContent || ''),
      );
      amount?.click();
    });
    await new Promise((r) => setTimeout(r, 800));
    results.push(assertCase(name, await measure(page)));
  }

  // --- Case 5: open assistant panel — FAB hidden, no overlap concern ---
  {
    const name = 'assistant open — FAB replaced by panel';
    await page.setViewport({
      width: VW,
      height: VH,
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 });
    await dismissNoise(page);
    await page.reload({ waitUntil: 'networkidle2' });
    const fab = await page.waitForSelector('[data-testid="public-assistant-fab"]', {
      timeout: 15000,
    });
    // Pointer press via mouse (drag handle uses pointer events)
    const box = await fab.boundingBox();
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.up();
    }
    await new Promise((r) => setTimeout(r, 500));
    const data = await page.evaluate(() => ({
      fab: !!document.querySelector('[data-testid="public-assistant-fab"]'),
      panel: !!document.querySelector('textarea, input[type="text"]'),
    }));
    results.push({
      name,
      pass: !data.fab && data.panel,
      failures: [
        ...(data.fab ? ['FAB still visible while open'] : []),
        ...(!data.panel ? ['assistant panel not open'] : []),
      ],
      data,
    });
  }

  await browser.close();

  console.log(JSON.stringify({ results }, null, 2));
  const failed = results.filter((r) => !r.pass);
  if (failed.length) {
    console.error(`\nFAIL ${failed.length}/${results.length}`);
    process.exit(1);
  }
  console.log(`\nPASS ${results.length}/${results.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
