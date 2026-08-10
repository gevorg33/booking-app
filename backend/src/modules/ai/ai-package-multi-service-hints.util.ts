import {
  enrichParamsWithSharedEntities,
  propagateCompoundStepParamsAcrossSteps,
} from './ai-command-entity-params.util.js';
import {
  isGiftCardCheckoutCompoundPrompt,
  isPhysicalGiftCardHandoffCompoundPrompt,
} from './ai-gift-card-payments-hints.util.js';
import {
  isMultiServiceBookingPrompt,
  isPackageBookingPrompt,
} from './ai-booking-depth.util.js';
import { extractCustomerFromBookingPrompt } from './ai-intent-heuristics.js';
import {
  promptMentionsSpecificEmployee,
  sanitizeProviderScopeFromPrompt,
} from './ai-orchestration.helpers.js';
import {
  isCheckMultiServiceBlockAvailabilityPrompt,
  isCheckPackageLineAvailabilityPrompt,
  isEarliestSlotAllServicesPrompt,
} from './ai-schedule-resources.util.js';
import {
  extractPackageNameFromPrompt,
  extractServiceNamesFromPrompt,
} from './ai-self-service-booking.util.js';

/** Dashboard staff package/multi-service actions (ai-cmd-h3.3). */
export const DASHBOARD_PACKAGE_MULTI_ACTIONS = [
  'create_package_booking',
  'create_multi_service_booking',
  'check_package_line_availability',
  'check_multi_service_block_availability',
  'earliest_slot_all_services',
] as const;

export type DashboardPackageMultiAction =
  (typeof DASHBOARD_PACKAGE_MULTI_ACTIONS)[number];

const PACKAGE_MULTI_FOLLOW_UP_SOURCES = new Set([
  'check_package_line_availability',
  'check_multi_service_block_availability',
  'earliest_slot_all_services',
]);

const PACKAGE_MULTI_SESSION_SLICE_KEYS = [
  'packageName',
  'packageId',
  'serviceNames',
  'serviceIds',
  'packageLines',
  'customerName',
  'customerId',
  'employeeName',
  'date',
  'timeSlot',
  'timeFrom',
  'lastAction',
] as const;

const COMPOUND_NEXT =
  '(?:check|book|add|show|earliest|package|multi|service|cart|availability|block|line)';

const COMPOUND_SPLIT = new RegExp(
  `\\s*;\\s*|\\s*,\\s*(?=${COMPOUND_NEXT}\\b)|\\s+and\\s+(?=${COMPOUND_NEXT}\\b)|\\s+then\\s+(?=${COMPOUND_NEXT}\\b)`,
  'i',
);

export interface DashboardPackageMultiCompoundStep {
  action: DashboardPackageMultiAction;
  params: Record<string, unknown>;
  segment: string;
}

export function isDashboardPackageMultiAction(
  action: string,
): action is DashboardPackageMultiAction {
  return (DASHBOARD_PACKAGE_MULTI_ACTIONS as readonly string[]).includes(
    action,
  );
}

export function isStaffCartBuildPrompt(prompt?: string): boolean {
  const lower = (prompt ?? '').toLowerCase();
  return (
    /\badd\b/.test(lower) &&
    /\bcart\b/.test(lower) &&
    !/\bmy\s+cart\b/.test(lower)
  );
}

export function isPackageMultiCheckoutFollowUpPrompt(prompt?: string): boolean {
  const lower = (prompt ?? '').toLowerCase();
  return (
    /\bbook\b/.test(lower) &&
    (/\bfor\b/.test(lower) ||
      /\bat\s+\d/i.test(lower) ||
      /\b\d{1,2}:\d{2}\b/.test(lower))
  );
}

export function extractStaffMultiServiceNames(prompt: string): string[] {
  const fromUtil = extractServiceNamesFromPrompt(prompt);
  if (fromUtil.length >= 2) return fromUtil;

  const bookAnd = prompt.match(
    /\bbook\s+(.+?)\s+and\s+(.+?)(?:\s+for\b|\s+on\b|\s+with\b|\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|tomorrow|today)\b|$)/i,
  );
  if (bookAnd?.[1] && bookAnd?.[2]) {
    return [bookAnd[1].trim(), bookAnd[2].trim()].filter(Boolean);
  }

  const servicesAnd = prompt.match(
    /\b([\w\s'-]+?)\s+and\s+([\w\s'-]+?)(?:\s+to\s+cart|\s+availability|\s+block|\s+for\b)/i,
  );
  if (servicesAnd?.[1] && servicesAnd?.[2]) {
    return [servicesAnd[1].trim(), servicesAnd[2].trim()].filter(Boolean);
  }

  return fromUtil;
}

export function disambiguateStaffPackageMultiBooking(
  prompt: string,
  action: string,
): { action: string; rescueReason: string } | null {
  if (
    isGiftCardCheckoutCompoundPrompt(prompt) ||
    isPhysicalGiftCardHandoffCompoundPrompt(prompt)
  ) {
    return null;
  }

  if (
    action === 'create_package_booking' ||
    action === 'create_multi_service_booking'
  ) {
    return null;
  }

  if (
    action === 'create_booking' &&
    isPackageBookingPrompt(prompt) &&
    !isMultiServiceBookingPrompt(prompt)
  ) {
    return {
      action: 'create_package_booking',
      rescueReason: 'create_booking_to_package',
    };
  }

  if (action === 'create_booking' && isMultiServiceBookingPrompt(prompt)) {
    return {
      action: 'create_multi_service_booking',
      rescueReason: 'create_booking_to_multi_service',
    };
  }

  if (isPackageBookingPrompt(prompt) && !isMultiServiceBookingPrompt(prompt)) {
    return {
      action: 'create_package_booking',
      rescueReason: 'staff_package_booking',
    };
  }

  if (isMultiServiceBookingPrompt(prompt)) {
    return {
      action: 'create_multi_service_booking',
      rescueReason: 'staff_multi_service_booking',
    };
  }

  return null;
}

export function inheritPackageMultiServiceFollowUpContext(
  params: Record<string, any>,
  session?: Record<string, any>,
  action?: string,
  prompt = '',
): void {
  if (!session) return;

  const checkoutFollowUp =
    (action === 'create_package_booking' ||
      action === 'create_multi_service_booking') &&
    (isPackageMultiCheckoutFollowUpPrompt(prompt) ||
      PACKAGE_MULTI_FOLLOW_UP_SOURCES.has(session.lastAction));

  for (const key of PACKAGE_MULTI_SESSION_SLICE_KEYS) {
    if (key === 'lastAction') continue;
    const value = params[key];
    if (
      (value == null ||
        value === '' ||
        (Array.isArray(value) && !value.length)) &&
      session[key] != null &&
      session[key] !== ''
    ) {
      params[key] = session[key];
    }
  }

  if (checkoutFollowUp && !params.customerName && session.customerName) {
    params.customerName = session.customerName;
  }
}

export function pickPackageMultiServiceSessionSlice(
  params: Record<string, unknown>,
): Record<string, unknown> {
  const slice: Record<string, unknown> = {};
  for (const key of PACKAGE_MULTI_SESSION_SLICE_KEYS) {
    const value = params[key];
    if (
      value != null &&
      value !== '' &&
      !(Array.isArray(value) && !value.length)
    ) {
      slice[key] = value;
    }
  }
  return slice;
}

export function mergePackageMultiServiceHintsIntoSessionContext(
  sessionContext: Record<string, any>,
  params: Record<string, unknown>,
  action: string,
): Record<string, any> {
  if (!isDashboardPackageMultiAction(action)) return sessionContext;
  return {
    ...sessionContext,
    ...pickPackageMultiServiceSessionSlice(params),
    lastAction: action,
  };
}

function enrichDashboardPackageMultiBaseParams(
  params: Record<string, any>,
  prompt: string,
  employees: Array<{ id: string; name: string }>,
  customers: Array<{ id: string; name: string }>,
): void {
  const packageName = extractPackageNameFromPrompt(prompt);
  if (packageName && !params.packageName) params.packageName = packageName;

  const serviceNames = extractStaffMultiServiceNames(prompt);
  if (serviceNames.length && !(params.serviceNames?.length ?? 0)) {
    params.serviceNames = serviceNames;
  }

  const employee = promptMentionsSpecificEmployee(prompt, employees);
  if (employee && !params.employeeName) {
    params.employeeName = employee.name;
    params.employeeId = employee.id;
  }

  const customer = extractCustomerFromBookingPrompt(
    prompt,
    customers,
    employees,
    params.employeeName as string | undefined,
  );
  if (customer && !params.customerName) {
    params.customerName = customer.name;
    params.customerId = customer.id;
  }
}

export function applyPackageMultiServicePromptHints(
  action: string,
  params: Record<string, any>,
  prompt: string,
  context: {
    employees: Array<{ id: string; name: string }>;
    customers?: Array<{ id: string; name: string }>;
    timeZone?: string;
    session?: Record<string, any>;
  },
): void {
  if (!isDashboardPackageMultiAction(action)) return;

  inheritPackageMultiServiceFollowUpContext(
    params,
    context.session,
    action,
    prompt,
  );
  enrichDashboardPackageMultiBaseParams(
    params,
    prompt,
    context.employees,
    context.customers ?? [],
  );
  sanitizeProviderScopeFromPrompt(prompt, params, context.employees as any);
}

export function enrichCompoundSubStepPackageMultiHints(
  action: string,
  params: Record<string, any>,
  prompt: string,
  employees: Array<{ id: string; name: string }> = [],
  customers: Array<{ id: string; name: string }> = [],
): boolean {
  if (!isDashboardPackageMultiAction(action)) return false;
  applyPackageMultiServicePromptHints(action, params, prompt, {
    employees,
    customers,
  });
  return true;
}

function isStaffMultiServiceBlockCheckPrompt(
  text: string,
  serviceNames: string[],
): boolean {
  if (
    isCheckMultiServiceBlockAvailabilityPrompt(text) ||
    (/\b(check|show|find)\b/i.test(text) &&
      /\b(block|availability)\b/i.test(text) &&
      serviceNames.length >= 2)
  ) {
    return true;
  }
  return false;
}

function classifyDashboardPackageMultiSegment(
  segment: string,
  employees: Array<{ id: string; name: string }>,
  customers: Array<{ id: string; name: string }>,
  sharedParams: Record<string, any>,
): DashboardPackageMultiCompoundStep | null {
  const text = segment.trim();
  if (!text) return null;

  const params: Record<string, any> = {
    ...sharedParams,
    ...enrichParamsWithSharedEntities({}, text),
  };
  enrichDashboardPackageMultiBaseParams(params, text, employees, customers);

  const serviceNames = (params.serviceNames as string[] | undefined) ?? [];

  if (isCheckPackageLineAvailabilityPrompt(text)) {
    return {
      action: 'check_package_line_availability',
      params,
      segment: text,
    };
  }
  if (isStaffMultiServiceBlockCheckPrompt(text, serviceNames)) {
    return {
      action: 'check_multi_service_block_availability',
      params,
      segment: text,
    };
  }
  if (isEarliestSlotAllServicesPrompt(text)) {
    return {
      action: 'earliest_slot_all_services',
      params,
      segment: text,
    };
  }
  if (isPackageBookingPrompt(text) && !isMultiServiceBookingPrompt(text)) {
    return {
      action: 'create_package_booking',
      params,
      segment: text,
    };
  }
  if (isMultiServiceBookingPrompt(text)) {
    return {
      action: 'create_multi_service_booking',
      params,
      segment: text,
    };
  }

  if (
    isPackageMultiCheckoutFollowUpPrompt(text) &&
    params.packageName &&
    !isMultiServiceBookingPrompt(text)
  ) {
    return {
      action: 'create_package_booking',
      params,
      segment: text,
    };
  }

  if (
    isPackageMultiCheckoutFollowUpPrompt(text) &&
    (params.serviceNames?.length ?? 0) >= 2
  ) {
    return {
      action: 'create_multi_service_booking',
      params,
      segment: text,
    };
  }

  return null;
}

/** Deterministic multi-command split for dashboard package/multi-service checkout. */
export function decomposeDashboardPackageMultiServiceCompoundPrompt(
  prompt: string,
  employees: Array<{ id: string; name: string }> = [],
  customers: Array<{ id: string; name: string }> = [],
): DashboardPackageMultiCompoundStep[] {
  const trimmed = prompt.trim();
  if (!trimmed) return [];

  const segments = trimmed.split(COMPOUND_SPLIT).map((s) => s.trim());
  const nonEmpty = segments.filter(Boolean);
  if (nonEmpty.length <= 1) {
    const single = classifyDashboardPackageMultiSegment(
      trimmed,
      employees,
      customers,
      {},
    );
    return single ? [single] : [];
  }

  const steps: DashboardPackageMultiCompoundStep[] = [];
  const sharedParams: Record<string, any> = {};

  for (const segment of nonEmpty) {
    if (isStaffCartBuildPrompt(segment)) {
      const cartNames = extractStaffMultiServiceNames(segment);
      sharedParams.serviceNames = [
        ...((sharedParams.serviceNames as string[] | undefined) ?? []),
        ...cartNames,
      ];
      continue;
    }
    const step = classifyDashboardPackageMultiSegment(
      segment,
      employees,
      customers,
      sharedParams,
    );
    if (step) {
      steps.push(step);
      for (const [key, value] of Object.entries(step.params)) {
        if (value != null && value !== '') {
          sharedParams[key] = value;
        }
      }
    }
  }

  if (steps.length < 2) return steps;

  const propagated = propagateCompoundStepParamsAcrossSteps(
    steps.map((s) => ({ action: s.action, params: s.params })),
  );
  return steps.map((step, index) => ({
    ...step,
    params: propagated[index]?.params ?? step.params,
  }));
}
