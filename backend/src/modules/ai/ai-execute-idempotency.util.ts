import type { Repository } from 'typeorm';
import { Between, Not } from 'typeorm';
import type { CommandResult } from './command-completion.types.js';
import type { AgentPlan } from '../../engine/agent/interfaces/agent.interfaces.js';
import { PlanStatus } from '../../engine/agent/interfaces/agent.interfaces.js';
import type { AgentTask } from '../../engine/agent/agent-task.entity.js';
import {
  Booking,
  BookingStatus,
} from '../booking/entities/booking.entity.js';
import type { Employee } from '../employee/entities/employee.entity.js';
import type { Service } from '../service/entities/service.entity.js';
import type { BookingSlotResolverService } from '../booking/booking-slot-resolver.service.js';
import { formatTimeDisplay } from '../../common/utils/date-format.util.js';
import { PLAN_STALE_TTL_MS } from './ai-execution-verification.fixtures.js';
import { EXECUTE_REVALIDATION_ACTIONS } from './ai-execute-idempotency.fixtures.js';

function isStaleExecutionPlan(
  planBuiltAt: Date | undefined,
  nowMs = Date.now(),
): boolean {
  if (!planBuiltAt) return false;
  return nowMs - planBuiltAt.getTime() > PLAN_STALE_TTL_MS;
}

export { EXECUTE_REVALIDATION_ACTIONS } from './ai-execute-idempotency.fixtures.js';

export interface PlanMutationStep {
  stepId: string;
  action: string;
  params: Record<string, unknown>;
}

export type ExecuteRevalidationIssueKind =
  | 'stale_plan'
  | 'already_executed'
  | 'duplicate_plan_mutation'
  | 'slot_unavailable'
  | 'schedule_conflict'
  | 'duplicate_customer_booking'
  | 'missing_mutation_params';

export interface ExecuteRevalidationIssue {
  kind: ExecuteRevalidationIssueKind;
  message: string;
  stepId?: string;
  field?: string;
}

export interface ExecuteRevalidationResult {
  ok: boolean;
  issues: ExecuteRevalidationIssue[];
}

export interface ExecuteRevalidationDeps {
  slotResolver: Pick<
    BookingSlotResolverService,
    'checkSlotAvailability' | 'describeUnavailable'
  >;
  bookingRepo: Pick<Repository<Booking>, 'findOne' | 'createQueryBuilder'>;
  employeeRepo: Pick<Repository<Employee>, 'findOne'>;
  serviceRepo: Pick<Repository<Service>, 'findOne'>;
}

export interface ExecuteRevalidationInput {
  businessId: string;
  plan: AgentPlan;
  task?: Pick<AgentTask, 'status' | 'result' | 'workflowExecutionId'>;
  timeZone?: string;
  nowMs?: number;
}

export function extractPlanMutationSteps(plan: AgentPlan): PlanMutationStep[] {
  return plan.steps
    .filter((step) =>
      (EXECUTE_REVALIDATION_ACTIONS as readonly string[]).includes(step.action),
    )
    .map((step) => ({
      stepId: step.id,
      action: step.action,
      params: step.params as Record<string, unknown>,
    }));
}

function mutationFingerprint(step: PlanMutationStep): string | null {
  if (
    step.action === 'create_booking' ||
    step.action === 'execute_reassignment' ||
    step.action === 'fill_slot_from_waitlist'
  ) {
    const employeeId = step.params.employeeId;
    const startTime = step.params.startTime;
    if (typeof employeeId === 'string' && typeof startTime === 'string') {
      return `book:${employeeId}:${startTime}`;
    }
    return null;
  }

  if (step.action === 'reschedule_booking') {
    const bookingId = step.params.bookingId;
    if (typeof bookingId === 'string') {
      return `reschedule:${bookingId}`;
    }
  }

  return null;
}

/** acc-5.6 — detect duplicate booking/reschedule steps inside one plan. */
export function detectIntraPlanDuplicateMutations(
  steps: PlanMutationStep[],
): ExecuteRevalidationIssue[] {
  const seen = new Map<string, string>();
  const issues: ExecuteRevalidationIssue[] = [];

  for (const step of steps) {
    const fingerprint = mutationFingerprint(step);
    if (!fingerprint) continue;

    const priorStepId = seen.get(fingerprint);
    if (priorStepId) {
      issues.push({
        kind: 'duplicate_plan_mutation',
        stepId: step.stepId,
        field: 'plan',
        message:
          step.action === 'reschedule_booking'
            ? 'This plan tries to reschedule the same booking more than once.'
            : 'This plan tries to book the same provider and time more than once.',
      });
      continue;
    }
    seen.set(fingerprint, step.stepId);
  }

  return issues;
}

export function isTaskAlreadyExecuted(
  task: Pick<AgentTask, 'status' | 'result' | 'workflowExecutionId'>,
): boolean {
  if (task.status === PlanStatus.EXECUTING) {
    return true;
  }

  if (task.status !== PlanStatus.COMPLETED) {
    return false;
  }

  if (task.result?.postExecAssertionFailed === true) {
    return false;
  }

  return Boolean(task.workflowExecutionId ?? task.result);
}

export function buildExecuteRevalidationSummary(
  issues: ExecuteRevalidationIssue[],
): string {
  if (issues.length === 0) {
    return 'Execute-time validation failed.';
  }

  const primary = issues[0]!;
  if (primary.kind === 'stale_plan') {
    return 'This plan is stale — please run the command again so I can re-check availability before executing.';
  }
  if (primary.kind === 'already_executed') {
    return 'This command was already executed.';
  }
  if (primary.kind === 'duplicate_plan_mutation') {
    return `${primary.message} Split the request or refresh availability before executing.`;
  }
  if (primary.kind === 'duplicate_customer_booking') {
    return primary.message;
  }

  return `${primary.message} Re-run the command to refresh availability before executing.`;
}

export function buildExecuteRevalidationRejection(
  action: string,
  issues: ExecuteRevalidationIssue[],
): CommandResult {
  const stale = issues.some((issue) => issue.kind === 'stale_plan');
  return {
    success: false,
    action,
    summary: buildExecuteRevalidationSummary(issues),
    details: {
      needsClarification: stale,
      stalePlan: stale,
      executeRevalidationFailed: true,
      executeRevalidationIssues: issues,
      pipelineStage: 'validate',
    },
  };
}

async function revalidateCreateLikeStep(
  deps: ExecuteRevalidationDeps,
  input: ExecuteRevalidationInput,
  step: PlanMutationStep,
): Promise<ExecuteRevalidationIssue | null> {
  const employeeId = step.params.employeeId;
  const serviceId = step.params.serviceId;
  const startTime = step.params.startTime;
  const customerId = step.params.customerId;

  if (
    typeof employeeId !== 'string' ||
    typeof serviceId !== 'string' ||
    typeof startTime !== 'string'
  ) {
    return {
      kind: 'missing_mutation_params',
      stepId: step.stepId,
      message: 'Booking step is missing provider, service, or start time.',
    };
  }

  const [employee, service] = await Promise.all([
    deps.employeeRepo.findOne({
      where: { id: employeeId, businessId: input.businessId, isActive: true },
    }),
    deps.serviceRepo.findOne({
      where: { id: serviceId, businessId: input.businessId },
    }),
  ]);

  if (!employee || !service) {
    return {
      kind: 'missing_mutation_params',
      stepId: step.stepId,
      message: 'Booking step references a missing provider or service.',
    };
  }

  const isoDay = startTime.slice(0, 10);
  const timeSlot = formatTimeDisplay(new Date(startTime));
  const availability = await deps.slotResolver.checkSlotAvailability(
    input.businessId,
    employee.id,
    employee.name,
    service.id,
    isoDay,
    timeSlot,
    input.timeZone ?? 'UTC',
  );

  if (!availability.available) {
    return {
      kind: 'slot_unavailable',
      stepId: step.stepId,
      field: 'timeSlot',
      message: deps.slotResolver.describeUnavailable(
        availability,
        service.name,
        timeSlot,
        isoDay,
      ),
    };
  }

  if (typeof customerId === 'string') {
    const start = new Date(startTime);
    const duplicateCustomerBooking = await deps.bookingRepo.findOne({
      where: {
        businessId: input.businessId,
        customerId,
        status: Not(BookingStatus.CANCELLED) as any,
        startTime: Between(
          new Date(start.getTime() - 60_000),
          new Date(start.getTime() + 60_000),
        ),
      },
    });
    if (duplicateCustomerBooking) {
      return {
        kind: 'duplicate_customer_booking',
        stepId: step.stepId,
        field: 'customerId',
        message: 'Customer already has a booking at this time.',
      };
    }
  }

  return null;
}

async function revalidateRescheduleStep(
  deps: ExecuteRevalidationDeps,
  input: ExecuteRevalidationInput,
  step: PlanMutationStep,
): Promise<ExecuteRevalidationIssue | null> {
  const bookingId = step.params.bookingId;
  const startTime = step.params.startTime;
  if (typeof bookingId !== 'string' || typeof startTime !== 'string') {
    return {
      kind: 'missing_mutation_params',
      stepId: step.stepId,
      message: 'Reschedule step is missing booking or start time.',
    };
  }

  const existing = await deps.bookingRepo.findOne({
    where: { id: bookingId, businessId: input.businessId },
    relations: { service: true },
  });
  if (!existing) {
    return {
      kind: 'missing_mutation_params',
      stepId: step.stepId,
      message: `Booking not found: ${bookingId}`,
    };
  }

  const targetStart = new Date(startTime);
  const durationMs = existing.endTime.getTime() - existing.startTime.getTime();
  const targetEnd = new Date(targetStart.getTime() + durationMs);
  const targetEmployeeId =
    typeof step.params.employeeId === 'string'
      ? step.params.employeeId
      : existing.employeeId;

  const conflicts = await deps.bookingRepo
    .createQueryBuilder('b')
    .where('b.businessId = :businessId', { businessId: input.businessId })
    .andWhere('b.employeeId = :employeeId', { employeeId: targetEmployeeId })
    .andWhere('b.id != :bookingId', { bookingId })
    .andWhere('b.status NOT IN (:...terminal)', {
      terminal: [BookingStatus.CANCELLED, BookingStatus.COMPLETED],
    })
    .andWhere('b.startTime < :targetEnd', { targetEnd })
    .andWhere('b.endTime > :targetStart', { targetStart })
    .getMany();

  if (conflicts.length > 0) {
    return {
      kind: 'schedule_conflict',
      stepId: step.stepId,
      field: 'timeSlot',
      message: `Reschedule conflict: ${conflicts.length} overlapping booking(s) at the requested time`,
    };
  }

  const employee = await deps.employeeRepo.findOne({
    where: { id: targetEmployeeId, businessId: input.businessId, isActive: true },
  });
  const serviceId =
    typeof step.params.serviceId === 'string'
      ? step.params.serviceId
      : existing.serviceId;
  const service = await deps.serviceRepo.findOne({
    where: { id: serviceId, businessId: input.businessId },
  });

  if (!employee || !service) {
    return {
      kind: 'missing_mutation_params',
      stepId: step.stepId,
      message: 'Reschedule step references a missing provider or service.',
    };
  }

  const isoDay = startTime.slice(0, 10);
  const timeSlot = formatTimeDisplay(targetStart);
  const availability = await deps.slotResolver.checkSlotAvailability(
    input.businessId,
    employee.id,
    employee.name,
    service.id,
    isoDay,
    timeSlot,
    input.timeZone ?? 'UTC',
  );
  if (!availability.available) {
    return {
      kind: 'slot_unavailable',
      stepId: step.stepId,
      field: 'timeSlot',
      message: deps.slotResolver.describeUnavailable(
        availability,
        service.name,
        timeSlot,
        isoDay,
      ),
    };
  }

  return null;
}

/** acc-5.6 — re-check conflicts, duplicates, and staleness immediately before execution. */
export async function revalidatePlanBeforeExecute(
  deps: ExecuteRevalidationDeps,
  input: ExecuteRevalidationInput,
): Promise<ExecuteRevalidationResult> {
  const issues: ExecuteRevalidationIssue[] = [];

  if (input.task && isTaskAlreadyExecuted(input.task)) {
    issues.push({
      kind: 'already_executed',
      message: 'This command was already executed.',
    });
    return { ok: false, issues };
  }

  if (isStaleExecutionPlan(input.plan.createdAt, input.nowMs)) {
    issues.push({
      kind: 'stale_plan',
      message:
        'This plan is stale — please run the command again so I can re-check availability before executing.',
    });
    return { ok: false, issues };
  }

  const mutationSteps = extractPlanMutationSteps(input.plan);
  issues.push(...detectIntraPlanDuplicateMutations(mutationSteps));
  if (issues.length > 0) {
    return { ok: false, issues };
  }

  for (const step of mutationSteps) {
    let issue: ExecuteRevalidationIssue | null = null;
    if (step.action === 'reschedule_booking') {
      issue = await revalidateRescheduleStep(deps, input, step);
    } else {
      issue = await revalidateCreateLikeStep(deps, input, step);
    }
    if (issue) {
      issues.push(issue);
      break;
    }
  }

  return { ok: issues.length === 0, issues };
}

export function buildSyncExecuteRevalidationGate(
  plan: AgentPlan | undefined,
  action: string,
  planBuiltAt?: Date,
  nowMs = Date.now(),
): CommandResult | null {
  if (!plan) return null;

  if (isStaleExecutionPlan(planBuiltAt ?? plan.createdAt, nowMs)) {
    return buildExecuteRevalidationRejection(action, [
      {
        kind: 'stale_plan',
        message:
          'This plan is stale — please run the command again so I can re-check availability before executing.',
      },
    ]);
  }

  const duplicateIssues = detectIntraPlanDuplicateMutations(
    extractPlanMutationSteps(plan),
  );
  if (duplicateIssues.length > 0) {
    return buildExecuteRevalidationRejection(action, duplicateIssues);
  }

  return null;
}
