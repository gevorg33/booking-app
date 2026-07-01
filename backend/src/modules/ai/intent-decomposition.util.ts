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
import {
  decomposePublicMultiServiceCompoundPrompt,
  isPublicMultiServiceCompoundPrompt,
} from './ai-multi-service-customer-public.util.js';
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
  isFlexibleAvailabilityListBudgetThenOrCompoundPrompt,
} from './ai-flexible-availability-compound.util.js';
import {
  decomposeBudgetDiscoverAndBookCompoundPrompt,
  isBudgetDiscoverAndBookCompoundPrompt,
  BUDGET_DISCOVER_AND_BOOK_RECIPE_ID,
} from './ai-budget-discover-and-book-compound.util.js';
import {
  decomposeRankDiscoverAndBookCompoundPrompt,
  isRankDiscoverAndBookCompoundPrompt,
  RANK_DISCOVER_AND_BOOK_RECIPE_ID,
} from './ai-rank-discover-and-book-compound.util.js';
import {
  decomposeClinicLabDayCloseCompoundPrompt,
  isClinicLabDayCloseCompoundPrompt,
  CLINIC_LAB_DAY_CLOSE_RECIPE_ID,
} from './ai-clinic-lab-day-close-compound.util.js';
import {
  decomposeClinicLabReviewCompoundPrompt,
  isClinicLabReviewCompoundPrompt,
  CLINIC_LAB_REVIEW_RECIPE_ID,
} from './ai-clinic-lab-review-compound.util.js';
import {
  decomposeProviderOnboardingCompoundPrompt,
  isProviderOnboardingCompoundPrompt,
  PROVIDER_ONBOARDING_COMPOUND_RECIPE_ID,
} from './ai-provider-onboarding-compound.util.js';
import {
  decomposeSetupSalonCheckoutCompoundPrompt,
  isSetupSalonCheckoutCompoundPrompt,
  SETUP_SALON_CHECKOUT_COMPOUND_RECIPE_ID,
} from './ai-setup-salon-checkout-compound.util.js';
import {
  decomposeConfigureServicesPaymentMatrixCompoundPrompt,
  isConfigureServicesPaymentMatrixCompoundPrompt,
  CONFIGURE_SERVICES_PAYMENT_MATRIX_RECIPE_ID,
} from './ai-configure-services-payment-matrix-compound.util.js';
import {
  decomposeCashAndDeclineAllOnlinePaymentCompoundPrompt,
  isCashAndDeclineAllOnlinePaymentCompoundPrompt,
  isCashAndOnlinePaymentCompoundPrompt,
  CASH_AND_ONLINE_PAYMENT_COMPOUND_RECIPE_ID,
} from './ai-cash-online-payment-compound.util.js';
import {
  decomposeDeclineOnlinePaymentCategoryCompoundPrompt,
  isDeclineOnlinePaymentCategoryCompoundPrompt,
  DECLINE_ONLINE_PAYMENT_CATEGORY_RECIPE_ID,
} from './ai-decline-online-payment-category-compound.util.js';
import {
  decomposeOnboardSalonNotificationsCompoundPrompt,
  isOnboardSalonNotificationsCompoundPrompt,
  ONBOARD_SALON_NOTIFICATIONS_RECIPE_ID,
} from './ai-onboard-salon-notifications-compound.util.js';
import {
  decomposeLaunchConsumerAppGrowthCompoundPrompt,
  isLaunchConsumerAppGrowthCompoundPrompt,
  LAUNCH_CONSUMER_APP_GROWTH_RECIPE_ID,
} from './ai-launch-consumer-app-growth-compound.util.js';
import {
  decomposeCustomerBookPackageWithNearestSlotCompoundPrompt,
  decomposePublicBookPackageWithNearestSlotCompoundPrompt,
  isBookPackageWithNearestSlotCompoundPrompt,
  BOOK_PACKAGE_WITH_NEAREST_SLOT_RECIPE_ID,
} from './ai-book-package-with-nearest-slot.util.js';
import {
  decomposeCustomerBookLabCollectionNearestCompoundPrompt,
  decomposePublicBookLabCollectionNearestCompoundPrompt,
  isBookLabCollectionNearestCompoundPrompt,
  BOOK_LAB_COLLECTION_NEAREST_RECIPE_ID,
} from './ai-book-lab-collection-nearest.util.js';
import {
  decomposeCustomerCompleteIntakeAndBookCompoundPrompt,
  decomposePublicCompleteIntakeAndBookCompoundPrompt,
  isCompleteIntakeAndBookCompoundPrompt,
  COMPLETE_INTAKE_AND_BOOK_RECIPE_ID,
  PUBLIC_COMPLETE_INTAKE_AND_BOOK_RECIPE_ID,
} from './ai-complete-intake-and-book.util.js';
import {
  decomposeCustomerIntakeLabBookPayCompoundPrompt,
  decomposePublicIntakeLabBookPayCompoundPrompt,
  isIntakeLabBookPayCompoundPrompt,
  INTAKE_LAB_BOOK_PAY_RECIPE_ID,
  PUBLIC_INTAKE_LAB_BOOK_PAY_RECIPE_ID,
} from './ai-intake-lab-book-pay-compound.util.js';
import {
  decomposeCustomerBookTourNearestDepartureCompoundPrompt,
  decomposePublicBookTourNearestDepartureCompoundPrompt,
  isBookTourNearestDepartureCompoundPrompt,
  BOOK_TOUR_NEAREST_DEPARTURE_RECIPE_ID,
  PUBLIC_BOOK_TOUR_NEAREST_DEPARTURE_RECIPE_ID,
} from './ai-book-tour-nearest-departure.util.js';
import {
  decomposeCustomerTourGroupCheckoutCompoundPrompt,
  decomposePublicTourGroupCheckoutCompoundPrompt,
  isTourGroupCheckoutCompoundPrompt,
  TOUR_GROUP_CHECKOUT_RECIPE_ID,
  PUBLIC_TOUR_GROUP_CHECKOUT_RECIPE_ID,
} from './ai-tour-group-checkout-compound.util.js';
import {
  decomposeBookWithGiftCardCompoundPrompt,
  isBookWithGiftCardCompoundPrompt,
} from './ai-book-with-gift-card.util.js';
import {
  decomposeCustomerDiscoverBookAndPayCompoundPrompt,
  decomposePublicDiscoverBookAndPayCompoundPrompt,
  isDiscoverBookAndPayCompoundPrompt,
  DISCOVER_BOOK_AND_PAY_RECIPE_ID,
  PUBLIC_DISCOVER_BOOK_AND_PAY_RECIPE_ID,
} from './ai-discover-book-and-pay-compound.util.js';
import {
  decomposeRebookAndPayCompoundPrompt,
  isRebookAndPayCompoundPrompt,
  REBOOK_AND_PAY_RECIPE_ID,
} from './ai-rebook-and-pay-compound.util.js';
import {
  decomposeSubscriptionFirstVisitCompoundPrompt,
  isSubscriptionFirstVisitCompoundPrompt,
  SUBSCRIPTION_FIRST_VISIT_RECIPE_ID,
} from './ai-subscription-first-visit-compound.util.js';
import {
  decomposeResultsThenRebookCompoundPrompt,
  isResultsThenRebookCompoundPrompt,
  RESULTS_THEN_REBOOK_RECIPE_ID,
} from './ai-results-then-rebook-compound.util.js';
import {
  decomposeCancelAndRebookCompoundPrompt,
  isCancelAndRebookCompoundPrompt,
  CANCEL_AND_REBOOK_RECIPE_ID,
} from './ai-cancel-and-rebook-compound.util.js';
import {
  decomposeCancelPackageRebookSingleCompoundPrompt,
  isCancelPackageRebookSingleCompoundPrompt,
  CANCEL_PACKAGE_REBOOK_SINGLE_RECIPE_ID,
} from './ai-cancel-package-rebook-single-compound.util.js';
import {
  decomposeGiftCardCheckoutCompoundPrompt,
  isGiftCardCheckoutCompoundPrompt,
  GIFT_CARD_CHECKOUT_RECIPE_ID,
} from './ai-gift-card-checkout-compound.util.js';
import {
  decomposeMultiServiceDayCompoundPrompt,
  isMultiServiceDayCompoundPrompt,
  MULTI_SERVICE_DAY_RECIPE_ID,
} from './ai-multi-service-day-compound.util.js';
import {
  decomposeProviderSameDayMultiCompoundPrompt,
  isProviderSameDayMultiCompoundPrompt,
  PROVIDER_SAME_DAY_MULTI_RECIPE_ID,
} from './ai-provider-same-day-multi-compound.util.js';
import {
  decomposeGuestBookAndManageCompoundPrompt,
  isGuestBookAndManageCompoundPrompt,
  GUEST_BOOK_AND_MANAGE_RECIPE_ID,
} from './ai-guest-book-and-manage-compound.util.js';
import {
  decomposeGuestPayCashManageCompoundPrompt,
  isGuestPayCashManageCompoundPrompt,
  GUEST_PAY_CASH_MANAGE_RECIPE_ID,
} from './ai-guest-pay-cash-manage-compound.util.js';
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
  decomposePublicMultiServiceCompoundPrompt,
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
  decomposeProviderOnboardingCompoundPrompt,
  decomposeSetupSalonCheckoutCompoundPrompt,
  decomposeConfigureServicesPaymentMatrixCompoundPrompt,
  decomposeDeclineOnlinePaymentCategoryCompoundPrompt,
  decomposeCashAndDeclineAllOnlinePaymentCompoundPrompt,
  decomposeOnboardSalonNotificationsCompoundPrompt,
  decomposeLaunchConsumerAppGrowthCompoundPrompt,
  decomposeClinicLabDayCloseCompoundPrompt,
  decomposeClinicLabReviewCompoundPrompt,
  decomposeBudgetDiscoverAndBookCompoundPrompt,
  decomposeRankDiscoverAndBookCompoundPrompt,
  decomposeCustomerBookPackageWithNearestSlotCompoundPrompt,
  decomposePublicBookPackageWithNearestSlotCompoundPrompt,
  decomposeCustomerBookLabCollectionNearestCompoundPrompt,
  decomposePublicBookLabCollectionNearestCompoundPrompt,
  decomposeCustomerCompleteIntakeAndBookCompoundPrompt,
  decomposePublicCompleteIntakeAndBookCompoundPrompt,
  decomposeCustomerBookTourNearestDepartureCompoundPrompt,
  decomposePublicBookTourNearestDepartureCompoundPrompt,
  decomposeCustomerDiscoverBookAndPayCompoundPrompt,
  decomposePublicDiscoverBookAndPayCompoundPrompt,
  decomposeRebookAndPayCompoundPrompt,
  decomposeCancelAndRebookCompoundPrompt,
  decomposeGiftCardCheckoutCompoundPrompt,
  decomposeMultiServiceDayCompoundPrompt,
  decomposeGuestBookAndManageCompoundPrompt,
};

function buildBookPackageWithNearestSlotGoldenSteps(
  prompt: string,
  surface: Extract<CommandSurface, 'public' | 'customer'>,
): DecomposedIntentStep[] {
  const raw =
    surface === 'public'
      ? decomposePublicBookPackageWithNearestSlotCompoundPrompt(prompt)
      : decomposeCustomerBookPackageWithNearestSlotCompoundPrompt(prompt);
  return raw.map((step) => ({
    action: step.action,
    params: step.params,
    reasoning: `Book package with nearest slot compound: ${step.action}`,
    segment: prompt,
  }));
}

function buildBookLabCollectionNearestGoldenSteps(
  prompt: string,
  surface: Extract<CommandSurface, 'public' | 'customer'>,
): DecomposedIntentStep[] {
  const raw =
    surface === 'public'
      ? decomposePublicBookLabCollectionNearestCompoundPrompt(prompt)
      : decomposeCustomerBookLabCollectionNearestCompoundPrompt(prompt);
  return raw.map((step) => ({
    action: step.action,
    params: step.params,
    reasoning: `Book lab collection nearest compound: ${step.action}`,
    segment: prompt,
  }));
}

function buildCompleteIntakeAndBookGoldenSteps(
  prompt: string,
  surface: Extract<CommandSurface, 'public' | 'customer'>,
): DecomposedIntentStep[] {
  const raw =
    surface === 'public'
      ? decomposePublicCompleteIntakeAndBookCompoundPrompt(prompt)
      : decomposeCustomerCompleteIntakeAndBookCompoundPrompt(prompt);
  return raw.map((step) => ({
    action: step.action,
    params: step.params,
    reasoning: `Complete intake and book compound: ${step.action}`,
    segment: prompt,
  }));
}

function buildIntakeLabBookPayGoldenSteps(
  prompt: string,
  surface: Extract<CommandSurface, 'public' | 'customer'>,
): DecomposedIntentStep[] {
  const raw =
    surface === 'public'
      ? decomposePublicIntakeLabBookPayCompoundPrompt(prompt)
      : decomposeCustomerIntakeLabBookPayCompoundPrompt(prompt);
  return raw.map((step) => ({
    action: step.action,
    params: step.params,
    reasoning: `Intake lab book pay compound: ${step.action}`,
    segment: prompt,
  }));
}

function buildBookTourNearestDepartureGoldenSteps(
  prompt: string,
  surface: Extract<CommandSurface, 'public' | 'customer'>,
): DecomposedIntentStep[] {
  const raw =
    surface === 'public'
      ? decomposePublicBookTourNearestDepartureCompoundPrompt(prompt)
      : decomposeCustomerBookTourNearestDepartureCompoundPrompt(prompt);
  return raw.map((step) => ({
    action: step.action,
    params: step.params,
    reasoning: `Book tour nearest departure compound: ${step.action}`,
    segment: prompt,
  }));
}

function buildTourGroupCheckoutGoldenSteps(
  prompt: string,
  surface: Extract<CommandSurface, 'public' | 'customer'>,
): DecomposedIntentStep[] {
  const raw =
    surface === 'public'
      ? decomposePublicTourGroupCheckoutCompoundPrompt(prompt)
      : decomposeCustomerTourGroupCheckoutCompoundPrompt(prompt);
  return raw.map((step) => ({
    action: step.action,
    params: step.params,
    reasoning: `Tour group checkout compound: ${step.action}`,
    segment: prompt,
  }));
}

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

function buildMultiServiceDayGoldenSteps(
  prompt: string,
): DecomposedIntentStep[] {
  const raw = decomposeMultiServiceDayCompoundPrompt(prompt);
  return raw.map((step) => ({
    action: step.action,
    params: step.params,
    reasoning: `Multi-service day compound: ${step.action}`,
    segment: prompt,
  }));
}

function buildProviderSameDayMultiGoldenSteps(
  prompt: string,
): DecomposedIntentStep[] {
  const raw = decomposeProviderSameDayMultiCompoundPrompt(prompt);
  return raw.map((step) => ({
    action: step.action,
    params: step.params,
    reasoning: `Provider same day multi compound: ${step.action}`,
    segment: prompt,
  }));
}

function buildGiftCardCheckoutGoldenSteps(
  prompt: string,
): DecomposedIntentStep[] {
  const raw = decomposeGiftCardCheckoutCompoundPrompt(prompt);
  return raw.map((step) => ({
    action: step.action,
    params: step.params,
    reasoning: `Gift card checkout compound: ${step.action}`,
    segment: prompt,
  }));
}

function buildCancelPackageRebookSingleGoldenSteps(
  prompt: string,
): DecomposedIntentStep[] {
  const raw = decomposeCancelPackageRebookSingleCompoundPrompt(prompt);
  return raw.map((step) => ({
    action: step.action,
    params: step.params,
    reasoning: `Cancel package rebook single compound: ${step.action}`,
    segment: prompt,
  }));
}

function buildCancelAndRebookGoldenSteps(
  prompt: string,
): DecomposedIntentStep[] {
  const raw = decomposeCancelAndRebookCompoundPrompt(prompt);
  return raw.map((step) => ({
    action: step.action,
    params: step.params,
    reasoning: `Cancel and rebook compound: ${step.action}`,
    segment: prompt,
  }));
}

function buildGuestBookAndManageGoldenSteps(
  prompt: string,
): DecomposedIntentStep[] {
  const raw = decomposeGuestBookAndManageCompoundPrompt(prompt);
  return raw.map((step) => ({
    action: step.action,
    params: step.params,
    reasoning: `Guest book and manage compound: ${step.action}`,
    segment: prompt,
  }));
}

function buildGuestPayCashManageGoldenSteps(
  prompt: string,
): DecomposedIntentStep[] {
  const raw = decomposeGuestPayCashManageCompoundPrompt(prompt);
  return raw.map((step) => ({
    action: step.action,
    params: step.params,
    reasoning: `Guest pay cash manage compound: ${step.action}`,
    segment: prompt,
  }));
}

function buildRebookAndPayGoldenSteps(prompt: string): DecomposedIntentStep[] {
  const raw = decomposeRebookAndPayCompoundPrompt(prompt);
  return raw.map((step) => ({
    action: step.action,
    params: step.params,
    reasoning: `Rebook and pay compound: ${step.action}`,
    segment: prompt,
  }));
}

function buildSubscriptionFirstVisitGoldenSteps(
  prompt: string,
): DecomposedIntentStep[] {
  const raw = decomposeSubscriptionFirstVisitCompoundPrompt(prompt);
  return raw.map((step) => ({
    action: step.action,
    params: step.params,
    reasoning: `Subscription first visit compound: ${step.action}`,
    segment: prompt,
  }));
}

function buildResultsThenRebookGoldenSteps(
  prompt: string,
): DecomposedIntentStep[] {
  const raw = decomposeResultsThenRebookCompoundPrompt(prompt);
  return raw.map((step) => ({
    action: step.action,
    params: step.params,
    reasoning: `Results then rebook compound: ${step.action}`,
    segment: prompt,
  }));
}

function buildDiscoverBookAndPayGoldenSteps(
  prompt: string,
  surface: Extract<CommandSurface, 'public' | 'customer'>,
): DecomposedIntentStep[] {
  const raw =
    surface === 'public'
      ? decomposePublicDiscoverBookAndPayCompoundPrompt(prompt)
      : decomposeCustomerDiscoverBookAndPayCompoundPrompt(prompt);
  return raw.map((step) => ({
    action: step.action,
    params: step.params,
    reasoning: `Discover book and pay compound: ${step.action}`,
    segment: prompt,
  }));
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
  const raw = decomposeFlexibleAvailabilityBudgetCompoundPrompt(
    prompt,
    surface,
  );
  return raw.map((step) => ({
    action: step.action,
    params: step.params,
    reasoning: `Flexible availability budget compound: ${step.action}`,
    segment: prompt,
  }));
}

export const GOLDEN_COMPOUND_PATTERNS: GoldenCompoundPattern[] = [
  {
    id: 'public_flexible_avail_list_budget_then_or',
    surface: 'public',
    recipeId: 'public_flexible_availability_list_budget_then_or_compound',
    matches: (prompt) =>
      isFlexibleAvailabilityListBudgetThenOrCompoundPrompt(prompt),
    buildSteps: (prompt) =>
      buildFlexibleAvailabilityBudgetCompoundGoldenSteps(prompt, 'public'),
  },
  {
    id: 'customer_flexible_avail_list_budget_then_or',
    surface: 'customer',
    recipeId: 'customer_flexible_availability_list_budget_then_or_compound',
    matches: (prompt) =>
      isFlexibleAvailabilityListBudgetThenOrCompoundPrompt(prompt),
    buildSteps: (prompt) =>
      buildFlexibleAvailabilityBudgetCompoundGoldenSteps(prompt, 'customer'),
  },
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
    id: 'customer_cancel_package_rebook_single',
    surface: 'customer',
    recipeId: CANCEL_PACKAGE_REBOOK_SINGLE_RECIPE_ID,
    matches: (prompt) => isCancelPackageRebookSingleCompoundPrompt(prompt),
    buildSteps: buildCancelPackageRebookSingleGoldenSteps,
  },
  {
    id: 'customer_cancel_and_rebook',
    surface: 'customer',
    recipeId: CANCEL_AND_REBOOK_RECIPE_ID,
    matches: (prompt) => isCancelAndRebookCompoundPrompt(prompt),
    buildSteps: buildCancelAndRebookGoldenSteps,
  },
  {
    id: 'customer_subscription_first_visit',
    surface: 'customer',
    recipeId: SUBSCRIPTION_FIRST_VISIT_RECIPE_ID,
    matches: (prompt) => isSubscriptionFirstVisitCompoundPrompt(prompt),
    buildSteps: buildSubscriptionFirstVisitGoldenSteps,
  },
  {
    id: 'customer_results_then_rebook',
    surface: 'customer',
    recipeId: RESULTS_THEN_REBOOK_RECIPE_ID,
    matches: (prompt) => isResultsThenRebookCompoundPrompt(prompt),
    buildSteps: buildResultsThenRebookGoldenSteps,
  },
  {
    id: 'customer_rebook_and_pay',
    surface: 'customer',
    recipeId: REBOOK_AND_PAY_RECIPE_ID,
    matches: (prompt) => isRebookAndPayCompoundPrompt(prompt),
    buildSteps: buildRebookAndPayGoldenSteps,
  },
  {
    id: 'customer_discover_book_and_pay',
    surface: 'customer',
    recipeId: DISCOVER_BOOK_AND_PAY_RECIPE_ID,
    matches: (prompt) => isDiscoverBookAndPayCompoundPrompt(prompt),
    buildSteps: (prompt) =>
      buildDiscoverBookAndPayGoldenSteps(prompt, 'customer'),
  },
  {
    id: 'public_discover_book_and_pay',
    surface: 'public',
    recipeId: PUBLIC_DISCOVER_BOOK_AND_PAY_RECIPE_ID,
    matches: (prompt) => isDiscoverBookAndPayCompoundPrompt(prompt),
    buildSteps: (prompt) =>
      buildDiscoverBookAndPayGoldenSteps(prompt, 'public'),
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
    id: 'dashboard_budget_discover_and_book',
    surface: 'dashboard',
    recipeId: BUDGET_DISCOVER_AND_BOOK_RECIPE_ID,
    matches: (prompt) => isBudgetDiscoverAndBookCompoundPrompt(prompt),
    buildSteps: (prompt) => {
      const raw = decomposeBudgetDiscoverAndBookCompoundPrompt(prompt);
      return raw.map((step) => ({
        action: step.action,
        params: step.params,
        reasoning: `Budget discover and book compound: ${step.action}`,
        segment: step.segment,
      }));
    },
  },
  {
    id: 'dashboard_rank_discover_and_book',
    surface: 'dashboard',
    recipeId: RANK_DISCOVER_AND_BOOK_RECIPE_ID,
    matches: (prompt) => isRankDiscoverAndBookCompoundPrompt(prompt),
    buildSteps: (prompt) => {
      const raw = decomposeRankDiscoverAndBookCompoundPrompt(prompt);
      return raw.map((step) => ({
        action: step.action,
        params: step.params,
        reasoning: `Rank discover and book compound: ${step.action}`,
        segment: step.segment,
      }));
    },
  },
  {
    id: 'dashboard_check_and_book_nearest',
    surface: 'dashboard',
    recipeId: 'dashboard_payments_compound',
    matches: (prompt) =>
      isCheckProvidersForServicePrompt(prompt) &&
      isBookNearestSlotPrompt(prompt) &&
      !isBudgetServiceDiscoveryCompoundPrompt(prompt) &&
      !isBudgetDiscoverAndBookCompoundPrompt(prompt) &&
      !isRankDiscoverAndBookCompoundPrompt(prompt),
    buildSteps: buildCheckAndBookGoldenSteps,
  },
  {
    id: 'customer_check_and_book_nearest',
    surface: 'customer',
    recipeId: 'customer_self_service_compound',
    matches: (prompt) =>
      isCheckProvidersForServicePrompt(prompt) &&
      isBookNearestSlotPrompt(prompt) &&
      !isBudgetServiceDiscoveryCompoundPrompt(prompt) &&
      !isDiscoverBookAndPayCompoundPrompt(prompt),
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
          action: 'apply_promo_code_checkout',
          params,
          reasoning: 'Apply or validate the promo code at checkout',
          segment: prompt,
        },
      ];
    },
  },
  {
    id: 'customer_book_package_with_nearest_slot',
    surface: 'customer',
    recipeId: BOOK_PACKAGE_WITH_NEAREST_SLOT_RECIPE_ID,
    matches: (prompt) => isBookPackageWithNearestSlotCompoundPrompt(prompt),
    buildSteps: (prompt) =>
      buildBookPackageWithNearestSlotGoldenSteps(prompt, 'customer'),
  },
  {
    id: 'public_book_package_with_nearest_slot',
    surface: 'public',
    recipeId: 'public_book_package_with_nearest_slot',
    matches: (prompt) => isBookPackageWithNearestSlotCompoundPrompt(prompt),
    buildSteps: (prompt) =>
      buildBookPackageWithNearestSlotGoldenSteps(prompt, 'public'),
  },
  {
    id: 'customer_intake_lab_book_pay',
    surface: 'customer',
    recipeId: INTAKE_LAB_BOOK_PAY_RECIPE_ID,
    matches: (prompt) => isIntakeLabBookPayCompoundPrompt(prompt),
    buildSteps: (prompt) =>
      buildIntakeLabBookPayGoldenSteps(prompt, 'customer'),
  },
  {
    id: 'public_intake_lab_book_pay',
    surface: 'public',
    recipeId: PUBLIC_INTAKE_LAB_BOOK_PAY_RECIPE_ID,
    matches: (prompt) => isIntakeLabBookPayCompoundPrompt(prompt),
    buildSteps: (prompt) => buildIntakeLabBookPayGoldenSteps(prompt, 'public'),
  },
  {
    id: 'customer_book_lab_collection_nearest',
    surface: 'customer',
    recipeId: BOOK_LAB_COLLECTION_NEAREST_RECIPE_ID,
    matches: (prompt) => isBookLabCollectionNearestCompoundPrompt(prompt),
    buildSteps: (prompt) =>
      buildBookLabCollectionNearestGoldenSteps(prompt, 'customer'),
  },
  {
    id: 'public_book_lab_collection_nearest',
    surface: 'public',
    recipeId: 'public_book_lab_collection_nearest',
    matches: (prompt) => isBookLabCollectionNearestCompoundPrompt(prompt),
    buildSteps: (prompt) =>
      buildBookLabCollectionNearestGoldenSteps(prompt, 'public'),
  },
  {
    id: 'customer_complete_intake_and_book',
    surface: 'customer',
    recipeId: COMPLETE_INTAKE_AND_BOOK_RECIPE_ID,
    matches: (prompt) => isCompleteIntakeAndBookCompoundPrompt(prompt),
    buildSteps: (prompt) =>
      buildCompleteIntakeAndBookGoldenSteps(prompt, 'customer'),
  },
  {
    id: 'public_complete_intake_and_book',
    surface: 'public',
    recipeId: PUBLIC_COMPLETE_INTAKE_AND_BOOK_RECIPE_ID,
    matches: (prompt) => isCompleteIntakeAndBookCompoundPrompt(prompt),
    buildSteps: (prompt) =>
      buildCompleteIntakeAndBookGoldenSteps(prompt, 'public'),
  },
  {
    id: 'customer_tour_group_checkout',
    surface: 'customer',
    recipeId: TOUR_GROUP_CHECKOUT_RECIPE_ID,
    matches: (prompt) => isTourGroupCheckoutCompoundPrompt(prompt),
    buildSteps: (prompt) =>
      buildTourGroupCheckoutGoldenSteps(prompt, 'customer'),
  },
  {
    id: 'public_tour_group_checkout',
    surface: 'public',
    recipeId: PUBLIC_TOUR_GROUP_CHECKOUT_RECIPE_ID,
    matches: (prompt) => isTourGroupCheckoutCompoundPrompt(prompt),
    buildSteps: (prompt) => buildTourGroupCheckoutGoldenSteps(prompt, 'public'),
  },
  {
    id: 'customer_book_tour_nearest_departure',
    surface: 'customer',
    recipeId: BOOK_TOUR_NEAREST_DEPARTURE_RECIPE_ID,
    matches: (prompt) => isBookTourNearestDepartureCompoundPrompt(prompt),
    buildSteps: (prompt) =>
      buildBookTourNearestDepartureGoldenSteps(prompt, 'customer'),
  },
  {
    id: 'public_book_tour_nearest_departure',
    surface: 'public',
    recipeId: PUBLIC_BOOK_TOUR_NEAREST_DEPARTURE_RECIPE_ID,
    matches: (prompt) => isBookTourNearestDepartureCompoundPrompt(prompt),
    buildSteps: (prompt) =>
      buildBookTourNearestDepartureGoldenSteps(prompt, 'public'),
  },
  {
    id: 'customer_book_with_gift_card_compound',
    surface: 'customer',
    recipeId: 'customer_self_service_compound',
    matches: (prompt) => isBookWithGiftCardCompoundPrompt(prompt),
    buildSteps: (prompt) => {
      const raw = decomposeBookWithGiftCardCompoundPrompt(prompt);
      return raw.map((step) => ({
        action: step.action,
        params: step.params,
        reasoning: `Gift card booking compound: ${step.action}`,
        segment: step.segment,
      }));
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
    id: 'customer_provider_same_day_multi',
    surface: 'customer',
    recipeId: PROVIDER_SAME_DAY_MULTI_RECIPE_ID,
    matches: (prompt) => isProviderSameDayMultiCompoundPrompt(prompt),
    buildSteps: buildProviderSameDayMultiGoldenSteps,
  },
  {
    id: 'customer_multi_service_day',
    surface: 'customer',
    recipeId: MULTI_SERVICE_DAY_RECIPE_ID,
    matches: (prompt) => isMultiServiceDayCompoundPrompt(prompt),
    buildSteps: buildMultiServiceDayGoldenSteps,
  },
  {
    id: 'customer_guest_pay_cash_manage',
    surface: 'customer',
    recipeId: GUEST_PAY_CASH_MANAGE_RECIPE_ID,
    matches: (prompt) => isGuestPayCashManageCompoundPrompt(prompt),
    buildSteps: buildGuestPayCashManageGoldenSteps,
  },
  {
    id: 'customer_guest_book_and_manage',
    surface: 'customer',
    recipeId: GUEST_BOOK_AND_MANAGE_RECIPE_ID,
    matches: (prompt) => isGuestBookAndManageCompoundPrompt(prompt),
    buildSteps: buildGuestBookAndManageGoldenSteps,
  },
  {
    id: 'customer_gift_card_checkout',
    surface: 'customer',
    recipeId: GIFT_CARD_CHECKOUT_RECIPE_ID,
    matches: (prompt) => isGiftCardCheckoutCompoundPrompt(prompt),
    buildSteps: buildGiftCardCheckoutGoldenSteps,
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
    id: 'dashboard_onboard_new_provider',
    surface: 'dashboard',
    recipeId: PROVIDER_ONBOARDING_COMPOUND_RECIPE_ID,
    matches: (prompt) => isProviderOnboardingCompoundPrompt(prompt),
    buildSteps: (prompt) => {
      const raw = decomposeProviderOnboardingCompoundPrompt(prompt);
      return raw.map((step) => ({
        action: step.action,
        params: step.params,
        reasoning: `Provider onboarding compound: ${step.action}`,
        segment: step.segment,
      }));
    },
  },
  {
    id: 'dashboard_setup_salon_checkout',
    surface: 'dashboard',
    recipeId: SETUP_SALON_CHECKOUT_COMPOUND_RECIPE_ID,
    matches: (prompt) => isSetupSalonCheckoutCompoundPrompt(prompt),
    buildSteps: (prompt) => {
      const raw = decomposeSetupSalonCheckoutCompoundPrompt(prompt);
      return raw.map((step) => ({
        action: step.action,
        params: step.params,
        reasoning: `Salon checkout setup compound: ${step.action}`,
        segment: step.segment,
      }));
    },
  },
  {
    id: 'dashboard_configure_services_payment_matrix',
    surface: 'dashboard',
    recipeId: CONFIGURE_SERVICES_PAYMENT_MATRIX_RECIPE_ID,
    matches: (prompt) => isConfigureServicesPaymentMatrixCompoundPrompt(prompt),
    buildSteps: (prompt) => {
      const raw = decomposeConfigureServicesPaymentMatrixCompoundPrompt(prompt);
      return raw.map((step) => ({
        action: step.action,
        params: step.params,
        reasoning: `Services payment matrix compound: ${step.action}`,
        segment: step.segment,
      }));
    },
  },
  {
    id: 'dashboard_cash_and_online_payment',
    surface: 'dashboard',
    recipeId: CASH_AND_ONLINE_PAYMENT_COMPOUND_RECIPE_ID,
    matches: (prompt) => isCashAndDeclineAllOnlinePaymentCompoundPrompt(prompt),
    buildSteps: (prompt) => {
      const raw = decomposeCashAndDeclineAllOnlinePaymentCompoundPrompt(prompt);
      return raw.map((step) => ({
        action: step.action,
        params: step.params,
        reasoning: `Cash + online payment compound: ${step.action}`,
        segment: step.segment,
      }));
    },
  },
  {
    id: 'dashboard_decline_online_payment_category',
    surface: 'dashboard',
    recipeId: DECLINE_ONLINE_PAYMENT_CATEGORY_RECIPE_ID,
    matches: (prompt) => isDeclineOnlinePaymentCategoryCompoundPrompt(prompt),
    buildSteps: (prompt) => {
      const raw = decomposeDeclineOnlinePaymentCategoryCompoundPrompt(prompt);
      return raw.map((step) => ({
        action: step.action,
        params: step.params,
        reasoning: `Decline/accept category payment compound: ${step.action}`,
        segment: step.segment,
      }));
    },
  },
  {
    id: 'dashboard_onboard_salon_notifications',
    surface: 'dashboard',
    recipeId: ONBOARD_SALON_NOTIFICATIONS_RECIPE_ID,
    matches: (prompt) => isOnboardSalonNotificationsCompoundPrompt(prompt),
    buildSteps: (prompt) => {
      const raw = decomposeOnboardSalonNotificationsCompoundPrompt(prompt);
      return raw.map((step) => ({
        action: step.action,
        params: step.params,
        reasoning: `Salon notification onboarding compound: ${step.action}`,
        segment: step.segment,
      }));
    },
  },
  {
    id: 'dashboard_launch_consumer_app_growth',
    surface: 'dashboard',
    recipeId: LAUNCH_CONSUMER_APP_GROWTH_RECIPE_ID,
    matches: (prompt) => isLaunchConsumerAppGrowthCompoundPrompt(prompt),
    buildSteps: (prompt) => {
      const raw = decomposeLaunchConsumerAppGrowthCompoundPrompt(prompt);
      return raw.map((step) => ({
        action: step.action,
        params: step.params,
        reasoning: `Consumer app growth launch compound: ${step.action}`,
        segment: step.segment,
      }));
    },
  },
  {
    id: 'dashboard_clinic_lab_day_close',
    surface: 'dashboard',
    recipeId: CLINIC_LAB_DAY_CLOSE_RECIPE_ID,
    matches: (prompt) => isClinicLabDayCloseCompoundPrompt(prompt),
    buildSteps: (prompt) => {
      const raw = decomposeClinicLabDayCloseCompoundPrompt(prompt);
      return raw.map((step) => ({
        action: step.action,
        params: step.params,
        reasoning: `Clinic lab day close compound: ${step.action}`,
        segment: step.segment,
      }));
    },
  },
  {
    id: 'dashboard_clinic_lab_review',
    surface: 'dashboard',
    recipeId: CLINIC_LAB_REVIEW_RECIPE_ID,
    matches: (prompt) => isClinicLabReviewCompoundPrompt(prompt),
    buildSteps: (prompt) => {
      const raw = decomposeClinicLabReviewCompoundPrompt(prompt);
      return raw.map((step) => ({
        action: step.action,
        params: step.params,
        reasoning: `Clinic lab review compound: ${step.action}`,
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
  if (isGuestPayCashManageCompoundPrompt(trimmed)) return true;
  if (isGuestBookAndManageCompoundPrompt(trimmed)) return true;
  if (isMultiServiceDayCompoundPrompt(trimmed)) return true;
  if (isProviderSameDayMultiCompoundPrompt(trimmed)) return true;
  if (isGiftCardCheckoutCompoundPrompt(trimmed)) return true;
  if (isCancelPackageRebookSingleCompoundPrompt(trimmed)) return true;
  if (isCancelAndRebookCompoundPrompt(trimmed)) return true;
  if (isSubscriptionFirstVisitCompoundPrompt(trimmed)) return true;
  if (isResultsThenRebookCompoundPrompt(trimmed)) return true;
  if (isRebookAndPayCompoundPrompt(trimmed)) return true;
  if (isDiscoverBookAndPayCompoundPrompt(trimmed)) return true;
  if (isBudgetServiceDiscoveryCompoundPrompt(trimmed)) return true;
  if (isServiceRankDiscoveryCompoundPrompt(trimmed)) return true;
  if (isProviderOnboardingCompoundPrompt(trimmed)) return true;
  if (isSetupSalonCheckoutCompoundPrompt(trimmed)) return true;
  if (isConfigureServicesPaymentMatrixCompoundPrompt(trimmed)) return true;
  if (isCashAndOnlinePaymentCompoundPrompt(trimmed)) return true;
  if (isDeclineOnlinePaymentCategoryCompoundPrompt(trimmed)) return true;
  if (isOnboardSalonNotificationsCompoundPrompt(trimmed)) return true;
  if (isLaunchConsumerAppGrowthCompoundPrompt(trimmed)) return true;
  if (isClinicLabDayCloseCompoundPrompt(trimmed)) return true;
  if (isBudgetDiscoverAndBookCompoundPrompt(trimmed)) return true;
  if (isRankDiscoverAndBookCompoundPrompt(trimmed)) return true;
  if (isBookPackageWithNearestSlotCompoundPrompt(trimmed)) return true;
  if (isBookLabCollectionNearestCompoundPrompt(trimmed)) return true;
  if (isIntakeLabBookPayCompoundPrompt(trimmed)) return true;
  if (isCompleteIntakeAndBookCompoundPrompt(trimmed)) return true;
  if (isBookTourNearestDepartureCompoundPrompt(trimmed)) return true;
  if (isTourGroupCheckoutCompoundPrompt(trimmed)) return true;
  if (isBookWithGiftCardCompoundPrompt(trimmed)) return true;
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
    action: 'apply_promo_code_checkout',
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

  if (surface === 'public' && isPublicMultiServiceCompoundPrompt(prompt)) {
    const rawSteps = decomposePublicMultiServiceCompoundPrompt(prompt);
    if (rawSteps.length >= 2) {
      const propagated = propagateCompoundStepParamsAcrossSteps(rawSteps);
      return {
        surface,
        recipeId: 'public_multi_service_compound',
        source: 'deterministic',
        steps: propagated.map((step, index) => ({
          action: step.action,
          params: step.params,
          segment: rawSteps[index]?.segment ?? prompt,
          reasoning: `Public multi-service compound: ${step.action}`,
        })),
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
