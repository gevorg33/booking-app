/**
 * Guru live QA for e2e-bug.307 — public "is anybody open…" must stay
 * check_availability, never add_booking_to_calendar.
 *
 * Run: node frontend/scripts/qa-e2e-bug-307.mjs
 * Requires: API on :3001
 */
import { createRequire } from 'module';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const backendRoot = resolve(__dirname, '../../backend');
const require = createRequire(resolve(backendRoot, 'package.json'));

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

function request(method, path, { body } = {}) {
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
    req.setTimeout(120000, () => req.destroy(new Error('timeout')));
    if (data) req.write(data);
    req.end();
  });
}

function unwrap(body) {
  return body?.data ?? body;
}

async function main() {
  loadEnv();
  process.chdir(backendRoot);

  const {
    isAddBookingToCalendarPrompt,
    isProviderAvailabilityOpenCheckPrompt,
    rescueAddBookingToCalendarIntent,
  } = require(resolve(
    backendRoot,
    'dist/modules/ai/ai-add-booking-to-calendar.util.js',
  ));
  const { AiIntentRescueService } = require(resolve(
    backendRoot,
    'dist/modules/ai/ai-intent-rescue.service.js',
  ));
  const { resolveAvailabilityIntentFromPrompt } = require(resolve(
    backendRoot,
    'dist/modules/ai/ai-intent-disambiguation.util.js',
  ));

  const results = [];
  function record(id, pass, detail) {
    results.push({ id, pass, detail });
    console.log(
      `${pass ? 'PASS' : 'FAIL'}  ${id} — ${JSON.stringify(detail).slice(0, 360)}`,
    );
  }

  const canonical = 'is anybody open tomorrow morning for Swedish massage';

  record(
    'unit-detector-not-calendar',
    isAddBookingToCalendarPrompt(canonical) === false &&
      isProviderAvailabilityOpenCheckPrompt(canonical) === true,
    {
      isCalendar: isAddBookingToCalendarPrompt(canonical),
      isOpenCheck: isProviderAvailabilityOpenCheckPrompt(canonical),
    },
  );
  record(
    'unit-rescue-does-not-steal',
    rescueAddBookingToCalendarIntent(canonical, 'check_availability') == null &&
      rescueAddBookingToCalendarIntent(canonical, 'unknown') == null,
    {
      fromAvail: rescueAddBookingToCalendarIntent(
        canonical,
        'check_availability',
      ),
      fromUnknown: rescueAddBookingToCalendarIntent(canonical, 'unknown'),
    },
  );
  record(
    'unit-public-resolve-availability',
    resolveAvailabilityIntentFromPrompt('public', canonical)?.action ===
      'check_availability',
    {
      action: resolveAvailabilityIntentFromPrompt('public', canonical)?.action,
    },
  );

  const rescue = new AiIntentRescueService();
  for (const from of [
    'check_availability',
    'add_booking_to_calendar',
    'check_providers_for_service',
  ]) {
    const r = rescue.rescue({
      prompt: canonical,
      action: from,
      params: {},
      surface: 'public',
    });
    const ok =
      r.action !== 'add_booking_to_calendar' &&
      [
        'check_availability',
        'check_providers_for_service',
        'explain_provider_availability',
      ].includes(r.action);
    record(`unit-rescue-public-from-${from}`, ok, {
      from,
      action: r.action,
      reason: r.rescueReason,
    });
  }

  record(
    'unit-ctrl-add-calendar',
    isAddBookingToCalendarPrompt('Add to my calendar') === true,
    { isCalendar: isAddBookingToCalendarPrompt('Add to my calendar') },
  );

  console.log(`e2e-bug.307 QA → ${API} ${SLUG}\n`);

  async function publicAssistant(prompt, locale = 'en') {
    const res = await request('POST', `/public/${SLUG}/assistant`, {
      body: {
        prompt,
        assistantMode: 'act',
        locale,
        context: { slug: SLUG },
      },
    });
    return { status: res.status, data: unwrap(res.body) };
  }

  const liveCases = [
    {
      id: 'live-anybody-open-swedish',
      prompt: canonical,
      expected: ['check_availability', 'check_providers_for_service'],
      forbid: ['add_booking_to_calendar'],
    },
    {
      id: 'live-anyone-free-swedish',
      prompt: 'is anyone free tomorrow morning for Swedish massage',
      expected: [
        'check_availability',
        'check_providers_for_service',
        'explain_provider_availability',
      ],
      forbid: ['add_booking_to_calendar'],
    },
    {
      id: 'live-who-is-open-swedish',
      prompt: 'who is open tomorrow morning for Swedish massage',
      expected: ['check_availability', 'check_providers_for_service'],
      forbid: ['add_booking_to_calendar'],
    },
    {
      id: 'live-see-who-is-open',
      prompt: 'see who is open tomorrow for facial',
      expected: ['check_availability', 'check_providers_for_service'],
      forbid: ['add_booking_to_calendar'],
    },
    {
      id: 'live-named-gevorg-open',
      prompt: 'is Gevorg open tomorrow morning for Swedish massage',
      expected: ['check_availability'],
      forbid: ['add_booking_to_calendar'],
    },
    {
      id: 'live-anybody-open-evening',
      prompt: 'is anybody open tomorrow evening for massage',
      expected: ['check_availability', 'check_providers_for_service'],
      forbid: ['add_booking_to_calendar'],
    },
    {
      id: 'live-anybody-open-hy',
      locale: 'hy',
      prompt: 'is anybody open tomorrow morning for Swedish massage',
      expected: ['check_availability', 'check_providers_for_service'],
      forbid: ['add_booking_to_calendar'],
    },
    {
      id: 'live-anybody-open-ru',
      locale: 'ru',
      prompt: 'is anybody open tomorrow morning for Swedish massage',
      expected: ['check_availability', 'check_providers_for_service'],
      forbid: ['add_booking_to_calendar'],
    },
    {
      id: 'live-ctrl-add-to-calendar',
      prompt: 'Add to my calendar',
      expected: ['add_booking_to_calendar'],
      forbid: [],
    },
    {
      id: 'live-ctrl-send-ics',
      prompt: 'Send me an ICS for my booking',
      expected: ['add_booking_to_calendar'],
      forbid: [],
    },
  ];

  for (const c of liveCases) {
    const { status, data } = await publicAssistant(c.prompt, c.locale || 'en');
    const action = data?.action || data?.intent || '';
    const summary = String(data?.summary || '');
    const actionOk = c.expected.includes(action);
    const forbidOk = !c.forbid.includes(action);
    // Calendar controls may clarify for missing booking — still calendar action
    const calendarClarifyOk =
      c.expected.includes('add_booking_to_calendar') &&
      (action === 'add_booking_to_calendar' ||
        /calendar|ics|booking/i.test(summary));
    const pass =
      (status === 200 || status === 201) &&
      forbidOk &&
      (actionOk || calendarClarifyOk);
    record(c.id, pass, {
      status,
      action,
      summary: summary.slice(0, 160),
      actionOk,
      forbidOk,
    });
  }

  const failed = results.filter((r) => !r.pass);
  console.log(
    `\ne2e-bug.307: ${results.length - failed.length}/${results.length} passed`,
  );
  if (failed.length) {
    console.error('FAILED:', failed.map((f) => f.id).join(', '));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
