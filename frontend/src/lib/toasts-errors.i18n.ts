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

export function allToastsErrorsI18nKeys(): string[] {
  return [
    ...new Set([
      ...FEEDBACK_TOAST_I18N_KEYS,
      ...ERRORS_I18N_KEYS,
      ...TOASTS_ERRORS_UI_I18N_KEYS,
    ]),
  ];
}
