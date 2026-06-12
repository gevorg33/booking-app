import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  DASHBOARD_CLASSIFIER_ACTION_UNION,
  dashboardClassifierUnionActionIds,
} from './ai-command-intent-schema.build.js';
import {
  DASHBOARD_INTENTS,
  ORCHESTRATION_INTENT_IDS,
} from './ai-command-registry.build.js';
import { resolveHandlerForSurface } from './ai-command-registry.util.js';

const AI_COMMAND_SERVICE_SOURCE = readFileSync(
  join(__dirname, 'ai-command.service.ts'),
  'utf8',
);

const DASHBOARD_META_INTENTS = new Set([
  'unknown',
  'error',
  'security_blocked',
  'clarify',
  'compound_intent',
]);

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

function dashboardIntentsRequiringSwitchCase(): string[] {
  return DASHBOARD_INTENTS.filter((id) => {
    if (DASHBOARD_META_INTENTS.has(id)) return false;
    if (ORCHESTRATION_INTENT_IDS.has(id)) return false;
    if (DELEGATED_DASHBOARD_HANDLER_INTENTS.has(id)) return false;
    return resolveHandlerForSurface(id, 'dashboard') === 'AiCommandService';
  });
}

describe('ai command handler coverage (ai-cmd-ext-0.2)', () => {
  it('maps every AiCommandService dashboard intent to a switch case', () => {
    const required = dashboardIntentsRequiringSwitchCase();
    const missing = required.filter(
      (id) => !AI_COMMAND_SERVICE_SOURCE.includes(`case '${id}':`),
    );

    expect(missing).toEqual([]);
  });
});

describe('ai command INTENT_SCHEMA union drift (ai-cmd-ext-0.1)', () => {
  it('includes every dashboard registry intent in the classifier action union', () => {
    const unionActions = dashboardClassifierUnionActionIds();
    const missing = DASHBOARD_INTENTS.filter((id) => !unionActions.has(id));
    expect(missing).toEqual([]);
  });

  it('wires the generated union into INTENT_SCHEMA', () => {
    expect(AI_COMMAND_SERVICE_SOURCE).toContain(
      '"action": ${DASHBOARD_CLASSIFIER_ACTION_UNION},',
    );
  });

  it('includes every AiCommandService dashboard intent in the classifier action union', () => {
    const unionActions = dashboardClassifierUnionActionIds();
    const missing = dashboardIntentsRequiringSwitchCase().filter(
      (id) => !unionActions.has(id),
    );
    expect(missing).toEqual([]);
  });
});

describe('ai command default branch telemetry (ai-cmd-ext-0.3)', () => {
  it('routes executeSingleIntent default through registry-aware unwired helper', () => {
    expect(AI_COMMAND_SERVICE_SOURCE).toContain(
      'buildUnwiredDashboardIntentResult(parsed.action',
    );
    expect(AI_COMMAND_SERVICE_SOURCE).not.toContain(
      "I don't know how to execute that action yet",
    );
  });
});
