import type { CommandSurface } from './ai-command-registry.types.js';
import type { AssistantMode } from './ai-assistant-mode.util.js';
import {
  enrichCustomerGuideTopicFromPrompt,
  rescueCustomerAppGuideIntent,
  type ConsumerActivationStep,
} from './ai-customer-product-guide.util.js';
import {
  enrichPublicBookingGuideTopicFromPrompt,
  rescuePublicBookingHelpIntent,
} from './ai-public-booking-guide.util.js';
import {
  isProviderProductGuideIntent,
  rescueProviderProductGuideIntent,
} from './ai-provider-product-guide.util.js';
import { rescueMetaProductGuideIntent } from './ai-meta-product-guide.util.js';
import { rescueEmptyStateGuideIntent } from './ai-product-guide-empty-state.util.js';
import {
  hasActiveGuideMultiTurnSession,
  detectGuideNavigationIntent,
} from './ai-product-guide-multiturn.util.js';
import { resolveGuideFlowRoutePrimaryTopic } from './guide/guide-flow.routes.manifest.js';
import { SIMILAR_APP_GUIDE_PROMPTS } from './similar-app-guide-prompts.generated.js';
import {
  rescueProductGuideMisroute,
  resolveProductGuidePromptMatch,
} from './ai-product-guide.util.js';
import { isMyStatsPrompt } from './ai-provider-exp-2.util.js';

export interface ProductGuideRescueOptions {
  surface: CommandSurface;
  assistantMode?: AssistantMode;
  route?: string;
  context?: Record<string, unknown>;
}

export interface ProductGuideRescueResult {
  action: string;
  rescueReason?: string;
}

export interface EnrichGuideTopicOptions {
  surface: CommandSurface;
  route?: string;
  topicId?: unknown;
  activationStep?: ConsumerActivationStep;
  providerIntent?: string;
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function normalizeGuidePrompt(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Match SIMILAR_APP_GUIDE_PROMPTS corpus (ai-guide-1.6.2) for deterministic topicId. */
export function matchSimilarAppGuideTopicFromPrompt(
  prompt: string,
  surface: CommandSurface,
): string | undefined {
  const norm = normalizeGuidePrompt(prompt);
  if (!norm) return undefined;

  for (const row of SIMILAR_APP_GUIDE_PROMPTS) {
    if (row.surface !== surface) continue;
    if (normalizeGuidePrompt(row.prompt) === norm) return row.topicId;
  }

  const promptTokens = new Set(norm.split(' ').filter((t) => t.length > 2));
  if (promptTokens.size === 0) return undefined;

  let best: { topicId: string; score: number } | undefined;
  for (const row of SIMILAR_APP_GUIDE_PROMPTS) {
    if (row.surface !== surface) continue;
    const rowTokens = normalizeGuidePrompt(row.prompt)
      .split(' ')
      .filter((t) => t.length > 2);
    if (rowTokens.length === 0) continue;
    let overlap = 0;
    for (const token of rowTokens) {
      if (promptTokens.has(token)) overlap += 1;
    }
    const score = overlap / rowTokens.length;
    if (score >= 0.55 && (!best || score > best.score)) {
      best = { topicId: row.topicId, score };
    }
  }
  return best?.topicId;
}

function enrichDashboardGuideTopicFromPrompt(
  prompt: string,
  route?: string,
  topicId?: unknown,
): string | undefined {
  // e2e-bug — the model's own topicId arg is frequently just copied from the tool
  // schema's example text (or carried over from an unrelated earlier turn) rather
  // than reflecting the actual question, so every deterministic signal derived from
  // the CURRENT prompt/route is tried first. The explicit value is only used as a
  // last resort, for legitimate multi-turn nav phrases ("next step") that have no
  // topic-specific wording for anything below to match against.
  const fromSimilar = matchSimilarAppGuideTopicFromPrompt(prompt, 'dashboard');
  if (fromSimilar) return fromSimilar;

  const primary = resolveGuideFlowRoutePrimaryTopic(route);
  if (primary?.startsWith('dashboard.')) return primary;

  const lower = prompt.toLowerCase();
  if (/\b(ai\s+ops|accuracy|misclassified\s+prompts?)\b/i.test(lower)) {
    return 'dashboard.ai.ops';
  }
  if (/\b(command\s+bar|orchestrix\s+ai|sparkle)\b/i.test(lower)) {
    return 'dashboard.ai.command-bar';
  }
  if (/\b(approval|approve\s+ai|plan\s+diff)\b/i.test(lower)) {
    return 'dashboard.ai.approval';
  }
  if (/\b(schedule|shift|template|time.?off|weekly\s+hours)\b/i.test(lower)) {
    return 'dashboard.core.schedule';
  }
  if (/\b(calendar|appointment\s+view|day\s+view)\b/i.test(lower)) {
    return 'dashboard.core.calendar';
  }
  if (
    /\b(staff|employee|stylist|team\s+member|invite\s+staff)\b/i.test(lower)
  ) {
    return 'dashboard.core.employees';
  }
  if (/\b(inventory|stock|retail\s+products?|products?)\b/i.test(lower)) {
    return 'dashboard.operations.inventory';
  }
  if (/\b(commission|payroll)\b/i.test(lower)) {
    return 'dashboard.operations.commissions';
  }
  if (/\b(p\s*&?\s*l|profit\s+and\s+loss|profit\s+loss)\b/i.test(lower)) {
    return 'dashboard.operations.pl';
  }
  if (/\b(operations|workflow|front.?desk)\b/i.test(lower)) {
    return 'dashboard.operations.overview';
  }

  const explicit = readString(topicId);
  if (explicit) return explicit;

  return primary;
}

function enrichProviderGuideTopicFromPrompt(
  prompt: string,
  route?: string,
  topicId?: unknown,
  providerIntent?: string,
): string | undefined {
  const explicit = readString(topicId);
  if (explicit) return explicit;

  const lower = prompt.toLowerCase();

  // e2e-bug.302 — Home/Today tab how-to (EN/HY/RU) before fuzzy similar-prompt
  // matching, which otherwise maps EN "Home tab" to provider-assistant and
  // leaves HY "օգտագործեմ Home tab" with no topic.
  if (isProviderHomeOrTodayTabGuidePrompt(prompt)) {
    return 'provider-today-calendar';
  }

  if (providerIntent && isProviderProductGuideIntent(providerIntent)) {
    const fromIntent = matchSimilarAppGuideTopicFromPrompt(prompt, 'provider');
    if (fromIntent) return fromIntent;
  }

  const fromSimilar = matchSimilarAppGuideTopicFromPrompt(prompt, 'provider');
  if (fromSimilar) return fromSimilar;

  const primary = resolveGuideFlowRoutePrimaryTopic(route);
  if (primary?.startsWith('provider-')) return primary;

  if (
    /\b(invite|accept\s+invite|join\s+(?:the\s+)?(?:salon|team))\b/i.test(lower)
  ) {
    return 'provider-staff-invite';
  }
  if (
    /\b(team\s+view|everyone(?:'s|\s+else(?:'s)?)?\s+bookings?)\b/i.test(lower)
  ) {
    return 'provider-view-scope';
  }
  if (/\b(swipe\s+to\s+confirm|confirm\s+swipe)\b/i.test(lower)) {
    return 'provider-assistant-confirm';
  }
  if (/\b(compound\s+step|multi.?step\s+command)\b/i.test(lower)) {
    return 'provider-compound-steps';
  }
  if (/\b(mark\s+paid|payment\s+status)\b/i.test(lower)) {
    return 'provider-appointments';
  }
  if (/\b(schedule\s+block|time\s+off|block\s+time)\b/i.test(lower)) {
    return 'provider-schedule-blocks';
  }
  if (/\b(gift\s+card|redeem)\b/i.test(lower)) {
    return 'provider-gift-cards';
  }
  if (/\b(profile|avatar|display\s+name)\b/i.test(lower)) {
    return 'provider-profile-settings';
  }
  if (/\b(pos|retail\s+sale|ring\s+up)\b/i.test(lower)) {
    return 'provider-retail-pos';
  }
  if (/\b(lab|specimen|patient\s+chart|clinic)\b/i.test(lower)) {
    return 'provider-clinic';
  }

  return primary;
}

/** e2e-bug.302 — provider Home/Today tab walkthrough cues (EN/HY/RU). */
export function isProviderHomeOrTodayTabGuidePrompt(prompt: string): boolean {
  const lower = prompt.toLowerCase();
  if (
    /\b(home\s*tab|today\s*tab|calendar\s*tab|today\s+vs\s+calendar)\b/i.test(
      lower,
    )
  ) {
    return true;
  }
  // HY: "Ինչպե՞ս օգտագործեմ Home/Today tab-ը"
  if (
    /օգտագործեմ/iu.test(prompt) &&
    /\b(?:home|today|calendar)\s*tab\b/i.test(prompt)
  ) {
    return true;
  }
  if (/(?:home|today)\s*tab-ը/iu.test(prompt)) return true;
  // RU: "Как пользоваться вкладкой Home/Today"
  if (/вкладк/iu.test(prompt) && /\b(?:home|today|calendar)\b/i.test(prompt)) {
    return true;
  }
  if (/(?:вкладка\s+today|что\s+показывает\s+вкладка)/iu.test(prompt)) {
    return true;
  }
  return false;
}

/**
 * Unified post-classifier rescue for product guide intents (ai-guide-1.6.3).
 * Dispatches surface FAQ rescues, then cross-surface misroute guard, then heuristics.
 */
export function rescueProductGuideIntent(
  prompt: string,
  action: string,
  options: ProductGuideRescueOptions,
): ProductGuideRescueResult {
  const { surface, assistantMode } = options;

  if (
    hasActiveGuideMultiTurnSession(options.context) &&
    detectGuideNavigationIntent(prompt)
  ) {
    return {
      action: 'guide_user_flow',
      rescueReason: 'guide_multiturn_navigation',
    };
  }

  // e2e-bug.283 — HY "Ինչպե՞ս եմ…" matches Armenian "how" guide cues; never
  // override my_stats phrasing (provider call-site guards alone are not enough).
  if (isMyStatsPrompt(prompt)) {
    return { action };
  }

  if (surface === 'provider') {
    const providerRescue = rescueProviderProductGuideIntent(prompt, action);
    if (providerRescue !== action) {
      return { action: providerRescue, rescueReason: 'provider_product_guide' };
    }
  }

  if (surface === 'customer') {
    // e2e-bug.195 — /public/:slug/assistant uses surface:customer; booking-funnel
    // "how do I book step by step" must become booking_help before consumer Home tour.
    const publicBookingHelp = rescuePublicBookingHelpIntent(prompt, action);
    if (publicBookingHelp !== action) {
      return {
        action: publicBookingHelp,
        rescueReason: 'public_booking_help',
      };
    }

    const customerRescue = rescueCustomerAppGuideIntent(prompt, action);
    if (customerRescue !== action) {
      return { action: customerRescue, rescueReason: 'customer_app_guide' };
    }
  }

  if (surface === 'public') {
    const publicRescue = rescuePublicBookingHelpIntent(prompt, action);
    if (publicRescue !== action) {
      return { action: publicRescue, rescueReason: 'public_booking_help' };
    }
  }

  if (surface === 'dashboard' || surface === 'provider') {
    const metaRescue = rescueMetaProductGuideIntent(prompt, action, surface);
    if (metaRescue !== action) {
      return { action: metaRescue, rescueReason: 'meta_product_guide' };
    }
  }

  const emptyStateRescue = rescueEmptyStateGuideIntent(prompt, action, surface);
  if (emptyStateRescue !== action) {
    return { action: emptyStateRescue, rescueReason: 'empty_state_guide' };
  }

  const misroute = rescueProductGuideMisroute(prompt, action, {
    surface,
    assistantMode,
  });
  if (misroute && misroute.action !== action) {
    return { action: misroute.action, rescueReason: misroute.rescueReason };
  }

  if (action === 'unknown') {
    const match = resolveProductGuidePromptMatch(prompt, {
      surface,
      assistantMode,
    });
    if (match.matched && match.intent) {
      return { action: match.intent, rescueReason: 'product_guide_heuristic' };
    }
  }

  return { action };
}

/** Unified topicId enrichment for guide handlers (ai-guide-1.6.3). */
export function enrichGuideTopicFromPrompt(
  prompt: string,
  options: EnrichGuideTopicOptions,
): string | undefined {
  const { surface, route, topicId, activationStep, providerIntent } = options;

  switch (surface) {
    case 'dashboard':
      return enrichDashboardGuideTopicFromPrompt(prompt, route, topicId);
    case 'provider':
      return enrichProviderGuideTopicFromPrompt(
        prompt,
        route,
        topicId,
        providerIntent,
      );
    case 'customer':
      return enrichCustomerGuideTopicFromPrompt(
        prompt,
        route,
        topicId,
        activationStep,
      );
    case 'public':
      return enrichPublicBookingGuideTopicFromPrompt(prompt, route, topicId);
    default:
      return readString(topicId);
  }
}
