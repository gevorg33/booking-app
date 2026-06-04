/** AI dashboard panels wired in the last i18n pass (briefing, calendar bar, ops, workspaces). */
export const AI_DASHBOARD_SURFACE_KEYS = [
  'ai.executionTimeline',
  'ai.retryStep',
  'ai.commandBarDragTitle',
  'ai.briefingPreparing',
  'ai.briefingTitle',
  'ai.briefingSummary',
  'ai.briefingConflicts',
  'ai.briefingStatBookings',
  'ai.briefingStatUtilization',
  'ai.briefingStatCancellations',
  'ai.briefingStatUnpaidDone',
  'ai.briefingSuggestedActions',
  'ai.calendarSelectionLabel',
  'ai.calendarClearSelection',
  'ai.calendarBlock',
  'ai.calendarFillGaps',
  'ai.calendarApplyTemplate',
  'ai.calendarPromptBlock',
  'ai.calendarPromptFill',
  'ai.calendarPromptApply',
  'ai.autopilotLoading',
  'ai.autopilotTitle',
  'ai.autopilotEnable',
  'ai.autopilotLastRun',
  'ai.autopilotPlaybooks',
  'ai.autopilotSave',
  'ai.auditTitle',
  'ai.auditEmpty',
  'ai.auditApprovedBy',
  'ai.planPreviewTitle',
  'ai.planPolicy',
  'ai.conflictWorkspaceTitle',
  'ai.providerFallback',
  'ai.overlapMinutes',
  'ai.applying',
  'ai.applySuggestedFix',
  'ai.recoveryTitle',
  'ai.rebooking',
  'ai.rebookAll',
  'ai.freedSlots',
  'ai.recoveryCandidates',
  'ai.appointmentFallback',
  'ai.walkIn',
  'ai.recoveryNoMatch',
  'ai.recoveryCustomerScore',
] as const;

/** Monetization page labels wired to `t()` on the dashboard. */
export const MONETIZATION_SURFACE_KEYS = [
  'monetization.customMonths',
  'monetization.includedAppointments',
  'monetization.discountType',
  'monetization.discountValue',
  'monetization.fixedAmountOff',
  'monetization.regularTotal',
  'monetization.subscriptionPriceLabel',
  'monetization.tableDuration',
  'monetization.tableAppointments',
  'monetization.tableSavings',
  'monetization.planLabel',
  'monetization.assignMultiPlanHint',
  'monetization.adjustPoints',
  'monetization.loyaltyBalanceHint',
  'monetization.promoType',
  'monetization.promoValue',
  'monetization.promoMinOrder',
  'monetization.promoMaxUses',
  'monetization.promoDescription',
  'monetization.promoPercent',
  'monetization.promoFixedAmount',
  'monetization.promoStatusInactive',
  'monetization.promoStatusActive',
  'monetization.loyaltyTableType',
  'monetization.loyaltyTablePoints',
  'monetization.durationMonthsShort',
  'monetization.updatePlan',
  'monetization.createPlan',
  'monetization.cancelEdit',
  'monetization.plansEmpty',
  'monetization.percentOff',
  'monetization.assignSelectPlan',
  'monetization.assignNoPlansForService',
  'monetization.assignSelectServiceFirst',
  'monetization.assignAction',
  'monetization.inactiveService',
  'monetization.loyaltyNote',
  'monetization.loyaltyEarnExample',
] as const;

/** Integrations save actions on dashboard growth / platform tabs. */
export const INTEGRATIONS_SURFACE_KEYS = [
  'integrations.saveZendesk',
  'integrations.saveDistribution',
  'integrations.saveZapier',
  'integrations.saveAccounting',
] as const;

/** Other dashboard components wired in the surfaces pass. */
export const MISC_DASHBOARD_SURFACE_KEYS = [
  'employees.profilePicture',
  'employees.uploadingPhoto',
  'employees.removePhoto',
  'employees.avatarFormatsHint',
  'employees.uploadAvatar',
  'business.uploadingLogo',
  'business.uploadLogo',
  'business.removeLogo',
  'business.logo',
  'onboarding.aiPanelTitle',
  'bookings.servicesInPeriodHint',
  'operations.resourceNamePlaceholder',
  'operations.removeResourceAria',
  'customers.clearSelection',
  'schedule.placeholderShiftLabel',
  'public.discountGiftCard',
  'public.thinking',
  'common.saving',
  'common.label',
  'common.edit',
  'common.customer',
  'common.loading',
  'languages.title',
] as const;

export type DashboardSurfaceI18nKey =
  | (typeof AI_DASHBOARD_SURFACE_KEYS)[number]
  | (typeof MONETIZATION_SURFACE_KEYS)[number]
  | (typeof INTEGRATIONS_SURFACE_KEYS)[number]
  | (typeof MISC_DASHBOARD_SURFACE_KEYS)[number];

/** Every dashboard surface i18n key from the hardcoded-string cleanup. */
export function allDashboardSurfaceI18nKeys(): string[] {
  return [
    ...new Set([
      ...AI_DASHBOARD_SURFACE_KEYS,
      ...MONETIZATION_SURFACE_KEYS,
      ...INTEGRATIONS_SURFACE_KEYS,
      ...MISC_DASHBOARD_SURFACE_KEYS,
    ]),
  ];
}
