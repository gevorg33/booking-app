import { buildNoNearestSlotMessage } from './ai-booking-slot-messages.util.js';
import { resolveNearestBookableSlotNotBeforeTime } from './ai-nearest-slot-resolver.util.js';
import {
  enrichBookingTimeHintsFromPrompt,
  extractCustomerFromReschedulePrompt,
  extractProviderFallbackFromPrompt,
  extractProviderPossessiveFromReschedulePrompt,
  isAnyProviderBookingPrompt,
  isFirstAvailableBookingPrompt,
  resolveRescheduleParams,
} from './ai-intent-heuristics.js';

/** Lower bound for first-available slot search (evening → 17:00, timeFrom, etc.). */
export function resolveFirstAvailableNotBeforeTime(
  params: Record<string, unknown>,
  prompt = '',
): string | null {
  return resolveNearestBookableSlotNotBeforeTime(params, prompt);
}

/** Provider fallback chains + first-available flags for create_booking. */
export function applyCreateBookingPromptHints(
  params: Record<string, any>,
  prompt: string,
  employees: Array<{ id: string; name: string }>,
): void {
  enrichBookingTimeHintsFromPrompt('create_booking', params, prompt);

  const fallback = extractProviderFallbackFromPrompt(prompt, employees);
  if (fallback.providerFallbackNames.length) {
    params.providerFallbackNames = fallback.providerFallbackNames;
  }
  if (fallback.fallbackAnyProvider) {
    params.fallbackAnyProvider = true;
  }

  if (isAnyProviderBookingPrompt(prompt)) {
    params.allProviders = true;
    params.employeeName = null;
    delete params.employeeId;
  }
  if (isFirstAvailableBookingPrompt(prompt)) {
    params.bookingFirstAvailable = true;
    delete params.timeSlot;
  }
}

/** Possessive provider vs customer + nearest-free-time for reschedule_booking. */
export function applyRescheduleBookingPromptHints(
  params: Record<string, any>,
  prompt: string,
  employees: Array<{ id: string; name: string }>,
  customers: Array<{ id: string; name: string }>,
  timeZone = 'UTC',
): void {
  resolveRescheduleParams(params, prompt, timeZone);
  enrichBookingTimeHintsFromPrompt('reschedule_booking', params, prompt);

  // e2e-bug.248 — first-available / nearest free time on reschedule must set the flag
  // even when possessive provider early-return would otherwise skip later enrichment.
  if (isFirstAvailableBookingPrompt(prompt)) {
    params.bookingFirstAvailable = true;
    delete params.timeSlot;
  }

  const providerPossessive = extractProviderPossessiveFromReschedulePrompt(
    prompt,
    employees,
  );
  if (providerPossessive) {
    params.employeeName = providerPossessive.name;
    params.employeeId = providerPossessive.id;
    params.customerName = null;
    delete params.customerId;
    return;
  }

  const rescheduleCustomer = extractCustomerFromReschedulePrompt(
    prompt,
    customers,
    employees,
  );
  if (rescheduleCustomer) {
    params.customerName = rescheduleCustomer.name;
    params.customerId = rescheduleCustomer.id;
  }
}

export function applyBookingRescheduleActionHints(
  action: string,
  params: Record<string, any>,
  prompt: string,
  context: {
    employees: Array<{ id: string; name: string }>;
    customers?: Array<{ id: string; name: string }>;
    timeZone?: string;
  },
): void {
  if (action === 'create_booking') {
    applyCreateBookingPromptHints(params, prompt, context.employees);
    return;
  }
  if (action === 'reschedule_booking') {
    applyRescheduleBookingPromptHints(
      params,
      prompt,
      context.employees,
      context.customers ?? [],
      context.timeZone ?? 'UTC',
    );
  }
}

export function buildRescheduleFirstAvailableNoSlotMessage(
  serviceName: string,
  providerName: string,
  params: Record<string, unknown>,
  prompt: string,
): string {
  const base = buildNoNearestSlotMessage({
    serviceName,
    dateKey: params.date as string | undefined,
    timeOfDay: params.timeOfDay as string | undefined,
    notBeforeTime: resolveFirstAvailableNotBeforeTime(params, prompt),
  });
  return base.replace(
    /^No bookable slot for/,
    `No open slot for ${providerName} —`,
  );
}
