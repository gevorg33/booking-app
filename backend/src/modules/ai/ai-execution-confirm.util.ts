import type { CommandResult } from './command-completion.types.js';

const PREVIEW_PARAM_KEYS = [
  'employeeName',
  'employeeNames',
  'serviceName',
  'serviceNames',
  'customerName',
  'templateName',
  'date',
  'dateFrom',
  'dateTo',
  'timeSlot',
  'timeFrom',
  'timeTo',
  'reason',
  'allProviders',
  'bookingFirstAvailable',
] as const;

export function sanitizeParamsForPreview(params: Record<string, unknown>): Record<string, unknown> {
  const preview: Record<string, unknown> = {};
  for (const key of PREVIEW_PARAM_KEYS) {
    const value = params[key];
    if (value != null && value !== '') preview[key] = value;
  }
  return preview;
}

export function buildExecutionConfirmationResult(
  action: string,
  reasoning: string,
  prompt: string,
  params: Record<string, unknown>,
): CommandResult {
  const humanAction = action.replace(/_/g, ' ');
  const previewParams = sanitizeParamsForPreview(params);
  const detailLines = Object.entries(previewParams).map(
    ([k, v]) => `${k.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${Array.isArray(v) ? v.join(', ') : v}`,
  );

  return {
    success: true,
    action,
    summary: [
      `Ready to run: ${humanAction}.`,
      reasoning,
      detailLines.length > 0 ? detailLines.map((l) => `• ${l}`).join('\n') : '',
      'Confirm below to execute.',
    ]
      .filter(Boolean)
      .join('\n'),
    details: {
      requiresExecutionConfirmation: true,
      confirmationPrompt: prompt,
      interpretedAction: action,
      reasoning,
      previewParams,
    },
  };
}

export function isExecutionConfirmed(session?: {
  confirmed?: boolean;
  context?: Record<string, unknown>;
}): boolean {
  if (session?.confirmed === true) return true;
  return session?.context?.confirmed === true;
}
