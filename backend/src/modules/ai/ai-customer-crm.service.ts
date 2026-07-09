import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../customer/entities/customer.entity.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { CustomerSubscription } from '../service-subscriptions/entities/subscription.entity.js';
import { GiftCard } from '../gift-cards/entities/gift-card.entity.js';
import { GiftCardChangeRequest } from '../gift-cards/entities/gift-card-change-request.entity.js';
import { CustomerService } from '../customer/customer.service.js';
import { CustomerPrivacyService } from '../customer/customer-privacy.service.js';
import { ServiceSubscriptionsService } from '../service-subscriptions/service-subscriptions.service.js';
import { GiftCardOrderService } from '../gift-cards/gift-card-order.service.js';
import { GiftCardClaimService } from '../gift-cards/gift-card-claim.service.js';
import { ServicePackagesService } from '../service-packages/service-packages.service.js';
import { ZendeskIntegrationService } from '../integrations/zendesk/zendesk-integration.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  decomposeCrmCompoundPrompt,
  isCrmCompoundPrompt,
  rescueCustomerCrmIntent,
} from './ai-customer-crm.util.js';
import {
  handleCancelSubscriptionAdminLogic,
  handleCrmCompoundLogic,
  handleCustomerNoShowHistoryLogic,
  handleDeleteCustomerDataLogic,
  handleDiscoverGiftCardProductsLogic,
  handleDiscoverPackagesLogic,
  handleDiscoverSubscriptionPlansLogic,
  handleExportCustomerDataLogic,
  handleExtendSubscriptionLogic,
  handleGiftCardBalanceLogic,
  handleGiftCardRedemptionHistoryLogic,
  handleListCustomerBookingsLogic,
  handleListCustomerGiftCardsLogic,
  handleListCustomerSubscriptionsLogic,
  handleMergeCustomersLogic,
  handleMyAppointmentsLogic,
  handleMyGiftCardsLogic,
  handleMyProfileLogic,
  handleMySubscriptionsLogic,
  handlePrivacyDeleteLogic,
  handlePrivacyExportLogic,
  handleClaimGiftCardBalanceLogic,
  handleRequestGiftCardCancelLogic,
  handleRequestGiftCardModifyLogic,
  handleSendReengagementMessageLogic,
  handleSubscriptionUsageHistoryLogic,
  handleSubscriptionUsageLogic,
  handleTagCustomerLogic,
  handleUpdateCustomerLogic,
  handleTrackPhysicalGiftCardOrderLogic,
  handleExplainGiftCardOrderLogic,
  type CustomerCrmLogicDeps,
} from './ai-customer-crm.logic.js';
import { handleExplainMySubscriptionLogic } from './ai-explain-my-subscription.logic.js';
import { handleUpdateMyProfileLogic } from './ai-update-my-profile.logic.js';
import {
  handleGetMyLocaleLogic,
  handleUpdateMyLocaleLogic,
} from './ai-my-locale.logic.js';
import { PublicCustomerAuthService } from '../public-booking/public-customer-auth.service.js';

@Injectable()
export class AiCustomerCrmService {
  private readonly deps: CustomerCrmLogicDeps;

  constructor(
    customerService: CustomerService,
    customerPrivacyService: CustomerPrivacyService,
    subscriptionsService: ServiceSubscriptionsService,
    giftCardOrderService: GiftCardOrderService,
    giftCardClaimService: GiftCardClaimService,
    packagesService: ServicePackagesService,
    zendeskService: ZendeskIntegrationService,
    @InjectRepository(Booking) bookingRepo: Repository<Booking>,
    @InjectRepository(Customer) customerRepo: Repository<Customer>,
    @InjectRepository(CustomerSubscription)
    subscriptionRepo: Repository<CustomerSubscription>,
    @InjectRepository(GiftCardChangeRequest)
    changeRequestRepo: Repository<GiftCardChangeRequest>,
    @InjectRepository(GiftCard) giftCardRepo: Repository<GiftCard>,
    @InjectRepository(Business) businessRepo: Repository<Business>,
    publicCustomerAuthService: PublicCustomerAuthService,
  ) {
    this.deps = {
      customerService,
      customerPrivacyService,
      subscriptionsService,
      giftCardOrderService,
      giftCardClaimService,
      packagesService,
      zendeskService,
      bookingRepo,
      customerRepo,
      subscriptionRepo,
      changeRequestRepo,
      giftCardRepo,
      businessRepo,
      publicCustomerAuthService,
    };
  }

  rescueCrmIntent(prompt: string, action: string) {
    return rescueCustomerCrmIntent(prompt, action);
  }

  isCrmCompound(prompt: string) {
    return isCrmCompoundPrompt(prompt);
  }

  decomposeCrmCompound(prompt: string) {
    return decomposeCrmCompoundPrompt(prompt);
  }

  handleListCustomerSubscriptions(
    businessId: string,
    params: Record<string, any>,
    customers: Customer[],
    resolveCustomer: (list: Customer[], name: string) => Customer | undefined,
  ) {
    return handleListCustomerSubscriptionsLogic(
      this.deps,
      businessId,
      params,
      customers,
      resolveCustomer,
    );
  }

  handleSubscriptionUsageHistory(
    businessId: string,
    params: Record<string, any>,
    customers: Customer[],
    resolveCustomer: (list: Customer[], name: string) => Customer | undefined,
  ) {
    return handleSubscriptionUsageHistoryLogic(
      this.deps,
      businessId,
      params,
      customers,
      resolveCustomer,
    );
  }

  handleExtendSubscription(
    businessId: string,
    params: Record<string, any>,
    customers: Customer[],
    resolveCustomer: (list: Customer[], name: string) => Customer | undefined,
  ) {
    return handleExtendSubscriptionLogic(
      this.deps,
      businessId,
      params,
      customers,
      resolveCustomer,
    );
  }

  handleCancelSubscriptionAdmin(
    businessId: string,
    params: Record<string, any>,
    customers: Customer[],
    resolveCustomer: (list: Customer[], name: string) => Customer | undefined,
  ) {
    return handleCancelSubscriptionAdminLogic(
      this.deps,
      businessId,
      params,
      customers,
      resolveCustomer,
    );
  }

  handleListCustomerGiftCards(
    businessId: string,
    params: Record<string, any>,
    customers: Customer[],
    resolveCustomer: (list: Customer[], name: string) => Customer | undefined,
  ) {
    return handleListCustomerGiftCardsLogic(
      this.deps,
      businessId,
      params,
      customers,
      resolveCustomer,
    );
  }

  handleListCustomerBookings(
    businessId: string,
    params: Record<string, any>,
    customers: Customer[],
    resolveCustomer: (list: Customer[], name: string) => Customer | undefined,
  ) {
    return handleListCustomerBookingsLogic(
      this.deps,
      businessId,
      params,
      customers,
      resolveCustomer,
    );
  }

  handleCustomerNoShowHistory(
    businessId: string,
    params: Record<string, any>,
    customers: Customer[],
    resolveCustomer: (list: Customer[], name: string) => Customer | undefined,
  ) {
    return handleCustomerNoShowHistoryLogic(
      this.deps,
      businessId,
      params,
      customers,
      resolveCustomer,
    );
  }

  handleTagCustomer(
    businessId: string,
    params: Record<string, any>,
    customers: Customer[],
    resolveCustomer: (list: Customer[], name: string) => Customer | undefined,
  ) {
    return handleTagCustomerLogic(
      this.deps,
      businessId,
      params,
      customers,
      resolveCustomer,
    );
  }

  handleUpdateCustomer(
    businessId: string,
    params: Record<string, any>,
    customers: Customer[],
    resolveCustomer: (list: Customer[], name: string) => Customer | undefined,
  ) {
    return handleUpdateCustomerLogic(
      this.deps,
      businessId,
      params,
      customers,
      resolveCustomer,
    );
  }

  handleExportCustomerData(
    businessId: string,
    params: Record<string, any>,
    customers: Customer[],
    resolveCustomer: (list: Customer[], name: string) => Customer | undefined,
  ) {
    return handleExportCustomerDataLogic(
      this.deps,
      businessId,
      params,
      customers,
      resolveCustomer,
    );
  }

  handleDeleteCustomerData(
    businessId: string,
    params: Record<string, any>,
    customers: Customer[],
    resolveCustomer: (list: Customer[], name: string) => Customer | undefined,
  ) {
    return handleDeleteCustomerDataLogic(
      this.deps,
      businessId,
      params,
      customers,
      resolveCustomer,
    );
  }

  handleSendReengagementMessage(
    businessId: string,
    params: Record<string, any>,
    customers: Customer[],
    resolveCustomer: (list: Customer[], name: string) => Customer | undefined,
  ) {
    return handleSendReengagementMessageLogic(
      this.deps,
      businessId,
      params,
      customers,
      resolveCustomer,
    );
  }

  handleMergeCustomers(
    businessId: string,
    params: Record<string, any>,
    customers: Customer[],
    resolveCustomer: (list: Customer[], name: string) => Customer | undefined,
  ) {
    return handleMergeCustomersLogic(
      this.deps,
      businessId,
      params,
      customers,
      resolveCustomer,
    );
  }

  handleMyProfile(businessId: string, params: Record<string, any>) {
    return handleMyProfileLogic(this.deps, businessId, params);
  }

  handleGetMyLocale(businessId: string, params: Record<string, any>) {
    return handleGetMyLocaleLogic(this.deps, businessId, params);
  }

  handleUpdateMyLocale(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleUpdateMyLocaleLogic(this.deps, businessId, params, prompt);
  }

  handleMyAppointments(businessId: string, params: Record<string, any>) {
    return handleMyAppointmentsLogic(this.deps, businessId, params);
  }

  handleMySubscriptions(businessId: string, params: Record<string, any>) {
    return handleMySubscriptionsLogic(this.deps, businessId, params);
  }

  handleExplainMySubscription(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleExplainMySubscriptionLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleUpdateMyProfile(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleUpdateMyProfileLogic(this.deps, businessId, params, prompt);
  }

  handleSubscriptionUsage(businessId: string, params: Record<string, any>) {
    return handleSubscriptionUsageLogic(this.deps, businessId, params);
  }

  handleMyGiftCards(businessId: string, params: Record<string, any>) {
    return handleMyGiftCardsLogic(this.deps, businessId, params);
  }

  handleGiftCardBalance(businessId: string, params: Record<string, any>) {
    return handleGiftCardBalanceLogic(this.deps, businessId, params);
  }

  handleGiftCardRedemptionHistory(
    businessId: string,
    params: Record<string, any>,
  ) {
    return handleGiftCardRedemptionHistoryLogic(this.deps, businessId, params);
  }

  handleRequestGiftCardCancel(businessId: string, params: Record<string, any>) {
    return handleRequestGiftCardCancelLogic(this.deps, businessId, params);
  }

  handleRequestGiftCardModify(businessId: string, params: Record<string, any>) {
    return handleRequestGiftCardModifyLogic(this.deps, businessId, params);
  }

  handleTrackPhysicalGiftCardOrder(
    businessId: string,
    params: Record<string, any>,
  ) {
    return handleTrackPhysicalGiftCardOrderLogic(this.deps, businessId, params);
  }

  handleExplainGiftCardOrder(businessId: string, params: Record<string, any>) {
    return handleExplainGiftCardOrderLogic(this.deps, businessId, params);
  }

  handlePrivacyExport(
    businessId: string,
    params: Record<string, any>,
    prompt = '',
  ) {
    return handlePrivacyExportLogic(this.deps, businessId, params, prompt);
  }

  handleClaimGiftCardBalance(
    businessId: string,
    params: Record<string, any>,
    prompt = '',
  ) {
    return handleClaimGiftCardBalanceLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handlePrivacyDelete(
    businessId: string,
    params: Record<string, any>,
    prompt = '',
  ) {
    return handlePrivacyDeleteLogic(this.deps, businessId, params, prompt);
  }

  handleDiscoverPackages(businessId: string) {
    return handleDiscoverPackagesLogic(this.deps, businessId);
  }

  handleDiscoverSubscriptionPlans(
    businessId: string,
    params: Record<string, any>,
  ) {
    return handleDiscoverSubscriptionPlansLogic(this.deps, businessId, params);
  }

  handleDiscoverGiftCardProducts(businessId: string) {
    return handleDiscoverGiftCardProductsLogic(this.deps, businessId);
  }

  handleCrmCompound(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    customers: Customer[],
    resolveCustomer: (list: Customer[], name: string) => Customer | undefined,
    userId?: string,
  ): Promise<CommandResult> {
    return handleCrmCompoundLogic(
      this.deps,
      businessId,
      prompt,
      params,
      customers,
      resolveCustomer,
      userId,
    );
  }
}
