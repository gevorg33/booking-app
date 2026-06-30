import { resolveLocale, type AppLocale } from '../../common/i18n/messages.js';
import type { LlmService } from '../../engine/agent/llm.service.js';
import type { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';
import type {
  CommandResult,
  GuideResponse,
} from './command-completion.types.js';
import { getFrontendGuideCorpusMessages } from './guide/ai-guide-corpus-i18n.fixtures.js';
import {
  getGuideCorpusTopic,
  resolveGuideCorpusTopic,
} from './guide/ai-guide-corpus.util.js';
import type { GuideCorpusTopicId } from './guide/ai-guide-corpus.types.js';
import type { AccessTier } from './access-control.matrix.js';
import type { GuideFlowRoleScope } from './guide/guide-flow.types.js';
import type { GuideFlowSurface } from './guide/guide-flow.types.js';
import {
  buildGuideCommandResult,
  type AppGuideIntent,
} from './ai-product-guide.util.js';
import { buildGuideResponseFromCorpus } from './ai-product-guide-corpus-response.util.js';
import { enrichGuideResponseHandoffs } from './ai-product-guide-handoff.util.js';
import { enrichGuideResponseHelpArticles } from './guide/guide-topic-help-articles.util.js';
import { enrichGuideResponseSupportHandoff } from './guide/guide-support-handoff.util.js';
import {
  buildGuideGroundingClarifyResult,
  verifyGuideResponseGrounding,
} from './ai-product-guide-grounding.util.js';
import { extractSettingsPathsFromCorpusTopic } from './ai-product-guide-settings-grounding.util.js';
import {
  polishGuideResponseWithLlm,
  type GuidePolishDeps,
} from './ai-product-guide-polish.util.js';
import {
  GUIDE_CORPUS_MATCH_THRESHOLD,
  type ProductGuideRetrieveQuery,
} from './ai-product-guide-ranking.util.js';
import {
  buildGuideResponseFromFlowPlaybook,
  resolveGuideFlowPlaybook,
} from './guide/guide-flow.corpus.util.js';
import {
  buildGuideClarifyResult,
  resolveGuideFullMatch,
  resolveGuideKeywordMatch,
} from './ai-product-guide-match.util.js';
import { resolveGuideFlowSurfaceFromRoute } from './guide/guide-flow.merge.util.js';
import type { GuideCorpusSemanticDeps } from './ai-product-guide-semantic.util.js';
import type { ProductGuideTelemetryRecorder } from './guide/guide-telemetry.types.js';
import {
  recordProductGuideGroundingFailureTelemetry,
  recordProductGuideTopicOpenedTelemetry,
} from './guide/guide-telemetry.util.js';
import {
  initializeGuideMultiTurnResult,
  tryHandleGuideMultiTurnNavigation,
} from './ai-product-guide-multiturn.util.js';
import { tryResolvePlanGatedGuideResult } from './ai-product-guide-plan-gate.util.js';
import { readPlanTierIdFromPageContext } from './ai-product-guide-session.util.js';

export interface ProductGuideLogicInput {
  businessId: string;
  prompt: string;
  params?: Record<string, unknown>;
  route?: string;
  role?: ProductGuideRetrieveQuery['role'];
  vertical?: string;
  locale?: string;
  userId?: string;
  retailPosEnabled?: boolean;
  enabledModules?: readonly string[];
  roleProfile?: GuideFlowRoleScope;
  surface?: GuideFlowSurface;
  telemetry?: ProductGuideTelemetryRecorder;
  session?: { context?: Record<string, unknown> };
}

export interface ProductGuideLogicDeps {
  llm?: GuidePolishDeps;
  semantic?: GuideCorpusSemanticDeps;
}

function readTopicIdParam(params?: Record<string, unknown>): string | undefined {
  const topicId = params?.topicId;
  return typeof topicId === 'string' && topicId.trim() ? topicId.trim() : undefined;
}

function resolveGuideLocale(locale?: string): AppLocale {
  return resolveLocale(locale);
}

export { buildGuideResponseFromCorpus } from './ai-product-guide-corpus-response.util.js';

function buildProductGuideQuery(
  intent: AppGuideIntent,
  input: ProductGuideLogicInput,
  locale: AppLocale,
): ProductGuideRetrieveQuery {
  return {
    prompt: input.prompt,
    intent,
    route: input.route,
    role: input.role,
    roleProfile: input.roleProfile,
    vertical: input.vertical,
    locale,
    topicId: readTopicIdParam(input.params),
    retailPosEnabled: input.retailPosEnabled,
    enabledModules: input.enabledModules,
    surface:
      input.surface ??
      resolveGuideFlowSurfaceFromRoute(input.route) ??
      'dashboard',
    planTierId: readPlanTierIdFromPageContext(input.session?.context),
  };
}

function finalizeGuideResponse(
  guide: GuideResponse,
  input: ProductGuideLogicInput,
  intent: AppGuideIntent,
  locale: AppLocale,
): GuideResponse {
  const withHandoffs = enrichGuideResponseHandoffs(guide, {
    prompt: input.prompt,
    route: input.route,
    intent,
  });
  const withHelp = enrichGuideResponseHelpArticles(withHandoffs);
  return enrichGuideResponseSupportHandoff(withHelp, {
    surface:
      input.surface ??
      resolveGuideFlowSurfaceFromRoute(input.route) ??
      'dashboard',
    route: input.route,
    topicId: guide.topicId,
    locale,
  });
}

function buildDeterministicFlowGuideResult(
  intent: AppGuideIntent,
  input: ProductGuideLogicInput,
  best: NonNullable<Awaited<ReturnType<typeof resolveGuideKeywordMatch>>['flowBest']>,
  locale: AppLocale,
  messages: ReturnType<typeof getFrontendGuideCorpusMessages>,
): CommandResult {
  const resolved = resolveGuideFlowPlaybook(best.playbook, messages);
  const guide = finalizeGuideResponse(
    buildGuideResponseFromFlowPlaybook(resolved),
    input,
    intent,
    locale,
  );

  const grounding = verifyGuideResponseGrounding(guide);
  if (!grounding.ok) {
    recordProductGuideGroundingFailureTelemetry(
      input.telemetry,
      {
        businessId: input.businessId,
        userId: input.userId,
        route: input.route,
        surface: input.surface,
        locale,
        topicId: guide.topicId,
      },
      grounding.issues.map((issue) => issue.code),
    );
    return buildGuideGroundingClarifyResult(intent, grounding);
  }

  recordProductGuideTopicOpenedTelemetry(
    input.telemetry,
    {
      businessId: input.businessId,
      userId: input.userId,
      route: input.route,
      surface: input.surface,
      locale,
    },
    guide,
  );

  const result = buildGuideCommandResult(intent, guide);
  result.details = {
    ...result.details,
    confidence: best.score,
    matchReasons: best.reasons,
    locale,
    retrievalPath: 'guide-flow',
    deterministic: true,
    playbookTopicId: best.topicId,
  };
  return initializeGuideMultiTurnResult(result, input.session?.context);
}

function resolveGuideMatch(
  query: ProductGuideRetrieveQuery,
  messages: ReturnType<typeof getFrontendGuideCorpusMessages>,
) {
  return resolveGuideKeywordMatch(query, messages);
}

function buildDeterministicGuideResult(
  intent: AppGuideIntent,
  input: ProductGuideLogicInput,
  best: { topicId: string; score: number; reasons: readonly string[] },
  locale: AppLocale,
  retrievalPath: string,
): CommandResult {
  const topic = getGuideCorpusTopic(best.topicId as GuideCorpusTopicId);
  const messages = getFrontendGuideCorpusMessages(locale);
  const resolved = topic
    ? resolveGuideCorpusTopic(best.topicId as GuideCorpusTopicId, messages)
    : null;

  if (!topic || !resolved) {
    return {
      success: false,
      action: intent,
      summary: 'Guide content is unavailable for that topic right now.',
      details: { topicId: best.topicId },
    };
  }

  const guide = finalizeGuideResponse(
    buildGuideResponseFromCorpus(resolved, topic),
    input,
    intent,
    locale,
  );

  const grounding = verifyGuideResponseGrounding(guide);
  if (!grounding.ok) {
    recordProductGuideGroundingFailureTelemetry(
      input.telemetry,
      {
        businessId: input.businessId,
        userId: input.userId,
        route: input.route,
        surface: input.surface,
        locale,
        topicId: guide.topicId,
      },
      grounding.issues.map((issue) => issue.code),
    );
    return buildGuideGroundingClarifyResult(intent, grounding);
  }

  recordProductGuideTopicOpenedTelemetry(
    input.telemetry,
    {
      businessId: input.businessId,
      userId: input.userId,
      route: input.route,
      surface: input.surface,
      locale,
    },
    guide,
  );

  const result = buildGuideCommandResult(intent, guide);
  result.details = {
    ...result.details,
    confidence: best.score,
    matchReasons: best.reasons,
    locale,
    retrievalPath,
    deterministic: true,
  };
  return initializeGuideMultiTurnResult(result, input.session?.context);
}

/**
 * Sync keyword-only path — used by unit tests and when async deps are unavailable.
 */
export function handleProductGuideIntentLogic(
  intent: AppGuideIntent,
  input: ProductGuideLogicInput,
): CommandResult {
  const locale = resolveGuideLocale(input.locale);
  const navigationResult = tryHandleGuideMultiTurnNavigation(intent, input, locale);
  if (navigationResult) return navigationResult;

  const planGateResult = tryResolvePlanGatedGuideResult(intent, input, locale);
  if (planGateResult) return planGateResult;

  const messages = getFrontendGuideCorpusMessages(locale);
  const query = buildProductGuideQuery(intent, input, locale);
  const match = resolveGuideMatch(query, messages);

  if (match.kind === 'flow' && match.flowBest) {
    return buildDeterministicFlowGuideResult(intent, input, match.flowBest, locale, messages);
  }

  if (match.kind === 'corpus') {
    return buildDeterministicGuideResult(
      intent,
      input,
      match.corpusBest!,
      locale,
      'keyword',
    );
  }

  return buildGuideClarifyResult(intent, match, input.route ?? null);
}

/**
 * Full ai-guide-1.2.3 pipeline: keyword → semantic escalation → deterministic
 * corpus → optional LLM polish when match confidence ≥ threshold.
 */
export async function handleProductGuideIntentLogicAsync(
  intent: AppGuideIntent,
  input: ProductGuideLogicInput,
  deps?: ProductGuideLogicDeps,
): Promise<CommandResult> {
  const locale = resolveGuideLocale(input.locale);
  const navigationResult = tryHandleGuideMultiTurnNavigation(intent, input, locale);
  if (navigationResult) return navigationResult;

  const planGateResult = tryResolvePlanGatedGuideResult(intent, input, locale);
  if (planGateResult) return planGateResult;

  const messages = getFrontendGuideCorpusMessages(locale);
  const query = buildProductGuideQuery(intent, input, locale);
  const resolution = await resolveGuideFullMatch(query, messages, deps?.semantic);

  if (resolution.kind === 'flow' && resolution.flowBest) {
    const flowResult = buildDeterministicFlowGuideResult(
      intent,
      input,
      resolution.flowBest,
      locale,
      messages,
    );
    if (!flowResult.success || !flowResult.guide || !deps?.llm) {
      return flowResult;
    }
    const resolved = resolveGuideFlowPlaybook(resolution.flowBest.playbook, messages);
    const polished = await polishGuideResponseWithLlm(
      {
        businessId: input.businessId,
        userId: input.userId,
        prompt: input.prompt,
        intent,
        locale,
        baseGuide: flowResult.guide,
        corpusTitle: resolved.title,
        matchConfidence: resolution.flowBest.score,
        corpusSettingsPaths: [],
      },
      deps.llm,
    );
    if (!polished.polished) return flowResult;
    const result = buildGuideCommandResult(intent, polished.guide);
    result.details = {
      ...flowResult.details,
      deterministic: false,
      llmPolished: true,
    };
    return initializeGuideMultiTurnResult(result, input.session?.context);
  }

  if (resolution.kind !== 'corpus' || !resolution.corpusBest) {
    return buildGuideClarifyResult(intent, resolution, input.route ?? null, {
      retrievalPath: resolution.retrievalPath,
      semanticScore: resolution.semanticScore,
    });
  }

  const deterministic = buildDeterministicGuideResult(
    intent,
    input,
    resolution.corpusBest,
    locale,
    resolution.retrievalPath,
  );
  if (!deterministic.success || !deterministic.guide || !deps?.llm) {
    return deterministic;
  }

  const topic = getGuideCorpusTopic(resolution.corpusBest.topicId as GuideCorpusTopicId);
  const resolved = topic
    ? resolveGuideCorpusTopic(resolution.corpusBest.topicId as GuideCorpusTopicId, messages)
    : null;
  if (!resolved) return deterministic;

  const polished = await polishGuideResponseWithLlm(
    {
      businessId: input.businessId,
      userId: input.userId,
      prompt: input.prompt,
      intent,
      locale,
      baseGuide: deterministic.guide,
      corpusTitle: resolved.title,
      matchConfidence: resolution.corpusBest.score,
      corpusSettingsPaths: extractSettingsPathsFromCorpusTopic(resolved),
    },
    deps.llm,
  );

  if (!polished.polished) {
    return deterministic;
  }

  const result = buildGuideCommandResult(intent, polished.guide);
  result.details = {
    ...deterministic.details,
    deterministic: false,
    llmPolished: true,
  };
  return initializeGuideMultiTurnResult(result, input.session?.context);
}

export function buildProductGuideLogicDeps(
  businessId: string,
  llm: LlmService,
  openAi: OpenAiGatewayService,
  userId?: string,
): ProductGuideLogicDeps {
  return {
    llm: {
      completeJson: llm.completeJson.bind(llm),
      isAvailableForBusiness: llm.isAvailableForBusiness.bind(llm),
    },
    semantic: {
      businessId,
      userId,
      embedText: openAi.embedText.bind(openAi),
      isEmbeddingAvailable: openAi.isAvailableForBusiness.bind(openAi),
    },
  };
}

export async function handleExplainAppFeatureLogicAsync(
  input: ProductGuideLogicInput,
  deps?: ProductGuideLogicDeps,
): Promise<CommandResult> {
  return handleProductGuideIntentLogicAsync('explain_app_feature', input, deps);
}

export async function handleGuideUserFlowLogicAsync(
  input: ProductGuideLogicInput,
  deps?: ProductGuideLogicDeps,
): Promise<CommandResult> {
  return handleProductGuideIntentLogicAsync('guide_user_flow', input, deps);
}

export async function handleExplainCurrentScreenLogicAsync(
  input: ProductGuideLogicInput,
  deps?: ProductGuideLogicDeps,
): Promise<CommandResult> {
  return handleProductGuideIntentLogicAsync('explain_current_screen', input, deps);
}

export function handleExplainAppFeatureLogic(
  input: ProductGuideLogicInput,
): CommandResult {
  return handleProductGuideIntentLogic('explain_app_feature', input);
}

export function handleGuideUserFlowLogic(
  input: ProductGuideLogicInput,
): CommandResult {
  return handleProductGuideIntentLogic('guide_user_flow', input);
}

export function handleExplainCurrentScreenLogic(
  input: ProductGuideLogicInput,
): CommandResult {
  return handleProductGuideIntentLogic('explain_current_screen', input);
}
