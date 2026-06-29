import { resolveLocale, type AppLocale } from '../../common/i18n/messages.js';
import type { LlmService } from '../../engine/agent/llm.service.js';
import type { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';
import type {
  CommandResult,
  GuideResponse,
  GuideStep,
} from './command-completion.types.js';
import { getFrontendGuideCorpusMessages } from './guide/ai-guide-corpus-i18n.fixtures.js';
import type { GuideCorpusTopic } from './guide/ai-guide-corpus.types.js';
import { buildDashboardGuideTopicUrl } from './guide/dashboard-guide-corpus.manifest.js';
import {
  getGuideCorpusTopic,
  resolveGuideCorpusTopic,
  type ResolvedGuideCorpusTopic,
} from './guide/ai-guide-corpus.util.js';
import type { GuideCorpusTopicId } from './guide/ai-guide-corpus.types.js';
import {
  buildGuideCommandResult,
  type AppGuideIntent,
} from './ai-product-guide.util.js';
import { enrichGuideResponseHandoffs } from './ai-product-guide-handoff.util.js';
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
  isGuideCorpusMatchConfident,
  pickBestGuideCorpusTopic,
  type ProductGuideRetrieveQuery,
} from './ai-product-guide-ranking.util.js';
import {
  resolveGuideCorpusMatch,
  type GuideCorpusSemanticDeps,
} from './ai-product-guide-semantic.util.js';

export interface ProductGuideLogicInput {
  businessId: string;
  prompt: string;
  params?: Record<string, unknown>;
  route?: string;
  role?: ProductGuideRetrieveQuery['role'];
  vertical?: string;
  locale?: string;
  userId?: string;
}

export interface ProductGuideLogicDeps {
  llm?: GuidePolishDeps;
  semantic?: GuideCorpusSemanticDeps;
}

function readTopicIdParam(params?: Record<string, unknown>): string | undefined {
  const topicId = params?.topicId;
  return typeof topicId === 'string' && topicId.trim() ? topicId.trim() : undefined;
}

function parseDashboardGuideNavigateUrl(url: string): { path: string; hash?: string } {
  const hashIndex = url.indexOf('#');
  if (hashIndex === -1) return { path: url };
  return {
    path: url.slice(0, hashIndex),
    hash: url.slice(hashIndex + 1),
  };
}

function resolveTopicNavigateTarget(
  topic: GuideCorpusTopic,
  topicId: GuideCorpusTopicId,
): GuideResponse['navigate'] {
  if (topic.navigate) {
    return { path: topic.navigate.path, hash: topic.navigate.hash };
  }
  return parseDashboardGuideNavigateUrl(buildDashboardGuideTopicUrl(topicId));
}

function resolveGuideLocale(locale?: string): AppLocale {
  return resolveLocale(locale);
}

export function buildGuideResponseFromCorpus(
  resolved: ResolvedGuideCorpusTopic,
  topic: GuideCorpusTopic,
): GuideResponse {
  const stepTexts = resolved.content
    .filter((row) => row.kind === 'step')
    .map((row) => row.text);

  const steps: GuideStep[] = stepTexts.map((body, index) => ({
    title: `Step ${index + 1}`,
    body,
    navigate:
      index === 0 && topic.navigate
        ? { path: topic.navigate.path, hash: topic.navigate.hash }
        : undefined,
  }));

  if (steps.length === 0 && resolved.bullets.length > 0) {
    resolved.bullets.forEach((body, index) => {
      steps.push({
        title: `Tip ${index + 1}`,
        body,
      });
    });
  }

  if (steps.length === 0) {
    steps.push({
      title: resolved.title,
      body: resolved.summary ?? resolved.body ?? resolved.title,
      navigate: topic.navigate
        ? { path: topic.navigate.path, hash: topic.navigate.hash }
        : undefined,
    });
  }

  const summary =
    resolved.summary ??
    resolved.body ??
    `${resolved.title}${stepTexts.length ? ` — ${stepTexts.length} steps` : ''}`;

  return {
    topicId: resolved.topicId,
    summary,
    steps,
    navigate: resolveTopicNavigateTarget(topic, resolved.topicId as GuideCorpusTopicId),
    sources: [
      {
        topicId: resolved.topicId,
        label: resolved.title,
        kind: 'topic',
      },
    ],
  };
}

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
    vertical: input.vertical,
    locale,
    topicId: readTopicIdParam(input.params),
  };
}

async function resolveBestGuideMatch(
  query: ProductGuideRetrieveQuery,
  messages: ReturnType<typeof getFrontendGuideCorpusMessages>,
  deps?: ProductGuideLogicDeps,
) {
  if (deps?.semantic) {
    return resolveGuideCorpusMatch(query, messages, deps.semantic);
  }

  const keywordBest = pickBestGuideCorpusTopic(query, messages);
  return {
    best: keywordBest,
    retrievalPath: 'keyword' as const,
    keywordBest,
    semanticBest: null,
  };
}

function buildDeterministicGuideResult(
  intent: AppGuideIntent,
  input: ProductGuideLogicInput,
  best: NonNullable<Awaited<ReturnType<typeof resolveBestGuideMatch>>['best']>,
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

  const guide = enrichGuideResponseHandoffs(
    buildGuideResponseFromCorpus(resolved, topic),
    { prompt: input.prompt, route: input.route, intent },
  );

  const grounding = verifyGuideResponseGrounding(guide);
  if (!grounding.ok) {
    return buildGuideGroundingClarifyResult(intent, grounding);
  }

  const result = buildGuideCommandResult(intent, guide);
  result.details = {
    ...result.details,
    confidence: best.score,
    matchReasons: best.reasons,
    locale,
    retrievalPath,
    deterministic: true,
  };
  return result;
}

/**
 * Sync keyword-only path — used by unit tests and when async deps are unavailable.
 */
export function handleProductGuideIntentLogic(
  intent: AppGuideIntent,
  input: ProductGuideLogicInput,
): CommandResult {
  const locale = resolveGuideLocale(input.locale);
  const messages = getFrontendGuideCorpusMessages(locale);
  const query = buildProductGuideQuery(intent, input, locale);

  const best = pickBestGuideCorpusTopic(query, messages);
  if (!best || !isGuideCorpusMatchConfident(best.score)) {
    return {
      success: false,
      action: intent,
      summary:
        'I could not match that to a guide topic yet. Try naming the page — Schedule, Operations, AI command bar — or open Help & guide from the sidebar.',
      details: {
        clarify: true,
        confidence: best?.score ?? 0,
        threshold: GUIDE_CORPUS_MATCH_THRESHOLD,
        suggestedTopicIds: best ? [best.topicId] : [],
        route: input.route ?? null,
      },
    };
  }

  return buildDeterministicGuideResult(intent, input, best, locale, 'keyword');
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
  const messages = getFrontendGuideCorpusMessages(locale);
  const query = buildProductGuideQuery(intent, input, locale);

  const resolution = await resolveBestGuideMatch(query, messages, deps);
  const best = resolution.best;

  if (!best || !isGuideCorpusMatchConfident(best.score)) {
    return {
      success: false,
      action: intent,
      summary:
        'I could not match that to a guide topic yet. Try naming the page — Schedule, Operations, AI command bar — or open Help & guide from the sidebar.',
      details: {
        clarify: true,
        confidence: best?.score ?? 0,
        threshold: GUIDE_CORPUS_MATCH_THRESHOLD,
        suggestedTopicIds: best ? [best.topicId] : [],
        route: input.route ?? null,
        retrievalPath: resolution.retrievalPath,
        semanticScore: resolution.semanticBest?.score ?? null,
      },
    };
  }

  const deterministic = buildDeterministicGuideResult(
    intent,
    input,
    best,
    locale,
    resolution.retrievalPath,
  );
  if (!deterministic.success || !deterministic.guide || !deps?.llm) {
    return deterministic;
  }

  const topic = getGuideCorpusTopic(best.topicId as GuideCorpusTopicId);
  const resolved = topic
    ? resolveGuideCorpusTopic(best.topicId as GuideCorpusTopicId, messages)
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
      matchConfidence: best.score,
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
  return result;
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
