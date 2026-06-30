import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../business/entities/business.entity.js';
import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { StripeIntegrationService } from '../billing/stripe-integration.service.js';
import type { CommandResult } from './command-completion.types.js';
import type { GuideFlowSurface } from './guide/guide-flow.types.js';
import type { ProductGuideSessionContext } from './ai-product-guide-session.util.js';
import {
  runEmptyStateGuideIntentLogic,
  type EmptyStateGuideLogicDeps,
} from './ai-product-guide-empty-state.logic.js';
import type { EmptyStateGuideIntent } from './ai-product-guide-empty-state.fixtures.js';

@Injectable()
export class AiProductGuideEmptyStateService {
  private readonly deps: EmptyStateGuideLogicDeps;

  constructor(
    @InjectRepository(Business) businessRepo: Repository<Business>,
    @InjectRepository(Service) serviceRepo: Repository<Service>,
    @InjectRepository(Employee) employeeRepo: Repository<Employee>,
    private readonly stripeIntegrationService: StripeIntegrationService,
  ) {
    this.deps = {
      businessRepo,
      serviceRepo,
      employeeRepo,
      stripeIntegrationService,
    };
  }

  get logicDeps(): EmptyStateGuideLogicDeps {
    return this.deps;
  }

  runIntent(input: {
    businessId: string;
    intent: EmptyStateGuideIntent;
    surface: GuideFlowSurface;
    prompt: string;
    params?: Record<string, unknown>;
    session?: { context?: Record<string, unknown> };
    sessionContext?: ProductGuideSessionContext;
    locale?: string;
    linkedEmployeeId?: string;
  }): Promise<CommandResult> {
    const ctx = {
      businessId: input.businessId,
      surface: input.surface,
      locale: input.locale ?? input.sessionContext?.locale,
      prompt: input.prompt,
      params: input.params,
      route: input.sessionContext?.route,
      role: input.sessionContext?.role,
      enabledModules: input.sessionContext?.enabledModules,
      linkedEmployeeId: input.linkedEmployeeId,
      session: input.session,
      planTierId: input.sessionContext?.planTierId,
    };
    return runEmptyStateGuideIntentLogic(this.deps, input.intent, ctx);
  }
}
