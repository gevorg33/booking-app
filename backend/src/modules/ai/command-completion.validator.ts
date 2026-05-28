import { ValidationIssue, ValidationResult, ResolvedCommand } from './command-completion.types.js';
import { getRequestedEmployeeNames } from './ai-orchestration.helpers.js';

type Rule = (cmd: ResolvedCommand) => ValidationIssue[];

const needs = (
  field: string,
  label: string,
  present: boolean,
  example: string,
): ValidationIssue | null =>
  present ? null : { field, label, message: `${label} is required`, example };

const ACTION_RULES: Record<string, Rule> = {
  create_booking: (cmd) =>
    [
      needs('employeeName', 'Service provider', !!(cmd.entities.employee || cmd.enrichedParams.employeeId), 'Gevorg Gasparyan'),
      needs('serviceName', 'Service', !!(cmd.entities.service || cmd.enrichedParams.serviceId), 'facemassage'),
      needs('date', 'Date', !!cmd.params.date, '29/05/2026 or tomorrow'),
      needs('timeSlot', 'Start time', !!cmd.params.timeSlot, '09:00'),
    ].filter(Boolean) as ValidationIssue[],

  create_service: (cmd) =>
    [
      needs('serviceName', 'Service name', !!cmd.params.serviceName, 'facemassage'),
      needs('durationMinutes', 'Duration (minutes)', !!cmd.params.durationMinutes, '60'),
      needs('price', 'Price', cmd.params.price != null, '50'),
    ].filter(Boolean) as ValidationIssue[],

  create_services: (cmd) => {
    const list = cmd.params.services;
    if (!Array.isArray(list) || list.length === 0) {
      return [{
        field: 'services',
        label: 'Services list',
        message: 'Provide at least one service with name, duration, and price',
        example: 'Add services: facemassage 60min $50, haircut 30min $25',
      }];
    }
    return [];
  },

  cancel_bookings: (cmd) => {
    const hasFilter =
      !!cmd.params.date ||
      !!cmd.params.dateFrom ||
      !!cmd.params.employeeName ||
      cmd.params.allProviders ||
      (cmd.params.serviceNames?.length ?? 0) > 0 ||
      !!cmd.params.serviceName;
    return hasFilter
      ? []
      : [{
          field: 'date',
          label: 'Filter',
          message: 'Specify which bookings to cancel (date, provider, and/or service)',
          example: 'Cancel all facemassage appointments for Gevorg tomorrow',
        }];
  },

  bulk_smart_cancel: (cmd) => ACTION_RULES.cancel_bookings!(cmd),

  fill_slot_from_waitlist: (cmd) => {
    const hasWhen = !!cmd.params.date || !!cmd.params.timeSlot;
    return hasWhen
      ? []
      : [{
          field: 'timeSlot',
          label: 'Slot time',
          message: 'Specify which cancelled slot to fill (date and time)',
          example: 'Fill cancelled 14:00 slot tomorrow from waitlist',
        }];
  },

  reschedule_booking: (cmd) => {
    const hasTarget =
      !!cmd.params.bookingId ||
      !!cmd.params.customerName ||
      (!!cmd.params.employeeName && (!!cmd.params.date || !!cmd.params.timeSlot));
    const hasNewTime = !!cmd.params.date || !!cmd.params.timeSlot;
    const hasServiceChange = !!(cmd.entities.service || cmd.enrichedParams.serviceId);
    return [
      ...(hasTarget
        ? []
        : [{
            field: 'bookingId',
            label: 'Booking',
            message: 'Specify which appointment to update (customer, or provider + date/time, or booking ID)',
            example: 'Change Maria\'s 14:00 appointment to hot stone massage',
          }]),
      ...(hasNewTime || hasServiceChange
        ? []
        : [{
            field: 'timeSlot',
            label: 'New time or service',
            message: 'Specify a new service type and/or a new date/time',
            example: 'Change service to facemassage or move to 16:00',
          }]),
    ];
  },

  check_availability: (cmd) =>
    [
      needs('date', 'Date', !!cmd.params.date, 'tomorrow or 29/05/2026'),
    ].filter(Boolean) as ValidationIssue[],

  show_appointments: (cmd) =>
    [
      needs('date', 'Date', !!cmd.params.date, 'tomorrow or 29/05/2026'),
    ].filter(Boolean) as ValidationIssue[],

  list_bookings: (cmd) =>
    [
      needs('date', 'Date', !!cmd.params.date, 'tomorrow or 29/05/2026'),
    ].filter(Boolean) as ValidationIssue[],

  summarize_day: (cmd) =>
    [
      needs('date', 'Date', !!cmd.params.date, 'today or 29/05/2026'),
    ].filter(Boolean) as ValidationIssue[],

  fill_unused_slots: (cmd) => {
    const hasProviders =
      cmd.params.allProviders ||
      !!cmd.params.employeeName ||
      (cmd.params.employeeNames?.length ?? 0) > 0 ||
      cmd.entities.employees.length > 0;
    const hasWhen =
      !!cmd.params.date ||
      !!cmd.params.dateFrom ||
      !!cmd.entities.dateRange;
    return [
      ...(hasProviders
        ? []
        : [{
            field: 'employeeName',
            label: 'Service provider',
            message: 'Specify provider(s) or say "all providers"',
            example: 'Fill gaps for Gevorg between 9-19',
          }]),
      ...(hasWhen
        ? []
        : [{
            field: 'date',
            label: 'Date or range',
            message: 'Specify when to fill gaps',
            example: 'this week or 29/05/2026',
          }]),
    ];
  },

  list_schedule_gaps: (cmd) => {
    const hasProviders =
      cmd.params.allProviders ||
      !!cmd.params.employeeName ||
      (cmd.params.employeeNames?.length ?? 0) > 0 ||
      cmd.entities.employees.length > 0;
    const hasWhen =
      !!cmd.params.date ||
      !!cmd.params.dateFrom ||
      !!cmd.entities.dateRange;
    return [
      ...(hasProviders
        ? []
        : [{
            field: 'employeeName',
            label: 'Service provider',
            message: 'Specify who to list gaps for',
            example: 'Which days does Gevorg have gaps this week?',
          }]),
      ...(hasWhen
        ? []
        : [{
            field: 'dateFrom',
            label: 'Date range',
            message: 'Specify which week or date range to check',
            example: 'this week or 28/05/2026 to 03/06/2026',
          }]),
    ];
  },

  apply_schedule: (cmd) => {
    const hasProviders =
      cmd.params.allProviders ||
      !!cmd.params.employeeName ||
      cmd.entities.employees.length > 0;
    const hasWhen = !!cmd.params.dateFrom || !!cmd.params.date || !!cmd.entities.dateRange;
    return [
      ...(hasProviders
        ? []
        : [{
            field: 'employeeName',
            label: 'Service provider',
            message: 'Specify who to apply the template to',
            example: 'Apply weekday template to Gevorg this week',
          }]),
      ...(hasWhen
        ? []
        : [{
            field: 'dateFrom',
            label: 'Date range',
            message: 'Specify when to apply the schedule',
            example: 'this week or 01/06/2026 to 07/06/2026',
          }]),
      ...(cmd.entities.template || cmd.params.templateName
        ? []
        : [{
            field: 'templateName',
            label: 'Schedule template',
            message: 'No schedule template found — create one in Schedule → Templates first',
          }]),
    ];
  },

  block_schedule: (cmd) => {
    const hasProviders =
      cmd.params.allProviders ||
      !!cmd.params.employeeName ||
      cmd.entities.employees.length > 0;
    const hasWhen =
      !!cmd.params.date ||
      !!cmd.params.dateFrom ||
      !!cmd.entities.dateRange ||
      cmd.params.blockFullDay;
    return [
      ...(hasProviders
        ? []
        : [{
            field: 'employeeName',
            label: 'Service provider',
            message: 'Specify who to block time for',
            example: 'Block lunch 12-13 for all providers Mon-Fri',
          }]),
      ...(hasWhen
        ? []
        : [{
            field: 'date',
            label: 'When to block',
            message: 'Specify date or range to block',
            example: 'May 30 or this week Mon-Fri',
          }]),
    ];
  },

  create_direct_schedule: (cmd) =>
    [
      needs('employeeName', 'Service provider', !!cmd.entities.employee, 'Gevorg Gasparyan'),
      needs('date', 'Date', !!cmd.params.date, 'Friday or 29/05/2026'),
      ...(Array.isArray(cmd.params.periods) && cmd.params.periods.length > 0
        ? []
        : [{
            field: 'periods',
            label: 'Schedule periods',
            message: 'Describe the periods for the day',
            example: '9-12 facemassage, 12-13 lunch, 13-17 haircut',
          }]),
    ].filter(Boolean) as ValidationIssue[],

  assign_employee_services: (cmd) =>
    [
      needs('employeeName', 'Service provider', !!cmd.entities.employee, 'Gevorg Gasparyan'),
      ...(cmd.entities.services.length > 0 || cmd.params.serviceName
        ? []
        : [{
            field: 'serviceName',
            label: 'Service(s)',
            message: 'Specify which service(s) to assign',
            example: 'Assign facemassage and haircut to Gevorg',
          }]),
    ].filter(Boolean) as ValidationIssue[],
};

/** Entity resolution failures become clarify prompts */
export function validateEntityResolution(cmd: ResolvedCommand): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { params, entities } = cmd;

  const requestedNames = getRequestedEmployeeNames(params);

  if (requestedNames.length > 1 && entities.employees.length < requestedNames.length) {
    const unmatched = requestedNames.filter(
      (name) =>
        !entities.employees.some(
          (e) =>
            e.name.toLowerCase().includes(name.toLowerCase()) ||
            name.toLowerCase().includes(e.name.toLowerCase()) ||
            e.name.toLowerCase().split(/\s+/).some((part) => part === name.toLowerCase()),
        ),
    );
    issues.push({
      field: 'employeeName',
      label: 'Service providers',
      message:
        entities.employees.length === 0
          ? `Could not find providers: ${requestedNames.join(', ')}`
          : `Found ${entities.employees.map((e) => e.name).join(', ')} but could not match: ${unmatched.join(', ') || requestedNames.join(', ')}`,
      example: `Available: ${cmd.enrichedParams._availableEmployees ?? 'check team list'}`,
    });
  } else if (params.employeeName && !params.allProviders && entities.employees.length === 0) {
    issues.push({
      field: 'employeeName',
      label: 'Service provider',
      message: `Could not find "${params.employeeName}"`,
      example: `Available: ${cmd.enrichedParams._availableEmployees ?? 'check team list'}`,
    });
  }

  if (params.serviceName && !entities.service && cmd.action === 'create_booking') {
    issues.push({
      field: 'serviceName',
      label: 'Service',
      message: `Could not find service "${params.serviceName}"`,
      example: `Available: ${cmd.enrichedParams._availableServices ?? 'check catalog'}`,
    });
  }

  if (params.customerName && !entities.customer && cmd.action === 'create_booking') {
    issues.push({
      field: 'customerName',
      label: 'Customer',
      message: `Could not find customer "${params.customerName}"`,
      example: 'Omit customer for walk-in, or add them in Customers first',
    });
  }

  if (params.templateName && !entities.template && ['apply_schedule', 'setup_week_schedule'].includes(cmd.action)) {
    issues.push({
      field: 'templateName',
      label: 'Template',
      message: `Could not find template "${params.templateName}"`,
    });
  }

  return issues;
}

export function validateCommand(cmd: ResolvedCommand): ValidationResult {
  const rule = ACTION_RULES[cmd.action];
  const fieldIssues = rule ? rule(cmd) : [];
  const entityIssues = validateEntityResolution(cmd);
  const issues = [...fieldIssues, ...entityIssues];

  return { ok: issues.length === 0, issues };
}

const VALIDATED_ACTIONS = new Set([
  'create_booking',
  'create_service',
  'create_services',
  'cancel_bookings',
  'bulk_smart_cancel',
  'fill_slot_from_waitlist',
  'reschedule_booking',
  'check_availability',
  'show_appointments',
  'list_bookings',
  'summarize_day',
  'fill_unused_slots',
  'apply_schedule',
  'block_schedule',
  'create_direct_schedule',
  'assign_employee_services',
  'list_schedule_gaps',
]);

export function shouldValidateAction(action: string): boolean {
  return VALIDATED_ACTIONS.has(action);
}

export function buildClarifySummary(issues: ValidationIssue[]): string {
  if (issues.length === 1) {
    const i = issues[0];
    return `I need one more detail: ${i.message}.${i.example ? ` Example: "${i.example}"` : ''}`;
  }
  const lines = ['I need a few more details before I can run this:'];
  for (const i of issues) {
    lines.push(`• ${i.label}: ${i.message}`);
  }
  return lines.join('\n');
}
