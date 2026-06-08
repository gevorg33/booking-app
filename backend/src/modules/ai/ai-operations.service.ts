import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { CommandOrchestrationService } from './command-orchestration.service.js';
import { OperationalPlanBuilderService } from './operational-plan-builder.service.js';
import { CommandResult } from './ai-command.service.js';
import { AgentPlan } from '../../engine/agent/interfaces/agent.interfaces.js';
import {
  applyPaymentSweepFilters,
  buildImportServicesFailure,
  buildNoShowRecoveryFailure,
  buildSickDayReplanFailure,
  buildStaffServiceMatrixFailure,
  buildUpdateServicePricesFailure,
  executeOperationsPlan,
  handleCheckScheduleComplianceLogic,
  handleRevenueForecastLogic,
  prepareImportServicesFromMenuPlanLogic,
  prepareNoShowRecoveryPlanLogic,
  prepareSickDayReplanPlanLogic,
  prepareStaffServiceMatrixPlanLogic,
  prepareUpdateServicePricesPlanLogic,
  type OperationsLogicDeps,
} from './ai-operations.logic.js';

@Injectable()
export class AiOperationsService {
  private readonly deps: OperationsLogicDeps;

  constructor(
    @InjectRepository(Booking) bookingRepo: Repository<Booking>,
    @InjectRepository(Business) businessRepo: Repository<Business>,
    orchestration: CommandOrchestrationService,
    planBuilder: OperationalPlanBuilderService,
  ) {
    this.deps = { bookingRepo, businessRepo, orchestration, planBuilder };
  }

  applyPaymentSweepFilters<
    T extends { customerId?: string | null; status: string },
  >(prompt: string, params: Record<string, unknown>, bookings: T[]) {
    return applyPaymentSweepFilters(prompt, params, bookings);
  }

  async handleNoShowRecovery(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    bookingIds: string[],
    userId?: string,
  ): Promise<CommandResult> {
    const plan = await this.prepareNoShowRecoveryPlan(
      businessId,
      prompt,
      params,
      bookingIds,
      userId,
    );
    if (!plan) return buildNoShowRecoveryFailure(params);
    return executeOperationsPlan(this.deps, plan, businessId, userId, params);
  }

  prepareNoShowRecoveryPlan(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    bookingIds: string[],
    userId?: string,
  ): Promise<AgentPlan | null> {
    return prepareNoShowRecoveryPlanLogic(
      this.deps,
      businessId,
      prompt,
      params,
      bookingIds,
      userId,
    );
  }

  async handleSickDayReplan(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    employees: Employee[],
    timeZone: string,
    userId?: string,
  ): Promise<CommandResult> {
    const plan = await this.prepareSickDayReplanPlan(
      businessId,
      prompt,
      params,
      employees,
      timeZone,
      userId,
    );
    if (!plan) return buildSickDayReplanFailure(params);
    return executeOperationsPlan(this.deps, plan, businessId, userId, params);
  }

  prepareSickDayReplanPlan(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    employees: Employee[],
    timeZone: string,
    userId?: string,
  ): Promise<AgentPlan | null> {
    return prepareSickDayReplanPlanLogic(
      this.deps,
      businessId,
      prompt,
      params,
      employees,
      timeZone,
      userId,
    );
  }

  async handleImportServicesFromMenu(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    userId?: string,
  ): Promise<CommandResult> {
    const plan = this.prepareImportServicesFromMenuPlan(
      businessId,
      prompt,
      params,
      userId,
    );
    if (!plan) return buildImportServicesFailure(params);
    return executeOperationsPlan(this.deps, plan, businessId, userId, params);
  }

  prepareImportServicesFromMenuPlan(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    userId?: string,
  ): AgentPlan | null {
    return prepareImportServicesFromMenuPlanLogic(
      this.deps,
      businessId,
      prompt,
      params,
      userId,
    );
  }

  async handleUpdateServicePrices(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    services: Service[],
    userId?: string,
  ): Promise<CommandResult> {
    const plan = this.prepareUpdateServicePricesPlan(
      businessId,
      prompt,
      params,
      services,
      userId,
    );
    if (!plan) return buildUpdateServicePricesFailure(params);
    return executeOperationsPlan(this.deps, plan, businessId, userId, params);
  }

  prepareUpdateServicePricesPlan(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    services: Service[],
    userId?: string,
  ): AgentPlan | null {
    return prepareUpdateServicePricesPlanLogic(
      this.deps,
      businessId,
      prompt,
      params,
      services,
      userId,
    );
  }

  async handleStaffServiceMatrix(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    employees: Employee[],
    services: Service[],
    userId?: string,
  ): Promise<CommandResult> {
    const plan = this.prepareStaffServiceMatrixPlan(
      businessId,
      prompt,
      params,
      employees,
      services,
      userId,
    );
    if (!plan) return buildStaffServiceMatrixFailure(params);
    return executeOperationsPlan(this.deps, plan, businessId, userId, params);
  }

  prepareStaffServiceMatrixPlan(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    employees: Employee[],
    services: Service[],
    userId?: string,
  ): AgentPlan | null {
    return prepareStaffServiceMatrixPlanLogic(
      this.deps,
      businessId,
      prompt,
      params,
      employees,
      services,
      userId,
    );
  }

  handleCheckScheduleCompliance(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
  ): Promise<CommandResult> {
    return handleCheckScheduleComplianceLogic(
      this.deps,
      businessId,
      prompt,
      params,
    );
  }

  handleRevenueForecast(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
  ): Promise<CommandResult> {
    return handleRevenueForecastLogic(this.deps, businessId, prompt, params);
  }
}
