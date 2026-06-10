/** adopt-5.6 — provider adoption UI surfaces requiring EN/HY/RU copy + a11y hooks. */

export const PROVIDER_ADOPTION_I18N_KEYS = [
  'provider.analyticsConsentTitle',
  'provider.analyticsConsentMessage',
  'provider.analyticsConsentAccept',
  'provider.analyticsConsentDecline',
  'feedback.creating',
  'feedback.failed',
  'feedback.created',
] as const;

export const PROVIDER_ADOPTION_GATE_COPY_FIELDS = [
  'title',
  'killSwitchMessage',
  'updateRequiredMessage',
  'updateNudgeMessage',
  'updateAction',
  'dismissAction',
] as const;

export const PROVIDER_ADOPTION_A11Y_SURFACES = [
  { file: 'components/AppVersionGate.tsx', needles: ['aria-modal', 'role="dialog"'] },
  { file: 'components/AppUpdateNudgeBanner.tsx', needles: ['role="status"'] },
  { file: 'components/AppAnalyticsBootstrap.tsx', needles: ['role="dialog"', 'aria-modal="true"'] },
  { file: 'components/OperationFeedbackHost.tsx', needles: ['aria-live="polite"'] },
  { file: 'components/ProviderCalendarMonth.tsx', needles: ['aria-label', 'aria-current', 'type="button"'] },
  { file: 'components/AccessibilityBootstrap.tsx', needles: ['applyDocumentAccessibility'] },
  { file: 'App.tsx', needles: ['AccessibilityBootstrap'] },
] as const;
