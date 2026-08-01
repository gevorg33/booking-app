/**
 * e2e-bug.272 — Package / multi-service visit action CTAs must be
 * light-DOM `<button class="consumer-action-button">` (not IonButton hosts).
 * Residual of e2e-bug.253.
 */

export const E2E272_NATIVE_CTA_SELECTOR =
  'button.consumer-action-button[type="button"]' as const;

export const E2E272_SOURCE_FILES = [
  'ConsumerPackageVisitActions.tsx',
  'ConsumerMultiServiceVisitActions.tsx',
] as const;

/** Labels that must never render as ion-button on visit action rows. */
export const E2E272_VISIT_CTA_LABEL_PATTERNS = [
  /reschedule package visit/i,
  /cancel package visit/i,
  /reschedule visit/i,
  /cancel visit/i,
  /confirm reschedule/i,
] as const;

export const E2E272_UNIT_CASES = [
  {
    id: 'package-cancel-reschedule-native',
    description: 'ConsumerPackageVisitActions cancel/reschedule are native buttons',
  },
  {
    id: 'package-slot-aria-pressed',
    description: 'Package reschedule slot chips use aria-pressed on native buttons',
  },
  {
    id: 'package-confirm-native',
    description: 'Package confirm reschedule is native block consumer-action-button',
  },
  {
    id: 'package-no-ion-button-ctas',
    description: 'Package visit CTAs are never inside ion-button',
  },
  {
    id: 'multi-cancel-reschedule-native',
    description: 'ConsumerMultiServiceVisitActions cancel/reschedule are native buttons',
  },
  {
    id: 'multi-slot-aria-pressed',
    description: 'Multi-service reschedule slot chips use aria-pressed on native buttons',
  },
  {
    id: 'multi-confirm-native',
    description: 'Multi-service confirm reschedule is native block consumer-action-button',
  },
  {
    id: 'multi-no-ion-button-ctas',
    description: 'Multi-service visit CTAs are never inside ion-button',
  },
  {
    id: 'source-package-actions-no-ion-button',
    description: 'ConsumerPackageVisitActions.tsx source has zero IonButton imports/usages',
  },
  {
    id: 'source-multi-actions-no-ion-button',
    description: 'ConsumerMultiServiceVisitActions.tsx source has zero IonButton imports/usages',
  },
] as const;

export const E2E272_LIVE_CASES = [
  {
    id: 'source-package-actions-no-ion-button',
    description: 'ConsumerPackageVisitActions.tsx source has zero IonButton',
  },
  {
    id: 'source-multi-actions-no-ion-button',
    description: 'ConsumerMultiServiceVisitActions.tsx source has zero IonButton',
  },
  {
    id: 'signed-in-package-cancel-native',
    description: 'Signed-in account: Cancel package visit is button.consumer-action-button',
  },
  {
    id: 'signed-in-package-reschedule-native',
    description: 'Signed-in account: Reschedule package visit is button.consumer-action-button',
  },
  {
    id: 'signed-in-multi-cancel-native',
    description: 'Signed-in account: Cancel visit is button.consumer-action-button',
  },
  {
    id: 'signed-in-multi-reschedule-native',
    description: 'Signed-in account: Reschedule visit is button.consumer-action-button',
  },
  {
    id: 'package-reschedule-panel-confirm-native',
    description: 'After opening package reschedule, Confirm is native (or slots load without ion-button)',
  },
  {
    id: 'multi-reschedule-panel-confirm-native',
    description: 'After opening multi-service reschedule, Confirm is native (or slots load without ion-button)',
  },
  {
    id: 'no-ion-button-for-visit-manage-ctas',
    description: 'Package/multi cancel+reschedule labels are never on ion-button hosts',
  },
] as const;
