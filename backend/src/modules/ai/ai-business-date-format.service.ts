import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { ClinicTestResult } from '../clinic-test-results/entities/clinic-test-result.entity.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import type { CommandResult } from './command-completion.types.js';
import {
  handleAuditDashboardDateSurfacesLogic,
  handleConfigureBusinessDateFormatLogic,
  handleExplainBookingDateFormatLogic,
  handleExplainBusinessDateFormatLogic,
  handleConfigureProviderPushDateFormatLogic,
  handleExplainDateInputFormatLogic,
  handleExplainProviderDateDisplayLogic,
  handleExplainNotificationDateFormatLogic,
  handleMigrateDashboardDateDisplayLogic,
  handleNotifyPatientResultReadyLogic,
  handlePreviewBusinessDateFormatLogic,
  handlePreviewDateInputParseLogic,
  handlePreviewNotificationDatetimeLogic,
  type BusinessDateFormatLogicDeps,
} from './ai-business-date-format.logic.js';

@Injectable()
export class AiBusinessDateFormatService {
  private readonly deps: BusinessDateFormatLogicDeps;

  constructor(
    @InjectRepository(Business) businessRepo: Repository<Business>,
    @InjectRepository(ClinicTestResult)
    resultRepo: Repository<ClinicTestResult>,
    notificationsService: NotificationsService,
    configService: ConfigService,
  ) {
    this.deps = {
      businessRepo,
      resultRepo,
      sendClinicResultReady: (resultId) =>
        notificationsService.sendClinicResultReady(resultId),
      frontendUrl: configService.get<string>('FRONTEND_URL') ?? null,
    };
  }

  handleConfigureBusinessDateFormat(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handleConfigureBusinessDateFormatLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleExplainBusinessDateFormat(businessId: string): Promise<CommandResult> {
    return handleExplainBusinessDateFormatLogic(this.deps, businessId);
  }

  handleExplainBookingDateFormat(businessId: string): Promise<CommandResult> {
    return handleExplainBookingDateFormatLogic(this.deps, businessId);
  }

  handlePreviewBusinessDateFormat(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handlePreviewBusinessDateFormatLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleAuditDashboardDateSurfaces(businessId: string): Promise<CommandResult> {
    return handleAuditDashboardDateSurfacesLogic(this.deps, businessId);
  }

  handleMigrateDashboardDateDisplay(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
    confirmed = false,
  ): Promise<CommandResult> {
    return handleMigrateDashboardDateDisplayLogic(
      this.deps,
      businessId,
      params,
      prompt,
      confirmed,
    );
  }

  handleExplainNotificationDateFormat(
    businessId: string,
  ): Promise<CommandResult> {
    return handleExplainNotificationDateFormatLogic(this.deps, businessId);
  }

  handlePreviewNotificationDatetime(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handlePreviewNotificationDatetimeLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleNotifyPatientResultReady(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
    confirmed = false,
  ): Promise<CommandResult> {
    return handleNotifyPatientResultReadyLogic(
      this.deps,
      businessId,
      params,
      prompt,
      confirmed,
    );
  }

  handleExplainDateInputFormat(businessId: string): Promise<CommandResult> {
    return handleExplainDateInputFormatLogic(this.deps, businessId);
  }

  handlePreviewDateInputParse(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
  ): Promise<CommandResult> {
    return handlePreviewDateInputParseLogic(
      this.deps,
      businessId,
      params,
      prompt,
    );
  }

  handleExplainProviderDateDisplay(businessId: string): Promise<CommandResult> {
    return handleExplainProviderDateDisplayLogic(this.deps, businessId);
  }

  handleConfigureProviderPushDateFormat(
    businessId: string,
    params: Record<string, unknown> = {},
    prompt?: string,
    confirmed = false,
  ): Promise<CommandResult> {
    return handleConfigureProviderPushDateFormatLogic(
      this.deps,
      businessId,
      params,
      prompt,
      confirmed,
    );
  }
}
