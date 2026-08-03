/**
 * Guru live QA for e2e-bug.341 — `POSITIVE_CUE`'s Armenian "was helpful"
 * alternative was written with the letter Ե (Yech, U+0565) instead of Է
 * (Eh, U+0537), so "օգտակար էր" never matched any real occurrence — only
 * the one exact canonical string "Օգտակար էր" survived, via a coincidental
 * separate exact-string fixture lookup used only by `isGiveAiFeedbackPrompt`.
 *
 * Run: node frontend/scripts/qa-e2e-bug-341.mjs
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
  console.log(`e2e-bug.341 live QA → ${API} slug=${SLUG}`);

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

  async function ask(prompt, locale = 'hy') {
    const res = await request('POST', `/public/${SLUG}/assistant`, {
      prompt,
      assistantMode: 'act',
      locale,
      context: {
        slug: SLUG,
        locale,
        lastAssistantReply: 'Ձեզ ամրագրված է Երկուշաբթի օրվա համար.',
        lastAction: 'create_booking',
      },
    });
    const data = unwrap(res.body);
    return {
      action: data?.action ?? data?.intent?.action ?? null,
      summary: String(data?.summary ?? data?.message ?? ''),
    };
  }

  const POSITIVE_THANKS_HINT = /thank|շնորհ|улучш|спасибо|helps improve/i;

  // Canonical exact phrase — must resolve positive.
  {
    const r = await ask('Օգտակար էր');
    check(
      'hy-canonical-exact-phrase-positive',
      r.action === 'give_ai_feedback' && POSITIVE_THANKS_HINT.test(r.summary),
      `got action=${r.action} summary=${r.summary}`,
    );
  }

  // Exact reported repro #1.
  {
    const r = await ask('Դա օգտակար էր');
    check(
      'hy-exact-repro-1-positive',
      r.action === 'give_ai_feedback' && POSITIVE_THANKS_HINT.test(r.summary),
      `got action=${r.action} summary=${r.summary}`,
    );
  }

  // Exact reported repro #2.
  {
    const r = await ask('Շատ օգտակար էր');
    check(
      'hy-exact-repro-2-positive',
      r.action === 'give_ai_feedback' && POSITIVE_THANKS_HINT.test(r.summary),
      `got action=${r.action} summary=${r.summary}`,
    );
  }

  // Sibling negative control (e2e-bug.324) — must remain negative.
  {
    const r = await ask('Օգտակար չէր');
    check(
      'hy-negative-control-not-helpful-past',
      r.action === 'give_ai_feedback' && !POSITIVE_THANKS_HINT.test(r.summary),
      `got action=${r.action} summary=${r.summary}`,
    );
  }

  // "That was wrong" control — must remain negative.
  {
    const r = await ask('Դա սխալ էր');
    check(
      'hy-negative-control-that-was-wrong',
      r.action === 'give_ai_feedback' && !POSITIVE_THANKS_HINT.test(r.summary),
      `got action=${r.action} summary=${r.summary}`,
    );
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
