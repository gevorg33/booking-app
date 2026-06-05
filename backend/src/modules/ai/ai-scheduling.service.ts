import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { ScheduleTemplate } from '../schedule/entities/schedule-template.entity.js';
import { SchedulingPeriod } from '../schedule/entities/scheduling-period.entity.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { CommandOrchestrationService } from './command-orchestration.service.js';
import { OperationalPlanBuilderService } from './operational-plan-builder.service.js';
import { CommandResult } from './ai-command.service.js';
import { AgentPlan } from '../../engine/agent/interfaces/agent.interfaces.js';
import {
  buildHolidayModeFailure,
  buildOnboardProviderFailure,
  buildRebalanceCapacityFailure,
  buildSwapSchedulesFailure,
  executeSprint23Plan,
  prepareHolidayModePlanLogic,
  prepareOnboardProviderSchedulePlanLogic,
  prepareRebalanceCapacityPlanLogic,
  prepareSwapSchedulesPlanLogic,
  resolveHolidayDatesForBusinessLogic,
  type SchedulingLogicDeps,
} from './ai-scheduling.logic.js';

@Injectable()
export class AiSchedulingService {
  private readonly deps: SchedulingLogicDeps;

  constructor(
    @InjectRepository(ScheduleTemplate)
    templateRepo: Repository<ScheduleTemplate>,
    @InjectRepository(SchedulingPeriod)
    periodRepo: Repository<SchedulingPeriod>,
    @InjectRepository(Booking) bookingRepo: Repository<Booking>,
    @InjectRepository(Business) businessRepo: Repository<Business>,
    orchestration: CommandOrchestrationService,
    planBuilder: OperationalPlanBuilderService,
  ) {
    this.deps = {
      templateRepo,
      periodRepo,
      bookingRepo,
      businessRepo,
      orchestration,
      planBuilder,
    };
  }

  async handleSwapSchedules(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    employees: Employee[],
    userId?: string,
  ): Promise<CommandResult> {
    const plan = await this.prepareSwapSchedulesPlan(
      businessId,
      prompt,
      params,
      employees,
      userId,
    );
    if (!plan) return buildSwapSchedulesFailure(params);
    return executeSprint23Plan(this.deps, plan, businessId, userId, 2);
  }

  prepareSwapSchedulesPlan(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    employees: Employee[],
    userId?: string,
  ): Promise<AgentPlan | null> {
    return prepareSwapSchedulesPlanLogic(
      this.deps,
      businessId,
      prompt,
      params,
      employees,
      userId,
    );
  }

  async handleRebalanceCapacity(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    employees: Employee[],
    services: Service[],
    userId?: string,
  ): Promise<CommandResult> {
    const plan = await this.prepareRebalanceCapacityPlan(
      businessId,
      prompt,
      params,
      employees,
      services,
      userId,
    );
    if (!plan) return buildRebalanceCapacityFailure(params);
    return executeSprint23Plan(this.deps, plan, businessId, userId, 2);
  }

  prepareRebalanceCapacityPlan(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    employees: Employee[],
    services: Service[],
    userId?: string,
  ): Promise<AgentPlan | null> {
    return prepareRebalanceCapacityPlanLogic(
      this.deps,
      businessId,
      prompt,
      params,
      employees,
      services,
      userId,
    );
  }

  async handleHolidayMode(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    employees: Employee[],
    userId?: string,
  ): Promise<CommandResult> {
    const plan = await this.prepareHolidayModePlan(
      businessId,
      prompt,
      params,
      employees,
      userId,
    );
    if (!plan) return buildHolidayModeFailure(params);
    return executeSprint23Plan(
      this.deps,
      plan,
      businessId,
      userId,
      employees.length,
    );
  }

  prepareHolidayModePlan(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    employees: Employee[],
    userId?: string,
  ): Promise<AgentPlan | null> {
    return prepareHolidayModePlanLogic(
      this.deps,
      businessId,
      prompt,
      params,
      employees,
      userId,
    );
  }

  async handleOnboardProviderSchedule(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    employees: Employee[],
    services: Service[],
    userId?: string,
  ): Promise<CommandResult> {
    const plan = await this.prepareOnboardProviderSchedulePlan(
      businessId,
      prompt,
      params,
      employees,
      services,
      userId,
    );
    if (!plan) return buildOnboardProviderFailure(params);
    return executeSprint23Plan(this.deps, plan, businessId, userId);
  }

  prepareOnboardProviderSchedulePlan(
    businessId: string,
    prompt: string,
    params: Record<string, any>,
    employees: Employee[],
    services: Service[],
    userId?: string,
  ): Promise<AgentPlan | null> {
    return prepareOnboardProviderSchedulePlanLogic(
      this.deps,
      businessId,
      prompt,
      params,
      employees,
      services,
      userId,
    );
  }

  resolveHolidayDatesForBusiness(businessId: string): Promise<string[]> {
    return resolveHolidayDatesForBusinessLogic(
      this.deps.businessRepo,
      businessId,
    );
  }
}
