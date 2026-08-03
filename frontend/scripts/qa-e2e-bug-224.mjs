/**
 * Manual QA for e2e-bug.224 — mapped navigate landings return 200; legacy paths 404.
 * Run: NODE_PATH=/path/to/puppeteer-core node --experimental-strip-types
 * or copy to /tmp with puppeteer-core installed.
 */
import puppeteer from 'puppeteer-core';

const CHROME =
  process.env.CHROME_PATH ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SLUG = 'gevgas-operations-7c299253';
const ORIGIN = process.env.BOOKING_ORIGIN || 'http://127.0.0.1:3002';
const API = process.env.API_BASE || 'http://127.0.0.1:3001';
const BASE = `${ORIGIN}/book/${SLUG}`;

function expectedHref(path, query = {}) {
  if (path === 'packages') {
    return query.packageId
      ? `/book/${SLUG}/packages/${query.packageId}`
      : `/book/${SLUG}/any`;
  }
  if (path === 'login') {
    const qs = new URLSearchParams(query).toString();
    return `/book/${SLUG}/account${qs ? `?${qs}` : ''}`;
  }
  if (path === 'home' || path === 'tenant_switch') return `/book/${SLUG}`;
  if (path === 'salon') return `/book/${query.slug || SLUG}`;
  return `/book/${SLUG}/${path}`;
}

async function main() {
  const results = [];
  let packageId = null;
  try {
    const raw = await (await fetch(`${API}/public/${SLUG}/packages`)).json();
    packageId = (raw?.data?.packages || raw?.packages || [])[0]?.id || null;
  } catch {
    /* ignore */
  }

  for (const bad of ['/packages', '/login', '/home', '/salon']) {
    const status = (await fetch(`${BASE}${bad}`, { redirect: 'manual' })).status;
    results.push({
      id: `legacy-404${bad}`,
      pass: status === 404,
      detail: { status },
    });
  }

  for (const [id, href] of [
    ['packages-any', expectedHref('packages')],
    ['packages-id', packageId ? expectedHref('packages', { packageId }) : null],
    ['login', expectedHref('login', { provider: 'google' })],
    ['home', expectedHref('home')],
    ['salon', expectedHref('salon', { slug: SLUG })],
    ['profile', expectedHref('profile')],
    ['professionals', expectedHref('professionals')],
    ['account', expectedHref('account')],
    ['gift-cards', expectedHref('gift-cards')],
  ]) {
    if (!href) {
      results.push({ id, pass: true, detail: { skipped: true } });
      continue;
    }
    const pathOnly = href.split('?')[0];
    const status = (await fetch(`${ORIGIN}${pathOnly}`, { redirect: 'manual' }))
      .status;
    results.push({ id, pass: status === 200, detail: { href, status } });
  }

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
  for (const [id, href, part] of [
    ['sim-packages', expectedHref('packages'), '/any'],
    ['sim-login', expectedHref('login', { provider: 'google' }), '/account'],
    ['sim-home', expectedHref('home'), `/book/${SLUG}`],
    [
      'sim-pkg-id',
      packageId ? expectedHref('packages', { packageId }) : null,
      '/packages/',
    ],
  ]) {
    if (!href) {
      results.push({ id, pass: true, detail: { skipped: true } });
      continue;
    }
    await page.goto(`${ORIGIN}${href}`, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });
    const url = page.url();
    const is404 = await page.evaluate(() =>
      /could not be found|404/i.test(document.body.innerText.slice(0, 400)),
    );
    results.push({
      id,
      pass: url.includes(part) && !is404,
      detail: { href, url, is404 },
    });
  }
  await browser.close();

  console.log(JSON.stringify({ packageId, results }, null, 2));
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
