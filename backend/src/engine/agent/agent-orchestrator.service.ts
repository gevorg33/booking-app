import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { AgentTask } from './agent-task.entity.js';
import { AgentRegistryService } from './agent-registry.service.js';
import {
  AgentType,
  AgentContext,
  PlanStatus,
  AgentPlan,
} from './interfaces/agent.interfaces.js';
import { PolicyEngineService } from '../policy/policy-engine.service.js';
import { buildPolicyRiskExplain } from '../../modules/ai/policy-risk-explain.util.js';
import { PolicyDecision } from '../policy/policy.interfaces.js';
import { WorkflowCompilerService } from '../workflow/compiler/workflow-compiler.service.js';
import { WorkflowExecutorService } from '../workflow/executor/workflow-executor.service.js';
import { WorkflowStatus } from '../workflow/interfaces/workflow.interfaces.js';
import { EventStoreService } from '../../events/store/event-store.service.js';
import { EventType } from '../../events/event-types.js';
import {
  assertPostExecutionIntent,
  buildPostExecFailureSummary,
  buildPostExecRollbackDetails,
  extractExecutionPayload,
} from '../../modules/ai/ai-post-exec-assertion.util.js';
import { mergeAutoRollbackIntoResult } from '../../modules/ai/ai-post-exec-auto-rollback.util.js';
import { AgentTaskUndoService } from './agent-task-undo.service.js';
import {
  buildPlanMismatchSummary,
  verifyPlanMatchesPrompt,
} from '../../modules/ai/ai-plan-vs-prompt-check.util.js';
import {
  buildPlanDiffFromAgentPlan,
  formatMutationStepDescription,
} from '../../modules/ai/ai-plan-diff.util.js';
import { ContextBuilderService } from './context-builder.service.js';
import {
  buildExecuteRevalidationSummary,
  revalidatePlanBeforeExecute,
} from '../../modules/ai/ai-execute-idempotency.util.js';
import {
  isBlastRadiusConfirmed,
  validateBlastRadiusAtExecute,
} from '../../modules/ai/ai-blast-radius-cap.util.js';
import {
  buildIntentGraduationStatus,
  readIntentTrafficFromContext,
  resolveGraduationThresholdsFromContext,
  validateIntentGraduationAtExecute,
} from '../../modules/ai/ai-intent-graduation.util.js';
import { BookingSlotResolverService } from '../../modules/booking/booking-slot-resolver.service.js';
import { Booking } from '../../modules/booking/entities/booking.entity.js';
import { Employee } from '../../modules/employee/entities/employee.entity.js';
import { Service } from '../../modules/service/entities/service.entity.js';

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
    private agentTaskUndo: AgentTaskUndoService,
    private slotResolver: BookingSlotResolverService,
    @InjectRepository(Booking)
    private bookingRepo: Repository<Booking>,
    @InjectRepository(Employee)
    private employeeRepo: Repository<Employee>,
    @InjectRepository(Service)
    private serviceRepo: Repository<Service>,
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
      context: {
        ...enrichedContext,
        ...params.context,
        businessId: params.businessId,
      } as any,
      userId: params.userId,
    });
    await this.taskRepo.save(task);

    try {
      const agent = this.registry.get(params.agentType);
      const result = await agent.handle(
        {
          ...enrichedContext,
          ...params.context,
          businessId: params.businessId,
        },
        params.intent,
      );

      return this.validateAndMaybeExecute(
        task,
        result.plan,
        result.executionMode,
        params,
      );
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
    executionConfirmed?: boolean;
    intentTraffic?: Record<string, { samples: number; accurateRate: number }>;
    confidenceHigh?: number;
  }): Promise<AgentTask> {
    const task = this.taskRepo.create({
      agentType: params.plan.agentType,
      businessId: params.businessId,
      intent: params.plan.intent,
      status: PlanStatus.DRAFT,
      plan: params.plan,
      context: {
        businessId: params.businessId,
        ...(params.intentTraffic ? { _intentTraffic: params.intentTraffic } : {}),
        ...(params.confidenceHigh != null
          ? { _confidenceHigh: params.confidenceHigh }
          : {}),
        ...(params.executionConfirmed
          ? { confirmed: true, blastRadiusConfirmed: true }
          : {}),
      } as any,
      userId: params.userId,
    });
    await this.taskRepo.save(task);

    return this.validateAndMaybeExecute(
      task,
      params.plan,
      params.autoExecute ? 'autonomous' : 'requires_approval',
      {
        businessId: params.businessId,
        userId: params.userId,
        autoExecute: params.autoExecute,
      },
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

    const planCheck = verifyPlanMatchesPrompt(task.intent, plan);
    if (!planCheck.ok) {
      task.status = PlanStatus.REJECTED;
      task.error = buildPlanMismatchSummary(planCheck.mismatches);
      task.result = {
        ...(task.result ?? {}),
        planMismatch: planCheck.mismatches,
        planVsPromptFailed: true,
      } as any;
      await this.taskRepo.save(task);
      return task;
    }

    const policyAction = plan.steps[0]?.action ?? `agent:${plan.agentType}`;
    const enrichedContext = (task.context ?? {}) as AgentContext;
    const policyResult = await this.policyEngine.evaluate({
      userId: params.userId,
      businessId: params.businessId,
      action: policyAction,
      resource: 'schedule',
      params: {
        affectedBookingsCount: this.countAffectedBookings(plan),
        planRiskLevel: plan.riskAssessment.level,
        currentBookingsCount:
          enrichedContext.policyMetrics?.activeBookingCount ??
          enrichedContext.bookings?.length ??
          0,
        maxBookingsPerDay: 20,
        hasAdjacentConflict: false,
        withinBusinessHours: true,
        employeeCount:
          enrichedContext.policyMetrics?.employeeCount ??
          enrichedContext.employees?.length ??
          0,
        minBufferMinutes:
          enrichedContext.policyMetrics?.avgServiceBufferMinutes ?? 10,
        businessHoursLabel:
          enrichedContext.policyMetrics?.businessHoursLabel ?? '09:00–19:00',
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

    const graduationStatus = buildIntentGraduationStatus({
      action: task.intent,
      traffic: readIntentTrafficFromContext(
        task.context as Record<string, unknown>,
        task.intent,
      ),
      thresholds: resolveGraduationThresholdsFromContext(
        task.context as Record<string, unknown>,
      ),
    });
    if (graduationStatus.proposeOnly) {
      task.status = PlanStatus.REQUIRES_APPROVAL;
      task.result = {
        ...(task.result ?? {}),
        graduationStatus,
        proposeOnly: true,
        dryRun: true,
      } as any;
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
          this.logger.warn(
            `Task preview failed for ${task.id}: ${error.message}`,
          );
        }
      }
    }

    const canAutoExecute =
      params.autoExecute &&
      policyResult.decision === PolicyDecision.ALLOW &&
      executionMode === 'autonomous' &&
      !graduationStatus.proposeOnly;

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
      ['create_booking', 'cancel_booking', 'cancel_bookings'].includes(
        s.action,
      ),
    ).length;
  }

  async executeTask(task: AgentTask): Promise<AgentTask> {
    if (!task.plan) {
      throw new BadRequestException('Task has no plan to execute');
    }

    const revalidation = await revalidatePlanBeforeExecute(
      {
        slotResolver: this.slotResolver,
        bookingRepo: this.bookingRepo,
        employeeRepo: this.employeeRepo,
        serviceRepo: this.serviceRepo,
      },
      {
        businessId: task.businessId,
        plan: task.plan,
        task,
        timeZone:
          typeof task.context?.timeZone === 'string'
            ? task.context.timeZone
            : undefined,
      },
    );
    if (!revalidation.ok) {
      task.status = PlanStatus.FAILED;
      task.error = buildExecuteRevalidationSummary(revalidation.issues);
      task.result = {
        ...(task.result ?? {}),
        executeRevalidationFailed: true,
        executeRevalidationIssues: revalidation.issues,
        stalePlan: revalidation.issues.some((issue) => issue.kind === 'stale_plan'),
      } as any;
      await this.taskRepo.save(task);
      throw new BadRequestException(task.error);
    }

    const primaryStep = task.plan.steps[0];
    const blastRadius = validateBlastRadiusAtExecute({
      action: primaryStep?.action ?? task.intent,
      params: (primaryStep?.params ?? {}) as Record<string, unknown>,
      plan: task.plan,
      confirmed: isBlastRadiusConfirmed(task.context as Record<string, unknown>),
    });
    if (!blastRadius.ok) {
      task.status = PlanStatus.FAILED;
      task.error = blastRadius.summary;
      task.result = {
        ...(task.result ?? {}),
        blastRadiusFailed: true,
        blastRadius: blastRadius.assessment,
        requiresExecutionConfirmation: blastRadius.requiresConfirm,
      } as any;
      await this.taskRepo.save(task);
      throw new BadRequestException(task.error);
    }

    const graduationCheck = validateIntentGraduationAtExecute({
      action: task.intent,
      traffic: readIntentTrafficFromContext(
        task.context as Record<string, unknown>,
        task.intent,
      ),
      thresholds: resolveGraduationThresholdsFromContext(
        task.context as Record<string, unknown>,
      ),
      planApproved: (task.context as Record<string, unknown>)?.confirmed === true,
      autoExecutePath: (task.context as Record<string, unknown>)?.confirmed !== true,
    });
    if (!graduationCheck.ok) {
      task.status = PlanStatus.FAILED;
      task.error = graduationCheck.summary;
      task.result = {
        ...(task.result ?? {}),
        graduationStatus: graduationCheck.status,
        proposeOnly: true,
        dryRun: true,
      } as any;
      await this.taskRepo.save(task);
      throw new BadRequestException(task.error);
    }

    const planCheck = verifyPlanMatchesPrompt(task.intent, task.plan);
    if (!planCheck.ok) {
      task.status = PlanStatus.REJECTED;
      task.error = buildPlanMismatchSummary(planCheck.mismatches);
      task.result = {
        ...(task.result ?? {}),
        planMismatch: planCheck.mismatches,
        planVsPromptFailed: true,
      } as any;
      await this.taskRepo.save(task);
      throw new BadRequestException(task.error);
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
      const workflowDef = this.workflowCompiler.compilePlanToWorkflow(
        task.plan,
      );
      const executionResult =
        await this.workflowExecutor.executeWorkflow(workflowDef);

      task.workflowExecutionId = executionResult.workflowId;
      task.result = executionResult as any;

      if (executionResult.status === WorkflowStatus.FAILED) {
        const stepError = executionResult.steps.find((s) => s.error)?.error;
        task.status = PlanStatus.FAILED;
        task.error = stepError || 'Workflow execution failed';
        await this.taskRepo.save(task);
        return task;
      }

      const primaryStep = task.plan.steps[0];
      const assertion = assertPostExecutionIntent(
        primaryStep?.action ?? task.intent,
        primaryStep?.params ?? {},
        extractExecutionPayload(executionResult as unknown as Record<string, unknown>),
      );
      if (!assertion.ok) {
        task.status = PlanStatus.COMPLETED;
        task.result = {
          ...(executionResult as any),
          ...buildPostExecRollbackDetails(task.id, assertion),
        } as any;

        const rollback = await this.agentTaskUndo.attemptAutoRollbackForAssertionFailure(
          task,
          task.userId ?? 'system',
        );
        task.result = mergeAutoRollbackIntoResult(
          task.result as Record<string, unknown>,
          rollback,
        ) as typeof task.result;
        task.error = buildPostExecFailureSummary({
          result: task.result as Record<string, unknown>,
          error: assertion.message,
        });
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
      throw new BadRequestException(
        `Task is in ${task.status} state, cannot execute`,
      );
    }

    if (task.plan) {
      const planCheck = verifyPlanMatchesPrompt(task.intent, task.plan);
      if (!planCheck.ok) {
        throw new BadRequestException(buildPlanMismatchSummary(planCheck.mismatches));
      }
    }

    const planDiff = task.plan ? this.buildPlanDiff(task.plan) : [];

    task.context = {
      ...(task.context ?? {}),
      confirmed: true,
      blastRadiusConfirmed: true,
    } as any;
    await this.taskRepo.save(task);

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

  async retryFailedStep(
    taskId: string,
    stepId: string,
    userId?: string,
    businessId?: string,
  ): Promise<AgentTask> {
    const task = await this.taskRepo.findOneOrFail({ where: { id: taskId } });
    if (businessId && task.businessId !== businessId) {
      throw new BadRequestException('Task not found for this business');
    }
    if (!task.plan) {
      throw new BadRequestException('Task has no plan to retry');
    }

    const planStep = task.plan.steps.find((s) => s.id === stepId);
    if (!planStep) {
      throw new BadRequestException(`Step ${stepId} not found in plan`);
    }

    const workflowDef = this.workflowCompiler.compilePlanToWorkflow(task.plan);
    const workflowStep = workflowDef.steps.find((s) => s.id === stepId);
    if (!workflowStep) {
      throw new BadRequestException(`Workflow step ${stepId} not found`);
    }

    const ctx: Record<string, any> = {
      businessId: task.businessId,
      userId: userId ?? task.userId,
      ...(task.context as Record<string, unknown>),
    };

    const priorResults = ((task.result as any)?.steps ?? []) as Array<{
      stepId: string;
      status: string;
      result?: unknown;
    }>;

    for (const prior of priorResults) {
      if (prior.status === 'completed' && prior.result != null) {
        ctx[`step_${prior.stepId}_result`] = prior.result;
      }
    }

    try {
      const result = await this.workflowExecutor.runStep(workflowStep, ctx);
      const steps = [...priorResults];
      const idx = steps.findIndex((s) => s.stepId === stepId);
      const updated = { stepId, status: 'completed', result, error: undefined };
      if (idx >= 0) steps[idx] = updated;
      else steps.push(updated);

      const allCompleted = task.plan.steps.every((s) =>
        steps.some((r) => r.stepId === s.id && r.status === 'completed'),
      );

      task.result = { ...(task.result as any), steps };
      task.status = allCompleted ? PlanStatus.COMPLETED : PlanStatus.FAILED;
      if (allCompleted) {
        (task as { error?: string }).error = undefined;
      }
      await this.taskRepo.save(task);
      return task;
    } catch (error: any) {
      const steps = [...priorResults];
      const idx = steps.findIndex((s) => s.stepId === stepId);
      const failed = { stepId, status: 'failed', error: error.message };
      if (idx >= 0) steps[idx] = failed;
      else steps.push(failed);

      task.result = { ...(task.result as any), steps };
      task.status = PlanStatus.FAILED;
      task.error = error.message;
      await this.taskRepo.save(task);
      return task;
    }
  }

  async getTask(id: string): Promise<AgentTask> {
    return this.taskRepo.findOneOrFail({ where: { id } });
  }

  async getTasks(
    businessId: string,
    status?: PlanStatus,
  ): Promise<AgentTask[]> {
    const where: any = { businessId };
    if (status) where.status = status;
    return this.taskRepo.find({
      where,
      order: { createdAt: 'DESC' },
      take: 50,
    });
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
    task.result = {
      ...(task.result ?? {}),
      preview: workspace,
      stepResults,
    } as any;
    await this.taskRepo.save(task);
    return workspace;
  }

  private buildWorkspacePayload(
    task: AgentTask,
    stepResults: Record<string, unknown>,
  ) {
    const values = Object.values(stepResults) as Array<Record<string, unknown>>;
    const freed = values.find((v) => v?.freedSlots)?.freedSlots ?? [];
    const candidates = values.find((v) => v?.candidates)?.candidates ?? [];
    const proposals = values.find((v) => v?.proposals)?.proposals ?? [];
    const conflicts = values.find((v) => v?.conflicts)?.conflicts ?? [];
    const resolutions = values.find((v) => v?.resolutions)?.resolutions ?? [];

    const policyPreview = (task.result as any)?.policyPreview;
    const planDiff = this.buildPlanDiff(task.plan);
    return {
      agentType: task.agentType,
      taskId: task.id,
      intent: task.intent,
      planDiff,
      policyPreview,
      policyExplain: buildPolicyRiskExplain({
        policyPreview,
        plan: task.plan,
        employeeCount: (task.context as any)?.employees?.length,
        daySpan: 7,
      }),
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
    return buildPlanDiffFromAgentPlan(plan, (step) =>
      formatMutationStepDescription(step.action, step.params ?? {}, step.description),
    );
  }

  private formatPlanStepDescription(step: AgentPlan['steps'][number]): string {
    const p = step.params ?? {};
    const employeeName =
      typeof p.employeeName === 'string' &&
      p.employeeName.trim() &&
      !this.looksLikeUuid(p.employeeName)
        ? p.employeeName.trim()
        : null;

    if (employeeName) {
      switch (step.action) {
        case 'create_direct_schedule':
          return `Set schedule for ${employeeName}`;
        case 'clear_schedule':
          return `Clear schedule for ${employeeName}`;
        case 'create_block_schedule':
          return `Block time for ${employeeName}`;
        case 'assign_employee_services':
          return `Assign services to ${employeeName}`;
        case 'fill_schedule_gaps':
          return `Fill schedule gaps for ${employeeName}`;
        default:
          break;
      }
    }

    return this.stripUuidsFromText(step.description);
  }

  private looksLikeUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value.trim(),
    );
  }

  private stripUuidsFromText(text: string): string {
    return text.replace(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
      'provider',
    );
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
      case 'hide_appointments_from_calendar':
        return `Hide ${p.bookingIds?.length ?? 'matched'} appointment(s) from calendar`;
      case 'unhide_appointments_from_calendar':
        return `Restore ${p.bookingIds?.length ?? 'matched'} hidden appointment(s) to calendar`;
      case 'reschedule_booking':
        return `Move booking ${p.bookingId ?? ''} to ${p.startTime ?? 'new time'}`;
      case 'create_block_schedule':
        return `Create schedule block for ${p.placeholder ?? 'break'}`;
      case 'clear_schedule':
        return `Clear schedule periods and slots for ${p.date ?? 'the day'}`;
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
