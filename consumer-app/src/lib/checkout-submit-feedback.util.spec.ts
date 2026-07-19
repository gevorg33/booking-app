import { describe, expect, it } from 'vitest';
import {
  checkoutSubmitFeedbackTone,
  shouldShowCheckoutSubmitRetry,
  type CheckoutSubmitFeedbackKind,
} from './checkout-submit-feedback.util.js';

const RETRY_CASES: ReadonlyArray<{
  id: string;
  kind: CheckoutSubmitFeedbackKind;
  retry: boolean;
  tone: 'error' | 'neutral';
}> = [
  {
    id: 'e2e-bug.39-validation-contact',
    kind: 'validation',
    retry: false,
    tone: 'error',
  },
  {
    id: 'e2e-bug.39-validation-subscription',
    kind: 'validation',
    retry: false,
    tone: 'error',
  },
  {
    id: 'e2e-bug.39-info-payment-return',
    kind: 'info',
    retry: false,
    tone: 'neutral',
  },
  {
    id: 'e2e-bug.39-info-offline-queued',
    kind: 'info',
    retry: false,
    tone: 'neutral',
  },
  {
    id: 'e2e-bug.39-network-api-failure',
    kind: 'network',
    retry: true,
    tone: 'error',
  },
];

describe('checkout-submit-feedback.util (e2e-bug.39)', () => {
  it.each(RETRY_CASES.map((row) => [row.id, row] as const))(
    '%s',
    (_id, row) => {
      expect(shouldShowCheckoutSubmitRetry(row.kind)).toBe(row.retry);
      expect(checkoutSubmitFeedbackTone(row.kind)).toBe(row.tone);
    },
  );
});
