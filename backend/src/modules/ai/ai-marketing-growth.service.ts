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
import { StripeIntegrationService } from '../billing/stripe-integration.service.js';
import { TenantAppInstallService } from '../business/tenant-app-install.service.js';
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
  handleConfirmBillingCheckoutLogic,
  handleExplainPlanEntitlementsLogic,
  handleOpenBillingSettingsLogic,
  handleStartBillingCheckoutLogic,
  handlePromoCodeHelpLogic,
  handleSummarizeLoyaltyProgramLogic,
  handleSuggestUpgradeLogic,
  handleSummarizeAutomationPerformanceLogic,
  handleSummarizeNewRegistrationsLogic,
  handleSwitchToConsumerAppLogic,
  handleToggleAnnualBillingLogic,
  handleTriggerReengagementLogic,
  type MarketingGrowthLogicDeps,
} from './ai-marketing-growth.logic.js';
import { handleConfigureStripeConnectLogic } from './ai-stripe-connect.logic.js';
import { handleExplainTenantAppInstallLogic } from './ai-tenant-app-install.logic.js';
import { handleRegenerateTenantAppInstallQrLogic } from './ai-tenant-app-install.logic.js';
import {
  handleCreatePromoCodeLogic,
  handleDeactivatePromoCodeLogic,
} from './ai-create-promo-code.logic.js';
import { handleApplyPromoCodeCheckoutLogic } from './ai-apply-promo-code-checkout.logic.js';
import { handleApplyLoyaltyAtCheckoutLogic } from './ai-apply-loyalty-at-checkout.logic.js';
import { handleConfigureLoyaltySettingsLogic } from './ai-configure-loyalty-settings.logic.js';
import { handleExplainLoyaltyPointsLogic } from './ai-explain-loyalty-points.logic.js';

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
    stripeIntegrationService: StripeIntegrationService,
    configService: ConfigService,
    tenantAppInstallService: TenantAppInstallService,
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
      stripeIntegrationService,
      configService,
      customerRepo,
      businessRepo,
      tenantAppInstallService,
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

  handleConfigureStripeConnect(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ): Promise<CommandResult> {
    return handleConfigureStripeConnectLogic(
      { stripeIntegrationService: this.deps.stripeIntegrationService },
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

  handleApplyPromoCodeCheckout(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleApplyPromoCodeCheckoutLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleApplyLoyaltyAtCheckout(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleApplyLoyaltyAtCheckoutLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleLoyaltyPointsBalance(businessId: string, params: Record<string, any>) {
    return handleLoyaltyPointsBalanceLogic(this.deps, businessId, params);
  }

  handleExplainLoyaltyPoints(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleExplainLoyaltyPointsLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleOpenBillingSettings(businessId: string) {
    return handleOpenBillingSettingsLogic(this.deps, businessId);
  }

  handleStartBillingCheckout(businessId: string, params: Record<string, any>) {
    return handleStartBillingCheckoutLogic(this.deps, businessId, params);
  }

  handleConfirmBillingCheckout(businessId: string, params: Record<string, any>) {
    return handleConfirmBillingCheckoutLogic(this.deps, businessId, params);
  }

  handleExplainPlanEntitlements(businessId: string) {
    return handleExplainPlanEntitlementsLogic(this.deps, businessId);
  }

  handleSummarizeLoyaltyProgram(businessId: string) {
    return handleSummarizeLoyaltyProgramLogic(this.deps, businessId);
  }

  handleExplainTenantAppInstall(businessId: string) {
    return handleExplainTenantAppInstallLogic(this.deps, businessId);
  }

  handleRegenerateTenantAppInstallQr(businessId: string) {
    return handleRegenerateTenantAppInstallQrLogic(this.deps, businessId);
  }

  handleCreatePromoCode(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleCreatePromoCodeLogic(this.deps, businessId, params, prompt);
  }

  handleDeactivatePromoCode(businessId: string, params: Record<string, any>) {
    return handleDeactivatePromoCodeLogic(this.deps, businessId, params);
  }

  handleConfigureLoyaltySettings(
    businessId: string,
    params: Record<string, any>,
    prompt?: string,
  ) {
    return handleConfigureLoyaltySettingsLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
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
