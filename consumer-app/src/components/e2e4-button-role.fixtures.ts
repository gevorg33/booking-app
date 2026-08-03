/**
 * e2e-bug.4 — primary tap targets must be light-DOM `<button>` / `<a>`
 * (IonButton / IonItem hosts often appear as `generic` when a11y trees
 * do not pierce shadow DOM).
 */

export const E2E4_NATIVE_CTA_SELECTORS = [
  'button.consumer-action-button[type="button"]',
  'button.consumer-fixed-action-bar__button[type="button"]',
  'a.consumer-provider-list__profile-link',
  'button.consumer-provider-list__row-button[type="button"]',
] as const;

/** CSS rules that must stay wired for native CTA styling (no Ion host). */
export const E2E4_CSS_MARKERS = [
  '.consumer-action-button',
  '.consumer-action-button--solid',
  '.consumer-action-button--outline',
  '.consumer-fixed-action-bar__button',
  '.consumer-provider-list__profile-link',
  '.consumer-provider-list__row-button',
] as const;

export const E2E4_UNIT_CASES = [
  {
    id: 'action-button-native-role',
    description: 'ConsumerActionButton renders native <button type=button> with visible name',
  },
  {
    id: 'fixed-action-bar-native-cta',
    description: 'ConsumerFixedActionBar CTA is native button (not IonButton)',
  },
  {
    id: 'provider-profile-light-dom-link',
    description: 'Provider profile row is light-DOM <a>, not IonItem',
  },
  {
    id: 'any-specialist-light-dom-button',
    description: 'Any specialist row is light-DOM <button type=button>',
  },
  {
    id: 'css-markers-present',
    description: 'variables.css keeps e2e-bug.4 native CTA / provider-list rules',
  },
] as const;

export const E2E4_LIVE_CASES = [
  {
    id: 'account-sign-in-native-button',
    description:
      'Unsigned account: Continue with Google is button.consumer-action-button (not ion-button)',
  },
  {
    id: 'home-primary-ctas-native-buttons',
    description:
      'Home Book / Buy gift card / Salon profile / My account are native consumer-action-button',
  },
  {
    id: 'services-continue-native-fixed-bar',
    description:
      'After selecting a service, Continue CTA is button.consumer-fixed-action-bar__button',
  },
  {
    id: 'professionals-profile-link-light-dom',
    description: 'Professionals list exposes a.consumer-provider-list__profile-link',
  },
  {
    id: 'professionals-any-specialist-button',
    description: 'Professionals list exposes button.consumer-provider-list__row-button',
  },
  {
    id: 'assistant-send-native-button',
    description: 'Booking assistant Send control is button.consumer-action-button',
  },
  {
    id: 'no-ion-button-for-fixed-continue',
    description:
      'Services fixed Continue is never nested inside ion-button (host would steal role)',
  },
  {
    id: 'salon-not-found-native-back',
    description: 'Unknown slug not-found page uses native Find a salon button',
  },
] as const;
