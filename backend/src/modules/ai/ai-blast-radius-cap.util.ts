import type { CommandResult } from './command-completion.types.js';
import type { AgentPlan } from '../../engine/agent/interfaces/agent.interfaces.js';
import { sanitizeParamsForPreview } from './ai-execution-confirm.util.js';
import {
  BLAST_RADIUS_CAPS,
} from './ai-blast-radius-cap.fixtures.js';

export {
  BLAST_RADIUS_CAPS,
  BLAST_RADIUS_EXECUTE_SCENARIOS,
  BLAST_RADIUS_PARAM_SCENARIOS,
  BLAST_RADIUS_PLAN_SCENARIOS,
} from './ai-blast-radius-cap.fixtures.js';

export interface BlastRadiusAssessment {
  bookingCount: number;
  providerCount: number;
  dateRangeDays: number;
  exceedsCap: boolean;
  capViolations: string[];
}

export interface BlastRadiusExecuteValidation {
  ok: boolean;
  summary: string;
  assessment: BlastRadiusAssessment;
  requiresConfirm: boolean;
}

function daysBetween(start?: string, end?: string): number {
  if (!start || !end) return 0;
  const startMs = Date.parse(start);
  const endMs = Date.parse(end);
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return 0;
  return Math.max(0, Math.ceil((endMs - startMs) / (24 * 60 * 60 * 1000))) + 1;
}

function buildCapViolations(assessment: {
  bookingCount: number;
  providerCount: number;
  dateRangeDays: number;
}): string[] {
  const capViolations: string[] = [];
  if (assessment.bookingCount > BLAST_RADIUS_CAPS.maxBookings) {
    capViolations.push(
      `${assessment.bookingCount} bookings (max ${BLAST_RADIUS_CAPS.maxBookings})`,
    );
  }
  if (assessment.providerCount > BLAST_RADIUS_CAPS.maxProviders) {
    capViolations.push(
      `${assessment.providerCount} providers (max ${BLAST_RADIUS_CAPS.maxProviders})`,
    );
  }
  if (assessment.dateRangeDays > BLAST_RADIUS_CAPS.maxDateRangeDays) {
    capViolations.push(
      `${assessment.dateRangeDays}-day range (max ${BLAST_RADIUS_CAPS.maxDateRangeDays})`,
    );
  }
  return capViolations;
}

function finalizeAssessment(assessment: {
  bookingCount: number;
  providerCount: number;
  dateRangeDays: number;
}): BlastRadiusAssessment {
  const capViolations = buildCapViolations(assessment);
  return {
    ...assessment,
    exceedsCap: capViolations.length > 0,
    capViolations,
  };
}

export function mergeBlastRadiusAssessments(
  ...assessments: BlastRadiusAssessment[]
): BlastRadiusAssessment {
  if (assessments.length === 0) {
    return finalizeAssessment({
      bookingCount: 0,
      providerCount: 0,
      dateRangeDays: 0,
    });
  }
  return assessments.reduce((left, right) =>
    finalizeAssessment({
      bookingCount: Math.max(left.bookingCount, right.bookingCount),
      providerCount: Math.max(left.providerCount, right.providerCount),
      dateRangeDays: Math.max(left.dateRangeDays, right.dateRangeDays),
    }),
  );
}

function mergeAssessments(
  left: BlastRadiusAssessment,
  right: BlastRadiusAssessment,
): BlastRadiusAssessment {
  return mergeBlastRadiusAssessments(left, right);
}

/** parity-3.6 — aggregate blast radius across compound/goal sub-intents + merged plan. */
export function evaluateMultiStepBlastRadius(input: {
  subIntents: readonly { action: string; params: Record<string, unknown> }[];
  mergedPlan: AgentPlan;
}): BlastRadiusAssessment {
  return mergeBlastRadiusAssessments(
    evaluateBlastRadiusFromPlan(input.mergedPlan),
    ...input.subIntents.map((sub) =>
      evaluateBlastRadiusFromParams(sub.action, sub.params),
    ),
  );
}

function trackDateRange(
  dates: string[],
  minDate: string | undefined,
  maxDate: string | undefined,
): { minDate?: string; maxDate?: string } {
  let nextMin = minDate;
  let nextMax = maxDate;
  for (const day of dates) {
    if (!day || day.length < 10) continue;
    const isoDay = day.slice(0, 10);
    nextMin = !nextMin || isoDay < nextMin ? isoDay : nextMin;
    nextMax = !nextMax || isoDay > nextMax ? isoDay : nextMax;
  }
  return { minDate: nextMin, maxDate: nextMax };
}

/** Read-only availability scope — allProviders is a query flag, not bulk mutation. */
const ALL_PROVIDERS_QUERY_SCOPE_ACTIONS = new Set([
  'check_availability',
  'check_providers_for_service',
  'recommend_specialists',
  'book_appointment',
  'book_nearest_slot',
  'earliest_slot_all_services',
  'check_multi_service_availability',
  'check_multi_service_block_availability',
  'check_package_availability',
  'check_package_line_availability',
  'providers_available_later_days',
]);

/** acc-5.7 — estimate blast radius from resolved command params. */
export function evaluateBlastRadiusFromParams(
  action: string,
  params: Record<string, unknown>,
): BlastRadiusAssessment {
  const bookingIds = Array.isArray(params.bookingIds) ? params.bookingIds : [];
  const bookingCount =
    bookingIds.length ||
    (typeof params.limit === 'number' ? params.limit : 0) ||
    (typeof params.previewBookingCount === 'number'
      ? params.previewBookingCount
      : 0) ||
    (typeof params.bookingCount === 'number' ? params.bookingCount : 0);

  const providerIds = Array.isArray(params.employeeIds) ? params.employeeIds : [];
  const providerCount =
    providerIds.length ||
    (params.allProviders === true &&
    !ALL_PROVIDERS_QUERY_SCOPE_ACTIONS.has(action)
      ? BLAST_RADIUS_CAPS.maxProviders + 1
      : 0) ||
    (Array.isArray(params.employeeNames) ? params.employeeNames.length : 0) ||
    (params.employeeName ? 1 : 0);

  const dateRangeDays = daysBetween(
    String(params.dateFrom ?? params.date ?? ''),
    String(params.dateTo ?? params.date ?? params.dateFrom ?? ''),
  );

  return finalizeAssessment({ bookingCount, providerCount, dateRangeDays });
}

/** acc-5.7 — estimate blast radius from an agent/workflow plan. */
export function evaluateBlastRadiusFromPlan(plan: AgentPlan): BlastRadiusAssessment {
  let bookingCount = 0;
  const providerIds = new Set<string>();
  let minDate: string | undefined;
  let maxDate: string | undefined;

  for (const step of plan.steps) {
    switch (step.action) {
      case 'cancel_bookings':
      case 'update_bookings':
      case 'hide_appointments_from_calendar':
      case 'unhide_appointments_from_calendar':
        if (Array.isArray(step.params.bookingIds)) {
          bookingCount += step.params.bookingIds.length;
        }
        break;
      case 'cancel_booking':
      case 'create_booking':
      case 'execute_reassignment':
      case 'reschedule_booking':
      case 'fill_slot_from_waitlist':
      case 'mark_no_shows':
        bookingCount += 1;
        break;
      default:
        break;
    }

    if (typeof step.params.employeeId === 'string') {
      providerIds.add(step.params.employeeId);
    }
    if (Array.isArray(step.params.employeeIds)) {
      for (const id of step.params.employeeIds) {
        providerIds.add(String(id));
      }
    }
    if (step.params.allProviders === true) {
      providerIds.add('__all__');
    }

    const dateKeys = ['date', 'dateFrom', 'dateTo', 'startDate', 'endDate'];
    const dates = dateKeys
      .map((key) => step.params[key])
      .filter((value): value is string => typeof value === 'string');
    if (typeof step.params.startTime === 'string') {
      dates.push(step.params.startTime.slice(0, 10));
    }
    ({ minDate, maxDate } = trackDateRange(dates, minDate, maxDate));
  }

  const providerCount =
    providerIds.has('__all__')
      ? BLAST_RADIUS_CAPS.maxProviders + 1
      : providerIds.size;

  const dateRangeDays =
    minDate && maxDate ? daysBetween(minDate, maxDate) : 0;

  return finalizeAssessment({ bookingCount, providerCount, dateRangeDays });
}

export function assessBlastRadius(input: {
  action: string;
  params: Record<string, unknown>;
  plan?: AgentPlan;
}): BlastRadiusAssessment {
  const fromParams = evaluateBlastRadiusFromParams(input.action, input.params);
  if (!input.plan) return fromParams;
  return mergeAssessments(fromParams, evaluateBlastRadiusFromPlan(input.plan));
}

/** @deprecated alias */
export const evaluateBlastRadius = evaluateBlastRadiusFromParams;

export function buildBlastRadiusConfirmResult(input: {
  prompt: string;
  action: string;
  params: Record<string, unknown>;
  assessment: BlastRadiusAssessment;
  reasoning?: string;
}): CommandResult {
  const violations = input.assessment.capViolations.join('; ');
  return {
    success: true,
    action: input.action,
    summary: `This command exceeds safe limits (${violations}). Confirm below to proceed, or narrow the scope.`,
    details: {
      needsClarification: true,
      clarify: true,
      clarifySource: 'blast_radius_cap',
      clarifyKind: 'high_risk_confirm',
      requiresExecutionConfirmation: true,
      confirmationPrompt: input.prompt,
      interpretedAction: input.action,
      previewParams: sanitizeParamsForPreview(input.params),
      blastRadius: input.assessment,
      pipelineStage: 'clarify',
      reasoning: input.reasoning,
    },
  };
}

export function buildBlastRadiusCapGateResult(input: {
  prompt: string;
  action: string;
  params: Record<string, unknown>;
  plan?: AgentPlan;
  confirmed?: boolean;
  reasoning?: string;
}): CommandResult | null {
  if (input.confirmed) return null;

  const assessment = assessBlastRadius({
    action: input.action,
    params: input.params,
    plan: input.plan,
  });
  if (!assessment.exceedsCap) return null;

  return buildBlastRadiusConfirmResult({
    prompt: input.prompt,
    action: input.action,
    params: input.params,
    assessment,
    reasoning: input.reasoning,
  });
}

export function buildBlastRadiusExecuteSummary(
  assessment: BlastRadiusAssessment,
): string {
  const violations = assessment.capViolations.join('; ');
  return `This command exceeds safe limits (${violations}). Confirm to proceed or narrow the scope before executing.`;
}

/** acc-5.7 — hard execute-time guard; explicit confirm required when over cap. */
export function validateBlastRadiusAtExecute(input: {
  action: string;
  params?: Record<string, unknown>;
  plan: AgentPlan;
  confirmed?: boolean;
}): BlastRadiusExecuteValidation {
  const assessment = assessBlastRadius({
    action: input.action,
    params: input.params ?? {},
    plan: input.plan,
  });

  if (!assessment.exceedsCap) {
    return {
      ok: true,
      summary: '',
      assessment,
      requiresConfirm: false,
    };
  }

  if (input.confirmed) {
    return {
      ok: true,
      summary: '',
      assessment,
      requiresConfirm: false,
    };
  }

  return {
    ok: false,
    summary: buildBlastRadiusExecuteSummary(assessment),
    assessment,
    requiresConfirm: true,
  };
}

export function isBlastRadiusConfirmed(
  context?: Record<string, unknown> | null,
): boolean {
  if (!context) return false;
  return context.confirmed === true || context.blastRadiusConfirmed === true;
}
