import type { CommandResult } from './command-completion.types.js';
import {
  assemblePatientAlertSummary,
  buildExplainPatientAlertNavigate,
  parseExplainPatientAlertFromPrompt,
  resolveConsumerPatientAlertExplainContext,
  shouldDismissConsumerPatientAlert,
} from './ai-explain-patient-alert.util.js';

function failure(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: false, action, summary, details: details ?? {} };
}

function success(
  action: string,
  summary: string,
  details?: Record<string, unknown>,
): CommandResult {
  return { success: true, action, summary, details: details ?? {} };
}

function resolveSessionCustomerId(
  params: Record<string, unknown>,
): string | undefined {
  const raw = params.sessionCustomerId ?? params.customerId;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
}

export async function handleExplainPatientAlertLogic(
  _businessId: string,
  params: Record<string, unknown>,
  prompt = '',
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure(
      'explain_patient_alert',
      'Sign in to learn about your clinic patient alerts.',
      { clarify: true },
    );
  }

  const textPrompt = prompt || String(params._prompt ?? '');
  const parsed = parseExplainPatientAlertFromPrompt(textPrompt);
  if (!parsed) {
    return failure(
      'explain_patient_alert',
      'Ask about the clinic alerts banner (e.g. "What is this red banner?" or "Results ready — what do I do?").',
      { clarify: true },
    );
  }

  const ctx = resolveConsumerPatientAlertExplainContext(params);
  const summary = assemblePatientAlertSummary(
    parsed.aspect,
    ctx,
    parsed.alertType,
  );
  const navigate = buildExplainPatientAlertNavigate(
    parsed.aspect,
    parsed.alertType,
    ctx,
  );
  const dismissAlert = shouldDismissConsumerPatientAlert(parsed.aspect);

  return success('explain_patient_alert', summary, {
    aspect: parsed.aspect,
    alertType: parsed.alertType,
    alertCount: ctx.alertCount,
    activeAlertTypes: ctx.activeTypes,
    consumerPatientAlert: true,
    ...(navigate ? { navigate } : {}),
    ...(dismissAlert ? { clientAction: 'dismissConsumerPatientAlert' } : {}),
  });
}
