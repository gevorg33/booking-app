import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { MarketingAutomationService } from '../marketing-automation/marketing-automation.service.js';
import { PlanEntitlementsService } from '../billing/plan-entitlements.service.js';
import { BillingService } from '../billing/billing.service.js';
import { LoyaltyService } from '../loyalty/loyalty.service.js';
import { PromoCodesService } from '../promo-codes/promo-codes.service.js';
import { StripeService } from '../billing/stripe.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  decomposeMarketingGrowthCompoundPrompt,
  isMarketingGrowthCompoundPrompt,
  rescueMarketingGrowthIntent,
} from './ai-marketing-growth.util.js';
import {
  handleConfigureMarketingAutomationLogic,
  handleExplainPlanLimitsLogic,
  handleHowToDownloadAppLogic,
  handleListInactiveCustomersLogic,
  handleLoyaltyPointsBalanceLogic,
  handleMarketingGrowthCompoundLogic,
  handlePromoCodeHelpLogic,
  handleSuggestUpgradeLogic,
  handleSummarizeAutomationPerformanceLogic,
  handleSummarizeNewRegistrationsLogic,
  handleSwitchToConsumerAppLogic,
  handleToggleAnnualBillingLogic,
  handleTriggerReengagementLogic,
  type MarketingGrowthLogicDeps,
} from './ai-marketing-growth.logic.js';

@Injectable()
export class AiMarketingGrowthService {
  private readonly deps: MarketingGrowthLogicDeps;

  constructor(
    marketingAutomationService: MarketingAutomationService,
    planEntitlementsService: PlanEntitlementsService,
    billingService: BillingService,
    loyaltyService: LoyaltyService,
    promoCodesService: PromoCodesService,
    stripeService: StripeService,
    configService: ConfigService,
    @InjectRepository(Customer) customerRepo: Repository<Customer>,
    @InjectRepository(Business) businessRepo: Repository<Business>,
  ) {
    this.deps = {
      marketingAutomationService,
      planEntitlementsService,
      billingService,
      loyaltyService,
      promoCodesService,
      stripeService,
      configService,
      customerRepo,
      businessRepo,
    };
  }

  rescueMarketingGrowthIntent(prompt: string, action: string) {
    return rescueMarketingGrowthIntent(prompt, action);
  }

  isMarketingGrowthCompound(prompt: string) {
    return isMarketingGrowthCompoundPrompt(prompt);
  }

  decomposeMarketingGrowthCompound(prompt: string) {
    return decomposeMarketingGrowthCompoundPrompt(prompt);
  }

  handleConfigureMarketingAutomation(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleConfigureMarketingAutomationLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleSummarizeAutomationPerformance(businessId: string) {
    return handleSummarizeAutomationPerformanceLogic(this.deps, businessId);
  }

  handleTriggerReengagement(businessId: string) {
    return handleTriggerReengagementLogic(this.deps, businessId);
  }

  handleListInactiveCustomers(businessId: string) {
    return handleListInactiveCustomersLogic(this.deps, businessId);
  }

  handleExplainPlanLimits(businessId: string) {
    return handleExplainPlanLimitsLogic(this.deps, businessId);
  }

  handleSuggestUpgrade(businessId: string) {
    return handleSuggestUpgradeLogic(this.deps, businessId);
  }

  handleToggleAnnualBilling(
    businessId: string,
    params: Record<string, any>,
    userEmail?: string,
  ) {
    return handleToggleAnnualBillingLogic(
      this.deps,
      businessId,
      params,
      userEmail,
    );
  }

  handleSummarizeNewRegistrations(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleSummarizeNewRegistrationsLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleHowToDownloadApp(businessId: string) {
    return handleHowToDownloadAppLogic(this.deps, businessId);
  }

  handleSwitchToConsumerApp(businessId: string) {
    return handleSwitchToConsumerAppLogic(this.deps, businessId);
  }

  handlePromoCodeHelp(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handlePromoCodeHelpLogic(this.deps, businessId, params, prompt);
  }

  handleLoyaltyPointsBalance(businessId: string, params: Record<string, any>) {
    return handleLoyaltyPointsBalanceLogic(this.deps, businessId, params);
  }

  handleMarketingGrowthCompound(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    userEmail?: string,
  ): Promise<CommandResult> {
    return handleMarketingGrowthCompoundLogic(
      this.deps,
      businessId,
      prompt,
      params,
      userEmail,
    );
  }
}
