/**
 * Guru live QA for e2e-bug.340 — an apostrophe-possessive catalog name (e.g.
 * "Men's cut") must not fragment into a lone single-character "s" token that
 * spuriously matches almost any prompt word in `matchServiceInPrompt`'s
 * clarify-follow-up fallback, silently pinning unrelated prompts to it.
 *
 * Run: node frontend/scripts/qa-e2e-bug-340.mjs
 * Requires: API on :3001, salon `gevgas-operations-7c299253` catalog with
 * hairstyle / Men's cut / Women's cut services.
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(__dirname, '../../backend');
const SLUG = process.env.SALON_SLUG || 'gevgas-operations-7c299253';
const API = process.env.API_BASE || 'http://127.0.0.1:3001';

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

function request(method, path, body) {
  return new Promise((resolvePromise, reject) => {
    const data = body != null ? JSON.stringify(body) : null;
    const url = new URL(path, API);
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port || 3001,
        path: url.pathname + url.search,
        method,
        headers: data
          ? {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(data),
            }
          : {},
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
    if (data) req.write(data);
    req.end();
  });
}

function unwrap(body) {
  return body?.data ?? body;
}

async function main() {
  loadEnv();
  console.log(`e2e-bug.340 live QA → ${API} slug=${SLUG}`);

  let pass = 0;
  let fail = 0;
  const check = (id, condition, detail) => {
    if (condition) {
      pass += 1;
      console.log(`  PASS  ${id}`);
    } else {
      fail += 1;
      console.log(`  FAIL  ${id} — ${detail}`);
    }
  };

  async function ask(prompt, locale = 'en') {
    const res = await request('POST', `/public/${SLUG}/assistant`, {
      prompt,
      assistantMode: 'act',
      locale,
      context: { slug: SLUG, locale },
    });
    const data = unwrap(res.body);
    return {
      action: data?.action ?? data?.intent?.action ?? null,
      summary: String(data?.summary ?? data?.message ?? ''),
    };
  }

  const isSpuriousSinglePin = (summary) =>
    /^Our men.?s cut service types:/i.test(summary.trim());

  // Exact reported repro: must NOT pin to Men's cut anymore (single-row header).
  {
    const r = await ask('list style services');
    check(
      'exact-repro-not-mens-cut',
      !isSpuriousSinglePin(r.summary),
      `got summary=${r.summary}`,
    );
  }

  // Sibling false-positive probes with other "s"-containing short prompts.
  {
    const r = await ask('does this service exist');
    check(
      'unrelated-does-this-service-exist-not-mens-cut',
      !isSpuriousSinglePin(r.summary),
      `got summary=${r.summary}`,
    );
  }
  {
    const r = await ask('what services are these');
    check(
      'unrelated-what-services-are-these-not-mens-cut',
      !isSpuriousSinglePin(r.summary),
      `got summary=${r.summary}`,
    );
  }

  // Legit possessive-name prompts must still resolve correctly.
  {
    const r = await ask("Book men's cut");
    check(
      'legit-mens-cut-still-resolves',
      /men.?s cut/i.test(r.summary) ||
        r.action === 'book_appointment' ||
        r.action === 'check_availability',
      `got action=${r.action} summary=${r.summary}`,
    );
  }

  // Established-working synonym regressions must remain correct.
  {
    const r = await ask('show me trim');
    check(
      'regression-show-me-trim-resolves-hairstyle',
      /hairstyle/i.test(r.summary),
      `got summary=${r.summary}`,
    );
  }
  {
    const r = await ask('show me a trim');
    check(
      'regression-show-me-a-trim-resolves-hairstyle',
      /hairstyle/i.test(r.summary),
      `got summary=${r.summary}`,
    );
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
