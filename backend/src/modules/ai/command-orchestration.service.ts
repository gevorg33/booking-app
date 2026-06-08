import { Injectable, Logger } from '@nestjs/common';
import { AgentOrchestratorService } from '../../engine/agent/agent-orchestrator.service.js';
import {
  AgentPlan,
  AgentType,
  PlanStatus,
} from '../../engine/agent/interfaces/agent.interfaces.js';
import { ContextBuilderService } from '../../engine/agent/context-builder.service.js';
import { parseDateInput } from '../../common/utils/date-format.util.js';
import {
  appendBookingListLines,
  formatBlockScheduleLine,
  formatBookingCreatedLine,
  formatBookingSnapshotLine,
  type BookingSnapshot,
} from './ai-result-format.util.js';
import {
  buildPlanMismatchSummary,
  verifyPlanMatchesPrompt,
} from './ai-plan-vs-prompt-check.util.js';
import type { IntentGraduationStatus } from './ai-intent-graduation.util.js';
import {
  buildPostExecFailureSummary,
  buildPostExecRollbackDetails,
} from './ai-post-exec-assertion.util.js';
import { extractAutoRollbackDetails } from './ai-post-exec-auto-rollback.util.js';
import { AiEventsService } from './ai-events.service.js';
import {
  buildApprovalAlertPayload,
  buildPendingApprovalDetails,
  mapExecutionTimeline,
} from './orchestration-result.util.js';
import {
  findOutOfScopePlanStepActions,
  type CapabilityPlannerBounds,
  resolvePlannerAllowedIntents,
} from './ai-capability-bounded-planner.util.js';
import {
  buildPerStepPermissionDeniedSummary,
  findFirstDeniedStepAtExecute,
} from './ai-per-step-permission-recheck.util.js';

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
    executionConfirmed?: boolean;
    intentTraffic?: Record<string, { samples: number; accurateRate: number }>;
    confidenceHigh?: number;
    /** parity-3.1 — reject plans whose steps fall outside role-effective intents. */
    plannerBounds?: CapabilityPlannerBounds;
  }): Promise<OrchestrationResult> {
    if (params.plannerBounds) {
      const allowed = resolvePlannerAllowedIntents(params.plannerBounds);
      const denied = findFirstDeniedStepAtExecute(
        params.plan.steps,
        params.plannerBounds,
      );
      if (denied) {
        const outOfScope = findOutOfScopePlanStepActions(params.plan, allowed);
        return {
          success: false,
          action: params.plan.intent,
          summary: buildPerStepPermissionDeniedSummary(
            denied.action,
            denied.stepIndex,
            params.plan.steps.length,
          ),
          details: {
            capabilityBoundedPlannerFailed: true,
            perStepPermissionRecheckFailed: true,
            privilegeEscalationBlocked: true,
            deniedStepIndex: denied.stepIndex,
            deniedAction: denied.action,
            outOfScopeActions: outOfScope,
            plannerBounds: params.plannerBounds,
            allowedIntentCount: allowed.length,
            plan: params.plan,
            requiresApproval: false,
            pipelineStage: 'execute',
          },
        };
      }
    }

    const planCheck = verifyPlanMatchesPrompt(params.plan.intent, params.plan);
    if (!planCheck.ok) {
      return {
        success: false,
        action: params.plan.intent,
        summary: buildPlanMismatchSummary(planCheck.mismatches),
        details: {
          planMismatch: planCheck.mismatches,
          planVsPromptFailed: true,
          plan: params.plan,
          requiresApproval: false,
          pipelineStage: 'plan',
        },
      };
    }

    const task = await this.orchestrator.processPlan({
      plan: params.plan,
      businessId: params.businessId,
      userId: params.userId,
      autoExecute: params.autoExecute ?? true,
      executionConfirmed: params.executionConfirmed,
      intentTraffic: params.intentTraffic,
      confidenceHigh: params.confidenceHigh,
    });

    return this.taskToResult(task, params.plan.intent);
  }

  async approveTask(
    taskId: string,
    userId: string,
  ): Promise<OrchestrationResult> {
    const task = await this.orchestrator.approveAndExecute(taskId, userId);
    return this.taskToResult(task, task.intent);
  }

  async retryFailedStep(
    businessId: string,
    taskId: string,
    stepId: string,
    userId?: string,
  ): Promise<OrchestrationResult> {
    const task = await this.orchestrator.retryFailedStep(
      taskId,
      stepId,
      userId,
      businessId,
    );
    return this.taskToResult(task, task.intent);
  }

  private taskToResult(task: any, action: string): OrchestrationResult {
    const requiresApproval =
      task.status === PlanStatus.REQUIRES_APPROVAL ||
      task.status === PlanStatus.VALIDATED;

    if (task.status === PlanStatus.REJECTED) {
      const planMismatch = task.result?.planMismatch as string[] | undefined;
      const policyViolations = (task.result?.policyResult?.violations ?? []) as string[];
      return {
        success: false,
        action,
        summary:
          task.error ??
          (planMismatch?.length
            ? buildPlanMismatchSummary(planMismatch)
            : `Plan rejected by policy: ${policyViolations.join('; ') || 'Policy violation'}`),
        details: {
          taskId: task.id,
          status: task.status,
          plan: task.plan,
          planMismatch,
          planVsPromptFailed: task.result?.planVsPromptFailed === true,
          result: task.result,
        },
        taskId: task.id,
      };
    }

    if (task.status === PlanStatus.FAILED) {
      const taskResult = (task.result ?? {}) as Record<string, unknown>;
      return {
        success: false,
        action,
        summary: task.error ?? this.summarizeExecutionFailure(task),
        details: {
          taskId: task.id,
          status: task.status,
          plan: task.plan,
          result: task.result,
          error: task.error,
          executionTimeline: mapExecutionTimeline(task),
          executeRevalidationFailed: taskResult.executeRevalidationFailed === true,
          executeRevalidationIssues: taskResult.executeRevalidationIssues,
          stalePlan: taskResult.stalePlan === true,
          blastRadiusFailed: taskResult.blastRadiusFailed === true,
          blastRadius: taskResult.blastRadius,
          requiresExecutionConfirmation:
            taskResult.requiresExecutionConfirmation === true,
        },
        taskId: task.id,
      };
    }

    if (task.status === PlanStatus.COMPLETED) {
      if (task.result?.postExecAssertionFailed === true) {
        const taskResult = task.result as Record<string, unknown>;
        return {
          success: false,
          action,
          summary: buildPostExecFailureSummary(task),
          details: {
            taskId: task.id,
            status: task.status,
            plan: task.plan,
            result: task.result,
            executionTimeline: mapExecutionTimeline(task),
            ...buildPostExecRollbackDetails(task.id, {
              ok: false,
              message: taskResult.assertionMessage as string | undefined,
              field: taskResult.assertionField as string | undefined,
            }),
            ...extractAutoRollbackDetails(taskResult),
            rollbackOffered: taskResult.rollbackOffered === true,
          },
          taskId: task.id,
        };
      }

      return {
        success: true,
        action,
        summary: this.summarizeExecution(task),
        details: {
          taskId: task.id,
          status: task.status,
          plan: task.plan,
          result: task.result,
          executionTimeline: mapExecutionTimeline(task),
        },
        taskId: task.id,
      };
    }

    const planDiff =
      task.plan && requiresApproval
        ? this.orchestrator.buildPlanDiff(task.plan)
        : undefined;
    const graduationStatus = task.result?.graduationStatus as
      | IntentGraduationStatus
      | undefined;
    const employeeCount =
      task.context?.employees?.length ??
      task.context?.policyMetrics?.employeeCount ??
      task.plan?.steps?.length;

    if (requiresApproval && task.businessId) {
      const alert = buildApprovalAlertPayload(
        action,
        task.id,
        planDiff?.length ?? task.plan?.steps?.length ?? 0,
      );
      this.aiEvents.emitAlert(task.businessId, alert);
    }

    return {
      success: true,
      action,
      summary: [
        graduationStatus?.proposeOnly
          ? `Propose-only mode — review plan before executing (${graduationStatus.samples}/${graduationStatus.minSamples} samples, ${Math.round(graduationStatus.accurateRate * 100)}% accurate).`
          : `Plan generated (${task.plan?.steps?.length ?? 0} step(s)).`,
        task.plan?.reasoning ?? '',
        requiresApproval
          ? 'Review and approve in AI Ops or reply with approval to execute.'
          : '',
      ]
        .filter(Boolean)
        .join('\n'),
      details: {
        ...buildPendingApprovalDetails({
        action,
        taskId: task.id,
        status: task.status,
        plan: task.plan,
        planDiff,
        policyPreview: task.result?.policyPreview,
        employeeCount,
        daySpan: 7,
      }),
        proposeOnly: graduationStatus?.proposeOnly === true,
        dryRun: graduationStatus?.proposeOnly === true,
        graduationStatus,
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
      lines.push(
        `Orchestration failed (${failed.length}/${steps.length} step(s) failed).`,
      );
      for (const step of failed) {
        const name = task.plan?.steps?.find(
          (p: any) => p.id === step.stepId,
        )?.description;
        lines.push(
          `• ${name || step.stepId}: ${step.error || 'Unknown error'}`,
        );
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

    const lines = [
      `Orchestration completed (${completed.length}/${steps.length} steps).`,
    ];

    for (const step of completed) {
      const planStep = task.plan?.steps?.find(
        (p: { id: string }) => p.id === step.stepId,
      );
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
    if (result.periodsRemoved != null) {
      lines.push(
        `• Cleared ${result.periodsRemoved} period(s) and ${result.slotsRemoved ?? 0} slot(s)`,
      );
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
      lines.push(
        `• Rescheduled: ${formatBookingSnapshotLine(result, { includeCustomer: true })}`,
      );
    } else if (action === 'create_booking' && result.bookingId) {
      lines.push(formatBookingCreatedLine(result));
    } else if (
      result.bookingId &&
      !result.cancelledCount &&
      !result.hiddenCount &&
      !result.unhiddenCount
    ) {
      if (result.employeeName && result.startTime && result.endTime) {
        lines.push(
          `• Booking updated: ${formatBookingSnapshotLine(result, { includeCustomer: true })}`,
        );
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
      lines.push(
        `• Cancelled: ${formatBookingSnapshotLine(result, { includeCustomer: true })}`,
      );
    }

    if (result.hiddenCount != null) {
      const snapshots = (result.hiddenBookings ?? []) as BookingSnapshot[];
      if (snapshots.length > 0) {
        appendBookingListLines(lines, '• Hidden from calendar', snapshots);
      } else {
        lines.push(
          `• Hidden ${result.hiddenCount} appointment(s) from calendar`,
        );
      }
    }

    if (result.unhiddenCount != null) {
      const snapshots = (result.unhiddenBookings ?? []) as BookingSnapshot[];
      if (snapshots.length > 0) {
        appendBookingListLines(lines, '• Restored to calendar', snapshots);
      } else {
        lines.push(
          `• Restored ${result.unhiddenCount} appointment(s) to calendar`,
        );
      }
    }

    if (result.notifiedCount != null) {
      lines.push(
        `• Notified ${result.notifiedCount} customer(s) (email/SMS/WhatsApp)`,
      );
    }
    if (result.recommendations?.length) {
      lines.push('• Recommendations:');
      result.recommendations
        .slice(0, 5)
        .forEach((r: string) => lines.push(`  - ${r}`));
    }
    if (result.proposals?.length) {
      lines.push(
        `• ${result.proposals.length} reassignment proposal(s) generated`,
      );
    }
    if (result.resolutions?.length) {
      lines.push(
        `• ${result.resolutions.length} conflict resolution(s) proposed`,
      );
    }
    if (result.bookingCount != null) {
      lines.push(
        `• Schedule loaded: ${result.bookingCount} booking(s), ${result.periodCount ?? 0} schedule block(s)`,
      );
    }
  }

  private dateRangeFromDate(date?: string) {
    const start = date ? (parseDateInput(date) ?? new Date(date)) : new Date();
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCHours(23, 59, 59, 999);
    return { start, end };
  }
}
