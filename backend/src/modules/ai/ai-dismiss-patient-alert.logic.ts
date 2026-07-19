import type { PatientClinicalAlertsService } from '../patient-clinical-profiles/patient-clinical-alerts.service.js';
import type { ClinicPatientAlertType } from '../../common/utils/clinic-patient-alert.types.js';
import type { CommandResult } from './command-completion.types.js';

export interface DismissPatientAlertLogicDeps {
  patientClinicalAlertsService: Pick<
    PatientClinicalAlertsService,
    'dismissAlertForCustomerAccount'
  >;
}

function failure(
  action: string,
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: false, action, summary, details };
}

function success(
  action: string,
  summary: string,
  details: Record<string, unknown> = {},
): CommandResult {
  return { success: true, action, summary, details };
}

function resolveSessionCustomerId(
  params: Record<string, unknown>,
): string | undefined {
  const raw = params.sessionCustomerId ?? params.customerId;
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
}

export async function handleDismissPatientAlertLogic(
  deps: DismissPatientAlertLogicDeps,
  businessId: string,
  params: Record<string, unknown> = {},
): Promise<CommandResult> {
  const customerId = resolveSessionCustomerId(params);
  if (!customerId) {
    return failure(
      'dismiss_patient_alert',
      'Sign in to dismiss this clinic alert.',
      { clarify: true },
    );
  }

  const alertType =
    typeof params.alertType === 'string'
      ? (params.alertType as ClinicPatientAlertType)
      : undefined;
  const sourceId =
    typeof params.sourceId === 'string' ? params.sourceId.trim() : '';
  if (!alertType || !sourceId) {
    return failure(
      'dismiss_patient_alert',
      'Specify which alert you want to dismiss.',
      { clarify: true, missing: ['alertType', 'sourceId'] },
    );
  }

  try {
    const dismissal =
      await deps.patientClinicalAlertsService.dismissAlertForCustomerAccount(
        businessId,
        customerId,
        alertType,
        sourceId,
      );
    return success('dismiss_patient_alert', 'Alert dismissed.', {
      alertType,
      sourceId,
      dismissal,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Could not dismiss this alert.';
    return failure('dismiss_patient_alert', message, { alertType, sourceId });
  }
}
