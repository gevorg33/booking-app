import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { GiftCard } from '../gift-cards/entities/gift-card.entity.js';
import { GiftCardsService } from '../gift-cards/gift-cards.service.js';
import { GiftCardPurchaseService } from '../gift-cards/gift-card-purchase.service.js';
import { GiftCardOrderService } from '../gift-cards/gift-card-order.service.js';
import { GiftCardRefundService } from '../gift-cards/gift-card-refund.service.js';
import { PublicBookingService } from '../public-booking/public-booking.service.js';
import { AccountingIntegrationService } from '../integrations/accounting/accounting-integration.service.js';
import { CommissionsService } from '../commissions/commissions.service.js';
import { ServiceSubscriptionsService } from '../service-subscriptions/service-subscriptions.service.js';
import { ServiceService } from '../service/service.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  decomposePaymentsCompoundPrompt,
  isPaymentsCompoundPrompt,
  rescuePaymentsIntent,
} from './ai-payments.util.js';
import { handleBuyGiftCardForSomeoneLogic } from './ai-buy-gift-card-for-someone.logic.js';
import { handleExplainServiceOnlinePaymentSetupLogic } from './ai-service-online-payment-setup.logic.js';
import { handleExplainPublicBookingCheckoutLogic } from './ai-explain-public-booking-checkout.logic.js';
import { handleExplainServicePriceLogic } from './ai-explain-service-price.logic.js';
import { handleExplainPaymentOptionsForServiceLogic } from './ai-explain-payment-options-for-service.logic.js';
import { handleFindSoonestAppointmentLogic } from './ai-find-soonest-appointment.logic.js';
import { handleExplainAmountDueNowLogic } from './ai-explain-amount-due-now.logic.js';
import { handleCompareServicesLogic } from './ai-compare-services.logic.js';
import { handleFilterServicesNoPrepaymentLogic } from './ai-filter-services-no-prepayment.logic.js';
import { handleAuditServicesMissingOnlinePaymentLogic } from './ai-audit-services-missing-online-payment.logic.js';
import { handleConfigureCheckoutDefaultsLogic } from './ai-checkout-defaults.logic.js';
import { handleConfigureServiceDepositPolicyLogic } from './ai-service-deposit-policy.logic.js';
import {
  handleAdjustGiftCardBalanceLogic,
  handleApplyGiftCardCodeLogic,
  handleBookNearestSlotLogic,
  handleBuyGiftCardLogic,
  handleCheckGiftCardBalanceLogic,
  handleCheckProvidersForServiceLogic,
  handleChoosePaymentMethodLogic,
  handleCollectCashConfirmLogic,
  handleConfigureCashPaymentsLogic,
  handleConfigureServiceOnlinePaymentLogic,
  handleExplainCheckoutTotalLogic,
  handleExplainPaymentStatusLogic,
  handleExplainWhyStripeRequiredLogic,
  handleExportAccountingLogic,
  handleExportCommissionsLogic,
  handleExtendGiftCardExpiryLogic,
  handleListSubscriptionRevenueLogic,
  handlePayCashAtVisitLogic,
  handlePayOnlineLogic,
  handlePurchaseSubscriptionCheckoutLogic,
  handleReceiptStatusLogic,
  handleRefundGiftCardOrderLogic,
  handleSummarizeUnpaidLogic,
  handleValidateGiftCardLogic,
  type PaymentsLogicDeps,
} from './ai-payments.logic.js';
import { handlePaymentsCompoundLogic } from './ai-payments-compound.logic.js';
import { dispatchPaymentsLogicIntent } from './ai-payments-dispatch.util.js';
import type { PaymentsDispatchContext } from './ai-payments-dispatch.build.js';

@Injectable()
export class AiPaymentsService {
  private readonly deps: PaymentsLogicDeps;

  constructor(
    giftCardsService: GiftCardsService,
    giftCardPurchaseService: GiftCardPurchaseService,
    giftCardOrderService: GiftCardOrderService,
    giftCardRefundService: GiftCardRefundService,
    publicBookingService: PublicBookingService,
    accountingIntegrationService: AccountingIntegrationService,
    commissionsService: CommissionsService,
    subscriptionsService: ServiceSubscriptionsService,
    serviceService: ServiceService,
    @InjectRepository(Business) businessRepo: Repository<Business>,
    @InjectRepository(Service) serviceRepo: Repository<Service>,
    @InjectRepository(Booking) bookingRepo: Repository<Booking>,
    @InjectRepository(GiftCard) giftCardRepo: Repository<GiftCard>,
  ) {
    this.deps = {
      giftCardsService,
      giftCardPurchaseService,
      giftCardOrderService,
      giftCardRefundService,
      publicBookingService,
      accountingIntegrationService,
      commissionsService,
      subscriptionsService,
      bookingRepo,
      businessRepo,
      serviceRepo,
      giftCardRepo,
      serviceService,
    };
  }

  rescuePaymentsIntent(prompt: string, action: string) {
    return rescuePaymentsIntent(prompt, action);
  }

  isPaymentsCompound(prompt: string) {
    return isPaymentsCompoundPrompt(prompt);
  }

  decomposePaymentsCompound(prompt: string) {
    return decomposePaymentsCompoundPrompt(prompt);
  }

  handleSummarizeUnpaid(businessId: string, params: Record<string, any>) {
    return handleSummarizeUnpaidLogic(this.deps, businessId, params);
  }

  handleValidateGiftCard(businessId: string, params: Record<string, any>) {
    return handleValidateGiftCardLogic(this.deps, businessId, params);
  }

  handleExportAccounting(businessId: string, params: Record<string, any>) {
    return handleExportAccountingLogic(this.deps, businessId, params);
  }

  handleExportCommissions(businessId: string, params: Record<string, any>) {
    return handleExportCommissionsLogic(this.deps, businessId, params);
  }

  handleExplainCheckoutTotal(
    businessId: string,
    params: Record<string, any>,
    catalogContext?: Record<string, unknown>,
  ) {
    return handleExplainCheckoutTotalLogic(
      this.deps,
      businessId,
      params,
      catalogContext,
    );
  }

  handleExplainAmountDueNow(
    businessId: string,
    params: Record<string, any> = {},
    prompt = '',
    catalogContext?: Record<string, unknown>,
  ) {
    return handleExplainAmountDueNowLogic(
      this.deps,
      businessId,
      params,
      prompt,
      catalogContext,
    );
  }

  handleExplainServicePrice(
    businessId: string,
    params: Record<string, any> = {},
    prompt = '',
    catalogContext?: Record<string, unknown>,
  ) {
    return handleExplainServicePriceLogic(
      this.deps,
      businessId,
      params,
      prompt,
      catalogContext,
    );
  }

  handleExplainPaymentOptionsForService(
    businessId: string,
    params: Record<string, any> = {},
    prompt = '',
    catalogContext?: Record<string, unknown>,
  ) {
    return handleExplainPaymentOptionsForServiceLogic(
      this.deps,
      businessId,
      params,
      prompt,
      catalogContext,
    );
  }

  handleFindSoonestAppointment(
    businessId: string,
    params: Record<string, any> = {},
    prompt = '',
  ) {
    return handleFindSoonestAppointmentLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleCompareServices(
    businessId: string,
    params: Record<string, any> = {},
    prompt = '',
  ) {
    return handleCompareServicesLogic(this.deps, businessId, params, prompt);
  }

  handleFilterServicesNoPrepayment(
    businessId: string,
    params: Record<string, any> = {},
    prompt = '',
  ) {
    return handleFilterServicesNoPrepaymentLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleExplainServiceOnlinePaymentSetup(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ): Promise<CommandResult> {
    return handleExplainServiceOnlinePaymentSetupLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleExplainPublicBookingCheckout(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ): Promise<CommandResult> {
    return handleExplainPublicBookingCheckoutLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleAuditServicesMissingOnlinePayment(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ): Promise<CommandResult> {
    return handleAuditServicesMissingOnlinePaymentLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleListSubscriptionRevenue(
    businessId: string,
    params: Record<string, any>,
  ) {
    return handleListSubscriptionRevenueLogic(this.deps, businessId, params);
  }

  handleConfigureCashPayments(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleConfigureCashPaymentsLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleConfigureCheckoutDefaults(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleConfigureCheckoutDefaultsLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleConfigureServiceDepositPolicy(
    businessId: string,
    params: Record<string, any>,
    prompt: string | undefined,
    catalogServices: Service[],
    userId?: string,
  ) {
    return handleConfigureServiceDepositPolicyLogic(
      this.deps,
      businessId,
      params,
      prompt,
      catalogServices,
      userId,
    );
  }

  handleConfigureServiceOnlinePayment(
    businessId: string,
    params: Record<string, any>,
    prompt: string | undefined,
    catalogServices: Service[],
    userId?: string,
  ) {
    return handleConfigureServiceOnlinePaymentLogic(
      this.deps,
      businessId,
      params,
      prompt,
      catalogServices,
      userId,
    );
  }

  handleAdjustGiftCardBalance(
    businessId: string,
    params: Record<string, any>,
    userId?: string,
  ) {
    return handleAdjustGiftCardBalanceLogic(
      this.deps,
      businessId,
      params,
      userId,
    );
  }

  handleExtendGiftCardExpiry(
    businessId: string,
    params: Record<string, any>,
    userId?: string,
  ) {
    return handleExtendGiftCardExpiryLogic(
      this.deps,
      businessId,
      params,
      userId,
    );
  }

  handleRefundGiftCardOrder(businessId: string, params: Record<string, any>) {
    return handleRefundGiftCardOrderLogic(this.deps, businessId, params);
  }

  handleExplainPaymentStatus(businessId: string, params: Record<string, any>) {
    return handleExplainPaymentStatusLogic(this.deps, businessId, params);
  }

  handleCollectCashConfirm(
    businessId: string,
    params: Record<string, any>,
    userId?: string,
  ) {
    return handleCollectCashConfirmLogic(this.deps, businessId, params, userId);
  }

  handleCheckProvidersForService(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleCheckProvidersForServiceLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleBookNearestSlot(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleBookNearestSlotLogic(this.deps, businessId, params, prompt);
  }

  handleApplyGiftCardCode(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleApplyGiftCardCodeLogic(this.deps, businessId, params, prompt);
  }

  handleCheckGiftCardBalance(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleCheckGiftCardBalanceLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleBuyGiftCard(
    businessId: string,
    params: Record<string, any>,
    physical = false,
  ) {
    return handleBuyGiftCardLogic(this.deps, businessId, params, physical);
  }

  handleBuyGiftCardForSomeone(
    businessId: string,
    params: Record<string, any> = {},
    prompt = '',
  ) {
    return handleBuyGiftCardForSomeoneLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleChoosePaymentMethod(
    businessId: string,
    params: Record<string, any> = {},
    prompt = '',
  ) {
    return handleChoosePaymentMethodLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handlePayOnline(
    businessId: string,
    params: Record<string, any> = {},
    prompt = '',
  ) {
    return handlePayOnlineLogic(this.deps, businessId, params, prompt);
  }

  handlePayCashAtVisit(
    businessId: string,
    params: Record<string, any> = {},
    prompt = '',
  ) {
    return handlePayCashAtVisitLogic(this.deps, businessId, params, prompt);
  }

  handlePurchaseSubscriptionCheckout(
    businessId: string,
    params: Record<string, any>,
  ) {
    return handlePurchaseSubscriptionCheckoutLogic(
      this.deps,
      businessId,
      params,
    );
  }

  handleExplainWhyStripeRequired(
    businessId: string,
    params: Record<string, any> = {},
    prompt = '',
    catalogContext?: Record<string, unknown>,
  ) {
    return handleExplainWhyStripeRequiredLogic(
      this.deps,
      businessId,
      params,
      prompt,
      catalogContext,
    );
  }

  handleReceiptStatus(businessId: string, params: Record<string, any>) {
    return handleReceiptStatusLogic(this.deps, businessId, params);
  }

  handlePaymentsCompound(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    userId?: string,
  ): Promise<CommandResult> {
    return handlePaymentsCompoundLogic(
      this.deps,
      businessId,
      prompt,
      params,
      userId,
    );
  }

  /** Registry-driven dispatch (ai-cmd-ext-6.2). Returns null when action is not a payments intent. */
  dispatchIntent(ctx: PaymentsDispatchContext): Promise<CommandResult | null> {
    return dispatchPaymentsLogicIntent(this.deps, ctx);
  }
}
