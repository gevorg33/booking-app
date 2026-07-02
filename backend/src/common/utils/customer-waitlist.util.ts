export const CUSTOMER_WAITLIST_TAG = 'waitlist';

export const CUSTOMER_WAITLIST_METADATA_KEY = 'waitlistRequest';

export type CustomerWaitlistStatus = 'active' | 'fulfilled' | 'cancelled';

export interface CustomerWaitlistRequest {
  status: CustomerWaitlistStatus;
  joinedAt: string;
  updatedAt: string;
  serviceId?: string;
  serviceName?: string;
  employeeId?: string;
  employeeName?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  timeSlot?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  notes?: string;
}

export function ensureWaitlistTag(tags?: string[] | null): string[] {
  const current = [...(tags ?? [])];
  if (!current.some((tag) => tag.toLowerCase() === CUSTOMER_WAITLIST_TAG)) {
    current.push(CUSTOMER_WAITLIST_TAG);
  }
  return current;
}

export function removeWaitlistTag(tags?: string[] | null): string[] {
  return (tags ?? []).filter(
    (tag) => tag.toLowerCase() !== CUSTOMER_WAITLIST_TAG,
  );
}

export function hasWaitlistTag(tags?: string[] | null): boolean {
  return (tags ?? []).some(
    (tag) => tag.toLowerCase() === CUSTOMER_WAITLIST_TAG,
  );
}

export function readCustomerWaitlistRequest(
  metadata?: Record<string, unknown> | null,
): CustomerWaitlistRequest | null {
  const raw = metadata?.[CUSTOMER_WAITLIST_METADATA_KEY];
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const status =
    row.status === 'active' ||
    row.status === 'fulfilled' ||
    row.status === 'cancelled'
      ? row.status
      : null;
  const joinedAt = typeof row.joinedAt === 'string' ? row.joinedAt : null;
  if (!status || !joinedAt) return null;

  return {
    status,
    joinedAt,
    updatedAt: typeof row.updatedAt === 'string' ? row.updatedAt : joinedAt,
    ...(typeof row.serviceId === 'string' ? { serviceId: row.serviceId } : {}),
    ...(typeof row.serviceName === 'string'
      ? { serviceName: row.serviceName }
      : {}),
    ...(typeof row.employeeId === 'string'
      ? { employeeId: row.employeeId }
      : {}),
    ...(typeof row.employeeName === 'string'
      ? { employeeName: row.employeeName }
      : {}),
    ...(typeof row.date === 'string' ? { date: row.date } : {}),
    ...(typeof row.dateFrom === 'string' ? { dateFrom: row.dateFrom } : {}),
    ...(typeof row.dateTo === 'string' ? { dateTo: row.dateTo } : {}),
    ...(typeof row.timeSlot === 'string' ? { timeSlot: row.timeSlot } : {}),
    ...(row.timeOfDay === 'morning' ||
    row.timeOfDay === 'afternoon' ||
    row.timeOfDay === 'evening'
      ? { timeOfDay: row.timeOfDay }
      : {}),
    ...(typeof row.notes === 'string' ? { notes: row.notes } : {}),
  };
}

export function buildCustomerWaitlistRequest(input: {
  serviceId?: string;
  serviceName?: string;
  employeeId?: string;
  employeeName?: string;
  date?: string;
  dateFrom?: string;
  dateTo?: string;
  timeSlot?: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  notes?: string;
  previous?: CustomerWaitlistRequest | null;
  status?: CustomerWaitlistStatus;
  now?: Date;
}): CustomerWaitlistRequest {
  const now = (input.now ?? new Date()).toISOString();
  return {
    status: input.status ?? input.previous?.status ?? 'active',
    joinedAt: input.previous?.joinedAt ?? now,
    updatedAt: now,
    ...(input.serviceId ? { serviceId: input.serviceId } : {}),
    ...(input.serviceName ? { serviceName: input.serviceName } : {}),
    ...(input.employeeId ? { employeeId: input.employeeId } : {}),
    ...(input.employeeName ? { employeeName: input.employeeName } : {}),
    ...(input.date ? { date: input.date } : {}),
    ...(input.dateFrom ? { dateFrom: input.dateFrom } : {}),
    ...(input.dateTo ? { dateTo: input.dateTo } : {}),
    ...(input.timeSlot ? { timeSlot: input.timeSlot } : {}),
    ...(input.timeOfDay ? { timeOfDay: input.timeOfDay } : {}),
    ...(input.notes ? { notes: input.notes } : {}),
  };
}

export function applyCustomerWaitlistRequestToMetadata(
  metadata: Record<string, unknown> | null | undefined,
  request: CustomerWaitlistRequest,
): Record<string, unknown> {
  return {
    ...(metadata ?? {}),
    [CUSTOMER_WAITLIST_METADATA_KEY]: request,
  };
}

export function formatCustomerWaitlistPreferenceSummary(
  request: CustomerWaitlistRequest,
): string {
  const parts: string[] = [];
  if (request.serviceName) parts.push(request.serviceName);
  if (request.employeeName) parts.push(`with ${request.employeeName}`);
  if (request.date) parts.push(`on ${request.date}`);
  else if (request.dateFrom && request.dateTo) {
    parts.push(`between ${request.dateFrom} and ${request.dateTo}`);
  } else if (request.dateFrom) {
    parts.push(`from ${request.dateFrom}`);
  }
  if (request.timeSlot) parts.push(`around ${request.timeSlot}`);
  else if (request.timeOfDay) parts.push(request.timeOfDay);
  return parts.length ? parts.join(' ') : 'any upcoming opening';
}

export function buildJoinWaitlistSuccessSummary(
  request: CustomerWaitlistRequest,
): string {
  const prefs = formatCustomerWaitlistPreferenceSummary(request);
  return `You're on the waitlist — we'll notify you if something opens for ${prefs}.`;
}

export function buildCheckWaitlistStatusSummary(input: {
  onWaitlist: boolean;
  request: CustomerWaitlistRequest | null;
}): string {
  if (
    !input.onWaitlist ||
    !input.request ||
    input.request.status !== 'active'
  ) {
    return "You're not on the waitlist right now.";
  }
  const prefs = formatCustomerWaitlistPreferenceSummary(input.request);
  return `You're on the waitlist for ${prefs}. We'll reach out when a slot opens.`;
}
