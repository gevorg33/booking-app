export type CheckoutSubmitFeedbackKind = 'validation' | 'network' | 'info';

export type CheckoutSubmitFeedback = {
  message: string;
  kind: CheckoutSubmitFeedbackKind;
};

/** e2e-bug.39 — only genuine failed API / network errors get a retry affordance. */
export function shouldShowCheckoutSubmitRetry(
  kind: CheckoutSubmitFeedbackKind,
): boolean {
  return kind === 'network';
}

export function checkoutSubmitFeedbackTone(
  kind: CheckoutSubmitFeedbackKind,
): 'error' | 'neutral' {
  return kind === 'info' ? 'neutral' : 'error';
}
