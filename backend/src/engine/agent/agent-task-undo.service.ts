import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentTask } from './agent-task.entity.js';
import {
  PlanStatus,
  type AgentPlanStep,
} from './interfaces/agent.interfaces.js';
import { BookingService } from '../../modules/booking/booking.service.js';
import { BlockScheduleService } from '../../modules/schedule/services/block-schedule.service.js';
import { ScheduleService } from '../../modules/schedule/schedule.service.js';
import { EmployeeService } from '../../modules/employee/employee.service.js';
import { EventStoreService } from '../../events/store/event-store.service.js';
import { EventType } from '../../events/event-types.js';
import { StepStatus } from '../workflow/interfaces/workflow.interfaces.js';
import type { AutoRollbackAttemptResult } from '../../modules/ai/ai-post-exec-auto-rollback.util.js';

const READONLY_ACTIONS = new Set([
  'list_appointments',
  'fetch_current_schedule',
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
  'notify_cancelled_customers',
]);

/** ai-d7 / parity-2.6 — agent workflow steps that support one-tap undo. */
export const AGENT_UNDOABLE_ACTIONS = new Set([
  'create_booking',
  'execute_reassignment',
  'cancel_bookings',
  'hide_appointments_from_calendar',
  'unhide_appointments_from_calendar',
  'reschedule_booking',
  'create_block_schedule',
  'assign_employee_services',
  'create_direct_schedule',
]);

/** ai-d7 / parity-2.6 — destructive or irreversible mutations (documented, no undo). */
export const AGENT_NON_UNDOABLE_ACTIONS = new Set([
  'clear_schedule',
  'fill_schedule_gaps',
  'apply_template',
  'remove_block_schedule',
  'create_schedule_template',
  'create_service',
  'update_bookings',
  'mark_no_shows',
  'payment_sweep',
  'apply_conflict_resolutions',
  'mark_paid',
  'block_schedule',
  'merge_customers',
  'delete_customer_data',
  'privacy_delete',
  'admin_delete_customer_data',
]);

const UNDOABLE_ACTIONS = AGENT_UNDOABLE_ACTIONS;
const NON_UNDOABLE_ACTIONS = AGENT_NON_UNDOABLE_ACTIONS;

export interface AgentTaskUndoPreview {
  taskId: string;
  intent: string;
  createdAt: Date;
  undoable: boolean;
  reason?: string;
  reversibleSteps: Array<{ action: string; description: string }>;
}

export interface AgentTaskUndoResult {
  taskId: string;
  intent: string;
  commandTraceId?: string;
  executedAt?: Date;
  reversedSteps: Array<{
    action: string;
    description: string;
    success: boolean;
    error?: string;
  }>;
}

@Injectable()
export class AgentTaskUndoService {
  private readonly logger = new Logger(AgentTaskUndoService.name);
  private readonly taskRepo: Repository<AgentTask>;
  private readonly bookingService: BookingService;
  private readonly blockScheduleService: BlockScheduleService;
  private readonly scheduleService: ScheduleService;
  private readonly employeeService: EmployeeService;
  private readonly eventStore: EventStoreService;

  constructor(
    @InjectRepository(AgentTask) taskRepo: Repository<AgentTask>,
    bookingService: BookingService,
    blockScheduleService: BlockScheduleService,
    scheduleService: ScheduleService,
    employeeService: EmployeeService,
    eventStore: EventStoreService,
  ) {
    this.taskRepo = taskRepo;
    this.bookingService = bookingService;
    this.blockScheduleService = blockScheduleService;
    this.scheduleService = scheduleService;
    this.employeeService = employeeService;
    this.eventStore = eventStore;
  }

  async getLatestUndoPreview(
    businessId: string,
  ): Promise<AgentTaskUndoPreview | null> {
    const task = await this.findLatestUndoCandidate(businessId);
    if (!task) return null;
    return this.buildUndoPreview(task);
  }

  async undoLatest(
    businessId: string,
    userId: string,
  ): Promise<AgentTaskUndoResult> {
    const task = await this.findLatestUndoCandidate(businessId);
    if (!task) {
      throw new BadRequestException(
        'No completed AI command is available to undo',
      );
    }
    return this.undoTask(task, userId);
  }

  async undoTaskById(
    taskId: string,
    userId: string,
  ): Promise<AgentTaskUndoResult> {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) {
      throw new BadRequestException('Task not found');
    }
    if ((task.result as Record<string, unknown> | undefined)?.undone) {
      throw new BadRequestException('This command was already undone');
    }
    return this.undoTask(task, userId);
  }

  /** acc-5.5 — revert workflow mutations when post-exec assertion fails. */
  async attemptAutoRollbackForAssertionFailure(
    task: AgentTask,
    userId: string,
  ): Promise<AutoRollbackAttemptResult> {
    const preview = this.buildUndoPreview(task);
    if (!preview.undoable) {
      return {
        attempted: false,
        succeeded: false,
        reason:
          preview.reason ?? 'This command cannot be automatically reverted',
      };
    }

    try {
      const undoResult = await this.undoTask(task, userId);
      return { attempted: true, succeeded: true, undoResult };
    } catch (error: any) {
      const message = error?.message ?? String(error);
      this.logger.warn(
        `Auto rollback failed for task ${task.id}: ${message}`,
      );
      return { attempted: true, succeeded: false, error: message };
    }
  }

  async attemptAutoRollbackByTaskId(
    taskId: string,
    userId: string,
  ): Promise<AutoRollbackAttemptResult> {
    const task = await this.taskRepo.findOne({ where: { id: taskId } });
    if (!task) {
      return {
        attempted: false,
        succeeded: false,
        reason: 'No workflow log found for automatic revert',
      };
    }
    if ((task.result as Record<string, unknown> | undefined)?.undone) {
      return {
        attempted: false,
        succeeded: false,
        reason: 'This command was already undone',
      };
    }
    return this.attemptAutoRollbackForAssertionFailure(task, userId);
  }

  private async findLatestUndoCandidate(
    businessId: string,
  ): Promise<AgentTask | null> {
    const tasks = await this.taskRepo.find({
      where: { businessId, status: PlanStatus.COMPLETED },
      order: { createdAt: 'DESC' },
      take: 30,
    });

    for (const task of tasks) {
      if ((task.result as Record<string, unknown> | undefined)?.undone)
        continue;
      const preview = this.buildUndoPreview(task);
      if (preview.undoable) return task;
    }
    return null;
  }

  buildUndoPreview(task: AgentTask): AgentTaskUndoPreview {
    const mutating = this.getCompletedMutatingSteps(task);
    const unsupported = mutating.filter(({ planStep }) =>
      NON_UNDOABLE_ACTIONS.has(planStep.action),
    );
    const reversible = mutating.filter(({ planStep }) =>
      UNDOABLE_ACTIONS.has(planStep.action),
    );

    if (mutating.length === 0) {
      return {
        taskId: task.id,
        intent: task.intent,
        createdAt: task.createdAt,
        undoable: false,
        reason: 'This task made no changes that can be reversed',
        reversibleSteps: [],
      };
    }

    if (unsupported.length > 0) {
      const labels = [
        ...new Set(unsupported.map(({ planStep }) => planStep.action)),
      ].join(', ');
      return {
        taskId: task.id,
        intent: task.intent,
        createdAt: task.createdAt,
        undoable: false,
        reason: `Undo is not supported for: ${labels}`,
        reversibleSteps: [],
      };
    }

    if (reversible.length === 0) {
      return {
        taskId: task.id,
        intent: task.intent,
        createdAt: task.createdAt,
        undoable: false,
        reason: 'This task has no supported undo actions',
        reversibleSteps: [],
      };
    }

    return {
      taskId: task.id,
      intent: task.intent,
      createdAt: task.createdAt,
      undoable: true,
      reversibleSteps: reversible.map(({ planStep }) => ({
        action: planStep.action,
        description: planStep.description,
      })),
    };
  }

  private async undoTask(
    task: AgentTask,
    userId: string,
  ): Promise<AgentTaskUndoResult> {
    const preview = this.buildUndoPreview(task);
    if (!preview.undoable) {
      throw new BadRequestException(
        preview.reason ?? 'This command cannot be undone',
      );
    }

    const mutating = this.getCompletedMutatingSteps(task).filter(
      ({ planStep }) => UNDOABLE_ACTIONS.has(planStep.action),
    );
    const reversedSteps: AgentTaskUndoResult['reversedSteps'] = [];

    for (const entry of [...mutating].reverse()) {
      try {
        await this.reverseStep(
          task.businessId,
          userId,
          entry.planStep,
          entry.stepResult.result as Record<string, unknown> | undefined,
        );
        reversedSteps.push({
          action: entry.planStep.action,
          description: entry.planStep.description,
          success: true,
        });
      } catch (error: any) {
        const message = error?.message ?? String(error);
        this.logger.warn(
          `Undo step failed (${entry.planStep.action}): ${message}`,
        );
        reversedSteps.push({
          action: entry.planStep.action,
          description: entry.planStep.description,
          success: false,
          error: message,
        });
        throw new BadRequestException(
          `Undo stopped after partial reversal: ${message}. Some changes may already be reverted.`,
        );
      }
    }

    task.result = {
      ...(task.result ?? {}),
      undone: true,
      undoneAt: new Date().toISOString(),
      undoneBy: userId,
      undoSummary: reversedSteps,
    };
    await this.taskRepo.save(task);

    await this.eventStore.publish({
      eventType: EventType.AGENT_PLAN_UNDONE,
      aggregateType: 'agent_task',
      aggregateId: task.id,
      businessId: task.businessId,
      userId,
      payload: {
        taskId: task.id,
        intent: task.intent,
        reversedSteps,
      },
    });

    return {
      taskId: task.id,
      intent: task.intent,
      commandTraceId:
        typeof task.context?._traceId === 'string'
          ? task.context._traceId
          : undefined,
      executedAt: task.updatedAt,
      reversedSteps,
    };
  }

  private getCompletedMutatingSteps(task: AgentTask) {
    type StoredStepResult = {
      stepId: string;
      status: string;
      result?: unknown;
    };
    const stepResults = new Map<string, StoredStepResult>(
      ((task.result as any)?.steps ?? []).map((s: StoredStepResult) => [
        s.stepId,
        s,
      ]),
    );

    const completed: Array<{
      planStep: AgentPlanStep;
      stepResult: StoredStepResult;
    }> = [];

    for (const planStep of task.plan?.steps ?? []) {
      if (READONLY_ACTIONS.has(planStep.action)) continue;
      const stepResult = stepResults.get(planStep.id);
      if (stepResult?.status === StepStatus.COMPLETED) {
        completed.push({ planStep, stepResult });
      }
    }

    return completed;
  }

  private async reverseStep(
    businessId: string,
    userId: string,
    planStep: AgentPlanStep,
    result: Record<string, unknown> | undefined,
  ): Promise<void> {
    switch (planStep.action) {
      case 'create_booking':
      case 'execute_reassignment': {
        const bookingId = result?.bookingId as string | undefined;
        if (!bookingId) {
          throw new BadRequestException('Missing booking id to reverse');
        }
        await this.bookingService.cancel(
          bookingId,
          'Undone AI command',
          userId,
        );
        return;
      }
      case 'cancel_bookings': {
        const ids =
          (result?.cancelledIds as string[] | undefined) ??
          planStep.params.bookingIds;
        if (!ids?.length) {
          throw new BadRequestException(
            'Missing cancelled booking ids to restore',
          );
        }
        for (const id of ids) {
          await this.bookingService.restoreCancelled(id, userId);
        }
        return;
      }
      case 'hide_appointments_from_calendar': {
        const ids = (planStep.params.bookingIds as string[] | undefined) ?? [];
        if (!ids.length) {
          throw new BadRequestException('Missing booking ids to unhide');
        }
        await this.bookingService.setHiddenFromCalendar(ids, false, userId);
        return;
      }
      case 'unhide_appointments_from_calendar': {
        const ids = (planStep.params.bookingIds as string[] | undefined) ?? [];
        if (!ids.length) {
          throw new BadRequestException('Missing booking ids to hide');
        }
        await this.bookingService.setHiddenFromCalendar(ids, true, userId);
        return;
      }
      case 'reschedule_booking': {
        const bookingId =
          (result?.bookingId as string | undefined) ??
          (planStep.params.bookingId as string | undefined);
        if (!bookingId) {
          throw new BadRequestException(
            'Missing booking id to reverse reschedule',
          );
        }

        let previousStartTime = result?.previousStartTime as
          | string
          | Date
          | undefined;
        let previousEmployeeId = result?.previousEmployeeId as
          | string
          | undefined;
        const previousServiceId = result?.previousServiceId as
          | string
          | undefined;

        if (!previousStartTime) {
          const events = await this.eventStore.getEvents({
            aggregateType: 'booking',
            aggregateId: bookingId,
            eventType: EventType.BOOKING_RESCHEDULED,
            limit: 1,
          });
          const payload = events[0]?.payload as
            | Record<string, string>
            | undefined;
          previousStartTime = payload?.oldStartTime;
          previousEmployeeId = previousEmployeeId ?? payload?.employeeId;
        }

        if (!previousStartTime) {
          throw new BadRequestException(
            'Cannot determine previous appointment time',
          );
        }

        await this.bookingService.update(
          bookingId,
          {
            startTime: new Date(previousStartTime).toISOString(),
            employeeId: previousEmployeeId,
            serviceId: previousServiceId,
          },
          userId,
        );
        return;
      }
      case 'create_block_schedule': {
        const blockScheduleId = result?.blockScheduleId as string | undefined;
        if (!blockScheduleId) {
          throw new BadRequestException('Missing block schedule id to remove');
        }
        await this.blockScheduleService.remove(
          businessId,
          blockScheduleId,
          userId,
        );
        return;
      }
      case 'assign_employee_services': {
        const employeeId =
          (result?.employeeId as string | undefined) ??
          (planStep.params.employeeId as string | undefined);
        const previousServiceIds = result?.previousServiceIds as
          | string[]
          | undefined;
        if (!employeeId || !previousServiceIds) {
          throw new BadRequestException(
            'Missing previous service assignment to restore',
          );
        }
        await this.employeeService.update(
          employeeId,
          { serviceIds: previousServiceIds },
          userId,
        );
        return;
      }
      case 'create_direct_schedule': {
        const periodIds = result?.periodIds as string[] | undefined;
        const slotIds = result?.slotIds as string[] | undefined;
        if (!periodIds?.length && !slotIds?.length) {
          throw new BadRequestException(
            'Missing schedule period/slot snapshot — cannot undo this schedule change',
          );
        }
        await this.scheduleService.revertCreatedSchedule(businessId, {
          periodIds: periodIds ?? [],
          slotIds: slotIds ?? [],
        });
        return;
      }
      default:
        throw new BadRequestException(
          `Undo is not supported for action: ${planStep.action}`,
        );
    }
  }
}
