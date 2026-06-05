import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { LlmService } from '../../engine/agent/llm.service.js';
import { PublicBookingAssistantService } from '../public-booking/public-booking-assistant.service.js';
import { AiPromptSecurityService } from './ai-prompt-security.service.js';
import { AiPlatformService } from './ai-platform.service.js';
import { AiCustomerCrmService } from './ai-customer-crm.service.js';
import { AiScheduleResourcesService } from './ai-schedule-resources.service.js';
import { AiPaymentsService } from './ai-payments.service.js';
import { AiGiftFulfillmentService } from './ai-gift-fulfillment.service.js';
import { AiIntegrationsService } from './ai-integrations.service.js';
import { AiMarketingGrowthService } from './ai-marketing-growth.service.js';
import { AiPushNotificationsService } from './ai-push-notifications.service.js';
import { AiSelfServiceBookingService } from './ai-self-service-booking.service.js';
import { isIntentAllowed } from './ai-capability.matrix.js';
import type { CommandResult } from './command-completion.types.js';
import {
  decomposeDeterministicForSurface,
  isCompoundPrompt,
} from './intent-decomposition.util.js';
import { rescueSelfServiceBookingIntent } from './ai-self-service-booking.util.js';
import { rescueMarketingGrowthIntent } from './ai-marketing-growth.util.js';
import {
  buildCustomerClassifierSchema,
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
    private readonly platform: AiPlatformService,
    private readonly customerCrm: AiCustomerCrmService,
    private readonly scheduleResources: AiScheduleResourcesService,
    private readonly payments: AiPaymentsService,
    private readonly giftFulfillment: AiGiftFulfillmentService,
    private readonly integrations: AiIntegrationsService,
    private readonly marketingGrowth: AiMarketingGrowthService,
    private readonly pushNotifications: AiPushNotificationsService,
    private readonly selfServiceBooking: AiSelfServiceBookingService,
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

    const parsed = await this.classifyIntent(
      businessId,
      prompt,
      history,
      context,
    );
    if (!parsed) {
      return {
        success: false,
        action: 'error',
        summary: 'Could not understand that request. Try rephrasing.',
        details: {},
      };
    }

    const rescued = this.rescueIntent(prompt, parsed.action);
    const action = rescued?.action ?? parsed.action;
    const params = { ...parsed.params };

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

  private rescueIntent(prompt: string, action: string) {
    return (
      rescueSelfServiceBookingIntent(prompt, action) ??
      rescueMarketingGrowthIntent(prompt, action)
    );
  }

  private async classifyIntent(
    businessId: string,
    prompt: string,
    history?: Array<{ role: 'user' | 'assistant'; content: string }>,
    context?: Record<string, unknown>,
  ): Promise<ParsedCustomerIntent | null> {
    const capabilityHints = context?._capabilityHints as string | undefined;
    const system =
      `${buildCustomerClassifierSchema()}\n\n${capabilityHints ?? ''}`.trim();
    const userBlock = [
      context?._conversationSummary
        ? `Conversation summary: ${context._conversationSummary}`
        : '',
      context?._entityMemoryBlock ? String(context._entityMemoryBlock) : '',
      context?._ragContextBlock ? String(context._ragContextBlock) : '',
      history?.length
        ? `Recent messages:\n${history.map((m) => `${m.role}: ${m.content}`).join('\n')}`
        : '',
      `User: ${this.promptSecurity.prepareUserPromptForClassifier(prompt)}`,
    ]
      .filter(Boolean)
      .join('\n\n');

    try {
      const result = await this.llm.completeJson<ParsedCustomerIntent>(
        businessId,
        system,
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
