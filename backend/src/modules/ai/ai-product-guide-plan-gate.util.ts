import { resolveLocale, type AppLocale } from '../../common/i18n/messages.js';
import {
  getLimitsForTier,
  PLAN_LIMIT_MESSAGES,
  UPGRADE_PLAN_ID,
  type PlanFeatureFlag,
  type PlanTierId,
} from '../billing/plan-limits.js';
import type {
  CommandResult,
  GuideResponse,
} from './command-completion.types.js';
import { getFrontendGuideCorpusMessages } from './guide/ai-guide-corpus-i18n.fixtures.js';
import {
  buildGuideFlowListContext,
  rankGuideFlowPlaybookDefs,
  resolveGuideFlowPlaybook,
} from './guide/guide-flow.corpus.util.js';
import { listAllGuideFlowPlaybookDefs } from './guide/guide-flow.loader.js';
import {
  GUIDE_MODULE_PLAN_FLAGS,
  isGuideFlowPlaybookEntitlementAllowed,
  isGuideFlowPlaybookPlanAllowed,
  isGuideFlowPlaybookRoleVerticalVisible,
  isGuideModuleEnabledByPlan,
  mergeGuideFlowPlaybooks,
  resolveActiveGuideVerticalOverlays,
  resolveGuideFlowPlanTier,
} from './guide/guide-flow.merge.util.js';
import { resolveGuideFlowRoutePrimaryTopic } from './guide/guide-flow.routes.manifest.js';
import type {
  GuideFlowListContext,
  GuideFlowPlaybookDef,
} from './guide/guide-flow.types.js';
import type { ProductGuideLogicInput } from './ai-product-guide.logic.js';
import { resolveGuideFlowSurfaceFromRoute } from './guide/guide-flow.merge.util.js';
import type { ProductGuideRetrieveQuery } from './ai-product-guide-ranking.util.js';
import {
  buildGuideCommandResult,
  type AppGuideIntent,
} from './ai-product-guide.util.js';

export const GUIDE_PLAN_GATE_PIPE_MARKER = 'ai-guide-1.8.4';

export type GuidePlaybookGateReason = 'plan' | 'module';

export interface GuidePlaybookGateDetails {
  allowed: boolean;
  reason?: GuidePlaybookGateReason;
  currentPlanTierId: PlanTierId;
  requiredPlan?: PlanTierId;
  requiredModule?: string;
  upgradePlanId: string;
  summary: string;
  featureLabel: string;
}

function readTopicIdParam(
  params?: Record<string, unknown>,
): string | undefined {
  const topicId = params?.topicId;
  return typeof topicId === 'string' && topicId.trim()
    ? topicId.trim()
    : undefined;
}

function readPlanTierId(session?: {
  context?: Record<string, unknown>;
}): PlanTierId {
  const raw = session?.context?._planTierId ?? session?.context?.planTierId;
  if (raw === 'starter' || raw === 'business' || raw === 'solo') return raw;
  return 'solo';
}

export function buildGuideFlowListContextFromInput(
  input: ProductGuideLogicInput,
): GuideFlowListContext {
  const query = buildProductGuideQueryFromInput(input);
  return {
    ...buildGuideFlowListContext(query),
    planTierId: readPlanTierId(input.session),
  };
}

function buildProductGuideQueryFromInput(
  input: ProductGuideLogicInput,
): ProductGuideRetrieveQuery {
  return {
    prompt: input.prompt,
    intent: 'guide_user_flow',
    route: input.route,
    role: input.role,
    roleProfile: input.roleProfile,
    vertical: input.vertical,
    locale: input.locale,
    topicId: readTopicIdParam(input.params),
    retailPosEnabled: input.retailPosEnabled,
    enabledModules: input.enabledModules,
    surface:
      input.surface ??
      resolveGuideFlowSurfaceFromRoute(input.route) ??
      'dashboard',
    planTierId: readPlanTierId(input.session),
  };
}

export function findGuideFlowPlaybookByTopicId(
  topicId: string,
): GuideFlowPlaybookDef | undefined {
  return listAllGuideFlowPlaybookDefs().find(
    (row) => row.topicId === topicId || row.corpusTopicId === topicId,
  );
}

function resolveUpgradePlanId(requiredPlan?: PlanTierId): string {
  if (requiredPlan === 'business') return 'business';
  return UPGRADE_PLAN_ID;
}

function resolveRequiredPlanForModule(
  playbook: GuideFlowPlaybookDef,
): PlanTierId | undefined {
  if (playbook.requiresPlan) return playbook.requiresPlan;
  for (const moduleId of playbook.requiresModule ?? []) {
    const tiers: PlanTierId[] = ['solo', 'starter', 'business'];
    for (const tierId of tiers) {
      if (isGuideModuleEnabledByPlan(moduleId, tierId)) return tierId;
    }
  }
  return undefined;
}

function resolveModuleLimitMessage(moduleId: string): string | undefined {
  const flag = GUIDE_MODULE_PLAN_FLAGS[moduleId] as PlanFeatureFlag | undefined;
  return flag ? PLAN_LIMIT_MESSAGES[flag] : undefined;
}

export function describeGuidePlaybookGate(
  playbook: GuideFlowPlaybookDef,
  ctx: GuideFlowListContext,
  locale: AppLocale,
  messages: ReturnType<typeof getFrontendGuideCorpusMessages>,
): GuidePlaybookGateDetails {
  const currentPlanTierId = resolveGuideFlowPlanTier(ctx);
  const resolved = resolveGuideFlowPlaybook(playbook, messages);
  const featureLabel = resolved.title.trim();
  const currentPlanName = getLimitsForTier(currentPlanTierId).tierName;

  if (
    !isGuideFlowPlaybookPlanAllowed(playbook, currentPlanTierId) &&
    playbook.requiresPlan
  ) {
    const requiredPlan = playbook.requiresPlan;
    const requiredPlanName = getLimitsForTier(requiredPlan).tierName;
    return {
      allowed: false,
      reason: 'plan',
      currentPlanTierId,
      requiredPlan,
      upgradePlanId: resolveUpgradePlanId(requiredPlan),
      featureLabel,
      summary:
        locale === 'hy'
          ? `${featureLabel} հասանելի չէ ձեր ${currentPlanName} պլանում։ Անցեք ${requiredPlanName} պլանին՝ այն ակտիվացնելու համար։`
          : locale === 'ru'
            ? `${featureLabel} недоступен на вашем тарифе ${currentPlanName}. Перейдите на тариф ${requiredPlanName}, чтобы открыть эту функцию.`
            : `${featureLabel} is not available on your ${currentPlanName} plan. Upgrade to ${requiredPlanName} to unlock it.`,
    };
  }

  const blockedModule = (playbook.requiresModule ?? []).find(
    (moduleId) => !isGuideModuleEnabledByPlan(moduleId, currentPlanTierId),
  );
  if (blockedModule) {
    const requiredPlan = resolveRequiredPlanForModule(playbook) ?? 'business';
    const moduleMessage = resolveModuleLimitMessage(blockedModule);
    return {
      allowed: false,
      reason: 'module',
      currentPlanTierId,
      requiredPlan,
      requiredModule: blockedModule,
      upgradePlanId: resolveUpgradePlanId(requiredPlan),
      featureLabel,
      summary:
        moduleMessage ??
        (locale === 'hy'
          ? `${featureLabel} հասանելի չէ ձեր ${currentPlanName} պլանում։`
          : locale === 'ru'
            ? `${featureLabel} недоступен на вашем тарифе ${currentPlanName}.`
            : `${featureLabel} is not available on your ${currentPlanName} plan.`),
    };
  }

  const settingsBlockedModule = (playbook.requiresModule ?? []).find(
    (moduleId) =>
      isGuideModuleEnabledByPlan(moduleId, currentPlanTierId) &&
      Array.isArray(ctx.enabledModules) &&
      ctx.enabledModules.length > 0 &&
      !ctx.enabledModules.includes(moduleId),
  );
  if (settingsBlockedModule) {
    return {
      allowed: false,
      reason: 'module',
      currentPlanTierId,
      requiredModule: settingsBlockedModule,
      upgradePlanId: resolveUpgradePlanId(
        resolveRequiredPlanForModule(playbook),
      ),
      featureLabel,
      summary:
        locale === 'hy'
          ? `${featureLabel} դեռ միացված չէ ձեր բիզնեսի կարգավորումներում։`
          : locale === 'ru'
            ? `${featureLabel} ещё не включён в настройках вашего бизнеса.`
            : `${featureLabel} is not enabled in your business settings yet.`,
    };
  }

  return {
    allowed: true,
    currentPlanTierId,
    upgradePlanId: UPGRADE_PLAN_ID,
    featureLabel,
    summary: resolved.summary ?? featureLabel,
  };
}

function resolveBillingNavigateTarget(): GuideResponse['navigate'] {
  return { path: '/dashboard/billing' };
}

export function buildPlanGatedGuideResponse(
  playbook: GuideFlowPlaybookDef,
  gate: GuidePlaybookGateDetails,
  locale: AppLocale,
  messages: ReturnType<typeof getFrontendGuideCorpusMessages>,
): GuideResponse {
  const resolved = resolveGuideFlowPlaybook(playbook, messages);
  const upgradeTitle =
    locale === 'hy'
      ? 'Թարմացրեք պլանը'
      : locale === 'ru'
        ? 'Обновите тариф'
        : 'Upgrade your plan';
  const upgradeBody =
    locale === 'hy'
      ? 'Բացեք Billing էջը՝ պլանը թարմացնելու և այս գործառույթը ակտիվացնելու համար։'
      : locale === 'ru'
        ? 'Откройте страницу Billing, чтобы обновить тариф и включить эту функцию.'
        : 'Open Billing to upgrade your plan and unlock this feature.';
  const previewBody =
    resolved.steps[0]?.body ?? resolved.summary ?? gate.featureLabel;

  return {
    topicId: playbook.topicId,
    summary: gate.summary,
    voiceSummary: gate.summary,
    steps: [
      {
        title: upgradeTitle,
        body: upgradeBody,
        navigate: resolveBillingNavigateTarget(),
      },
      {
        title:
          locale === 'hy'
            ? 'Ինչ կստանաք'
            : locale === 'ru'
              ? 'Что вы получите'
              : "What you'll unlock",
        body: previewBody,
      },
    ],
    navigate: resolveBillingNavigateTarget(),
    sources: [
      {
        topicId: playbook.corpusTopicId ?? playbook.topicId,
        label: resolved.title,
        kind: 'playbook',
      },
    ],
  };
}

export function buildPlanGatedGuideCommandResult(
  intent: AppGuideIntent,
  playbook: GuideFlowPlaybookDef,
  gate: GuidePlaybookGateDetails,
  input: ProductGuideLogicInput,
  locale: AppLocale,
): CommandResult {
  const messages = getFrontendGuideCorpusMessages(locale);
  const guide = buildPlanGatedGuideResponse(playbook, gate, locale, messages);
  const result = buildGuideCommandResult(intent, guide);
  result.details = {
    ...result.details,
    guidePlanGated: true,
    guideGateReason: gate.reason,
    currentPlanTierId: gate.currentPlanTierId,
    requiredPlan: gate.requiredPlan,
    requiredModule: gate.requiredModule,
    upgradePlanId: gate.upgradePlanId,
    retrievalPath: 'guide-plan-gate',
    deterministic: true,
    pipeMarker: GUIDE_PLAN_GATE_PIPE_MARKER,
  };
  return result;
}

function collectGateCandidateTopicIds(
  input: ProductGuideLogicInput,
  ctx: GuideFlowListContext,
  locale: AppLocale,
): string[] {
  const candidates: string[] = [];
  const explicit = readTopicIdParam(input.params);
  if (explicit) candidates.push(explicit);

  const routePrimary = resolveGuideFlowRoutePrimaryTopic(input.route);
  if (routePrimary) candidates.push(routePrimary);

  const query = buildProductGuideQueryFromInput(input);
  const messages = getFrontendGuideCorpusMessages(locale);
  const activeVerticals = resolveActiveGuideVerticalOverlays(ctx);
  const roleVisiblePlaybooks = listAllGuideFlowPlaybookDefs().filter(
    (playbook) =>
      isGuideFlowPlaybookRoleVerticalVisible(playbook, ctx, activeVerticals),
  );
  const ranked = rankGuideFlowPlaybookDefs(
    roleVisiblePlaybooks,
    { ...query, topicId: undefined },
    messages,
  );
  if (ranked[0]?.score >= 0.55) {
    candidates.push(ranked[0].topicId);
  }

  return [...new Set(candidates)];
}

export function tryResolvePlanGatedGuideResult(
  intent: AppGuideIntent,
  input: ProductGuideLogicInput,
  localeInput?: string,
): CommandResult | null {
  const locale = resolveLocale(localeInput ?? input.locale);
  const ctx = buildGuideFlowListContextFromInput(input);
  const messages = getFrontendGuideCorpusMessages(locale);
  const activeVerticals = resolveActiveGuideVerticalOverlays(ctx);

  for (const topicId of collectGateCandidateTopicIds(input, ctx, locale)) {
    const playbook = findGuideFlowPlaybookByTopicId(topicId);
    if (!playbook) continue;
    if (!isGuideFlowPlaybookRoleVerticalVisible(playbook, ctx, activeVerticals))
      continue;
    if (isGuideFlowPlaybookEntitlementAllowed(playbook, ctx)) continue;

    const gate = describeGuidePlaybookGate(playbook, ctx, locale, messages);
    if (gate.allowed) continue;
    return buildPlanGatedGuideCommandResult(
      intent,
      playbook,
      gate,
      input,
      locale,
    );
  }

  return null;
}

export function listVisibleGuideFlowPlaybooks(ctx: GuideFlowListContext) {
  return mergeGuideFlowPlaybooks(ctx);
}
