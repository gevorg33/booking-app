import { CommandComplexityRouterService } from '../command-complexity-router.service.js';
import { IntentDecompositionService } from '../intent-decomposition.service.js';
import { AiIntentRescueService } from '../ai-intent-rescue.service.js';
import { needsMultilingualNormalization } from '../ai-prompt-i18n.js';
import {
  resolveRescheduleParams,
  extractRescheduleTargetTime,
  extractRescheduleSourceTime,
} from '../ai-structural-extractors.js';
import {
  decomposeDeterministicForSurface,
  isCompoundPrompt,
} from '../intent-decomposition.util.js';
import {
  assessPhiInAiContext,
  redactEmbeddedPhiFromPrompt,
} from '../../../common/utils/phi-ai-guard.util.js';
import { rescueClinicLabBookingSurfaceForEval } from '../ai-clinic-lab-booking-multilingual.util.js';
import { enrichCatalogNotifyRescueParams } from '../ai-catalog-notify.util.js';
import { rescueCheckoutCurrencyIntent } from '../ai-checkout-currency.util.js';
import {
  enrichBudgetFromPrompt,
  rescueBudgetServiceDiscoveryIntent,
  resolveBudgetMisrouteAction,
  resolveBudgetMisrouteActionForSurface,
} from '../ai-budget-service-discovery.util.js';
import {
  enrichServiceRankFromPrompt,
  rescueServiceRankDiscoveryIntent,
} from '../ai-service-rank-discovery.util.js';
import { buildDashboardFlexibleAvailabilityEvalParams } from '../ai-flexible-availability.eval.util.js';
import { buildFlexibleAvailabilityEvalParams } from '../ai-flexible-availability-compound.util.js';
import { rescueSelfServiceBookingIntent } from '../ai-self-service-booking.util.js';
import { enrichCancelMyBookingParamsFromPrompt } from '../ai-cancel-my-booking.util.js';
import { enrichRescheduleMyBookingParamsFromPrompt } from '../ai-reschedule-my-booking.util.js';
import { enrichMultiServiceBookingParamsFromPrompt } from '../ai-multi-service-customer-public.util.js';
import { enrichPromoCodeHelpParamsFromPrompt } from '../ai-promo-code-help-customer-public.util.js';
import {
  enrichUseSubscriptionCreditParamsFromPrompt,
  rescueMembershipCustomerIntent,
} from '../ai-subscription-membership-customer.util.js';
import { rescuePrivacyGdprCustomerIntent } from '../ai-privacy-gdpr-customer.util.js';
import {
  enrichRequestGiftCardCancelParamsFromPrompt,
  rescueGiftCardCancelCustomerIntent,
} from '../ai-gift-card-cancel-customer.util.js';
import {
  enrichPackageVisitSelfParamsFromPrompt,
  rescuePackageVisitSelfCustomerIntent,
} from '../ai-package-visit-self-customer.util.js';
import {
  enrichListMyPackageVisitsParamsFromPrompt,
  rescueListMyPackageVisitsCustomerIntent,
} from '../ai-list-my-package-visits-customer.util.js';
import {
  enrichTourCustomerPublicParamsFromPrompt,
  rescueTourCustomerPublicIntent,
  type TourCustomerPublicAction,
} from '../ai-tour-customer-public.util.js';
import {
  enrichCheckoutRecommendationsParamsFromPrompt,
  rescueCheckoutRecommendationsCustomerPublicIntent,
} from '../ai-checkout-recommendations-customer-public.util.js';
import { rescueGrowthLoopsCustomerIntent } from '../ai-growth-loops-customer.util.js';
import { rescueConsumerAdoptionIntent } from '../ai-consumer-adoption.util.js';
import { rescueMarketingGrowthIntent } from '../ai-marketing-growth.util.js';
import {
  parseExplainConsumerCheckoutSuccessFromPrompt,
  rescueExplainConsumerCheckoutSuccessIntent,
} from '../ai-consumer-checkout-success.util.js';
import {
  parseExplainConsumerCheckoutTaxFromPrompt,
  rescueExplainConsumerCheckoutTaxIntent,
} from '../ai-consumer-checkout-tax.util.js';
import {
  parseExplainResultStatusFromPrompt,
  parseListMyTestResultsFromPrompt,
  rescueConsumerClinicTestResultsIntent,
} from '../ai-consumer-clinic-test-results.util.js';
import { rescueProviderPushSetupIntent } from '../ai-provider-push-setup.util.js';
import { rescuePaymentsIntent, extractServiceNameFromPrompt } from '../ai-payments.util.js';
import { enrichPrepaymentExplainParamsFromPrompt } from '../ai-explain-prepayment.util.js';
import { enrichExplainServicePriceParamsFromPrompt } from '../ai-explain-service-price.util.js';
import { enrichExplainPaymentOptionsParamsFromPrompt } from '../ai-explain-payment-options-for-service.util.js';
import { enrichFindSoonestParamsFromPrompt } from '../ai-find-soonest-appointment.util.js';
import { enrichCompareServicesParamsFromPrompt } from '../ai-compare-services.util.js';
import { enrichFilterServicesNoPrepaymentParamsFromPrompt } from '../ai-filter-services-no-prepayment.util.js';
import {
  enrichExplainAmountDueNowParamsFromPrompt,
} from '../ai-explain-amount-due-now.util.js';
import { rescueProviderAiIntent } from '../../provider-mobile/provider-ai-intent.util.js';
import {
  assertClinicTestResultExtAccessTierMatchesMatrix,
  assertClinicTestResultExtClassifierDetect,
} from '../ai-clinic-test-result-ext.eval.util.js';
import { impliesBookingFirstAvailableFromSemantic } from '../booking-first-available.semantic.util.js';
import { impliesTeamWideAvailabilityFromSemantic } from '../team-wide-availability.semantic.util.js';
import { impliesAnyProviderBookingFromSemantic } from '../any-provider-booking.semantic.util.js';
import { impliesRecommendSpecialistsFromSemantic } from '../recommend-specialists.semantic.util.js';
import {
  resolveAppointmentMetricFromSemantic,
  resolveBookingMetricFromSemantic,
  resolveCustomerMetricFromSemantic,
  resolveServiceMetricFromSemantic,
  resolveStaffMetricFromSemantic,
} from '../metric-resolvers.semantic.util.js';
import { validateCommand } from '../command-completion.validator.js';
import type { ResolvedCommand } from '../command-completion.types.js';
import {
  enrichGuideTopicFromPrompt,
  rescueProductGuideIntent,
} from '../ai-product-guide-rescue.util.js';
import { getIntentAnchorBank } from '../intent-anchor.bank.js';
import {
  filterAnchorsForSurface,
  rankAnchorsDeterministic,
  buildSemanticMatchFromAnchor,
  resolveSemanticMatch,
  SEMANTIC_CONCEPT_THRESHOLD,
} from '../ai-semantic-intent.util.js';
import { resolveSemanticAllowedActions } from '../semantic-allowed-actions.util.js';
import type {
  AiCommandEvalCase,
  AiEvalCaseResult,
} from './ai-command-eval.types.js';

const HIPAA_EVAL_SETTINGS = {
  businessType: 'clinic',
  hipaa: { enabled: true, baaAcceptedAt: '2026-01-01' },
};

const decomposition = {
  isCompoundPrompt,
} as IntentDecompositionService;

const router = new CommandComplexityRouterService(decomposition);
const rescue = new AiIntentRescueService();

const SAMPLE_EMPLOYEES = [
  { id: 'emp-1', name: 'Gevorg Gasparyan' },
  { id: 'emp-2', name: 'Mary Torgomyan' },
  { id: 'emp-3', name: 'Maria Lopez' },
];

function valuesMatchPartial(actual: unknown, expected: unknown): boolean {
  if (Array.isArray(expected)) {
    return (
      Array.isArray(actual) &&
      expected.length === actual.length &&
      expected.every((item, index) =>
        valuesMatchPartial(actual[index], item),
      )
    );
  }
  if (expected !== null && typeof expected === 'object') {
    if (actual === null || typeof actual !== 'object' || Array.isArray(actual)) {
      return false;
    }
    return Object.entries(expected as Record<string, unknown>).every(
      ([key, value]) =>
        valuesMatchPartial(
          (actual as Record<string, unknown>)[key],
          value,
        ),
    );
  }
  return actual === expected;
}

function paramsMatchPartial(
  actual: Record<string, unknown>,
  expected: Record<string, unknown>,
): string[] {
  const errors: string[] = [];
  for (const [key, value] of Object.entries(expected)) {
    if (!valuesMatchPartial(actual[key], value)) {
      errors.push(
        `params.${key}: expected ${JSON.stringify(value)}, got ${JSON.stringify(actual[key])}`,
      );
    }
  }
  return errors;
}

/** Evaluate one golden case using deterministic routing/parsing only. */
export function evaluateDeterministicEvalCase(
  evalCase: AiCommandEvalCase,
  timeZone = 'UTC',
): AiEvalCaseResult {
  const errors: string[] = [];
  const { expect } = evalCase;
  const prompt = evalCase.prompt;

  if (expect.useBookingFirstAvailableSemanticDetect) {
    const surfaces = evalCase.surface
      ? ([evalCase.surface] as const)
      : undefined;
    const actual = impliesBookingFirstAvailableFromSemantic(prompt, surfaces);
    if (actual !== expect.bookingFirstAvailableSemantic) {
      errors.push(
        `bookingFirstAvailableSemantic: expected ${expect.bookingFirstAvailableSemantic}, got ${actual}`,
      );
    }
    return { id: evalCase.id, passed: errors.length === 0, errors };
  }

  if (expect.useTeamWideAvailabilitySemanticDetect) {
    const surfaces = evalCase.surface
      ? ([evalCase.surface] as const)
      : undefined;
    const actual = impliesTeamWideAvailabilityFromSemantic(prompt, surfaces);
    if (actual !== expect.teamWideAvailabilitySemantic) {
      errors.push(
        `teamWideAvailabilitySemantic: expected ${expect.teamWideAvailabilitySemantic}, got ${actual}`,
      );
    }
    return { id: evalCase.id, passed: errors.length === 0, errors };
  }

  if (expect.useAnyProviderBookingSemanticDetect) {
    const surfaces = evalCase.surface
      ? ([evalCase.surface] as const)
      : undefined;
    const actual = impliesAnyProviderBookingFromSemantic(prompt, surfaces);
    if (actual !== expect.anyProviderBookingSemantic) {
      errors.push(
        `anyProviderBookingSemantic: expected ${expect.anyProviderBookingSemantic}, got ${actual}`,
      );
    }
    return { id: evalCase.id, passed: errors.length === 0, errors };
  }

  if (expect.useRecommendSpecialistsSemanticDetect) {
    const surfaces = evalCase.surface
      ? ([evalCase.surface] as const)
      : undefined;
    const actual = impliesRecommendSpecialistsFromSemantic(prompt, surfaces);
    if (actual !== expect.recommendSpecialistsSemantic) {
      errors.push(
        `recommendSpecialistsSemantic: expected ${expect.recommendSpecialistsSemantic}, got ${actual}`,
      );
    }
    return { id: evalCase.id, passed: errors.length === 0, errors };
  }

  if (expect.useMetricResolverSemanticDetect) {
    const surface = evalCase.surface ?? 'dashboard';
    const kind = expect.metricResolverKind;
    const expected = expect.metricResolverExpected;
    let actual: string | null = null;
    if (kind === 'booking') {
      actual = resolveBookingMetricFromSemantic(prompt, surface);
    } else if (kind === 'staff') {
      actual = resolveStaffMetricFromSemantic(prompt, surface);
    } else if (kind === 'service') {
      actual = resolveServiceMetricFromSemantic(prompt, surface);
    } else if (kind === 'customer') {
      actual = resolveCustomerMetricFromSemantic(prompt, surface);
    } else if (kind === 'appointment') {
      actual = resolveAppointmentMetricFromSemantic(prompt, surface);
    }
    const matched =
      expect.metricResolverSemantic === true
        ? actual === expected
        : actual !== expected;
    if (!matched) {
      errors.push(
        `metricResolverSemantic(${kind}): expected ${expect.metricResolverSemantic ? expected : `not ${expected}`}, got ${actual}`,
      );
    }
    return { id: evalCase.id, passed: errors.length === 0, errors };
  }

  if (expect.useSemanticIntentMatch) {
    const surface = evalCase.surface ?? 'dashboard';
    const allowedActions = resolveSemanticAllowedActions(surface);
    const anchors = filterAnchorsForSurface(
      getIntentAnchorBank(),
      surface,
      allowedActions,
    );
    const ranked = rankAnchorsDeterministic(prompt, anchors);
    let match = resolveSemanticMatch(ranked, {
      threshold: SEMANTIC_CONCEPT_THRESHOLD,
    });
    if (
      !match &&
      expect.semanticMatchUseTopAnchorFallback &&
      ranked[0] &&
      ranked[0].score >= SEMANTIC_CONCEPT_THRESHOLD
    ) {
      match = buildSemanticMatchFromAnchor(ranked[0].anchor, ranked[0].score);
    }
    const expectedAction =
      expect.semanticMatchAction ?? expect.rescuedAction ?? expect.action;
    if (!expectedAction) {
      errors.push('semanticMatchAction: missing expected action on eval case');
    } else if (!match || match.action !== expectedAction) {
      errors.push(
        `semanticMatchAction: expected ${expectedAction}, got ${match?.action ?? 'none'}`,
      );
    }
    if (expect.rescueReason && match?.rescueReason !== expect.rescueReason) {
      errors.push(
        `rescueReason: expected ${expect.rescueReason}, got ${match?.rescueReason ?? 'none'}`,
      );
    }
    const paramsExpect =
      expect.semanticMatchParamsPartial ?? expect.paramsPartial;
    if (paramsExpect) {
      if (!match?.paramHints) {
        errors.push('semanticMatchParamsPartial: matcher returned no paramHints');
      } else {
        errors.push(...paramsMatchPartial(match.paramHints, paramsExpect));
      }
    }
    return { id: evalCase.id, passed: errors.length === 0, errors };
  }

  if (expect.needsMultilingual !== undefined) {
    const actual = needsMultilingualNormalization(prompt);
    if (actual !== expect.needsMultilingual) {
      errors.push(
        `needsMultilingual: expected ${expect.needsMultilingual}, got ${actual}`,
      );
    }
  }

  if (expect.useProductGuideTopicEnrich && evalCase.surface && !expect.rescuedAction) {
    const topicId = enrichGuideTopicFromPrompt(prompt, {
      surface: evalCase.surface,
      route: expect.guideEvalRoute,
      activationStep: expect.guideEvalActivationStep,
    });
    if (expect.paramsPartial?.topicId != null) {
      if (topicId !== expect.paramsPartial.topicId) {
        errors.push(
          `guideTopicId: expected ${expect.paramsPartial.topicId}, got ${topicId ?? 'none'}`,
        );
      }
    }
  }

  if (expect.routeTier) {
    const route = router.routeDeterministic(prompt, SAMPLE_EMPLOYEES);
    if (route.tier !== expect.routeTier) {
      errors.push(`routeTier: expected ${expect.routeTier}, got ${route.tier}`);
    }
  }

  if (
    expect.rescheduleTimeSlot ||
    expect.rescheduleFromTimeSlot ||
    expect.paramsPartial
  ) {
    const params: Record<string, unknown> = {};
    resolveRescheduleParams(params, prompt, timeZone);
    if (expect.rescheduleTimeSlot) {
      const parsed =
        (params.timeSlot as string | undefined) ??
        extractRescheduleTargetTime(prompt);
      if (parsed !== expect.rescheduleTimeSlot) {
        errors.push(
          `rescheduleTimeSlot: expected ${expect.rescheduleTimeSlot}, got ${parsed ?? 'null'}`,
        );
      }
    }
    if (expect.rescheduleFromTimeSlot) {
      const parsed =
        (params.fromTimeSlot as string | undefined) ??
        extractRescheduleSourceTime(prompt);
      if (parsed !== expect.rescheduleFromTimeSlot) {
        errors.push(
          `rescheduleFromTimeSlot: expected ${expect.rescheduleFromTimeSlot}, got ${parsed ?? 'null'}`,
        );
      }
    }
    if (
      expect.paramsPartial &&
      !expect.rescuedAction &&
      !expect.useClinicTestResultExtClassifierDetect &&
      !expect.useSurfaceFlexibleAvailabilityEnrichment &&
      !expect.useProductGuideTopicEnrich
    ) {
      errors.push(...paramsMatchPartial(params, expect.paramsPartial));
    }
  }

  if (
    expect.useSurfaceFlexibleAvailabilityEnrichment === true &&
    evalCase.surface &&
    (evalCase.surface === 'public' ||
      evalCase.surface === 'customer' ||
      evalCase.surface === 'dashboard')
  ) {
    const enriched =
      evalCase.surface === 'dashboard'
        ? buildDashboardFlexibleAvailabilityEvalParams(prompt)
        : buildFlexibleAvailabilityEvalParams(
            prompt,
            evalCase.surface,
            expect.enrichedAction ?? 'check_availability',
          );
    if (expect.paramsPartial) {
      errors.push(...paramsMatchPartial(enriched, expect.paramsPartial));
    }
  }

  if (expect.rescuedAction) {
    const misclassifiedAction = expect.rescueFromAction ?? 'unknown';
    const useSurfaceSelfServiceRescue =
      expect.useSurfaceSelfServiceRescue === true &&
      (evalCase.surface === 'customer' || evalCase.surface === 'public');
    const useSurfaceMembershipCustomerRescue =
      expect.useSurfaceMembershipCustomerRescue === true &&
      evalCase.surface === 'customer';
    const useSurfacePrivacyGdprCustomerRescue =
      expect.useSurfacePrivacyGdprCustomerRescue === true &&
      evalCase.surface === 'customer';
    const useSurfaceGiftCardCancelCustomerRescue =
      expect.useSurfaceGiftCardCancelCustomerRescue === true &&
      evalCase.surface === 'customer';
    const useSurfacePackageVisitSelfCustomerRescue =
      expect.useSurfacePackageVisitSelfCustomerRescue === true &&
      evalCase.surface === 'customer';
    const useSurfaceListMyPackageVisitsCustomerRescue =
      expect.useSurfaceListMyPackageVisitsCustomerRescue === true &&
      evalCase.surface === 'customer';
    const useSurfaceTourCustomerPublicRescue =
      expect.useSurfaceTourCustomerPublicRescue === true &&
      (evalCase.surface === 'customer' || evalCase.surface === 'public');
    const useSurfaceCheckoutRecommendationsCustomerPublicRescue =
      expect.useSurfaceCheckoutRecommendationsCustomerPublicRescue === true &&
      (evalCase.surface === 'customer' || evalCase.surface === 'public');
    const useSurfaceGrowthLoopsCustomerRescue =
      expect.useSurfaceGrowthLoopsCustomerRescue === true &&
      evalCase.surface === 'customer';
    const useSurfaceConsumerAdoptionRescue =
      expect.useSurfaceConsumerAdoptionRescue === true &&
      evalCase.surface === 'customer';
    const useSurfaceMarketingGrowthRescue =
      expect.useSurfaceMarketingGrowthRescue === true &&
      (evalCase.surface === 'customer' || evalCase.surface === 'public');
    const useSurfaceConsumerCheckoutSuccessRescue =
      expect.useSurfaceConsumerCheckoutSuccessRescue === true &&
      evalCase.surface === 'customer';
    const useSurfaceConsumerCheckoutTaxRescue =
      expect.useSurfaceConsumerCheckoutTaxRescue === true &&
      evalCase.surface === 'customer';
    const useSurfaceConsumerClinicTestResultsRescue =
      expect.useSurfaceConsumerClinicTestResultsRescue === true &&
      evalCase.surface === 'customer';
    const useSurfaceProviderImplicationRescue =
      expect.useSurfaceProviderImplicationRescue === true &&
      evalCase.surface === 'provider';
    const useSurfaceProviderPushSetupRescue =
      expect.useSurfaceProviderPushSetupRescue === true &&
      evalCase.surface === 'provider';
    const useSurfacePaymentsRescue =
      expect.useSurfacePaymentsRescue === true &&
      (evalCase.surface === 'customer' || evalCase.surface === 'public');
    const useSurfaceLabBookingRescue =
      expect.useSurfaceLabBookingRescue === true && !!evalCase.surface;
    const useSurfaceBudgetRescue =
      expect.useSurfaceBudgetRescue === true && !!evalCase.surface;
    const useCheckoutCurrencyRescue =
      expect.useCheckoutCurrencyRescue === true;
    const useSurfaceRankRescue =
      expect.useSurfaceRankRescue === true && !!evalCase.surface;
    const surfaceRescued = useSurfaceLabBookingRescue
      ? rescueClinicLabBookingSurfaceForEval(
          prompt,
          misclassifiedAction,
          evalCase.surface as 'dashboard' | 'customer' | 'provider',
        )
      : null;
    const checkoutCurrencyRescued = useCheckoutCurrencyRescue
      ? rescueCheckoutCurrencyIntent(prompt, misclassifiedAction)
      : null;
    const budgetRescued = useSurfaceBudgetRescue
      ? rescueBudgetServiceDiscoveryIntent(
          prompt,
          misclassifiedAction,
          evalCase.surface as 'public' | 'customer' | 'dashboard',
        )
      : null;
    const rankRescued = useSurfaceRankRescue
      ? rescueServiceRankDiscoveryIntent(
          prompt,
          misclassifiedAction,
          evalCase.surface as 'public' | 'customer' | 'dashboard',
        )
      : null;
    const selfServiceRescued = useSurfaceSelfServiceRescue
      ? rescueSelfServiceBookingIntent(prompt, misclassifiedAction)
      : null;
    const membershipCustomerRescued = useSurfaceMembershipCustomerRescue
      ? rescueMembershipCustomerIntent(prompt, misclassifiedAction)
      : null;
    const privacyGdprCustomerRescued = useSurfacePrivacyGdprCustomerRescue
      ? rescuePrivacyGdprCustomerIntent(prompt, misclassifiedAction)
      : null;
    const giftCardCancelCustomerRescued = useSurfaceGiftCardCancelCustomerRescue
      ? rescueGiftCardCancelCustomerIntent(prompt, misclassifiedAction)
      : null;
    const packageVisitSelfCustomerRescued =
      useSurfacePackageVisitSelfCustomerRescue
        ? rescuePackageVisitSelfCustomerIntent(prompt, misclassifiedAction)
        : null;
    const listMyPackageVisitsCustomerRescued =
      useSurfaceListMyPackageVisitsCustomerRescue
        ? rescueListMyPackageVisitsCustomerIntent(prompt, misclassifiedAction)
        : null;
    const tourCustomerPublicRescued = useSurfaceTourCustomerPublicRescue
      ? rescueTourCustomerPublicIntent(prompt, misclassifiedAction)
      : null;
    const checkoutRecommendationsCustomerPublicRescued =
      useSurfaceCheckoutRecommendationsCustomerPublicRescue
        ? rescueCheckoutRecommendationsCustomerPublicIntent(
            prompt,
            misclassifiedAction,
          )
        : null;
    const growthLoopsCustomerRescued = useSurfaceGrowthLoopsCustomerRescue
      ? rescueGrowthLoopsCustomerIntent(prompt, misclassifiedAction)
      : null;
    const consumerAdoptionRescued = useSurfaceConsumerAdoptionRescue
      ? rescueConsumerAdoptionIntent(prompt, misclassifiedAction)
      : null;
    const marketingGrowthRescued = useSurfaceMarketingGrowthRescue
      ? rescueMarketingGrowthIntent(prompt, misclassifiedAction)
      : null;
    const consumerCheckoutSuccessRescued =
      useSurfaceConsumerCheckoutSuccessRescue
        ? rescueExplainConsumerCheckoutSuccessIntent(prompt, misclassifiedAction)
        : null;
    const consumerCheckoutSuccessParsed =
      useSurfaceConsumerCheckoutSuccessRescue
        ? parseExplainConsumerCheckoutSuccessFromPrompt(prompt)
        : null;
    const consumerCheckoutTaxRescued = useSurfaceConsumerCheckoutTaxRescue
      ? rescueExplainConsumerCheckoutTaxIntent(prompt, misclassifiedAction)
      : null;
    const consumerCheckoutTaxParsed = useSurfaceConsumerCheckoutTaxRescue
      ? parseExplainConsumerCheckoutTaxFromPrompt(prompt)
      : null;
    const consumerClinicTestResultsRescued =
      useSurfaceConsumerClinicTestResultsRescue
        ? rescueConsumerClinicTestResultsIntent(prompt, misclassifiedAction)
        : null;
    const consumerClinicListParsed = useSurfaceConsumerClinicTestResultsRescue
      ? parseListMyTestResultsFromPrompt(prompt)
      : null;
    const consumerClinicExplainParsed = useSurfaceConsumerClinicTestResultsRescue
      ? parseExplainResultStatusFromPrompt(prompt)
      : null;
    const providerPushSetupRescued = useSurfaceProviderPushSetupRescue
      ? rescueProviderPushSetupIntent(prompt, misclassifiedAction)
      : null;
    const paymentsRescued = useSurfacePaymentsRescue
      ? rescuePaymentsIntent(prompt, misclassifiedAction)
      : null;
    const providerImplicationAction = useSurfaceProviderImplicationRescue
      ? rescueProviderAiIntent(prompt, misclassifiedAction)
      : null;
    const useProductGuideRescue =
      expect.useProductGuideRescue === true && !!evalCase.surface;
    const productGuideRescued = useProductGuideRescue
      ? (() => {
          const result = rescueProductGuideIntent(prompt, misclassifiedAction, {
            surface: evalCase.surface!,
          });
          if (result.action === misclassifiedAction) return null;
          const params: Record<string, unknown> = {};
          if (expect.useProductGuideTopicEnrich) {
            const topicId = enrichGuideTopicFromPrompt(prompt, {
              surface: evalCase.surface!,
              route: expect.guideEvalRoute,
              topicId: expect.paramsPartial?.topicId,
              activationStep: expect.guideEvalActivationStep,
            });
            if (topicId) params.topicId = topicId;
          }
          return {
            action: result.action,
            params,
            rescued: true,
            rescueReason: result.rescueReason ?? 'product_guide_rescue',
          };
        })()
      : null;
    const rescued = useSurfaceGrowthLoopsCustomerRescue
      ? growthLoopsCustomerRescued
        ? {
            action: growthLoopsCustomerRescued.action,
            params: {},
            rescued: true,
            rescueReason: growthLoopsCustomerRescued.rescueReason,
          }
        : null
      : useSurfaceConsumerAdoptionRescue
      ? consumerAdoptionRescued
        ? {
            action: consumerAdoptionRescued.action,
            params: {},
            rescued: true,
            rescueReason: consumerAdoptionRescued.rescueReason,
          }
        : null
      : useSurfaceCheckoutRecommendationsCustomerPublicRescue
      ? checkoutRecommendationsCustomerPublicRescued
        ? {
            action: checkoutRecommendationsCustomerPublicRescued.action,
            params: enrichCheckoutRecommendationsParamsFromPrompt({}, prompt),
            rescued: true,
            rescueReason:
              checkoutRecommendationsCustomerPublicRescued.rescueReason,
          }
        : null
      : useSurfaceTourCustomerPublicRescue
      ? tourCustomerPublicRescued
        ? {
            action: tourCustomerPublicRescued.action,
            params: enrichTourCustomerPublicParamsFromPrompt(
              {},
              prompt,
              tourCustomerPublicRescued.action as TourCustomerPublicAction,
            ),
            rescued: true,
            rescueReason: tourCustomerPublicRescued.rescueReason,
          }
        : null
      : useSurfaceListMyPackageVisitsCustomerRescue
      ? listMyPackageVisitsCustomerRescued
        ? {
            action: listMyPackageVisitsCustomerRescued.action,
            params: enrichListMyPackageVisitsParamsFromPrompt({}, prompt),
            rescued: true,
            rescueReason: listMyPackageVisitsCustomerRescued.rescueReason,
          }
        : null
      : useSurfacePackageVisitSelfCustomerRescue
      ? packageVisitSelfCustomerRescued
        ? {
            action: packageVisitSelfCustomerRescued.action,
            params: enrichPackageVisitSelfParamsFromPrompt(
              {},
              prompt,
              packageVisitSelfCustomerRescued.action,
            ),
            rescued: true,
            rescueReason: packageVisitSelfCustomerRescued.rescueReason,
          }
        : null
      : useSurfaceGiftCardCancelCustomerRescue
      ? giftCardCancelCustomerRescued
        ? {
            action: giftCardCancelCustomerRescued.action,
            params: enrichRequestGiftCardCancelParamsFromPrompt({}, prompt),
            rescued: true,
            rescueReason: giftCardCancelCustomerRescued.rescueReason,
          }
        : null
      : useSurfacePrivacyGdprCustomerRescue
      ? privacyGdprCustomerRescued
        ? {
            action: privacyGdprCustomerRescued.action,
            params: {},
            rescued: true,
            rescueReason: privacyGdprCustomerRescued.rescueReason,
          }
        : null
      : useSurfaceMembershipCustomerRescue
      ? membershipCustomerRescued
        ? {
            action: membershipCustomerRescued.action,
            params:
              membershipCustomerRescued.action === 'use_subscription_credit'
                ? enrichUseSubscriptionCreditParamsFromPrompt({}, prompt)
                : {},
            rescued: true,
            rescueReason: membershipCustomerRescued.rescueReason,
          }
        : null
      : useSurfaceSelfServiceRescue
      ? selfServiceRescued
        ? {
            action: selfServiceRescued.action,
            params:
              selfServiceRescued.action === 'cancel_my_booking'
                ? enrichCancelMyBookingParamsFromPrompt({}, prompt)
                : selfServiceRescued.action === 'reschedule_my_booking'
                  ? enrichRescheduleMyBookingParamsFromPrompt({}, prompt)
                  : selfServiceRescued.action === 'book_multi_service' ||
                      selfServiceRescued.action ===
                        'check_multi_service_availability' ||
                      selfServiceRescued.action === 'add_services_to_cart'
                    ? enrichMultiServiceBookingParamsFromPrompt({}, prompt)
                    : {},
            rescued: true,
            rescueReason: selfServiceRescued.rescueReason,
          }
        : null
      : useSurfaceMarketingGrowthRescue
        ? marketingGrowthRescued
          ? {
              action: marketingGrowthRescued.action,
              params:
                marketingGrowthRescued.action === 'promo_code_help'
                  ? enrichPromoCodeHelpParamsFromPrompt({}, prompt)
                  : {},
              rescued: true,
              rescueReason: marketingGrowthRescued.rescueReason,
            }
          : null
        : useSurfaceConsumerCheckoutSuccessRescue
          ? consumerCheckoutSuccessRescued && consumerCheckoutSuccessParsed
            ? {
                action: consumerCheckoutSuccessRescued.action,
                params: {
                  aspect: consumerCheckoutSuccessParsed.aspect,
                },
                rescued: true,
                rescueReason: consumerCheckoutSuccessRescued.rescueReason,
              }
            : null
          : useSurfaceConsumerCheckoutTaxRescue
            ? consumerCheckoutTaxRescued && consumerCheckoutTaxParsed
              ? {
                  action: consumerCheckoutTaxRescued.action,
                  params: {
                    aspect: consumerCheckoutTaxParsed.aspect,
                  },
                  rescued: true,
                  rescueReason: consumerCheckoutTaxRescued.rescueReason,
                }
              : null
            : useSurfaceConsumerClinicTestResultsRescue
              ? consumerClinicTestResultsRescued
                ? {
                    action: consumerClinicTestResultsRescued.action,
                    params:
                      consumerClinicTestResultsRescued.action ===
                      'list_my_test_results'
                        ? { ...(consumerClinicListParsed ?? {}) }
                        : { ...(consumerClinicExplainParsed ?? {}) },
                    rescued: true,
                    rescueReason: consumerClinicTestResultsRescued.rescueReason,
                  }
                : null
              : useSurfaceProviderImplicationRescue
                ? providerImplicationAction &&
                  providerImplicationAction !== misclassifiedAction
                  ? {
                      action: providerImplicationAction,
                      params: {},
                      rescued: true,
                      rescueReason: 'provider_heuristic',
                    }
                  : null
              : useSurfaceProviderPushSetupRescue
                ? providerPushSetupRescued
                  ? {
                      action: providerPushSetupRescued.action,
                      params: {},
                      rescued: true,
                      rescueReason: providerPushSetupRescued.rescueReason,
                    }
                  : null
                : useSurfacePaymentsRescue
                  ? paymentsRescued
                    ? {
                        action: paymentsRescued.action,
                        params:
                          paymentsRescued.action ===
                            'explain_why_stripe_required' ||
                          paymentsRescued.action === 'explain_checkout_total' ||
                          paymentsRescued.action === 'explain_service_price' ||
                          paymentsRescued.action ===
                            'explain_payment_options_for_service' ||
                          paymentsRescued.action === 'find_soonest_appointment' ||
                          paymentsRescued.action === 'compare_services' ||
                          paymentsRescued.action === 'filter_services_no_prepayment' ||
                          paymentsRescued.action === 'explain_amount_due_now'
                            ? paymentsRescued.action === 'explain_service_price'
                              ? enrichExplainServicePriceParamsFromPrompt({}, prompt)
                              : paymentsRescued.action ===
                                  'explain_payment_options_for_service'
                                ? enrichExplainPaymentOptionsParamsFromPrompt(
                                    {},
                                    prompt,
                                  )
                                : paymentsRescued.action ===
                                    'find_soonest_appointment'
                                  ? enrichFindSoonestParamsFromPrompt({}, prompt)
                                  : paymentsRescued.action === 'compare_services'
                                    ? enrichCompareServicesParamsFromPrompt(
                                        {},
                                        prompt,
                                      )
                                    : paymentsRescued.action ===
                                        'filter_services_no_prepayment'
                                      ? enrichFilterServicesNoPrepaymentParamsFromPrompt(
                                          {},
                                          prompt,
                                        )
                                      : paymentsRescued.action ===
                                          'explain_amount_due_now'
                                        ? enrichExplainAmountDueNowParamsFromPrompt(
                                            {},
                                            prompt,
                                            extractServiceNameFromPrompt,
                                          )
                                        : enrichPrepaymentExplainParamsFromPrompt(
                                          {},
                                          prompt,
                                          extractServiceNameFromPrompt,
                                        )
                            : {},
                        rescued: true,
                        rescueReason: paymentsRescued.rescueReason,
                      }
                    : null
      : useSurfaceLabBookingRescue
      ? surfaceRescued
        ? {
            action: surfaceRescued.action,
            params: surfaceRescued.params,
            rescued: true,
            rescueReason: surfaceRescued.rescueReason,
          }
        : null
      : useProductGuideRescue
        ? productGuideRescued
        : useCheckoutCurrencyRescue
        ? checkoutCurrencyRescued
          ? {
              action: checkoutCurrencyRescued.action,
              params: enrichBudgetFromPrompt({}, prompt),
              rescued: true,
              rescueReason: checkoutCurrencyRescued.rescueReason,
            }
          : null
      : useSurfaceRankRescue
        ? rankRescued
          ? {
              action: rankRescued.action,
              params: rankRescued.params,
              rescued: true,
              rescueReason: rankRescued.rescueReason,
            }
          : null
        : useSurfaceBudgetRescue
          ? budgetRescued
            ? {
                action: budgetRescued.action,
                params: enrichBudgetFromPrompt({}, prompt),
                rescued: true,
                rescueReason: budgetRescued.rescueReason,
              }
            : null
          : rescue.rescue({
            prompt,
            action: misclassifiedAction,
            params: {},
            employees: SAMPLE_EMPLOYEES,
            surface: evalCase.surface,
          });
    if (!rescued?.rescued || rescued.action !== expect.rescuedAction) {
      const keptMutateAction =
        useProductGuideRescue &&
        productGuideRescued === null &&
        expect.rescuedAction === misclassifiedAction;
      if (!keptMutateAction) {
        errors.push(
          `rescuedAction: expected ${expect.rescuedAction}, got ${rescued?.action ?? 'none'}`,
        );
      }
    }
    if (expect.rescueReason && rescued?.rescueReason !== expect.rescueReason) {
      errors.push(
        `rescueReason: expected ${expect.rescueReason}, got ${rescued?.rescueReason ?? 'none'}`,
      );
    }
    if (expect.paramsPartial) {
      if (!rescued?.params) {
        errors.push('paramsPartial: rescue returned no params object');
      } else {
        enrichCatalogNotifyRescueParams(rescued.action, rescued.params, prompt);
        errors.push(...paramsMatchPartial(rescued.params, expect.paramsPartial));
      }
    } else if (rescued?.params) {
      enrichCatalogNotifyRescueParams(rescued.action, rescued.params, prompt);
    }
  }

  if (expect.action && !expect.rescuedAction && !expect.useClinicTestResultExtClassifierDetect) {
    errors.push(
      'action expectation requires requiresLlm or rescuedAction in deterministic eval',
    );
  }

  if (expect.useClinicTestResultExtClassifierDetect) {
    errors.push(
      ...assertClinicTestResultExtClassifierDetect(prompt, expect),
    );
    if (expect.needsMultilingual !== undefined) {
      const actual = needsMultilingualNormalization(prompt);
      if (actual !== expect.needsMultilingual) {
        errors.push(
          `needsMultilingual: expected ${expect.needsMultilingual}, got ${actual}`,
        );
      }
    }
  }

  if (
    expect.compoundSurface !== undefined ||
    expect.compoundSteps !== undefined ||
    expect.compoundActionsContains !== undefined ||
    expect.compoundMinSteps !== undefined ||
    expect.compoundExpectEmpty !== undefined ||
    expect.compoundSource !== undefined ||
    expect.compoundRecipeId !== undefined ||
    expect.compoundStepParams !== undefined
  ) {
    const surface = expect.compoundSurface ?? 'dashboard';
    const decompositionResult = decomposeDeterministicForSurface(
      surface,
      prompt,
    );

    if (expect.compoundExpectEmpty) {
      if (decompositionResult && decompositionResult.steps.length >= 2) {
        errors.push(
          `compoundExpectEmpty: expected no multi-step decomposition, got ${decompositionResult.steps.map((s) => s.action).join(', ')}`,
        );
      }
    } else {
      const minSteps = expect.compoundMinSteps ?? 2;
      if (!decompositionResult || decompositionResult.steps.length < minSteps) {
        errors.push(
          `compoundMinSteps: expected >= ${minSteps}, got ${decompositionResult?.steps.length ?? 0}`,
        );
      } else {
        const actions = decompositionResult.steps.map((step) => step.action);
        if (expect.compoundSteps) {
          if (actions.join(',') !== expect.compoundSteps.join(',')) {
            errors.push(
              `compoundSteps: expected [${expect.compoundSteps.join(', ')}], got [${actions.join(', ')}]`,
            );
          }
        }
        if (expect.compoundActionsContains) {
          for (const action of expect.compoundActionsContains) {
            if (!actions.includes(action)) {
              errors.push(
                `compoundActionsContains: missing ${action} in [${actions.join(', ')}]`,
              );
            }
          }
        }
        if (
          expect.compoundSource &&
          decompositionResult.source !== expect.compoundSource
        ) {
          errors.push(
            `compoundSource: expected ${expect.compoundSource}, got ${decompositionResult.source}`,
          );
        }
        if (
          expect.compoundRecipeId &&
          decompositionResult.recipeId !== expect.compoundRecipeId
        ) {
          errors.push(
            `compoundRecipeId: expected ${expect.compoundRecipeId}, got ${decompositionResult.recipeId ?? 'none'}`,
          );
        }
        for (const stepExpectation of expect.compoundStepParams ?? []) {
          const step = decompositionResult.steps[stepExpectation.stepIndex];
          if (!step) {
            errors.push(
              `compoundStepParams: missing step at index ${stepExpectation.stepIndex}`,
            );
            continue;
          }
          if (stepExpectation.paramsPartial) {
            errors.push(
              ...paramsMatchPartial(
                step.params,
                stepExpectation.paramsPartial,
              ).map(
                (msg) =>
                  `compoundStepParams[${stepExpectation.stepIndex}].${msg}`,
              ),
            );
          }
        }
      }
    }
  }

  if (expect.phiGuard) {
    const assessment = assessPhiInAiContext(HIPAA_EVAL_SETTINGS, 'clinic', {
      prompt,
    });
    if (assessment.blocked !== expect.phiGuard.blocked) {
      errors.push(
        `phiGuard.blocked: expected ${expect.phiGuard.blocked}, got ${assessment.blocked}`,
      );
    }
    if (
      expect.phiGuard.reason &&
      assessment.reason !== expect.phiGuard.reason
    ) {
      errors.push(
        `phiGuard.reason: expected ${expect.phiGuard.reason}, got ${assessment.reason ?? 'none'}`,
      );
    }
    if (expect.phiGuard.matchedFields) {
      for (const field of expect.phiGuard.matchedFields) {
        if (!assessment.matchedFields?.includes(field as never)) {
          errors.push(
            `phiGuard.matchedFields: missing ${field} in [${assessment.matchedFields?.join(', ') ?? ''}]`,
          );
        }
      }
    }
    if (expect.phiGuard.redactedSubstring) {
      const redacted = redactEmbeddedPhiFromPrompt(prompt);
      if (!redacted.includes(expect.phiGuard.redactedSubstring)) {
        errors.push(
          `phiGuard.redactedSubstring: expected "${expect.phiGuard.redactedSubstring}" in redacted prompt`,
        );
      }
    }
  }

  if (expect.expectValidationClarify) {
    const action = expect.validationAction ?? expect.rescuedAction;
    if (!action) {
      errors.push(
        'expectValidationClarify: validationAction or rescuedAction required',
      );
    } else {
      const cmd: ResolvedCommand = {
        action,
        params: { ...(expect.validationParamsPartial ?? {}) },
        reasoning: 'eval',
        prompt,
        businessId: 'eval-business',
        entities: {
          employees: [],
          services: [],
          customers: [],
          templates: [],
        },
        enrichedParams: {},
      };
      const validation = validateCommand(cmd);
      if (validation.ok) {
        errors.push(
          'expectValidationClarify: validation passed but expected clarify',
        );
      }
      if (expect.clarifyFieldsContains?.length) {
        const fields = validation.issues.map((issue) => issue.field);
        for (const field of expect.clarifyFieldsContains) {
          if (!fields.includes(field)) {
            errors.push(
              `clarifyFieldsContains: missing ${field} in [${fields.join(', ')}]`,
            );
          }
        }
      }
    }
  }

  if (expect.accessTier) {
    const action = expect.rescuedAction ?? expect.action;
    if (!action) {
      errors.push('accessTier: rescuedAction or action required');
    } else {
      errors.push(
        ...assertClinicTestResultExtAccessTierMatchesMatrix(
          action,
          expect.accessTier,
        ),
      );
    }
  }

  return {
    id: evalCase.id,
    passed: errors.length === 0,
    errors,
  };
}

export function runDeterministicEvalSuite(
  cases: AiCommandEvalCase[],
  timeZone = 'UTC',
): { passed: number; failed: number; results: AiEvalCaseResult[] } {
  const ciCases = cases.filter((c) => !c.requiresLlm);
  const results = ciCases.map((c) =>
    evaluateDeterministicEvalCase(c, timeZone),
  );
  const failed = results.filter((r) => !r.passed).length;
  return {
    passed: results.length - failed,
    failed,
    results,
  };
}
