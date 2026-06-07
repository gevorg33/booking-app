/** Sonner / operation-feedback toast messages (axios interceptor). */
export const FEEDBACK_TOAST_I18N_KEYS = [
  'feedback.creating',
  'feedback.updating',
  'feedback.deleting',
  'feedback.created',
  'feedback.updated',
  'feedback.deleted',
  'feedback.failed',
  'feedback.failedCreate',
  'feedback.failedUpdate',
  'feedback.failedDelete',
  'feedback.bookingCreated',
  'feedback.bookingCancelled',
  'feedback.purchaseCompleted',
] as const;

/** Shared inline error fallbacks (forms, mutations, uploads). */
export const ERRORS_I18N_KEYS = [
  'errors.requestFailed',
  'errors.loginFailed',
  'errors.registrationFailed',
  'errors.saveFailed',
  'errors.loadFailed',
  'errors.uploadImageFailed',
  'errors.uploadLogoFailed',
  'errors.invitationNotFound',
  'errors.zendeskSaveFailed',
  'common.errorGeneric',
] as const;

/** Component-specific error / toast fallbacks wired in the UI. */
export const TOASTS_ERRORS_UI_I18N_KEYS = [
  'ai.approvePlanFailed',
  'ai.confirmActionFailed',
  'public.missingAppointmentSchedule',
  'public.validateServiceSelectionFailed',
  'public.loadAvailableTimesFailed',
  'public.findAvailableBlockFailed',
  'monetization.giftCardRefundFailed',
] as const;

/** Clinic LIS inbound worker and sync API error toasts (tenant-facing only). */
export const CLINIC_LIS_WORKER_ERROR_I18N_KEYS = [
  'clinicLis.workerErrors.processFailed',
  'clinicLis.workerErrors.parseFailed',
  'clinicLis.workerErrors.webhookNotConfigured',
  'clinicLis.workerErrors.invalidSignature',
  'clinicLis.workerErrors.unknownSource',
  'clinicLis.workerErrors.accessDenied',
  'clinicLis.workerErrors.registryAccessDenied',
  'clinicLis.workerErrors.manageDenied',
  'clinicLis.workerErrors.labNotFound',
  'clinicLis.workerErrors.specimenNotFound',
  'clinicLis.workerErrors.observationNotFound',
  'clinicLis.workerErrors.alreadyLinked',
  'clinicLis.workerErrors.linkRequiresMeasurements',
  'clinicLis.workerErrors.ingestDenied',
  'clinicLis.workerErrors.linkDenied',
  'clinicLis.workerErrors.invalidMachineName',
  'clinicLis.workerErrors.invalidPayload',
  'clinicLis.workerErrors.retryQueued',
] as const;

export const CLINIC_LIS_TOAST_I18N_KEYS = [
  'clinicLis.toasts.labSaved',
  'clinicLis.toasts.machineSaved',
  'clinicLis.toasts.machineAssigned',
  'clinicLis.toasts.machineCleared',
  'clinicLis.toasts.syncProcessed',
] as const;

export function allToastsErrorsI18nKeys(): string[] {
  return [
    ...new Set([
      ...FEEDBACK_TOAST_I18N_KEYS,
      ...ERRORS_I18N_KEYS,
      ...TOASTS_ERRORS_UI_I18N_KEYS,
      ...CLINIC_LIS_WORKER_ERROR_I18N_KEYS,
      ...CLINIC_LIS_TOAST_I18N_KEYS,
    ]),
  ];
}
