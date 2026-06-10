import { Logger } from '@nestjs/common';
import type { LlmService } from '../../engine/agent/llm.service.js';
import { todayDisplay } from '../../common/utils/date-format.util.js';
import { buildDecompositionSchemaView } from './intent-decomposition.schema.js';
import { COMPOUND_COMMAND_RECIPES } from './ai-command-registry.js';
import { getCompoundRecipesForSurface } from './ai-command-registry.util.js';
import type { CommandSurface } from './ai-command-registry.types.js';
import {
  enrichParamsWithSharedEntities,
  propagateCompoundStepParamsAcrossSteps,
} from './ai-command-entity-params.util.js';
import { extractPromoCodeFromPrompt } from './ai-marketing-growth.util.js';
import { decomposeCatalogCompoundPrompt } from './ai-catalog.util.js';
import { decomposeCrmCompoundPrompt } from './ai-customer-crm.util.js';
import { decomposeScheduleResourceCompoundPrompt } from './ai-schedule-resources.util.js';
import {
  decomposePaymentsCompoundPrompt,
  isBookNearestSlotPrompt,
  isCheckProvidersForServicePrompt,
} from './ai-payments.util.js';
import { decomposeFulfillmentCompoundPrompt } from './ai-gift-fulfillment.util.js';
import { decomposeIntegrationsCompoundPrompt } from './ai-integrations.util.js';
import { decomposeMarketingGrowthCompoundPrompt } from './ai-marketing-growth.util.js';
import { decomposePushNotificationsCompoundPrompt } from './ai-push-notifications.util.js';
import { decomposeCustomerBookingCompoundPrompt } from './ai-self-service-booking.util.js';
import { decomposeProviderBookingCompoundPrompt } from './ai-provider-booking.util.js';
import { decomposeDashboardPackageMultiServiceCompoundPrompt } from './ai-package-multi-service-hints.util.js';
import {
  classifyGiftCardPaymentsSegment,
  decomposeGiftCardPaymentsCompoundPrompt,
} from './ai-gift-card-payments-hints.util.js';
import {
  decomposeCustomerClinicCompoundPrompt,
  decomposeDashboardClinicCompoundPrompt,
  decomposePublicClinicCompoundPrompt,
  isClinicCompoundPrompt,
} from './ai-clinic-compound.util.js';
import {
  decomposeCustomerBudgetServiceDiscoveryCompoundPrompt,
  decomposePublicBudgetServiceDiscoveryCompoundPrompt,
  isBudgetServiceDiscoveryCompoundPrompt,
} from './ai-budget-service-discovery-compound.util.js';
import {
  decomposeCustomerServiceRankDiscoveryCompoundPrompt,
  decomposePublicServiceRankDiscoveryCompoundPrompt,
  isServiceRankDiscoveryCompoundPrompt,
} from './ai-service-rank-discovery-compound.util.js';
import {
  decomposeCustomerFlexibleAvailabilityBudgetCompoundPrompt,
  decomposeFlexibleAvailabilityBudgetCompoundPrompt,
  decomposePublicFlexibleAvailabilityBudgetCompoundPrompt,
  isFlexibleAvailabilityBudgetBookCompoundPrompt,
} from './ai-flexible-availability-compound.util.js';
import type {
  CompoundDecompositionResult,
  DecomposedIntentStep,
  GoldenCompoundPattern,
} from './intent-decomposition.types.js';

export const COMPOUND_PROMPT_MARKERS =
  /\band\s+then\b|\bthen\b|\balso\b|\bafter\s+that\b|\bfollowed\s+by\b|;\s*|\s+and\s+(?=(?:book|list|show|cancel|mark|pay|create|configure|track|add|remove|apply|notify|promo|fill|check|discover|use|get|explain|buy|choose|validate|export|summarize|trigger|switch|download|tag|coordinate|send|tell|alert|message|when|order|place|schedule|reserve|release)\b)|(?:,\s*(?:and\s+)?(?:cleanup|clear|hide|cancel|wipe|remove|book|apply|block|fill|reschedule|notify|promo))|(?:\.\s+(?:clear|cancel|hide|apply|block|fill|book|reschedule|unhide|notify|promo))\b/i;

export const UNIVERSAL_COMPOUND_SPLIT =
  /\s*;\s*|\s+and\s+then\s+|\s+then\s+|\s+and\s+also\s+|\s+also\s+|\s+and\s+(?=(?:book|list|show|cancel|mark|pay|create|configure|track|add|remove|apply|notify|promo|fill|check|discover|use|get|explain|buy|choose|validate|export|summarize|trigger|switch|download|when|tell|send|alert|message|order|place|schedule|reserve|release)\b)/i;

type RawCompoundStep = {
  action: string;
  params: Record<string, unknown>;
  segment?: string;
  reasoning?: string;
};

const DECOMPOSE_HANDLER_BY_UTIL: Record<
  string,
  (prompt: string) => RawCompoundStep[]
> = {
  decomposeCatalogCompoundPrompt,
  decomposeCrmCompoundPrompt,
  decomposeScheduleResourceCompoundPrompt,
  decomposePaymentsCompoundPrompt,
  decomposeFulfillmentCompoundPrompt,
  decomposeIntegrationsCompoundPrompt,
  decomposeMarketingGrowthCompoundPrompt,
  decomposeCustomerBookingCompoundPrompt,
  decomposeProviderBookingCompoundPrompt,
  decomposePushNotificationsCompoundPrompt,
  decomposeDashboardPackageMultiServiceCompoundPrompt,
  decomposeGiftCardPaymentsCompoundPrompt,
  decomposeDashboardClinicCompoundPrompt,
  decomposeCustomerClinicCompoundPrompt,
  decomposePublicClinicCompoundPrompt,
  decomposePublicBudgetServiceDiscoveryCompoundPrompt,
  decomposeCustomerBudgetServiceDiscoveryCompoundPrompt,
  decomposePublicServiceRankDiscoveryCompoundPrompt,
  decomposeCustomerServiceRankDiscoveryCompoundPrompt,
  decomposePublicFlexibleAvailabilityBudgetCompoundPrompt,
  decomposeCustomerFlexibleAvailabilityBudgetCompoundPrompt,
};

function buildCheckAndBookGoldenSteps(prompt: string): DecomposedIntentStep[] {
  const raw = decomposePaymentsCompoundPrompt(prompt);
  if (raw.length < 2) return [];
  return raw.map((step) => ({
    action: step.action,
    params: step.params,
    reasoning: `Check-and-book compound: ${step.action}`,
    segment: prompt,
  }));
}

function buildBudgetCompoundGoldenSteps(
  prompt: string,
  surface: Extract<CommandSurface, 'public' | 'customer'>,
): DecomposedIntentStep[] {
  const raw = decomposeBudgetServiceDiscoveryCompoundPrompt(prompt, surface);
  return raw.map((step) => ({
    action: step.action,
    params: step.params,
    reasoning: `Budget service discovery compound: ${step.action}`,
    segment: prompt,
  }));
}

function decomposeBudgetServiceDiscoveryCompoundPrompt(
  prompt: string,
  surface: Extract<CommandSurface, 'public' | 'customer'>,
) {
  return surface === 'public'
    ? decomposePublicBudgetServiceDiscoveryCompoundPrompt(prompt)
    : decomposeCustomerBudgetServiceDiscoveryCompoundPrompt(prompt);
}

function buildRankCompoundGoldenSteps(
  prompt: string,
  surface: Extract<CommandSurface, 'public' | 'customer'>,
): DecomposedIntentStep[] {
  const raw = decomposeServiceRankDiscoveryCompoundPrompt(prompt, surface);
  return raw.map((step) => ({
    action: step.action,
    params: step.params,
    reasoning: `Service rank discovery compound: ${step.action}`,
    segment: prompt,
  }));
}

function decomposeServiceRankDiscoveryCompoundPrompt(
  prompt: string,
  surface: Extract<CommandSurface, 'public' | 'customer'>,
) {
  return surface === 'public'
    ? decomposePublicServiceRankDiscoveryCompoundPrompt(prompt)
    : decomposeCustomerServiceRankDiscoveryCompoundPrompt(prompt);
}

function buildFlexibleAvailabilityBudgetCompoundGoldenSteps(
  prompt: string,
  surface: Extract<CommandSurface, 'public' | 'customer'>,
): DecomposedIntentStep[] {
  const raw = decomposeFlexibleAvailabilityBudgetCompoundPrompt(prompt, surface);
  return raw.map((step) => ({
    action: step.action,
    params: step.params,
    reasoning: `Flexible availability budget compound: ${step.action}`,
    segment: prompt,
  }));
}

export const GOLDEN_COMPOUND_PATTERNS: GoldenCompoundPattern[] = [
  {
    id: 'public_flexible_avail_budget_check_then_book',
    surface: 'public',
    recipeId: 'public_flexible_availability_budget_compound',
    matches: (prompt) => isFlexibleAvailabilityBudgetBookCompoundPrompt(prompt),
    buildSteps: (prompt) =>
      buildFlexibleAvailabilityBudgetCompoundGoldenSteps(prompt, 'public'),
  },
  {
    id: 'customer_flexible_avail_budget_check_then_book',
    surface: 'customer',
    recipeId: 'customer_flexible_availability_budget_compound',
    matches: (prompt) => isFlexibleAvailabilityBudgetBookCompoundPrompt(prompt),
    buildSteps: (prompt) =>
      buildFlexibleAvailabilityBudgetCompoundGoldenSteps(prompt, 'customer'),
  },
  {
    id: 'public_rank_book_nearest',
    surface: 'public',
    recipeId: 'public_service_rank_discovery_compound',
    matches: (prompt) => isServiceRankDiscoveryCompoundPrompt(prompt),
    buildSteps: (prompt) => buildRankCompoundGoldenSteps(prompt, 'public'),
  },
  {
    id: 'customer_rank_book_nearest',
    surface: 'customer',
    recipeId: 'customer_service_rank_discovery_compound',
    matches: (prompt) => isServiceRankDiscoveryCompoundPrompt(prompt),
    buildSteps: (prompt) => buildRankCompoundGoldenSteps(prompt, 'customer'),
  },
  {
    id: 'public_budget_check_then_book',
    surface: 'public',
    recipeId: 'public_budget_service_discovery_compound',
    matches: (prompt) =>
      isBudgetServiceDiscoveryCompoundPrompt(prompt) &&
      isCheckProvidersForServicePrompt(prompt) &&
      isBookNearestSlotPrompt(prompt),
    buildSteps: (prompt) => buildBudgetCompoundGoldenSteps(prompt, 'public'),
  },
  {
    id: 'public_budget_book_nearest',
    surface: 'public',
    recipeId: 'public_budget_service_discovery_compound',
    matches: (prompt) =>
      isBudgetServiceDiscoveryCompoundPrompt(prompt) &&
      !(
        isCheckProvidersForServicePrompt(prompt) &&
        isBookNearestSlotPrompt(prompt)
      ),
    buildSteps: (prompt) => buildBudgetCompoundGoldenSteps(prompt, 'public'),
  },
  {
    id: 'customer_budget_check_then_book',
    surface: 'customer',
    recipeId: 'customer_budget_service_discovery_compound',
    matches: (prompt) =>
      isBudgetServiceDiscoveryCompoundPrompt(prompt) &&
      isCheckProvidersForServicePrompt(prompt) &&
      isBookNearestSlotPrompt(prompt),
    buildSteps: (prompt) => buildBudgetCompoundGoldenSteps(prompt, 'customer'),
  },
  {
    id: 'customer_budget_book_nearest',
    surface: 'customer',
    recipeId: 'customer_budget_service_discovery_compound',
    matches: (prompt) =>
      isBudgetServiceDiscoveryCompoundPrompt(prompt) &&
      !(
        isCheckProvidersForServicePrompt(prompt) &&
        isBookNearestSlotPrompt(prompt)
      ),
    buildSteps: (prompt) => buildBudgetCompoundGoldenSteps(prompt, 'customer'),
  },
  {
    id: 'dashboard_check_and_book_nearest',
    surface: 'dashboard',
    recipeId: 'dashboard_payments_compound',
    matches: (prompt) =>
      isCheckProvidersForServicePrompt(prompt) &&
      isBookNearestSlotPrompt(prompt) &&
      !isBudgetServiceDiscoveryCompoundPrompt(prompt),
    buildSteps: buildCheckAndBookGoldenSteps,
  },
  {
    id: 'customer_check_and_book_nearest',
    surface: 'customer',
    recipeId: 'customer_self_service_compound',
    matches: (prompt) =>
      isCheckProvidersForServicePrompt(prompt) &&
      isBookNearestSlotPrompt(prompt) &&
      !isBudgetServiceDiscoveryCompoundPrompt(prompt),
    buildSteps: buildCheckAndBookGoldenSteps,
  },
  {
    id: 'customer_book_package_apply_promo',
    surface: 'customer',
    recipeId: 'customer_self_service_compound',
    matches: (prompt) =>
      /\b(book|reserve|schedule)\b/i.test(prompt) &&
      /\bpackage\b/i.test(prompt) &&
      /\b(apply|use)\b/i.test(prompt) &&
      /\bpromo\b/i.test(prompt),
    buildSteps: (prompt) => {
      const params = enrichParamsWithSharedEntities({}, prompt);
      const promoCode = extractPromoCodeFromPrompt(prompt);
      if (promoCode) params.promoCode = promoCode;
      return [
        {
          action: 'book_package',
          params,
          reasoning: 'Book the package for the customer',
          segment: prompt,
        },
        {
          action: 'promo_code_help',
          params,
          reasoning: 'Apply or validate the promo code at checkout',
          segment: prompt,
        },
      ];
    },
  },
  {
    id: 'dashboard_cancel_visit_notify_waitlist',
    surface: 'dashboard',
    recipeId: 'dashboard_operational_compound',
    matches: (prompt) =>
      /\bcancel\b/i.test(prompt) &&
      /\b(package\s+)?visit\b/i.test(prompt) &&
      /\b(notify|waitlist|fill)\b/i.test(prompt) &&
      !/\b(coordinate|offer|reach\s+out)\b/i.test(prompt),
    buildSteps: (prompt) => {
      const params = enrichParamsWithSharedEntities({}, prompt);
      return [
        {
          action: 'cancel_package_visit',
          params,
          reasoning: 'Cancel the package visit',
          segment: prompt,
        },
        {
          action: 'fill_slot_from_waitlist',
          params,
          reasoning: 'Notify waitlist customers and fill the freed slot',
          segment: prompt,
        },
      ];
    },
  },
  {
    id: 'dashboard_cancel_visit_coordinate_waitlist',
    surface: 'dashboard',
    recipeId: 'dashboard_operational_compound',
    matches: (prompt) =>
      /\bcancel\b/i.test(prompt) &&
      /\b(package\s+)?visit\b/i.test(prompt) &&
      /\b(coordinate|offer|reach\s+out)\b/i.test(prompt) &&
      /\bwaitlist\b/i.test(prompt),
    buildSteps: (prompt) => {
      const params = enrichParamsWithSharedEntities({}, prompt);
      return [
        {
          action: 'cancel_package_visit',
          params,
          reasoning: 'Cancel the package visit',
          segment: prompt,
        },
        {
          action: 'coordinate_waitlist_offer',
          params,
          reasoning: 'Coordinate waitlist offer after cancellation',
          segment: prompt,
        },
      ];
    },
  },
  {
    id: 'dashboard_package_line_checkout',
    surface: 'dashboard',
    recipeId: 'dashboard_package_multi_service_compound',
    matches: (prompt) =>
      /\bcheck\b/i.test(prompt) &&
      /\bpackage\b/i.test(prompt) &&
      /\b(line|availability)\b/i.test(prompt) &&
      /\bbook\b/i.test(prompt),
    buildSteps: (prompt) => {
      const raw = decomposeDashboardPackageMultiServiceCompoundPrompt(prompt);
      return raw.map((step) => ({
        action: step.action,
        params: step.params,
        reasoning: `Package checkout compound: ${step.action}`,
        segment: step.segment,
      }));
    },
  },
  {
    id: 'customer_gift_card_checkout_compound',
    surface: 'customer',
    recipeId: 'customer_gift_card_payments_compound',
    matches: (prompt) =>
      /\bbook\b/i.test(prompt) &&
      /\b(apply|use|redeem)\b/i.test(prompt) &&
      /\bgift\s*card\b/i.test(prompt) &&
      (/\bchoose\b/i.test(prompt) ||
        /\bpayment\s+method\b/i.test(prompt) ||
        /\bpay\s+online\b/i.test(prompt)),
    buildSteps: (prompt) => {
      const raw = decomposeGiftCardPaymentsCompoundPrompt(prompt);
      return raw.map((step) => ({
        action: step.action,
        params: step.params,
        reasoning: `Gift card checkout compound: ${step.action}`,
        segment: step.segment,
      }));
    },
  },
  {
    id: 'customer_physical_gift_card_handoff',
    surface: 'customer',
    recipeId: 'customer_gift_card_payments_compound',
    matches: (prompt) =>
      /\b(buy|purchase|order)\b/i.test(prompt) &&
      /\b(physical|mail|ship)\b/i.test(prompt) &&
      /\bgift\s*card\b/i.test(prompt) &&
      /\b(track|where|status)\b/i.test(prompt),
    buildSteps: (prompt) => {
      const raw = decomposeGiftCardPaymentsCompoundPrompt(prompt);
      return raw.map((step) => ({
        action: step.action,
        params: step.params,
        reasoning: `Physical gift card handoff: ${step.action}`,
        segment: step.segment,
      }));
    },
  },
  {
    id: 'dashboard_multi_service_cart_checkout',
    surface: 'dashboard',
    recipeId: 'dashboard_package_multi_service_compound',
    matches: (prompt) =>
      (/\bcart\b/i.test(prompt) ||
        /\bmulti[\s-]?service\b/i.test(prompt) ||
        /\bblock\s+availability\b/i.test(prompt)) &&
      /\bcheck\b/i.test(prompt) &&
      /\bbook\b/i.test(prompt),
    buildSteps: (prompt) => {
      const raw = decomposeDashboardPackageMultiServiceCompoundPrompt(prompt);
      return raw.map((step) => ({
        action: step.action,
        params: step.params,
        reasoning: `Multi-service checkout compound: ${step.action}`,
        segment: step.segment,
      }));
    },
  },
  {
    id: 'dashboard_clinic_order_notify',
    surface: 'dashboard',
    recipeId: 'dashboard_clinic_compound',
    matches: (prompt) => isClinicCompoundPrompt(prompt, 'dashboard'),
    buildSteps: (prompt) => {
      const raw = decomposeDashboardClinicCompoundPrompt(prompt);
      return raw.map((step) => ({
        action: step.action,
        params: step.params,
        reasoning: `Clinic order + notify compound: ${step.action}`,
        segment: step.segment,
      }));
    },
  },
  {
    id: 'customer_clinic_book_explain_results',
    surface: 'customer',
    recipeId: 'customer_clinic_compound',
    matches: (prompt) => isClinicCompoundPrompt(prompt, 'customer'),
    buildSteps: (prompt) => {
      const raw = decomposeCustomerClinicCompoundPrompt(prompt);
      return raw.map((step) => ({
        action: step.action,
        params: step.params,
        reasoning: `Clinic book + result FAQ compound: ${step.action}`,
        segment: step.segment,
      }));
    },
  },
  {
    id: 'public_clinic_book_explain_results',
    surface: 'public',
    recipeId: 'public_clinic_compound',
    matches: (prompt) => isClinicCompoundPrompt(prompt, 'public'),
    buildSteps: (prompt) => {
      const raw = decomposePublicClinicCompoundPrompt(prompt);
      return raw.map((step) => ({
        action: step.action,
        params: step.params,
        reasoning: `Public clinic book + result FAQ compound: ${step.action}`,
        segment: step.segment,
      }));
    },
  },
];

export const GOLDEN_COMPOUND_PATTERN_IDS = GOLDEN_COMPOUND_PATTERNS.map(
  (pattern) => pattern.id,
);

export function isCompoundPrompt(prompt: string): boolean {
  const trimmed = prompt.trim();
  if (trimmed.length < 12) return false;
  if (isBudgetServiceDiscoveryCompoundPrompt(trimmed)) return true;
  if (isServiceRankDiscoveryCompoundPrompt(trimmed)) return true;
  return COMPOUND_PROMPT_MARKERS.test(trimmed);
}

export function toDecomposedIntentStep(
  raw: RawCompoundStep,
): DecomposedIntentStep {
  return {
    action: raw.action,
    params: raw.params ?? {},
    reasoning: raw.reasoning ?? `Compound step: ${raw.action}`,
    segment: raw.segment,
  };
}

export function normalizeHandlerSteps(
  rawSteps: RawCompoundStep[],
  allowedIntentIds: readonly string[],
): DecomposedIntentStep[] {
  const allowed = new Set(allowedIntentIds);
  const filtered = rawSteps
    .filter((step) => allowed.has(step.action))
    .map((step) => toDecomposedIntentStep(step));
  if (filtered.length < 2) return filtered;
  return propagateCompoundStepParamsAcrossSteps(filtered);
}

export function buildCustomerPromoHelpStep(text: string): DecomposedIntentStep {
  const params = enrichParamsWithSharedEntities({}, text);
  const promoCode = extractPromoCodeFromPrompt(text);
  if (promoCode) params.promoCode = promoCode;
  return {
    action: 'promo_code_help',
    params,
    reasoning: 'Apply promo code at checkout',
    segment: text,
  };
}

export function pickLongerCompoundMatch<
  T extends { steps: DecomposedIntentStep[] },
>(best: T | null, candidate: T): T {
  if (!best || candidate.steps.length > best.steps.length) return candidate;
  return best;
}

export function validateStepsAgainstRecipe(
  steps: DecomposedIntentStep[],
  allowedIntentIds: readonly string[],
): boolean {
  if (steps.length < 2) return false;
  const allowed = new Set(allowedIntentIds);
  return steps.every((step) => allowed.has(step.action));
}

export function matchGoldenCompoundPattern(
  surface: CommandSurface,
  prompt: string,
): CompoundDecompositionResult | null {
  for (const pattern of GOLDEN_COMPOUND_PATTERNS) {
    if (pattern.surface !== surface || !pattern.matches(prompt)) continue;
    const steps = pattern.buildSteps(prompt);
    if (steps.length < 2) continue;
    return {
      surface,
      recipeId: pattern.recipeId,
      source: 'golden',
      steps: propagateCompoundStepParamsAcrossSteps(steps),
    };
  }
  return null;
}

function classifyCustomerSelfServiceSegment(
  segment: string,
): DecomposedIntentStep | null {
  const text = segment.trim();

  const handlers = [
    (text: string) => {
      const step = classifyGiftCardPaymentsSegment(text);
      return step ? [step] : [];
    },
    decomposeCustomerBookingCompoundPrompt,
    decomposePaymentsCompoundPrompt,
    decomposeMarketingGrowthCompoundPrompt,
    decomposeFulfillmentCompoundPrompt,
    decomposeIntegrationsCompoundPrompt,
    decomposePushNotificationsCompoundPrompt,
  ];

  for (const handler of handlers) {
    const steps = handler(text);
    if (steps.length === 1) {
      return toDecomposedIntentStep(steps[0]);
    }
  }

  if (/\b(apply|use)\b/i.test(text) && /\bpromo\b/i.test(text)) {
    return buildCustomerPromoHelpStep(text);
  }

  return null;
}

export function decomposeCustomerSelfServiceCompound(
  prompt: string,
): DecomposedIntentStep[] {
  const trimmed = prompt.trim();
  if (!trimmed) return [];

  const segments = trimmed
    .split(UNIVERSAL_COMPOUND_SPLIT)
    .map((s) => s.trim())
    .filter(Boolean);
  if (segments.length <= 1) {
    const single = classifyCustomerSelfServiceSegment(trimmed);
    return single ? [single] : [];
  }

  const steps: DecomposedIntentStep[] = [];
  for (const segment of segments) {
    const step = classifyCustomerSelfServiceSegment(segment);
    if (step) steps.push(step);
  }

  if (steps.length < 2) return steps;
  const propagated = propagateCompoundStepParamsAcrossSteps(
    steps.map((step) => ({ action: step.action, params: step.params })),
  );
  return propagated.map((step, index) => ({
    ...steps[index],
    params: step.params,
  }));
}

export function decomposeDeterministicForSurface(
  surface: CommandSurface,
  prompt: string,
): CompoundDecompositionResult | null {
  const golden = matchGoldenCompoundPattern(surface, prompt);
  if (golden) return golden;

  if (surface === 'customer') {
    const customerSteps = decomposeCustomerSelfServiceCompound(prompt);
    if (customerSteps.length >= 2) {
      return {
        surface,
        recipeId: 'customer_self_service_compound',
        source: 'deterministic',
        steps: customerSteps,
      };
    }
  }

  const recipes = getCompoundRecipesForSurface(surface);
  let best: { recipeId: string; steps: DecomposedIntentStep[] } | null = null;

  for (const recipe of recipes) {
    if (recipe.llmDecompose || !recipe.decomposeUtil) continue;
    const handler = DECOMPOSE_HANDLER_BY_UTIL[recipe.decomposeUtil];
    if (!handler) continue;

    const normalized = normalizeHandlerSteps(
      handler(prompt),
      recipe.allowedStepIntentIds,
    );
    if (normalized.length < 2) continue;

    best = pickLongerCompoundMatch(best, {
      recipeId: recipe.id,
      steps: normalized,
    });
  }

  if (!best) return null;
  return {
    surface,
    recipeId: best.recipeId,
    source: 'deterministic',
    steps: best.steps,
  };
}

export function listDecomposeHandlersForSurface(
  surface: CommandSurface,
): string[] {
  return getCompoundRecipesForSurface(surface)
    .map((recipe) => recipe.decomposeUtil)
    .filter((util): util is string => Boolean(util));
}

export function getCompoundRecipeById(recipeId: string) {
  return COMPOUND_COMMAND_RECIPES.find((recipe) => recipe.id === recipeId);
}

const decompositionLogger = new Logger('IntentDecomposition');

export function decompositionLogLabel(
  recipeId: string | undefined,
  surface: CommandSurface,
): string {
  return recipeId ?? surface;
}

/** Deterministic-first compound decomposition with dashboard LLM fallback (ai-cmd-0.3). */
export async function decomposeCompoundPrompt(
  llm: LlmService,
  businessId: string,
  userId: string | undefined,
  prompt: string,
  timeZone = 'UTC',
  surface: CommandSurface = 'dashboard',
): Promise<DecomposedIntentStep[]> {
  if (!isCompoundPrompt(prompt)) return [];

  const deterministic = decomposeDeterministicForSurface(surface, prompt);
  if (deterministic && deterministic.steps.length >= 2) {
    decompositionLogger.log(
      `Decomposed (${deterministic.source}/${decompositionLogLabel(deterministic.recipeId, surface)}) into ${deterministic.steps.length} sub-intent(s)`,
    );
    return deterministic.steps.slice(
      0,
      buildDecompositionSchemaView(surface).maxSteps,
    );
  }

  if (surface !== 'dashboard') return [];

  const schema = buildDecompositionSchemaView(surface);

  try {
    const result = await llm.completeJson<{ intents: DecomposedIntentStep[] }>(
      businessId,
      `${schema.promptBlock}\n\nCurrent date: ${todayDisplay(timeZone)} (DD/MM/YYYY, timezone: ${timeZone})`,
      prompt,
      {
        surface: 'dashboard',
        operation: 'decompose_intent',
        actorType: 'owner',
        userId,
      },
      0.1,
    );

    const allowed = new Set(schema.allowedActions);
    const intents = (result?.intents ?? [])
      .filter(
        (intent) =>
          intent?.action &&
          intent.action !== 'unknown' &&
          allowed.has(intent.action),
      )
      .map((intent) => ({
        action: intent.action,
        params: intent.params ?? {},
        reasoning: intent.reasoning ?? `LLM compound step: ${intent.action}`,
      }));

    if (intents.length <= 1) return [];
    decompositionLogger.log(
      `Decomposed (llm/${surface}) into ${intents.length} sub-intent(s)`,
    );
    return intents.slice(0, schema.maxSteps);
  } catch (error: any) {
    decompositionLogger.warn(`Intent decomposition failed: ${error.message}`);
    return [];
  }
}
