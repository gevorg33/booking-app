import { Injectable, Logger } from '@nestjs/common';
import { AgentOrchestratorService } from '../../engine/agent/agent-orchestrator.service.js';
import { AgentPlan, AgentType, PlanStatus } from '../../engine/agent/interfaces/agent.interfaces.js';
import { ContextBuilderService } from '../../engine/agent/context-builder.service.js';
import {
  parseDateInput,
} from '../../common/utils/date-format.util.js';
import {
  appendBookingListLines,
  formatBlockScheduleLine,
  formatBookingCreatedLine,
  formatBookingSnapshotLine,
  type BookingSnapshot,
} from './ai-result-format.util.js';
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
      const planStep = task.plan?.steps?.find((p: { id: string }) => p.id === step.stepId);
      this.appendStepSummaryLines(lines, planStep?.action, step.result ?? {});
    }

    return lines.join('\n');
  }

  private appendStepSummaryLines(
    lines: string[],
    action: string | undefined,
    result: Record<string, any>,
  ): void {
    if (result.periodsCreated) {
      lines.push(`• Added ${result.periodsCreated} schedule period(s)`);
    }
    if (result.slotsCreated && !result.periodsCreated) {
      lines.push(`• Created ${result.slotsCreated} schedule slot(s)`);
    }
    if (result.blockScheduleId && !result.removedBlockScheduleId) {
      lines.push(formatBlockScheduleLine(result));
    }
    if (result.removedBlockScheduleId) {
      lines.push('• Block schedule removed');
    }

    if (action === 'reschedule_booking' && result.bookingId) {
      lines.push(`• Rescheduled: ${formatBookingSnapshotLine(result, { includeCustomer: true })}`);
    } else if (action === 'create_booking' && result.bookingId) {
      lines.push(formatBookingCreatedLine(result));
    } else if (result.bookingId && !result.cancelledCount && !result.hiddenCount && !result.unhiddenCount) {
      if (result.employeeName && result.startTime && result.endTime) {
        lines.push(`• Booking updated: ${formatBookingSnapshotLine(result, { includeCustomer: true })}`);
      }
    }

    if (result.serviceId && result.name) {
      lines.push(
        `• Service created: ${result.name} (${result.durationMinutes} min, ${result.currency ?? 'USD'} ${result.price})`,
      );
    }

    if (result.cancelledCount != null) {
      const snapshots = (result.cancelledBookings ?? []) as BookingSnapshot[];
      if (snapshots.length > 0) {
        appendBookingListLines(lines, '• Cancelled', snapshots);
      } else {
        lines.push(`• Cancelled ${result.cancelledCount} booking(s)`);
      }
    } else if (result.cancelledId && result.employeeName) {
      lines.push(`• Cancelled: ${formatBookingSnapshotLine(result, { includeCustomer: true })}`);
    }

    if (result.hiddenCount != null) {
      const snapshots = (result.hiddenBookings ?? []) as BookingSnapshot[];
      if (snapshots.length > 0) {
        appendBookingListLines(lines, '• Hidden from calendar', snapshots);
      } else {
        lines.push(`• Hidden ${result.hiddenCount} appointment(s) from calendar`);
      }
    }

    if (result.unhiddenCount != null) {
      const snapshots = (result.unhiddenBookings ?? []) as BookingSnapshot[];
      if (snapshots.length > 0) {
        appendBookingListLines(lines, '• Restored to calendar', snapshots);
      } else {
        lines.push(`• Restored ${result.unhiddenCount} appointment(s) to calendar`);
      }
    }

    if (result.notifiedCount != null) {
      lines.push(`• Notified ${result.notifiedCount} customer(s) (email/SMS/WhatsApp)`);
    }
    if (result.recommendations?.length) {
      lines.push('• Recommendations:');
      result.recommendations.slice(0, 5).forEach((r: string) => lines.push(`  - ${r}`));
    }
    if (result.proposals?.length) {
      lines.push(`• ${result.proposals.length} reassignment proposal(s) generated`);
    }
    if (result.resolutions?.length) {
      lines.push(`• ${result.resolutions.length} conflict resolution(s) proposed`);
    }
    if (result.bookingCount != null) {
      lines.push(
        `• Schedule loaded: ${result.bookingCount} booking(s), ${result.periodCount ?? 0} schedule block(s)`,
      );
    }
  }

  private dateRangeFromDate(date?: string) {
    const start = date ? parseDateInput(date) ?? new Date(date) : new Date();
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCHours(23, 59, 59, 999);
    return { start, end };
  }
}
