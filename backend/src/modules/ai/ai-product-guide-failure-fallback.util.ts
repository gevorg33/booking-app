import { resolveLocale, type AppLocale } from '../../common/i18n/messages.js';
import type { CommandSurface } from './ai-command-registry.types.js';
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
import {
  buildGuideFlowListContext,
  buildGuideResponseFromFlowPlaybook,
  resolveGuideFlowPlaybook,
} from './guide/guide-flow.corpus.util.js';
import { mergeGuideFlowPlaybooks } from './guide/guide-flow.merge.util.js';
import { resolveGuideFlowRoutePrimaryTopic } from './guide/guide-flow.routes.manifest.js';
import { buildGuideResponseFromCorpus } from './ai-product-guide-corpus-response.util.js';
import { CUSTOMER_APP_GUIDE_ROUTES } from './ai-customer-product-guide.util.js';
import { PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES } from './ai-public-booking-guide.util.js';
import { matchSimilarAppGuideTopicFromPrompt } from './ai-product-guide-rescue.util.js';
import { resolveProductGuideSessionContext } from './ai-product-guide-session.util.js';
import type { GuideFlowRoleScope } from './guide/guide-flow.types.js';
import type { AccessTier } from './access-control.matrix.js';
import { isAppGuideIntent } from './ai-product-guide.util.js';

export const POST_FAILURE_GUIDE_FALLBACK_PIPE_MARKER = 'ai-guide-1.8.3';

const MAX_FALLBACK_STEPS = 2;

export type PostFailureGuideFallbackInput = {
  surface: CommandSurface;
  route?: string;
  locale?: string;
  role?: AccessTier;
  roleProfile?: GuideFlowRoleScope;
  vertical?: string;
  retailPosEnabled?: boolean;
  enabledModules?: readonly string[];
  /** Original user prompt — used to score a relevant topic before route default (e2e-bug.53). */
  prompt?: string;
};

export function buildPostFailureGuideFallbackInput(
  session:
    | { context?: Record<string, unknown> }
    | Record<string, unknown>
    | undefined,
  surface: CommandSurface,
  locale?: string,
  prompt?: string,
): PostFailureGuideFallbackInput {
  const sessionObj =
    session && typeof session === 'object' && 'context' in session
      ? (session as { context?: Record<string, unknown> })
      : { context: session };
  const ctx = resolveProductGuideSessionContext(sessionObj, surface);
  return {
    surface: ctx.surface ?? surface,
    route: ctx.route,
    locale: locale ?? ctx.locale,
    role: ctx.role,
    roleProfile: ctx.roleProfile,
    vertical: ctx.vertical,
    retailPosEnabled: ctx.retailPosEnabled,
    enabledModules: ctx.enabledModules,
    prompt,
  };
}

/**
 * e2e-bug.53 — home/overview defaults are not real page grounding for guide
 * snippets. Attaching consumer-tabs / public-booking-funnel for every unknown
 * prompt made free-text chat look broken.
 */
export function isWeakDefaultGuideFallbackRoute(
  route: string | undefined,
  surface: CommandSurface,
): boolean {
  if (!route?.trim()) return true;
  const normalized = route.trim().replace(/\/+$/, '') || '/';
  if (surface === 'customer') {
    return (
      normalized === CUSTOMER_APP_GUIDE_ROUTES.tabs ||
      normalized === '/s/home' ||
      normalized === '/consumer'
    );
  }
  if (surface === 'public') {
    return normalized === PUBLIC_BOOKING_FUNNEL_GUIDE_ROUTES.overview;
  }
  return false;
}

export function shouldAppendPostFailureGuideFallback(
  result: Pick<CommandResult, 'success' | 'action' | 'guide' | 'details'>,
): boolean {
  if (result.success) return false;
  if (result.guide?.steps?.length) return false;

  const details = result.details ?? {};
  if (details.guideFallbackApplied === true) return false;

  const action = result.action;
  if (!action || action === 'error' || action === 'security_blocked')
    return false;
  if (isAppGuideIntent(action)) return false;

  if (
    action === 'unknown' ||
    details.needsClarification === true ||
    details.pipelineStage === 'unknown_intent_clarify' ||
    details.pipelineStage === 'self_verify_clarify'
  ) {
    return true;
  }

  return result.success === false;
}

function formatPostFailureGuideLine(
  locale: AppLocale,
  taskLabel: string,
  stepBody: string,
): string {
  const trimmedBody = stepBody.trim();
  if (locale === 'hy') {
    return `Ահա ինչպես ${taskLabel} այս էջում. ${trimmedBody}`;
  }
  if (locale === 'ru') {
    return `Вот как ${taskLabel} на этой странице: ${trimmedBody}`;
  }
  return `Here's how to ${taskLabel} on this page: ${trimmedBody}`;
}

function trimGuideForFallback(
  guide: GuideResponse,
  snippetLine: string,
): GuideResponse {
  return {
    ...guide,
    summary: snippetLine,
    steps: guide.steps.slice(0, MAX_FALLBACK_STEPS),
  };
}

export function resolvePostFailureGuideSnippet(
  input: PostFailureGuideFallbackInput,
): { snippetLine: string; guide: GuideResponse } | null {
  const locale = resolveLocale(input.locale);
  // e2e-bug.53 — prefer prompt-scored topic; never use weak home/overview defaults alone.
  const scoredTopicId = input.prompt?.trim()
    ? matchSimilarAppGuideTopicFromPrompt(input.prompt, input.surface)
    : undefined;
  const routeTopicId = resolveGuideFlowRoutePrimaryTopic(input.route);
  const topicId =
    scoredTopicId ??
    (isWeakDefaultGuideFallbackRoute(input.route, input.surface)
      ? undefined
      : (routeTopicId ?? undefined));
  if (!topicId) return null;

  const messages = getFrontendGuideCorpusMessages(locale);
  const ctx = buildGuideFlowListContext({
    prompt: input.prompt ?? '',
    intent: 'explain_current_screen',
    route: input.route,
    role: input.role,
    roleProfile: input.roleProfile,
    vertical: input.vertical,
    locale,
    topicId,
    retailPosEnabled: input.retailPosEnabled,
    enabledModules: input.enabledModules,
    surface: input.surface,
  });

  const playbooks = mergeGuideFlowPlaybooks(ctx);
  const playbook =
    playbooks.find(
      (row) => row.topicId === topicId || row.corpusTopicId === topicId,
    ) ?? null;

  if (playbook) {
    const resolved = resolveGuideFlowPlaybook(playbook, messages);
    const firstStep = resolved.steps[0];
    if (!firstStep?.body?.trim()) return null;
    const taskLabel = resolved.title.trim().toLowerCase();
    const snippetLine = formatPostFailureGuideLine(
      locale,
      taskLabel,
      firstStep.body,
    );
    return {
      snippetLine,
      guide: trimGuideForFallback(
        buildGuideResponseFromFlowPlaybook(resolved),
        snippetLine,
      ),
    };
  }

  const topic = getGuideCorpusTopic(topicId);
  if (!topic) return null;
  const resolvedTopic = resolveGuideCorpusTopic(topicId, messages);
  if (!resolvedTopic) return null;

  const corpusGuide = buildGuideResponseFromCorpus(resolvedTopic, topic);
  const firstStep = corpusGuide.steps[0];
  const body =
    firstStep?.body?.trim() ||
    resolvedTopic.summary?.trim() ||
    resolvedTopic.body?.trim();
  if (!body) return null;

  const taskLabel = resolvedTopic.title.trim().toLowerCase();
  const snippetLine = formatPostFailureGuideLine(locale, taskLabel, body);
  return {
    snippetLine,
    guide: trimGuideForFallback(corpusGuide, snippetLine),
  };
}

export function appendPostFailureGuideFallback(
  result: CommandResult,
  input: PostFailureGuideFallbackInput,
): CommandResult {
  if (!shouldAppendPostFailureGuideFallback(result)) return result;

  const fallback = resolvePostFailureGuideSnippet(input);
  if (!fallback) return result;

  const baseSummary = result.summary.trim();
  const summary = baseSummary
    ? `${baseSummary}\n\n${fallback.snippetLine}`
    : fallback.snippetLine;

  return {
    ...result,
    summary,
    guide: fallback.guide,
    details: {
      ...result.details,
      guideFallbackApplied: true,
      guideFallbackTopicId: fallback.guide.topicId,
      guideFallbackSurface: input.surface,
      retrievalPath: 'guide-failure-fallback',
      pipeMarker: POST_FAILURE_GUIDE_FALLBACK_PIPE_MARKER,
    },
  };
}
