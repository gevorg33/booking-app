/**
 * e2e-bug.253 — Account booking-card / ConsumerBookingActions CTAs must be
 * light-DOM `<button class="consumer-action-button">` (not IonButton hosts).
 */

export const E2E253_NATIVE_CTA_SELECTOR =
  'button.consumer-action-button[type="button"]' as const;

export const E2E253_CSS_MARKERS = [
  '.consumer-action-button--small',
  'e2e-bug.253',
] as const;

/** Labels that must never render as ion-button on booking cards / actions. */
export const E2E253_BOOKING_CTA_LABEL_PATTERNS = [
  /rate your visit|leave a review|post.?booking/i,
  /rebook/i,
  /share booking|share/i,
  /reschedule/i,
  /cancel appointment|cancel/i,
  /confirm reschedule/i,
] as const;

export const E2E253_UNIT_CASES = [
  {
    id: 'booking-card-review-native',
    description: 'BookingCard review CTA is native consumer-action-button',
  },
  {
    id: 'booking-card-rebook-native',
    description: 'BookingCard rebook CTA is native consumer-action-button',
  },
  {
    id: 'booking-card-share-native',
    description: 'BookingCard share CTA is native consumer-action-button',
  },
  {
    id: 'booking-card-no-ion-button-ctas',
    description: 'BookingCard review/rebook/share are never inside ion-button',
  },
  {
    id: 'actions-cancel-reschedule-native',
    description: 'ConsumerBookingActions cancel/reschedule are native buttons',
  },
  {
    id: 'actions-slot-aria-pressed',
    description: 'Reschedule slot chips use aria-pressed on native buttons',
  },
  {
    id: 'actions-confirm-native',
    description: 'Confirm reschedule is native block consumer-action-button',
  },
  {
    id: 'css-small-marker-present',
    description: 'variables.css keeps --small + e2e-bug.253 marker',
  },
] as const;

export const E2E253_LIVE_CASES = [
  {
    id: 'signed-in-cancel-native',
    description: 'Signed-in account: Cancel appointment is button.consumer-action-button',
  },
  {
    id: 'signed-in-reschedule-native',
    description: 'Signed-in account: Reschedule is button.consumer-action-button',
  },
  {
    id: 'reschedule-panel-confirm-native',
    description: 'After opening reschedule, Confirm reschedule is native button',
  },
  {
    id: 'no-ion-button-for-booking-manage-ctas',
    description: 'Cancel / Reschedule labels are never on ion-button hosts',
  },
  {
    id: 'rebook-or-share-native-when-visible',
    description: 'When Rebook/Share appear, they are native consumer-action-button',
  },
  {
    id: 'gift-card-buy-native-when-visible',
    description: 'Account Buy gift card CTA (if enabled) is native, not ion-button',
  },
  {
    id: 'source-booking-actions-no-ion-button',
    description: 'ConsumerBookingActions.tsx source has zero IonButton imports/usages',
  },
] as const;
