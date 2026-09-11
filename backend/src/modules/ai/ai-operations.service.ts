import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from '../employee/entities/employee.entity.js';
import { Service } from '../service/entities/service.entity.js';
import { Booking } from '../booking/entities/booking.entity.js';
import { Business } from '../business/entities/business.entity.js';
import { EmployeeService } from '../employee/employee.service.js';
import { InvitationsService } from '../invitations/invitations.service.js';
import { TeamMembersService } from '../business/team-members.service.js';
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
import {
  handleConfigureOnlineBookingLogic,
  handleCreateEmployeeLogic,
  handleDeactivateEmployeeLogic,
  handleUpdateEmployeeLogic,
  handleUpdateTeamMemberRoleLogic,
  handleInviteStaffMemberLogic,
  type StaffOperationsLogicDeps,
} from './ai-staff-operations.logic.js';
import { dispatchOperationsIntent } from './ai-operations-dispatch.util.js';
import type { OperationsDispatchContext } from './ai-operations-dispatch.build.js';

@Injectable()
export class AiOperationsService {
  private readonly deps: OperationsLogicDeps;
  private readonly staffDeps: StaffOperationsLogicDeps;

  constructor(
    @InjectRepository(Booking) bookingRepo: Repository<Booking>,
    @InjectRepository(Business) businessRepo: Repository<Business>,
    @InjectRepository(Service) serviceRepo: Repository<Service>,
    orchestration: CommandOrchestrationService,
    planBuilder: OperationalPlanBuilderService,
    employeeService: EmployeeService,
    invitationsService: InvitationsService,
    teamMembersService: TeamMembersService,
  ) {
    this.deps = { bookingRepo, businessRepo, orchestration, planBuilder };
    this.staffDeps = {
      teamMembersService,
      employeeService,
      invitationsService,
      businessRepo,
      serviceRepo,
    };
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
    return executeOperationsPlan(this.deps, plan, businessId, userId);
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
    return executeOperationsPlan(this.deps, plan, businessId, userId);
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
    return executeOperationsPlan(this.deps, plan, businessId, userId);
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
    const result = await executeOperationsPlan(
      this.deps,
      plan,
      businessId,
      userId,
    );
    // e2e-bug.164 — never claim a completed price change when orchestration
    // still needs approval (zero writes) or when the summary could invent numbers.
    if (result.details?.requiresApproval) {
      return {
        ...result,
        success: false,
        summary: [
          'Price update was planned but not applied.',
          plan.reasoning,
          'Confirm the command again, or approve the task in AI Ops.',
        ]
          .filter(Boolean)
          .join(' '),
        details: {
          ...result.details,
          requiresExecutionConfirmation: true,
          plannedUpdates: plan.steps.map((step) => ({
            serviceId: step.params.serviceId,
            price: step.params.price,
            description: step.description,
          })),
        },
      };
    }
    if (result.success) {
      const applied = plan.steps
        .map((step) => step.estimatedImpact ?? step.description)
        .filter(Boolean);
      return {
        ...result,
        summary:
          applied.length === 1
            ? `Updated service price: ${applied[0]}.`
            : `Updated ${applied.length} service prices: ${applied.join('; ')}.`,
        details: {
          ...result.details,
          appliedUpdates: plan.steps.map((step) => ({
            serviceId: step.params.serviceId,
            price: step.params.price,
            description: step.description,
          })),
        },
      };
    }
    return result;
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
    return executeOperationsPlan(this.deps, plan, businessId, userId);
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

  handleCreateEmployee(
    businessId: string,
    params: Record<string, unknown>,
    prompt?: string,
    userId?: string,
  ): Promise<CommandResult> {
    return handleCreateEmployeeLogic(
      this.staffDeps,
      businessId,
      params,
      prompt,
      userId,
    );
  }

  handleUpdateEmployee(
    businessId: string,
    params: Record<string, unknown>,
    prompt?: string,
    userId?: string,
  ): Promise<CommandResult> {
    return handleUpdateEmployeeLogic(
      this.staffDeps,
      businessId,
      params,
      prompt,
      userId,
    );
  }

  handleUpdateTeamMemberRole(
    businessId: string,
    params: Record<string, unknown>,
    userId?: string,
  ): Promise<CommandResult> {
    return handleUpdateTeamMemberRoleLogic(
      this.staffDeps,
      businessId,
      params,
      userId,
    );
  }

  handleInviteStaffMember(
    businessId: string,
    params: Record<string, unknown>,
    prompt?: string,
    userId?: string,
  ): Promise<CommandResult> {
    return handleInviteStaffMemberLogic(
      this.staffDeps,
      businessId,
      params,
      prompt,
      userId,
    );
  }

  handleDeactivateEmployee(
    businessId: string,
    params: Record<string, unknown>,
    prompt?: string,
    userId?: string,
  ): Promise<CommandResult> {
    return handleDeactivateEmployeeLogic(
      this.staffDeps,
      businessId,
      params,
      prompt,
      userId,
    );
  }

  handleConfigureOnlineBooking(
    businessId: string,
    params: Record<string, unknown>,
    prompt?: string,
  ): Promise<CommandResult> {
    return handleConfigureOnlineBookingLogic(
      this.staffDeps,
      businessId,
      params,
      prompt,
    );
  }

  /** Registry-driven dispatch (ai-cmd-ext-0.5). Returns null when action is not an operations intent. */
  dispatchIntent(
    ctx: OperationsDispatchContext,
  ): Promise<CommandResult | null> {
    return dispatchOperationsIntent(this, ctx);
  }
}
