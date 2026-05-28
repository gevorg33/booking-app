import { Injectable, Logger } from '@nestjs/common';
import { AgentOrchestratorService } from '../../engine/agent/agent-orchestrator.service.js';
import { AgentPlan, AgentType, PlanStatus } from '../../engine/agent/interfaces/agent.interfaces.js';
import { ContextBuilderService } from '../../engine/agent/context-builder.service.js';
import { parseDateInput } from '../../common/utils/date-format.util.js';
import { AiEventsService } from './ai-events.service.js';

export interface OrchestrationResult {
  success: boolean;
  action: string;
  summary: string;
  details: Record<string, any>;
  taskId?: string;
  requiresApproval?: boolean;
}

@Injectable()
export class CommandOrchestrationService {
  private readonly logger = new Logger(CommandOrchestrationService.name);

  constructor(
    private orchestrator: AgentOrchestratorService,
    private contextBuilder: ContextBuilderService,
    private aiEvents: AiEventsService,
  ) {}

  /** Route operational orchestration intents through planner agents. */
  async runOrchestrationIntent(params: {
    businessId: string;
    intent: string;
    agentType: AgentType;
    userId?: string;
    date?: string;
    employeeId?: string;
    autoExecute?: boolean;
  }): Promise<OrchestrationResult> {
    const dateRange = this.dateRangeFromDate(params.date);
    const context = await this.contextBuilder.build(params.businessId, {
      dateRange,
      employeeId: params.employeeId,
    });

    const task = await this.orchestrator.processIntent({
      agentType: params.agentType,
      businessId: params.businessId,
      intent: params.intent,
      context,
      userId: params.userId,
      autoExecute: params.autoExecute ?? false,
    });

    return this.taskToResult(task, params.intent);
  }

  /** Execute a pre-built deterministic plan (from classified command intents). */
  async executePlan(params: {
    plan: AgentPlan;
    businessId: string;
    userId?: string;
    autoExecute?: boolean;
  }): Promise<OrchestrationResult> {
    const task = await this.orchestrator.processPlan({
      plan: params.plan,
      businessId: params.businessId,
      userId: params.userId,
      autoExecute: params.autoExecute ?? true,
    });

    return this.taskToResult(task, params.plan.intent);
  }

  async approveTask(taskId: string, userId: string): Promise<OrchestrationResult> {
    const task = await this.orchestrator.approveAndExecute(taskId, userId);
    return this.taskToResult(task, task.intent);
  }

  private taskToResult(task: any, action: string): OrchestrationResult {
    const requiresApproval =
      task.status === PlanStatus.REQUIRES_APPROVAL || task.status === PlanStatus.VALIDATED;

    if (task.status === PlanStatus.REJECTED) {
      return {
        success: false,
        action,
        summary: `Plan rejected by policy: ${(task.result?.policyResult?.violations ?? []).join('; ') || 'Policy violation'}`,
        details: { taskId: task.id, status: task.status, plan: task.plan },
        taskId: task.id,
      };
    }

    if (task.status === PlanStatus.FAILED) {
      return {
        success: false,
        action,
        summary: this.summarizeExecutionFailure(task),
        details: {
          taskId: task.id,
          status: task.status,
          plan: task.plan,
          result: task.result,
          error: task.error,
        },
        taskId: task.id,
      };
    }

    if (task.status === PlanStatus.COMPLETED) {
      return {
        success: true,
        action,
        summary: this.summarizeExecution(task),
        details: {
          taskId: task.id,
          status: task.status,
          plan: task.plan,
          result: task.result,
        },
        taskId: task.id,
      };
    }

    const planDiff =
      task.plan && requiresApproval ? this.orchestrator.buildPlanDiff(task.plan) : undefined;

    return {
      success: true,
      action,
      summary: [
        `Plan generated (${task.plan?.steps?.length ?? 0} step(s)).`,
        task.plan?.reasoning ?? '',
        requiresApproval
          ? 'Review and approve in AI Ops or reply with approval to execute.'
          : '',
      ]
        .filter(Boolean)
        .join('\n'),
      details: {
        taskId: task.id,
        status: task.status,
        plan: task.plan,
        requiresApproval,
        planDiff,
        policyPreview: task.result?.policyPreview,
      },
      taskId: task.id,
      requiresApproval,
    };
  }

  private summarizeExecutionFailure(task: any): string {
    const steps = task.result?.steps ?? [];
    const failed = steps.filter((s: any) => s.status === 'failed');
    const lines: string[] = [];

    if (failed.length > 0) {
      lines.push(`Orchestration failed (${failed.length}/${steps.length} step(s) failed).`);
      for (const step of failed) {
        const name = task.plan?.steps?.find((p: any) => p.id === step.stepId)?.description;
        lines.push(`• ${name || step.stepId}: ${step.error || 'Unknown error'}`);
      }
    } else {
      lines.push(`Execution failed: ${task.error || 'Unknown error'}`);
    }

    return lines.join('\n');
  }

  private summarizeExecution(task: any): string {
    const steps = task.result?.steps ?? [];
    const completed = steps.filter((s: any) => s.status === 'completed');
    const failed = steps.filter((s: any) => s.status === 'failed');

    if (failed.length > 0) {
      return this.summarizeExecutionFailure(task);
    }

    const lines = [`Orchestration completed (${completed.length}/${steps.length} steps).`];

    for (const step of completed) {
      if (step.result?.periodsCreated) {
        lines.push(`• Added ${step.result.periodsCreated} schedule period(s)`);
      }
      if (step.result?.slotsCreated && !step.result?.periodsCreated) {
        lines.push(`• Created ${step.result.slotsCreated} schedule slot(s)`);
      }
      if (step.result?.blockScheduleId) {
        lines.push(`• Block schedule created: ${step.result.blockScheduleId}`);
      }
      if (step.result?.bookingId) {
        lines.push(`• Booking created: ${step.result.bookingId}`);
      }
      if (step.result?.serviceId) {
        lines.push(
          `• Service created: ${step.result.name} (${step.result.durationMinutes} min, ${step.result.currency ?? 'USD'} ${step.result.price})`,
        );
      }
      if (step.result?.cancelledCount) {
        lines.push(`• Cancelled ${step.result.cancelledCount} booking(s)`);
      }
      if (step.result?.recommendations?.length) {
        lines.push('• Recommendations:');
        step.result.recommendations.slice(0, 5).forEach((r: string) => lines.push(`  - ${r}`));
      }
      if (step.result?.proposals?.length) {
        lines.push(`• ${step.result.proposals.length} reassignment proposal(s) generated`);
      }
      if (step.result?.resolutions?.length) {
        lines.push(`• ${step.result.resolutions.length} conflict resolution(s) proposed`);
      }
      if (step.result?.bookingCount != null) {
        lines.push(
          `• Schedule loaded: ${step.result.bookingCount} booking(s), ${step.result.periodCount ?? 0} schedule block(s)`,
        );
      }
    }

    return lines.join('\n');
  }

  private dateRangeFromDate(date?: string) {
    const start = date ? parseDateInput(date) ?? new Date(date) : new Date();
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCHours(23, 59, 59, 999);
    return { start, end };
  }
}
