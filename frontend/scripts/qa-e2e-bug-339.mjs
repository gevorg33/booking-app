/**
 * Guru live QA for e2e-bug.339 — HY "Ինչպես է աշխատում հիմնական էկրանի
 * վիջեթը" ("How does the home screen widget work") must route to
 * `explain_home_screen_widget`, not fall through to `booking_help`. Uses the
 * public customer assistant endpoint (this is a consumer-app feature, not a
 * dashboard/staff one).
 *
 * Run: node frontend/scripts/qa-e2e-bug-339.mjs
 * Requires: API on :3001
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
  console.log(`e2e-bug.339 live QA → ${API} slug=${SLUG}`);

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

  async function ask(prompt, locale) {
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

  // Exact reported repro.
  {
    const r = await ask('Ինչպես է աշխատում հիմնական էկրանի վիջեթը', 'hy');
    check(
      'hy-exact-repro',
      r.action === 'explain_home_screen_widget',
      `got action=${r.action} summary=${r.summary}`,
    );
  }

  // HY sibling: how to remove widget.
  {
    const r = await ask('Ինչպես հեռացնել վիջեթը', 'hy');
    check(
      'hy-how-to-remove-widget',
      r.action === 'explain_home_screen_widget',
      `got action=${r.action} summary=${r.summary}`,
    );
  }

  // EN control — must remain correct.
  {
    const r = await ask('How does the home screen widget work?', 'en');
    check('en-control', r.action === 'explain_home_screen_widget', `got action=${r.action}`);
  }

  // RU control — must remain correct.
  {
    const r = await ask('Как работает виджет на главном экране', 'ru');
    check('ru-control', r.action === 'explain_home_screen_widget', `got action=${r.action}`);
  }

  // HY regression — existing what-shows phrasing must stay correct.
  {
    const r = await ask('Ինչ է ցույց տալիս վիջեթը', 'hy');
    check(
      'hy-regression-what-shows',
      r.action === 'explain_home_screen_widget',
      `got action=${r.action}`,
    );
  }

  // Unrelated HY "how to book" — must NOT get stolen into widget explain.
  {
    const r = await ask('Ինչպես ամրագրել', 'hy');
    check(
      'hy-unrelated-how-to-book-control',
      r.action !== 'explain_home_screen_widget',
      `got action=${r.action}`,
    );
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
