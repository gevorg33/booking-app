import type { CommandResult } from './command-completion.types.js';
import type { GuideFlowSurface } from './guide/guide-flow.types.js';
import type { ProductGuideSessionContext } from './ai-product-guide-session.util.js';
import { buildProductGuideLogicInput } from './ai-product-guide-session.util.js';
import type { EmptyStateGuideLogicDeps } from './ai-product-guide-empty-state.logic.js';
import { runEmptyStateGuideIntentLogic } from './ai-product-guide-empty-state.logic.js';
import {
  CUSTOMER_PUBLIC_EMPTY_STATE_GUIDE_INTENTS,
  DASHBOARD_EMPTY_STATE_GUIDE_INTENTS,
  EMPTY_STATE_GUIDE_RESCUE_SCENARIOS,
  PROVIDER_EMPTY_STATE_GUIDE_INTENTS,
  type EmptyStateGuideIntent,
  type EmptyStateGuideRescueScenario,
} from './ai-product-guide-empty-state.fixtures.js';

export {
  CUSTOMER_PUBLIC_EMPTY_STATE_GUIDE_INTENTS,
  DASHBOARD_EMPTY_STATE_GUIDE_INTENTS,
  EMPTY_STATE_GUIDE_INTENTS,
  EMPTY_STATE_GUIDE_PIPE_MARKER,
  EMPTY_STATE_GUIDE_RESCUE_SCENARIOS,
  PROVIDER_EMPTY_STATE_GUIDE_INTENTS,
  type EmptyStateGuideIntent,
} from './ai-product-guide-empty-state.fixtures.js';

export function isEmptyStateGuideIntent(
  action: string,
): action is EmptyStateGuideIntent {
  return (DASHBOARD_EMPTY_STATE_GUIDE_INTENTS as readonly string[]).includes(
    action,
  );
}

export function isEmptyStateGuideIntentOnSurface(
  action: string,
  surface: GuideFlowSurface,
): boolean {
  if (!isEmptyStateGuideIntent(action)) return false;
  if (surface === 'dashboard') return true;
  if (surface === 'provider') {
    return (PROVIDER_EMPTY_STATE_GUIDE_INTENTS as readonly string[]).includes(
      action,
    );
  }
  if (surface === 'customer' || surface === 'public') {
    return (
      CUSTOMER_PUBLIC_EMPTY_STATE_GUIDE_INTENTS as readonly string[]
    ).includes(action);
  }
  return false;
}

function matchesEmptyStateRescueScenario(
  prompt: string,
  action: string,
  scenario: EmptyStateGuideRescueScenario,
): boolean {
  if (scenario.fromActions?.length && !scenario.fromActions.includes(action)) {
    return false;
  }
  return scenario.prompt.test(prompt);
}

/** Deterministic rescue for live empty-state guide intents (ai-guide-1.8.9). */
export function rescueEmptyStateGuideIntent(
  prompt: string,
  action: string,
  surface: GuideFlowSurface,
): string {
  if (isEmptyStateGuideIntent(action)) return action;

  for (const scenario of EMPTY_STATE_GUIDE_RESCUE_SCENARIOS) {
    if (scenario.surface !== surface) continue;
    if (matchesEmptyStateRescueScenario(prompt, action, scenario)) {
      return scenario.intent;
    }
  }

  return action;
}

export function parseEmptyStateGuideIntentFromPrompt(
  intent: EmptyStateGuideIntent,
  prompt: string,
  surface: GuideFlowSurface,
): boolean {
  if (!isEmptyStateGuideIntentOnSurface(intent, surface)) return false;
  return EMPTY_STATE_GUIDE_RESCUE_SCENARIOS.some(
    (scenario) =>
      scenario.intent === intent &&
      scenario.surface === surface &&
      scenario.prompt.test(prompt),
  );
}

export async function runEmptyStateGuideIntent(input: {
  deps: EmptyStateGuideLogicDeps;
  businessId: string;
  prompt: string;
  intent: EmptyStateGuideIntent;
  surface: GuideFlowSurface;
  params?: Record<string, unknown>;
  session?: { context?: Record<string, unknown> };
  sessionContext?: ProductGuideSessionContext;
  locale?: string;
  linkedEmployeeId?: string;
}): Promise<CommandResult> {
  const guideInput = input.sessionContext
    ? {
        businessId: input.businessId,
        prompt: input.prompt,
        params: input.params ?? {},
        route: input.sessionContext.route,
        locale: input.locale ?? input.sessionContext.locale,
        vertical: input.sessionContext.vertical,
        role: input.sessionContext.role,
        roleProfile: input.sessionContext.roleProfile,
        retailPosEnabled: input.sessionContext.retailPosEnabled,
        enabledModules: input.sessionContext.enabledModules,
        surface: input.sessionContext.surface ?? input.surface,
        session: input.session,
      }
    : buildProductGuideLogicInput({
        businessId: input.businessId,
        prompt: input.prompt,
        params: input.params ?? {},
        session: input.session,
        surface: input.surface,
        locale: input.locale,
      });

  return runEmptyStateGuideIntentLogic(input.deps, input.intent, {
    businessId: input.businessId,
    surface: input.surface,
    locale: guideInput.locale,
    prompt: input.prompt,
    params: input.params,
    route: guideInput.route,
    role: guideInput.role,
    enabledModules: guideInput.enabledModules,
    linkedEmployeeId: input.linkedEmployeeId,
    session: input.session,
    planTierId: guideInput.session?.context
      ? undefined
      : input.sessionContext?.planTierId,
  });
}
