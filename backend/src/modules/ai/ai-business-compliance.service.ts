import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { Customer } from '../customer/entities/customer.entity.js';
import { CustomerPrivacyService } from '../customer/customer-privacy.service.js';
import { ComplianceBreachService } from '../compliance/compliance-breach.service.js';
import { PhiAccessAuditService } from '../compliance/phi-access-audit.service.js';
import { BusinessService } from '../business/business.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  handleAcceptHipaaBaaLogic,
  handleAdminDeleteCustomerDataLogic,
  handleConfigureGranularConsentLogic,
  handleConfigurePrivacyRetentionLogic,
  handleConfigureHipaaSessionTimeoutLogic,
  handleEnableHipaaModeLogic,
  handleExplainComplianceStatusLogic,
  handleExplainGdprChecklistLogic,
  handleOpenComplianceDashboardLogic,
  handleExplainDataRightsLogic,
  handleExplainHipaaSessionTimeoutLogic,
  handleExplainMinimumNecessaryPhiAccessLogic,
  handleExplainPhiEncryptionStatusLogic,
  handleExplainProviderSessionTimeoutLogic,
  handleListBreachIncidentsLogic,
  handleListSubProcessorsLogic,
  handleReportDataBreachLogic,
  handleSendBreachNotificationLogic,
  handleViewPhiAccessAuditLogic,
  type BusinessComplianceLogicDeps,
} from './ai-business-compliance.logic.js';

@Injectable()
export class AiBusinessComplianceService {
  private readonly deps: BusinessComplianceLogicDeps;

  constructor(
    @InjectRepository(Business) businessRepo: Repository<Business>,
    @InjectRepository(Customer) customerRepo: Repository<Customer>,
    customerPrivacyService: CustomerPrivacyService,
    complianceBreachService: ComplianceBreachService,
    phiAccessAuditService: PhiAccessAuditService,
    businessService: BusinessService,
  ) {
    this.deps = {
      businessRepo,
      customerRepo,
      customerPrivacyService,
      complianceBreachService,
      phiAccessAuditService,
      businessService,
    };
  }

  handleConfigurePrivacyRetention(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleConfigurePrivacyRetentionLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleConfigureGranularConsent(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleConfigureGranularConsentLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleEnableHipaaMode(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleEnableHipaaModeLogic(this.deps, businessId, params, prompt);
  }

  handleExplainComplianceStatus(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleExplainComplianceStatusLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleAdminDeleteCustomerData(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleAdminDeleteCustomerDataLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleExplainDataRights(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleExplainDataRightsLogic(this.deps, businessId, params, prompt);
  }

  handleReportDataBreach(
    businessId: string,
    userId: string | undefined,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleReportDataBreachLogic(
      this.deps,
      businessId,
      userId,
      params,
      prompt,
    );
  }

  handleSendBreachNotification(
    businessId: string,
    userId: string | undefined,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleSendBreachNotificationLogic(
      this.deps,
      businessId,
      userId,
      params,
      prompt,
    );
  }

  handleListBreachIncidents(
    businessId: string,
    userId: string | undefined,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleListBreachIncidentsLogic(
      this.deps,
      businessId,
      userId,
      params,
      prompt,
    );
  }

  handleViewPhiAccessAudit(
    businessId: string,
    userId: string | undefined,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleViewPhiAccessAuditLogic(
      this.deps,
      businessId,
      userId,
      params,
      prompt,
    );
  }

  handleExplainPhiEncryptionStatus(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleExplainPhiEncryptionStatusLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleExplainMinimumNecessaryPhiAccess(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleExplainMinimumNecessaryPhiAccessLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleExplainHipaaSessionTimeout(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleExplainHipaaSessionTimeoutLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleExplainProviderSessionTimeout(
    businessId: string,
  ): Promise<CommandResult> {
    return handleExplainProviderSessionTimeoutLogic(this.deps, businessId);
  }

  handleConfigureHipaaSessionTimeout(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleConfigureHipaaSessionTimeoutLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleAcceptHipaaBaa(
    businessId: string,
    userId: string | undefined,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleAcceptHipaaBaaLogic(
      this.deps,
      businessId,
      userId,
      params,
      prompt,
    );
  }

  handleListSubProcessors(
    businessId: string,
    userId: string | undefined,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleListSubProcessorsLogic(
      this.deps,
      businessId,
      userId,
      params,
      prompt,
    );
  }

  handleExplainGdprChecklist(
    businessId: string,
    userId: string | undefined,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleExplainGdprChecklistLogic(
      this.deps,
      businessId,
      userId,
      params,
      prompt,
    );
  }

  handleOpenComplianceDashboard(
    businessId: string,
    userId: string | undefined,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleOpenComplianceDashboardLogic(
      this.deps,
      businessId,
      userId,
      params,
      prompt,
    );
  }
}
