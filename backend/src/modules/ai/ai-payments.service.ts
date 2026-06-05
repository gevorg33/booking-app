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
import type { CommandResult } from './command-completion.types.js';
import {
  decomposePaymentsCompoundPrompt,
  isPaymentsCompoundPrompt,
  rescuePaymentsIntent,
} from './ai-payments.util.js';
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
  handleExplainCheckoutTotalLogic,
  handleExplainPaymentStatusLogic,
  handleExplainWhyStripeRequiredLogic,
  handleExportAccountingLogic,
  handleExportCommissionsLogic,
  handleExtendGiftCardExpiryLogic,
  handleListSubscriptionRevenueLogic,
  handlePayCashAtVisitLogic,
  handlePayOnlineLogic,
  handlePaymentsCompoundLogic,
  handlePurchaseSubscriptionCheckoutLogic,
  handleReceiptStatusLogic,
  handleRefundGiftCardOrderLogic,
  handleSummarizeUnpaidLogic,
  handleValidateGiftCardLogic,
  type PaymentsLogicDeps,
} from './ai-payments.logic.js';

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

  handleExplainCheckoutTotal(businessId: string, params: Record<string, any>) {
    return handleExplainCheckoutTotalLogic(this.deps, businessId, params);
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

  handleChoosePaymentMethod(businessId: string) {
    return handleChoosePaymentMethodLogic(this.deps, businessId);
  }

  handlePayOnline(businessId: string) {
    return handlePayOnlineLogic(this.deps, businessId);
  }

  handlePayCashAtVisit(businessId: string) {
    return handlePayCashAtVisitLogic(this.deps, businessId);
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

  handleExplainWhyStripeRequired(businessId: string) {
    return handleExplainWhyStripeRequiredLogic(this.deps, businessId);
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
}
