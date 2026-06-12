import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
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
import { AiBusinessTaxService } from './ai-business-tax.service.js';
import { AiBusinessComplianceService } from './ai-business-compliance.service.js';
import {
  rescueBudgetServiceDiscoveryIntent,
} from './ai-budget-service-discovery.util.js';
import { isIntentAllowed } from './ai-capability.matrix.js';
import type { CommandResult } from './command-completion.types.js';
import { isCompoundPrompt, decomposeDeterministicForSurface } from './intent-decomposition.util.js';
import { rescueServiceRankFromRecommendSpecialistsIntent, rescueServiceRankDiscoveryIntent } from './ai-service-rank-discovery.util.js';
import { rescueServiceCatalogBrowseIntent } from './ai-service-catalog-browse.util.js';
import { AiTourServiceService } from './ai-tour-service.service.js';
import { AiRecommendationProductService } from './ai-recommendation-product.service.js';
import { AiConsumerClinicTestResultsService } from './ai-consumer-clinic-test-results.service.js';
import { AiClinicLabBookingService } from './ai-clinic-lab-booking.service.js';
import { AiClinicBookingService } from './ai-clinic-booking.service.js';
import { AiConsumerAdoptionService } from './ai-consumer-adoption.service.js';
import {
  enrichDiscoveryParamsFromPrompt,
} from './ai-service-discovery-enrichment.util.js';
import { pickSharedBookingContextSlice } from './ai-compound-booking-context.util.js';
import { mergePublicAssistantSessionParams, parsePublicAssistantSessionValue } from '../public-booking/public-booking-assistant-session.util.js';
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
    private readonly businessTax: AiBusinessTaxService,
    private readonly businessCompliance: AiBusinessComplianceService,
    private readonly tourService: AiTourServiceService,
    private readonly recommendationProduct: AiRecommendationProductService,
    private readonly consumerClinicTestResults: AiConsumerClinicTestResultsService,
    private readonly clinicLabBooking: AiClinicLabBookingService,
    private readonly clinicBooking: AiClinicBookingService,
    private readonly consumerAdoption: AiConsumerAdoptionService,
    @Inject(forwardRef(() => PublicBookingAssistantService))
    private readonly publicAssistant: PublicBookingAssistantService,
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
      businessTax: this.businessTax,
      businessCompliance: this.businessCompliance,
      tourService: this.tourService,
      recommendationProduct: this.recommendationProduct,
      consumerClinicTestResults: this.consumerClinicTestResults,
      clinicLabBooking: this.clinicLabBooking,
      clinicBooking: this.clinicBooking,
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
      return {
        success: false,
        action: 'error',
        summary: 'AI assistant is not configured for this business.',
        details: {},
      };
    }

    const blocked = this.promptSecurity.preflightBlock(
      businessId,
      prompt,
      'customer',
    );
    if (blocked) return blocked;

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
      return clarify;
    }

    let parsed = pipelineResultToClassifiedIntent(understood);
    const classifierCandidate = findClassifierCandidate(understood);
    const classifierAction = classifierCandidate?.action ?? parsed.action;
    let rescueReason: string | undefined = pipelineRescueReason(understood);

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

    const action = parsed.action;
    let params = enrichDiscoveryParamsFromPrompt({ ...parsed.params }, prompt);
    params = applyPromptMentionedServiceOverrideToParams(prompt, params);
    params = mergePublicAssistantSessionParams(params, context, action);
    if (
      action === 'book_nearest_slot' ||
      action === 'check_providers_for_service' ||
      action === 'create_booking'
    ) {
      enrichBookingTimeHintsFromPrompt(action, params as Record<string, any>, prompt);
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
      return buildUnknownIntentClarifyResult({
        surface: 'customer',
        prompt,
        params,
        reasoning: parsed.reasoning,
        confidence:
          typeof parsed.confidence === 'number' ? parsed.confidence : 0,
        trace: understood.trace,
      });
    }

    if (!isIntentAllowed('customer', 'client', action)) {
      return (
        this.platform.gateCustomerAction(action) ?? {
          success: false,
          action: 'security_blocked',
          summary: `Action "${action}" is not allowed on the customer assistant.`,
          details: { surface: 'customer', blockedAction: action },
        }
      );
    }

    if (isPublicOnlyAssistantAction(action)) {
      return this.runPublicAssistant(session, prompt, history, context);
    }

    this.logger.log(`Customer AI action="${action}" — ${parsed.reasoning}`);
    return dispatchCustomerIntent(
      this.deps,
      businessId,
      action,
      params,
      session,
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
    const rankDiscoveryRescue = rescueServiceRankDiscoveryIntent(
      prompt,
      action,
      'customer',
    );
    if (rankDiscoveryRescue) return rankDiscoveryRescue;

    const catalogBrowseRescue = rescueServiceCatalogBrowseIntent(prompt, action);
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
}
