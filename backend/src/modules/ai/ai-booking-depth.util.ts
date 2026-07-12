import { normalizeTime24 } from '../../common/utils/time-format.util.js';
import {
  BookingStatus,
  PaymentStatus,
} from '../booking/entities/booking.entity.js';
import {
  extractSingleDateFromPrompt,
  extractSingleIsoDayFromPrompt,
  fuzzyMatchByName,
} from './ai-orchestration.helpers.js';
import {
  extractTimeSlotFromPrompt,
  matchEntityInPrompt,
} from './ai-structural-extractors.js';
import { extractBookingIdFromPrompt } from './ai-provider-booking.util.js';
import {
  evaluateCustomerBookingPolicy,
  resolveCustomerSelfServiceSettings,
  resolvePublicPaymentSettings,
  type CustomerSelfServiceSettings,
} from '../../common/utils/customer-self-service.util.js';
import { isPackageVisitBooking } from '../public-booking/public-customer-package-visit.util.js';

export const BOOKING_DEPTH_CREATE_INTENTS = [
  'create_booking_subscription_credit',
  'create_booking_cash',
  'create_package_booking',
  'create_multi_service_booking',
] as const;

export const BOOKING_DEPTH_MUTATE_INTENTS = [
  ...BOOKING_DEPTH_CREATE_INTENTS,
  'cancel_package_visit',
  'cancel_multi_service_group',
  'reschedule_package_visit',
  'reschedule_multi_service_group',
  'mark_paid',
  'assign_booking_resource',
] as const;

export const BOOKING_DEPTH_READ_INTENTS = [
  'list_cash_pending_bookings',
  'list_package_bookings',
  'list_multi_service_bookings',
  'explain_booking_policy',
] as const;

export const BOOKING_DEPTH_INTENTS = [
  ...BOOKING_DEPTH_MUTATE_INTENTS,
  ...BOOKING_DEPTH_READ_INTENTS,
] as const;

export type BookingDepthIntent = (typeof BOOKING_DEPTH_INTENTS)[number];

export function isBookingDepthIntent(
  action: string,
): action is BookingDepthIntent {
  return (BOOKING_DEPTH_INTENTS as readonly string[]).includes(action);
}

export function isSubscriptionCreditBookingPrompt(prompt: string): boolean {
  return (
    /\b(subscription|plan)\s+(credit|visit|appointment)/i.test(prompt) ||
    /\busing\s+(her|his|their|a)\s+subscription/i.test(prompt) ||
    /\bwith\s+subscription\s+credit/i.test(prompt)
  );
}

export function isCashBookingPrompt(prompt: string): boolean {
  return (
    /\bpay\s+(at\s+)?(the\s+)?(venue|salon|shop|location)\b/i.test(prompt) ||
    /\bcash\s+(at\s+)?(visit|venue|appointment)\b/i.test(prompt) ||
    /\bpay\s+in\s+cash\b/i.test(prompt) ||
    (/\bwalk[\s-]?in\b/i.test(prompt) && /\bcash\b/i.test(prompt))
  );
}

export function isPackageBookingPrompt(prompt: string): boolean {
  return (
    /\bbook\s+(the\s+)?\w*\s*package\b/i.test(prompt) ||
    /\bpackage\s+(booking|visit|appointment)/i.test(prompt) ||
    /\bspa\s+day\b/i.test(prompt)
  );
}

export function isMultiServiceBookingPrompt(prompt: string): boolean {
  return (
    /\bmulti[\s-]?service\b/i.test(prompt) ||
    (/\bbook\b/i.test(prompt) &&
      /\band\b/i.test(prompt) &&
      /\b(haircut|trim|beard|massage|facial|service)/i.test(prompt) &&
      !isPackageBookingPrompt(prompt))
  );
}

export function isCancelPackageVisitPrompt(prompt: string): boolean {
  return /\bcancel\b/i.test(prompt) && /\bpackage\s+visit\b/i.test(prompt);
}

export function isCancelMultiServiceGroupPrompt(prompt: string): boolean {
  return /\bcancel\b/i.test(prompt) && /\bmulti[\s-]?service\b/i.test(prompt);
}

export function isReschedulePackageVisitPrompt(prompt: string): boolean {
  return (
    /\b(reschedule|move|shift)\b/i.test(prompt) &&
    /\bpackage\s+visit\b/i.test(prompt)
  );
}

export function isRescheduleMultiServiceGroupPrompt(prompt: string): boolean {
  return (
    /\b(reschedule|move|shift)\b/i.test(prompt) &&
    /\bmulti[\s-]?service\b/i.test(prompt)
  );
}

export function isListCashPendingPrompt(prompt: string): boolean {
  if (/\b(book|schedule|create)\b/i.test(prompt)) return false;
  return (
    (/\b(list|show)\b/i.test(prompt) &&
      /\b(pay[\s-]?at[\s-]?venue|cash\s+pending|unpaid\s+cash)\b/i.test(
        prompt,
      )) ||
    (/\bcash\b/i.test(prompt) &&
      /\b(list|show)\b/i.test(prompt) &&
      /\bpending\b/i.test(prompt))
  );
}

export function isListPackageBookingsPrompt(prompt: string): boolean {
  return (
    /\bpackage\s+(visits?|bookings?|appointments?)\b/i.test(prompt) &&
    /\b(list|show)\b/i.test(prompt)
  );
}

export function isListMultiServiceBookingsPrompt(prompt: string): boolean {
  return (
    /\bmulti[\s-]?service\b/i.test(prompt) &&
    /\b(list|show|groups?)\b/i.test(prompt)
  );
}

export function isMarkPaidPrompt(prompt: string): boolean {
  if (/\bmark\b/i.test(prompt) && /\b(paid|payment)\b/i.test(prompt)) {
    return true;
  }
  if (
    /\b(make|set)\b/i.test(prompt) &&
    /\b(done|complete|completed|finished)\b/i.test(prompt) &&
    /\bpaid\b/i.test(prompt)
  ) {
    return true;
  }
  if (
    /\b(done|complete|completed|finished)\b/i.test(prompt) &&
    /\bpaid\b/i.test(prompt)
  ) {
    return true;
  }
  if (/\bin[\s-]?progress\b/i.test(prompt)) return false;
  return (
    /\bmark\b/i.test(prompt) &&
    /\b(done|complete|completed|finished)\b/i.test(prompt)
  );
}

const POSSESSIVE_APPOINTMENT_RE =
  /(?:\b(?:mark|make|set)\s+)?(?:(provider|stylist|staff|employee|customer|client)\s+)?([A-Za-z][\p{L}'-]+(?:\s+[A-Za-z][\p{L}'-]+)*)'s\s+appointment\b/iu;

/** Provider or customer possessive before "appointment" — e.g. "Karo Mazmanyan's appointment". */
export function extractPossessiveAppointmentOwner(
  prompt: string,
): { name: string; role?: 'provider' | 'customer' } | null {
  const normalized = prompt.replace(/[\u2018\u2019]/g, "'");
  const possessiveAppt = normalized.match(POSSESSIVE_APPOINTMENT_RE);
  if (!possessiveAppt?.[2]) return null;
  const roleWord = possessiveAppt[1]?.toLowerCase();
  const role =
    roleWord === 'customer' || roleWord === 'client'
      ? 'customer'
      : roleWord
        ? 'provider'
        : undefined;
  return { name: possessiveAppt[2].trim(), role };
}

export function extractPossessiveAppointmentOwnerName(
  prompt: string,
): string | null {
  return extractPossessiveAppointmentOwner(prompt)?.name ?? null;
}

/** @deprecated use extractPossessiveAppointmentOwnerName */
export function extractMarkPaidEmployeeNameFromPrompt(
  prompt: string,
): string | null {
  return extractPossessiveAppointmentOwnerName(prompt);
}

/** Appointment start time from "on … from 9:50" or generic clock phrases. */
export function extractMarkPaidTimeSlotFromPrompt(
  prompt: string,
): string | null {
  const onFrom = prompt.match(
    /\bon\s+[\s\S]+?\bfrom\s+(\d{1,2})(?::(\d{2}))?\b/i,
  );
  if (onFrom) {
    return normalizeTime24(`${onFrom[1]}:${onFrom[2] ?? '00'}`);
  }
  return extractTimeSlotFromPrompt(prompt);
}

function applyPossessiveOwnerToMarkPaidParams(
  enriched: Record<string, unknown>,
  owner: { name: string; role?: 'provider' | 'customer' },
  roster: {
    employees: Array<{ name: string }>;
    customers: Array<{ name: string }>;
  },
): void {
  const employeeMatch = roster.employees.length
    ? fuzzyMatchByName(roster.employees, owner.name)
    : undefined;
  const customerMatch = roster.customers.length
    ? fuzzyMatchByName(roster.customers, owner.name)
    : undefined;

  if (owner.role === 'customer') {
    if (customerMatch) {
      enriched.customerName = customerMatch.name;
      delete enriched.employeeName;
    }
    return;
  }
  if (owner.role === 'provider') {
    if (employeeMatch) {
      enriched.employeeName = employeeMatch.name;
      delete enriched.customerName;
    }
    return;
  }

  if (employeeMatch && !customerMatch) {
    enriched.employeeName = employeeMatch.name;
    delete enriched.customerName;
  } else if (customerMatch && !employeeMatch) {
    enriched.customerName = customerMatch.name;
    delete enriched.employeeName;
  } else if (employeeMatch && customerMatch) {
    enriched.employeeName = employeeMatch.name;
    delete enriched.customerName;
  }
}

function enrichMarkPaidPartyFromRoster(
  prompt: string,
  enriched: Record<string, unknown>,
  roster: {
    employees: Array<{ name: string }>;
    customers: Array<{ name: string }>;
  },
): void {
  if (enriched.employeeName && enriched.customerName) return;

  const explicitCustomer = /\b(?:customer|client)\b/i.test(prompt);
  const explicitProvider = /\b(?:provider|stylist|staff|employee)\b/i.test(
    prompt,
  );
  const employeeHit = roster.employees.length
    ? matchEntityInPrompt(prompt, roster.employees)
    : undefined;
  const customerHit = roster.customers.length
    ? matchEntityInPrompt(prompt, roster.customers)
    : undefined;

  if (explicitCustomer && customerHit) {
    enriched.customerName = customerHit.name;
    delete enriched.employeeName;
    return;
  }
  if (explicitProvider && employeeHit) {
    enriched.employeeName = employeeHit.name;
    delete enriched.customerName;
    return;
  }

  if (!enriched.employeeName && !enriched.customerName) {
    if (employeeHit && !customerHit) {
      enriched.employeeName = employeeHit.name;
    } else if (customerHit && !employeeHit) {
      enriched.customerName = customerHit.name;
    } else if (employeeHit && customerHit) {
      enriched.employeeName = employeeHit.name;
    }
  } else if (!enriched.employeeName && employeeHit) {
    enriched.employeeName = employeeHit.name;
  } else if (!enriched.customerName && customerHit) {
    enriched.customerName = customerHit.name;
  }
}

/** When the bookings calendar is open, anchor mark_paid to the visible day. */
export function applyMarkPaidCalendarDateAnchor(
  params: Record<string, unknown>,
  session?: { route?: string; date?: string },
): void {
  const sessionDate = session?.date;
  if (
    session?.route === '/dashboard/bookings' &&
    typeof sessionDate === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(sessionDate)
  ) {
    params.date = sessionDate;
  }
}

export function enrichMarkPaidParamsFromPrompt(
  prompt: string,
  params: Record<string, unknown>,
  timeZone = 'UTC',
  roster?: {
    employees?: Array<{ name: string }>;
    customers?: Array<{ name: string }>;
    sessionDate?: string;
    calendarRoute?: string;
  },
): Record<string, unknown> {
  const enriched: Record<string, unknown> = { ...params };
  const normalizedPrompt = prompt.replace(/[\u2018\u2019]/g, "'");
  const employees = roster?.employees ?? [];
  const customers = roster?.customers ?? [];

  const bookingId =
    enriched.bookingId ?? extractBookingIdFromPrompt(normalizedPrompt.trim());
  if (bookingId) enriched.bookingId = bookingId;

  const possessiveOwner = extractPossessiveAppointmentOwner(normalizedPrompt);
  let possessiveResolved = false;
  if (possessiveOwner) {
    applyPossessiveOwnerToMarkPaidParams(enriched, possessiveOwner, {
      employees,
      customers,
    });
    possessiveResolved =
      enriched.employeeName != null || enriched.customerName != null;
  }

  if (!possessiveResolved) {
    enrichMarkPaidPartyFromRoster(normalizedPrompt, enriched, {
      employees,
      customers,
    });
  }

  if (!enriched.date && !enriched.fromDate) {
    const onDate =
      normalizedPrompt.match(/\bon\s+(.+?)(?:\s+from\s+|\s+at\s+|$)/i) ??
      normalizedPrompt.match(/\b(?:for|on)\s+(\d{1,2}\s+\w+(?:\s+\d{4})?)\b/i);
    const dateText = onDate?.[1]?.trim();
    const extracted = dateText
      ? extractSingleDateFromPrompt(dateText, timeZone)
      : extractSingleDateFromPrompt(normalizedPrompt, timeZone);
    if (extracted) enriched.date = extracted;
  }

  if (!enriched.timeSlot) {
    const slot = extractMarkPaidTimeSlotFromPrompt(normalizedPrompt);
    if (slot) enriched.timeSlot = slot;
  }

  applyMarkPaidCalendarDateAnchor(enriched, {
    route: roster?.calendarRoute,
    date: roster?.sessionDate,
  });

  if (
    typeof enriched.date === 'string' &&
    enriched.date &&
    !/^\d{4}-\d{2}-\d{2}$/.test(enriched.date)
  ) {
    const iso =
      extractSingleIsoDayFromPrompt(enriched.date, timeZone) ??
      extractSingleIsoDayFromPrompt(normalizedPrompt, timeZone);
    if (iso) enriched.date = iso;
  }

  enriched._timeZone = enriched._timeZone ?? timeZone;
  return enriched;
}

export function isAssignBookingResourcePrompt(prompt: string): boolean {
  return (
    /\bassign\b/i.test(prompt) && /\b(room|chair|resource)\b/i.test(prompt)
  );
}

export function isExplainBookingPolicyPrompt(prompt: string): boolean {
  return (
    /\b(can\s+(this\s+)?customer|still)\s+(cancel|reschedule)\b/i.test(
      prompt,
    ) ||
    /\b(cancel|reschedule)\s+policy\b/i.test(prompt) ||
    /\bbooking\s+policy\b/i.test(prompt)
  );
}

/** NL rescue when classifier returns unknown or a nearby action. */
export function rescueBookingDepthIntent(
  prompt: string,
  action: string,
): { action: BookingDepthIntent; rescueReason: string } | null {
  if (isExplainBookingPolicyPrompt(prompt)) {
    return {
      action: 'explain_booking_policy',
      rescueReason: 'policy_question',
    };
  }
  if (isListCashPendingPrompt(prompt)) {
    return {
      action: 'list_cash_pending_bookings',
      rescueReason: 'cash_pending_list',
    };
  }
  if (isListPackageBookingsPrompt(prompt)) {
    return { action: 'list_package_bookings', rescueReason: 'package_list' };
  }
  if (isListMultiServiceBookingsPrompt(prompt)) {
    return {
      action: 'list_multi_service_bookings',
      rescueReason: 'multi_service_list',
    };
  }
  if (isCancelPackageVisitPrompt(prompt)) {
    return {
      action: 'cancel_package_visit',
      rescueReason: 'cancel_package_visit',
    };
  }
  if (isCancelMultiServiceGroupPrompt(prompt)) {
    return {
      action: 'cancel_multi_service_group',
      rescueReason: 'cancel_multi_service_group',
    };
  }
  if (isReschedulePackageVisitPrompt(prompt)) {
    return {
      action: 'reschedule_package_visit',
      rescueReason: 'reschedule_package_visit',
    };
  }
  if (isRescheduleMultiServiceGroupPrompt(prompt)) {
    return {
      action: 'reschedule_multi_service_group',
      rescueReason: 'reschedule_multi_service_group',
    };
  }
  if (
    isMarkPaidPrompt(prompt) &&
    action !== 'payment_sweep' &&
    !/\b(sweep|all\s+unpaid|everyone|payment\s+sweep)\b/i.test(prompt) &&
    (action !== 'update_bookings' || /\bappointment\b/i.test(prompt))
  ) {
    return { action: 'mark_paid', rescueReason: 'mark_paid' };
  }
  if (isAssignBookingResourcePrompt(prompt)) {
    return {
      action: 'assign_booking_resource',
      rescueReason: 'assign_resource',
    };
  }
  if (isPackageBookingPrompt(prompt) && action !== 'create_booking') {
    return {
      action: 'create_package_booking',
      rescueReason: 'package_booking',
    };
  }
  if (isMultiServiceBookingPrompt(prompt) && action !== 'create_booking') {
    return {
      action: 'create_multi_service_booking',
      rescueReason: 'multi_service_booking',
    };
  }
  if (
    isSubscriptionCreditBookingPrompt(prompt) &&
    action === 'create_booking'
  ) {
    return {
      action: 'create_booking_subscription_credit',
      rescueReason: 'subscription_credit',
    };
  }
  if (isCashBookingPrompt(prompt) && action === 'create_booking') {
    return { action: 'create_booking_cash', rescueReason: 'cash_booking' };
  }
  if (action === 'unknown') {
    if (isSubscriptionCreditBookingPrompt(prompt)) {
      return {
        action: 'create_booking_subscription_credit',
        rescueReason: 'subscription_credit_unknown',
      };
    }
    if (isCashBookingPrompt(prompt)) {
      return {
        action: 'create_booking_cash',
        rescueReason: 'cash_booking_unknown',
      };
    }
  }
  return null;
}

export function enrichCashBookingParams(
  params: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...params,
    _paymentStatus: PaymentStatus.NOT_APPLICABLE,
    _bookingMetadata: {
      payAtVenue: true,
      paymentMethod: 'cash',
      source: 'ai_dashboard_cash',
      ...(typeof params._bookingMetadata === 'object' && params._bookingMetadata
        ? params._bookingMetadata
        : {}),
    },
  };
}

export function enrichSubscriptionCreditParams(
  params: Record<string, unknown>,
  subscriptionId: string,
): Record<string, unknown> {
  return {
    ...params,
    useSubscriptionId: subscriptionId,
    _paymentStatus: PaymentStatus.NOT_APPLICABLE,
    _bookingMetadata: {
      subscriptionCreditUsed: true,
      source: 'ai_dashboard_subscription',
      ...(typeof params._bookingMetadata === 'object' && params._bookingMetadata
        ? params._bookingMetadata
        : {}),
    },
  };
}

export function isCashPendingBooking(booking: {
  paymentStatus: PaymentStatus | string;
  metadata?: Record<string, unknown> | null;
  status: BookingStatus | string;
}): boolean {
  if (booking.status === BookingStatus.CANCELLED) return false;
  const meta = booking.metadata ?? {};
  const payAtVenue = meta.payAtVenue === true || meta.paymentMethod === 'cash';
  if (!payAtVenue) return false;
  return (
    booking.paymentStatus === PaymentStatus.PENDING ||
    booking.paymentStatus === PaymentStatus.NOT_APPLICABLE
  );
}

export function filterCashPendingBookings<
  T extends Parameters<typeof isCashPendingBooking>[0],
>(bookings: T[]): T[] {
  return bookings.filter(isCashPendingBooking);
}

export function filterPackageBookings<
  T extends { packagePurchaseId?: string | null },
>(bookings: T[]): T[] {
  return bookings.filter((b) => Boolean(b.packagePurchaseId));
}

export function filterMultiServiceBookings<
  T extends { multiServiceGroupId?: string | null },
>(bookings: T[]): T[] {
  return bookings.filter((b) => Boolean(b.multiServiceGroupId));
}

export interface BookingPolicyExplanation {
  bookingId: string;
  customerName: string | null;
  serviceName: string | null;
  startTime: string;
  isPackageVisit: boolean;
  isMultiServiceGroup: boolean;
  canCancelOnline: boolean;
  canRescheduleOnline: boolean;
  cancelReason: string | null;
  rescheduleReason: string | null;
  cashPaymentsEnabled: boolean;
  settings: CustomerSelfServiceSettings;
}

export function buildBookingPolicyExplanation(input: {
  booking: {
    id: string;
    startTime: Date;
    status: string;
    metadata?: Record<string, unknown> | null;
    packagePurchaseId?: string | null;
    multiServiceGroupId?: string | null;
    customer?: { name?: string | null } | null;
    service?: { name?: string | null } | null;
  };
  businessSettings: Record<string, unknown> | null | undefined;
  now?: Date;
}): BookingPolicyExplanation {
  const settings = resolveCustomerSelfServiceSettings(input.businessSettings);
  const payment = resolvePublicPaymentSettings(input.businessSettings);
  const policyInput = {
    status: input.booking.status,
    startTime: input.booking.startTime,
    metadata: input.booking.metadata,
  };
  const cancel = evaluateCustomerBookingPolicy(
    policyInput,
    settings,
    'cancel',
    input.now,
  );
  const reschedule = evaluateCustomerBookingPolicy(
    policyInput,
    settings,
    'reschedule',
    input.now,
  );

  return {
    bookingId: input.booking.id,
    customerName: input.booking.customer?.name ?? null,
    serviceName: input.booking.service?.name ?? null,
    startTime: input.booking.startTime.toISOString(),
    isPackageVisit: isPackageVisitBooking(input.booking as any),
    isMultiServiceGroup: Boolean(input.booking.multiServiceGroupId),
    canCancelOnline: cancel.allowed,
    canRescheduleOnline: reschedule.allowed,
    cancelReason: cancel.allowed ? null : (cancel.reason ?? null),
    rescheduleReason: reschedule.allowed ? null : (reschedule.reason ?? null),
    cashPaymentsEnabled: payment.acceptCashPayments,
    settings,
  };
}

export function summarizeBookingPolicy(
  explanation: BookingPolicyExplanation,
): string {
  const parts: string[] = [];
  const who = explanation.customerName ?? 'This customer';
  if (explanation.canCancelOnline && explanation.canRescheduleOnline) {
    parts.push(
      `${who} can cancel or reschedule online before the notice window.`,
    );
  } else if (explanation.canCancelOnline) {
    parts.push(
      `${who} can cancel online but not reschedule (${explanation.rescheduleReason ?? 'policy'}).`,
    );
  } else if (explanation.canRescheduleOnline) {
    parts.push(
      `${who} can reschedule online but not cancel (${explanation.cancelReason ?? 'policy'}).`,
    );
  } else {
    parts.push(
      `${who} cannot self-serve online: ${explanation.cancelReason ?? explanation.rescheduleReason ?? 'policy blocks changes'}.`,
    );
  }
  if (explanation.isPackageVisit)
    parts.push(
      'This is a package visit — changes may affect all bundled appointments.',
    );
  if (explanation.isMultiServiceGroup)
    parts.push('This is a multi-service group — same-visit moves stay atomic.');
  if (explanation.cashPaymentsEnabled)
    parts.push('Cash pay-at-venue is enabled for public booking.');
  return parts.join(' ');
}
