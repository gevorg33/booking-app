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
import { parseConfirmMyBookingDetailsFromPrompt } from '../ai-confirm-my-booking-details.util.js';
import { parseAddBookingToCalendarFromPrompt } from '../ai-add-booking-to-calendar.util.js';
import { parseExplainPreparationNotesFromPrompt } from '../ai-explain-preparation-notes.util.js';
import { parseBookAnotherServiceFromPrompt } from '../ai-book-another-service.util.js';
import { enrichMultiServiceBookingParamsFromPrompt } from '../ai-multi-service-customer-public.util.js';
import { enrichExplainPackageSavingsParamsFromPrompt } from '../ai-explain-package-savings.util.js';
import { enrichExplainSubscriptionVsOneTimeParamsFromPrompt } from '../ai-explain-subscription-vs-one-time.util.js';
import { enrichExplainLabPrepParamsFromPrompt } from '../ai-explain-lab-prep.util.js';
import { enrichExplainClinicBookingFieldsParamsFromPrompt } from '../ai-explain-clinic-booking-fields.util.js';
import { enrichExplainPublicIntakeFormParamsFromPrompt } from '../ai-explain-public-intake-form.util.js';
import { enrichExplainManageBookingPageParamsFromPrompt } from '../ai-explain-manage-booking-page.util.js';
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
  enrichTrackPhysicalGiftCardOrderParamsFromPrompt,
  rescueTrackPhysicalGiftCardOrderIntent,
} from '../ai-track-physical-gift-card-order.util.js';
import {
  enrichClaimGiftCardBalanceParamsFromPrompt,
  rescueClaimGiftCardBalanceIntent,
} from '../ai-claim-gift-card-balance.util.js';
import {
  enrichCancelPackageVisitSelfParamsFromPrompt,
  rescueCancelPackageVisitSelfIntent,
} from '../ai-cancel-package-visit-self.util.js';
import {
  enrichReschedulePackageVisitSelfParamsFromPrompt,
  rescueReschedulePackageVisitSelfIntent,
} from '../ai-reschedule-package-visit-self.util.js';
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
import {
  rescueShareMyBookingIntent,
  parseShareMyBookingFromPrompt,
} from '../ai-share-my-booking.util.js';
import {
  rescueListMyUpcomingAppointmentsIntent,
  parseListMyUpcomingAppointmentsFromPrompt,
} from '../ai-list-my-upcoming-appointments.util.js';
import {
  rescueExplainCancelPolicyIntent,
  parseExplainCancelPolicyFromPrompt,
} from '../ai-explain-cancel-policy.util.js';
import {
  rescueFindServicesUnderBudgetIntent,
  parseFindServicesUnderBudgetFromPrompt,
} from '../ai-find-services-under-budget.util.js';
import {
  rescueFindEveningWeekendSlotsIntent,
  parseFindEveningWeekendSlotsFromPrompt,
} from '../ai-find-evening-weekend-slots.util.js';
import {
  rescueExplainDepositForfeitureIntent,
  parseExplainDepositForfeitureFromPrompt,
} from '../ai-explain-deposit-forfeiture.util.js';
import {
  enrichExplainPackageVisitRulesParamsFromPrompt,
  rescueExplainPackageVisitRulesIntent,
} from '../ai-explain-package-visit-rules.util.js';
import { rescueExplainLoyaltyPointsIntent } from '../ai-explain-loyalty-points.util.js';
import { rescueExplainMySubscriptionIntent } from '../ai-explain-my-subscription.util.js';
import { rescueUpdateMyProfileIntent } from '../ai-update-my-profile.util.js';
import {
  rescueGetManageLinkIntent,
  parseGetManageLinkFromPrompt,
} from '../ai-get-manage-link.util.js';
import {
  rescueRecoverLostManageLinkIntent,
  parseRecoverLostManageLinkFromPrompt,
} from '../ai-recover-lost-manage-link.util.js';
import {
  rescueNotifyRunningLateIntent,
  parseNotifyRunningLateFromPrompt,
} from '../ai-notify-running-late.util.js';
import {
  rescueLeaveVisitReviewIntent,
  parseLeaveVisitReviewFromPrompt,
} from '../ai-leave-visit-review.util.js';
import {
  rescueExplainPostVisitReviewPromptIntent,
  parseExplainPostVisitReviewPromptFromPrompt,
} from '../ai-explain-post-visit-review-prompt.util.js';
import {
  rescueReportBookingProblemIntent,
  parseReportBookingProblemFromPrompt,
} from '../ai-report-booking-problem.util.js';
import {
  rescueExplainShareRewardIntent,
  parseExplainShareRewardFromPrompt,
} from '../ai-explain-share-reward.util.js';
import {
  rescueSignInAfterBookingIntent,
  parseSignInAfterBookingFromPrompt,
} from '../ai-sign-in-after-booking.util.js';
import {
  rescueCustomerWaitlistIntent,
  parseJoinWaitlistFromPrompt,
} from '../ai-customer-waitlist.util.js';
import {
  rescueRebookLastAppointmentIntent,
  parseRebookLastAppointmentFromPrompt,
} from '../ai-rebook-last-appointment.util.js';
import { rescueMarketingGrowthIntent } from '../ai-marketing-growth.util.js';
import {
  parseExplainConsumerCheckoutSuccessFromPrompt,
  rescueExplainConsumerCheckoutSuccessIntent,
} from '../ai-consumer-checkout-success.util.js';
import {
  enrichDismissRecommendationsParamsFromPrompt,
  rescueDismissRecommendationsIntent,
} from '../ai-dismiss-recommendations.util.js';
import { enrichBuyGiftCardForSomeoneParamsFromPrompt } from '../ai-buy-gift-card-for-someone.util.js';
import {
  parseExplainConsumerCheckoutTaxFromPrompt,
  rescueExplainConsumerCheckoutTaxIntent,
} from '../ai-consumer-checkout-tax.util.js';
import {
  parseExplainCheckoutTaxFromPrompt,
  rescueCheckoutTaxIntent,
} from '../ai-checkout-tax.util.js';
import {
  parseExplainResultStatusFromPrompt,
  parseListMyTestResultsFromPrompt,
  rescueConsumerClinicTestResultsIntent,
} from '../ai-consumer-clinic-test-results.util.js';
import {
  rescueTrackLabOrderStatusIntent,
  enrichTrackLabOrderStatusParamsFromPrompt,
} from '../ai-track-lab-order-status.util.js';
import {
  rescueListMyDocumentsIntent,
  enrichListMyDocumentsParamsFromPrompt,
} from '../ai-list-my-documents.util.js';
import {
  rescueExplainAbnormalResultFlagIntent,
  enrichExplainAbnormalResultFlagParamsFromPrompt,
} from '../ai-explain-abnormal-result-flag.util.js';
import {
  rescueNotifyWhenResultsReadyIntent,
  enrichNotifyWhenResultsReadyParamsFromPrompt,
} from '../ai-notify-when-results-ready.util.js';
import { rescueProviderPushSetupIntent } from '../ai-provider-push-setup.util.js';
import {
  rescuePaymentsIntent,
  extractServiceNameFromPrompt,
} from '../ai-payments.util.js';
import { rescueResumeBookingDraftIntent } from '../ai-resume-booking-draft.util.js';
import { rescueExplainSlotNoLongerAvailableIntent } from '../ai-explain-slot-no-longer-available.util.js';
import { rescueExplainMultiServicePaymentReturnIntent } from '../ai-explain-multi-service-payment-return.util.js';
import { rescueRetryFailedNetworkActionIntent } from '../ai-retry-failed-network-action.util.js';
import { rescueExplainVoiceInputIntent } from '../ai-explain-voice-input.util.js';
import { rescueSpeakAssistantReplyIntent } from '../ai-speak-assistant-reply.util.js';
import { rescueGiveAiFeedbackIntent } from '../ai-give-ai-feedback.util.js';
import { rescueExplainRtlLayoutIntent } from '../ai-explain-rtl-layout.util.js';
import { enrichPrepaymentExplainParamsFromPrompt } from '../ai-explain-prepayment.util.js';
import { enrichExplainServicePriceParamsFromPrompt } from '../ai-explain-service-price.util.js';
import { enrichExplainPaymentOptionsParamsFromPrompt } from '../ai-explain-payment-options-for-service.util.js';
import { enrichFindSoonestParamsFromPrompt } from '../ai-find-soonest-appointment.util.js';
import { enrichCompareServicesParamsFromPrompt } from '../ai-compare-services.util.js';
import { enrichFilterServicesNoPrepaymentParamsFromPrompt } from '../ai-filter-services-no-prepayment.util.js';
import { enrichExplainAmountDueNowParamsFromPrompt } from '../ai-explain-amount-due-now.util.js';
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
      expected.every((item, index) => valuesMatchPartial(actual[index], item))
    );
  }
  if (expected !== null && typeof expected === 'object') {
    if (
      actual === null ||
      typeof actual !== 'object' ||
      Array.isArray(actual)
    ) {
      return false;
    }
    return Object.entries(expected as Record<string, unknown>).every(
      ([key, value]) =>
        valuesMatchPartial((actual as Record<string, unknown>)[key], value),
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
        errors.push(
          'semanticMatchParamsPartial: matcher returned no paramHints',
        );
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

  if (
    expect.useProductGuideTopicEnrich &&
    evalCase.surface &&
    !expect.rescuedAction
  ) {
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
    const useSurfaceClaimGiftCardBalanceCustomerRescue =
      expect.useSurfaceClaimGiftCardBalanceCustomerRescue === true &&
      evalCase.surface === 'customer';
    const useSurfaceTrackPhysicalGiftCardOrderRescue =
      expect.useSurfaceTrackPhysicalGiftCardOrderRescue === true &&
      evalCase.surface === 'customer';
    const useSurfaceCancelPackageVisitSelfRescue =
      expect.useSurfaceCancelPackageVisitSelfRescue === true &&
      evalCase.surface === 'customer';
    const useSurfaceReschedulePackageVisitSelfRescue =
      expect.useSurfaceReschedulePackageVisitSelfRescue === true &&
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
    const useSurfaceDismissRecommendationsRescue =
      expect.useSurfaceDismissRecommendationsRescue === true &&
      evalCase.surface === 'customer';
    const useSurfaceGrowthLoopsCustomerRescue =
      expect.useSurfaceGrowthLoopsCustomerRescue === true &&
      evalCase.surface === 'customer';
    const useSurfaceConsumerAdoptionRescue =
      expect.useSurfaceConsumerAdoptionRescue === true &&
      evalCase.surface === 'customer';
    const useSurfaceShareMyBookingRescue =
      expect.useSurfaceShareMyBookingRescue === true &&
      evalCase.surface === 'customer';
    const useSurfaceListMyUpcomingAppointmentsRescue =
      expect.useSurfaceListMyUpcomingAppointmentsRescue === true &&
      evalCase.surface === 'customer';
    const useSurfaceExplainCancelPolicyRescue =
      expect.useSurfaceExplainCancelPolicyRescue === true &&
      evalCase.surface === 'customer';
    const useSurfaceFindServicesUnderBudgetRescue =
      expect.useSurfaceFindServicesUnderBudgetRescue === true &&
      (evalCase.surface === 'customer' || evalCase.surface === 'public');
    const useSurfaceFindEveningWeekendSlotsRescue =
      expect.useSurfaceFindEveningWeekendSlotsRescue === true &&
      (evalCase.surface === 'customer' || evalCase.surface === 'public');
    const useSurfaceExplainDepositForfeitureRescue =
      expect.useSurfaceExplainDepositForfeitureRescue === true &&
      (evalCase.surface === 'customer' || evalCase.surface === 'public');
    const useSurfaceExplainPackageVisitRulesRescue =
      expect.useSurfaceExplainPackageVisitRulesRescue === true &&
      evalCase.surface === 'customer';
    const useSurfaceExplainLoyaltyPointsRescue =
      expect.useSurfaceExplainLoyaltyPointsRescue === true &&
      evalCase.surface === 'customer';
    const useSurfaceExplainMySubscriptionRescue =
      expect.useSurfaceExplainMySubscriptionRescue === true &&
      evalCase.surface === 'customer';
    const useSurfaceUpdateMyProfileRescue =
      expect.useSurfaceUpdateMyProfileRescue === true &&
      evalCase.surface === 'customer';
    const useSurfaceGetManageLinkRescue =
      expect.useSurfaceGetManageLinkRescue === true &&
      evalCase.surface === 'customer';
    const useSurfaceRecoverLostManageLinkRescue =
      expect.useSurfaceRecoverLostManageLinkRescue === true &&
      (evalCase.surface === 'customer' || evalCase.surface === 'public');
    const useSurfaceNotifyRunningLateRescue =
      expect.useSurfaceNotifyRunningLateRescue === true &&
      evalCase.surface === 'customer';
    const useSurfaceLeaveVisitReviewRescue =
      expect.useSurfaceLeaveVisitReviewRescue === true &&
      evalCase.surface === 'customer';
    const useSurfaceExplainPostVisitReviewPromptRescue =
      expect.useSurfaceExplainPostVisitReviewPromptRescue === true &&
      evalCase.surface === 'customer';
    const useSurfaceReportBookingProblemRescue =
      expect.useSurfaceReportBookingProblemRescue === true &&
      evalCase.surface === 'customer';
    const useSurfaceExplainShareRewardRescue =
      expect.useSurfaceExplainShareRewardRescue === true &&
      evalCase.surface === 'customer';
    const useSurfaceSignInAfterBookingRescue =
      expect.useSurfaceSignInAfterBookingRescue === true &&
      evalCase.surface === 'customer';
    const useSurfaceCustomerWaitlistRescue =
      expect.useSurfaceCustomerWaitlistRescue === true &&
      (evalCase.surface === 'customer' || evalCase.surface === 'public');
    const useSurfaceRebookLastAppointmentRescue =
      expect.useSurfaceRebookLastAppointmentRescue === true &&
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
    const useSurfaceExplainCheckoutTaxRescue =
      expect.useSurfaceExplainCheckoutTaxRescue === true &&
      (evalCase.surface === 'customer' || evalCase.surface === 'public');
    const useSurfaceConsumerClinicTestResultsRescue =
      expect.useSurfaceConsumerClinicTestResultsRescue === true &&
      evalCase.surface === 'customer';
    const useSurfaceTrackLabOrderStatusRescue =
      expect.useSurfaceTrackLabOrderStatusRescue === true &&
      evalCase.surface === 'customer';
    const useSurfaceListMyDocumentsRescue =
      expect.useSurfaceListMyDocumentsRescue === true &&
      evalCase.surface === 'customer';
    const useSurfaceExplainAbnormalResultFlagRescue =
      expect.useSurfaceExplainAbnormalResultFlagRescue === true &&
      evalCase.surface === 'customer';
    const useSurfaceNotifyWhenResultsReadyRescue =
      expect.useSurfaceNotifyWhenResultsReadyRescue === true &&
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
    const useSurfaceResumeBookingDraftRescue =
      expect.useSurfaceResumeBookingDraftRescue === true &&
      (evalCase.surface === 'customer' || evalCase.surface === 'public');
    const useSurfaceExplainSlotNoLongerAvailableRescue =
      expect.useSurfaceExplainSlotNoLongerAvailableRescue === true &&
      (evalCase.surface === 'customer' || evalCase.surface === 'public');
    const useSurfaceExplainMultiServicePaymentReturnRescue =
      expect.useSurfaceExplainMultiServicePaymentReturnRescue === true &&
      evalCase.surface === 'customer';
    const useSurfaceRetryFailedNetworkActionRescue =
      expect.useSurfaceRetryFailedNetworkActionRescue === true &&
      evalCase.surface === 'customer';
    const useSurfaceExplainVoiceInputRescue =
      expect.useSurfaceExplainVoiceInputRescue === true &&
      (evalCase.surface === 'customer' || evalCase.surface === 'public');
    const useSurfaceSpeakAssistantReplyRescue =
      expect.useSurfaceSpeakAssistantReplyRescue === true &&
      (evalCase.surface === 'customer' || evalCase.surface === 'public');
    const useSurfaceGiveAiFeedbackRescue =
      expect.useSurfaceGiveAiFeedbackRescue === true &&
      (evalCase.surface === 'customer' || evalCase.surface === 'public');
    const useSurfaceExplainRtlLayoutRescue =
      expect.useSurfaceExplainRtlLayoutRescue === true &&
      (evalCase.surface === 'customer' || evalCase.surface === 'public');
    const useSurfaceLabBookingRescue =
      expect.useSurfaceLabBookingRescue === true && !!evalCase.surface;
    const useSurfaceBudgetRescue =
      expect.useSurfaceBudgetRescue === true && !!evalCase.surface;
    const useCheckoutCurrencyRescue = expect.useCheckoutCurrencyRescue === true;
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
    const claimGiftCardBalanceCustomerRescued =
      useSurfaceClaimGiftCardBalanceCustomerRescue
        ? rescueClaimGiftCardBalanceIntent(prompt, misclassifiedAction)
        : null;
    const trackPhysicalGiftCardOrderRescued =
      useSurfaceTrackPhysicalGiftCardOrderRescue
        ? rescueTrackPhysicalGiftCardOrderIntent(prompt, misclassifiedAction)
        : null;
    const cancelPackageVisitSelfRescued = useSurfaceCancelPackageVisitSelfRescue
      ? rescueCancelPackageVisitSelfIntent(prompt, misclassifiedAction)
      : null;
    const reschedulePackageVisitSelfRescued =
      useSurfaceReschedulePackageVisitSelfRescue
        ? rescueReschedulePackageVisitSelfIntent(prompt, misclassifiedAction)
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
    const dismissRecommendationsRescued = useSurfaceDismissRecommendationsRescue
      ? rescueDismissRecommendationsIntent(prompt, misclassifiedAction)
      : null;
    const growthLoopsCustomerRescued = useSurfaceGrowthLoopsCustomerRescue
      ? rescueGrowthLoopsCustomerIntent(prompt, misclassifiedAction)
      : null;
    const consumerAdoptionRescued = useSurfaceConsumerAdoptionRescue
      ? rescueConsumerAdoptionIntent(prompt, misclassifiedAction)
      : null;
    const shareMyBookingRescued = useSurfaceShareMyBookingRescue
      ? rescueShareMyBookingIntent(prompt, misclassifiedAction)
      : null;
    const shareMyBookingParsed = useSurfaceShareMyBookingRescue
      ? parseShareMyBookingFromPrompt(prompt, expect.paramsPartial ?? {})
      : null;
    const listMyUpcomingAppointmentsRescued =
      useSurfaceListMyUpcomingAppointmentsRescue
        ? rescueListMyUpcomingAppointmentsIntent(prompt, misclassifiedAction)
        : null;
    const listMyUpcomingAppointmentsParsed =
      useSurfaceListMyUpcomingAppointmentsRescue
        ? parseListMyUpcomingAppointmentsFromPrompt(
            prompt,
            expect.paramsPartial ?? {},
          )
        : null;
    const explainPackageVisitRulesRescued =
      useSurfaceExplainPackageVisitRulesRescue
        ? rescueExplainPackageVisitRulesIntent(prompt, misclassifiedAction)
        : null;
    const explainCancelPolicyRescued = useSurfaceExplainCancelPolicyRescue
      ? rescueExplainCancelPolicyIntent(prompt, misclassifiedAction)
      : null;
    const findServicesUnderBudgetRescued =
      useSurfaceFindServicesUnderBudgetRescue
        ? rescueFindServicesUnderBudgetIntent(prompt, misclassifiedAction)
        : null;
    const findServicesUnderBudgetParsed =
      useSurfaceFindServicesUnderBudgetRescue
        ? parseFindServicesUnderBudgetFromPrompt(prompt)
        : null;
    const findEveningWeekendSlotsRescued =
      useSurfaceFindEveningWeekendSlotsRescue
        ? rescueFindEveningWeekendSlotsIntent(prompt, misclassifiedAction)
        : null;
    const findEveningWeekendSlotsParsed =
      useSurfaceFindEveningWeekendSlotsRescue
        ? parseFindEveningWeekendSlotsFromPrompt(prompt)
        : null;
    const explainDepositForfeitureRescued =
      useSurfaceExplainDepositForfeitureRescue
        ? rescueExplainDepositForfeitureIntent(prompt, misclassifiedAction)
        : null;
    const explainDepositForfeitureParsed =
      useSurfaceExplainDepositForfeitureRescue
        ? parseExplainDepositForfeitureFromPrompt(prompt)
        : null;
    const explainLoyaltyPointsRescued = useSurfaceExplainLoyaltyPointsRescue
      ? rescueExplainLoyaltyPointsIntent(prompt, misclassifiedAction)
      : null;
    const explainMySubscriptionRescued = useSurfaceExplainMySubscriptionRescue
      ? rescueExplainMySubscriptionIntent(prompt, misclassifiedAction)
      : null;
    const updateMyProfileRescued = useSurfaceUpdateMyProfileRescue
      ? rescueUpdateMyProfileIntent(prompt, misclassifiedAction)
      : null;
    const getManageLinkRescued = useSurfaceGetManageLinkRescue
      ? rescueGetManageLinkIntent(prompt, misclassifiedAction)
      : null;
    const getManageLinkParsed = useSurfaceGetManageLinkRescue
      ? parseGetManageLinkFromPrompt(prompt, expect.paramsPartial ?? {})
      : null;
    const recoverLostManageLinkRescued = useSurfaceRecoverLostManageLinkRescue
      ? rescueRecoverLostManageLinkIntent(prompt, misclassifiedAction)
      : null;
    const recoverLostManageLinkParsed = useSurfaceRecoverLostManageLinkRescue
      ? parseRecoverLostManageLinkFromPrompt(prompt, expect.paramsPartial ?? {})
      : null;
    const notifyRunningLateRescued = useSurfaceNotifyRunningLateRescue
      ? rescueNotifyRunningLateIntent(prompt, misclassifiedAction)
      : null;
    const notifyRunningLateParsed = useSurfaceNotifyRunningLateRescue
      ? parseNotifyRunningLateFromPrompt(prompt, expect.paramsPartial ?? {})
      : null;
    const leaveVisitReviewRescued = useSurfaceLeaveVisitReviewRescue
      ? rescueLeaveVisitReviewIntent(prompt, misclassifiedAction)
      : null;
    const leaveVisitReviewParsed = useSurfaceLeaveVisitReviewRescue
      ? parseLeaveVisitReviewFromPrompt(prompt, expect.paramsPartial ?? {})
      : null;
    const explainPostVisitReviewPromptRescued =
      useSurfaceExplainPostVisitReviewPromptRescue
        ? rescueExplainPostVisitReviewPromptIntent(prompt, misclassifiedAction)
        : null;
    const explainPostVisitReviewPromptParsed =
      useSurfaceExplainPostVisitReviewPromptRescue
        ? parseExplainPostVisitReviewPromptFromPrompt(prompt)
        : null;
    const reportBookingProblemRescued = useSurfaceReportBookingProblemRescue
      ? rescueReportBookingProblemIntent(prompt, misclassifiedAction)
      : null;
    const reportBookingProblemParsed = useSurfaceReportBookingProblemRescue
      ? parseReportBookingProblemFromPrompt(prompt, expect.paramsPartial ?? {})
      : null;
    const explainShareRewardRescued = useSurfaceExplainShareRewardRescue
      ? rescueExplainShareRewardIntent(prompt, misclassifiedAction)
      : null;
    const explainShareRewardParsed = useSurfaceExplainShareRewardRescue
      ? parseExplainShareRewardFromPrompt(prompt)
      : null;
    const signInAfterBookingRescued = useSurfaceSignInAfterBookingRescue
      ? rescueSignInAfterBookingIntent(prompt, misclassifiedAction)
      : null;
    const signInAfterBookingParsed = useSurfaceSignInAfterBookingRescue
      ? parseSignInAfterBookingFromPrompt(prompt)
      : null;
    const customerWaitlistRescued = useSurfaceCustomerWaitlistRescue
      ? rescueCustomerWaitlistIntent(prompt, misclassifiedAction)
      : null;
    const customerWaitlistParsed = useSurfaceCustomerWaitlistRescue
      ? parseJoinWaitlistFromPrompt(prompt, expect.paramsPartial ?? {})
      : null;
    const rebookLastAppointmentRescued = useSurfaceRebookLastAppointmentRescue
      ? rescueRebookLastAppointmentIntent(prompt, misclassifiedAction)
      : null;
    const rebookLastAppointmentParsed = useSurfaceRebookLastAppointmentRescue
      ? parseRebookLastAppointmentFromPrompt(prompt)
      : null;
    const marketingGrowthRescued = useSurfaceMarketingGrowthRescue
      ? rescueMarketingGrowthIntent(prompt, misclassifiedAction)
      : null;
    const consumerCheckoutSuccessRescued =
      useSurfaceConsumerCheckoutSuccessRescue
        ? rescueExplainConsumerCheckoutSuccessIntent(
            prompt,
            misclassifiedAction,
          )
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
    const explainCheckoutTaxRescued = useSurfaceExplainCheckoutTaxRescue
      ? rescueCheckoutTaxIntent(prompt, misclassifiedAction)
      : null;
    const explainCheckoutTaxParsed = useSurfaceExplainCheckoutTaxRescue
      ? parseExplainCheckoutTaxFromPrompt(prompt)
      : null;
    const consumerClinicTestResultsRescued =
      useSurfaceConsumerClinicTestResultsRescue
        ? rescueConsumerClinicTestResultsIntent(prompt, misclassifiedAction)
        : null;
    const consumerClinicListParsed = useSurfaceConsumerClinicTestResultsRescue
      ? parseListMyTestResultsFromPrompt(prompt)
      : null;
    const consumerClinicExplainParsed =
      useSurfaceConsumerClinicTestResultsRescue
        ? parseExplainResultStatusFromPrompt(prompt)
        : null;
    const trackLabOrderStatusRescued = useSurfaceTrackLabOrderStatusRescue
      ? rescueTrackLabOrderStatusIntent(prompt, misclassifiedAction)
      : null;
    const listMyDocumentsRescued = useSurfaceListMyDocumentsRescue
      ? rescueListMyDocumentsIntent(prompt, misclassifiedAction)
      : null;
    const explainAbnormalResultFlagRescued =
      useSurfaceExplainAbnormalResultFlagRescue
        ? rescueExplainAbnormalResultFlagIntent(prompt, misclassifiedAction)
        : null;
    const notifyWhenResultsReadyRescued = useSurfaceNotifyWhenResultsReadyRescue
      ? rescueNotifyWhenResultsReadyIntent(prompt, misclassifiedAction)
      : null;
    const providerPushSetupRescued = useSurfaceProviderPushSetupRescue
      ? rescueProviderPushSetupIntent(prompt, misclassifiedAction)
      : null;
    const paymentsRescued = useSurfacePaymentsRescue
      ? rescuePaymentsIntent(prompt, misclassifiedAction)
      : null;
    const resumeBookingDraftRescued = useSurfaceResumeBookingDraftRescue
      ? rescueResumeBookingDraftIntent(prompt, misclassifiedAction)
      : null;
    const explainSlotNoLongerAvailableRescued =
      useSurfaceExplainSlotNoLongerAvailableRescue
        ? rescueExplainSlotNoLongerAvailableIntent(prompt, misclassifiedAction)
        : null;
    const explainMultiServicePaymentReturnRescued =
      useSurfaceExplainMultiServicePaymentReturnRescue
        ? rescueExplainMultiServicePaymentReturnIntent(
            prompt,
            misclassifiedAction,
          )
        : null;
    const retryFailedNetworkActionRescued =
      useSurfaceRetryFailedNetworkActionRescue
        ? rescueRetryFailedNetworkActionIntent(prompt, misclassifiedAction)
        : null;
    const explainVoiceInputRescued = useSurfaceExplainVoiceInputRescue
      ? rescueExplainVoiceInputIntent(prompt, misclassifiedAction)
      : null;
    const speakAssistantReplyRescued = useSurfaceSpeakAssistantReplyRescue
      ? rescueSpeakAssistantReplyIntent(prompt, misclassifiedAction)
      : null;
    const giveAiFeedbackRescued = useSurfaceGiveAiFeedbackRescue
      ? rescueGiveAiFeedbackIntent(prompt, misclassifiedAction)
      : null;
    const explainRtlLayoutRescued = useSurfaceExplainRtlLayoutRescue
      ? rescueExplainRtlLayoutIntent(prompt, misclassifiedAction)
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
    const rescued = useSurfaceRebookLastAppointmentRescue
      ? rebookLastAppointmentRescued
        ? {
            action: rebookLastAppointmentRescued.action,
            params: rebookLastAppointmentParsed?.serviceName
              ? { serviceName: rebookLastAppointmentParsed.serviceName }
              : {},
            rescued: true,
            rescueReason: rebookLastAppointmentRescued.rescueReason,
          }
        : null
      : useSurfaceCustomerWaitlistRescue
        ? customerWaitlistRescued
          ? {
              action: customerWaitlistRescued.action,
              params: customerWaitlistParsed
                ? {
                    ...(customerWaitlistParsed.serviceName
                      ? { serviceName: customerWaitlistParsed.serviceName }
                      : {}),
                    ...(customerWaitlistParsed.timeOfDay
                      ? { timeOfDay: customerWaitlistParsed.timeOfDay }
                      : {}),
                    ...(customerWaitlistParsed.date
                      ? { date: customerWaitlistParsed.date }
                      : {}),
                  }
                : {},
              rescued: true,
              rescueReason: customerWaitlistRescued.rescueReason,
            }
          : null
        : useSurfaceReportBookingProblemRescue
          ? reportBookingProblemRescued
            ? {
                action: reportBookingProblemRescued.action,
                params: reportBookingProblemParsed
                  ? {
                      aspect: reportBookingProblemParsed.aspect,
                      ...(reportBookingProblemParsed.serviceName
                        ? {
                            serviceName: reportBookingProblemParsed.serviceName,
                          }
                        : {}),
                    }
                  : {},
                rescued: true,
                rescueReason: reportBookingProblemRescued.rescueReason,
              }
            : null
          : useSurfaceExplainShareRewardRescue
            ? explainShareRewardRescued
              ? {
                  action: explainShareRewardRescued.action,
                  params: explainShareRewardParsed
                    ? { aspect: explainShareRewardParsed.aspect }
                    : {},
                  rescued: true,
                  rescueReason: explainShareRewardRescued.rescueReason,
                }
              : null
            : useSurfaceSignInAfterBookingRescue
              ? signInAfterBookingRescued
                ? {
                    action: signInAfterBookingRescued.action,
                    params: signInAfterBookingParsed
                      ? { aspect: signInAfterBookingParsed.aspect }
                      : {},
                    rescued: true,
                    rescueReason: signInAfterBookingRescued.rescueReason,
                  }
                : null
              : useSurfaceExplainPostVisitReviewPromptRescue
                ? explainPostVisitReviewPromptRescued
                  ? {
                      action: explainPostVisitReviewPromptRescued.action,
                      params: explainPostVisitReviewPromptParsed
                        ? { aspect: explainPostVisitReviewPromptParsed.aspect }
                        : {},
                      rescued: true,
                      rescueReason:
                        explainPostVisitReviewPromptRescued.rescueReason,
                    }
                  : null
                : useSurfaceLeaveVisitReviewRescue
                  ? leaveVisitReviewRescued
                    ? {
                        action: leaveVisitReviewRescued.action,
                        params: leaveVisitReviewParsed
                          ? {
                              ...(leaveVisitReviewParsed.rating
                                ? { rating: leaveVisitReviewParsed.rating }
                                : {}),
                              ...(leaveVisitReviewParsed.serviceName
                                ? {
                                    serviceName:
                                      leaveVisitReviewParsed.serviceName,
                                  }
                                : {}),
                            }
                          : {},
                        rescued: true,
                        rescueReason: leaveVisitReviewRescued.rescueReason,
                      }
                    : null
                  : useSurfaceNotifyRunningLateRescue
                    ? notifyRunningLateRescued
                      ? {
                          action: notifyRunningLateRescued.action,
                          params: notifyRunningLateParsed
                            ? {
                                minutesLate:
                                  notifyRunningLateParsed.minutesLate,
                                ...(notifyRunningLateParsed.serviceName
                                  ? {
                                      serviceName:
                                        notifyRunningLateParsed.serviceName,
                                    }
                                  : {}),
                              }
                            : {},
                          rescued: true,
                          rescueReason: notifyRunningLateRescued.rescueReason,
                        }
                      : null
                    : useSurfaceRecoverLostManageLinkRescue
                      ? recoverLostManageLinkRescued
                        ? {
                            action: recoverLostManageLinkRescued.action,
                            params: recoverLostManageLinkParsed
                              ? {
                                  guestLookup: true,
                                  ...(recoverLostManageLinkParsed.email
                                    ? {
                                        email:
                                          recoverLostManageLinkParsed.email,
                                      }
                                    : {}),
                                  ...(recoverLostManageLinkParsed.phone
                                    ? {
                                        phone:
                                          recoverLostManageLinkParsed.phone,
                                      }
                                    : {}),
                                  ...(recoverLostManageLinkParsed.delivery
                                    ? {
                                        delivery:
                                          recoverLostManageLinkParsed.delivery,
                                      }
                                    : {}),
                                }
                              : { guestLookup: true },
                            rescued: true,
                            rescueReason:
                              recoverLostManageLinkRescued.rescueReason,
                          }
                        : null
                      : useSurfaceGetManageLinkRescue
                        ? getManageLinkRescued
                          ? {
                              action: getManageLinkRescued.action,
                              params: getManageLinkParsed
                                ? {
                                    ...(getManageLinkParsed.email
                                      ? { email: getManageLinkParsed.email }
                                      : {}),
                                    ...(getManageLinkParsed.phone
                                      ? { phone: getManageLinkParsed.phone }
                                      : {}),
                                    ...(getManageLinkParsed.delivery
                                      ? {
                                          delivery:
                                            getManageLinkParsed.delivery,
                                        }
                                      : {}),
                                  }
                                : {},
                              rescued: true,
                              rescueReason: getManageLinkRescued.rescueReason,
                            }
                          : null
                        : useSurfaceUpdateMyProfileRescue
                          ? updateMyProfileRescued
                            ? {
                                action: updateMyProfileRescued.action,
                                params: {},
                                rescued: true,
                                rescueReason:
                                  updateMyProfileRescued.rescueReason,
                              }
                            : null
                          : useSurfaceExplainMySubscriptionRescue
                            ? explainMySubscriptionRescued
                              ? {
                                  action: explainMySubscriptionRescued.action,
                                  params: {},
                                  rescued: true,
                                  rescueReason:
                                    explainMySubscriptionRescued.rescueReason,
                                }
                              : null
                            : useSurfaceExplainLoyaltyPointsRescue
                              ? explainLoyaltyPointsRescued
                                ? {
                                    action: explainLoyaltyPointsRescued.action,
                                    params: {},
                                    rescued: true,
                                    rescueReason:
                                      explainLoyaltyPointsRescued.rescueReason,
                                  }
                                : null
                              : useSurfaceExplainPackageVisitRulesRescue
                                ? explainPackageVisitRulesRescued
                                  ? {
                                      action:
                                        explainPackageVisitRulesRescued.action,
                                      params:
                                        enrichExplainPackageVisitRulesParamsFromPrompt(
                                          {},
                                          prompt,
                                        ),
                                      rescued: true,
                                      rescueReason:
                                        explainPackageVisitRulesRescued.rescueReason,
                                    }
                                  : null
                                : useSurfaceFindEveningWeekendSlotsRescue
                                  ? findEveningWeekendSlotsRescued &&
                                    findEveningWeekendSlotsParsed
                                    ? {
                                        action:
                                          findEveningWeekendSlotsRescued.action,
                                        params: findEveningWeekendSlotsParsed,
                                        rescued: true,
                                        rescueReason:
                                          findEveningWeekendSlotsRescued.rescueReason,
                                      }
                                    : null
                                  : useSurfaceFindServicesUnderBudgetRescue
                                    ? findServicesUnderBudgetRescued &&
                                      findServicesUnderBudgetParsed
                                      ? {
                                          action:
                                            findServicesUnderBudgetRescued.action,
                                          params: findServicesUnderBudgetParsed,
                                          rescued: true,
                                          rescueReason:
                                            findServicesUnderBudgetRescued.rescueReason,
                                        }
                                      : null
                                    : useSurfaceExplainDepositForfeitureRescue
                                      ? explainDepositForfeitureRescued &&
                                        explainDepositForfeitureParsed
                                        ? {
                                            action:
                                              explainDepositForfeitureRescued.action,
                                            params:
                                              explainDepositForfeitureParsed.bookingId
                                                ? {
                                                    bookingId:
                                                      explainDepositForfeitureParsed.bookingId,
                                                  }
                                                : {},
                                            rescued: true,
                                            rescueReason:
                                              explainDepositForfeitureRescued.rescueReason,
                                          }
                                        : null
                                      : useSurfaceExplainCancelPolicyRescue
                                        ? explainCancelPolicyRescued
                                          ? {
                                              action:
                                                explainCancelPolicyRescued.action,
                                              params: {},
                                              rescued: true,
                                              rescueReason:
                                                explainCancelPolicyRescued.rescueReason,
                                            }
                                          : null
                                        : useSurfaceListMyUpcomingAppointmentsRescue
                                          ? listMyUpcomingAppointmentsRescued
                                            ? {
                                                action:
                                                  listMyUpcomingAppointmentsRescued.action,
                                                params:
                                                  listMyUpcomingAppointmentsParsed
                                                    ? {
                                                        scope:
                                                          listMyUpcomingAppointmentsParsed.scope,
                                                      }
                                                    : {},
                                                rescued: true,
                                                rescueReason:
                                                  listMyUpcomingAppointmentsRescued.rescueReason,
                                              }
                                            : null
                                          : useSurfaceShareMyBookingRescue
                                            ? shareMyBookingRescued
                                              ? {
                                                  action:
                                                    shareMyBookingRescued.action,
                                                  params:
                                                    shareMyBookingParsed?.bookingId
                                                      ? {
                                                          bookingId:
                                                            shareMyBookingParsed.bookingId,
                                                        }
                                                      : {},
                                                  rescued: true,
                                                  rescueReason:
                                                    shareMyBookingRescued.rescueReason,
                                                }
                                              : null
                                            : useSurfaceGrowthLoopsCustomerRescue
                                              ? growthLoopsCustomerRescued
                                                ? {
                                                    action:
                                                      growthLoopsCustomerRescued.action,
                                                    params: {},
                                                    rescued: true,
                                                    rescueReason:
                                                      growthLoopsCustomerRescued.rescueReason,
                                                  }
                                                : null
                                              : useSurfaceConsumerAdoptionRescue
                                                ? consumerAdoptionRescued
                                                  ? {
                                                      action:
                                                        consumerAdoptionRescued.action,
                                                      params: {},
                                                      rescued: true,
                                                      rescueReason:
                                                        consumerAdoptionRescued.rescueReason,
                                                    }
                                                  : null
                                                : useSurfaceCheckoutRecommendationsCustomerPublicRescue
                                                  ? checkoutRecommendationsCustomerPublicRescued
                                                    ? {
                                                        action:
                                                          checkoutRecommendationsCustomerPublicRescued.action,
                                                        params:
                                                          enrichCheckoutRecommendationsParamsFromPrompt(
                                                            {},
                                                            prompt,
                                                          ),
                                                        rescued: true,
                                                        rescueReason:
                                                          checkoutRecommendationsCustomerPublicRescued.rescueReason,
                                                      }
                                                    : null
                                                  : useSurfaceDismissRecommendationsRescue
                                                    ? dismissRecommendationsRescued
                                                      ? {
                                                          action:
                                                            dismissRecommendationsRescued.action,
                                                          params:
                                                            enrichDismissRecommendationsParamsFromPrompt(
                                                              {},
                                                              prompt,
                                                            ),
                                                          rescued: true,
                                                          rescueReason:
                                                            dismissRecommendationsRescued.rescueReason,
                                                        }
                                                      : null
                                                    : useSurfaceTourCustomerPublicRescue
                                                      ? tourCustomerPublicRescued
                                                        ? {
                                                            action:
                                                              tourCustomerPublicRescued.action,
                                                            params:
                                                              enrichTourCustomerPublicParamsFromPrompt(
                                                                {},
                                                                prompt,
                                                                tourCustomerPublicRescued.action,
                                                              ),
                                                            rescued: true,
                                                            rescueReason:
                                                              tourCustomerPublicRescued.rescueReason,
                                                          }
                                                        : null
                                                      : useSurfaceCancelPackageVisitSelfRescue
                                                        ? cancelPackageVisitSelfRescued
                                                          ? {
                                                              action:
                                                                cancelPackageVisitSelfRescued.action,
                                                              params:
                                                                enrichCancelPackageVisitSelfParamsFromPrompt(
                                                                  {},
                                                                  prompt,
                                                                ),
                                                              rescued: true,
                                                              rescueReason:
                                                                cancelPackageVisitSelfRescued.rescueReason,
                                                            }
                                                          : null
                                                        : useSurfaceListMyPackageVisitsCustomerRescue
                                                          ? listMyPackageVisitsCustomerRescued
                                                            ? {
                                                                action:
                                                                  listMyPackageVisitsCustomerRescued.action,
                                                                params:
                                                                  enrichListMyPackageVisitsParamsFromPrompt(
                                                                    {},
                                                                    prompt,
                                                                  ),
                                                                rescued: true,
                                                                rescueReason:
                                                                  listMyPackageVisitsCustomerRescued.rescueReason,
                                                              }
                                                            : null
                                                          : useSurfaceReschedulePackageVisitSelfRescue
                                                            ? reschedulePackageVisitSelfRescued
                                                              ? {
                                                                  action:
                                                                    reschedulePackageVisitSelfRescued.action,
                                                                  params:
                                                                    enrichReschedulePackageVisitSelfParamsFromPrompt(
                                                                      {},
                                                                      prompt,
                                                                    ),
                                                                  rescued: true,
                                                                  rescueReason:
                                                                    reschedulePackageVisitSelfRescued.rescueReason,
                                                                }
                                                              : null
                                                            : useSurfacePackageVisitSelfCustomerRescue
                                                              ? packageVisitSelfCustomerRescued
                                                                ? {
                                                                    action:
                                                                      packageVisitSelfCustomerRescued.action,
                                                                    params:
                                                                      enrichPackageVisitSelfParamsFromPrompt(
                                                                        {},
                                                                        prompt,
                                                                        packageVisitSelfCustomerRescued.action,
                                                                      ),
                                                                    rescued: true,
                                                                    rescueReason:
                                                                      packageVisitSelfCustomerRescued.rescueReason,
                                                                  }
                                                                : null
                                                              : useSurfaceTrackPhysicalGiftCardOrderRescue
                                                                ? trackPhysicalGiftCardOrderRescued
                                                                  ? {
                                                                      action:
                                                                        trackPhysicalGiftCardOrderRescued.action,
                                                                      params:
                                                                        enrichTrackPhysicalGiftCardOrderParamsFromPrompt(
                                                                          {},
                                                                          prompt,
                                                                        ),
                                                                      rescued: true,
                                                                      rescueReason:
                                                                        trackPhysicalGiftCardOrderRescued.rescueReason,
                                                                    }
                                                                  : null
                                                                : useSurfaceClaimGiftCardBalanceCustomerRescue
                                                                  ? claimGiftCardBalanceCustomerRescued
                                                                    ? {
                                                                        action:
                                                                          claimGiftCardBalanceCustomerRescued.action,
                                                                        params:
                                                                          enrichClaimGiftCardBalanceParamsFromPrompt(
                                                                            {},
                                                                            prompt,
                                                                          ),
                                                                        rescued: true,
                                                                        rescueReason:
                                                                          claimGiftCardBalanceCustomerRescued.rescueReason,
                                                                      }
                                                                    : null
                                                                  : useSurfaceGiftCardCancelCustomerRescue
                                                                    ? giftCardCancelCustomerRescued
                                                                      ? {
                                                                          action:
                                                                            giftCardCancelCustomerRescued.action,
                                                                          params:
                                                                            enrichRequestGiftCardCancelParamsFromPrompt(
                                                                              {},
                                                                              prompt,
                                                                            ),
                                                                          rescued: true,
                                                                          rescueReason:
                                                                            giftCardCancelCustomerRescued.rescueReason,
                                                                        }
                                                                      : null
                                                                    : useSurfacePrivacyGdprCustomerRescue
                                                                      ? privacyGdprCustomerRescued
                                                                        ? {
                                                                            action:
                                                                              privacyGdprCustomerRescued.action,
                                                                            params:
                                                                              {},
                                                                            rescued: true,
                                                                            rescueReason:
                                                                              privacyGdprCustomerRescued.rescueReason,
                                                                          }
                                                                        : null
                                                                      : useSurfaceMembershipCustomerRescue
                                                                        ? membershipCustomerRescued
                                                                          ? {
                                                                              action:
                                                                                membershipCustomerRescued.action,
                                                                              params:
                                                                                membershipCustomerRescued.action ===
                                                                                'use_subscription_credit'
                                                                                  ? enrichUseSubscriptionCreditParamsFromPrompt(
                                                                                      {},
                                                                                      prompt,
                                                                                    )
                                                                                  : {},
                                                                              rescued: true,
                                                                              rescueReason:
                                                                                membershipCustomerRescued.rescueReason,
                                                                            }
                                                                          : null
                                                                        : useSurfaceSelfServiceRescue
                                                                          ? selfServiceRescued
                                                                            ? {
                                                                                action:
                                                                                  selfServiceRescued.action,
                                                                                params:
                                                                                  selfServiceRescued.action ===
                                                                                  'cancel_my_booking'
                                                                                    ? enrichCancelMyBookingParamsFromPrompt(
                                                                                        {},
                                                                                        prompt,
                                                                                      )
                                                                                    : selfServiceRescued.action ===
                                                                                        'reschedule_my_booking'
                                                                                      ? enrichRescheduleMyBookingParamsFromPrompt(
                                                                                          {},
                                                                                          prompt,
                                                                                        )
                                                                                      : selfServiceRescued.action ===
                                                                                          'confirm_my_booking_details'
                                                                                        ? (() => {
                                                                                            const parsed =
                                                                                              parseConfirmMyBookingDetailsFromPrompt(
                                                                                                prompt,
                                                                                              );
                                                                                            return parsed
                                                                                              ? {
                                                                                                  aspect:
                                                                                                    parsed.aspect,
                                                                                                  ...(parsed.bookingId
                                                                                                    ? {
                                                                                                        bookingId:
                                                                                                          parsed.bookingId,
                                                                                                      }
                                                                                                    : {}),
                                                                                                  ...(parsed.serviceName
                                                                                                    ? {
                                                                                                        serviceName:
                                                                                                          parsed.serviceName,
                                                                                                      }
                                                                                                    : {}),
                                                                                                }
                                                                                              : {};
                                                                                          })()
                                                                                        : selfServiceRescued.action ===
                                                                                            'add_booking_to_calendar'
                                                                                          ? (() => {
                                                                                              const parsed =
                                                                                                parseAddBookingToCalendarFromPrompt(
                                                                                                  prompt,
                                                                                                );
                                                                                              return parsed
                                                                                                ? {
                                                                                                    format:
                                                                                                      parsed.format,
                                                                                                    ...(parsed.bookingId
                                                                                                      ? {
                                                                                                          bookingId:
                                                                                                            parsed.bookingId,
                                                                                                        }
                                                                                                      : {}),
                                                                                                    ...(parsed.serviceName
                                                                                                      ? {
                                                                                                          serviceName:
                                                                                                            parsed.serviceName,
                                                                                                        }
                                                                                                      : {}),
                                                                                                  }
                                                                                                : {};
                                                                                            })()
                                                                                          : selfServiceRescued.action ===
                                                                                              'explain_preparation_notes'
                                                                                            ? (() => {
                                                                                                const parsed =
                                                                                                  parseExplainPreparationNotesFromPrompt(
                                                                                                    prompt,
                                                                                                  );
                                                                                                return parsed
                                                                                                  ? {
                                                                                                      aspect:
                                                                                                        parsed.aspect,
                                                                                                      ...(parsed.bookingId
                                                                                                        ? {
                                                                                                            bookingId:
                                                                                                              parsed.bookingId,
                                                                                                          }
                                                                                                        : {}),
                                                                                                      ...(parsed.serviceName
                                                                                                        ? {
                                                                                                            serviceName:
                                                                                                              parsed.serviceName,
                                                                                                          }
                                                                                                        : {}),
                                                                                                    }
                                                                                                  : {};
                                                                                              })()
                                                                                            : selfServiceRescued.action ===
                                                                                                'book_another_service'
                                                                                              ? (() => {
                                                                                                  const parsed =
                                                                                                    parseBookAnotherServiceFromPrompt(
                                                                                                      prompt,
                                                                                                    );
                                                                                                  return parsed
                                                                                                    ? {
                                                                                                        sameDay:
                                                                                                          parsed.sameDay,
                                                                                                        ...(parsed.bookingId
                                                                                                          ? {
                                                                                                              bookingId:
                                                                                                                parsed.bookingId,
                                                                                                            }
                                                                                                          : {}),
                                                                                                        ...(parsed.serviceName
                                                                                                          ? {
                                                                                                              serviceName:
                                                                                                                parsed.serviceName,
                                                                                                            }
                                                                                                          : {}),
                                                                                                      }
                                                                                                    : {};
                                                                                                })()
                                                                                              : selfServiceRescued.action ===
                                                                                                    'book_multi_service' ||
                                                                                                  selfServiceRescued.action ===
                                                                                                    'check_multi_service_availability' ||
                                                                                                  selfServiceRescued.action ===
                                                                                                    'add_services_to_cart'
                                                                                                ? enrichMultiServiceBookingParamsFromPrompt(
                                                                                                    {},
                                                                                                    prompt,
                                                                                                  )
                                                                                                : selfServiceRescued.action ===
                                                                                                    'explain_package_savings'
                                                                                                  ? enrichExplainPackageSavingsParamsFromPrompt(
                                                                                                      {},
                                                                                                      prompt,
                                                                                                    )
                                                                                                  : selfServiceRescued.action ===
                                                                                                      'explain_subscription_vs_one_time'
                                                                                                    ? enrichExplainSubscriptionVsOneTimeParamsFromPrompt(
                                                                                                        {},
                                                                                                        prompt,
                                                                                                      )
                                                                                                    : selfServiceRescued.action ===
                                                                                                        'explain_lab_prep'
                                                                                                      ? enrichExplainLabPrepParamsFromPrompt(
                                                                                                          {},
                                                                                                          prompt,
                                                                                                        )
                                                                                                      : selfServiceRescued.action ===
                                                                                                          'explain_clinic_booking_fields'
                                                                                                        ? enrichExplainClinicBookingFieldsParamsFromPrompt(
                                                                                                            {},
                                                                                                            prompt,
                                                                                                          )
                                                                                                        : selfServiceRescued.action ===
                                                                                                            'explain_public_intake_form'
                                                                                                          ? enrichExplainPublicIntakeFormParamsFromPrompt(
                                                                                                              {},
                                                                                                              prompt,
                                                                                                            )
                                                                                                          : selfServiceRescued.action ===
                                                                                                              'explain_manage_booking_page'
                                                                                                            ? enrichExplainManageBookingPageParamsFromPrompt(
                                                                                                                {},
                                                                                                                prompt,
                                                                                                              )
                                                                                                            : {},
                                                                                rescued: true,
                                                                                rescueReason:
                                                                                  selfServiceRescued.rescueReason,
                                                                              }
                                                                            : null
                                                                          : useSurfaceMarketingGrowthRescue
                                                                            ? marketingGrowthRescued
                                                                              ? {
                                                                                  action:
                                                                                    marketingGrowthRescued.action,
                                                                                  params:
                                                                                    marketingGrowthRescued.action ===
                                                                                    'promo_code_help'
                                                                                      ? enrichPromoCodeHelpParamsFromPrompt(
                                                                                          {},
                                                                                          prompt,
                                                                                        )
                                                                                      : {},
                                                                                  rescued: true,
                                                                                  rescueReason:
                                                                                    marketingGrowthRescued.rescueReason,
                                                                                }
                                                                              : null
                                                                            : useSurfaceConsumerCheckoutSuccessRescue
                                                                              ? consumerCheckoutSuccessRescued &&
                                                                                consumerCheckoutSuccessParsed
                                                                                ? {
                                                                                    action:
                                                                                      consumerCheckoutSuccessRescued.action,
                                                                                    params:
                                                                                      {
                                                                                        aspect:
                                                                                          consumerCheckoutSuccessParsed.aspect,
                                                                                      },
                                                                                    rescued: true,
                                                                                    rescueReason:
                                                                                      consumerCheckoutSuccessRescued.rescueReason,
                                                                                  }
                                                                                : null
                                                                              : useSurfaceConsumerCheckoutTaxRescue
                                                                                ? consumerCheckoutTaxRescued &&
                                                                                  consumerCheckoutTaxParsed
                                                                                  ? {
                                                                                      action:
                                                                                        consumerCheckoutTaxRescued.action,
                                                                                      params:
                                                                                        {
                                                                                          aspect:
                                                                                            consumerCheckoutTaxParsed.aspect,
                                                                                        },
                                                                                      rescued: true,
                                                                                      rescueReason:
                                                                                        consumerCheckoutTaxRescued.rescueReason,
                                                                                    }
                                                                                  : null
                                                                                : useSurfaceExplainCheckoutTaxRescue
                                                                                  ? explainCheckoutTaxRescued &&
                                                                                    explainCheckoutTaxParsed
                                                                                    ? {
                                                                                        action:
                                                                                          explainCheckoutTaxRescued.action,
                                                                                        params:
                                                                                          {
                                                                                            aspect:
                                                                                              explainCheckoutTaxParsed.aspect,
                                                                                          },
                                                                                        rescued: true,
                                                                                        rescueReason:
                                                                                          explainCheckoutTaxRescued.rescueReason,
                                                                                      }
                                                                                    : null
                                                                                  : useSurfaceConsumerClinicTestResultsRescue
                                                                                    ? consumerClinicTestResultsRescued
                                                                                      ? {
                                                                                          action:
                                                                                            consumerClinicTestResultsRescued.action,
                                                                                          params:
                                                                                            consumerClinicTestResultsRescued.action ===
                                                                                            'list_my_test_results'
                                                                                              ? {
                                                                                                  ...(consumerClinicListParsed ??
                                                                                                    {}),
                                                                                                }
                                                                                              : {
                                                                                                  ...(consumerClinicExplainParsed ??
                                                                                                    {}),
                                                                                                },
                                                                                          rescued: true,
                                                                                          rescueReason:
                                                                                            consumerClinicTestResultsRescued.rescueReason,
                                                                                        }
                                                                                      : null
                                                                                    : useSurfaceTrackLabOrderStatusRescue
                                                                                      ? trackLabOrderStatusRescued
                                                                                        ? {
                                                                                            action:
                                                                                              trackLabOrderStatusRescued.action,
                                                                                            params:
                                                                                              enrichTrackLabOrderStatusParamsFromPrompt(
                                                                                                {},
                                                                                                prompt,
                                                                                              ),
                                                                                            rescued: true,
                                                                                            rescueReason:
                                                                                              trackLabOrderStatusRescued.rescueReason,
                                                                                          }
                                                                                        : null
                                                                                      : useSurfaceListMyDocumentsRescue
                                                                                        ? listMyDocumentsRescued
                                                                                          ? {
                                                                                              action:
                                                                                                listMyDocumentsRescued.action,
                                                                                              params:
                                                                                                enrichListMyDocumentsParamsFromPrompt(
                                                                                                  {},
                                                                                                  prompt,
                                                                                                ),
                                                                                              rescued: true,
                                                                                              rescueReason:
                                                                                                listMyDocumentsRescued.rescueReason,
                                                                                            }
                                                                                          : null
                                                                                        : useSurfaceExplainAbnormalResultFlagRescue
                                                                                          ? explainAbnormalResultFlagRescued
                                                                                            ? {
                                                                                                action:
                                                                                                  explainAbnormalResultFlagRescued.action,
                                                                                                params:
                                                                                                  enrichExplainAbnormalResultFlagParamsFromPrompt(
                                                                                                    {},
                                                                                                    prompt,
                                                                                                  ),
                                                                                                rescued: true,
                                                                                                rescueReason:
                                                                                                  explainAbnormalResultFlagRescued.rescueReason,
                                                                                              }
                                                                                            : null
                                                                                          : useSurfaceNotifyWhenResultsReadyRescue
                                                                                            ? notifyWhenResultsReadyRescued
                                                                                              ? {
                                                                                                  action:
                                                                                                    notifyWhenResultsReadyRescued.action,
                                                                                                  params:
                                                                                                    enrichNotifyWhenResultsReadyParamsFromPrompt(
                                                                                                      {},
                                                                                                      prompt,
                                                                                                    ),
                                                                                                  rescued: true,
                                                                                                  rescueReason:
                                                                                                    notifyWhenResultsReadyRescued.rescueReason,
                                                                                                }
                                                                                              : null
                                                                                            : useSurfaceProviderImplicationRescue
                                                                                              ? providerImplicationAction &&
                                                                                                providerImplicationAction !==
                                                                                                  misclassifiedAction
                                                                                                ? {
                                                                                                    action:
                                                                                                      providerImplicationAction,
                                                                                                    params:
                                                                                                      {},
                                                                                                    rescued: true,
                                                                                                    rescueReason:
                                                                                                      'provider_heuristic',
                                                                                                  }
                                                                                                : null
                                                                                              : useSurfaceProviderPushSetupRescue
                                                                                                ? providerPushSetupRescued
                                                                                                  ? {
                                                                                                      action:
                                                                                                        providerPushSetupRescued.action,
                                                                                                      params:
                                                                                                        {},
                                                                                                      rescued: true,
                                                                                                      rescueReason:
                                                                                                        providerPushSetupRescued.rescueReason,
                                                                                                    }
                                                                                                  : null
                                                                                                : useSurfaceResumeBookingDraftRescue
                                                                                                  ? resumeBookingDraftRescued
                                                                                                    ? {
                                                                                                        action:
                                                                                                          resumeBookingDraftRescued.action,
                                                                                                        params:
                                                                                                          {},
                                                                                                        rescued: true,
                                                                                                        rescueReason:
                                                                                                          resumeBookingDraftRescued.rescueReason,
                                                                                                      }
                                                                                                    : null
                                                                                                  : useSurfaceExplainSlotNoLongerAvailableRescue
                                                                                                    ? explainSlotNoLongerAvailableRescued
                                                                                                      ? {
                                                                                                          action:
                                                                                                            explainSlotNoLongerAvailableRescued.action,
                                                                                                          params:
                                                                                                            {},
                                                                                                          rescued: true,
                                                                                                          rescueReason:
                                                                                                            explainSlotNoLongerAvailableRescued.rescueReason,
                                                                                                        }
                                                                                                      : null
                                                                                                    : useSurfaceExplainMultiServicePaymentReturnRescue
                                                                                                      ? explainMultiServicePaymentReturnRescued
                                                                                                        ? {
                                                                                                            action:
                                                                                                              explainMultiServicePaymentReturnRescued.action,
                                                                                                            params:
                                                                                                              {},
                                                                                                            rescued: true,
                                                                                                            rescueReason:
                                                                                                              explainMultiServicePaymentReturnRescued.rescueReason,
                                                                                                          }
                                                                                                        : null
                                                                                                      : useSurfaceRetryFailedNetworkActionRescue
                                                                                                        ? retryFailedNetworkActionRescued
                                                                                                          ? {
                                                                                                              action:
                                                                                                                retryFailedNetworkActionRescued.action,
                                                                                                              params:
                                                                                                                {},
                                                                                                              rescued: true,
                                                                                                              rescueReason:
                                                                                                                retryFailedNetworkActionRescued.rescueReason,
                                                                                                            }
                                                                                                          : null
                                                                                                        : useSurfaceExplainVoiceInputRescue
                                                                                                          ? explainVoiceInputRescued
                                                                                                            ? {
                                                                                                                action:
                                                                                                                  explainVoiceInputRescued.action,
                                                                                                                params:
                                                                                                                  {},
                                                                                                                rescued: true,
                                                                                                                rescueReason:
                                                                                                                  explainVoiceInputRescued.rescueReason,
                                                                                                              }
                                                                                                            : null
                                                                                                          : useSurfaceSpeakAssistantReplyRescue
                                                                                                            ? speakAssistantReplyRescued
                                                                                                              ? {
                                                                                                                  action:
                                                                                                                    speakAssistantReplyRescued.action,
                                                                                                                  params:
                                                                                                                    {},
                                                                                                                  rescued: true,
                                                                                                                  rescueReason:
                                                                                                                    speakAssistantReplyRescued.rescueReason,
                                                                                                                }
                                                                                                              : null
                                                                                                            : useSurfaceGiveAiFeedbackRescue
                                                                                                              ? giveAiFeedbackRescued
                                                                                                                ? {
                                                                                                                    action:
                                                                                                                      giveAiFeedbackRescued.action,
                                                                                                                    params:
                                                                                                                      {},
                                                                                                                    rescued: true,
                                                                                                                    rescueReason:
                                                                                                                      giveAiFeedbackRescued.rescueReason,
                                                                                                                  }
                                                                                                                : null
                                                                                                              : useSurfaceExplainRtlLayoutRescue
                                                                                                                ? explainRtlLayoutRescued
                                                                                                                  ? {
                                                                                                                      action:
                                                                                                                        explainRtlLayoutRescued.action,
                                                                                                                      params:
                                                                                                                        {},
                                                                                                                      rescued: true,
                                                                                                                      rescueReason:
                                                                                                                        explainRtlLayoutRescued.rescueReason,
                                                                                                                    }
                                                                                                                  : null
                                                                                                                : useSurfacePaymentsRescue
                                                                                                                  ? paymentsRescued
                                                                                                                    ? {
                                                                                                                        action:
                                                                                                                          paymentsRescued.action,
                                                                                                                        params:
                                                                                                                          paymentsRescued.action ===
                                                                                                                          'buy_gift_card_for_someone'
                                                                                                                            ? enrichBuyGiftCardForSomeoneParamsFromPrompt(
                                                                                                                                {},
                                                                                                                                prompt,
                                                                                                                              )
                                                                                                                            : paymentsRescued.action ===
                                                                                                                                  'explain_why_stripe_required' ||
                                                                                                                                paymentsRescued.action ===
                                                                                                                                  'explain_checkout_total' ||
                                                                                                                                paymentsRescued.action ===
                                                                                                                                  'explain_service_price' ||
                                                                                                                                paymentsRescued.action ===
                                                                                                                                  'explain_payment_options_for_service' ||
                                                                                                                                paymentsRescued.action ===
                                                                                                                                  'find_soonest_appointment' ||
                                                                                                                                paymentsRescued.action ===
                                                                                                                                  'compare_services' ||
                                                                                                                                paymentsRescued.action ===
                                                                                                                                  'filter_services_no_prepayment' ||
                                                                                                                                paymentsRescued.action ===
                                                                                                                                  'explain_amount_due_now'
                                                                                                                              ? paymentsRescued.action ===
                                                                                                                                'explain_service_price'
                                                                                                                                ? enrichExplainServicePriceParamsFromPrompt(
                                                                                                                                    {},
                                                                                                                                    prompt,
                                                                                                                                  )
                                                                                                                                : paymentsRescued.action ===
                                                                                                                                    'explain_payment_options_for_service'
                                                                                                                                  ? enrichExplainPaymentOptionsParamsFromPrompt(
                                                                                                                                      {},
                                                                                                                                      prompt,
                                                                                                                                    )
                                                                                                                                  : paymentsRescued.action ===
                                                                                                                                      'find_soonest_appointment'
                                                                                                                                    ? enrichFindSoonestParamsFromPrompt(
                                                                                                                                        {},
                                                                                                                                        prompt,
                                                                                                                                      )
                                                                                                                                    : paymentsRescued.action ===
                                                                                                                                        'compare_services'
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
                                                                                                                        rescueReason:
                                                                                                                          paymentsRescued.rescueReason,
                                                                                                                      }
                                                                                                                    : null
                                                                                                                  : useSurfaceLabBookingRescue
                                                                                                                    ? surfaceRescued
                                                                                                                      ? {
                                                                                                                          action:
                                                                                                                            surfaceRescued.action,
                                                                                                                          params:
                                                                                                                            surfaceRescued.params,
                                                                                                                          rescued: true,
                                                                                                                          rescueReason:
                                                                                                                            surfaceRescued.rescueReason,
                                                                                                                        }
                                                                                                                      : null
                                                                                                                    : useProductGuideRescue
                                                                                                                      ? productGuideRescued
                                                                                                                      : useCheckoutCurrencyRescue
                                                                                                                        ? checkoutCurrencyRescued
                                                                                                                          ? {
                                                                                                                              action:
                                                                                                                                checkoutCurrencyRescued.action,
                                                                                                                              params:
                                                                                                                                enrichBudgetFromPrompt(
                                                                                                                                  {},
                                                                                                                                  prompt,
                                                                                                                                ),
                                                                                                                              rescued: true,
                                                                                                                              rescueReason:
                                                                                                                                checkoutCurrencyRescued.rescueReason,
                                                                                                                            }
                                                                                                                          : null
                                                                                                                        : useSurfaceRankRescue
                                                                                                                          ? rankRescued
                                                                                                                            ? {
                                                                                                                                action:
                                                                                                                                  rankRescued.action,
                                                                                                                                params:
                                                                                                                                  rankRescued.params,
                                                                                                                                rescued: true,
                                                                                                                                rescueReason:
                                                                                                                                  rankRescued.rescueReason,
                                                                                                                              }
                                                                                                                            : null
                                                                                                                          : useSurfaceBudgetRescue
                                                                                                                            ? budgetRescued
                                                                                                                              ? {
                                                                                                                                  action:
                                                                                                                                    budgetRescued.action,
                                                                                                                                  params:
                                                                                                                                    enrichBudgetFromPrompt(
                                                                                                                                      {},
                                                                                                                                      prompt,
                                                                                                                                    ),
                                                                                                                                  rescued: true,
                                                                                                                                  rescueReason:
                                                                                                                                    budgetRescued.rescueReason,
                                                                                                                                }
                                                                                                                              : null
                                                                                                                            : rescue.rescue(
                                                                                                                                {
                                                                                                                                  prompt,
                                                                                                                                  action:
                                                                                                                                    misclassifiedAction,
                                                                                                                                  params:
                                                                                                                                    {},
                                                                                                                                  employees:
                                                                                                                                    SAMPLE_EMPLOYEES,
                                                                                                                                  surface:
                                                                                                                                    evalCase.surface,
                                                                                                                                },
                                                                                                                              );
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
        errors.push(
          ...paramsMatchPartial(rescued.params, expect.paramsPartial),
        );
      }
    } else if (rescued?.params) {
      enrichCatalogNotifyRescueParams(rescued.action, rescued.params, prompt);
    }
  }

  if (
    expect.action &&
    !expect.rescuedAction &&
    !expect.useClinicTestResultExtClassifierDetect
  ) {
    errors.push(
      'action expectation requires requiresLlm or rescuedAction in deterministic eval',
    );
  }

  if (expect.useClinicTestResultExtClassifierDetect) {
    errors.push(...assertClinicTestResultExtClassifierDetect(prompt, expect));
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
