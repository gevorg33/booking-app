import type { AppLocale } from '../../common/i18n/messages.js';
import { resolveLocale } from '../../common/i18n/messages.js';
import type { AppGuideIntent } from './ai-product-guide.util.js';
import type {
  CommandResult,
  GuideResponse,
} from './command-completion.types.js';
import type { AiProductGuideService } from './ai-product-guide.service.js';
import {
  buildGuideResponseForMultiTurnStep,
  attachGuideMultiTurnSessionToResult,
  createInitialGuideMultiTurnSession,
} from './ai-product-guide-multiturn.util.js';
import {
  buildProductGuideLogicInput,
  type ProductGuideSessionContext,
} from './ai-product-guide-session.util.js';
import type { GuideFlowSurface } from './guide/guide-flow.types.js';
import {
  DASHBOARD_SUGGESTION_CHIP_GUIDE,
  META_GUIDE_TOPIC_BY_INTENT,
  META_PRODUCT_GUIDE_INTENTS,
  META_PRODUCT_GUIDE_RESCUE_SCENARIOS,
  PROVIDER_META_GUIDE_INTENTS,
  PROVIDER_SUGGESTION_CHIP_GUIDE,
  type MetaProductGuideIntent,
  type MetaProductGuideRescueScenario,
  type ProviderMetaGuideIntent,
  type SuggestionChipGuideTarget,
} from './ai-meta-product-guide.fixtures.js';

export {
  DASHBOARD_SUGGESTION_CHIP_GUIDE,
  META_GUIDE_TOPIC_BY_INTENT,
  META_PRODUCT_GUIDE_INTENTS,
  PROVIDER_META_GUIDE_INTENTS,
  PROVIDER_SUGGESTION_CHIP_GUIDE,
  type MetaProductGuideIntent,
  type ProviderMetaGuideIntent,
  type SuggestionChipGuideTarget,
} from './ai-meta-product-guide.fixtures.js';

const META_GUIDE_APP_INTENT_BY_INTENT: Readonly<
  Record<MetaProductGuideIntent, AppGuideIntent>
> = {
  explain_ai_settings: 'guide_user_flow',
  explain_ai_suggestions: 'explain_app_feature',
  explain_assistant_approval: 'explain_app_feature',
};

export function isMetaProductGuideIntent(
  action: string,
): action is MetaProductGuideIntent {
  return (META_PRODUCT_GUIDE_INTENTS as readonly string[]).includes(action);
}

export function isProviderMetaGuideIntent(
  action: string,
): action is ProviderMetaGuideIntent {
  return (PROVIDER_META_GUIDE_INTENTS as readonly string[]).includes(action);
}

export function resolveMetaGuideAppIntent(
  intent: MetaProductGuideIntent,
): AppGuideIntent {
  return META_GUIDE_APP_INTENT_BY_INTENT[intent];
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function resolveSuggestionChipGuideTarget(
  surface: GuideFlowSurface,
  suggestionId: string | undefined,
): SuggestionChipGuideTarget | undefined {
  if (!suggestionId) return undefined;
  const map =
    surface === 'provider'
      ? PROVIDER_SUGGESTION_CHIP_GUIDE
      : surface === 'dashboard'
        ? DASHBOARD_SUGGESTION_CHIP_GUIDE
        : undefined;
  return map?.[suggestionId];
}

export function resolveMetaGuideTopicId(
  intent: MetaProductGuideIntent,
  surface: GuideFlowSurface,
  params: Record<string, unknown> = {},
): string {
  const explicit = readString(params.topicId);
  if (explicit) return explicit;

  const suggestionId =
    readString(params.suggestionId) ?? readString(params.suggestionChipId);
  const chipTarget = resolveSuggestionChipGuideTarget(surface, suggestionId);
  if (chipTarget && intent === 'explain_ai_suggestions') {
    return chipTarget.topicId;
  }

  const mapped = META_GUIDE_TOPIC_BY_INTENT[intent];
  if (surface === 'provider' && mapped.provider) return mapped.provider;
  return mapped.dashboard;
}

export function resolveMetaGuideStepIndex(
  intent: MetaProductGuideIntent,
  surface: GuideFlowSurface,
  params: Record<string, unknown> = {},
): number | undefined {
  if (intent !== 'explain_ai_suggestions') return undefined;
  const raw = params.guideStepIndex ?? params.stepIndex;
  if (typeof raw === 'number' && Number.isFinite(raw))
    return Math.max(0, Math.floor(raw));
  if (typeof raw === 'string' && raw.trim()) {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isFinite(parsed)) return Math.max(0, parsed);
  }
  const suggestionId =
    readString(params.suggestionId) ?? readString(params.suggestionChipId);
  return resolveSuggestionChipGuideTarget(surface, suggestionId)?.stepIndex;
}

function matchesMetaGuideRescueScenario(
  prompt: string,
  action: string,
  scenario: MetaProductGuideRescueScenario,
): boolean {
  if (scenario.fromActions?.length && !scenario.fromActions.includes(action)) {
    return false;
  }
  return scenario.prompt.test(prompt);
}

/** Deterministic rescue for meta-AI guide intents (ai-guide-1.8.7). */
export function rescueMetaProductGuideIntent(
  prompt: string,
  action: string,
  surface: GuideFlowSurface,
): string {
  if (isMetaProductGuideIntent(action)) return action;

  for (const scenario of META_PRODUCT_GUIDE_RESCUE_SCENARIOS) {
    if (scenario.surface !== surface) continue;
    if (matchesMetaGuideRescueScenario(prompt, action, scenario)) {
      return scenario.intent;
    }
  }

  return action;
}

export function positionMetaGuideAtStep(
  result: CommandResult,
  topicId: string,
  stepIndex: number | undefined,
  sessionContext?: Record<string, unknown>,
  locale: AppLocale = 'en',
): CommandResult {
  if (!result.success || !result.guide || stepIndex == null || stepIndex <= 0) {
    return result;
  }
  const session = {
    ...createInitialGuideMultiTurnSession(topicId),
    guideStepIndex: stepIndex,
  };
  const positionedGuide = buildGuideResponseForMultiTurnStep(
    result.guide,
    session,
    locale,
  );
  const nextResult: CommandResult = {
    ...result,
    guide: positionedGuide,
    summary: positionedGuide.summary,
    details: {
      ...result.details,
      guideStepIndex: stepIndex,
      suggestionStepIndex: stepIndex,
    },
  };
  return attachGuideMultiTurnSessionToResult(
    nextResult,
    session,
    sessionContext,
  );
}

export function buildMetaGuideCommandResult(
  metaIntent: MetaProductGuideIntent,
  guide: GuideResponse,
  details: Record<string, unknown> = {},
): CommandResult {
  return {
    success: true,
    action: metaIntent,
    summary: guide.summary,
    details: {
      topicId: guide.topicId,
      stepCount: guide.steps.length,
      guideIntent: resolveMetaGuideAppIntent(metaIntent),
      ...details,
    },
    guide,
  };
}

export function rewriteMetaGuideCommandResult(
  metaIntent: MetaProductGuideIntent,
  result: CommandResult,
): CommandResult {
  if (!result.guide) return { ...result, action: metaIntent };
  return buildMetaGuideCommandResult(
    metaIntent,
    result.guide,
    result.details ?? {},
  );
}

/** ai-guide-1.8.7 — meta guide intents → AiProductGuideService playbooks. */
export async function runMetaProductGuideIntent(input: {
  productGuide: AiProductGuideService;
  businessId: string;
  prompt: string;
  metaIntent: MetaProductGuideIntent;
  surface: GuideFlowSurface;
  session?: { context?: Record<string, unknown> };
  locale?: string;
  userId?: string;
  params?: Record<string, unknown>;
  sessionContext?: ProductGuideSessionContext;
}): Promise<CommandResult> {
  const topicId = resolveMetaGuideTopicId(
    input.metaIntent,
    input.surface,
    input.params ?? {},
  );
  const stepIndex = resolveMetaGuideStepIndex(
    input.metaIntent,
    input.surface,
    input.params ?? {},
  );
  const appIntent = resolveMetaGuideAppIntent(input.metaIntent);
  const guideParams = { ...input.params, topicId };

  const guideInput = input.sessionContext
    ? {
        businessId: input.businessId,
        prompt: input.prompt,
        params: guideParams,
        route: input.sessionContext.route,
        locale: input.locale ?? input.sessionContext.locale,
        vertical: input.sessionContext.vertical,
        role: input.sessionContext.role,
        roleProfile: input.sessionContext.roleProfile,
        retailPosEnabled: input.sessionContext.retailPosEnabled,
        enabledModules: input.sessionContext.enabledModules,
        surface: input.sessionContext.surface ?? input.surface,
        userId: input.userId,
        session: input.session,
      }
    : buildProductGuideLogicInput({
        businessId: input.businessId,
        prompt: input.prompt,
        params: guideParams,
        session: input.session,
        surface: input.surface,
        locale: input.locale,
        userId: input.userId,
      });

  const handler =
    appIntent === 'explain_app_feature'
      ? input.productGuide.handleExplainAppFeatureAsync.bind(input.productGuide)
      : appIntent === 'explain_current_screen'
        ? input.productGuide.handleExplainCurrentScreenAsync.bind(
            input.productGuide,
          )
        : input.productGuide.handleGuideUserFlowAsync.bind(input.productGuide);

  const raw = await handler(
    input.businessId,
    guideParams,
    input.prompt,
    guideInput,
  );
  const rewritten = rewriteMetaGuideCommandResult(input.metaIntent, raw);
  return positionMetaGuideAtStep(
    rewritten,
    topicId,
    stepIndex,
    input.session?.context,
    resolveLocale(input.locale ?? input.sessionContext?.locale),
  );
}
