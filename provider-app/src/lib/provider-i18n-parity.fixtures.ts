/** prov-exp-10.4 — provider.* keys introduced in prov-exp 7–10 requiring HY/RU parity (not EN fallback). */

export const PROV_EXP_PROVIDER_I18N_PARITY_KEYS = [
  // prov-exp-7.1 self block
  'provider.selfBlockTitle',
  'provider.selfBlockDescription',
  'provider.selfBlockSaved',
  // prov-exp-7.2 time off
  'provider.timeOffTitle',
  'provider.timeOffDescription',
  'provider.timeOffStartDate',
  'provider.timeOffEndDate',
  'provider.timeOffReason',
  'provider.timeOffReasonPlaceholder',
  'provider.timeOffSubmit',
  'provider.timeOffSubmitted',
  'provider.timeOffFailed',
  'provider.timeOffStatusTitle',
  'provider.timeOffStatusEmpty',
  'provider.timeOffCancel',
  'provider.timeOffStatusPending',
  'provider.timeOffStatusApproved',
  'provider.timeOffStatusDenied',
  'provider.timeOffStatusCancelled',
  // prov-exp-7.3 open shifts
  'provider.openShiftsTitle',
  'provider.openShiftsDescription',
  'provider.openShiftsOpen',
  'provider.openShiftsFillGap',
  // prov-exp-9.1 customer badges
  'provider.customerSnapshotBadgeFirstVisit',
  'provider.customerSnapshotBadgeWinBack',
  'provider.customerSnapshotBadgeReferredBy',
  // prov-exp-9.2 loyalty quick view
  'provider.loyaltyQuickViewBalance',
  'provider.loyaltyQuickViewLifetimeEarned',
  'provider.loyaltyQuickViewLastEarn',
  'provider.loyaltyQuickViewLastRedeem',
  'provider.loyaltyQuickViewNoActivity',
  'provider.loyaltyQuickViewReadOnly',
  // prov-exp-10.1 notification center
  'provider.pushNotificationsTitle',
  'provider.pushNotificationsSubtitle',
  'provider.pushNotificationsOpenCenter',
  'provider.pushNotificationsMarkAllRead',
  'provider.pushNotificationsEmpty',
  'provider.pushNotificationsLoadFailed',
  'provider.pushNotificationKindBookingCreated',
  'provider.pushNotificationKindBookingCancelled',
  'provider.pushNotificationKindBookingRescheduled',
  'provider.pushNotificationKindPaymentReceived',
  'provider.pushNotificationKindEndOfDay',
  'provider.pushNotificationKindUpdated',
  // prov-exp-10.2 calendar month
  'provider.calendarMonthLoading',
  'provider.calendarUtilizationLegend',
  'provider.calendarUtilizationEmpty',
  'provider.calendarUtilizationLow',
  'provider.calendarUtilizationMedium',
  'provider.calendarUtilizationHigh',
  // prov-exp misc wired keys
  'provider.quickChipsTitle',
  'provider.taxIncluded',
] as const;

export const PROV_EXP_PROVIDER_I18N_INTERPOLATION_CASES = [
  {
    id: 'loyalty-activity',
    key: 'provider.loyaltyQuickViewActivityLine',
    vars: { points: 12, date: '2026-06-01' },
    needles: ['12', '2026'],
  },
  {
    id: 'referred-by-badge',
    key: 'provider.customerSnapshotBadgeReferredBy',
    vars: { name: 'Anna' },
    needles: ['Anna'],
  },
  {
    id: 'calendar-utilization',
    key: 'provider.myStatsUtilization',
    vars: {},
    needles: [],
  },
] as const;
