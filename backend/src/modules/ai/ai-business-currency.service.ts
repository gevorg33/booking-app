import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { ServicePackage } from '../service-packages/entities/service-package.entity.js';
import type { CommandResult } from './command-completion.types.js';
import {
  handleBulkUpdateServiceCurrencyLogic,
  handleConfigureBusinessCurrencyLogic,
  handleExplainBusinessCurrencyLogic,
  handleExplainCheckoutCurrencyLogic,
  handleExplainTenantCurrencyLogic,
  handleExplainPackageCurrencyLogic,
  handleExplainProviderPaymentCurrencyLogic,
  handleExplainNotificationCurrencyLogic,
  handleExplainStripeCurrencyWarningLogic,
  handleExplainStripeCheckoutCurrencyLogic,
  handleDiagnoseStripeCheckoutFailureLogic,
  handleExplainReportsCurrencyLogic,
  handleSummarizeRevenueKpisLogic,
  type BusinessCurrencyLogicDeps,
} from './ai-business-currency.logic.js';
import { DashboardService } from '../business/dashboard.service.js';
import { AnalyticsService } from '../analytics/analytics.service.js';

@Injectable()
export class AiBusinessCurrencyService {
  private readonly deps: BusinessCurrencyLogicDeps;

  constructor(
    dashboardService: DashboardService,
    analyticsService: AnalyticsService,
    @InjectRepository(Business) businessRepo: Repository<Business>,
    @InjectRepository(Service) serviceRepo: Repository<Service>,
    @InjectRepository(ServicePackage) packageRepo: Repository<ServicePackage>,
  ) {
    this.deps = {
      businessRepo,
      serviceRepo,
      packageRepo,
      dashboardService,
      analyticsService,
    };
  }

  handleConfigureBusinessCurrency(
    businessId: string,
    params: Record<string, unknown>,
    prompt?: string,
  ): Promise<CommandResult> {
    return handleConfigureBusinessCurrencyLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleExplainBusinessCurrency(businessId: string): Promise<CommandResult> {
    return handleExplainBusinessCurrencyLogic(this.deps, businessId);
  }

  handleBulkUpdateServiceCurrency(
    businessId: string,
    params: Record<string, unknown>,
    prompt?: string,
    confirmed = false,
  ): Promise<CommandResult> {
    return handleBulkUpdateServiceCurrencyLogic(
      this.deps,
      businessId,
      params,
      prompt,
      confirmed,
    );
  }

  handleExplainCheckoutCurrency(businessId: string): Promise<CommandResult> {
    return handleExplainCheckoutCurrencyLogic(this.deps, businessId);
  }

  handleExplainTenantCurrency(businessId: string): Promise<CommandResult> {
    return handleExplainTenantCurrencyLogic(this.deps, businessId);
  }

  handleExplainPackageCurrency(businessId: string): Promise<CommandResult> {
    return handleExplainPackageCurrencyLogic(this.deps, businessId);
  }

  handleExplainProviderPaymentCurrency(
    businessId: string,
  ): Promise<CommandResult> {
    return handleExplainProviderPaymentCurrencyLogic(this.deps, businessId);
  }

  handleExplainNotificationCurrency(businessId: string): Promise<CommandResult> {
    return handleExplainNotificationCurrencyLogic(this.deps, businessId);
  }

  handleExplainStripeCurrencyWarning(
    businessId: string,
  ): Promise<CommandResult> {
    return handleExplainStripeCurrencyWarningLogic(this.deps, businessId);
  }

  handleExplainStripeCheckoutCurrency(
    businessId: string,
  ): Promise<CommandResult> {
    return handleExplainStripeCheckoutCurrencyLogic(this.deps, businessId);
  }

  handleDiagnoseStripeCheckoutFailure(
    businessId: string,
  ): Promise<CommandResult> {
    return handleDiagnoseStripeCheckoutFailureLogic(this.deps, businessId);
  }

  handleExplainReportsCurrency(businessId: string): Promise<CommandResult> {
    return handleExplainReportsCurrencyLogic(this.deps, businessId);
  }

  handleSummarizeRevenueKpis(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleSummarizeRevenueKpisLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }
}
