import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { resolveLocale, t } from '../../common/i18n/messages.js';
import { LlmService } from '../../engine/agent/llm.service.js';
import { PublicBookingAssistantService } from '../public-booking/public-booking-assistant.service.js';
import { AiPromptSecurityService } from './ai-prompt-security.service.js';
import { AiSettingsService } from './ai-settings.service.js';
import { AiPromptNormalizationService } from './ai-prompt-normalization.service.js';
import { CustomerCommandUnderstandingAdapter } from './customer-command-understanding.adapter.js';
import {
  buildPipelineClarifyCommandResult,
  buildUnknownIntentClarifyResult,
  shouldBlockUnknownFromHandlerSwitch,
} from './ai-unknown-intent.util.js';
import {
  findClassifierCandidate,
  pipelineRescueReason,
  pipelineResultToClassifiedIntent,
} from './command-understanding-result.util.js';
import { AiPlatformService } from './ai-platform.service.js';
import { AiEventsService } from './ai-events.service.js';
import { recordMisrouteTelemetry } from './ai-misroute-telemetry.util.js';
import { AiCustomerCrmService } from './ai-customer-crm.service.js';
import { AiScheduleResourcesService } from './ai-schedule-resources.service.js';
import { AiPaymentsService } from './ai-payments.service.js';
import { AiGiftFulfillmentService } from './ai-gift-fulfillment.service.js';
import { AiIntegrationsService } from './ai-integrations.service.js';
import { AiMarketingGrowthService } from './ai-marketing-growth.service.js';
import { AiPushNotificationsService } from './ai-push-notifications.service.js';
import { AiSelfServiceBookingService } from './ai-self-service-booking.service.js';
import { AiBusinessCurrencyService } from './ai-business-currency.service.js';
import { AiBusinessLanguagesService } from './ai-business-languages.service.js';
import { AiBusinessDateFormatService } from './ai-business-date-format.service.js';
import { AiBusinessHoursLocationService } from './ai-explain-business-hours-and-location.service.js';
import { AiProviderSpecialtyService } from './ai-explain-provider-specialty.service.js';
import { AiBusinessTaxService } from './ai-business-tax.service.js';
import { AiBusinessComplianceService } from './ai-business-compliance.service.js';
import { rescueBudgetServiceDiscoveryIntent } from './ai-budget-service-discovery.util.js';
import {
  parseFindServicesUnderBudgetFromPrompt,
  rescueFindServicesUnderBudgetIntent,
} from './ai-find-services-under-budget.util.js';
import {
  parseFindEveningWeekendSlotsFromPrompt,
  rescueFindEveningWeekendSlotsIntent,
} from './ai-find-evening-weekend-slots.util.js';
import { isIntentAllowed } from './ai-capability.matrix.js';
import {
  appendPostFailureGuideFallback,
  buildPostFailureGuideFallbackInput,
} from './ai-product-guide-failure-fallback.util.js';
import {
  buildAiUnavailableErrorWithGuideLink,
  runAiUnavailableStaticGuideFallback,
} from './ai-product-guide-ai-unavailable.util.js';
import type { CommandResult } from './command-completion.types.js';
import {
  isCompoundPrompt,
  decomposeDeterministicForSurface,
} from './intent-decomposition.util.js';
import {
  rescueServiceRankFromRecommendSpecialistsIntent,
  rescueServiceRankDiscoveryIntent,
} from './ai-service-rank-discovery.util.js';
import { rescueServiceCatalogBrowseIntent } from './ai-service-catalog-browse.util.js';
import { AiTourServiceService } from './ai-tour-service.service.js';
import { AiRecommendationProductService } from './ai-recommendation-product.service.js';
import { AiConsumerClinicTestResultsService } from './ai-consumer-clinic-test-results.service.js';
import { AiClinicLabBookingService } from './ai-clinic-lab-booking.service.js';
import { AiClinicBookingService } from './ai-clinic-booking.service.js';
import { AiGuestCheckoutFieldsService } from './ai-explain-guest-checkout-fields.service.js';
import { AiResumePendingPaymentService } from './ai-resume-pending-payment.service.js';
import { AiDiagnoseStripeCheckoutFailureService } from './ai-diagnose-stripe-checkout-failure.service.js';
import { AiPayAtVenueFallbackService } from './ai-pay-at-venue-fallback.service.js';
import { AiResumeBookingDraftService } from './ai-resume-booking-draft.service.js';
import { AiExplainSlotNoLongerAvailableService } from './ai-explain-slot-no-longer-available.service.js';
import { AiExplainMultiServicePaymentReturnService } from './ai-explain-multi-service-payment-return.service.js';
import { AiRetryFailedNetworkActionService } from './ai-retry-failed-network-action.service.js';
import { AiExplainVoiceInputService } from './ai-explain-voice-input.service.js';
import { AiSpeakAssistantReplyService } from './ai-speak-assistant-reply.service.js';
import { AiGiveAiFeedbackService } from './ai-give-ai-feedback.service.js';
import { AiExplainRtlLayoutService } from './ai-explain-rtl-layout.service.js';
import { AiConsumerAdoptionService } from './ai-consumer-adoption.service.js';
import { enrichDiscoveryParamsFromPrompt } from './ai-service-discovery-enrichment.util.js';
import {
  enrichCancelAllUpcomingConfirmFromPrompt,
  rescueCancelAllUpcomingConfirmIntent,
} from './ai-cancel-all-upcoming-bookings.util.js';
import { pickSharedBookingContextSlice } from './ai-compound-booking-context.util.js';
import {
  mergePublicAssistantSessionParams,
  parsePublicAssistantSessionValue,
} from '../public-booking/public-booking-assistant-session.util.js';
import {
  applyPromptMentionedServiceOverrideToParams,
  enrichBookingTimeHintsFromPrompt,
} from './ai-booking-param-hints.util.js';
import {
  isPublicOnlyAssistantAction,
  publicAssistantResultToCommandResult,
} from './customer-ai-command.util.js';
import {
  dispatchCustomerIntent,
  executeCustomerCompoundFromSteps,
  type CustomerAiCommandLogicDeps,
  type CustomerIntentSession,
} from './customer-ai-command.logic.js';
import { AiProductGuideService } from './ai-product-guide.service.js';
import { AiProductGuideEmptyStateService } from './ai-product-guide-empty-state.service.js';
import {
  mapCustomerMobileGuideRoute,
  resolveProductGuideSessionContext,
} from './ai-product-guide-session.util.js';
import {
  mapCustomerActivationGuideRoute,
  mergeCustomerActivationGuideContext,
  resolveCustomerGuideIntent,
  resolveCustomerGuideNavigate,
  type ConsumerActivationStep,
} from './ai-customer-product-guide.util.js';
import {
  enrichGuideTopicFromPrompt,
  rescueProductGuideIntent,
} from './ai-product-guide-rescue.util.js';
import {
  isAppGuideIntent,
  resolveProductGuidePromptMatch,
  type AppGuideIntent,
} from './ai-product-guide.util.js';
import {
  isEmptyStateGuideIntent,
  type EmptyStateGuideIntent,
} from './ai-product-guide-empty-state.util.js';
import {
  mapCommandResultGuideNavigate,
  runSurfaceProductGuideIntent,
} from './ai-product-guide-surface.logic.js';

interface ParsedCustomerIntent {
  action: string;
  params: Record<string, unknown>;
  reasoning: string;
}

@Injectable()
export class CustomerAiCommandService {
  private readonly logger = new Logger(CustomerAiCommandService.name);
  private readonly deps: CustomerAiCommandLogicDeps;

  constructor(
    private readonly llm: LlmService,
    private readonly promptSecurity: AiPromptSecurityService,
    private readonly aiSettings: AiSettingsService,
    private readonly promptNormalization: AiPromptNormalizationService,
    private readonly customerUnderstanding: CustomerCommandUnderstandingAdapter,
    private readonly platform: AiPlatformService,
    private readonly aiEvents: AiEventsService,
    private readonly customerCrm: AiCustomerCrmService,
    private readonly scheduleResources: AiScheduleResourcesService,
    private readonly payments: AiPaymentsService,
    private readonly giftFulfillment: AiGiftFulfillmentService,
    private readonly integrations: AiIntegrationsService,
    private readonly marketingGrowth: AiMarketingGrowthService,
    private readonly pushNotifications: AiPushNotificationsService,
    private readonly selfServiceBooking: AiSelfServiceBookingService,
    private readonly businessCurrency: AiBusinessCurrencyService,
    private readonly businessLanguages: AiBusinessLanguagesService,
    private readonly businessDateFormat: AiBusinessDateFormatService,
    private readonly businessHoursLocation: AiBusinessHoursLocationService,
    private readonly providerSpecialty: AiProviderSpecialtyService,
    private readonly businessTax: AiBusinessTaxService,
    private readonly businessCompliance: AiBusinessComplianceService,
    private readonly tourService: AiTourServiceService,
    private readonly recommendationProduct: AiRecommendationProductService,
    private readonly consumerClinicTestResults: AiConsumerClinicTestResultsService,
    private readonly clinicLabBooking: AiClinicLabBookingService,
    private readonly clinicBooking: AiClinicBookingService,
    private readonly guestCheckoutFields: AiGuestCheckoutFieldsService,
    private readonly resumePendingPayment: AiResumePendingPaymentService,
    private readonly diagnoseStripeCheckoutFailure: AiDiagnoseStripeCheckoutFailureService,
    private readonly payAtVenueFallback: AiPayAtVenueFallbackService,
    private readonly resumeBookingDraft: AiResumeBookingDraftService,
    private readonly explainSlotNoLongerAvailable: AiExplainSlotNoLongerAvailableService,
    private readonly explainMultiServicePaymentReturn: AiExplainMultiServicePaymentReturnService,
    private readonly retryFailedNetworkAction: AiRetryFailedNetworkActionService,
    private readonly explainVoiceInput: AiExplainVoiceInputService,
    private readonly speakAssistantReply: AiSpeakAssistantReplyService,
    private readonly giveAiFeedback: AiGiveAiFeedbackService,
    private readonly explainRtlLayout: AiExplainRtlLayoutService,
    private readonly consumerAdoption: AiConsumerAdoptionService,
    @Inject(forwardRef(() => PublicBookingAssistantService))
    private readonly publicAssistant: PublicBookingAssistantService,
    private readonly productGuide: AiProductGuideService,
    private readonly emptyStateGuide: AiProductGuideEmptyStateService,
  ) {
    this.deps = {
      customerCrm: this.customerCrm,
      scheduleResources: this.scheduleResources,
      payments: this.payments,
      giftFulfillment: this.giftFulfillment,
      integrations: this.integrations,
      marketingGrowth: this.marketingGrowth,
      pushNotifications: this.pushNotifications,
      selfServiceBooking: this.selfServiceBooking,
      businessCurrency: this.businessCurrency,
      businessLanguages: this.businessLanguages,
      businessDateFormat: this.businessDateFormat,
      businessHoursLocation: this.businessHoursLocation,
      providerSpecialty: this.providerSpecialty,
      businessTax: this.businessTax,
      businessCompliance: this.businessCompliance,
      tourService: this.tourService,
      recommendationProduct: this.recommendationProduct,
      consumerClinicTestResults: this.consumerClinicTestResults,
      clinicLabBooking: this.clinicLabBooking,
      clinicBooking: this.clinicBooking,
      guestCheckoutFields: this.guestCheckoutFields,
      resumePendingPayment: this.resumePendingPayment,
      diagnoseStripeCheckoutFailure: this.diagnoseStripeCheckoutFailure,
      payAtVenueFallback: this.payAtVenueFallback,
      resumeBookingDraft: this.resumeBookingDraft,
      explainSlotNoLongerAvailable: this.explainSlotNoLongerAvailable,
      explainMultiServicePaymentReturn: this.explainMultiServicePaymentReturn,
      retryFailedNetworkAction: this.retryFailedNetworkAction,
      explainVoiceInput: this.explainVoiceInput,
      speakAssistantReply: this.speakAssistantReply,
      giveAiFeedback: this.giveAiFeedback,
      explainRtlLayout: this.explainRtlLayout,
      consumerAdoption: this.consumerAdoption,
      runPublicAssistantStep: async (businessId, action, params, session) => {
        void businessId;
        if (!session.slug) {
          return {
            success: false,
            action,
            summary: 'Booking page context is missing (slug).',
            details: {},
          };
        }
        const assistantResult =
          await this.publicAssistant.executeDeterministicIntent(session.slug, {
            action,
            params: params as Record<string, any>,
            prompt: session.prompt ?? '',
            session: session as Record<string, any>,
            locale: session.locale,
          });
        return publicAssistantResultToCommandResult(assistantResult);
      },
    };
  }

  async executeCommand(
    businessId: string,
    prompt: string,
    history?: Array<{ role: 'user' | 'assistant'; content: string }>,
    context?: Record<string, unknown>,
  ): Promise<CommandResult> {
    if (!(await this.llm.isAvailableForBusiness(businessId))) {
      const fallback = await runAiUnavailableStaticGuideFallback({
        productGuide: this.productGuide,
        businessId,
        prompt,
        surface: 'customer',
        reason: 'openai_not_configured',
        session: { context },
      });
      if (fallback) return fallback;
      return buildAiUnavailableErrorWithGuideLink({
        surface: 'customer',
        reason: 'openai_not_configured',
        route: mapCustomerMobileGuideRoute(context),
        locale:
          typeof context?.locale === 'string' ? context.locale : undefined,
      });
    }

    const blocked = this.promptSecurity.preflightBlock(
      businessId,
      prompt,
      'customer',
      typeof context?.locale === 'string' ? context.locale : undefined,
    );
    if (blocked) return blocked;

    const guideMatch = resolveProductGuidePromptMatch(prompt, {
      surface: 'customer',
      assistantMode: context?.assistantMode as 'guide' | 'act' | undefined,
    });
    if (guideMatch.matched && guideMatch.intent) {
      return this.dispatchCustomerAppGuideIntent(
        businessId,
        prompt,
        guideMatch.intent,
        context,
      );
    }

    const session = this.buildSession(context, prompt);
    const compound = await this.tryCompound(businessId, prompt, session);
    if (compound) return compound;

    const aiConfig = await this.aiSettings.getSettings(businessId);
    const promptNorm = await this.promptNormalization.normalizeForClassifier(
      businessId,
      undefined,
      prompt,
    );

    const understood = await this.customerUnderstanding.understand({
      businessId,
      effectivePrompt: prompt,
      confidence: aiConfig.confidence,
      sessionConfidenceHigh: context?._confidenceHigh as number | undefined,
      lastAction: context?.lastAction as string | undefined,
      sessionContext: context,
      history,
      promptNorm,
      classify: (normalizedPrompt, systemContext) =>
        this.classifyIntent(
          businessId,
          normalizedPrompt,
          systemContext,
          history,
          context,
        ),
    });

    if (understood.status === 'blocked') {
      return {
        success: false,
        action: 'error',
        summary: 'Could not understand that request. Try rephrasing.',
        details: {
          pipelineTrace: understood.trace,
          blockReason: understood.blockReason,
        },
      };
    }

    if (understood.status === 'clarify') {
      const clarifyPayload = {
        summary:
          understood.clarifySummary ??
          'I need a bit more detail before I can run this.',
        clarifyFields: understood.clarifyFields ?? ['intentChoice'],
        suggestions: understood.clarifySuggestions ?? [],
        loweredConfidence: understood.confidence,
        ruleId:
          understood.blockReason?.replace('self_verify clarify: ', '') ??
          'unknown',
        reason: understood.blockReason ?? 'self_verify_clarify',
      };
      const clarify = buildPipelineClarifyCommandResult(
        understood,
        clarifyPayload,
      );
      return this.withPostFailureGuideFallback(clarify, context, prompt);
    }

    const parsed = pipelineResultToClassifiedIntent(understood);
    const classifierCandidate = findClassifierCandidate(understood);
    const classifierAction = classifierCandidate?.action ?? parsed.action;
    let rescueReason: string | undefined = pipelineRescueReason(understood);

    const guideRescue = rescueProductGuideIntent(prompt, parsed.action, {
      surface: 'customer',
      assistantMode: context?.assistantMode as 'guide' | 'act' | undefined,
      route: mapCustomerMobileGuideRoute(context),
      context,
    });
    if (guideRescue.action !== parsed.action) {
      parsed.action = guideRescue.action;
      rescueReason = guideRescue.rescueReason ?? 'customer_app_guide';
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

    if (parsed.action === 'check_availability') {
      parsed.action = 'check_providers_for_service';
      rescueReason = rescueReason ?? 'customer_check_availability_disambiguation';
    }

    let action = parsed.action;
    let params = enrichDiscoveryParamsFromPrompt({ ...parsed.params }, prompt);
    params = applyPromptMentionedServiceOverrideToParams(prompt, params);
    params = mergePublicAssistantSessionParams(params, context, action);
    if (history?.length) {
      params = { ...params, conversationHistory: history };
    }
    // e2e-bug.78 — deterministic confirm after cancel-all preview (history/session).
    const cancelAllConfirm = rescueCancelAllUpcomingConfirmIntent(
      prompt,
      action,
      {
        ...params,
        cancelAllUpcomingPending: session.cancelAllUpcomingPending,
        requiresConfirmation: session.requiresConfirmation,
        pendingAction: session.pendingAction,
      },
      history,
    );
    if (cancelAllConfirm) {
      action = cancelAllConfirm.action;
      params = { ...params, ...cancelAllConfirm.params };
      rescueReason = cancelAllConfirm.rescueReason;
      parsed.action = action;
    } else if (action === 'cancel_all_upcoming_bookings') {
      params = enrichCancelAllUpcomingConfirmFromPrompt(prompt, {
        ...params,
        cancelAllUpcomingPending: session.cancelAllUpcomingPending,
        requiresConfirmation: session.requiresConfirmation,
        pendingAction: session.pendingAction,
      }, history);
    }
    if (history?.length && action === 'speak_assistant_reply') {
      params = { ...params, conversationHistory: history };
    }
    if (history?.length && action === 'give_ai_feedback') {
      params = { ...params, conversationHistory: history };
    }
    if (
      action === 'book_nearest_slot' ||
      action === 'check_providers_for_service' ||
      action === 'create_booking'
    ) {
      enrichBookingTimeHintsFromPrompt(
        action,
        params as Record<string, any>,
        prompt,
      );
    }

    recordMisrouteTelemetry(this.aiEvents, businessId, {
      surface: 'customer',
      prompt,
      classifierAction,
      rescuedAction: action,
      rescueReason,
      compoundStepCount: 1,
    });

    if (shouldBlockUnknownFromHandlerSwitch(action)) {
      return this.withPostFailureGuideFallback(
        buildUnknownIntentClarifyResult({
          surface: 'customer',
          prompt,
          params,
          reasoning: parsed.reasoning,
          confidence:
            typeof parsed.confidence === 'number' ? parsed.confidence : 0,
          trace: understood.trace,
          locale:
            typeof context?.locale === 'string' ? context.locale : undefined,
        }),
        context,
        prompt,
      );
    }

    if (!isIntentAllowed('customer', 'client', action)) {
      const locale =
        typeof context?.locale === 'string' ? context.locale : undefined;
      return (
        this.platform.gateCustomerAction(action, locale) ?? {
          success: false,
          action: 'security_blocked',
          summary: t(resolveLocale(locale), 'assistant.deniedCustomer'),
          details: { surface: 'customer', blockedAction: action },
        }
      );
    }

    if (isPublicOnlyAssistantAction(action)) {
      return this.runPublicAssistant(session, prompt, history, context);
    }

    if (isAppGuideIntent(action)) {
      return this.dispatchCustomerAppGuideIntent(
        businessId,
        prompt,
        action,
        context,
        params,
      );
    }

    if (isEmptyStateGuideIntent(action)) {
      return this.dispatchCustomerEmptyStateGuideIntent(
        businessId,
        prompt,
        action,
        context,
        params,
      );
    }

    this.logger.log(`Customer AI action="${action}" — ${parsed.reasoning}`);
    return this.withPostFailureGuideFallback(
      await dispatchCustomerIntent(
        this.deps,
        businessId,
        action,
        params,
        session,
      ),
      context,
      prompt,
    );
  }

  private withPostFailureGuideFallback(
    result: CommandResult,
    context?: Record<string, unknown>,
    prompt?: string,
  ): CommandResult {
    return appendPostFailureGuideFallback(
      result,
      buildPostFailureGuideFallbackInput(context, 'customer', undefined, prompt),
    );
  }

  private buildSession(
    context: Record<string, unknown> | undefined,
    prompt: string,
  ): CustomerIntentSession {
    const shared = pickSharedBookingContextSlice(context ?? {});
    const availabilityWindowsRaw =
      context?.availabilityWindows ?? shared.availabilityWindows;
    const parsedAvailabilityWindows = parsePublicAssistantSessionValue(
      'availabilityWindows',
      availabilityWindowsRaw,
    );
    const chosenAvailabilityWindowRaw =
      context?.chosenAvailabilityWindow ?? shared.chosenAvailabilityWindow;
    const parsedChosenAvailabilityWindow = parsePublicAssistantSessionValue(
      'chosenAvailabilityWindow',
      chosenAvailabilityWindowRaw,
    );

    return {
      customerId: context?.customerId as string | undefined,
      slug: context?.slug as string | undefined,
      locale: context?.locale as string | undefined,
      cartServiceIds: context?.cartServiceIds as string[] | undefined,
      packageId: context?.packageId as string | undefined,
      packageName: context?.packageName as string | undefined,
      giftCardCode: context?.giftCardCode as string | undefined,
      paymentMethod: context?.paymentMethod as string | undefined,
      useSubscriptionId: context?.useSubscriptionId as string | undefined,
      bookingId: context?.bookingId as string | undefined,
      lastPush: context?.lastPush,
      offlineQueueCount: context?.offlineQueueCount as number | undefined,
      online: context?.online as boolean | undefined,
      userEmail: context?.userEmail as string | undefined,
      userName: context?.userName as string | undefined,
      serviceName:
        (context?.serviceName as string | undefined) ??
        (shared.serviceName as string | undefined),
      serviceId:
        (context?.serviceId as string | undefined) ??
        (shared.serviceId as string | undefined),
      employeeId:
        (context?.employeeId as string | undefined) ??
        (shared.employeeId as string | undefined),
      maxPrice:
        (context?.maxPrice as number | string | undefined) ??
        (shared.maxPrice as number | string | undefined),
      serviceRank:
        (context?.serviceRank as string | undefined) ??
        (shared.serviceRank as string | undefined),
      availabilityWindows: Array.isArray(parsedAvailabilityWindows)
        ? parsedAvailabilityWindows
        : undefined,
      chosenAvailabilityWindow:
        parsedChosenAvailabilityWindow &&
        typeof parsedChosenAvailabilityWindow === 'object' &&
        Array.isArray(
          (parsedChosenAvailabilityWindow as { dateKeys?: unknown }).dateKeys,
        )
          ? (parsedChosenAvailabilityWindow as CustomerIntentSession['chosenAvailabilityWindow'])
          : undefined,
      date:
        (context?.date as string | undefined) ??
        (shared.date as string | undefined),
      timeOfDay:
        (context?.timeOfDay as string | undefined) ??
        (shared.timeOfDay as string | undefined),
      notBeforeTime:
        (context?.notBeforeTime as string | undefined) ??
        (shared.notBeforeTime as string | undefined),
      allProviders:
        (context?.allProviders as boolean | undefined) ??
        (shared.allProviders as boolean | undefined),
      bookingFirstAvailable:
        (context?.bookingFirstAvailable as boolean | undefined) ??
        (shared.bookingFirstAvailable as boolean | undefined),
      timeFrom:
        (context?.timeFrom as string | undefined) ??
        (shared.timeFrom as string | undefined),
      checkProvidersHandoff: context?.checkProvidersHandoff as
        | CustomerIntentSession['checkProvidersHandoff']
        | undefined,
      availableProviders: context?.availableProviders as string[] | undefined,
      availability: context?.availability as
        | CustomerIntentSession['availability']
        | undefined,
      priorCheckSummary: context?.priorCheckSummary as string | undefined,
      noProviders: context?.noProviders as boolean | undefined,
      pendingCheckoutSessionId: context?.pendingCheckoutSessionId as
        | string
        | undefined,
      pendingCheckoutServiceId: context?.pendingCheckoutServiceId as
        | string
        | undefined,
      pendingCheckoutStartTime: context?.pendingCheckoutStartTime as
        | string
        | undefined,
      pendingCheckoutEmployeeId: context?.pendingCheckoutEmployeeId as
        | string
        | undefined,
      privacyDeletePending:
        context?.privacyDeletePending === true ||
        context?.privacyDeletePending === 'true',
      cancelAllUpcomingPending:
        context?.cancelAllUpcomingPending === true ||
        context?.cancelAllUpcomingPending === 'true',
      requiresConfirmation:
        context?.requiresConfirmation === true ||
        context?.requiresConfirmation === 'true',
      pendingAction:
        typeof context?.pendingAction === 'string'
          ? context.pendingAction
          : undefined,
      confirm: context?.confirm === true || context?.confirm === 'true',
      prompt,
    };
  }

  private async tryCompound(
    businessId: string,
    prompt: string,
    session: CustomerIntentSession,
  ): Promise<CommandResult | null> {
    if (!isCompoundPrompt(prompt)) return null;

    const deterministic = decomposeDeterministicForSurface('customer', prompt);
    if (deterministic && deterministic.steps.length >= 2) {
      recordMisrouteTelemetry(this.aiEvents, businessId, {
        surface: 'customer',
        prompt,
        classifierAction: 'compound_intent',
        rescuedAction: 'compound_intent',
        rescueReason: 'compound_decomposition',
        compoundStepCount: deterministic.steps.length,
      });
      const result = await executeCustomerCompoundFromSteps(
        this.deps,
        businessId,
        prompt,
        deterministic.steps,
        session,
      );
      if (result.success || result.details?.failedStep) return result;
    }

    if (this.selfServiceBooking.isCustomerBookingCompound(prompt)) {
      const bookingCompound =
        await this.selfServiceBooking.handleCustomerBookingCompound(
          businessId,
          prompt,
          {
            sessionCustomerId: session.customerId,
            cartServiceIds: session.cartServiceIds,
            packageId: session.packageId,
            packageName: session.packageName,
            giftCardCode: session.giftCardCode,
            paymentMethod: session.paymentMethod,
            useSubscriptionId: session.useSubscriptionId,
            bookingId: session.bookingId,
          },
        );
      if (bookingCompound.success || bookingCompound.details?.failedStep)
        return bookingCompound;
    }

    if (this.payments.isPaymentsCompound(prompt)) {
      const paymentsCompound = await this.payments.handlePaymentsCompound(
        businessId,
        prompt,
        {
          sessionCustomerId: session.customerId,
        },
      );
      if (paymentsCompound.success || paymentsCompound.details?.failedStep)
        return paymentsCompound;
    }

    if (this.marketingGrowth.isMarketingGrowthCompound(prompt)) {
      const marketingCompound =
        await this.marketingGrowth.handleMarketingGrowthCompound(
          businessId,
          prompt,
          { sessionCustomerId: session.customerId },
          session.userEmail,
        );
      if (marketingCompound.success || marketingCompound.details?.failedStep)
        return marketingCompound;
    }

    if (this.pushNotifications.isPushNotificationsCompound(prompt)) {
      const pushCompound =
        await this.pushNotifications.handlePushNotificationsCompound(
          businessId,
          prompt,
          {
            sessionCustomerId: session.customerId,
            lastPush: session.lastPush,
            offlineQueueCount: session.offlineQueueCount,
            online: session.online,
          },
        );
      if (pushCompound.success || pushCompound.details?.failedStep)
        return pushCompound;
    }

    if (this.giftFulfillment.isFulfillmentCompound(prompt)) {
      const fulfillmentCompound =
        await this.giftFulfillment.handleFulfillmentCompound(
          businessId,
          prompt,
          {
            sessionCustomerId: session.customerId,
          },
        );
      if (
        fulfillmentCompound.success ||
        fulfillmentCompound.details?.failedStep
      )
        return fulfillmentCompound;
    }

    return null;
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

    const rankDiscoveryRescue = rescueServiceRankDiscoveryIntent(
      prompt,
      action,
      'customer',
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
      'customer',
    );
    const resolvedAction = budgetRescue?.action ?? resolvedBrowseAction;
    const rankRescue = rescueServiceRankFromRecommendSpecialistsIntent(
      prompt,
      resolvedAction,
    );
    return rankRescue ?? budgetRescue ?? catalogBrowseRescue ?? null;
  }

  private async classifyIntent(
    businessId: string,
    normalizedPrompt: string,
    systemContext: string,
    history?: Array<{ role: 'user' | 'assistant'; content: string }>,
    context?: Record<string, unknown>,
  ): Promise<ParsedCustomerIntent | null> {
    const userBlock = [
      context?._conversationSummary
        ? `Conversation summary: ${context._conversationSummary}`
        : '',
      context?._entityMemoryBlock ? String(context._entityMemoryBlock) : '',
      context?._ragContextBlock ? String(context._ragContextBlock) : '',
      history?.length
        ? `Recent messages:\n${history.map((m) => `${m.role}: ${m.content}`).join('\n')}`
        : '',
      `User: ${this.promptSecurity.prepareUserPromptForClassifier(normalizedPrompt)}`,
    ]
      .filter(Boolean)
      .join('\n\n');

    try {
      const result = await this.llm.completeJson<ParsedCustomerIntent>(
        businessId,
        systemContext,
        userBlock,
        {
          surface: 'customer',
          operation: 'classify_intent',
          actorType: 'customer',
        },
        0.1,
      );
      if (!result?.action) return null;
      return {
        action: result.action,
        params: this.promptSecurity.stripParams(result.params ?? {}),
        reasoning: result.reasoning ?? '',
      };
    } catch (error: any) {
      this.logger.warn(
        `Customer intent classification failed: ${error.message}`,
      );
      return null;
    }
  }

  private async runPublicAssistant(
    session: CustomerIntentSession,
    prompt: string,
    history?: Array<{ role: 'user' | 'assistant'; content: string }>,
    context?: Record<string, unknown>,
  ): Promise<CommandResult> {
    if (!session.slug) {
      return {
        success: false,
        action: 'error',
        summary: 'Booking page context is missing (slug).',
        details: {},
      };
    }

    const result = await this.publicAssistant.chat(
      session.slug,
      prompt,
      {
        history,
        context: context as Record<string, any>,
        locale: session.locale,
      },
      { recordMetrics: false },
    );
    return publicAssistantResultToCommandResult(result);
  }

  /** ai-guide-1.5.2 — consumer app guide intents → AiProductGuideService playbooks. */
  private async dispatchCustomerAppGuideIntent(
    businessId: string,
    prompt: string,
    intent: AppGuideIntent,
    context?: Record<string, unknown>,
    params: Record<string, unknown> = {},
  ): Promise<CommandResult> {
    const mergedContext = mergeCustomerActivationGuideContext(context);
    const activationRoute = mapCustomerActivationGuideRoute(mergedContext);
    const guideContext = resolveProductGuideSessionContext(
      {
        context: {
          ...mergedContext,
          route: activationRoute ?? mapCustomerMobileGuideRoute(mergedContext),
          _accessTier: 'client',
          roleProfile: 'customer',
          vertical: mergedContext?.businessType ?? mergedContext?.vertical,
          enabledModules: mergedContext?.enabledModules,
        },
      },
      'customer',
    );
    const route =
      activationRoute ??
      guideContext.route ??
      mapCustomerMobileGuideRoute(mergedContext);
    const resolvedIntent = resolveCustomerGuideIntent(prompt, intent, route);
    const activationStep =
      typeof mergedContext.activationStep === 'string'
        ? (mergedContext.activationStep as ConsumerActivationStep)
        : undefined;
    const seededTopicId =
      typeof mergedContext.guideTopicId === 'string' &&
      mergedContext.guideTopicId.trim()
        ? mergedContext.guideTopicId.trim()
        : undefined;
    const topicId = enrichGuideTopicFromPrompt(prompt, {
      surface: 'customer',
      route,
      topicId: seededTopicId ?? params.topicId,
      activationStep,
    });
    const guideParams = topicId ? { ...params, topicId } : params;

    const guideResult = mapCommandResultGuideNavigate(
      await runSurfaceProductGuideIntent({
        productGuide: this.productGuide,
        businessId,
        prompt,
        intent: resolvedIntent,
        surface: 'customer',
        locale:
          typeof mergedContext?.locale === 'string' &&
          mergedContext.locale.trim()
            ? mergedContext.locale.trim()
            : undefined,
        params: guideParams,
        session: { context: mergedContext },
        sessionContext: guideContext,
      }),
    );

    const navigate =
      guideResult.guide?.navigate ?? resolveCustomerGuideNavigate(route);
    return {
      ...guideResult,
      details: {
        ...guideResult.details,
        ...(navigate ? { navigate } : {}),
        guideRoute: route,
        guideIntent: resolvedIntent,
        ...(activationStep ? { activationStep } : {}),
      },
      guide: guideResult.guide
        ? {
            ...guideResult.guide,
            navigate: guideResult.guide.navigate ?? navigate,
          }
        : undefined,
    };
  }

  /** ai-guide-1.8.9 — consumer live catalog / Stripe empty-state guides. */
  private async dispatchCustomerEmptyStateGuideIntent(
    businessId: string,
    prompt: string,
    intent: EmptyStateGuideIntent,
    context?: Record<string, unknown>,
    params: Record<string, unknown> = {},
  ): Promise<CommandResult> {
    if (
      !isEmptyStateGuideIntent(intent) ||
      intent === 'explain_visibility_block'
    ) {
      return {
        success: false,
        action: intent,
        summary: 'Unsupported empty-state guide intent on customer mobile.',
        details: {},
      };
    }
    const mergedContext = mergeCustomerActivationGuideContext(context);
    const guideContext = resolveProductGuideSessionContext(
      {
        context: {
          ...mergedContext,
          route: mapCustomerMobileGuideRoute(mergedContext),
          _accessTier: 'client',
          roleProfile: 'customer',
        },
      },
      'customer',
    );
    return mapCommandResultGuideNavigate(
      await this.emptyStateGuide.runIntent({
        businessId,
        intent,
        surface: 'customer',
        prompt,
        params,
        session: { context: mergedContext },
        sessionContext: guideContext,
        locale: guideContext.locale,
      }),
    );
  }
}
