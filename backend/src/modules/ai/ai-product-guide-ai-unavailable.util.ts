import { resolveLocale, type AppLocale } from '../../common/i18n/messages.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import type {
  CommandResult,
  GuideNavigateTarget,
  GuideResponse,
} from './command-completion.types.js';
import type { AiProductGuideService } from './ai-product-guide.service.js';
import {
  buildPostFailureGuideFallbackInput,
  resolvePostFailureGuideSnippet,
} from './ai-product-guide-failure-fallback.util.js';
import {
  resolveProductGuideSessionContext,
  type ProductGuideSessionContext,
} from './ai-product-guide-session.util.js';
import { runSurfaceProductGuideIntent } from './ai-product-guide-surface.logic.js';
import {
  inferProductGuideIntentFromPrompt,
  isProductGuidePrompt,
  resolveProductGuidePromptMatch,
  type AppGuideIntent,
} from './ai-product-guide.util.js';
import {
  readAssistantModeFromContext,
  shouldForceProductGuideRouting,
} from './ai-assistant-mode.util.js';
import { buildDashboardGuideTopicUrl } from './guide/dashboard-guide-corpus.manifest.js';
import { resolveGuideFlowRoutePrimaryTopic } from './guide/guide-flow.routes.manifest.js';
import type { GuideFlowSurface } from './guide/guide-flow.types.js';
import { META_PRODUCT_GUIDE_RESCUE_SCENARIOS } from './ai-meta-product-guide.fixtures.js';
import { runMetaProductGuideIntent } from './ai-meta-product-guide.util.js';
import {
  AI_UNAVAILABLE_GUIDE_PIPE_MARKER,
  PROVIDER_OFFLINE_GUIDE_TOPIC_ID,
  type AiUnavailableReason,
} from './ai-product-guide-ai-unavailable.fixtures.js';

export type { AiUnavailableReason } from './ai-product-guide-ai-unavailable.fixtures.js';

export interface AiUnavailableGuideFallbackInput {
  productGuide: AiProductGuideService;
  businessId: string;
  prompt: string;
  surface: GuideFlowSurface;
  reason: AiUnavailableReason;
  session?: { context?: Record<string, unknown> };
  locale?: string;
  userId?: string;
  params?: Record<string, unknown>;
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function buildAiUnavailableBannerSummary(
  reason: AiUnavailableReason,
  locale: AppLocale,
): string {
  if (reason === 'quota_exceeded') {
    return locale === 'hy'
      ? 'AI օգնականը այս ամիս quota-ի սահմանին է — ցույց եմ տալիս offline guide-ը։'
      : locale === 'ru'
        ? 'AI-помощник достиг месячного лимита — показываю офлайн-гид.'
        : 'The AI assistant hit this month’s quota — showing the offline guide instead.';
  }
  return locale === 'hy'
    ? 'AI օգնականը կարգավորված չէ — ցույց եմ տալիս offline guide-ը։'
    : locale === 'ru'
      ? 'AI-помощник не настроен — показываю офлайн-гид.'
      : 'The AI assistant is not configured — showing the offline guide instead.';
}

export function resolveNativeGuideNavigateTarget(
  surface: GuideFlowSurface,
  topicId?: string,
): GuideNavigateTarget {
  if (surface === 'dashboard') {
    if (topicId) {
      return { path: buildDashboardGuideTopicUrl(topicId) };
    }
    return { path: '/dashboard/guide' };
  }

  if (topicId) {
    return { path: 'guide', query: { topicId } };
  }
  return { path: 'guide' };
}

function matchesMetaGuidePromptForSurface(
  prompt: string,
  surface: GuideFlowSurface,
): (typeof META_PRODUCT_GUIDE_RESCUE_SCENARIOS)[number] | undefined {
  return META_PRODUCT_GUIDE_RESCUE_SCENARIOS.find(
    (scenario) => scenario.surface === surface && scenario.prompt.test(prompt),
  );
}

function resolveGuideTopicId(
  input: AiUnavailableGuideFallbackInput,
  sessionContext: ProductGuideSessionContext,
  intent: AppGuideIntent,
): string | undefined {
  const explicit = readString(input.params?.topicId);
  if (explicit) return explicit;
  const routeTopic = resolveGuideFlowRoutePrimaryTopic(sessionContext.route);
  if (routeTopic) return routeTopic;
  if (intent === 'explain_current_screen') return routeTopic;
  return undefined;
}

function appendProviderOfflineCacheStep(
  guide: GuideResponse,
  locale: AppLocale,
): GuideResponse {
  const navigate = resolveNativeGuideNavigateTarget(
    'provider',
    PROVIDER_OFFLINE_GUIDE_TOPIC_ID,
  );
  const title =
    locale === 'hy'
      ? 'Offline suggestion cache'
      : locale === 'ru'
        ? 'Офлайн-кэш подсказок'
        : 'Offline suggestion cache';
  const body =
    locale === 'hy'
      ? 'Today tab suggestion cards may show cached data while AI is offline — pull to refresh when you are back online. See Help & guide → AI assistant for details.'
      : locale === 'ru'
        ? 'Карточки подсказок на вкладке Today могут быть из кэша, пока AI недоступен — обновите, когда появится сеть. Подробнее: Справка → AI assistant.'
        : 'Today tab suggestion cards may use cached data while AI is offline — refresh when back online. Open Help & guide → AI assistant for details.';
  return {
    ...guide,
    steps: [
      ...guide.steps,
      {
        title,
        body,
        navigate,
      },
    ],
    navigate: guide.navigate ?? navigate,
  };
}

function wrapAiUnavailableGuideResult(
  result: CommandResult,
  input: AiUnavailableGuideFallbackInput,
  sessionContext: ProductGuideSessionContext,
  topicId?: string,
): CommandResult {
  const locale = resolveLocale(input.locale ?? sessionContext.locale);
  const banner = buildAiUnavailableBannerSummary(input.reason, locale);
  if (!result.guide) {
    const navigate = resolveNativeGuideNavigateTarget(input.surface, topicId);
    return {
      success: true,
      action: result.action === 'error' ? 'explain_app_feature' : result.action,
      summary: `${banner} ${result.summary}`.trim(),
      guide: {
        topicId: topicId ?? 'guide.offline-fallback',
        summary: banner,
        voiceSummary: banner,
        steps: [
          {
            title:
              locale === 'hy'
                ? 'Բացեք Help & guide'
                : locale === 'ru'
                  ? 'Откройте Help & guide'
                  : 'Open Help & guide',
            body:
              locale === 'hy'
                ? 'Բացեք static guide էcranը՝ ամբողջական քայլերով։'
                : locale === 'ru'
                  ? 'Откройте статический экран справки с полными шагами.'
                  : 'Open the static guide screen for the full walkthrough.',
            navigate,
          },
        ],
        navigate,
        sources: [
          { topicId: topicId ?? 'guide.offline-fallback', kind: 'static' },
        ],
      },
      details: {
        ...result.details,
        aiUnavailableFallback: true,
        aiUnavailableReason: input.reason,
        retrievalPath: 'ai-unavailable-static-guide',
        pipeMarker: AI_UNAVAILABLE_GUIDE_PIPE_MARKER,
        deterministic: true,
      },
    };
  }

  const navigate =
    result.guide.navigate ??
    resolveNativeGuideNavigateTarget(
      input.surface,
      result.guide.topicId ?? topicId,
    );
  let guide: GuideResponse = {
    ...result.guide,
    summary: `${banner} ${result.guide.summary}`.trim(),
    voiceSummary: result.guide.voiceSummary ?? result.guide.summary,
    navigate,
    steps: result.guide.steps.map((step, index) =>
      index === 0 && !step.navigate ? { ...step, navigate } : step,
    ),
  };
  if (input.surface === 'provider') {
    guide = appendProviderOfflineCacheStep(guide, locale);
  }

  return {
    ...result,
    success: true,
    summary: guide.summary,
    guide,
    details: {
      ...result.details,
      aiUnavailableFallback: true,
      aiUnavailableReason: input.reason,
      retrievalPath: 'ai-unavailable-static-guide',
      pipeMarker: AI_UNAVAILABLE_GUIDE_PIPE_MARKER,
      deterministic: true,
      nativeGuideNavigate: navigate,
    },
  };
}

export function shouldOfferAiUnavailableGuideFallback(
  prompt: string,
  surface: CommandSurface,
  session?: { context?: Record<string, unknown> },
): boolean {
  const assistantMode = readAssistantModeFromContext(session?.context);
  if (shouldForceProductGuideRouting(assistantMode)) return true;
  if (isProductGuidePrompt(prompt, { surface })) return true;
  if (
    resolveProductGuidePromptMatch(prompt, { surface, assistantMode }).matched
  ) {
    return true;
  }
  return !!matchesMetaGuidePromptForSurface(prompt, surface);
}

export async function runAiUnavailableStaticGuideFallback(
  input: AiUnavailableGuideFallbackInput,
): Promise<CommandResult | null> {
  if (
    !shouldOfferAiUnavailableGuideFallback(
      input.prompt,
      input.surface,
      input.session,
    )
  ) {
    return null;
  }

  const sessionContext = resolveProductGuideSessionContext(
    input.session,
    input.surface,
  );
  const assistantMode = readAssistantModeFromContext(input.session?.context);
  const guideMatch = resolveProductGuidePromptMatch(input.prompt, {
    surface: input.surface,
    assistantMode,
  });
  const intent =
    guideMatch.intent ?? inferProductGuideIntentFromPrompt(input.prompt);
  const topicId = resolveGuideTopicId(input, sessionContext, intent);
  const metaGuideScenario = matchesMetaGuidePromptForSurface(
    input.prompt,
    input.surface,
  );

  const guideResult = metaGuideScenario
    ? await runMetaProductGuideIntent({
        productGuide: input.productGuide,
        businessId: input.businessId,
        prompt: input.prompt,
        metaIntent: metaGuideScenario.intent,
        surface: input.surface,
        locale: input.locale ?? sessionContext.locale,
        userId: input.userId,
        params: {
          ...input.params,
          ...(topicId ? { topicId } : {}),
        },
        session: input.session,
        sessionContext,
      })
    : await runSurfaceProductGuideIntent({
        productGuide: input.productGuide,
        businessId: input.businessId,
        prompt: input.prompt,
        intent,
        surface: input.surface,
        locale: input.locale ?? sessionContext.locale,
        userId: input.userId,
        params: {
          ...input.params,
          ...(topicId ? { topicId } : {}),
        },
        session: input.session,
        sessionContext,
      });

  if (guideResult.success && guideResult.guide) {
    return wrapAiUnavailableGuideResult(
      guideResult,
      input,
      sessionContext,
      topicId,
    );
  }

  const snippet = resolvePostFailureGuideSnippet(
    buildPostFailureGuideFallbackInput(
      input.session,
      input.surface,
      input.locale,
    ),
  );
  if (snippet) {
    return wrapAiUnavailableGuideResult(
      {
        success: true,
        action: intent,
        summary: snippet.snippetLine,
        guide: snippet.guide,
        details: {},
      },
      input,
      sessionContext,
      snippet.guide.topicId ?? topicId,
    );
  }

  return wrapAiUnavailableGuideResult(
    {
      success: true,
      action: intent,
      summary: buildAiUnavailableBannerSummary(
        input.reason,
        resolveLocale(input.locale ?? sessionContext.locale),
      ),
      details: {},
    },
    input,
    sessionContext,
    topicId,
  );
}

export function buildAiUnavailableErrorWithGuideLink(input: {
  surface: GuideFlowSurface;
  reason: AiUnavailableReason;
  locale?: string;
  route?: string;
}): CommandResult {
  const locale = resolveLocale(input.locale);
  const topicId = resolveGuideFlowRoutePrimaryTopic(input.route);
  const navigate = resolveNativeGuideNavigateTarget(input.surface, topicId);
  const summary =
    input.reason === 'quota_exceeded'
      ? locale === 'hy'
        ? 'AI quota-ն լրացել է այս ամիս։'
        : locale === 'ru'
          ? 'Исчерпан месячный лимит AI.'
          : 'Monthly AI quota exceeded.'
      : locale === 'hy'
        ? 'AI օգնականը կարգավորված չէ։'
        : locale === 'ru'
          ? 'AI-помощник не настроен.'
          : 'AI assistant is not configured.';
  return {
    success: false,
    action: 'error',
    summary,
    guide: {
      topicId: topicId ?? 'guide.offline-fallback',
      summary,
      steps: [
        {
          title:
            locale === 'hy'
              ? 'Բացեք Help & guide'
              : locale === 'ru'
                ? 'Справка'
                : 'Open Help & guide',
          body:
            locale === 'hy'
              ? 'Օգտագործեք static guide էcranը՝ առանց AI-ի։'
              : locale === 'ru'
                ? 'Используйте статический экран справки без AI.'
                : 'Use the static guide screen without AI.',
          navigate,
        },
      ],
      navigate,
    },
    details: {
      aiUnavailableReason: input.reason,
      pipeMarker: AI_UNAVAILABLE_GUIDE_PIPE_MARKER,
      nativeGuideNavigate: navigate,
    },
  };
}
