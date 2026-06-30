import { RESUME_PENDING_PAYMENT_PROMPTS } from './ai-resume-pending-payment.fixtures.js';
import { rescueResumePendingPaymentIntent } from './ai-resume-pending-payment.util.js';

describe('customer-ai-command resume_pending_payment integration (ai-cmd-customer-4.2.3)', () => {
  it.each(
    RESUME_PENDING_PAYMENT_PROMPTS.map((row) => [row.id, row] as const),
  )('rescues resume_pending_payment for $id', (_id, row) => {
    expect(
      rescueResumePendingPaymentIntent(row.prompt, 'unknown')?.action,
    ).toBe('resume_pending_payment');
  });
});
