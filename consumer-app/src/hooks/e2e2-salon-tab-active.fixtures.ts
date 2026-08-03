/**
 * e2e-bug.2 — cold load / hard nav must apply `salon-tab-active` without waiting
 * for Ionic `useIonViewDidEnter` (CTA / tab-bar offset depends on that class).
 */

export const E2E2_SALON_TAB_ACTIVE_CLASS = 'salon-tab-active';

/** CSS selectors that only get correct bottom offset when body has salon-tab-active. */
export const E2E2_CLASS_DEPENDENT_SELECTORS = [
  'body.salon-tab-active ion-content',
  'body.salon-tab-active ion-page',
  'body.salon-tab-active .consumer-fixed-action-bar',
  'body.salon-tab-active .consumer-page-with-fixed-action ion-content',
  'body.salon-tab-active ion-content.consumer-tab-fixed-action-content',
] as const;

export const E2E2_LIVE_CASES = [
  {
    id: 'cold-hard-load-home',
    description:
      'Hard nav to /s/:slug/home — body has salon-tab-active before/without relying on IonViewDidEnter',
  },
  {
    id: 'cold-hard-load-services',
    description:
      'Hard nav to /s/:slug/services — salon-tab-active present; fixed-action content padding path available',
  },
  {
    id: 'warm-tab-switch-account-then-home',
    description:
      'Warm tab switch away then back — class cleared on leave, restored on enter/home',
  },
  {
    id: 'tab-bar-visible-cold',
    description: 'Bottom tab bar is visible and above the fold on cold home load',
  },
  {
    id: 'ai-fab-not-under-tab-bar',
    description:
      'Assistant FAB (if present) sits above the tab bar, not buried under it',
  },
] as const;
