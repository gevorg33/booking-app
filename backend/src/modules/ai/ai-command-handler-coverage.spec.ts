import fs, { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  DASHBOARD_CLASSIFIER_ACTION_UNION,
  DASHBOARD_INTENT_SCHEMA,
  dashboardClassifierUnionActionIds,
} from './ai-command-intent-schema.build.js';
import {
  DASHBOARD_INTENTS,
  ORCHESTRATION_INTENT_IDS,
} from './ai-command-registry.build.js';
import { resolveHandlerForSurface } from './ai-command-registry.util.js';
import {
  DASHBOARD_CORE_DISPATCH_INTENTS,
  DASHBOARD_PAYMENTS_DISPATCH_INTENTS,
} from './ai-dashboard-core.util.js';
import { PAYMENTS_LOGIC_DISPATCH_MAP } from './ai-payments-dispatch.build.js';
import { listAiPaymentsServiceRegistryIntentIds } from './ai-payments-dispatch.util.js';

const AI_COMMAND_SERVICE_SOURCE = readFileSync(
  join(__dirname, 'ai-command.service.ts'),
  'utf8',
);

const DASHBOARD_CORE_LOGIC_SOURCE = readFileSync(
  join(__dirname, 'ai-dashboard-core.logic.ts'),
  'utf8',
);

// e2e-bug.534 — a dispatch-map registration is a handler too.
//
// This suite predates the move from a switch in AiCommandService to per-domain
// dispatch builders. Nine dashboard intents were reported as having no handler
// — explain_ai_audit_log, explain_ai_capabilities, explain_ai_usage_analytics,
// get_provider_calendar, list_customers, list_schedule_blocks,
// summarize_ai_briefing, summarize_ai_settings, summarize_ai_weekly_report —
// and every one of them is in fact wired, via `map.set('<id>', …)` in
// ai-meta-ops-dispatch.build.ts, ai-customer-crm-dispatch.build.ts or
// ai-schedule-handlers-dispatch.build.ts. Checked individually, not inferred
// from a sample.
//
// The registry still names AiCommandService as their handler, which is what put
// them in this list; that is a separate question from whether they are
// reachable, and they are. Accept either wiring so the gate keeps catching a
// genuinely unhandled intent without failing on the architecture it moved to.
const DISPATCH_BUILD_SOURCES = fs
  .readdirSync(__dirname)
  .filter((name) => name.endsWith('-dispatch.build.ts'))
  .map((name) => readFileSync(join(__dirname, name), 'utf8'))
  .join('\n');

function hasAnyHandlerWiring(id: string): boolean {
  return (
    AI_COMMAND_SERVICE_SOURCE.includes(`case '${id}':`) ||
    DISPATCH_BUILD_SOURCES.includes(`map.set('${id}'`)
  );
}

const DASHBOARD_META_INTENTS = new Set([
  'unknown',
  'error',
  'security_blocked',
  'clarify',
  'compound_intent',
]);

const DASHBOARD_CORE_INTENT_SET = new Set<string>(
  DASHBOARD_CORE_DISPATCH_INTENTS,
);

const DASHBOARD_PAYMENTS_INTENT_SET = new Set<string>(
  DASHBOARD_PAYMENTS_DISPATCH_INTENTS,
);

/** Dashboard intents delegated to domain services (not AiCommandService switch). */
const DELEGATED_DASHBOARD_HANDLER_INTENTS = new Set<string>([
  ...DASHBOARD_INTENTS.filter((id) => {
    const handler = resolveHandlerForSurface(id, 'dashboard');
    return (
      handler != null &&
      handler !== 'AiCommandService' &&
      !DASHBOARD_META_INTENTS.has(id)
    );
  }),
]);

const AI_PAYMENTS_REGISTRY_INTENTS = new Set(
  listAiPaymentsServiceRegistryIntentIds(),
);

function dashboardIntentsRequiringLegacySwitchCase(): string[] {
  return DASHBOARD_INTENTS.filter((id) => {
    if (DASHBOARD_META_INTENTS.has(id)) return false;
    if (ORCHESTRATION_INTENT_IDS.has(id)) return false;
    if (DELEGATED_DASHBOARD_HANDLER_INTENTS.has(id)) return false;
    if (DASHBOARD_CORE_INTENT_SET.has(id)) return false;
    return resolveHandlerForSurface(id, 'dashboard') === 'AiCommandService';
  });
}

describe('ai command handler coverage (ai-cmd-ext-0.2 / ai-cmd-ext-6.1)', () => {
  it('maps every legacy AiCommandService dashboard intent to a switch case', () => {
    const required = dashboardIntentsRequiringLegacySwitchCase();
    const missing = required.filter((id) => !hasAnyHandlerWiring(id));

    expect(missing).toEqual([]);
  });

  it('maps every non-payments dashboard core dispatch intent to ai-dashboard-core.logic switch case', () => {
    const nonPaymentsCore = [...DASHBOARD_CORE_INTENT_SET].filter(
      (id) => !DASHBOARD_PAYMENTS_INTENT_SET.has(id),
    );
    const missing = nonPaymentsCore.filter(
      (id) => !DASHBOARD_CORE_LOGIC_SOURCE.includes(`case '${id}':`),
    );

    expect(missing).toEqual([]);
  });

  it('routes dashboard payments core intents through registry dispatch map', () => {
    const missing = [...DASHBOARD_PAYMENTS_INTENT_SET].filter(
      (id) => !PAYMENTS_LOGIC_DISPATCH_MAP.has(id),
    );
    expect(missing).toEqual([]);
    expect(DASHBOARD_CORE_LOGIC_SOURCE).toContain(
      'deps.payments.dispatchIntent',
    );
    for (const id of DASHBOARD_PAYMENTS_INTENT_SET) {
      expect(DASHBOARD_CORE_LOGIC_SOURCE).not.toContain(`case '${id}':`);
    }
  });

  it('does not keep dashboard core intents in AiCommandService switch', () => {
    const stillInLegacy = [...DASHBOARD_CORE_INTENT_SET].filter((id) =>
      AI_COMMAND_SERVICE_SOURCE.includes(`case '${id}':`),
    );

    expect(stillInLegacy).toEqual([]);
  });
});

describe('ai payments registry dispatch (ai-cmd-ext-6.2)', () => {
  it('maps every registry AiPaymentsService intent to PAYMENTS_LOGIC_DISPATCH_MAP', () => {
    const missing = [...AI_PAYMENTS_REGISTRY_INTENTS].filter(
      (id) => !PAYMENTS_LOGIC_DISPATCH_MAP.has(id),
    );
    expect(missing).toEqual([]);
  });

  it('does not keep AiPaymentsService intents in AiCommandService switch', () => {
    const stillInLegacy = [...AI_PAYMENTS_REGISTRY_INTENTS].filter((id) =>
      AI_COMMAND_SERVICE_SOURCE.includes(`case '${id}':`),
    );
    expect(stillInLegacy).toEqual([]);
  });

  it('routes legacy executeSingleIntent through payments.dispatchIntent', () => {
    expect(AI_COMMAND_SERVICE_SOURCE).toContain('this.payments.dispatchIntent');
  });
});

describe('ai command INTENT_SCHEMA union drift (ai-cmd-ext-0.1)', () => {
  it('includes every dashboard registry intent in the classifier action union', () => {
    const unionActions = dashboardClassifierUnionActionIds();
    const missing = DASHBOARD_INTENTS.filter((id) => !unionActions.has(id));
    expect(missing).toEqual([]);
  });

  it('wires the generated union into INTENT_SCHEMA', () => {
    expect(DASHBOARD_INTENT_SCHEMA).toContain(
      `"action": ${DASHBOARD_CLASSIFIER_ACTION_UNION},`,
    );
  });

  it('includes every AiCommandService dashboard intent in the classifier action union', () => {
    const unionActions = dashboardClassifierUnionActionIds();
    const legacyRequired = dashboardIntentsRequiringLegacySwitchCase();
    const missing = legacyRequired.filter((id) => !unionActions.has(id));
    expect(missing).toEqual([]);
  });
});

describe('ai command default branch telemetry (ai-cmd-ext-0.3)', () => {
  it('routes executeSingleIntent default through registry-aware unwired helper', () => {
    // Matched with tolerant whitespace rather than as a literal substring: the
    // call sits ~60 columns deep, so prettier wraps it across lines whenever the
    // surrounding code shifts, and the assertion then fails for a reformat that
    // changed no behaviour. The invariant is "the default branch calls the
    // registry-aware helper with parsed.action", not how it is line-broken.
    expect(AI_COMMAND_SERVICE_SOURCE).toMatch(
      /buildUnwiredDashboardIntentResult\(\s*parsed\.action/,
    );
    expect(AI_COMMAND_SERVICE_SOURCE).not.toContain(
      "I don't know how to execute that action yet",
    );
  });
});
