import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import OpenAI from 'openai';
import { PublicBookingService } from './public-booking.service.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { BusinessService } from '../business/business.service.js';
import { OpenAiGatewayService } from '../integrations/openai/openai-gateway.service.js';
import {
  formatDateDisplay,
  formatTimeDisplay,
  formatTimeRangeDisplay,
  toIsoDay,
} from '../../common/utils/date-format.util.js';
import {
  getDateKeyInTimezone,
  resolveTimezone,
} from '../../common/utils/timezone.util.js';
import { CreatePublicBookingDto } from './dto/public-booking.dto.js';
import {
  resolveLocale,
  t,
  type AppLocale,
} from '../../common/i18n/messages.js';
import { formatWeekdayShortByDayIndex } from '../../common/i18n/locale-date.util.js';
import { BookingSlotResolverService } from '../booking/booking-slot-resolver.service.js';
import { AiPlatformService } from '../ai/ai-platform.service.js';
import { AiSettingsService } from '../ai/ai-settings.service.js';
import {
  fuzzyMatchServiceByName,
  inferServiceGroupLabel,
  matchServicesByQuery,
  PUBLIC_AVAILABILITY_SCAN_DAYS,
  resolveEmployees,
  resolvePublicAvailabilityDateKeys,
  resolvePublicAvailabilityWindows,
  resolveServicesFromCatalogParams,
  enrichListServicesParamsFromPrompt,
  stripServiceRoleNoise,
  resolvePublicAssistantSessionServiceFields,
  fuzzyMatchByName as canonicalFuzzyMatchByName,
} from '../ai/ai-orchestration.helpers.js';
import { resolveEntity } from '../ai/ai-entity-resolution.util.js';
import { normalizeAvailabilityServiceCategory } from '../ai/ai-flexible-availability.util.js';
import { addDaysToDateKey } from '../../common/utils/timezone.util.js';
import {
  readBusinessPrivacySettings,
  toPublicBusinessPrivacySettings,
} from '../../common/utils/business-compliance.util.js';
import { readTenantAppInstallSettings } from '../../common/utils/tenant-app-install-settings.util.js';
import { buildNoNearestSlotMessage } from '../ai/ai-booking-slot-messages.util.js';
import { formatDateForAiLabel } from '../ai/ai-date-label.util.js';
import {
  attachCheckProvidersHandoff,
  buildCheckProvidersHandoffFromResult,
  pickCheckProvidersHandoff,
  type CheckProvidersHandoff,
} from '../ai/ai-check-book-handoff.util.js';
import {
  applyChosenAvailabilityWindowToParams,
  buildNearestAvailabilityWindowQueries,
  buildNearestBookableSlotQuery,
  resolveNearestBookableSlotNotBeforeTime,
} from '../ai/ai-nearest-slot-resolver.util.js';
import { AiBusinessDateFormatService } from '../ai/ai-business-date-format.service.js';
import { AiBusinessHoursLocationService } from '../ai/ai-explain-business-hours-and-location.service.js';
import { AiProviderSpecialtyService } from '../ai/ai-explain-provider-specialty.service.js';
import { AiBusinessComplianceService } from '../ai/ai-business-compliance.service.js';
import { AiConsumerClinicTestResultsService } from '../ai/ai-consumer-clinic-test-results.service.js';
import { AiClinicLabBookingService } from '../ai/ai-clinic-lab-booking.service.js';
import { AiClinicBookingService } from '../ai/ai-clinic-booking.service.js';
import { AiGuestCheckoutFieldsService } from '../ai/ai-explain-guest-checkout-fields.service.js';
import { AiProductGuideService } from '../ai/ai-product-guide.service.js';
import { AiProductGuideEmptyStateService } from '../ai/ai-product-guide-empty-state.service.js';
import {
  mapCommandResultGuideNavigate,
  runSurfaceProductGuideIntent,
} from '../ai/ai-product-guide-surface.logic.js';
import {
  mapPublicBookingGuideRoute,
  mergePublicBookingGuideContext,
  resolvePublicBookingGuideIntent,
  resolvePublicBookingGuideNavigate,
  rewriteBookingHelpGuideResult,
} from '../ai/ai-public-booking-guide.util.js';
import {
  enrichGuideTopicFromPrompt,
  rescueProductGuideIntent,
} from '../ai/ai-product-guide-rescue.util.js';
import { resolveProductGuideSessionContext } from '../ai/ai-product-guide-session.util.js';
import {
  isAppGuideIntent,
  resolveProductGuidePromptMatch,
  type AppGuideIntent,
} from '../ai/ai-product-guide.util.js';
import {
  isEmptyStateGuideIntent,
  type EmptyStateGuideIntent,
} from '../ai/ai-product-guide-empty-state.util.js';
import { AiBusinessCurrencyService } from '../ai/ai-business-currency.service.js';
import { AiBusinessTaxService } from '../ai/ai-business-tax.service.js';
import { AiTourServiceService } from '../ai/ai-tour-service.service.js';
import { AiRecommendationProductService } from '../ai/ai-recommendation-product.service.js';
import { AiBusinessLanguagesService } from '../ai/ai-business-languages.service.js';
import { AiPackageLocalizedNamesService } from '../ai/ai-package-localized-names.service.js';
import { AiPromptNormalizationService } from '../ai/ai-prompt-normalization.service.js';
import { PublicCommandUnderstandingAdapter } from '../ai/public-command-understanding.adapter.js';
import {
  buildPipelineClarifyCommandResult,
  buildUnknownIntentClarifyResult,
  shouldBlockUnknownFromHandlerSwitch,
} from '../ai/ai-unknown-intent.util.js';
import {
  findClassifierCandidate,
  pipelineRescueReason,
  pipelineResultToClassifiedIntent,
} from '../ai/command-understanding-result.util.js';
import type { ClassifiedIntent } from '../ai/ai-command-routing.util.js';
import type { CommandResult } from '../ai/command-completion.types.js';
import type { PipelineUnderstandResult } from '../ai/command-understanding.types.js';
import { enrichPublicAssistantParamsFromPrompt } from '../ai/ai-intent-heuristics.js';
import { enrichBookAppointmentParamsFromPrompt } from '../ai/ai-book-appointment-params.util.js';
import {
  enrichFindServicesUnderBudgetParamsFromPrompt,
  parseFindServicesUnderBudgetFromPrompt,
  rescueFindServicesUnderBudgetIntent,
} from '../ai/ai-find-services-under-budget.util.js';
import {
  enrichFindEveningWeekendSlotsParamsFromPrompt,
  parseFindEveningWeekendSlotsFromPrompt,
  rescueFindEveningWeekendSlotsIntent,
} from '../ai/ai-find-evening-weekend-slots.util.js';
import { rescueBudgetServiceDiscoveryIntent } from '../ai/ai-budget-service-discovery.util.js';
import {
  rescueServiceRankFromRecommendSpecialistsIntent,
  rescueServiceRankDiscoveryIntent,
} from '../ai/ai-service-rank-discovery.util.js';
import { rescueServiceCatalogBrowseIntent } from '../ai/ai-service-catalog-browse.util.js';
import {
  commandResultToPublicAssistantResult,
  publicAssistantResultToCommandResult,
} from '../ai/customer-ai-command.util.js';
import {
  appendPostFailureGuideFallback,
  buildPostFailureGuideFallbackInput,
} from '../ai/ai-product-guide-failure-fallback.util.js';
import {
  buildAiUnavailableErrorWithGuideLink,
  runAiUnavailableStaticGuideFallback,
} from '../ai/ai-product-guide-ai-unavailable.util.js';
export { buildPublicClassifierSchema } from './public-booking-classifier.schema.js';
import {
  applyBudgetFilterForRecommendSpecialists,
  composePublicListServicesBudgetResponse,
  resolveDiscoverConstrainedService,
} from '../ai/ai-budget-list-services.logic.js';
import {
  buildListServicesPaymentFilterHeader,
  filterServicesByListServicesPaymentPolicy,
  hasListServicesPaymentFilter,
  parseListServicesPaymentFilterFromPrompt,
  rescueListServicesPaymentFilterIntent,
  enrichListServicesPaymentFilterParamsFromPrompt,
} from '../ai/ai-list-services-payment-filters.util.js';
import { AiPaymentsService } from '../ai/ai-payments.service.js';
import { AiDiagnoseStripeCheckoutFailureService } from '../ai/ai-diagnose-stripe-checkout-failure.service.js';
import { AiPayAtVenueFallbackService } from '../ai/ai-pay-at-venue-fallback.service.js';
import { AiResumeBookingDraftService } from '../ai/ai-resume-booking-draft.service.js';
import { AiExplainSlotNoLongerAvailableService } from '../ai/ai-explain-slot-no-longer-available.service.js';
import { AiExplainVoiceInputService } from '../ai/ai-explain-voice-input.service.js';
import { AiSpeakAssistantReplyService } from '../ai/ai-speak-assistant-reply.service.js';
import { AiGiveAiFeedbackService } from '../ai/ai-give-ai-feedback.service.js';
import { AiExplainRtlLayoutService } from '../ai/ai-explain-rtl-layout.service.js';
import { rescueExplainPrepaymentIntent } from '../ai/ai-explain-prepayment.util.js';
import { rescueExplainAmountDueNowIntent } from '../ai/ai-explain-amount-due-now.util.js';
import { rescueExplainGuestCheckoutFieldsIntent } from '../ai/ai-explain-guest-checkout-fields.util.js';
import { rescueExplainWhySignInIntent } from '../ai/ai-explain-why-sign-in.util.js';
import { rescueSignInToManageBookingIntent } from '../ai/ai-sign-in-to-manage-booking.util.js';
import { rescueRecoverLostManageLinkIntent } from '../ai/ai-recover-lost-manage-link.util.js';
import { rescueFixCheckoutValidationErrorIntent } from '../ai/ai-fix-checkout-validation-error.util.js';
import { rescueConfirmMyBookingDetailsIntent } from '../ai/ai-confirm-my-booking-details.util.js';
import {
  enrichExplainSubscriptionVsOneTimeParamsFromPrompt,
  rescueExplainSubscriptionVsOneTimeIntent,
} from '../ai/ai-explain-subscription-vs-one-time.util.js';
import {
  enrichLeaveVisitReviewParamsFromPrompt,
  rescueLeaveVisitReviewIntent,
} from '../ai/ai-leave-visit-review.util.js';
import { rescueAddBookingToCalendarIntent } from '../ai/ai-add-booking-to-calendar.util.js';
import { rescueBookAnotherServiceIntent } from '../ai/ai-book-another-service.util.js';
import { rescueGetDirectionsToSalonIntent } from '../ai/ai-get-directions-to-salon.util.js';
import { rescueExplainPreparationNotesIntent } from '../ai/ai-explain-preparation-notes.util.js';
import { rescueFindSoonestAppointmentIntent } from '../ai/ai-find-soonest-appointment.util.js';
import { rescueCustomerWaitlistIntent } from '../ai/ai-customer-waitlist.util.js';
import { rescueCompareServicesIntent } from '../ai/ai-compare-services.util.js';
import { rescueFilterServicesNoPrepaymentIntent } from '../ai/ai-filter-services-no-prepayment.util.js';
import { rescueExplainBusinessHoursAndLocationIntent } from '../ai/ai-explain-business-hours-and-location.util.js';
import { rescueExplainProviderSpecialtyIntent } from '../ai/ai-explain-provider-specialty.util.js';
import { rescueExplainAnyProviderOptionIntent } from '../ai/ai-explain-any-provider-option.util.js';
import { rescuePickProviderForServiceIntent } from '../ai/ai-pick-provider-for-service.util.js';
import { rescueExplainProviderAvailabilityIntent } from '../ai/ai-explain-provider-availability.util.js';
import {
  prepareExplainProviderAvailabilityParams,
  validateExplainProviderAvailabilityParams,
  wrapCheckAvailabilityAsExplainProviderAvailability,
} from '../ai/ai-explain-provider-availability.logic.js';
import { parseExplainProviderAvailabilityFromPrompt } from '../ai/ai-explain-provider-availability.util.js';
import { rescueCashPaymentCheckoutIntent } from '../ai/ai-cash-payment-checkout.util.js';
import { rescuePayOnlineCheckoutIntent } from '../ai/ai-pay-online-checkout.util.js';
import { rescueConsumerDiagnoseStripeCheckoutFailureIntent } from '../ai/ai-diagnose-stripe-checkout-failure.util.js';
import { rescuePayAtVenueFallbackIntent } from '../ai/ai-pay-at-venue-fallback.util.js';
import { isRescheduleMyBookingPrompt } from '../ai/ai-self-service-booking.util.js';
import {
  enrichRescheduleWithTokenParamsFromPrompt,
  hasManageLinkCredentialsInSession,
  rescueManageBookingWithTokenIntent,
  resolveManageBookingCredentials,
} from '../ai/ai-manage-booking-with-token.util.js';
import {
  enrichBuyGiftCardForSomeoneParamsFromPrompt,
  rescueBuyGiftCardForSomeoneIntent,
} from '../ai/ai-buy-gift-card-for-someone.util.js';
import { rescueResumeBookingDraftIntent } from '../ai/ai-resume-booking-draft.util.js';
import { rescueExplainSlotNoLongerAvailableIntent } from '../ai/ai-explain-slot-no-longer-available.util.js';
import { rescueExplainVoiceInputIntent } from '../ai/ai-explain-voice-input.util.js';
import { rescueSpeakAssistantReplyIntent } from '../ai/ai-speak-assistant-reply.util.js';
import { rescueGiveAiFeedbackIntent } from '../ai/ai-give-ai-feedback.util.js';
import {
  mergeExplainRtlLayoutRequestLocale,
  rescueExplainRtlLayoutIntent,
} from '../ai/ai-explain-rtl-layout.util.js';
import {
  parseExplainCheckoutTaxFromPrompt,
  rescueCheckoutTaxIntent,
} from '../ai/ai-checkout-tax.util.js';
import {
  parseExplainDepositForfeitureFromPrompt,
  rescueExplainDepositForfeitureIntent,
} from '../ai/ai-explain-deposit-forfeiture.util.js';
import { rescueMultiServiceCustomerPublicIntent } from '../ai/ai-multi-service-customer-public.util.js';
import { isPublicMultiServiceCompoundPrompt } from '../ai/ai-multi-service-customer-public.util.js';
import { rescueApplyPromoCodeCheckoutIntent } from '../ai/ai-apply-promo-code-checkout.util.js';
import {
  enrichClaimReferralCodeParamsFromPrompt,
  rescueClaimReferralCodeIntent,
} from '../ai/ai-rewards-and-referral-claim.util.js';
import { enrichApplyPromoCodeCheckoutParamsFromPrompt } from '../ai/ai-apply-promo-code-checkout.util.js';
import { rescuePromoCodeHelpCustomerPublicIntent } from '../ai/ai-promo-code-help-customer-public.util.js';
import { rescueHowToDownloadAppCustomerPublicIntent } from '../ai/ai-how-to-download-app-customer-public.util.js';
import { rescueTourCustomerPublicIntent } from '../ai/ai-tour-customer-public.util.js';
import { rescueCheckoutRecommendationsCustomerPublicIntent } from '../ai/ai-checkout-recommendations-customer-public.util.js';
import { enrichPromoCodeHelpParamsFromPrompt } from '../ai/ai-promo-code-help-customer-public.util.js';
import { AiMarketingGrowthService } from '../ai/ai-marketing-growth.service.js';
import { AiSelfServiceBookingService } from '../ai/ai-self-service-booking.service.js';
import {
  composePublicListServicesMidRangeResponse,
  composePublicListServicesRankResponse,
  resolveListServicesRankLimitFromPrompt,
} from '../ai/ai-rank-list-services.logic.js';
import { resolveServiceTierParam } from '../../common/utils/service-rank-metadata.util.js';
import {
  isMidRangeServiceListPrompt,
  isValueOrPremiumBudgetListPrompt,
  resolveServiceRankParam,
} from '../ai/ai-service-rank-discovery.util.js';
import { isBudgetServiceDiscoveryCompoundPrompt } from '../ai/ai-budget-service-discovery-compound.util.js';
import { isFlexibleAvailabilityBudgetBookCompoundPrompt } from '../ai/ai-flexible-availability-compound.util.js';
import {
  appendAvailabilityNearestAlternativeNote,
  composeAvailabilityNoSlotsSummary,
  composePublicAvailabilityCheckSummary,
  composePublicAvailabilityGroupedEmptyWindowsSummary,
  filterPublicProviderSlotsByTimeOfDay,
  formatAvailabilityNearestAlternativeNote,
  mergePublicProviderSlotTimes,
  shouldGroupPublicAvailabilityByWindow,
  shouldUseGroupedAvailabilityNoSlotsSummary,
  applyBudgetFilterForAvailabilityCheck,
  type PublicAvailabilityDayReport,
  type PublicAvailabilityWindowReport,
} from '../ai/ai-flexible-availability-check.logic.js';
import {
  buildAvailabilityBudgetClarifyDetails,
  buildPublicAvailabilityWindowLabelForCheck,
  prepareAvailabilityWindowsForCheck,
  resolveAvailabilityBudgetClarifyMaxPrice,
} from '../ai/ai-flexible-availability-clarify.logic.js';
import { executePublicAssistantCompoundFromSteps } from './public-booking-assistant-compound.logic.js';
import {
  mergePublicAssistantSessionParams,
  serializePublicAssistantDiscoverySessionFields,
} from './public-booking-assistant-session.util.js';
import { AiEventsService } from '../ai/ai-events.service.js';
import { recordMisrouteTelemetry } from '../ai/ai-misroute-telemetry.util.js';
import {
  decomposeDeterministicForSurface,
  isCompoundPrompt,
} from '../ai/intent-decomposition.util.js';
import { isPublicAssistantCompoundPrompt } from '../ai/ai-public-assistant-compound.util.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

export interface PublicAssistantNavigate {
  path:
    | 'professionals'
    | 'provider_profile'
    | 'services'
    | 'checkout'
    | 'account'
    | 'home'
    | 'profile'
    | 'packages'
    | 'multi/checkout';
  query: Record<string, string>;
}

export interface PublicAssistantResult {
  success: boolean;
  action: string;
  summary: string;
  sessionContext?: Record<string, string | null>;
  navigate?: PublicAssistantNavigate;
  bookingId?: string;
  /** Product guide payload when assistant returns guide intents (ai-guide-1.0.3/1.0.4). */
  guide?: import('../ai/command-completion.types.js').GuideResponse;
  details?: Record<string, unknown>;
}

@Injectable()
export class PublicBookingAssistantService {
  private readonly logger = new Logger(PublicBookingAssistantService.name);

  constructor(
    private publicBookingService: PublicBookingService,
    private businessService: BusinessService,
    private openAi: OpenAiGatewayService,
    private slotResolver: BookingSlotResolverService,
    private platform: AiPlatformService,
    private aiSettings: AiSettingsService,
    private promptNormalization: AiPromptNormalizationService,
    private publicUnderstanding: PublicCommandUnderstandingAdapter,
    private aiEvents: AiEventsService,
    private businessCurrency: AiBusinessCurrencyService,
    private businessTax: AiBusinessTaxService,
    private businessLanguages: AiBusinessLanguagesService,
    private businessDateFormat: AiBusinessDateFormatService,
    private businessHoursLocation: AiBusinessHoursLocationService,
    private providerSpecialty: AiProviderSpecialtyService,
    private packageLocalizedNames: AiPackageLocalizedNamesService,
    private tourService: AiTourServiceService,
    private recommendationProduct: AiRecommendationProductService,
    private businessCompliance: AiBusinessComplianceService,
    private consumerClinicTestResults: AiConsumerClinicTestResultsService,
    private clinicLabBooking: AiClinicLabBookingService,
    private clinicBooking: AiClinicBookingService,
    private guestCheckoutFields: AiGuestCheckoutFieldsService,
    private productGuide: AiProductGuideService,
    private emptyStateGuide: AiProductGuideEmptyStateService,
    private payments: AiPaymentsService,
    private diagnoseStripeCheckoutFailure: AiDiagnoseStripeCheckoutFailureService,
    private payAtVenueFallback: AiPayAtVenueFallbackService,
    private resumeBookingDraft: AiResumeBookingDraftService,
    private explainSlotNoLongerAvailable: AiExplainSlotNoLongerAvailableService,
    private explainVoiceInput: AiExplainVoiceInputService,
    private speakAssistantReply: AiSpeakAssistantReplyService,
    private giveAiFeedback: AiGiveAiFeedbackService,
    private explainRtlLayout: AiExplainRtlLayoutService,
    private selfServiceBooking: AiSelfServiceBookingService,
    private marketingGrowth: AiMarketingGrowthService,
    @InjectRepository(Employee) private employeeRepo: Repository<Employee>,
    @InjectRepository(Service) private serviceRepo: Repository<Service>,
  ) {}

  async chat(
    slug: string,
    prompt: string,
    session?: {
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
      context?: Record<string, any>;
      locale?: string;
    },
    options?: { recordMetrics?: boolean },
  ): Promise<PublicAssistantResult> {
    const business = await this.businessService.findBySlug(slug);
    const locale = resolveLocale(
      session?.locale,
      resolveLocale(business.settings?.locale, 'en'),
    );
    const aiConfig = await this.aiSettings.getSettings(business.id);
    const businessType = business.settings?.businessType as string | undefined;
    const orchestratedSession = this.platform.enrichPublicSession(
      session?.context,
      businessType,
      aiConfig,
    );

    if (!(await this.openAi.isAvailableForBusiness(business.id))) {
      const fallback = await runAiUnavailableStaticGuideFallback({
        productGuide: this.productGuide,
        businessId: business.id,
        prompt,
        surface: 'public',
        reason: 'openai_not_configured',
        session: { context: orchestratedSession },
        locale,
      });
      if (fallback) {
        return commandResultToPublicAssistantResult(fallback);
      }
      return commandResultToPublicAssistantResult(
        buildAiUnavailableErrorWithGuideLink({
          surface: 'public',
          reason: 'openai_not_configured',
          route: mapPublicBookingGuideRoute(orchestratedSession),
          locale,
        }),
      );
    }

    const guideMatch = resolveProductGuidePromptMatch(prompt, {
      surface: 'public',
      assistantMode: orchestratedSession?.assistantMode as
        | 'guide'
        | 'act'
        | undefined,
    });
    if (guideMatch.matched && guideMatch.intent) {
      return commandResultToPublicAssistantResult(
        await this.dispatchPublicAppGuideIntent(
          business.id,
          prompt,
          guideMatch.intent,
          locale,
          orchestratedSession,
        ),
      );
    }

    const tz = resolveTimezone(business.timezone);
    const todayKey = getDateKeyInTimezone(new Date(), tz);
    const todayDisplay = formatDateDisplay(todayKey, locale);

    const [employees, services] = await Promise.all([
      this.employeeRepo.find({
        where: { businessId: business.id, isActive: true },
        order: { name: 'ASC' },
      }),
      this.serviceRepo.find({
        where: { businessId: business.id, isActive: true },
        order: { name: 'ASC' },
      }),
    ]);

    const contextBlock = `Business: ${business.name}
Today's date: ${todayDisplay} (DD/MM/YYYY; schedule times are shown in 24h HH:mm)
Providers: ${
      employees
        .map((e) => {
          const title = e.metadata?.title || e.metadata?.role;
          return title ? `${e.name} (${title})` : e.name;
        })
        .join(', ') || 'none'
    }
Services: ${services.map((s) => `${s.name} — ${s.durationMinutes} min, ${s.price} ${s.currency}`).join(', ') || 'none'}`;

    const compoundResult = await this.tryExecutePublicCompound(
      slug,
      prompt,
      orchestratedSession,
      employees,
      services,
      locale,
      tz,
      todayKey,
      options,
    );
    if (compoundResult) return compoundResult;

    const promptNorm = await this.promptNormalization.normalizeForClassifier(
      business.id,
      undefined,
      prompt,
    );

    const understood = await this.publicUnderstanding.understand({
      businessId: business.id,
      effectivePrompt: prompt,
      confidence: aiConfig.confidence,
      sessionConfidenceHigh: orchestratedSession?._confidenceHigh as
        | number
        | undefined,
      lastAction: orchestratedSession?.lastAction as string | undefined,
      sessionContext: orchestratedSession,
      history: session?.history,
      locale,
      businessContextBlock: contextBlock,
      employees: employees.map((e) => ({ id: e.id, name: e.name })),
      promptNorm,
      classify: (normalizedPrompt, systemContext) =>
        this.classifyIntent(
          business.id,
          normalizedPrompt,
          systemContext,
          session?.history,
          orchestratedSession,
          locale,
        ),
    });

    if (understood.status === 'blocked') {
      // e2e-bug.280 — cheap deterministic feedback rescues must still run when
      // the understand pipeline blocked (null classify + unknown-phase miss).
      if (rescueGiveAiFeedbackIntent(prompt, 'unknown')) {
        // e2e-bug.299 — thread request locale into feedback chip/summary copy.
        return this.handleGiveAiFeedback(business.id, {}, prompt, locale);
      }
      return {
        success: false,
        action: 'unknown',
        summary: t(locale, 'assistant.unknown'),
      };
    }

    if (understood.status === 'clarify') {
      return this.applyPostFailureGuideFallback(
        this.pipelineClarifyToPublicResult(understood, locale),
        orchestratedSession,
        locale,
        prompt,
      );
    }

    const parsed = pipelineResultToClassifiedIntent(understood);
    const classifierCandidate = findClassifierCandidate(understood);
    const classifierAction = classifierCandidate?.action ?? parsed.action;
    const classifierConfidence = classifierCandidate?.confidence;
    let rescueReason: string | undefined = pipelineRescueReason(understood);

    const fixCheckoutValidationErrorRescue =
      rescueFixCheckoutValidationErrorIntent(prompt, parsed.action);
    if (fixCheckoutValidationErrorRescue) {
      parsed.action = fixCheckoutValidationErrorRescue.action;
      rescueReason = fixCheckoutValidationErrorRescue.rescueReason;
    }

    const explainPreparationNotesRescue = rescueExplainPreparationNotesIntent(
      prompt,
      parsed.action,
    );
    if (explainPreparationNotesRescue) {
      parsed.action = explainPreparationNotesRescue.action;
      rescueReason = explainPreparationNotesRescue.rescueReason;
    }

    const getDirectionsToSalonRescue = rescueGetDirectionsToSalonIntent(
      prompt,
      parsed.action,
    );
    if (getDirectionsToSalonRescue) {
      parsed.action = getDirectionsToSalonRescue.action;
      rescueReason = getDirectionsToSalonRescue.rescueReason;
    }

    const bookAnotherServiceRescue = rescueBookAnotherServiceIntent(
      prompt,
      parsed.action,
    );
    if (bookAnotherServiceRescue) {
      parsed.action = bookAnotherServiceRescue.action;
      rescueReason = bookAnotherServiceRescue.rescueReason;
    }

    const addBookingToCalendarRescue = rescueAddBookingToCalendarIntent(
      prompt,
      parsed.action,
    );
    if (addBookingToCalendarRescue) {
      parsed.action = addBookingToCalendarRescue.action;
      rescueReason = addBookingToCalendarRescue.rescueReason;
    }

    // e2e-bug.230 / e2e-bug.79 — before confirm_my_booking_details steals
    // "subscription or just pay per visit".
    const explainSubscriptionVsOneTimeRescue =
      rescueExplainSubscriptionVsOneTimeIntent(prompt, parsed.action);
    if (explainSubscriptionVsOneTimeRescue) {
      parsed.action = explainSubscriptionVsOneTimeRescue.action;
      rescueReason = explainSubscriptionVsOneTimeRescue.rescueReason;
      parsed.params = enrichExplainSubscriptionVsOneTimeParamsFromPrompt(
        parsed.params ?? {},
        prompt,
      );
    }

    const checkoutTaxRescue = rescueCheckoutTaxIntent(prompt, parsed.action);
    if (checkoutTaxRescue) {
      parsed.action = checkoutTaxRescue.action;
      rescueReason = checkoutTaxRescue.rescueReason;
      const parsedTax = parseExplainCheckoutTaxFromPrompt(prompt);
      if (parsedTax?.aspect) {
        parsed.params = { ...parsed.params, aspect: parsedTax.aspect };
      }
    }

    const depositForfeitureRescue = rescueExplainDepositForfeitureIntent(
      prompt,
      parsed.action,
    );
    if (depositForfeitureRescue) {
      parsed.action = depositForfeitureRescue.action;
      rescueReason = depositForfeitureRescue.rescueReason;
      const parsedDeposit = parseExplainDepositForfeitureFromPrompt(
        prompt,
        parsed.params ?? {},
      );
      if (parsedDeposit?.bookingId) {
        parsed.params = {
          ...parsed.params,
          bookingId: parsedDeposit.bookingId,
        };
      }
    }

    // e2e-bug.111 — before confirm_my_booking_details (and staff explain_reviews_inbox).
    const leaveVisitReviewRescue = rescueLeaveVisitReviewIntent(
      prompt,
      parsed.action,
    );
    if (leaveVisitReviewRescue) {
      parsed.action = leaveVisitReviewRescue.action;
      rescueReason = leaveVisitReviewRescue.rescueReason;
      parsed.params = enrichLeaveVisitReviewParamsFromPrompt(
        parsed.params ?? {},
        prompt,
      );
    }

    // e2e-bug.106 — manage page URL bookingId+token → guest with_token intents
    // before booking_help / signed-in cancel|reschedule_my_booking steals.
    const manageWithTokenRescue = rescueManageBookingWithTokenIntent(
      prompt,
      parsed.action,
      orchestratedSession,
    );
    if (manageWithTokenRescue) {
      parsed.action = manageWithTokenRescue.action;
      rescueReason = manageWithTokenRescue.rescueReason;
      parsed.params = {
        ...parsed.params,
        ...resolveManageBookingCredentials(
          { ...orchestratedSession, ...(parsed.params ?? {}) },
          prompt,
        ),
      };
      if (manageWithTokenRescue.action === 'reschedule_booking_with_token') {
        parsed.params = enrichRescheduleWithTokenParamsFromPrompt(
          parsed.params ?? {},
          prompt,
          tz,
        );
      }
    }

    const confirmMyBookingDetailsRescue = rescueConfirmMyBookingDetailsIntent(
      prompt,
      parsed.action,
    );
    if (confirmMyBookingDetailsRescue) {
      parsed.action = confirmMyBookingDetailsRescue.action;
      rescueReason = confirmMyBookingDetailsRescue.rescueReason;
    }

    const signInToManageBookingRescue = rescueSignInToManageBookingIntent(
      prompt,
      parsed.action,
    );
    if (signInToManageBookingRescue) {
      parsed.action = signInToManageBookingRescue.action;
      rescueReason = signInToManageBookingRescue.rescueReason;
    }

    const recoverLostManageLinkRescue = rescueRecoverLostManageLinkIntent(
      prompt,
      parsed.action,
    );
    if (recoverLostManageLinkRescue) {
      parsed.action = recoverLostManageLinkRescue.action;
      rescueReason = recoverLostManageLinkRescue.rescueReason;
    }

    const explainWhySignInRescue = rescueExplainWhySignInIntent(
      prompt,
      parsed.action,
    );
    if (explainWhySignInRescue) {
      parsed.action = explainWhySignInRescue.action;
      rescueReason = explainWhySignInRescue.rescueReason;
    }

    const guestCheckoutFieldsRescue = rescueExplainGuestCheckoutFieldsIntent(
      prompt,
      parsed.action,
    );
    if (guestCheckoutFieldsRescue) {
      parsed.action = guestCheckoutFieldsRescue.action;
      rescueReason = guestCheckoutFieldsRescue.rescueReason;
    }

    const bookingHelpRescue = rescueProductGuideIntent(prompt, parsed.action, {
      surface: 'public',
      assistantMode: orchestratedSession?.assistantMode as
        | 'guide'
        | 'act'
        | undefined,
      route: mapPublicBookingGuideRoute(
        mergePublicBookingGuideContext(orchestratedSession),
      ),
      context: orchestratedSession,
    });
    if (bookingHelpRescue.action !== parsed.action) {
      parsed.action = bookingHelpRescue.action;
      rescueReason = bookingHelpRescue.rescueReason ?? 'public_booking_help';
    }

    const discoveryRescue = this.applyBudgetAndRankServiceDiscoveryRescue(
      prompt,
      parsed.action,
    );
    if (discoveryRescue) {
      parsed.action = discoveryRescue.action;
      rescueReason = discoveryRescue.rescueReason;
      if (discoveryRescue.params) {
        parsed.params = { ...parsed.params, ...discoveryRescue.params };
      }
    }

    const amountDueNowRescue = rescueExplainAmountDueNowIntent(
      prompt,
      parsed.action,
    );
    if (amountDueNowRescue) {
      parsed.action = amountDueNowRescue.action;
      rescueReason = amountDueNowRescue.rescueReason;
    }

    const prepaymentRescue = rescueExplainPrepaymentIntent(
      prompt,
      parsed.action,
    );
    if (prepaymentRescue) {
      parsed.action = prepaymentRescue.action;
      rescueReason = prepaymentRescue.rescueReason;
    }

    const soonestRescue = rescueFindSoonestAppointmentIntent(
      prompt,
      parsed.action,
    );
    if (soonestRescue) {
      parsed.action = soonestRescue.action;
      rescueReason = soonestRescue.rescueReason;
    }

    const waitlistRescue = rescueCustomerWaitlistIntent(prompt, parsed.action);
    if (waitlistRescue) {
      parsed.action = waitlistRescue.action;
      rescueReason = waitlistRescue.rescueReason;
    }

    const compareServicesRescue = rescueCompareServicesIntent(
      prompt,
      parsed.action,
    );
    if (compareServicesRescue) {
      parsed.action = compareServicesRescue.action;
      rescueReason = compareServicesRescue.rescueReason;
    }

    const filterNoPrepaymentRescue = rescueFilterServicesNoPrepaymentIntent(
      prompt,
      parsed.action,
    );
    if (filterNoPrepaymentRescue) {
      parsed.action = filterNoPrepaymentRescue.action;
      rescueReason = filterNoPrepaymentRescue.rescueReason;
    }

    const businessHoursLocationRescue =
      rescueExplainBusinessHoursAndLocationIntent(prompt, parsed.action);
    if (businessHoursLocationRescue) {
      parsed.action = businessHoursLocationRescue.action;
      rescueReason = businessHoursLocationRescue.rescueReason;
    }

    const explainProviderAvailabilityRescue =
      rescueExplainProviderAvailabilityIntent(prompt, parsed.action);
    if (explainProviderAvailabilityRescue) {
      parsed.action = explainProviderAvailabilityRescue.action;
      rescueReason = explainProviderAvailabilityRescue.rescueReason;
    }

    const pickProviderRescue = rescuePickProviderForServiceIntent(
      prompt,
      parsed.action,
    );
    if (pickProviderRescue) {
      parsed.action = pickProviderRescue.action;
      rescueReason = pickProviderRescue.rescueReason;
    }

    const anyProviderOptionRescue = rescueExplainAnyProviderOptionIntent(
      prompt,
      parsed.action,
    );
    if (anyProviderOptionRescue) {
      parsed.action = anyProviderOptionRescue.action;
      rescueReason = anyProviderOptionRescue.rescueReason;
    }

    const providerSpecialtyRescue = rescueExplainProviderSpecialtyIntent(
      prompt,
      parsed.action,
    );
    if (providerSpecialtyRescue) {
      parsed.action = providerSpecialtyRescue.action;
      rescueReason = providerSpecialtyRescue.rescueReason;
    }

    const cashCheckoutRescue = rescueCashPaymentCheckoutIntent(
      prompt,
      parsed.action,
    );
    if (cashCheckoutRescue) {
      parsed.action = cashCheckoutRescue.action;
      rescueReason = cashCheckoutRescue.rescueReason;
    }

    // e2e-bug.114 — dated cancel+rebook → reschedule before pay_at_venue (bare "instead").
    // e2e-bug.106 — when manage-link credentials are in session, prefer with_token.
    if (
      parsed.action !== 'reschedule_my_booking' &&
      parsed.action !== 'reschedule_booking_with_token' &&
      parsed.action !== 'reschedule_package_visit_with_token' &&
      isRescheduleMyBookingPrompt(prompt)
    ) {
      if (hasManageLinkCredentialsInSession(orchestratedSession)) {
        parsed.action = 'reschedule_booking_with_token';
        rescueReason = 'reschedule_booking_with_token';
        parsed.params = enrichRescheduleWithTokenParamsFromPrompt(
          {
            ...orchestratedSession,
            ...(parsed.params ?? {}),
          },
          prompt,
          tz,
        );
      } else {
        parsed.action = 'reschedule_my_booking';
        rescueReason = 'reschedule_my';
      }
    }

    const payAtVenueFallbackRescue = rescuePayAtVenueFallbackIntent(
      prompt,
      parsed.action,
    );
    if (payAtVenueFallbackRescue) {
      parsed.action = payAtVenueFallbackRescue.action;
      rescueReason = payAtVenueFallbackRescue.rescueReason;
    }

    const resumeBookingDraftRescue = rescueResumeBookingDraftIntent(
      prompt,
      parsed.action,
    );
    if (resumeBookingDraftRescue) {
      parsed.action = resumeBookingDraftRescue.action;
      rescueReason = resumeBookingDraftRescue.rescueReason;
    }

    const explainSlotNoLongerAvailableRescue =
      rescueExplainSlotNoLongerAvailableIntent(prompt, parsed.action);
    if (explainSlotNoLongerAvailableRescue) {
      parsed.action = explainSlotNoLongerAvailableRescue.action;
      rescueReason = explainSlotNoLongerAvailableRescue.rescueReason;
    }

    const speakAssistantReplyRescue = rescueSpeakAssistantReplyIntent(
      prompt,
      parsed.action,
    );
    if (speakAssistantReplyRescue) {
      parsed.action = speakAssistantReplyRescue.action;
      rescueReason = speakAssistantReplyRescue.rescueReason;
    }

    const giveAiFeedbackRescue = rescueGiveAiFeedbackIntent(
      prompt,
      parsed.action,
    );
    if (giveAiFeedbackRescue) {
      parsed.action = giveAiFeedbackRescue.action;
      rescueReason = giveAiFeedbackRescue.rescueReason;
    }

    const explainRtlLayoutRescue = rescueExplainRtlLayoutIntent(
      prompt,
      parsed.action,
    );
    if (explainRtlLayoutRescue) {
      parsed.action = explainRtlLayoutRescue.action;
      rescueReason = explainRtlLayoutRescue.rescueReason;
    }

    const explainVoiceInputRescue = rescueExplainVoiceInputIntent(
      prompt,
      parsed.action,
    );
    if (explainVoiceInputRescue) {
      parsed.action = explainVoiceInputRescue.action;
      rescueReason = explainVoiceInputRescue.rescueReason;
    }

    const diagnoseCheckoutFailureRescue =
      rescueConsumerDiagnoseStripeCheckoutFailureIntent(prompt, parsed.action);
    if (diagnoseCheckoutFailureRescue) {
      parsed.action = diagnoseCheckoutFailureRescue.action;
      rescueReason = diagnoseCheckoutFailureRescue.rescueReason;
    }

    const payOnlineRescue = rescuePayOnlineCheckoutIntent(
      prompt,
      parsed.action,
    );
    if (payOnlineRescue) {
      parsed.action = payOnlineRescue.action;
      rescueReason = payOnlineRescue.rescueReason;
    }

    // e2e-bug.124 — purchase phrasing must not stay on apply_gift_card_code
    // even when a stale bookingStep=checkout biased the classifier.
    const buyGiftCardForSomeoneRescue = rescueBuyGiftCardForSomeoneIntent(
      prompt,
      parsed.action,
    );
    if (buyGiftCardForSomeoneRescue) {
      parsed.action = buyGiftCardForSomeoneRescue.action;
      rescueReason = buyGiftCardForSomeoneRescue.rescueReason;
      parsed.params = enrichBuyGiftCardForSomeoneParamsFromPrompt(
        parsed.params ?? {},
        prompt,
      );
    }

    const multiServiceRescue = rescueMultiServiceCustomerPublicIntent(
      prompt,
      parsed.action,
    );
    if (multiServiceRescue) {
      parsed.action = multiServiceRescue.action;
      rescueReason = multiServiceRescue.rescueReason;
    }

    // e2e-bug.232 — before apply_promo_code_checkout steals redeem/apply referral.
    const claimReferralRescue = rescueClaimReferralCodeIntent(
      prompt,
      parsed.action,
    );
    if (claimReferralRescue) {
      parsed.action = claimReferralRescue.action;
      rescueReason = claimReferralRescue.rescueReason;
      parsed.params = enrichClaimReferralCodeParamsFromPrompt(
        prompt,
        parsed.params ?? {},
      );
    }

    const applyPromoCheckoutRescue = rescueApplyPromoCodeCheckoutIntent(
      prompt,
      parsed.action,
    );
    if (applyPromoCheckoutRescue) {
      parsed.action = applyPromoCheckoutRescue.action;
      rescueReason = applyPromoCheckoutRescue.rescueReason;
    }

    const promoCodeHelpRescue = rescuePromoCodeHelpCustomerPublicIntent(
      prompt,
      parsed.action,
    );
    if (promoCodeHelpRescue) {
      parsed.action = promoCodeHelpRescue.action;
      rescueReason = promoCodeHelpRescue.rescueReason;
    }

    const howToDownloadAppRescue = rescueHowToDownloadAppCustomerPublicIntent(
      prompt,
      parsed.action,
    );
    if (howToDownloadAppRescue) {
      parsed.action = howToDownloadAppRescue.action;
      rescueReason = howToDownloadAppRescue.rescueReason;
    }

    const tourCustomerPublicRescue = rescueTourCustomerPublicIntent(
      prompt,
      parsed.action,
    );
    if (tourCustomerPublicRescue) {
      parsed.action = tourCustomerPublicRescue.action;
      rescueReason = tourCustomerPublicRescue.rescueReason;
    }

    const checkoutRecommendationsRescue =
      rescueCheckoutRecommendationsCustomerPublicIntent(prompt, parsed.action);
    if (checkoutRecommendationsRescue) {
      parsed.action = checkoutRecommendationsRescue.action;
      rescueReason = checkoutRecommendationsRescue.rescueReason;
    }

    if (shouldBlockUnknownFromHandlerSwitch(parsed.action)) {
      return this.applyPostFailureGuideFallback(
        commandResultToPublicAssistantResult(
          buildUnknownIntentClarifyResult({
            surface: 'public',
            prompt,
            params: parsed.params,
            reasoning: parsed.reasoning,
            confidence:
              typeof parsed.confidence === 'number' ? parsed.confidence : 0,
            trace: understood.trace,
            locale,
          }),
        ),
        orchestratedSession,
        locale,
        prompt,
      );
    }

    const gateDenied = this.platform.gatePublicAction(parsed.action, locale);
    if (gateDenied) {
      return {
        success: false,
        action: gateDenied.action,
        summary: gateDenied.summary,
      };
    }

    const compoundDecomposition = isCompoundPrompt(prompt)
      ? decomposeDeterministicForSurface('public', prompt)
      : null;
    recordMisrouteTelemetry(this.aiEvents, business.id, {
      surface: 'public',
      prompt,
      classifierAction,
      rescuedAction: parsed.action,
      rescueReason,
      classifierConfidence,
      compoundStepCount: compoundDecomposition?.steps.length ?? 1,
    });

    parsed.params = this.mergeSessionContext(
      parsed.params,
      orchestratedSession,
      parsed.action,
    );
    parsed.params = enrichPublicAssistantParamsFromPrompt(
      prompt,
      parsed.params ?? {},
      services.map((s) => ({ id: s.id, name: s.name })),
      parsed.action,
    );
    if (parsed.action === 'book_appointment') {
      parsed.params = enrichBookAppointmentParamsFromPrompt(
        prompt,
        parsed.params ?? {},
      );
    }
    if (session?.history?.length && parsed.action === 'speak_assistant_reply') {
      parsed.params = {
        ...parsed.params,
        conversationHistory: session.history,
      };
    }
    if (session?.history?.length && parsed.action === 'give_ai_feedback') {
      parsed.params = {
        ...parsed.params,
        conversationHistory: session.history,
      };
    }
    this.normalizeDateParams(parsed.params, todayKey, tz);

    this.logger.log(
      `Public assistant action="${parsed.action}" — ${parsed.reasoning}`,
    );

    if (isAppGuideIntent(parsed.action)) {
      return commandResultToPublicAssistantResult(
        await this.dispatchPublicAppGuideIntent(
          business.id,
          prompt,
          parsed.action,
          locale,
          orchestratedSession,
          parsed.params,
        ),
      );
    }

    if (isEmptyStateGuideIntent(parsed.action)) {
      return commandResultToPublicAssistantResult(
        await this.dispatchPublicEmptyStateGuideIntent(
          business.id,
          prompt,
          parsed.action,
          locale,
          orchestratedSession,
          parsed.params,
        ),
      );
    }

    let result: PublicAssistantResult;

    switch (parsed.action) {
      case 'list_providers':
        result = await this.handleListProviders(slug, parsed.params, locale);
        break;
      case 'list_services':
        result = await this.handleListServices(
          slug,
          enrichListServicesParamsFromPrompt(prompt, parsed.params ?? {}),
          employees,
          locale,
          prompt,
        );
        break;
      case 'find_services_under_budget':
        result = await this.handleFindServicesUnderBudget(
          slug,
          enrichFindServicesUnderBudgetParamsFromPrompt(
            parsed.params ?? {},
            prompt,
          ),
          employees,
          locale,
          prompt,
        );
        break;
      case 'find_evening_weekend_slots':
        result = await this.handleFindEveningWeekendSlots(
          slug,
          enrichFindEveningWeekendSlotsParamsFromPrompt(
            parsed.params ?? {},
            prompt,
          ),
          employees,
          services,
          locale,
          tz,
          prompt,
        );
        break;
      case 'check_availability':
        result = await this.handleCheckAvailability(
          slug,
          parsed.params,
          employees,
          services,
          locale,
          tz,
        );
        break;
      case 'explain_provider_availability':
        result = await this.handleExplainProviderAvailability(
          slug,
          parsed.params ?? {},
          employees,
          services,
          locale,
          tz,
          prompt,
        );
        break;
      case 'recommend_specialists':
        result = await this.handleRecommendSpecialists(
          slug,
          parsed.params,
          employees,
          services,
          locale,
          tz,
          prompt,
        );
        break;
      case 'business_info':
        result = this.handleBusinessInfo(business);
        break;
      case 'list_public_promotions':
        result = await this.handleListPublicPromotions(slug);
        break;
      case 'book_appointment':
        result = await this.handleBookAppointment(
          slug,
          parsed.params,
          employees,
          services,
          locale,
          prompt,
        );
        break;
      case 'booking_help':
        result = await this.handleBookingHelp(
          business.id,
          prompt,
          locale,
          orchestratedSession,
        );
        break;
      case 'explain_checkout_currency':
        result = await this.handleExplainCheckoutCurrency(business.id);
        break;
      case 'explain_checkout_tax':
        result = await this.handleExplainCheckoutTax(
          business.id,
          parsed.params ?? {},
          prompt,
        );
        break;
      case 'explain_deposit_forfeiture':
        result = await this.handleExplainDepositForfeiture(
          business.id,
          parsed.params ?? {},
          prompt,
        );
        break;
      case 'explain_why_stripe_required':
        result = await this.handleExplainWhyStripeRequired(
          business.id,
          parsed.params ?? {},
          prompt,
          orchestratedSession,
        );
        break;
      case 'diagnose_stripe_checkout_failure':
        result = await this.handleDiagnoseStripeCheckoutFailure(
          business.id,
          parsed.params ?? {},
          prompt,
        );
        break;
      case 'pay_at_venue_fallback':
        result = await this.handlePayAtVenueFallback(
          business.id,
          parsed.params ?? {},
          prompt,
        );
        break;
      case 'resume_booking_draft':
        result = await this.handleResumeBookingDraft(
          business.id,
          parsed.params ?? {},
          prompt,
        );
        break;
      case 'explain_slot_no_longer_available':
        result = await this.handleExplainSlotNoLongerAvailable(
          business.id,
          slug,
          parsed.params ?? {},
          prompt,
          employees,
          services,
          locale,
          tz,
        );
        break;
      case 'explain_voice_input':
        result = await this.handleExplainVoiceInput(
          business.id,
          parsed.params ?? {},
          prompt,
        );
        break;
      case 'speak_assistant_reply':
        result = await this.handleSpeakAssistantReply(
          business.id,
          parsed.params ?? {},
          prompt,
        );
        break;
      case 'give_ai_feedback':
        result = await this.handleGiveAiFeedback(
          business.id,
          parsed.params ?? {},
          prompt,
          locale,
        );
        break;
      case 'explain_rtl_layout':
        result = await this.handleExplainRtlLayout(
          business.id,
          parsed.params ?? {},
          prompt,
          locale,
        );
        break;
      case 'explain_checkout_total':
        result = await this.handleExplainCheckoutTotal(
          business.id,
          parsed.params ?? {},
          prompt,
          orchestratedSession,
        );
        break;
      case 'explain_amount_due_now':
        result = await this.handleExplainAmountDueNow(
          business.id,
          parsed.params ?? {},
          prompt,
          orchestratedSession,
        );
        break;
      case 'explain_service_price':
        result = await this.handleExplainServicePrice(
          business.id,
          parsed.params ?? {},
          prompt,
          orchestratedSession,
        );
        break;
      case 'explain_payment_options_for_service':
        result = await this.handleExplainPaymentOptionsForService(
          business.id,
          parsed.params ?? {},
          prompt,
          orchestratedSession,
        );
        break;
      case 'find_soonest_appointment':
        result = await this.handleFindSoonestAppointment(
          business.id,
          parsed.params ?? {},
          prompt,
        );
        break;
      case 'join_waitlist':
        result = await this.handleJoinWaitlist(
          business.id,
          {
            ...parsed.params,
            sessionCustomerId:
              orchestratedSession.customerId ??
              parsed.params?.sessionCustomerId,
            locale,
          },
          prompt,
        );
        break;
      case 'check_waitlist_status':
        result = await this.handleCheckWaitlistStatus(
          business.id,
          {
            ...parsed.params,
            sessionCustomerId:
              orchestratedSession.customerId ??
              parsed.params?.sessionCustomerId,
            locale,
          },
          prompt,
        );
        break;
      case 'compare_services':
        result = await this.handleCompareServices(
          business.id,
          parsed.params ?? {},
          prompt,
        );
        break;
      case 'explain_package_savings':
        result = await this.handleExplainPackageSavings(
          business.id,
          parsed.params ?? {},
          prompt,
        );
        break;
      case 'explain_subscription_vs_one_time':
        result = await this.handleExplainSubscriptionVsOneTime(
          business.id,
          parsed.params ?? {},
          prompt,
        );
        break;
      case 'filter_services_no_prepayment':
        result = await this.handleFilterServicesNoPrepayment(
          business.id,
          parsed.params ?? {},
          prompt,
        );
        break;
      case 'explain_business_hours_and_location':
        result = await this.handleExplainBusinessHoursAndLocation(
          business.id,
          parsed.params ?? {},
          prompt,
        );
        break;
      case 'explain_salon_profile':
        result = await this.handleExplainSalonProfile(
          business.id,
          parsed.params ?? {},
          prompt,
        );
        break;
      case 'get_directions_to_salon':
        result = await this.handleGetDirectionsToSalon(
          business.id,
          parsed.params ?? {},
          prompt,
        );
        break;
      case 'explain_provider_specialty':
        result = await this.handleExplainProviderSpecialty(
          business.id,
          parsed.params ?? {},
          prompt,
        );
        break;
      case 'explain_any_provider_option':
        result = await this.handleExplainAnyProviderOption(
          business.id,
          // e2e-bug.259 — thread locale so clarify/summary are not English-only.
          { ...(parsed.params ?? {}), locale },
          prompt,
        );
        break;
      case 'pick_provider_for_service':
        result = await this.handlePickProviderForService(
          business.id,
          { ...(parsed.params ?? {}), slug },
          prompt,
        );
        break;
      case 'switch_provider_same_time':
        result = await this.handleSwitchProviderSameTime(
          business.id,
          { ...(parsed.params ?? {}), slug },
          prompt,
        );
        break;
      case 'explain_professional_profile':
        result = await this.handleExplainProfessionalProfile(
          business.id,
          { ...(parsed.params ?? {}), slug },
          prompt,
        );
        break;
      case 'list_provider_reviews':
        result = await this.handleListProviderReviews(business.id, {
          ...(parsed.params ?? {}),
          slug,
        });
        break;
      case 'submit_provider_review':
        result = await this.handleSubmitProviderReview(business.id, {
          ...(parsed.params ?? {}),
          slug,
        });
        break;
      case 'choose_payment_method':
        result = await this.handleChoosePaymentMethod(
          business.id,
          parsed.params ?? {},
          prompt,
        );
        break;
      case 'pay_cash_at_visit':
        result = await this.handlePayCashAtVisit(
          business.id,
          {
            ...orchestratedSession,
            ...(parsed.params ?? {}),
          },
          prompt,
        );
        break;
      case 'pay_online':
        result = await this.handlePayOnline(
          business.id,
          parsed.params ?? {},
          prompt,
          orchestratedSession,
        );
        break;
      case 'get_booking_quote':
        result = await this.handleGetBookingQuote(business.id, {
          ...orchestratedSession,
          ...(parsed.params ?? {}),
        });
        break;
      case 'get_package_quote':
        result = await this.handleGetPackageQuote(business.id, {
          ...(parsed.params ?? {}),
          packageId: parsed.params?.packageId ?? orchestratedSession.packageId,
          packageName:
            parsed.params?.packageName ?? orchestratedSession.packageName,
        });
        break;
      case 'get_multi_service_quote':
        result = await this.handleGetMultiServiceQuote(
          business.id,
          this.mergeMultiServiceSessionParams(
            parsed.params ?? {},
            orchestratedSession,
            prompt,
          ),
        );
        break;
      case 'confirm_stripe_payment':
        result = await this.handleConfirmStripePayment(business.id, {
          ...(parsed.params ?? {}),
          sessionId: parsed.params?.sessionId ?? orchestratedSession.sessionId,
        });
        break;
      case 'book_multi_service':
        result = await this.handleBookMultiService(
          business.id,
          parsed.params ?? {},
          prompt,
          orchestratedSession,
        );
        break;
      case 'check_multi_service_availability':
        result = await this.handleCheckMultiServiceAvailability(
          business.id,
          parsed.params ?? {},
          prompt,
          orchestratedSession,
        );
        break;
      case 'add_services_to_cart':
        result = await this.handleAddServicesToCart(
          business.id,
          parsed.params ?? {},
          prompt,
          orchestratedSession,
        );
        break;
      case 'preview_multi_service_cart':
        result = await this.handlePreviewMultiServiceCart(
          business.id,
          parsed.params ?? {},
          prompt,
          orchestratedSession,
        );
        break;
      case 'suggest_package_block':
        result = await this.handleSuggestPackageBlock(
          business.id,
          parsed.params ?? {},
          prompt,
          orchestratedSession,
        );
        break;
      case 'apply_promo_code_checkout':
        result = await this.handleApplyPromoCodeCheckout(
          business.id,
          parsed.params ?? {},
          prompt,
        );
        break;
      case 'promo_code_help':
        result = await this.handlePromoCodeHelp(
          business.id,
          parsed.params ?? {},
          prompt,
        );
        break;
      case 'how_to_download_app':
        result = await this.handleHowToDownloadApp(business.id);
        break;
      case 'explain_stripe_checkout_currency':
        result = await this.handleExplainStripeCheckoutCurrency(business.id);
        break;
      case 'explain_package_currency':
        result = await this.handleExplainPackageCurrency(business.id);
        break;
      case 'explain_booking_languages':
        result = await this.handleExplainBookingLanguages(business.id, locale);
        break;
      case 'explain_booking_date_format':
        result = await this.handleExplainBookingDateFormat(business.id);
        break;
      case 'explain_package_display_name':
        result = await this.handleExplainPackageDisplayName(
          business.id,
          parsed.params ?? {},
          prompt,
          locale,
        );
        break;
      case 'explain_tour_booking':
        result = await this.handleExplainTourBooking(
          business.id,
          parsed.params ?? {},
          prompt,
        );
        break;
      case 'explain_tour_day_slots':
        result = await this.handleExplainTourDaySlots(
          business.id,
          parsed.params ?? {},
          prompt,
        );
        break;
      case 'explain_tour_meeting_point':
        result = await this.handleExplainTourMeetingPoint(
          business.id,
          parsed.params ?? {},
          prompt,
        );
        break;
      case 'diagnose_tour_capacity':
        result = await this.handleDiagnoseTourCapacity(
          business.id,
          parsed.params ?? {},
          prompt,
        );
        break;
      case 'explain_checkout_recommendations':
        result = await this.handleExplainCheckoutRecommendations(
          business.id,
          parsed.params ?? {},
          prompt,
        );
        break;
      case 'explain_data_rights':
        result = await this.handleExplainDataRights(business.id, prompt);
        break;
      case 'explain_clinic_booking':
        result = await this.handleExplainClinicBooking(
          business.id,
          parsed.params ?? {},
          prompt,
        );
        break;
      case 'explain_lab_prep':
        result = await this.handleExplainLabPrep(
          business.id,
          parsed.params ?? {},
          prompt,
        );
        break;
      case 'explain_clinic_booking_fields':
        result = await this.handleExplainClinicBookingFields(
          business.id,
          parsed.params ?? {},
          prompt,
        );
        break;
      case 'explain_public_intake_form':
        result = await this.handleExplainPublicIntakeForm(
          business.id,
          parsed.params ?? {},
          prompt,
        );
        break;
      case 'complete_intake_and_book':
        result = await this.handleCompleteIntakeAndBook(
          business.id,
          parsed.params ?? {},
          prompt,
        );
        break;
      case 'explain_guest_checkout_fields':
        result = await this.handleExplainGuestCheckoutFields(
          business.id,
          parsed.params ?? {},
          prompt,
        );
        break;
      case 'explain_why_sign_in':
        result = await this.handleExplainWhySignIn(
          business.id,
          parsed.params ?? {},
          prompt,
        );
        break;
      case 'explain_manage_booking_page':
        result = await this.handleExplainManageBookingPage(
          business.id,
          parsed.params ?? {},
          prompt,
        );
        break;
      case 'sign_in_to_manage_booking':
        result = await this.handleSignInToManageBooking(
          business.id,
          parsed.params ?? {},
          prompt,
        );
        break;
      case 'recover_lost_manage_link':
        result = await this.handleRecoverLostManageLink(
          business.id,
          parsed.params ?? {},
          prompt,
        );
        break;
      case 'fix_checkout_validation_error':
        result = await this.handleFixCheckoutValidationError(
          business.id,
          parsed.params ?? {},
          prompt,
        );
        break;
      case 'confirm_my_booking_details':
        result = await this.handleConfirmMyBookingDetails(
          business.id,
          {
            ...parsed.params,
            bookingId:
              orchestratedSession.bookingId ?? parsed.params?.bookingId,
            manageToken:
              orchestratedSession.manageToken ?? parsed.params?.manageToken,
            sessionCustomerId: orchestratedSession.customerId,
            locale,
          },
          prompt,
        );
        break;
      case 'leave_visit_review':
        result = await this.handleLeaveVisitReview(
          business.id,
          {
            ...parsed.params,
            bookingId:
              orchestratedSession.bookingId ?? parsed.params?.bookingId,
            sessionCustomerId: orchestratedSession.customerId,
            locale,
          },
          prompt,
        );
        break;
      case 'explain_manage_booking_context':
        result = await this.handleExplainManageBookingContext(
          business.id,
          {
            ...parsed.params,
            bookingId:
              orchestratedSession.bookingId ?? parsed.params?.bookingId,
            manageToken:
              orchestratedSession.manageToken ?? parsed.params?.manageToken,
            locale,
          },
          prompt,
        );
        break;
      case 'cancel_booking_with_token':
        result = await this.handleCancelBookingWithToken(
          business.id,
          {
            ...parsed.params,
            bookingId:
              orchestratedSession.bookingId ?? parsed.params?.bookingId,
            manageToken:
              orchestratedSession.manageToken ?? parsed.params?.manageToken,
            locale,
          },
          prompt,
        );
        break;
      case 'reschedule_booking_with_token':
        result = await this.handleRescheduleBookingWithToken(
          business.id,
          {
            ...parsed.params,
            bookingId:
              orchestratedSession.bookingId ?? parsed.params?.bookingId,
            manageToken:
              orchestratedSession.manageToken ?? parsed.params?.manageToken,
            locale,
          },
          prompt,
        );
        break;
      case 'cancel_package_visit_with_token':
        result = await this.handleCancelPackageVisitWithToken(
          business.id,
          {
            ...parsed.params,
            bookingId:
              orchestratedSession.bookingId ?? parsed.params?.bookingId,
            manageToken:
              orchestratedSession.manageToken ?? parsed.params?.manageToken,
            locale,
          },
          prompt,
        );
        break;
      case 'reschedule_package_visit_with_token':
        result = await this.handleReschedulePackageVisitWithToken(
          business.id,
          {
            ...parsed.params,
            bookingId:
              orchestratedSession.bookingId ?? parsed.params?.bookingId,
            manageToken:
              orchestratedSession.manageToken ?? parsed.params?.manageToken,
            locale,
          },
          prompt,
        );
        break;
      case 'reschedule_my_booking':
        result = await this.handleRescheduleMyBooking(
          business.id,
          {
            ...parsed.params,
            bookingId:
              orchestratedSession.bookingId ?? parsed.params?.bookingId,
            sessionCustomerId:
              orchestratedSession.customerId ??
              parsed.params?.sessionCustomerId,
            locale,
          },
          prompt,
        );
        break;
      case 'cancel_my_booking':
        result = await this.handleCancelMyBooking(
          business.id,
          {
            ...parsed.params,
            bookingId:
              orchestratedSession.bookingId ?? parsed.params?.bookingId,
            sessionCustomerId:
              orchestratedSession.customerId ??
              parsed.params?.sessionCustomerId,
            locale,
          },
          prompt,
        );
        break;
      case 'add_booking_to_calendar':
        result = await this.handleAddBookingToCalendar(
          business.id,
          {
            ...parsed.params,
            bookingId:
              orchestratedSession.bookingId ?? parsed.params?.bookingId,
            sessionCustomerId:
              orchestratedSession.customerId ??
              parsed.params?.sessionCustomerId,
            locale,
          },
          prompt,
        );
        break;
      case 'book_another_service':
        result = await this.handleBookAnotherService(
          business.id,
          {
            ...parsed.params,
            bookingId:
              orchestratedSession.bookingId ?? parsed.params?.bookingId,
            sessionCustomerId:
              orchestratedSession.customerId ??
              parsed.params?.sessionCustomerId,
            locale,
          },
          prompt,
        );
        break;
      case 'explain_preparation_notes':
        result = await this.handleExplainPreparationNotes(
          business.id,
          {
            ...parsed.params,
            bookingId:
              orchestratedSession.bookingId ?? parsed.params?.bookingId,
            sessionCustomerId:
              orchestratedSession.customerId ??
              parsed.params?.sessionCustomerId,
            locale,
          },
          prompt,
        );
        break;
      case 'list_my_test_results':
        result = await this.handleListMyTestResults(
          business.id,
          {
            ...parsed.params,
            sessionCustomerId:
              orchestratedSession.customerId ??
              parsed.params?.sessionCustomerId,
          },
          prompt,
        );
        break;
      case 'explain_result_status':
        result = await this.handleExplainResultStatus(
          business.id,
          {
            ...parsed.params,
            sessionCustomerId:
              orchestratedSession.customerId ??
              parsed.params?.sessionCustomerId,
            locale,
          },
          prompt,
        );
        break;
      case 'list_my_lab_booking_requests':
        result = await this.handleListMyLabBookingRequests(
          business.id,
          {
            ...parsed.params,
            sessionCustomerId:
              orchestratedSession.customerId ??
              parsed.params?.sessionCustomerId,
          },
          prompt,
        );
        break;
      case 'book_lab_collection':
        result = await this.handleBookLabCollection(
          business.id,
          {
            ...parsed.params,
            sessionCustomerId:
              orchestratedSession.customerId ??
              parsed.params?.sessionCustomerId,
          },
          prompt,
        );
        break;
      default:
        result = {
          success: false,
          action: 'unknown',
          summary: t(locale, 'assistant.helpPrompt'),
        };
    }

    const final = this.attachSession(
      result,
      parsed.params,
      employees,
      services,
      locale,
    );
    if (options?.recordMetrics !== false) {
      void this.platform.recordCommandOutcome({
        businessId: business.id,
        result: final as unknown as Record<string, unknown>,
        surface: 'public',
        locationId:
          typeof orchestratedSession.locationId === 'string'
            ? orchestratedSession.locationId
            : undefined,
      });
    }
    return this.applyPostFailureGuideFallback(
      final,
      orchestratedSession,
      locale,
      prompt,
    );
  }

  private applyPostFailureGuideFallback(
    result: PublicAssistantResult,
    session?: Record<string, unknown>,
    locale?: AppLocale,
    prompt?: string,
  ): PublicAssistantResult {
    const asCommand: CommandResult = {
      success: result.success,
      action: result.action,
      summary: result.summary,
      details: {
        ...(result.details ?? {}),
        needsClarification: result.details?.needsClarification,
        sessionContext: result.sessionContext,
      },
      guide: result.guide,
    };
    const enriched = appendPostFailureGuideFallback(
      asCommand,
      buildPostFailureGuideFallbackInput(
        mergePublicBookingGuideContext({ ...session, locale }),
        'public',
        locale,
        prompt,
      ),
    );
    if (enriched === asCommand) return result;
    const enrichedDetails = { ...(enriched.details ?? {}) };
    // e2e-bug.91 — keep client sessionContext from attachSession; never re-emit
    // orchestration internals that lived on the inbound session object.
    delete enrichedDetails.sessionContext;
    return {
      ...result,
      summary: enriched.summary,
      guide: enriched.guide ?? result.guide,
      details: {
        ...(result.details ?? {}),
        ...enrichedDetails,
      },
    };
  }

  private async handleListProviders(
    slug: string,
    params: any,
    locale: AppLocale,
  ): Promise<PublicAssistantResult> {
    const { providers } = await this.publicBookingService.getProviders(
      slug,
      params.date,
      locale,
    );
    if (providers.length === 0) {
      return {
        success: true,
        action: 'list_providers',
        summary: t(locale, 'assistant.noSpecialists'),
      };
    }

    const lines = providers.map((p) => {
      const title = p.role ? ` — ${p.role}` : '';
      const slots = p.slots
        .slice(0, 4)
        .map((s) => formatTimeDisplay(s.startTime))
        .join(', ');
      const slotText = slots
        ? p.nearestDateLabel
          ? `${t(locale, 'assistant.nextOn')} ${p.nearestDateLabel}: ${slots}${p.slots.length > 4 ? '…' : ''}`
          : `${t(locale, 'assistant.open')}: ${slots}`
        : t(locale, 'assistant.noUpcomingSlots');
      return `• ${p.name}${title} — ${slotText}`;
    });

    return {
      success: true,
      action: 'list_providers',
      summary: [t(locale, 'assistant.specialistsHeader'), '', ...lines].join(
        '\n',
      ),
      navigate: { path: 'professionals', query: {} },
    };
  }

  private async handleListPublicPromotions(
    slug: string,
  ): Promise<PublicAssistantResult> {
    const { promotions } =
      await this.publicBookingService.getPublicPromotions(slug);
    return {
      success: true,
      action: 'list_public_promotions',
      summary: promotions.length
        ? `${promotions.length} active promotion(s) right now.`
        : 'No active promotions right now.',
      details: { promotions },
    };
  }

  private async handleListServices(
    slug: string,
    params: any,
    employees: Employee[],
    locale: AppLocale,
    prompt = '',
  ): Promise<PublicAssistantResult> {
    // tech-debt D5 — a tie filters the catalog to the wrong namesake *and*
    // names them in the summary ("No services listed for {name}"), so the guest
    // is told about a specialist they never asked for.
    const providerVerdict = params.employeeName
      ? this.resolveProviderVerdict(employees, params.employeeName)
      : null;
    if (providerVerdict && providerVerdict.ambiguous.length > 1) {
      return {
        success: false,
        action: 'list_services',
        summary: t(locale, 'assistant.providerAmbiguous', {
          name: params.employeeName,
          options: providerVerdict.ambiguous.map((e) => e.name).join(', '),
        }),
        details: {
          candidates: providerVerdict.ambiguous.map((e) => ({
            id: e.id,
            name: e.name,
          })),
        },
      };
    }
    const employee = providerVerdict?.match;

    const { services: catalog } = await this.publicBookingService.getServices(
      slug,
      employee?.id,
    );
    if (catalog.length === 0) {
      return {
        success: true,
        action: 'list_services',
        summary: employee
          ? `No services listed for ${employee.name} right now.`
          : 'No services are available for online booking at the moment.',
      };
    }

    const hasServiceFilter = !!(
      params.serviceCategory ||
      params.serviceName ||
      (Array.isArray(params.serviceNames) && params.serviceNames.length)
    );
    const matched = hasServiceFilter
      ? resolveServicesFromCatalogParams(catalog, params)
      : catalog;

    if (hasServiceFilter && matched.length === 0) {
      return {
        success: false,
        action: 'list_services',
        summary: t(locale, 'assistant.availabilityServiceNotFound', {
          service: params.serviceCategory ?? params.serviceName,
          available: catalog.map((s) => s.name).join(', '),
        }),
      };
    }

    const paymentFilter = parseListServicesPaymentFilterFromPrompt(
      prompt,
      params,
    );
    let paymentMatched = matched;
    if (hasListServicesPaymentFilter(paymentFilter)) {
      paymentMatched = filterServicesByListServicesPaymentPolicy(
        matched,
        paymentFilter,
      );
      if (paymentMatched.length === 0) {
        return {
          success: false,
          action: 'list_services',
          summary: `No ${buildListServicesPaymentFilterHeader(paymentFilter).toLowerCase()} right now.`,
        };
      }
    }

    const catalogRows = paymentMatched.map((service) => ({
      id: service.id,
      name: service.name,
      price: service.price,
      currency: service.currency,
      durationMinutes: service.durationMinutes,
      bookingCount: service.bookingCount90d ?? 0,
      ...(service.category?.name
        ? { serviceCategory: service.category.name }
        : {}),
      ...(service.isFeatured ? { isFeatured: true } : {}),
      ...(service.serviceTier ? { serviceTier: service.serviceTier } : {}),
    }));

    const serviceRank = resolveServiceRankParam(params.serviceRank);
    const serviceTier = resolveServiceTierParam(params.serviceTier);
    const serviceQuery = params.serviceCategory ?? params.serviceName;

    if (isMidRangeServiceListPrompt(prompt) && !serviceRank) {
      const midRangeLimit = resolveListServicesRankLimitFromPrompt(
        prompt,
        params,
      );
      const composed = composePublicListServicesMidRangeResponse({
        matchedServices: catalogRows,
        serviceCategory: params.serviceCategory ?? params.serviceName ?? null,
        limit: midRangeLimit,
        header: employee ? `Services with ${employee.name}:` : undefined,
      });

      return {
        success: composed.success,
        action: 'list_services',
        summary: composed.summary,
        navigate: composed.navigate,
        sessionContext: {
          serviceId:
            composed.services.length === 1 ? composed.services[0].id : null,
          serviceName:
            composed.services.length === 1 ? composed.services[0].name : null,
        },
        details:
          composed.services.length === 1
            ? { serviceId: composed.services[0].id }
            : undefined,
      };
    }

    if (serviceRank || serviceTier) {
      const rankLimit = resolveListServicesRankLimitFromPrompt(prompt, params);
      const composed = composePublicListServicesRankResponse({
        matchedServices: catalogRows,
        serviceRank: serviceRank ?? undefined,
        serviceTier,
        limit: rankLimit,
        maxPrice: params.maxPrice,
        serviceCategory: params.serviceCategory ?? params.serviceName ?? null,
        allCatalogServices: catalogRows,
        header: employee ? `Services with ${employee.name}:` : undefined,
      });

      return {
        success: composed.success,
        action: 'list_services',
        summary: composed.summary,
        navigate: composed.navigate,
        sessionContext: {
          serviceId:
            composed.services.length === 1 ? composed.services[0].id : null,
          serviceName:
            composed.services.length === 1 ? composed.services[0].name : null,
          maxPrice: params.maxPrice != null ? String(params.maxPrice) : null,
          rankedServiceIds:
            composed.services.length > 1
              ? JSON.stringify(composed.services.map((service) => service.id))
              : null,
        },
        details:
          composed.services.length === 1
            ? { serviceId: composed.services[0].id }
            : undefined,
      };
    }

    const paymentFilterHeader = hasListServicesPaymentFilter(paymentFilter)
      ? `${buildListServicesPaymentFilterHeader(paymentFilter)}:`
      : undefined;

    const header =
      paymentFilterHeader ??
      (employee
        ? `Services with ${employee.name}:`
        : serviceQuery
          ? // e2e-bug.322 — normalize raw classifier tokens (e.g. "trim") to
            // their catalog family label ("haircut") instead of echoing the
            // literal prompt word back in the header.
            `Our ${normalizeAvailabilityServiceCategory(stripServiceRoleNoise(String(serviceQuery)))} service types:`
          : params.maxTotalPrice != null
            ? `Service combos within your budget:`
            : params.maxPrice != null
              ? `Services within your budget:`
              : 'Our service types:');

    const composed = composePublicListServicesBudgetResponse({
      matchedServices: catalogRows,
      maxPrice: params.maxPrice,
      minPrice: params.minPrice,
      preferShortDuration: params.preferShortDuration,
      minDurationMinutes: params.minDurationMinutes,
      maxTotalPrice: params.maxTotalPrice,
      serviceCount: params.serviceCount,
      header,
      valueOrPremiumBrowse: isValueOrPremiumBudgetListPrompt(prompt),
    });

    return {
      success: composed.success,
      action: 'list_services',
      summary: composed.summary,
      navigate: composed.navigate,
      sessionContext: {
        serviceId:
          composed.services.length === 1 ? composed.services[0].id : null,
        serviceName:
          composed.services.length === 1 ? composed.services[0].name : null,
        maxPrice: params.maxPrice != null ? String(params.maxPrice) : null,
        maxTotalPrice:
          params.maxTotalPrice != null ? String(params.maxTotalPrice) : null,
        serviceCount:
          params.serviceCount != null ? String(params.serviceCount) : null,
      },
      details:
        composed.services.length === 1
          ? { serviceId: composed.services[0].id }
          : undefined,
    };
  }

  private async handleFindServicesUnderBudget(
    slug: string,
    params: any,
    employees: Employee[],
    locale: AppLocale,
    prompt = '',
  ): Promise<PublicAssistantResult> {
    const result = await this.handleListServices(
      slug,
      params,
      employees,
      locale,
      prompt,
    );
    return {
      ...result,
      action: 'find_services_under_budget',
    };
  }

  private async handleFindEveningWeekendSlots(
    slug: string,
    params: any,
    employees: Employee[],
    services: Service[],
    locale: AppLocale,
    tz: string,
    prompt = '',
  ): Promise<PublicAssistantResult> {
    const result = await this.handleCheckAvailability(
      slug,
      params,
      employees,
      services,
      locale,
      tz,
    );
    return {
      ...result,
      action: 'find_evening_weekend_slots',
    };
  }

  async executeDeterministicIntent(
    slug: string,
    input: {
      action: string;
      params: Record<string, any>;
      prompt: string;
      session?: Record<string, any>;
      locale?: string;
    },
  ): Promise<PublicAssistantResult> {
    const business = await this.businessService.findBySlug(slug);
    const locale = resolveLocale(
      input.locale,
      resolveLocale(business.settings?.locale, 'en'),
    );
    const tz = resolveTimezone(business.timezone);
    const todayKey = getDateKeyInTimezone(new Date(), tz);
    const orchestratedSession = this.platform.enrichPublicSession(
      input.session,
      business.settings?.businessType as string | undefined,
      await this.aiSettings.getSettings(business.id),
    );
    const [employees, services] = await Promise.all([
      this.employeeRepo.find({
        where: { businessId: business.id, isActive: true },
        order: { name: 'ASC' },
      }),
      this.serviceRepo.find({
        where: { businessId: business.id, isActive: true },
        order: { name: 'ASC' },
      }),
    ]);

    const mergedParams = this.mergeSessionContext(
      enrichPublicAssistantParamsFromPrompt(
        input.prompt,
        input.params ?? {},
        services.map((service) => ({ id: service.id, name: service.name })),
        input.action,
      ),
      orchestratedSession,
      input.action,
    );
    if (input.action === 'book_appointment') {
      Object.assign(
        mergedParams,
        enrichBookAppointmentParamsFromPrompt(input.prompt, mergedParams),
      );
    }
    this.normalizeDateParams(mergedParams, todayKey, tz);

    const raw = await this.dispatchCompoundStepAction(
      input.action,
      mergedParams,
      input.prompt,
      slug,
      business,
      employees,
      services,
      locale,
      tz,
      orchestratedSession,
    );
    return this.attachSession(raw, mergedParams, employees, services, locale);
  }

  private async tryExecutePublicCompound(
    slug: string,
    prompt: string,
    orchestratedSession: Record<string, any>,
    employees: Employee[],
    services: Service[],
    locale: AppLocale,
    tz: string,
    todayKey: string,
    options?: { recordMetrics?: boolean },
  ): Promise<PublicAssistantResult | null> {
    if (
      !isCompoundPrompt(prompt) &&
      !isBudgetServiceDiscoveryCompoundPrompt(prompt) &&
      !isFlexibleAvailabilityBudgetBookCompoundPrompt(prompt) &&
      !isPublicMultiServiceCompoundPrompt(prompt) &&
      !isPublicAssistantCompoundPrompt(prompt)
    ) {
      return null;
    }

    const decomposition = decomposeDeterministicForSurface('public', prompt);
    if (!decomposition || decomposition.steps.length < 2) return null;

    const business = await this.businessService.findBySlug(slug);

    const result = await executePublicAssistantCompoundFromSteps(
      prompt,
      decomposition.steps,
      { ...orchestratedSession },
      {
        runStep: async (action, params, segment) => {
          const enrichedBase = enrichPublicAssistantParamsFromPrompt(
            segment,
            params,
            services.map((service) => ({
              id: service.id,
              name: service.name,
            })),
            action,
          );
          const enriched =
            action === 'book_appointment'
              ? enrichBookAppointmentParamsFromPrompt(segment, enrichedBase)
              : enrichedBase;
          this.normalizeDateParams(enriched, todayKey, tz);
          const raw = await this.dispatchCompoundStepAction(
            action,
            enriched,
            segment,
            slug,
            business,
            employees,
            services,
            locale,
            tz,
            orchestratedSession,
          );
          return this.attachSession(raw, enriched, employees, services, locale);
        },
      },
    );

    if (options?.recordMetrics !== false) {
      void this.platform.recordCommandOutcome({
        businessId: business.id,
        result: result as unknown as Record<string, unknown>,
        surface: 'public',
        locationId:
          typeof orchestratedSession.locationId === 'string'
            ? orchestratedSession.locationId
            : undefined,
      });
    }

    return result;
  }

  private async dispatchCompoundStepAction(
    action: string,
    params: Record<string, any>,
    prompt: string,
    slug: string,
    business: {
      id: string;
      name: string;
      description?: string;
      phone?: string;
      email?: string;
      address?: string;
      settings?: Record<string, any> | null;
    },
    employees: Employee[],
    services: Service[],
    locale: AppLocale,
    tz: string,
    session: Record<string, unknown>,
  ): Promise<PublicAssistantResult> {
    const businessId = business.id;
    switch (action) {
      case 'list_providers':
        return this.handleListProviders(slug, params, locale);
      case 'list_services':
        return this.handleListServices(
          slug,
          enrichListServicesParamsFromPrompt(prompt, params),
          employees,
          locale,
          prompt,
        );
      case 'check_availability':
        return this.handleCheckAvailability(
          slug,
          params,
          employees,
          services,
          locale,
          tz,
        );
      case 'explain_provider_availability':
        return this.handleExplainProviderAvailability(
          slug,
          params,
          employees,
          services,
          locale,
          tz,
          prompt,
        );
      case 'recommend_specialists':
        return this.handleRecommendSpecialists(
          slug,
          params,
          employees,
          services,
          locale,
          tz,
          prompt,
        );
      case 'business_info':
        return this.handleBusinessInfo(business);
      case 'book_appointment':
        return this.handleBookAppointment(
          slug,
          params,
          employees,
          services,
          locale,
          prompt,
        );
      // e2e-bug.196 — PUBLIC_ONLY actions must work on compound / deterministic path
      case 'find_services_under_budget':
        return this.handleFindServicesUnderBudget(
          slug,
          enrichFindServicesUnderBudgetParamsFromPrompt(params, prompt),
          employees,
          locale,
          prompt,
        );
      case 'find_evening_weekend_slots':
        return this.handleFindEveningWeekendSlots(
          slug,
          enrichFindEveningWeekendSlotsParamsFromPrompt(params, prompt),
          employees,
          services,
          locale,
          tz,
          prompt,
        );
      case 'booking_help':
        return this.handleBookingHelp(businessId, prompt, locale, session);
      case 'preview_multi_service_cart':
        return this.handlePreviewMultiServiceCart(
          businessId,
          params,
          prompt,
          session,
        );
      case 'list_public_promotions':
        return this.handleListPublicPromotions(slug);
      case 'list_provider_reviews':
        return this.handleListProviderReviews(businessId, {
          ...params,
          slug,
        });
      case 'suggest_package_block':
        return this.handleSuggestPackageBlock(
          businessId,
          params,
          prompt,
          session,
        );
      case 'book_multi_service':
        return this.handleBookMultiService(businessId, params, prompt, {});
      case 'check_multi_service_availability':
        return this.handleCheckMultiServiceAvailability(
          businessId,
          params,
          prompt,
          {},
        );
      case 'add_services_to_cart':
        return this.handleAddServicesToCart(businessId, params, prompt, {});
      case 'discover_packages':
        return this.handleDiscoverPackages(businessId, params, prompt, session);
      case 'book_package':
        return this.handleBookPackage(businessId, params, prompt, session);
      default:
        return {
          success: false,
          action,
          summary: `Public compound step "${action}" is not supported yet.`,
        };
    }
  }

  private async handleCheckAvailability(
    slug: string,
    params: any,
    employees: Employee[],
    services: Service[],
    locale: AppLocale,
    tz: string,
  ): Promise<PublicAssistantResult> {
    let matchedServices = this.resolveServicesFromParams(params, services);
    const budgetFiltered = applyBudgetFilterForAvailabilityCheck(
      matchedServices.map((service) => ({
        id: service.id,
        name: service.name,
        price: Number(service.price),
        durationMinutes: service.durationMinutes,
      })),
      params.maxPrice,
    );
    if (budgetFiltered.noMatchSummary) {
      const clarifyMaxPrice = resolveAvailabilityBudgetClarifyMaxPrice(
        params.maxPrice,
        budgetFiltered.budgetMax,
      );
      return {
        success: true,
        action: 'check_availability',
        summary: budgetFiltered.noMatchSummary,
        details: clarifyMaxPrice
          ? buildAvailabilityBudgetClarifyDetails(clarifyMaxPrice)
          : { clarify: true, reason: 'budget_no_match' },
      };
    }
    if (budgetFiltered.services.length > 0) {
      matchedServices = budgetFiltered.services.map(
        (entry) => services.find((service) => service.id === entry.id)!,
      );
    }

    const serviceRank = resolveServiceRankParam(params.serviceRank);
    if (serviceRank != null && matchedServices.length > 0) {
      const rankResolved = resolveDiscoverConstrainedService(
        matchedServices.map((service) => ({
          id: service.id,
          name: service.name,
          price: Number(service.price),
          durationMinutes: service.durationMinutes,
        })),
        params,
      );
      if (rankResolved.noMatchSummary) {
        return {
          success: true,
          action: 'check_availability',
          summary: rankResolved.noMatchSummary,
          details: { clarify: true, reason: 'rank_no_match' },
        };
      }
      if (rankResolved.service) {
        matchedServices = [
          services.find((service) => service.id === rankResolved.service!.id)!,
        ];
        params = {
          ...params,
          serviceId: rankResolved.service.id,
          serviceName: rankResolved.service.name,
        };
      }
    } else if (matchedServices.length === 1) {
      params = {
        ...params,
        serviceId: matchedServices[0].id,
        serviceName: matchedServices[0].name,
      };
    }

    if (
      (params.serviceName || params.serviceCategory) &&
      matchedServices.length === 0
    ) {
      return {
        success: false,
        action: 'check_availability',
        summary: t(locale, 'assistant.availabilityServiceNotFound', {
          service: params.serviceCategory ?? params.serviceName,
          available: services.map((s) => s.name).join(', '),
        }),
      };
    }

    const targets =
      params.allProviders ||
      (!params.employeeName && !params.employeeNames?.length)
        ? employees
        : resolveEmployees(employees, params);
    if (targets.length === 0) {
      return {
        success: false,
        action: 'check_availability',
        summary: t(locale, 'assistant.availabilityProviderNotFound', {
          name: params.employeeName,
          available: employees.map((e) => e.name).join(', '),
        }),
      };
    }

    let availabilityWindows = resolvePublicAvailabilityWindows(
      params,
      undefined,
      tz,
    );
    const todayKey = getDateKeyInTimezone(new Date(), tz);
    const preparedWindows = prepareAvailabilityWindowsForCheck({
      windows: availabilityWindows,
      locale,
      timeZone: tz,
      todayDateKey: todayKey,
    });
    availabilityWindows = preparedWindows.windows;
    const overlapClarifyNote = preparedWindows.overlapClarifyNote;
    const windowOverlap = preparedWindows.overlap;
    if (availabilityWindows.length === 0 && matchedServices.length > 0) {
      const defaultDateKeys = Array.from(
        { length: PUBLIC_AVAILABILITY_SCAN_DAYS },
        (_, offset) => addDaysToDateKey(todayKey, offset, tz),
      );
      availabilityWindows = [
        {
          dateKeys: defaultDateKeys,
          timeOfDay: params.timeOfDay ?? null,
          timeFrom: params.timeFrom ?? null,
          timeTo: params.timeTo ?? null,
          timeSlot: params.timeSlot ?? null,
        },
      ];
    }

    const allDateKeys = [
      ...new Set(availabilityWindows.flatMap((window) => window.dateKeys)),
    ];
    if (allDateKeys.length === 0) {
      const namedProvider =
        typeof params.employeeName === 'string'
          ? params.employeeName.trim()
          : '';
      // e2e-bug.93 — keep named specialist in day clarify (don't drop to generic).
      if (namedProvider && matchedServices.length === 0) {
        return {
          success: true,
          action: 'check_availability',
          summary: t(locale, 'assistant.availabilityNeedsDayForProvider', {
            name: namedProvider,
          }),
          details: {
            clarify: true,
            missing: ['date'],
            employeeName: namedProvider,
          },
        };
      }
      return {
        success: true,
        action: 'check_availability',
        summary: matchedServices.length
          ? t(locale, 'assistant.availabilityNeedsDay', {
              service: inferServiceGroupLabel(
                matchedServices,
                params.serviceCategory ?? params.serviceName,
              ),
            })
          : t(locale, 'assistant.availabilityNeedsDayOrService'),
        ...(namedProvider
          ? { details: { employeeName: namedProvider, clarify: true } }
          : {}),
      };
    }

    const groupByWindow = shouldGroupPublicAvailabilityByWindow(
      availabilityWindows,
      params,
    );
    const windowReports: PublicAvailabilityWindowReport[] = [];
    const flatDayReports: PublicAvailabilityDayReport[] = [];
    let bestNavigate: { employeeId: string; startTime: string } | undefined;

    for (const window of availabilityWindows) {
      const dayReports: PublicAvailabilityDayReport[] = [];
      const notBeforeTime = window.timeFrom ?? params.timeFrom ?? null;

      for (const dateKey of window.dateKeys) {
        const providersForDay: PublicAvailabilityDayReport['providers'] = [];

        for (const employee of targets) {
          const serviceIds =
            matchedServices.length > 0
              ? matchedServices
                  .filter(
                    (s) =>
                      !employee.serviceIds?.length ||
                      employee.serviceIds.includes(s.id),
                  )
                  .map((s) => s.id)
              : [undefined];

          for (const serviceId of serviceIds) {
            if (
              serviceId &&
              employee.serviceIds?.length &&
              !employee.serviceIds.includes(serviceId)
            ) {
              continue;
            }

            const { slots: rawSlots } =
              await this.publicBookingService.getProviderSlots(
                slug,
                employee.id,
                dateKey,
                {
                  serviceId,
                  notBeforeTime,
                },
              );
            const slots = filterPublicProviderSlotsByTimeOfDay(
              rawSlots,
              window.timeOfDay,
            );
            if (slots.length === 0) continue;

            mergePublicProviderSlotTimes({
              providers: providersForDay,
              employeeId: employee.id,
              employeeName: employee.name,
              slots,
            });

            if (!bestNavigate || slots[0].startTime < bestNavigate.startTime) {
              bestNavigate = {
                employeeId: employee.id,
                startTime: slots[0].startTime,
              };
            }
          }
        }

        if (providersForDay.length > 0) {
          const dayReport = { dateKey, providers: providersForDay };
          dayReports.push(dayReport);
          flatDayReports.push(dayReport);
        }
      }

      if (groupByWindow) {
        windowReports.push({
          label: buildPublicAvailabilityWindowLabelForCheck({
            window,
            overlap: windowOverlap,
            locale,
            timeZone: tz,
            todayDateKey: todayKey,
          }),
          dayReports,
        });
      }
    }

    const serviceLabel =
      matchedServices.length > 0
        ? inferServiceGroupLabel(
            matchedServices,
            params.serviceCategory ?? params.serviceName,
          )
        : t(locale, 'assistant.anyService');
    const dayCount = allDateKeys.length;

    if (flatDayReports.length === 0) {
      if (
        shouldUseGroupedAvailabilityNoSlotsSummary(groupByWindow, windowReports)
      ) {
        let summary = composePublicAvailabilityGroupedEmptyWindowsSummary({
          serviceLabel,
          locale,
          timeZone: tz,
          singleProvider: targets.length === 1,
          windowReports,
          maxPrice: params.maxPrice,
          overlapClarifyNote,
        });

        if (matchedServices.length === 1) {
          const nearest =
            await this.publicBookingService.findNearestBookableSlot(slug, {
              serviceId: matchedServices[0].id,
              employeeId: targets.length === 1 ? targets[0].id : null,
              startDateKey: [...allDateKeys].sort()[0] ?? null,
            });
          if (nearest) {
            summary = appendAvailabilityNearestAlternativeNote(
              summary,
              formatAvailabilityNearestAlternativeNote({
                locale,
                timeZone: tz,
                employeeName: nearest.employeeName,
                dateKey: nearest.dateKey,
                startTime: nearest.startTime,
              }),
            );
          }
        }

        return this.withCheckProvidersHandoff(
          {
            success: true,
            action: 'check_availability',
            summary,
            navigate:
              targets.length === 1
                ? {
                    path: 'professionals',
                    query: { employeeId: targets[0].id },
                  }
                : { path: 'professionals', query: {} },
          },
          this.buildPublicAvailabilityHandoff(
            summary,
            params,
            [],
            true,
            allDateKeys[0],
          ),
        );
      }

      const providerLabel =
        targets.length === 1
          ? targets[0].name
          : t(locale, 'assistant.anySpecialist');
      const summary = composeAvailabilityNoSlotsSummary({
        locale,
        serviceLabel,
        providerLabel,
        daysLabel:
          dayCount === 1
            ? // e2e-bug.345 — no-slot day label: no DD/MM slash (sibling of Fixed 285/306/332).
              formatDateForAiLabel(allDateKeys[0], locale)
            : String(dayCount),
        maxPrice: params.maxPrice,
      });
      return this.withCheckProvidersHandoff(
        {
          success: true,
          action: 'check_availability',
          summary,
          navigate:
            targets.length === 1
              ? { path: 'professionals', query: { employeeId: targets[0].id } }
              : { path: 'professionals', query: {} },
        },
        this.buildPublicAvailabilityHandoff(
          summary,
          params,
          [],
          true,
          allDateKeys[0],
        ),
      );
    }

    const navigateQuery: Record<string, string> = {};
    if (bestNavigate) {
      navigateQuery.employeeId = bestNavigate.employeeId;
      navigateQuery.startTime = bestNavigate.startTime;
    } else if (targets.length === 1) {
      navigateQuery.employeeId = targets[0].id;
    }
    if (matchedServices.length === 1)
      navigateQuery.serviceId = matchedServices[0].id;

    const summary = composePublicAvailabilityCheckSummary({
      serviceLabel,
      locale,
      timeZone: tz,
      singleProvider: targets.length === 1,
      groupByWindow,
      windowReports,
      flatDayReports,
      totalDayCount: dayCount,
      maxPrice: params.maxPrice,
      overlapClarifyNote,
    });
    const availableProviders = [
      ...new Set(
        flatDayReports.flatMap((day) =>
          day.providers.map((provider) => provider.employeeName),
        ),
      ),
    ];

    return this.withCheckProvidersHandoff(
      {
        success: true,
        action: 'check_availability',
        summary,
        navigate: {
          path: bestNavigate ? 'services' : 'professionals',
          query: navigateQuery,
        },
      },
      this.buildPublicAvailabilityHandoff(
        summary,
        params,
        availableProviders,
        false,
        flatDayReports[0]?.dateKey,
      ),
    );
  }

  private async handleRecommendSpecialists(
    slug: string,
    params: any,
    employees: Employee[],
    services: Service[],
    locale: AppLocale,
    tz: string,
    prompt?: string,
  ): Promise<PublicAssistantResult> {
    const employeeRole =
      typeof params.employeeRole === 'string' ? params.employeeRole : undefined;
    let matchedServices = this.resolveServicesFromParams(params, services);

    if (
      employeeRole &&
      params.serviceCategory === employeeRole &&
      matchedServices.length === 0
    ) {
      matchedServices = [];
    }

    if (
      (params.serviceName || params.serviceCategory) &&
      matchedServices.length === 0 &&
      !employeeRole
    ) {
      return {
        success: false,
        action: 'recommend_specialists',
        summary: t(locale, 'assistant.availabilityServiceNotFound', {
          service: params.serviceCategory ?? params.serviceName,
          available: services.map((s) => s.name).join(', '),
        }),
      };
    }

    if (matchedServices.length === 0 && !employeeRole) {
      return {
        success: true,
        action: 'recommend_specialists',
        summary: t(locale, 'assistant.recommendNeedsService', {
          services: services.map((s) => s.name).join(', '),
        }),
      };
    }

    const servicesForRecommend =
      matchedServices.length > 0 ? matchedServices : services;

    const budgetRecommend = applyBudgetFilterForRecommendSpecialists(
      servicesForRecommend.map((service) => ({
        id: service.id,
        name: service.name,
        price: service.price,
        durationMinutes: service.durationMinutes,
      })),
      params.maxPrice,
    );
    if (budgetRecommend.noMatchSummary) {
      return {
        success: true,
        action: 'recommend_specialists',
        summary: budgetRecommend.noMatchSummary,
      };
    }

    const filteredServiceIds = new Set(
      budgetRecommend.services.map((service) => service.id),
    );
    const filteredServices = servicesForRecommend.filter((service) =>
      filteredServiceIds.has(service.id),
    );

    const serviceLabel = employeeRole
      ? employeeRole.charAt(0).toUpperCase() + employeeRole.slice(1)
      : inferServiceGroupLabel(
          filteredServices,
          params.serviceCategory ?? params.serviceName,
        );
    const multiService = filteredServices.length > 1;

    let dateKeys = resolvePublicAvailabilityDateKeys(params, prompt, tz);
    if (dateKeys.length === 0) {
      const todayKey = getDateKeyInTimezone(new Date(), tz);
      dateKeys = Array.from(
        { length: PUBLIC_AVAILABILITY_SCAN_DAYS },
        (_, offset) => addDaysToDateKey(todayKey, offset, tz),
      );
    }

    const { providers } = await this.publicBookingService.recommendProviders(
      slug,
      {
        serviceIds:
          matchedServices.length > 0
            ? filteredServices.map((service) => service.id)
            : undefined,
        dateKeys,
        // e2e-bug.318 — honor timeOfDay ("this evening"/"tonight" → 17:00+),
        // not just an explicit timeFrom, when picking sample slot times.
        notBeforeTime: resolveNearestBookableSlotNotBeforeTime(
          params,
          prompt ?? '',
        ),
        limit: 5,
        employeeRole: employeeRole ?? null,
      },
    );

    const periodLabel =
      dateKeys.length === 1
        ? formatDateDisplay(dateKeys[0], locale)
        : t(locale, 'assistant.recommendPeriodDays', {
            count: dateKeys.length,
          });

    if (providers.length === 0) {
      return {
        success: true,
        action: 'recommend_specialists',
        summary: t(locale, 'assistant.recommendNoMatches', {
          service: serviceLabel,
          period: periodLabel,
        }),
        navigate: { path: 'professionals', query: {} },
      };
    }

    const lines: string[] = [
      t(locale, 'assistant.recommendHeader', {
        service: serviceLabel,
        period: periodLabel,
      }),
      '',
    ];

    providers.forEach((provider, index) => {
      const ratingLabel = this.formatProviderRating(
        provider.averageRating,
        provider.reviewCount,
        locale,
      );
      const role = provider.role ? ` (${provider.role})` : '';
      const dayLabel = formatDateDisplay(provider.earliestDateKey, locale);
      const times = provider.previewTimes.join(', ');
      const serviceNote =
        multiService && provider.matchedServiceName
          ? t(locale, 'assistant.recommendServiceNote', {
              service: provider.matchedServiceName,
            })
          : '';
      lines.push(
        t(locale, 'assistant.recommendLine', {
          rank: index + 1,
          name: provider.name,
          role,
          rating: ratingLabel,
          service: serviceNote,
          date: dayLabel,
          times,
        }),
      );
    });

    const top = providers[0];
    const navigateQuery: Record<string, string> = {
      employeeId: top.id,
      startTime: top.earliestStartTime,
      serviceId: top.matchedServiceId,
    };

    return {
      success: true,
      action: 'recommend_specialists',
      summary: lines.join('\n'),
      navigate: { path: 'services', query: navigateQuery },
    };
  }

  private async resolveBookableStartTime(
    slug: string,
    employee: Employee,
    service: Service,
    params: { date?: string; timeSlot?: string; startTime?: string },
    tz: string,
  ): Promise<{ dateKey: string; startTime: string; timeSlot: string } | null> {
    if (params.startTime?.includes('T')) {
      const dateKey = params.startTime.split('T')[0];
      return {
        dateKey,
        startTime: params.startTime,
        timeSlot: formatTimeDisplay(params.startTime),
      };
    }

    if (params.date && params.timeSlot) {
      const dateKey = toIsoDay(params.date, tz);
      const timeSlot = this.snapTo10min(params.timeSlot);
      return {
        dateKey,
        startTime: `${dateKey}T${timeSlot}:00.000Z`,
        timeSlot,
      };
    }

    if (!params.timeSlot) return null;

    const timeSlot = this.snapTo10min(params.timeSlot);
    const scanFrom = params.date
      ? toIsoDay(params.date, tz)
      : getDateKeyInTimezone(new Date(), tz);

    for (let offset = 0; offset < PUBLIC_AVAILABILITY_SCAN_DAYS; offset++) {
      const dateKey = addDaysToDateKey(scanFrom, offset, tz);
      const { slots } = await this.publicBookingService.getProviderSlots(
        slug,
        employee.id,
        dateKey,
        {
          serviceId: service.id,
        },
      );
      const hit = slots.find(
        (s) => formatTimeDisplay(s.startTime) === timeSlot,
      );
      if (hit) {
        return { dateKey, startTime: hit.startTime, timeSlot };
      }
    }

    return null;
  }

  private resolveServicesFromParams(
    params: Record<string, any>,
    catalog: Service[],
  ): Service[] {
    return resolveServicesFromCatalogParams(catalog, params);
  }

  private formatProviderRating(
    averageRating: number | null,
    reviewCount: number,
    locale: AppLocale,
  ): string {
    if (averageRating == null || reviewCount === 0) {
      return t(locale, 'assistant.recommendNoReviews');
    }
    return t(locale, 'assistant.recommendRating', {
      rating: averageRating.toFixed(1),
      count: reviewCount,
    });
  }

  private async handleExplainBookingLanguages(
    businessId: string,
    visitorLocale: AppLocale,
  ): Promise<PublicAssistantResult> {
    const result = await this.businessLanguages.handleExplainBookingLanguages(
      businessId,
      visitorLocale,
    );
    return {
      success: result.success,
      action: result.action ?? 'explain_booking_languages',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleExplainBookingDateFormat(
    businessId: string,
  ): Promise<PublicAssistantResult> {
    const result =
      await this.businessDateFormat.handleExplainBookingDateFormat(businessId);
    return {
      success: result.success,
      action: result.action ?? 'explain_booking_date_format',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleExplainCheckoutCurrency(
    businessId: string,
  ): Promise<PublicAssistantResult> {
    const result =
      await this.businessCurrency.handleExplainCheckoutCurrency(businessId);
    return {
      success: result.success,
      action: result.action ?? 'explain_checkout_currency',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleExplainDepositForfeiture(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.selfServiceBooking.handleExplainDepositForfeiture(
      businessId,
      params,
      prompt,
    );
    return commandResultToPublicAssistantResult(result);
  }

  private async handleExplainCheckoutTax(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.businessTax.handleExplainCheckoutTax(
      businessId,
      params,
      prompt,
    );
    return {
      success: result.success,
      action: result.action ?? 'explain_checkout_tax',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleExplainWhyStripeRequired(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
    catalogContext?: Record<string, unknown>,
  ): Promise<PublicAssistantResult> {
    const result = await this.payments.handleExplainWhyStripeRequired(
      businessId,
      { ...params, _prompt: prompt },
      prompt,
      catalogContext,
    );
    return commandResultToPublicAssistantResult(result);
  }

  private async handleExplainCheckoutTotal(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
    catalogContext?: Record<string, unknown>,
  ): Promise<PublicAssistantResult> {
    const result = await this.payments.handleExplainCheckoutTotal(
      businessId,
      { ...params, _prompt: prompt },
      catalogContext,
    );
    return commandResultToPublicAssistantResult(result);
  }

  private async handleExplainAmountDueNow(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
    catalogContext?: Record<string, unknown>,
  ): Promise<PublicAssistantResult> {
    const result = await this.payments.handleExplainAmountDueNow(
      businessId,
      { ...params, _prompt: prompt },
      prompt,
      catalogContext,
    );
    return commandResultToPublicAssistantResult(result);
  }

  private async handleExplainServicePrice(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
    catalogContext?: Record<string, unknown>,
  ): Promise<PublicAssistantResult> {
    const result = await this.payments.handleExplainServicePrice(
      businessId,
      { ...params, _prompt: prompt },
      prompt,
      catalogContext,
    );
    return commandResultToPublicAssistantResult(result);
  }

  private async handleExplainPaymentOptionsForService(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
    catalogContext?: Record<string, unknown>,
  ): Promise<PublicAssistantResult> {
    const result = await this.payments.handleExplainPaymentOptionsForService(
      businessId,
      { ...params, _prompt: prompt },
      prompt,
      catalogContext,
    );
    return commandResultToPublicAssistantResult(result);
  }

  private async handleFindSoonestAppointment(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.payments.handleFindSoonestAppointment(
      businessId,
      { ...params, _prompt: prompt },
      prompt,
    );
    return commandResultToPublicAssistantResult(result);
  }

  private async handleCompareServices(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.payments.handleCompareServices(
      businessId,
      { ...params, _prompt: prompt },
      prompt,
    );
    return commandResultToPublicAssistantResult(result);
  }

  private async handleExplainPackageSavings(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.selfServiceBooking.handleExplainPackageSavings(
      businessId,
      { ...params, _prompt: prompt },
      prompt,
    );
    return commandResultToPublicAssistantResult(result);
  }

  private async handleExplainSubscriptionVsOneTime(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result =
      await this.selfServiceBooking.handleExplainSubscriptionVsOneTime(
        businessId,
        { ...params, _prompt: prompt },
        prompt,
      );
    return commandResultToPublicAssistantResult(result);
  }

  private async handleFilterServicesNoPrepayment(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.payments.handleFilterServicesNoPrepayment(
      businessId,
      { ...params, _prompt: prompt },
      prompt,
    );
    return commandResultToPublicAssistantResult(result);
  }

  private async handleExplainBusinessHoursAndLocation(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result =
      await this.businessHoursLocation.handleExplainBusinessHoursAndLocation(
        businessId,
        { ...params, _prompt: prompt },
        prompt,
      );
    return commandResultToPublicAssistantResult(result);
  }

  private async handleExplainSalonProfile(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.businessHoursLocation.handleExplainSalonProfile(
      businessId,
      { ...params, _prompt: prompt },
      prompt,
    );
    return commandResultToPublicAssistantResult(result);
  }

  private async handleGetDirectionsToSalon(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.businessHoursLocation.handleGetDirectionsToSalon(
      businessId,
      { ...params, _prompt: prompt },
      prompt,
    );
    return commandResultToPublicAssistantResult(result);
  }

  private async handleExplainProviderSpecialty(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.providerSpecialty.handleExplainProviderSpecialty(
      businessId,
      { ...params, _prompt: prompt },
      prompt,
    );
    return commandResultToPublicAssistantResult(result);
  }

  private async handleExplainAnyProviderOption(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.providerSpecialty.handleExplainAnyProviderOption(
      businessId,
      { ...params, _prompt: prompt },
      prompt,
    );
    return commandResultToPublicAssistantResult(result);
  }

  private async handlePickProviderForService(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.providerSpecialty.handlePickProviderForService(
      businessId,
      { ...params, _prompt: prompt },
      prompt,
    );
    return commandResultToPublicAssistantResult(result);
  }

  private async handleSwitchProviderSameTime(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.providerSpecialty.handleSwitchProviderSameTime(
      businessId,
      { ...params, _prompt: prompt },
      prompt,
    );
    return commandResultToPublicAssistantResult(result);
  }

  private async handleExplainProfessionalProfile(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result =
      await this.providerSpecialty.handleExplainProfessionalProfile(
        businessId,
        { ...params, _prompt: prompt },
        prompt,
      );
    return commandResultToPublicAssistantResult(result);
  }

  private async handleListProviderReviews(
    businessId: string,
    params: Record<string, unknown>,
  ): Promise<PublicAssistantResult> {
    const result = await this.providerSpecialty.handleListProviderReviews(
      businessId,
      params,
    );
    return commandResultToPublicAssistantResult(result);
  }

  private async handleSubmitProviderReview(
    businessId: string,
    params: Record<string, unknown>,
  ): Promise<PublicAssistantResult> {
    const result = await this.providerSpecialty.handleSubmitProviderReview(
      businessId,
      params,
    );
    return commandResultToPublicAssistantResult(result);
  }

  private async handleExplainProviderAvailability(
    slug: string,
    params: Record<string, unknown>,
    employees: Employee[],
    services: Service[],
    locale: AppLocale,
    tz: string,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const clarify = validateExplainProviderAvailabilityParams(params, prompt);
    if (clarify) {
      return commandResultToPublicAssistantResult(clarify);
    }

    const enriched = prepareExplainProviderAvailabilityParams(
      params,
      prompt,
      tz,
    );
    if (!enriched) {
      return commandResultToPublicAssistantResult({
        success: false,
        action: 'explain_provider_availability',
        summary: 'Ask if a stylist is working on a day or who has openings.',
        details: { clarify: true },
      });
    }

    const parsed = parseExplainProviderAvailabilityFromPrompt(prompt, enriched);
    const availability = await this.handleCheckAvailability(
      slug,
      enriched,
      employees,
      services,
      locale,
      tz,
    );
    return wrapCheckAvailabilityAsExplainProviderAvailability(
      availability,
      parsed?.aspect ?? 'team_openings',
    );
  }

  private async handleChoosePaymentMethod(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.payments.handleChoosePaymentMethod(
      businessId,
      { ...params, _prompt: prompt },
      prompt,
    );
    return commandResultToPublicAssistantResult(result);
  }

  private async handlePayCashAtVisit(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.payments.handlePayCashAtVisit(
      businessId,
      { ...params, _prompt: prompt },
      prompt,
    );
    return commandResultToPublicAssistantResult(result);
  }

  private async handleDiagnoseStripeCheckoutFailure(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result =
      await this.diagnoseStripeCheckoutFailure.handleDiagnoseStripeCheckoutFailure(
        businessId,
        { ...params, _prompt: prompt },
        prompt,
      );
    return commandResultToPublicAssistantResult(result);
  }

  private async handlePayAtVenueFallback(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.payAtVenueFallback.handlePayAtVenueFallback(
      businessId,
      { ...params, _prompt: prompt },
      prompt,
    );
    return commandResultToPublicAssistantResult(result);
  }

  private async handleResumeBookingDraft(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.resumeBookingDraft.handleResumeBookingDraft(
      businessId,
      { ...params, _prompt: prompt },
      prompt,
    );
    return commandResultToPublicAssistantResult(result);
  }

  private async handleExplainSlotNoLongerAvailable(
    businessId: string,
    slug: string,
    params: Record<string, unknown>,
    prompt: string,
    employees: Employee[],
    services: Service[],
    locale: AppLocale,
    tz: string,
  ): Promise<PublicAssistantResult> {
    const result =
      await this.explainSlotNoLongerAvailable.handleExplainSlotNoLongerAvailable(
        businessId,
        { ...params, _prompt: prompt },
        prompt,
        async (availParams) => {
          const availability = await this.handleCheckAvailability(
            slug,
            availParams,
            employees,
            services,
            locale,
            tz,
          );
          return publicAssistantResultToCommandResult(availability);
        },
      );
    return commandResultToPublicAssistantResult(result);
  }

  private async handleExplainVoiceInput(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.explainVoiceInput.handleExplainVoiceInput(
      businessId,
      { ...params, _prompt: prompt },
      prompt,
    );
    return commandResultToPublicAssistantResult(result);
  }

  private async handleSpeakAssistantReply(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.speakAssistantReply.handleSpeakAssistantReply(
      businessId,
      { ...params, _prompt: prompt },
      prompt,
    );
    return commandResultToPublicAssistantResult(result);
  }

  private async handleGiveAiFeedback(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
    requestLocale?: string,
  ): Promise<PublicAssistantResult> {
    // e2e-bug.299 — locale is request context, not a classifier entity.
    const locale =
      (typeof params.locale === 'string' && params.locale.trim()
        ? params.locale.trim()
        : undefined) ?? requestLocale;
    const result = await this.giveAiFeedback.handleGiveAiFeedback(
      businessId,
      { ...params, _prompt: prompt, ...(locale ? { locale } : {}) },
      prompt,
    );
    return commandResultToPublicAssistantResult(result);
  }

  private async handleExplainRtlLayout(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
    requestLocale?: string,
  ): Promise<PublicAssistantResult> {
    // e2e-bug.85 — thread resolved request locale; classifier never extracts it.
    const result = await this.explainRtlLayout.handleExplainRtlLayout(
      businessId,
      mergeExplainRtlLayoutRequestLocale(
        { ...params, _prompt: prompt },
        requestLocale,
      ),
      prompt,
    );
    return commandResultToPublicAssistantResult(result);
  }

  private async handlePayOnline(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
    session: Record<string, unknown>,
  ): Promise<PublicAssistantResult> {
    const pick = (...values: unknown[]): string | undefined => {
      for (const value of values) {
        if (typeof value === 'string' && value.trim()) return value.trim();
      }
      return undefined;
    };
    const mergedParams = {
      ...params,
      // e2e-bug.229 — treat empty-string classifier params as missing so checkout
      // page context (serviceId/employeeId/startTime) wins.
      serviceId: pick(params.serviceId, session.serviceId),
      employeeId: pick(params.employeeId, session.employeeId),
      startTime: pick(params.startTime, session.startTime),
      cartServiceIds: params.cartServiceIds ?? session.cartServiceIds,
      packageId: pick(params.packageId, session.packageId),
      _prompt: prompt,
    };
    const result = await this.payments.handlePayOnline(
      businessId,
      mergedParams,
      prompt,
    );
    return commandResultToPublicAssistantResult(result);
  }

  private async handleGetBookingQuote(
    businessId: string,
    params: Record<string, unknown>,
  ): Promise<PublicAssistantResult> {
    const result = await this.payments.handleGetBookingQuote(
      businessId,
      params,
    );
    return commandResultToPublicAssistantResult(result);
  }

  private async handleGetPackageQuote(
    businessId: string,
    params: Record<string, unknown>,
  ): Promise<PublicAssistantResult> {
    const result = await this.payments.handleGetPackageQuote(
      businessId,
      params,
    );
    return commandResultToPublicAssistantResult(result);
  }

  private async handleGetMultiServiceQuote(
    businessId: string,
    params: Record<string, unknown>,
  ): Promise<PublicAssistantResult> {
    const result = await this.payments.handleGetMultiServiceQuote(
      businessId,
      params,
    );
    return commandResultToPublicAssistantResult(result);
  }

  private async handleConfirmStripePayment(
    businessId: string,
    params: Record<string, unknown>,
  ): Promise<PublicAssistantResult> {
    const result = await this.payments.handleConfirmStripePayment(
      businessId,
      params,
    );
    return commandResultToPublicAssistantResult(result);
  }

  private async handleApplyPromoCodeCheckout(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const enriched = enrichApplyPromoCodeCheckoutParamsFromPrompt(
      { ...params, _prompt: prompt },
      prompt,
    );
    const result = await this.marketingGrowth.handleApplyPromoCodeCheckout(
      businessId,
      enriched,
      prompt,
    );
    return commandResultToPublicAssistantResult(result);
  }

  private async handlePromoCodeHelp(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const enriched = enrichPromoCodeHelpParamsFromPrompt(
      { ...params, _prompt: prompt },
      prompt,
    );
    const result = await this.marketingGrowth.handlePromoCodeHelp(
      businessId,
      enriched,
      prompt,
    );
    return commandResultToPublicAssistantResult(result);
  }

  private async handleHowToDownloadApp(
    businessId: string,
  ): Promise<PublicAssistantResult> {
    const result =
      await this.marketingGrowth.handleHowToDownloadApp(businessId);
    return commandResultToPublicAssistantResult(result);
  }

  private mergeMultiServiceSessionParams(
    params: Record<string, unknown>,
    session: Record<string, unknown>,
    prompt: string,
  ): Record<string, unknown> {
    const cartRaw = params.cartServiceIds ?? session.cartServiceIds;
    const cartServiceIds =
      typeof cartRaw === 'string'
        ? cartRaw
        : Array.isArray(cartRaw)
          ? cartRaw.join(',')
          : undefined;
    return {
      ...params,
      cartServiceIds,
      _prompt: prompt,
    };
  }

  private async handleBookMultiService(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
    session: Record<string, unknown>,
  ): Promise<PublicAssistantResult> {
    const result = await this.selfServiceBooking.handleBookMultiService(
      businessId,
      this.mergeMultiServiceSessionParams(params, session, prompt),
    );
    return commandResultToPublicAssistantResult(result);
  }

  private async handleDiscoverPackages(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
    session: Record<string, unknown>,
  ): Promise<PublicAssistantResult> {
    const result =
      await this.selfServiceBooking.handleDiscoverPackages(businessId);
    return commandResultToPublicAssistantResult({
      ...result,
      details: {
        ...(result.details ?? {}),
        sessionContext: {
          ...(typeof result.details?.sessionContext === 'object'
            ? (result.details.sessionContext as Record<string, unknown>)
            : {}),
          packageName: params.packageName ?? session.packageName,
          packageId: params.packageId ?? session.packageId,
        },
      },
    });
  }

  private async handleBookPackage(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
    session: Record<string, unknown>,
  ): Promise<PublicAssistantResult> {
    const merged = {
      ...params,
      packageId: params.packageId ?? session.packageId,
      packageName: params.packageName ?? session.packageName,
      _prompt: prompt,
    };
    const result = await this.selfServiceBooking.handleBookPackage(
      businessId,
      merged,
    );
    return commandResultToPublicAssistantResult(result);
  }

  private async handleCheckMultiServiceAvailability(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
    session: Record<string, unknown>,
  ): Promise<PublicAssistantResult> {
    const result =
      await this.selfServiceBooking.handleCheckMultiServiceAvailability(
        businessId,
        this.mergeMultiServiceSessionParams(params, session, prompt),
        prompt,
      );
    return commandResultToPublicAssistantResult(result);
  }

  private async handlePreviewMultiServiceCart(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
    session: Record<string, unknown>,
  ): Promise<PublicAssistantResult> {
    const result = await this.selfServiceBooking.handlePreviewMultiServiceCart(
      businessId,
      this.mergeMultiServiceSessionParams(params, session, prompt),
      prompt,
    );
    return commandResultToPublicAssistantResult(result);
  }

  private async handleSuggestPackageBlock(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
    session: Record<string, unknown>,
  ): Promise<PublicAssistantResult> {
    const merged = {
      ...params,
      packageId: params.packageId ?? session.packageId,
      packageName: params.packageName ?? session.packageName,
      _prompt: prompt,
    };
    const result = await this.selfServiceBooking.handleSuggestPackageBlock(
      businessId,
      merged,
    );
    return commandResultToPublicAssistantResult(result);
  }

  private async handleAddServicesToCart(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
    session: Record<string, unknown>,
  ): Promise<PublicAssistantResult> {
    const result = await this.selfServiceBooking.handleAddServicesToCart(
      businessId,
      this.mergeMultiServiceSessionParams(params, session, prompt),
    );
    return commandResultToPublicAssistantResult(result);
  }

  private async handleExplainDataRights(
    businessId: string,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.businessCompliance.handleExplainDataRights(
      businessId,
      { _prompt: prompt },
      prompt,
    );
    const aspect = result.details?.aspect;
    const navigate =
      aspect === 'export' || aspect === 'delete'
        ? { path: 'account' as const, query: { section: 'privacy' } }
        : undefined;

    return {
      success: result.success,
      action: result.action ?? 'explain_data_rights',
      summary: result.summary,
      details: result.details,
      navigate,
    };
  }

  private async handleListMyTestResults(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.consumerClinicTestResults.handleListMyTestResults(
      businessId,
      params,
      prompt,
    );
    return {
      success: result.success,
      action: result.action ?? 'list_my_test_results',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleExplainResultStatus(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result =
      await this.consumerClinicTestResults.handleExplainResultStatus(
        businessId,
        params,
        prompt,
      );
    return {
      success: result.success,
      action: result.action ?? 'explain_result_status',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleListMyLabBookingRequests(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.clinicLabBooking.handleListMyLabBookingRequests(
      businessId,
      params,
      prompt,
    );
    return {
      success: result.success,
      action: result.action ?? 'list_my_lab_booking_requests',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleBookLabCollection(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.clinicLabBooking.handleBookLabCollection(
      businessId,
      params,
      prompt,
    );
    return {
      success: result.success,
      action: result.action ?? 'book_lab_collection',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleExplainStripeCheckoutCurrency(
    businessId: string,
  ): Promise<PublicAssistantResult> {
    const result =
      await this.businessCurrency.handleExplainStripeCheckoutCurrency(
        businessId,
      );
    return {
      success: result.success,
      action: result.action ?? 'explain_stripe_checkout_currency',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleExplainPackageCurrency(
    businessId: string,
  ): Promise<PublicAssistantResult> {
    const result =
      await this.businessCurrency.handleExplainPackageCurrency(businessId);
    return {
      success: result.success,
      action: result.action ?? 'explain_package_currency',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleExplainPackageDisplayName(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
    visitorLocale: AppLocale,
  ): Promise<PublicAssistantResult> {
    const result =
      await this.packageLocalizedNames.handleExplainPackageDisplayName(
        businessId,
        params,
        prompt,
        visitorLocale,
      );
    return {
      success: result.success,
      action: result.action ?? 'explain_package_display_name',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleExplainTourBooking(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.tourService.handleExplainTourBooking(
      businessId,
      params,
      prompt,
    );
    return {
      success: result.success,
      action: result.action ?? 'explain_tour_booking',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleExplainTourMeetingPoint(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.tourService.handleExplainTourMeetingPoint(
      businessId,
      params,
      prompt,
    );
    return {
      success: result.success,
      action: result.action ?? 'explain_tour_meeting_point',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleExplainClinicBooking(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.clinicBooking.handleExplainClinicBooking(
      businessId,
      params,
      prompt,
    );
    return {
      success: result.success,
      action: result.action ?? 'explain_clinic_booking',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleExplainLabPrep(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.clinicBooking.handleExplainLabPrep(
      businessId,
      params,
      prompt,
    );
    return {
      success: result.success,
      action: result.action ?? 'explain_lab_prep',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleExplainClinicBookingFields(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.clinicBooking.handleExplainClinicBookingFields(
      businessId,
      params,
      prompt,
    );
    return {
      success: result.success,
      action: result.action ?? 'explain_clinic_booking_fields',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleExplainPublicIntakeForm(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.clinicBooking.handleExplainPublicIntakeForm(
      businessId,
      params,
      prompt,
    );
    return {
      success: result.success,
      action: result.action ?? 'explain_public_intake_form',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleCompleteIntakeAndBook(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.clinicBooking.handleCompleteIntakeAndBook(
      businessId,
      params,
      prompt,
    );
    return {
      success: result.success,
      action: result.action ?? 'complete_intake_and_book',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleExplainGuestCheckoutFields(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result =
      await this.guestCheckoutFields.handleExplainGuestCheckoutFields(
        businessId,
        params,
        prompt,
      );
    return {
      success: result.success,
      action: result.action ?? 'explain_guest_checkout_fields',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleExplainWhySignIn(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.guestCheckoutFields.handleExplainWhySignIn(
      businessId,
      params,
      prompt,
    );
    return {
      success: result.success,
      action: result.action ?? 'explain_why_sign_in',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleExplainManageBookingPage(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.selfServiceBooking.handleExplainManageBookingPage(
      businessId,
      params,
      prompt,
    );
    return {
      success: result.success,
      action: result.action ?? 'explain_manage_booking_page',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleSignInToManageBooking(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.selfServiceBooking.handleSignInToManageBooking(
      businessId,
      params,
      prompt,
    );
    return {
      success: result.success,
      action: result.action ?? 'sign_in_to_manage_booking',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleRecoverLostManageLink(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.selfServiceBooking.handleRecoverLostManageLink(
      businessId,
      params,
      prompt,
    );
    return {
      success: result.success,
      action: result.action ?? 'recover_lost_manage_link',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleFixCheckoutValidationError(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result =
      await this.guestCheckoutFields.handleFixCheckoutValidationError(
        businessId,
        params,
        prompt,
      );
    return {
      success: result.success,
      action: result.action ?? 'fix_checkout_validation_error',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleConfirmMyBookingDetails(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.selfServiceBooking.handleConfirmMyBookingDetails(
      businessId,
      params,
      prompt,
    );
    return {
      success: result.success,
      action: result.action ?? 'confirm_my_booking_details',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleLeaveVisitReview(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.selfServiceBooking.handleLeaveVisitReview(
      businessId,
      params,
      prompt,
    );
    return {
      success: result.success,
      action: result.action ?? 'leave_visit_review',
      summary: result.summary,
      details: result.details,
      navigate: result.details?.navigate as PublicAssistantResult['navigate'],
    };
  }

  private async handleExplainManageBookingContext(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result =
      await this.selfServiceBooking.handleExplainManageBookingContext(
        businessId,
        params,
        prompt,
      );
    return {
      success: result.success,
      action: result.action ?? 'explain_manage_booking_context',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleCancelBookingWithToken(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.selfServiceBooking.handleCancelBookingWithToken(
      businessId,
      params,
      prompt,
    );
    return {
      success: result.success,
      action: result.action ?? 'cancel_booking_with_token',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleRescheduleBookingWithToken(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result =
      await this.selfServiceBooking.handleRescheduleBookingWithToken(
        businessId,
        params,
        prompt,
      );
    return {
      success: result.success,
      action: result.action ?? 'reschedule_booking_with_token',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleCancelPackageVisitWithToken(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result =
      await this.selfServiceBooking.handleCancelPackageVisitWithToken(
        businessId,
        params,
        prompt,
      );
    return {
      success: result.success,
      action: result.action ?? 'cancel_package_visit_with_token',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleReschedulePackageVisitWithToken(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result =
      await this.selfServiceBooking.handleReschedulePackageVisitWithToken(
        businessId,
        params,
        prompt,
      );
    return {
      success: result.success,
      action: result.action ?? 'reschedule_package_visit_with_token',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleRescheduleMyBooking(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.selfServiceBooking.handleRescheduleMyBooking(
      businessId,
      params,
      prompt,
    );
    return {
      success: result.success,
      action: result.action ?? 'reschedule_my_booking',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleCancelMyBooking(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.selfServiceBooking.handleCancelMyBooking(
      businessId,
      params,
      prompt,
    );
    return {
      success: result.success,
      action: result.action ?? 'cancel_my_booking',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleJoinWaitlist(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.selfServiceBooking.handleJoinWaitlist(
      businessId,
      params,
      prompt,
    );
    return {
      success: result.success,
      action: result.action ?? 'join_waitlist',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleCheckWaitlistStatus(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.selfServiceBooking.handleCheckWaitlistStatus(
      businessId,
      params,
      prompt,
    );
    return {
      success: result.success,
      action: result.action ?? 'check_waitlist_status',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleAddBookingToCalendar(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.selfServiceBooking.handleAddBookingToCalendar(
      businessId,
      params,
      prompt,
    );
    return {
      success: result.success,
      action: result.action ?? 'add_booking_to_calendar',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleBookAnotherService(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.selfServiceBooking.handleBookAnotherService(
      businessId,
      params,
      prompt,
    );
    return {
      success: result.success,
      action: result.action ?? 'book_another_service',
      summary: result.summary,
      details: result.details,
      navigate: result.details?.navigate as PublicAssistantNavigate | undefined,
    };
  }

  private async handleExplainPreparationNotes(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.selfServiceBooking.handleExplainPreparationNotes(
      businessId,
      params,
      prompt,
    );
    return {
      success: result.success,
      action: result.action ?? 'explain_preparation_notes',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleExplainTourDaySlots(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.tourService.handleExplainTourDaySlots(
      businessId,
      params,
      prompt,
    );
    return {
      success: result.success,
      action: result.action ?? 'explain_tour_day_slots',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleDiagnoseTourCapacity(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result = await this.tourService.handleDiagnoseTourCapacity(
      businessId,
      params,
      prompt,
    );
    return {
      success: result.success,
      action: result.action ?? 'diagnose_tour_capacity',
      summary: result.summary,
      details: result.details,
    };
  }

  private async handleExplainCheckoutRecommendations(
    businessId: string,
    params: Record<string, unknown>,
    prompt: string,
  ): Promise<PublicAssistantResult> {
    const result =
      await this.recommendationProduct.handleExplainCheckoutRecommendations(
        businessId,
        params,
        prompt,
      );
    return {
      success: result.success,
      action: result.action ?? 'explain_checkout_recommendations',
      summary: result.summary,
      details: result.details,
    };
  }

  private handleBusinessInfo(business: {
    name: string;
    description?: string;
    phone?: string;
    email?: string;
    address?: string;
    settings?: Record<string, any> | null;
  }): PublicAssistantResult {
    const parts = [`${business.name}`];
    if (business.description) parts.push(business.description);
    if (business.address) parts.push(`Address: ${business.address}`);
    if (business.phone) parts.push(`Phone: ${business.phone}`);
    if (business.email) parts.push(`Email: ${business.email}`);

    const privacy = toPublicBusinessPrivacySettings(
      readBusinessPrivacySettings(business.settings ?? undefined),
    );
    parts.push(
      `Privacy: policy v${privacy.privacyPolicyVersion}` +
        (privacy.requireAiProcessingConsent
          ? ' · AI-processing consent required'
          : '') +
        (privacy.dataResidencyRegion !== 'other'
          ? ` · data hosted in ${privacy.dataResidencyRegion.toUpperCase()}`
          : ''),
    );

    const appInstall = readTenantAppInstallSettings(business.settings);
    if (appInstall) {
      parts.push(`Get our app: ${appInstall.landingUrl}`);
    }

    return {
      success: true,
      action: 'business_info',
      summary: parts.join('\n'),
      navigate: { path: 'profile', query: {} },
    };
  }

  private async handleBookingHelp(
    businessId: string,
    prompt: string,
    locale: AppLocale,
    sessionContext?: Record<string, unknown>,
  ): Promise<PublicAssistantResult> {
    const guideResult = await this.dispatchPublicAppGuideIntent(
      businessId,
      prompt,
      resolvePublicBookingGuideIntent(
        prompt,
        mapPublicBookingGuideRoute(
          mergePublicBookingGuideContext(sessionContext),
        ),
      ),
      locale,
      sessionContext,
      {},
      'booking_help',
    );

    if (guideResult.success && guideResult.guide) {
      return commandResultToPublicAssistantResult(guideResult);
    }

    return commandResultToPublicAssistantResult(
      rewriteBookingHelpGuideResult(
        {
          success: true,
          action: 'booking_help',
          summary:
            locale === 'hy'
              ? 'Ամրագրման քայլերը հասանելի չեն — փորձեք նորից կամ ընտրեք Professionals էջը։'
              : locale === 'ru'
                ? 'Шаги записи недоступны — попробуйте снова или откройте страницу специалистов.'
                : 'Booking guide steps are unavailable — try again or open the Professionals page.',
          details: {
            navigate: { path: 'professionals' },
            guideRoute: mapPublicBookingGuideRoute(
              mergePublicBookingGuideContext(sessionContext),
            ),
          },
        },
        mapPublicBookingGuideRoute(
          mergePublicBookingGuideContext(sessionContext),
        ),
      ),
    );
  }

  /** ai-guide-1.5.3 — checkout-step context drives public guide playbook selection. */
  private async dispatchPublicAppGuideIntent(
    businessId: string,
    prompt: string,
    intent: AppGuideIntent,
    locale: AppLocale,
    sessionContext?: Record<string, unknown>,
    params: Record<string, unknown> = {},
    surrogateAction?: 'booking_help',
  ): Promise<CommandResult> {
    const mergedContext = mergePublicBookingGuideContext({
      ...sessionContext,
      locale,
    });
    const guideContext = resolveProductGuideSessionContext(
      { context: mergedContext },
      'public',
    );
    const route =
      guideContext.route ?? mapPublicBookingGuideRoute(mergedContext);
    const resolvedIntent = resolvePublicBookingGuideIntent(
      prompt,
      route,
      intent,
    );
    const topicId = enrichGuideTopicFromPrompt(prompt, {
      surface: 'public',
      route,
      topicId: params.topicId,
    });
    const guideParams = topicId ? { ...params, topicId } : params;

    const guideResult = mapCommandResultGuideNavigate(
      await runSurfaceProductGuideIntent({
        productGuide: this.productGuide,
        businessId,
        prompt: prompt.trim() || 'How do I book online?',
        intent: resolvedIntent,
        surface: 'public',
        locale,
        params: guideParams,
        session: { context: mergedContext },
        sessionContext: guideContext,
      }),
    );

    const rewritten = surrogateAction
      ? rewriteBookingHelpGuideResult(guideResult, route)
      : {
          ...guideResult,
          details: {
            ...guideResult.details,
            guideRoute: route,
            guideIntent: resolvedIntent,
            bookingStep:
              typeof mergedContext.bookingStep === 'string'
                ? mergedContext.bookingStep
                : undefined,
          },
          guide: guideResult.guide
            ? {
                ...guideResult.guide,
                navigate:
                  guideResult.guide.navigate ??
                  resolvePublicBookingGuideNavigate(route),
              }
            : undefined,
        };

    return rewritten;
  }

  /** ai-guide-1.8.9 — public booking live catalog / Stripe empty-state guides. */
  private async dispatchPublicEmptyStateGuideIntent(
    businessId: string,
    prompt: string,
    intent: EmptyStateGuideIntent,
    locale: AppLocale,
    sessionContext?: Record<string, unknown>,
    params: Record<string, unknown> = {},
  ): Promise<CommandResult> {
    if (
      !isEmptyStateGuideIntent(intent) ||
      intent === 'explain_visibility_block'
    ) {
      return {
        success: false,
        action: intent,
        summary: 'Unsupported empty-state guide intent on public booking.',
        details: {},
      };
    }
    const mergedContext = mergePublicBookingGuideContext({
      ...sessionContext,
      locale,
    });
    const guideContext = resolveProductGuideSessionContext(
      { context: mergedContext },
      'public',
    );
    return mapCommandResultGuideNavigate(
      await this.emptyStateGuide.runIntent({
        businessId,
        intent,
        surface: 'public',
        prompt,
        params,
        session: { context: mergedContext },
        sessionContext: guideContext,
        locale,
      }),
    );
  }

  private async handleBookAppointment(
    slug: string,
    params: any,
    employees: Employee[],
    services: Service[],
    locale: AppLocale,
    prompt = '',
  ): Promise<PublicAssistantResult> {
    const business = await this.publicBookingService.resolveBusiness(slug);
    const tz = resolveTimezone(business.timezone);

    // tech-debt D5 — a tie here books a guest with the wrong specialist and
    // tells them it worked. Name-first precedence is preserved deliberately
    // (see resolveProviderVerdict); only the tie behaviour changes.
    const providerVerdict = params.employeeName
      ? this.resolveProviderVerdict(employees, params.employeeName)
      : null;
    if (providerVerdict && providerVerdict.ambiguous.length > 1) {
      return {
        success: false,
        action: 'book_appointment',
        summary: t(locale, 'assistant.providerAmbiguous', {
          name: params.employeeName,
          options: providerVerdict.ambiguous.map((e) => e.name).join(', '),
        }),
        details: {
          candidates: providerVerdict.ambiguous.map((e) => ({
            id: e.id,
            name: e.name,
          })),
        },
      };
    }
    // tech-debt D5-c — the same tie, one level up, on the *list*.
    //
    // The singular guard above covers `employeeName`. `providerFallbackNames`
    // ("book me with Anna or Maria, otherwise anyone") is resolved further down
    // through `fuzzyMatchByName`, which silently returns the FIRST match and
    // drops what it cannot resolve. So a guest naming an ambiguous provider was
    // booked with whichever Anna happened to sort first — the exact defect the
    // singular path was fixed for, reached by a different parameter.
    //
    // The first ambiguous name is named back rather than the whole list, so the
    // question is about a name the guest actually typed. This mirrors the
    // dashboard guard in `ai-booking-core.service.ts` (slice 10); the two
    // surfaces answer this the same way even though their *precedence* rules
    // deliberately differ.
    const fallbackNames: string[] = Array.isArray(params.providerFallbackNames)
      ? params.providerFallbackNames.filter(
          (n: unknown): n is string => typeof n === 'string' && !!n.trim(),
        )
      : [];
    for (const requested of fallbackNames) {
      const verdict = this.resolveProviderVerdict(employees, requested);
      if (verdict.ambiguous.length > 1) {
        return {
          success: false,
          action: 'book_appointment',
          summary: t(locale, 'assistant.providerAmbiguous', {
            name: requested,
            options: verdict.ambiguous.map((e) => e.name).join(', '),
          }),
          details: {
            candidates: verdict.ambiguous.map((e) => ({
              id: e.id,
              name: e.name,
            })),
          },
        };
      }
    }

    const employee = params.employeeName
      ? providerVerdict?.match
      : params.employeeId
        ? employees.find((e) => e.id === params.employeeId)
        : undefined;

    const matchedServices = this.resolveServicesFromParams(params, services);
    const catalogPool =
      matchedServices.length > 0
        ? matchedServices.map((entry) => ({
            id: entry.id,
            name: entry.name,
            price: Number(entry.price),
            durationMinutes: entry.durationMinutes,
          }))
        : services.map((entry) => ({
            id: entry.id,
            name: entry.name,
            price: Number(entry.price),
            durationMinutes: entry.durationMinutes,
          }));
    const discoverResolved = resolveDiscoverConstrainedService(catalogPool, {
      serviceId: params.serviceId,
      serviceName: params.serviceName,
      serviceCategory: params.serviceCategory,
      maxPrice: params.maxPrice,
      serviceRank: params.serviceRank,
    });
    if (discoverResolved.noMatchSummary) {
      return {
        success: false,
        action: 'book_appointment',
        summary: discoverResolved.noMatchSummary,
      };
    }
    const service = discoverResolved.service
      ? services.find((entry) => entry.id === discoverResolved.service!.id)
      : undefined;

    if (params.employeeName && !employee) {
      return {
        success: false,
        action: 'book_appointment',
        summary: `Specialist "${params.employeeName}" not found. Available: ${employees.map((e) => e.name).join(', ')}`,
      };
    }

    if ((params.serviceName || params.serviceCategory) && !service) {
      return {
        success: false,
        action: 'book_appointment',
        summary: `Service "${params.serviceCategory ?? params.serviceName}" not found. Available: ${services.map((s) => s.name).join(', ')}`,
      };
    }

    if (params.bookingFirstAvailable) {
      if (!service) {
        return {
          success: false,
          action: 'book_appointment',
          summary: t(locale, 'assistant.nearestNeedsService'),
        };
      }

      const slotQuery = buildNearestBookableSlotQuery(
        params,
        prompt,
        employee?.id ?? null,
      );
      const windowQueries = buildNearestAvailabilityWindowQueries(
        params,
        prompt,
        tz,
      );

      const nearestResult =
        await this.publicBookingService.findNearestBookableSlotAcrossWindows(
          slug,
          {
            serviceId: service.id,
            employeeId: slotQuery.employeeId,
            windows: windowQueries,
          },
        );

      if (!nearestResult) {
        const summary =
          locale === 'en'
            ? buildNoNearestSlotMessage({
                serviceName: service.name,
                dateKey: slotQuery.startDateKey,
                timeOfDay: slotQuery.timeOfDay,
                notBeforeTime: slotQuery.notBeforeTime,
              })
            : t(locale, 'assistant.noNearestSlot', {
                service: service.name,
                after: slotQuery.notBeforeTime
                  ? ` after ${slotQuery.notBeforeTime}`
                  : '',
              });
        return this.withBookAppointmentHandoff(
          {
            success: false,
            action: 'book_appointment',
            summary,
          },
          params,
        );
      }

      Object.assign(
        params,
        applyChosenAvailabilityWindowToParams(params, nearestResult),
      );
    }

    const wantsProviderFallback =
      !params.bookingFirstAvailable &&
      !!params.date &&
      !!params.timeSlot &&
      (params.fallbackAnyProvider === true ||
        (Array.isArray(params.providerFallbackNames) &&
          params.providerFallbackNames.length > 0));

    if (wantsProviderFallback && service) {
      const isoDay = toIsoDay(params.date, tz);
      const priorityNames: string[] = Array.isArray(
        params.providerFallbackNames,
      )
        ? params.providerFallbackNames
        : employee
          ? [employee.name]
          : [];

      const providerPriority = priorityNames
        .map((name) => this.fuzzyMatchByName(employees, name))
        .filter((e): e is Employee => !!e)
        .map((e) => ({ id: e.id, name: e.name }));

      const pick = await this.slotResolver.resolveWithFallback({
        businessId: business.id,
        serviceId: service.id,
        isoDay,
        timeSlot: params.timeSlot,
        timeZone: tz,
        providerPriority,
        fallbackAnyProvider: params.fallbackAnyProvider === true,
        allActiveProviders: employees.map((e) => ({ id: e.id, name: e.name })),
      });

      if (!pick) {
        const tried =
          providerPriority.map((p) => p.name).join(', ') ||
          'requested specialists';
        return {
          success: false,
          action: 'book_appointment',
          summary: `Sorry — no one is available for ${service.name} at ${this.snapTo10min(params.timeSlot)} on ${formatDateDisplay(isoDay, locale)}. We tried: ${tried}${
            params.fallbackAnyProvider ? ' and other specialists' : ''
          }.`,
        };
      }

      params.employeeId = pick.employeeId;
      params.employeeName = pick.employeeName;
      params.timeSlot = pick.timeSlot;
      params.date = pick.isoDay;
      params.startTime = pick.startTime;
    }

    const resolvedEmployee =
      employee ??
      (params.employeeId
        ? employees.find((e) => e.id === params.employeeId)
        : params.employeeName
          ? this.fuzzyMatchByName(employees, params.employeeName)
          : undefined);
    const resolvedService = service;

    if (
      !params.bookingFirstAvailable &&
      resolvedEmployee &&
      resolvedService &&
      params.timeSlot &&
      !params.date &&
      !params.startTime
    ) {
      const resolved = await this.resolveBookableStartTime(
        slug,
        resolvedEmployee,
        resolvedService,
        params,
        tz,
      );
      if (resolved) {
        params.date = resolved.dateKey;
        params.timeSlot = resolved.timeSlot;
        params.startTime = resolved.startTime;
      }
    }

    const missing: string[] = [];
    if (!resolvedEmployee) missing.push('specialist');
    if (!resolvedService) missing.push('service');
    if (!params.bookingFirstAvailable && !params.date) missing.push('date');
    if (!params.bookingFirstAvailable && !params.timeSlot) missing.push('time');

    if (
      missing.length > 0 ||
      !resolvedEmployee ||
      !resolvedService ||
      (!params.bookingFirstAvailable && (!params.date || !params.timeSlot))
    ) {
      const navigateQuery: Record<string, string> = {};
      if (resolvedEmployee) navigateQuery.employeeId = resolvedEmployee.id;
      if (resolvedService) navigateQuery.serviceId = resolvedService.id;
      if (params.date && params.timeSlot) {
        navigateQuery.startTime = `${params.date}T${this.snapTo10min(params.timeSlot)}:00.000Z`;
      } else if (resolvedEmployee && params.date) {
        const { slots } = await this.publicBookingService.getProviderSlots(
          slug,
          resolvedEmployee.id,
          params.date,
          resolvedService ? { serviceId: resolvedService.id } : undefined,
        );
        if (slots[0]) navigateQuery.startTime = slots[0].startTime;
      }

      const canCheckout =
        !!navigateQuery.employeeId &&
        !!navigateQuery.startTime &&
        !!navigateQuery.serviceId;

      return {
        success: false,
        action: 'book_appointment',
        summary: `To finish booking I still need: ${missing.join(', ') || 'a valid time slot'}. You can also continue in the booking flow — I've pre-filled what I could.`,
        navigate: {
          path: canCheckout
            ? 'checkout'
            : navigateQuery.startTime
              ? 'services'
              : 'professionals',
          query: navigateQuery,
        },
      };
    }

    const snappedTime = this.snapTo10min(params.timeSlot);
    const startTime =
      params.startTime ?? `${params.date}T${snappedTime}:00.000Z`;

    const { services: slotServices } =
      await this.publicBookingService.getServicesForSlot(
        slug,
        resolvedEmployee.id,
        startTime,
      );
    const fits = slotServices.some((s) => s.id === resolvedService.id);
    if (!fits) {
      const fit = await this.publicBookingService.explainServiceSlotFit(
        slug,
        resolvedEmployee.id,
        startTime,
        resolvedService.id,
      );
      const summary = this.buildServiceUnfitSummary(
        resolvedService,
        resolvedEmployee,
        params.date,
        snappedTime,
        slotServices,
        fit,
        locale,
      );
      return {
        success: false,
        action: 'book_appointment',
        summary,
        navigate: {
          path: 'services',
          query: { employeeId: resolvedEmployee.id, startTime },
        },
      };
    }

    const hasContact = params.customerEmail || params.customerPhone;
    if (!params.customerName || !hasContact) {
      return this.withBookAppointmentHandoff(
        {
          success: true,
          action: 'book_appointment',
          summary: `Great — ${resolvedService.name} with ${resolvedEmployee.name} on ${formatDateDisplay(params.date, locale)} at ${snappedTime}. Please add your name and email or phone on the checkout screen to confirm.`,
          navigate: {
            path: 'checkout',
            query: {
              employeeId: resolvedEmployee.id,
              startTime,
              serviceId: resolvedService.id,
            },
          },
        },
        params,
      );
    }

    const dto: CreatePublicBookingDto = {
      employeeId: resolvedEmployee.id,
      serviceId: resolvedService.id,
      startTime,
      customer: {
        name: params.customerName,
        email: params.customerEmail || undefined,
        phone: params.customerPhone || undefined,
      },
      notes: params.notes || undefined,
    };

    try {
      const { booking } = await this.publicBookingService.createBooking(
        slug,
        dto,
      );
      const bookingId = (booking as any)?.id;
      const range = formatTimeRangeDisplay(
        startTime,
        new Date(
          new Date(startTime).getTime() +
            (resolvedService.durationMinutes + resolvedService.bufferMinutes) *
              60000,
        ),
      );

      return this.withBookAppointmentHandoff(
        {
          success: true,
          action: 'book_appointment',
          summary: `You're booked! ${resolvedService.name} with ${resolvedEmployee.name} on ${formatDateDisplay(params.date, locale)} (${range}).`,
          bookingId,
        },
        params,
      );
    } catch (err: any) {
      return this.withBookAppointmentHandoff(
        {
          success: false,
          action: 'book_appointment',
          summary:
            err?.message ||
            'That slot is no longer available. Please pick another time.',
          navigate: {
            path: 'professionals',
            query: { employeeId: resolvedEmployee.id, startTime },
          },
        },
        params,
      );
    }
  }

  private applyPublicBookingHelpRescue(
    prompt: string,
    action: string,
  ): { action: string; rescueReason: string } | null {
    const rescued = rescueProductGuideIntent(prompt, action, {
      surface: 'public',
    });
    if (rescued.action === action) return null;
    return {
      action: rescued.action,
      rescueReason: rescued.rescueReason ?? 'public_booking_help',
    };
  }

  private applyBudgetAndRankServiceDiscoveryRescue(
    prompt: string,
    action: string,
  ): {
    action: string;
    rescueReason: string;
    params?: Record<string, unknown>;
  } | null {
    const eveningWeekendChipRescue = rescueFindEveningWeekendSlotsIntent(
      prompt,
      action,
    );
    if (eveningWeekendChipRescue) {
      return {
        ...eveningWeekendChipRescue,
        params: parseFindEveningWeekendSlotsFromPrompt(prompt) ?? {},
      };
    }

    const budgetChipRescue = rescueFindServicesUnderBudgetIntent(
      prompt,
      action,
    );
    if (budgetChipRescue) {
      return {
        ...budgetChipRescue,
        params: parseFindServicesUnderBudgetFromPrompt(prompt) ?? {},
      };
    }

    const paymentFilterRescue = rescueListServicesPaymentFilterIntent(
      prompt,
      action,
    );
    if (paymentFilterRescue) {
      return {
        ...paymentFilterRescue,
        params: enrichListServicesPaymentFilterParamsFromPrompt({}, prompt),
      };
    }

    const rankDiscoveryRescue = rescueServiceRankDiscoveryIntent(
      prompt,
      action,
      'public',
    );
    if (rankDiscoveryRescue) return rankDiscoveryRescue;

    const catalogBrowseRescue = rescueServiceCatalogBrowseIntent(
      prompt,
      action,
    );
    const resolvedBrowseAction = catalogBrowseRescue?.action ?? action;
    const budgetRescue = rescueBudgetServiceDiscoveryIntent(
      prompt,
      resolvedBrowseAction,
      'public',
    );
    const resolvedAction = budgetRescue?.action ?? resolvedBrowseAction;
    const rankRescue = rescueServiceRankFromRecommendSpecialistsIntent(
      prompt,
      resolvedAction,
    );
    return rankRescue ?? budgetRescue ?? catalogBrowseRescue ?? null;
  }

  private pipelineClarifyToPublicResult(
    understood: PipelineUnderstandResult,
    locale: AppLocale,
  ): PublicAssistantResult {
    const clarifyPayload = {
      summary: understood.clarifySummary ?? t(locale, 'assistant.unknown'),
      clarifyFields: understood.clarifyFields ?? ['intentChoice'],
      suggestions: understood.clarifySuggestions ?? [],
      loweredConfidence: understood.confidence,
      ruleId:
        understood.blockReason?.replace('self_verify clarify: ', '') ??
        'unknown',
      reason: understood.blockReason ?? 'self_verify_clarify',
    };
    return commandResultToPublicAssistantResult(
      buildPipelineClarifyCommandResult(understood, clarifyPayload),
    );
  }

  private async classifyIntent(
    businessId: string,
    normalizedPrompt: string,
    systemContext: string,
    history?: Array<{ role: 'user' | 'assistant'; content: string }>,
    sessionContext?: Record<string, any>,
    locale: AppLocale = 'en',
  ): Promise<ClassifiedIntent | null> {
    const sessionBlock =
      sessionContext &&
      Object.values(sessionContext).some((v) => v != null && v !== '')
        ? `\n\nActive session:\n${JSON.stringify(sessionContext, null, 2)}`
        : '';

    const historyMessages = (history ?? []).slice(-8).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: `${systemContext}${sessionBlock}`,
      },
      ...historyMessages,
      { role: 'user', content: normalizedPrompt },
    ];

    try {
      const response = await this.openAi.chatCompletion(
        {
          businessId,
          surface: 'public_booking',
          operation: 'classify_intent',
          actorType: 'customer',
        },
        {
          messages,
          responseFormat: 'json_object',
          temperature: 0.2,
          maxTokens: 650,
        },
      );

      const raw = response?.choices[0]?.message?.content;
      if (!raw) return null;

      const result = JSON.parse(raw) as {
        action?: string;
        params?: Record<string, unknown>;
        reasoning?: string;
        confidence?: number;
      };
      if (!result?.action) return null;

      return {
        action: result.action,
        params: result.params ?? {},
        reasoning: result.reasoning ?? '',
        confidence:
          typeof result.confidence === 'number' ? result.confidence : undefined,
      };
    } catch (err: any) {
      this.logger.error(
        `Public assistant classification failed: ${err.message}`,
      );
      return null;
    }
  }

  private buildPublicAvailabilityHandoff(
    summary: string,
    params: Record<string, any>,
    availableProviders: string[],
    noProviders: boolean,
    dateKey?: string,
  ): CheckProvidersHandoff {
    return {
      summary,
      serviceName: params.serviceName ?? params.serviceCategory ?? undefined,
      date: dateKey ?? params.date,
      timeOfDay: params.timeOfDay ?? null,
      notBeforeTime: params.timeFrom ?? null,
      availableProviders,
      noProviders,
    };
  }

  private withCheckProvidersHandoff(
    result: PublicAssistantResult,
    handoff: CheckProvidersHandoff,
  ): PublicAssistantResult {
    return {
      ...result,
      details: attachCheckProvidersHandoff(result.details ?? {}, handoff),
    };
  }

  private withBookAppointmentHandoff(
    result: PublicAssistantResult,
    params: Record<string, any>,
  ): PublicAssistantResult {
    const handoff = pickCheckProvidersHandoff(params);
    if (!handoff) return result;
    return {
      ...result,
      details: attachCheckProvidersHandoff(result.details ?? {}, handoff),
    };
  }

  private mergeSessionContext(
    params: Record<string, any>,
    session?: Record<string, any>,
    action?: string,
  ) {
    return mergePublicAssistantSessionParams(params, session, action) as Record<
      string,
      any
    >;
  }

  private buildServiceUnfitSummary(
    service: Service,
    employee: Employee,
    date: string,
    time: string,
    slotServices: Array<{
      name: string;
      durationMinutes: number;
      bufferMinutes: number;
    }>,
    fit: {
      requiredMinutes?: number;
      remainingMinutes?: number;
      availableUntil?: Date;
      failureReason?: string;
      message?: string;
    },
    locale: AppLocale,
  ): string {
    const dateStr = formatDateDisplay(date, locale);
    const lines: string[] = [
      `${service.name} isn't available at ${time} on ${dateStr}.`,
    ];

    const required =
      fit.requiredMinutes ?? service.durationMinutes + service.bufferMinutes;
    const remaining = fit.remainingMinutes;
    const until = fit.availableUntil
      ? formatTimeDisplay(fit.availableUntil)
      : null;

    if (
      (fit.failureReason === 'duration' ||
        fit.failureReason === 'service_period') &&
      until &&
      remaining !== undefined &&
      remaining < required
    ) {
      lines.push(
        `${employee.name} is only available until ${until} — that leaves ${remaining} minutes from ${time}, but ${service.name} needs ${required} minutes.`,
      );
    } else if (fit.failureReason === 'service_restriction') {
      lines.push(
        `${employee.name} does not offer ${service.name} during the entire time window starting at ${time}.`,
      );
    } else if (fit.message) {
      lines.push(fit.message);
    }

    if (slotServices.length > 0) {
      const list = slotServices
        .map((s) => `${s.name} (${s.durationMinutes + s.bufferMinutes} min)`)
        .join(', ');
      lines.push(`Services you can book at that time: ${list}.`);
      if (remaining !== undefined && remaining < required) {
        lines.push(
          `Try an earlier start time so the full ${required}-minute appointment fits, or choose one of the shorter services above.`,
        );
      }
    } else {
      lines.push(
        'No services fit that time slot. Please choose a different time.',
      );
    }

    return lines.join('\n');
  }

  private normalizeDateParams(
    params: Record<string, any>,
    fallbackDateKey: string,
    timeZone?: string,
  ) {
    // e2e-bug.296 — resolve "today"/"tonight" in the business TZ, not UTC default
    // (UTC can be previous calendar day and dropPast then empties dateKeys).
    const tz = timeZone ?? 'UTC';
    if (params.date) {
      params.date = toIsoDay(params.date, tz) ?? fallbackDateKey;
    }
    if (params.dateFrom) {
      params.dateFrom = toIsoDay(params.dateFrom, tz) ?? params.dateFrom;
    }
    if (params.dateTo) {
      params.dateTo = toIsoDay(params.dateTo, tz) ?? params.dateTo;
    }
    if (Array.isArray(params.availabilityWindows)) {
      params.availabilityWindows = params.availabilityWindows.map(
        (entry: Record<string, unknown>) => {
          if (!entry || typeof entry !== 'object') return entry;
          if (typeof entry.date === 'string' && entry.date.trim()) {
            return {
              ...entry,
              date: toIsoDay(entry.date, tz) ?? entry.date,
            };
          }
          return entry;
        },
      );
    }
  }

  private attachSession(
    result: PublicAssistantResult,
    params: Record<string, any>,
    employees: Employee[],
    services: Service[],
    locale: AppLocale,
  ): PublicAssistantResult {
    // tech-debt D5 — this decorates a result that is already built, so it has
    // nowhere to ask a question. It does not need one: leaving a tie unresolved
    // makes the line below fall through to `params.employeeName`, so the
    // session records the words the guest actually typed rather than a guessed
    // namesake that would then steer later turns.
    const employee = params.employeeName
      ? this.resolveProviderVerdict(employees, params.employeeName).match
      : undefined;

    const handoff = result.details?.checkProvidersHandoff as
      | CheckProvidersHandoff
      | undefined;

    const sessionService = resolvePublicAssistantSessionServiceFields(
      params,
      services,
    );

    return {
      ...result,
      sessionContext: {
        employeeName: employee?.name ?? params.employeeName ?? null,
        date: params.date ? formatDateDisplay(params.date, locale) : null,
        serviceName: sessionService.serviceName,
        serviceCategory: sessionService.serviceCategory,
        serviceId:
          result.sessionContext?.serviceId ??
          (typeof params.serviceId === 'string' ? params.serviceId : null),
        ...serializePublicAssistantDiscoverySessionFields({
          ...params,
          timeOfDay:
            (params.timeOfDay as string | undefined) ??
            handoff?.timeOfDay ??
            undefined,
        }),
        timeSlot: params.timeSlot ?? null,
        customerName: params.customerName ?? null,
        customerEmail: params.customerEmail ?? null,
        customerPhone: params.customerPhone ?? null,
        priorCheckSummary: handoff?.summary ?? null,
      },
    };
  }

  private fuzzyMatchByName<T extends { name: string }>(
    items: T[],
    name: string,
  ): T | undefined {
    // e2e-bug.446 / e2e-bug.362 — this was a third copy of the tiered matcher
    // whose last tier was a raw `lower.includes(item.name)`. That returned an
    // employee called "Al" for "is the salon open" (s-**al**-on) and, worse,
    // for "book Alice for a haircut" — the wrong colleague, confidently.
    // e2e-bug.362 anchored the shared version to word boundaries; the fix never
    // reached the private copies. Delegating rather than re-patching, so the
    // next fix has one place to land.
    return canonicalFuzzyMatchByName(items, name);
  }

  /**
   * Provider resolution that can say "I don't know which one" (tech-debt D5).
   *
   * The guest surface's counterpart to `AiBookingCoreService.resolveNamedVerdict`,
   * with two differences that are deliberate rather than drift:
   *
   * 1. **Name-first precedence is preserved.** This surface resolves
   *    `employeeName` before `employeeId`, the opposite of the dashboard. That
   *    is arguably backwards, but flipping it is a separate behaviour change; a
   *    D5 slice changes the tie and nothing else.
   * 2. **The clarification is localized.** `resolveEntity.clarification` is
   *    English-only, and this surface serves en/hy/ru guests. Returning it
   *    verbatim would be e2e-bug.108 ("raw English error overrides Armenian
   *    translation") a second time, so the caller uses
   *    `assistant.providerAmbiguous` via `t()` instead.
   *
   * `threshold: 0` and the `not_found` fallback match the dashboard slices:
   * acceptance is unchanged, only ties are refused.
   */
  private resolveProviderVerdict(
    employees: Employee[],
    name: string,
  ): { match?: Employee; ambiguous: Employee[] } {
    const verdict = resolveEntity(employees, name, {
      entityLabel: 'provider',
      threshold: 0,
    });
    if (verdict.status === 'ambiguous') {
      return { ambiguous: verdict.candidates };
    }
    return {
      match: verdict.match ?? this.fuzzyMatchByName(employees, name),
      ambiguous: [],
    };
  }

  private snapTo10min(hhmm: string): string {
    const [h, m] = hhmm.split(':').map(Number);
    return `${String(h).padStart(2, '0')}:${String(Math.floor(m / 10) * 10).padStart(2, '0')}`;
  }
}
