import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AgentTask } from './agent-task.entity.js';
import { AgentRegistryService } from './agent-registry.service.js';
import { AgentType, AgentContext, PlanStatus, AgentPlan } from './interfaces/agent.interfaces.js';
import { PolicyEngineService } from '../policy/policy-engine.service.js';
import { PolicyDecision } from '../policy/policy.interfaces.js';
import { WorkflowCompilerService } from '../workflow/compiler/workflow-compiler.service.js';
import { WorkflowExecutorService } from '../workflow/executor/workflow-executor.service.js';
import { WorkflowStatus } from '../workflow/interfaces/workflow.interfaces.js';
import { EventStoreService } from '../../events/store/event-store.service.js';
import { EventType } from '../../events/event-types.js';
import { ContextBuilderService } from './context-builder.service.js';

const READONLY_PREVIEW_ACTIONS = new Set([
  'fetch_current_schedule',
  'list_appointments',
  'analyze_utilization',
  'identify_schedule_gaps',
  'generate_optimization_recommendations',
  'find_freed_slots',
  'find_rebooking_candidates',
  'propose_reassignment',
  'detect_conflicts',
  'analyze_resolution_options',
  'propose_resolutions',
  'summarize_utilization',
]);

@Injectable()
export class AgentOrchestratorService {
  private readonly logger = new Logger(AgentOrchestratorService.name);

  constructor(
    @InjectRepository(AgentTask)
    private taskRepo: Repository<AgentTask>,
    private registry: AgentRegistryService,
    private policyEngine: PolicyEngineService,
    private workflowCompiler: WorkflowCompilerService,
    private workflowExecutor: WorkflowExecutorService,
    private eventStore: EventStoreService,
    private contextBuilder: ContextBuilderService,
  ) {}

  async processIntent(params: {
    agentType: AgentType;
    businessId: string;
    intent: string;
    context: AgentContext;
    userId?: string;
    autoExecute?: boolean;
  }): Promise<AgentTask> {
    const enrichedContext = await this.contextBuilder.build(params.businessId, {
      dateRange: params.context.dateRange,
    });

    const task = this.taskRepo.create({
      agentType: params.agentType,
      businessId: params.businessId,
      intent: params.intent,
      status: PlanStatus.DRAFT,
      context: { ...enrichedContext, ...params.context, businessId: params.businessId } as any,
      userId: params.userId,
    });
    await this.taskRepo.save(task);

    try {
      const agent = this.registry.get(params.agentType);
      const result = await agent.handle(
        { ...enrichedContext, ...params.context, businessId: params.businessId },
        params.intent,
      );

      return this.validateAndMaybeExecute(task, result.plan, result.executionMode, params);
    } catch (error: any) {
      task.status = PlanStatus.FAILED;
      task.error = error.message;
      await this.taskRepo.save(task);
      throw error;
    }
  }

  /** Execute a deterministic plan without invoking a planner agent. */
  async processPlan(params: {
    plan: AgentPlan;
    businessId: string;
    userId?: string;
    autoExecute?: boolean;
  }): Promise<AgentTask> {
    const task = this.taskRepo.create({
      agentType: params.plan.agentType,
      businessId: params.businessId,
      intent: params.plan.intent,
      status: PlanStatus.DRAFT,
      plan: params.plan,
      context: { businessId: params.businessId } as any,
      userId: params.userId,
    });
    await this.taskRepo.save(task);

    return this.validateAndMaybeExecute(
      task,
      params.plan,
      params.autoExecute ? 'autonomous' : 'requires_approval',
      { businessId: params.businessId, userId: params.userId, autoExecute: params.autoExecute },
    );
  }

  private async validateAndMaybeExecute(
    task: AgentTask,
    plan: AgentPlan,
    executionMode: 'suggestion' | 'requires_approval' | 'autonomous',
    params: { businessId: string; userId?: string; autoExecute?: boolean },
  ): Promise<AgentTask> {
    task.plan = plan;
    task.status = PlanStatus.PENDING_VALIDATION;
    await this.taskRepo.save(task);

    await this.eventStore.publish({
      eventType: EventType.AGENT_PLAN_GENERATED,
      aggregateType: 'agent_task',
      aggregateId: task.id,
      businessId: params.businessId,
      payload: {
        agentType: plan.agentType,
        intent: plan.intent,
        stepCount: plan.steps.length,
        riskLevel: plan.riskAssessment.level,
      },
      userId: params.userId,
    });

    const primaryAction = plan.steps[0]?.action ?? `agent:${plan.agentType}`;
    const enrichedContext = (task.context ?? {}) as AgentContext;
    const policyResult = await this.policyEngine.evaluate({
      userId: params.userId,
      businessId: params.businessId,
      action: primaryAction,
      resource: 'schedule',
      params: {
        affectedBookingsCount: this.countAffectedBookings(plan),
        planRiskLevel: plan.riskAssessment.level,
        currentBookingsCount: enrichedContext.policyMetrics?.activeBookingCount ?? enrichedContext.bookings?.length ?? 0,
        maxBookingsPerDay: 20,
        hasAdjacentConflict: false,
        withinBusinessHours: true,
        employeeCount: enrichedContext.policyMetrics?.employeeCount ?? enrichedContext.employees?.length ?? 0,
        minBufferMinutes: enrichedContext.policyMetrics?.avgServiceBufferMinutes ?? 10,
        businessHoursLabel: enrichedContext.policyMetrics?.businessHoursLabel ?? '09:00–19:00',
        stepCount: plan.steps.length,
      },
    });

    task.result = {
      ...(task.result ?? {}),
      policyPreview: {
        decision: policyResult.decision,
        riskLevel: policyResult.riskLevel,
        violations: policyResult.violations,
        reasons: policyResult.reasons.filter((r) => r !== 'Not applicable'),
      },
    } as any;

    if (policyResult.decision === PolicyDecision.DENY) {
      task.status = PlanStatus.REJECTED;
      task.result = { policyResult } as any;
      await this.taskRepo.save(task);
      await this.eventStore.publish({
        eventType: EventType.AGENT_PLAN_REJECTED,
        aggregateType: 'agent_task',
        aggregateId: task.id,
        businessId: params.businessId,
        payload: { reason: policyResult.violations },
        userId: params.userId,
      });
      return task;
    }

    if (
      policyResult.decision === PolicyDecision.REQUIRES_APPROVAL ||
      executionMode === 'requires_approval'
    ) {
      task.status = PlanStatus.REQUIRES_APPROVAL;
    } else {
      task.status = PlanStatus.VALIDATED;
    }
    await this.taskRepo.save(task);

    await this.eventStore.publish({
      eventType: EventType.AGENT_PLAN_VALIDATED,
      aggregateType: 'agent_task',
      aggregateId: task.id,
      businessId: params.businessId,
      payload: { policyDecision: policyResult.decision, status: task.status },
      userId: params.userId,
    });

    if (
      task.status === PlanStatus.REQUIRES_APPROVAL ||
      task.status === PlanStatus.VALIDATED
    ) {
      if (
        plan.agentType === AgentType.CANCELLATION_RECOVERY ||
        plan.agentType === AgentType.CONFLICT_RESOLUTION
      ) {
        try {
          await this.previewTaskWorkspace(task.id);
          return this.taskRepo.findOneOrFail({ where: { id: task.id } });
        } catch (error: any) {
          this.logger.warn(`Task preview failed for ${task.id}: ${error.message}`);
        }
      }
    }

    const canAutoExecute =
      params.autoExecute &&
      policyResult.decision === PolicyDecision.ALLOW &&
      executionMode === 'autonomous';

    if (canAutoExecute) {
      return this.executeTask(task);
    }

    return task;
  }

  private countAffectedBookings(plan: AgentPlan): number {
    for (const step of plan.steps) {
      if (step.action === 'cancel_bookings' && step.params.bookingIds?.length) {
        return step.params.bookingIds.length;
      }
    }
    return plan.steps.filter((s) =>
      ['create_booking', 'cancel_booking', 'cancel_bookings'].includes(s.action),
    ).length;
  }

  async executeTask(task: AgentTask): Promise<AgentTask> {
    if (!task.plan) {
      throw new BadRequestException('Task has no plan to execute');
    }

    task.status = PlanStatus.EXECUTING;
    await this.taskRepo.save(task);

    await this.eventStore.publish({
      eventType: EventType.AGENT_PLAN_EXECUTING,
      aggregateType: 'agent_task',
      aggregateId: task.id,
      businessId: task.businessId,
      payload: { planId: task.plan.id },
      userId: task.userId,
    });

    try {
      const workflowDef = this.workflowCompiler.compilePlanToWorkflow(task.plan);
      const executionResult = await this.workflowExecutor.executeWorkflow(workflowDef);

      task.workflowExecutionId = executionResult.workflowId;
      task.result = executionResult as any;

      if (executionResult.status === WorkflowStatus.FAILED) {
        const stepError = executionResult.steps.find((s) => s.error)?.error;
        task.status = PlanStatus.FAILED;
        task.error = stepError || 'Workflow execution failed';
        await this.taskRepo.save(task);
        return task;
      }

      task.status = PlanStatus.COMPLETED;
      await this.taskRepo.save(task);

      await this.eventStore.publish({
        eventType: EventType.AGENT_PLAN_COMPLETED,
        aggregateType: 'agent_task',
        aggregateId: task.id,
        businessId: task.businessId,
        userId: task.userId,
        payload: {
          taskId: task.id,
          intent: task.intent,
          agentType: task.agentType,
          planDiff: task.plan ? this.buildPlanDiff(task.plan) : [],
          workflowExecutionId: task.workflowExecutionId,
          result: task.result,
        },
      });

      return task;
    } catch (error: any) {
      task.status = PlanStatus.FAILED;
      task.error = error.message;
      await this.taskRepo.save(task);
      throw error;
    }
  }

  async approveAndExecute(taskId: string, userId: string): Promise<AgentTask> {
    const task = await this.taskRepo.findOneOrFail({ where: { id: taskId } });

    if (
      task.status !== PlanStatus.VALIDATED &&
      task.status !== PlanStatus.REQUIRES_APPROVAL
    ) {
      throw new BadRequestException(`Task is in ${task.status} state, cannot execute`);
    }

    const planDiff = task.plan ? this.buildPlanDiff(task.plan) : [];

    await this.eventStore.publish({
      eventType: EventType.AGENT_PLAN_APPROVED,
      aggregateType: 'agent_task',
      aggregateId: task.id,
      businessId: task.businessId,
      userId,
      payload: {
        approvedBy: userId,
        taskId: task.id,
        intent: task.intent,
        agentType: task.agentType,
        planDiff,
        stepCount: task.plan?.steps?.length ?? 0,
      },
    });

    return this.executeTask(task);
  }

  async getTask(id: string): Promise<AgentTask> {
    return this.taskRepo.findOneOrFail({ where: { id } });
  }

  async getTasks(businessId: string, status?: PlanStatus): Promise<AgentTask[]> {
    const where: any = { businessId };
    if (status) where.status = status;
    return this.taskRepo.find({ where, order: { createdAt: 'DESC' }, take: 50 });
  }

  async getPendingTasks(businessId: string): Promise<AgentTask[]> {
    return this.taskRepo.find({
      where: {
        businessId,
        status: In([PlanStatus.VALIDATED, PlanStatus.REQUIRES_APPROVAL]),
      },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async previewTaskWorkspace(taskId: string): Promise<Record<string, unknown>> {
    const task = await this.taskRepo.findOneOrFail({ where: { id: taskId } });
    if (!task.plan) {
      throw new BadRequestException('Task has no plan to preview');
    }

    const workflowDef = this.workflowCompiler.compilePlanToWorkflow(task.plan);
    const ctx: Record<string, any> = {
      businessId: task.businessId,
      userId: task.userId,
      ...(task.context as Record<string, unknown>),
    };

    const stepResults: Record<string, unknown> = {};
    for (const step of workflowDef.steps) {
      if (!READONLY_PREVIEW_ACTIONS.has(step.action)) continue;
      try {
        const result = await this.workflowExecutor.runStep(step, ctx);
        stepResults[step.id] = result;
        ctx[`step_${step.id}_result`] = result;
      } catch (error: any) {
        stepResults[step.id] = { error: error.message };
      }
    }

    const workspace = this.buildWorkspacePayload(task, stepResults);
    task.result = { ...(task.result ?? {}), preview: workspace, stepResults } as any;
    await this.taskRepo.save(task);
    return workspace;
  }

  private buildWorkspacePayload(task: AgentTask, stepResults: Record<string, unknown>) {
    const values = Object.values(stepResults) as Array<Record<string, unknown>>;
    const freed = values.find((v) => v?.freedSlots)?.freedSlots ?? [];
    const candidates = values.find((v) => v?.candidates)?.candidates ?? [];
    const proposals = values.find((v) => v?.proposals)?.proposals ?? [];
    const conflicts = values.find((v) => v?.conflicts)?.conflicts ?? [];
    const resolutions = values.find((v) => v?.resolutions)?.resolutions ?? [];

    return {
      agentType: task.agentType,
      taskId: task.id,
      intent: task.intent,
      planDiff: this.buildPlanDiff(task.plan!),
      policyPreview: (task.result as any)?.policyPreview,
      cancellationRecovery:
        task.agentType === AgentType.CANCELLATION_RECOVERY
          ? { freedSlots: freed, candidates, proposals }
          : undefined,
      conflictResolution:
        task.agentType === AgentType.CONFLICT_RESOLUTION
          ? { conflicts, resolutions }
          : undefined,
    };
  }

  buildPlanDiff(plan: AgentPlan) {
    return plan.steps.map((step) => ({
      id: step.id,
      action: step.action,
      description: step.description,
      impact: this.describeStepImpact(step),
      estimatedImpact: step.estimatedImpact,
    }));
  }

  private describeStepImpact(step: AgentPlan['steps'][number]): string {
    const p = step.params ?? {};
    switch (step.action) {
      case 'apply_template':
        return `Apply template to provider schedule`;
      case 'fill_schedule_gaps':
        return `Add ${Array.isArray(p.periods) ? p.periods.length : 'new'} availability block(s)`;
      case 'cancel_bookings':
        return `Cancel ${p.bookingIds?.length ?? 'matched'} booking(s)`;
      case 'reschedule_booking':
        return `Move booking ${p.bookingId ?? ''} to ${p.startTime ?? 'new time'}`;
      case 'create_block_schedule':
        return `Create schedule block for ${p.placeholder ?? 'break'}`;
      case 'execute_reassignment':
        return `Rebook customer into freed slot`;
      case 'detect_conflicts':
        return 'Scan for overlapping appointments';
      case 'find_freed_slots':
        return 'List slots freed by cancellations';
      default:
        return step.estimatedImpact ?? step.description;
    }
  }
}
