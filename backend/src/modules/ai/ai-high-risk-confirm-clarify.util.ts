import type { CommandResult } from './command-completion.types.js';
import type { ResolvedCommand } from './command-completion.types.js';
import { sanitizeParamsForPreview } from './ai-execution-confirm.util.js';
import { HIGH_RISK_CONFIRM_ACTIONS } from './ai-high-risk-confirm-clarify.fixtures.js';

export interface HighRiskImpactPreview {
  action: string;
  bookingCount?: number;
  customerCount?: number;
  notifyCustomers: boolean;
  scopeLabels: string[];
}

const NOTIFY_BY_DEFAULT = new Set([
  'cancel_bookings',
  'bulk_smart_cancel',
  'no_show_recovery',
  'sick_day_replan',
]);

function plural(count: number, singular: string, pluralWord = `${singular}s`): string {
  return count === 1 ? singular : pluralWord;
}

export function isHighRiskConfirmAction(action: string): boolean {
  return HIGH_RISK_CONFIRM_ACTIONS.has(action);
}

export function isHighRiskExecutionConfirmed(
  sessionContext?: Record<string, unknown>,
): boolean {
  return sessionContext?.confirmed === true;
}

export function estimateHighRiskImpact(
  action: string,
  params: Record<string, unknown>,
): HighRiskImpactPreview {
  const scopeLabels: string[] = [];
  if (params.employeeName) scopeLabels.push(String(params.employeeName));
  if (params.customerName) scopeLabels.push(String(params.customerName));
  if (params.date) scopeLabels.push(String(params.date));
  if (params.dateFrom && !params.date) scopeLabels.push(String(params.dateFrom));
  if (params.allAppointments === true) scopeLabels.push('all matching appointments');

  let bookingCount: number | undefined;
  if (Array.isArray(params.bookingIds) && params.bookingIds.length > 0) {
    bookingCount = params.bookingIds.length;
  } else if (typeof params.limit === 'number' && params.limit > 0) {
    bookingCount = params.limit;
  } else if (params.matchedCount != null && Number(params.matchedCount) > 0) {
    bookingCount = Number(params.matchedCount);
  } else if (typeof params.previewBookingCount === 'number') {
    bookingCount = params.previewBookingCount;
  } else if (typeof params.bookingCount === 'number') {
    bookingCount = params.bookingCount;
  }

  const notifyCustomers = Boolean(
    params.notifyCustomers ??
      params.notify ??
      (NOTIFY_BY_DEFAULT.has(action) && bookingCount != null && bookingCount > 0),
  );

  return {
    action,
    bookingCount,
    customerCount: bookingCount,
    notifyCustomers,
    scopeLabels,
  };
}

export function buildHighRiskConfirmSummary(preview: HighRiskImpactPreview): string {
  const scope =
    preview.scopeLabels.length > 0 ? ` for ${preview.scopeLabels.join(', ')}` : '';

  if (
    (preview.action === 'cancel_bookings' || preview.action === 'bulk_smart_cancel') &&
    preview.bookingCount != null &&
    preview.bookingCount > 0
  ) {
    const bookings = `${preview.bookingCount} ${plural(preview.bookingCount, 'booking')}`;
    if (preview.notifyCustomers && preview.customerCount != null) {
      const customers = `${preview.customerCount} ${plural(preview.customerCount, 'customer')}`;
      return `This cancels ${bookings} and notifies ${customers} — proceed?`;
    }
    return `This cancels ${bookings}${scope} — proceed?`;
  }

  if (preview.action === 'clear_schedule') {
    return `This clears the schedule${scope} — proceed?`;
  }

  if (preview.action === 'hide_appointments_from_calendar') {
    if (preview.bookingCount != null) {
      return `This hides ${preview.bookingCount} ${plural(preview.bookingCount, 'appointment')} from the calendar${scope} — proceed?`;
    }
    return `This hides appointments from the calendar${scope} — proceed?`;
  }

  if (preview.action === 'merge_customers') {
    return `This permanently merges customer records${scope} — proceed?`;
  }

  if (preview.action === 'delete_customer_data' || preview.action === 'privacy_delete') {
    return `This deletes customer data${scope} — proceed?`;
  }

  if (preview.action === 'payment_sweep') {
    return `This runs a payment sweep${scope} — proceed?`;
  }

  const humanAction = preview.action.replace(/_/g, ' ');
  if (preview.bookingCount != null && preview.bookingCount > 0) {
    return `This will ${humanAction} affecting ${preview.bookingCount} ${plural(preview.bookingCount, 'booking')}${scope} — proceed?`;
  }

  return `This will run ${humanAction}${scope || ' (review scope before proceeding)'} — proceed?`;
}

export function buildHighRiskConfirmClarifyResult(input: {
  prompt: string;
  action: string;
  params: Record<string, unknown>;
  reasoning?: string;
  sessionContext?: Record<string, unknown>;
  resolved?: ResolvedCommand;
  skipHighRiskConfirm?: boolean;
}): CommandResult | null {
  if (input.skipHighRiskConfirm || !isHighRiskConfirmAction(input.action)) {
    return null;
  }
  if (isHighRiskExecutionConfirmed(input.sessionContext)) {
    return null;
  }

  const mergedParams = {
    ...(input.resolved?.enrichedParams ?? {}),
    ...(input.resolved?.params ?? {}),
    ...input.params,
  };
  const preview = estimateHighRiskImpact(input.action, mergedParams);

  return {
    success: true,
    action: input.action,
    summary: buildHighRiskConfirmSummary(preview),
    details: {
      needsClarification: true,
      clarify: true,
      clarifySource: 'high_risk_confirm',
      clarifyKind: 'high_risk_confirm',
      requiresExecutionConfirmation: true,
      confirmationPrompt: input.prompt,
      interpretedAction: input.action,
      previewParams: sanitizeParamsForPreview(mergedParams),
      highRiskPreview: preview,
      pipelineStage: 'clarify',
      reasoning: input.reasoning,
    },
  };
}
