import type { AiPageContext } from '@/lib/ai-orchestration';
import {
  buildDashboardNavigateUrl,
  type DashboardNavigateTarget,
} from '@/lib/compliance-dashboard-nav';

export interface AiCommandSessionContext extends Partial<AiPageContext> {
  lastAction?: string | null;
  lastMetric?: string | null;
  availableProviders?: string[];
  _clarifyContext?: Record<string, unknown>;
  _clarifyMemory?: Record<string, string>;
  _selectedIntentAction?: string;
}

export interface AiCommandMessageLike {
  id: string;
  role: 'user' | 'assistant';
  success?: boolean;
  action?: string;
}

const SCHEDULE_ACTIONS = new Set([
  'fill_unused_slots',
  'apply_schedule',
  'block_schedule',
  'create_direct_schedule',
  'clear_schedule',
  'setup_week_schedule',
  'assign_employee_services',
]);

const ORCHESTRATION_ACTIONS = new Set([
  'optimize_schedule',
  'resolve_conflicts',
  'reassign_cancelled',
  'summarize_utilization',
]);

export function shouldInvalidateAfterAi(action?: string, success?: boolean): boolean {
  if (!success || !action) return false;
  return (
    action === 'cancel_bookings' ||
    action === 'create_booking' ||
    action === 'create_service' ||
    action === 'create_services' ||
    action === 'reschedule_booking' ||
    SCHEDULE_ACTIONS.has(action) ||
    ORCHESTRATION_ACTIONS.has(action)
  );
}

export function extractSessionContext(result: {
  action?: string;
  details?: {
    sessionContext?: AiCommandSessionContext;
    employee?: string;
    date?: string;
    availableProviders?: string[];
    params?: Record<string, unknown>;
    metric?: unknown;
    appointmentMetric?: unknown;
    bookingMetric?: unknown;
  };
}): AiCommandSessionContext {
  const ctx: AiCommandSessionContext = { ...(result.details?.sessionContext ?? {}) };
  if (result.details?.employee) ctx.employeeName = result.details.employee;
  if (result.details?.date) ctx.date = result.details.date;
  const params = result.details?.params;
  const details = result.details as Record<string, unknown> | undefined;
  if (params?.employeeName && !ctx.employeeName) ctx.employeeName = String(params.employeeName);
  if (params?.date && !ctx.date) ctx.date = String(params.date);
  if (params?.serviceName && !ctx.serviceName) ctx.serviceName = String(params.serviceName);
  if (params?.timeSlot && !ctx.timeSlot) ctx.timeSlot = String(params.timeSlot);
  const available = result.details?.availableProviders;
  if (Array.isArray(available) && available.length > 0) {
    ctx.availableProviders = available.map(String);
  } else if (Array.isArray(details?.providers) && details.providers.length > 0) {
    ctx.availableProviders = (details.providers as Array<{ name?: string }>)
      .map((provider) => provider.name)
      .filter((name): name is string => Boolean(name));
  }
  if (result.action) ctx.lastAction = result.action;
  if (details?.metric) ctx.customerMetric = String(details.metric);
  if (details?.appointmentMetric) ctx.appointmentMetric = String(details.appointmentMetric);
  if (details?.bookingMetric) ctx.bookingMetric = String(details.bookingMetric);
  const metric =
    details?.appointmentMetric ??
    details?.customerMetric ??
    details?.bookingMetric ??
    details?.metric;
  if (metric) ctx.lastMetric = String(metric);
  const sessionCtx = result.details?.sessionContext as AiCommandSessionContext | undefined;
  if (sessionCtx?._clarifyContext) ctx._clarifyContext = sessionCtx._clarifyContext;
  if (sessionCtx?._clarifyMemory) ctx._clarifyMemory = sessionCtx._clarifyMemory;
  return ctx;
}

export function mergeSessionContext(
  prev: AiCommandSessionContext,
  next: AiCommandSessionContext,
): AiCommandSessionContext {
  return {
    employeeName: next.employeeName ?? prev.employeeName,
    date: next.date ?? prev.date,
    dateFrom: next.dateFrom ?? prev.dateFrom,
    dateTo: next.dateTo ?? prev.dateTo,
    serviceName: next.serviceName ?? prev.serviceName,
    timeSlot: next.timeSlot ?? prev.timeSlot,
    customerName: next.customerName ?? prev.customerName,
    templateName: next.templateName ?? prev.templateName,
    timeFrom: next.timeFrom ?? prev.timeFrom,
    timeTo: next.timeTo ?? prev.timeTo,
    allProviders: next.allProviders ?? prev.allProviders,
    lastAction: next.lastAction ?? prev.lastAction,
    lastMetric: next.lastMetric ?? prev.lastMetric,
    appointmentMetric: next.appointmentMetric ?? prev.appointmentMetric,
    customerMetric: next.customerMetric ?? prev.customerMetric,
    bookingMetric: next.bookingMetric ?? prev.bookingMetric,
    route: next.route ?? prev.route,
    availableProviders: next.availableProviders ?? prev.availableProviders,
    _clarifyContext: next._clarifyContext ?? prev._clarifyContext,
    _clarifyMemory: { ...(prev._clarifyMemory ?? {}), ...(next._clarifyMemory ?? {}) },
  };
}

export function extractDashboardNavigate(
  details?: Record<string, unknown>,
): DashboardNavigateTarget | null {
  const navigate = details?.navigate;
  if (!navigate || typeof navigate !== 'object') return null;
  const path = (navigate as DashboardNavigateTarget).path;
  if (typeof path !== 'string' || !path.startsWith('/')) return null;
  const query = (navigate as DashboardNavigateTarget).query;
  const hash = (navigate as DashboardNavigateTarget).hash;
  return {
    path,
    ...(query && typeof query === 'object' ? { query: query as Record<string, string> } : {}),
    ...(typeof hash === 'string' ? { hash } : {}),
  };
}

/** Message id eligible for inline undo banner (ai-d7). */
export function findLastUndoableMessageId(
  messages: AiCommandMessageLike[],
  undoable: boolean,
): string | null {
  if (!undoable) return null;
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role === 'assistant' && m.success && shouldInvalidateAfterAi(m.action, true)) {
      return m.id;
    }
  }
  return null;
}
