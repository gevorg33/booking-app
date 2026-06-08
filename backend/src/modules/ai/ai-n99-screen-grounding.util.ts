/** n99-2.2 — pass on-screen booking/customer/service context into commands. */

export const DEICTIC_BOOK =
  /\b(book|schedule|reserve|amragic|amragir|запиш|запис|ամրագր)\b.*\b(this|that|it|սա|այս|այն|это|этот|эту|этого)\b|\b(this|that|it|սա|այս)\b.*\b(book|schedule|reserve|amragic|запиш|ամրագր)\b/i;
export const DEICTIC_CANCEL =
  /\b(cancel|remove|delete|չեղարկ|отмен)\b.*\b(this|that|it|սա|այս|այն|это|этот|эту)\b|\b(this|that|it|սա|այս)\b.*\b(cancel|remove|delete|չեղարկ|отмен)\b/i;
export const DEICTIC_REMIND =
  /\b(remind|notify|ping|հիշեց|напомн)\b.*\b(her|him|them|this customer|that client|նրան|ей|ему|ей)\b/i;
export const DEICTIC_RESCHEDULE =
  /\b(reschedule|move|shift|postpone|перенес|տեղափ)\b.*\b(this|that|it|սա|այս|это|этот|эту)\b/i;
export const DEICTIC_MARK_PAID =
  /\b(mark paid|record payment|mark as paid|վճարվ|оплат)\b.*\b(this|that|it|սա|это)\b/i;

export const SCREEN_CONTEXT_KEYS = [
  'bookingId',
  'customerId',
  'customerName',
  'serviceId',
  'serviceName',
  'employeeId',
  'employeeName',
  'date',
  'timeSlot',
  'selectionEmployeeId',
  'selectionDate',
  'selectionTimeFrom',
  'selectionTimeTo',
  'route',
] as const;

export type ScreenContextKey = (typeof SCREEN_CONTEXT_KEYS)[number];

export interface ScreenGroundingContext {
  bookingId?: string;
  customerId?: string;
  customerName?: string;
  serviceId?: string;
  serviceName?: string;
  employeeId?: string;
  employeeName?: string;
  date?: string;
  timeSlot?: string;
  selectionEmployeeId?: string;
  selectionDate?: string;
  selectionTimeFrom?: string;
  selectionTimeTo?: string;
  route?: string;
}

export function readScreenContext(
  input?: ScreenGroundingContext | Record<string, unknown>,
): ScreenGroundingContext {
  if (!input) return {};
  const ctx = input as Record<string, unknown>;
  const nested =
    ctx.context && typeof ctx.context === 'object'
      ? (ctx.context as Record<string, unknown>)
      : {};
  const merged = { ...nested, ...ctx };
  const screen: ScreenGroundingContext = {};
  for (const key of SCREEN_CONTEXT_KEYS) {
    const value = merged[key];
    if (typeof value === 'string' && value.trim()) {
      screen[key] = value.trim();
    }
  }
  return screen;
}

/** Merge explicit request context with session carry-over (request wins). */
export function resolveRequestScreenContext(
  requestContext?: Record<string, unknown>,
  sessionContext?: Record<string, unknown>,
): Record<string, unknown> {
  if (!requestContext && !sessionContext) return {};
  if (!sessionContext) return { ...requestContext };
  if (!requestContext) return { ...sessionContext };
  return { ...sessionContext, ...requestContext };
}

function setIfEmpty(
  params: Record<string, unknown>,
  key: string,
  value: unknown,
  filled: string[],
): void {
  if (value == null || value === '') return;
  const current = params[key];
  if (current != null && current !== '') return;
  params[key] = value;
  filled.push(key);
}

export function applyScreenContextGrounding(input: {
  prompt: string;
  action: string;
  params: Record<string, unknown>;
  screenContext?: ScreenGroundingContext | Record<string, unknown>;
}): { params: Record<string, unknown>; filledFields: string[] } {
  const params = { ...input.params };
  const filledFields: string[] = [];
  const screen = readScreenContext(input.screenContext);

  for (const key of SCREEN_CONTEXT_KEYS) {
    setIfEmpty(params, key, screen[key], filledFields);
  }

  if (DEICTIC_BOOK.test(input.prompt)) {
    setIfEmpty(params, 'serviceName', screen.serviceName, filledFields);
    setIfEmpty(params, 'serviceId', screen.serviceId, filledFields);
    setIfEmpty(params, 'employeeName', screen.employeeName, filledFields);
    setIfEmpty(params, 'employeeId', screen.employeeId ?? screen.selectionEmployeeId, filledFields);
    setIfEmpty(params, 'date', screen.selectionDate ?? screen.date, filledFields);
    setIfEmpty(params, 'timeSlot', screen.timeSlot ?? screen.selectionTimeFrom, filledFields);
  }

  if (DEICTIC_CANCEL.test(input.prompt)) {
    setIfEmpty(params, 'bookingId', screen.bookingId, filledFields);
    setIfEmpty(params, 'customerName', screen.customerName, filledFields);
    setIfEmpty(params, 'customerId', screen.customerId, filledFields);
  }

  if (DEICTIC_REMIND.test(input.prompt)) {
    setIfEmpty(params, 'customerName', screen.customerName, filledFields);
    setIfEmpty(params, 'customerId', screen.customerId, filledFields);
    setIfEmpty(params, 'bookingId', screen.bookingId, filledFields);
  }

  if (DEICTIC_RESCHEDULE.test(input.prompt) || input.action === 'reschedule_booking') {
    setIfEmpty(params, 'bookingId', screen.bookingId, filledFields);
    setIfEmpty(params, 'customerName', screen.customerName, filledFields);
    setIfEmpty(params, 'serviceName', screen.serviceName, filledFields);
  }

  if (DEICTIC_MARK_PAID.test(input.prompt) || input.action === 'mark_paid') {
    setIfEmpty(params, 'bookingId', screen.bookingId, filledFields);
    setIfEmpty(params, 'customerName', screen.customerName, filledFields);
  }

  return { params, filledFields };
}

export function trimNeedlessClarifyIssuesFromScreen(input: {
  action: string;
  params: Record<string, unknown>;
  issues: Array<{ field: string; message: string; example?: string }>;
  screenContext?: ScreenGroundingContext | Record<string, unknown>;
  sessionContext?: Record<string, unknown>;
}): Array<{ field: string; message: string; example?: string }> {
  const screen = readScreenContext(input.screenContext);
  const session = input.sessionContext ?? {};
  const contextValues = new Map<string, unknown>([
    ['date', screen.selectionDate ?? screen.date ?? session.date],
    ['customerName', screen.customerName ?? session.lastCustomerName],
    ['customerId', screen.customerId ?? session.customerId],
    ['employeeName', screen.employeeName ?? session.lastEmployeeName],
    ['employeeId', screen.employeeId ?? session.lastEmployeeId],
    ['serviceName', screen.serviceName ?? session.lastServiceName],
    ['serviceId', screen.serviceId ?? session.lastServiceId],
    ['bookingId', screen.bookingId ?? session.bookingId],
    ['timeSlot', screen.timeSlot ?? session.timeSlot],
  ]);

  return input.issues.filter((issue) => {
    const contextValue = contextValues.get(issue.field);
    if (contextValue == null || contextValue === '') return true;
    const paramValue = input.params[issue.field];
    if (paramValue != null && paramValue !== '') return true;
    return false;
  });
}
