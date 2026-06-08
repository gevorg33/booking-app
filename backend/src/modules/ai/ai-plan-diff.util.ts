import type { AgentPlan } from '../../engine/agent/interfaces/agent.interfaces.js';

/** ai-d9 / acc-5.3 — shared plan diff step shape for agent plans and single mutations. */
export interface PlanDiffStep {
  id: string;
  action: string;
  description: string;
  impact: string;
  estimatedImpact?: string;
}

function looksLikeUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim(),
  );
}

function stripUuidsFromText(text: string): string {
  return text.replace(
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
    'provider',
  );
}

function readEmployeeName(params: Record<string, unknown>): string | null {
  const raw = params.employeeName;
  if (typeof raw !== 'string' || !raw.trim() || looksLikeUuid(raw)) return null;
  return raw.trim();
}

function readServiceName(params: Record<string, unknown>): string | null {
  const raw = params.serviceName;
  if (typeof raw !== 'string' || !raw.trim()) return null;
  return raw.trim();
}

function readCustomerName(params: Record<string, unknown>): string | null {
  const raw = params.customerName;
  if (typeof raw !== 'string' || !raw.trim()) return null;
  return raw.trim();
}

function readDateLabel(params: Record<string, unknown>): string | null {
  if (typeof params.date === 'string' && params.date.trim()) return params.date.trim();
  if (typeof params.dateFrom === 'string' && params.dateFrom.trim()) {
    if (typeof params.dateTo === 'string' && params.dateTo.trim()) {
      return `${params.dateFrom.trim()} – ${params.dateTo.trim()}`;
    }
    return params.dateFrom.trim();
  }
  return null;
}

function readTimeLabel(params: Record<string, unknown>): string | null {
  if (typeof params.timeSlot === 'string' && params.timeSlot.trim()) {
    return params.timeSlot.trim();
  }
  if (typeof params.startTime === 'string' && params.startTime.trim()) {
    return params.startTime.trim();
  }
  return null;
}

/** Human-readable calendar/catalog step title for a mutation or plan step. */
export function formatMutationStepDescription(
  action: string,
  params: Record<string, unknown>,
  fallbackDescription?: string,
): string {
  const employeeName = readEmployeeName(params);
  const serviceName = readServiceName(params);
  const customerName = readCustomerName(params);
  const dateLabel = readDateLabel(params);
  const timeLabel = readTimeLabel(params);

  switch (action) {
    case 'create_booking': {
      const parts = [
        serviceName ? serviceName : 'appointment',
        employeeName ? `with ${employeeName}` : null,
        customerName ? `for ${customerName}` : null,
        dateLabel ? `on ${dateLabel}` : null,
        timeLabel ? `at ${timeLabel}` : null,
      ].filter(Boolean);
      return `Book ${parts.join(' ')}`.replace(/\s+/g, ' ').trim();
    }
    case 'reschedule_booking':
      return `Reschedule booking${
        customerName ? ` for ${customerName}` : employeeName ? ` for ${employeeName}` : ''
      }${dateLabel ? ` to ${dateLabel}` : ''}${
        timeLabel ? ` at ${timeLabel}` : ''
      }`.trim();
    case 'cancel_booking':
    case 'cancel_bookings':
      return `Cancel booking${customerName ? ` for ${customerName}` : ''}${
        employeeName ? ` with ${employeeName}` : ''
      }${dateLabel ? ` on ${dateLabel}` : ''}`.trim();
    case 'update_bookings':
      return `Update booking details${employeeName ? ` for ${employeeName}` : ''}${
        dateLabel ? ` on ${dateLabel}` : ''
      }`.trim();
    case 'fill_slot_from_waitlist':
      return `Fill open slot from waitlist${serviceName ? ` (${serviceName})` : ''}${
        dateLabel ? ` on ${dateLabel}` : ''
      }`.trim();
    case 'mark_paid':
      return `Mark booking as paid${customerName ? ` for ${customerName}` : ''}`.trim();
    case 'assign_booking_resource':
      return `Assign resource to booking${serviceName ? ` (${serviceName})` : ''}`.trim();
    case 'clear_schedule':
      return `Clear schedule${employeeName ? ` for ${employeeName}` : ''}${
        dateLabel ? ` on ${dateLabel}` : ' for the day'
      }`.trim();
    case 'block_schedule':
    case 'create_block_schedule':
      return `Block calendar time${employeeName ? ` for ${employeeName}` : ''}${
        dateLabel ? ` on ${dateLabel}` : ''
      }`.trim();
    case 'apply_template':
      return `Apply schedule template${employeeName ? ` to ${employeeName}` : ''}`.trim();
    case 'fill_schedule_gaps':
      return `Fill schedule gaps${employeeName ? ` for ${employeeName}` : ''}`.trim();
    case 'assign_employee_services':
      return `Assign services to ${employeeName ?? 'provider'}`.trim();
    case 'create_service':
      return `Create catalog service "${serviceName ?? params.name ?? 'new service'}"`.trim();
    case 'deactivate_service':
      return `Deactivate service "${serviceName ?? params.name ?? 'service'}"`.trim();
    case 'hide_appointments_from_calendar':
      return `Hide appointments from calendar${dateLabel ? ` on ${dateLabel}` : ''}`.trim();
    case 'unhide_appointments_from_calendar':
      return `Restore hidden appointments${dateLabel ? ` on ${dateLabel}` : ''}`.trim();
    default:
      break;
  }

  if (employeeName) {
    switch (action) {
      case 'create_direct_schedule':
        return `Set schedule for ${employeeName}`;
      default:
        break;
    }
  }

  return stripUuidsFromText(fallbackDescription ?? action.replace(/_/g, ' '));
}

/** Calendar/catalog impact line for plan diff preview (ai-d9). */
export function describeMutationImpact(
  action: string,
  params: Record<string, unknown>,
  estimatedImpact?: string,
): string {
  switch (action) {
    case 'create_booking':
      return 'Adds one appointment to the calendar';
    case 'reschedule_booking':
      return `Moves booking to ${readTimeLabel(params) ?? readDateLabel(params) ?? 'the new time'}`;
    case 'cancel_booking':
      return 'Removes one appointment from the calendar';
    case 'cancel_bookings':
      return `Cancel ${Array.isArray(params.bookingIds) ? params.bookingIds.length : 'matched'} booking(s)`;
    case 'update_bookings':
      return 'Updates existing calendar bookings';
    case 'fill_slot_from_waitlist':
      return 'Creates a booking from the waitlist into an open slot';
    case 'mark_paid':
      return 'Updates payment status on the booking';
    case 'assign_booking_resource':
      return 'Assigns room/equipment to the booking';
    case 'apply_template':
      return 'Apply template to provider schedule';
    case 'fill_schedule_gaps':
      return `Add ${Array.isArray(params.periods) ? params.periods.length : 'new'} availability block(s)`;
    case 'hide_appointments_from_calendar':
      return `Hide ${Array.isArray(params.bookingIds) ? params.bookingIds.length : 'matched'} appointment(s) from calendar`;
    case 'unhide_appointments_from_calendar':
      return `Restore ${Array.isArray(params.bookingIds) ? params.bookingIds.length : 'matched'} hidden appointment(s) to calendar`;
    case 'create_block_schedule':
    case 'block_schedule':
      return `Create schedule block for ${params.placeholder ?? 'break'}`;
    case 'clear_schedule':
      return `Clear schedule periods and slots for ${readDateLabel(params) ?? 'the day'}`;
    case 'assign_employee_services':
      return `Update provider service catalog assignments`;
    case 'create_service':
      return 'Adds a row to the service catalog';
    case 'deactivate_service':
      return 'Marks a catalog service inactive';
    case 'execute_reassignment':
      return 'Rebook customer into freed slot';
    case 'detect_conflicts':
      return 'Scan for overlapping appointments';
    case 'find_freed_slots':
      return 'List slots freed by cancellations';
    default:
      return estimatedImpact ?? 'Updates calendar or catalog data';
  }
}

export function buildPlanDiffFromAgentPlan(
  plan: AgentPlan,
  formatDescription: (step: AgentPlan['steps'][number]) => string = (step) =>
    formatMutationStepDescription(step.action, step.params ?? {}, step.description),
): PlanDiffStep[] {
  return plan.steps.map((step) => ({
    id: step.id,
    action: step.action,
    description: formatDescription(step),
    impact: describeMutationImpact(step.action, step.params ?? {}, step.estimatedImpact),
    estimatedImpact: step.estimatedImpact,
  }));
}

export function buildMutationPreviewDiff(
  action: string,
  params: Record<string, unknown>,
  id = `${action}-preview`,
): PlanDiffStep[] {
  return [
    {
      id,
      action,
      description: formatMutationStepDescription(action, params),
      impact: describeMutationImpact(action, params),
    },
  ];
}
