import { PaymentStatus } from '../booking/entities/booking.entity.js';
import { PrepaymentMode } from '../service/entities/service.entity.js';
import {
  EXPLAIN_CANCEL_POLICY_PROMPTS,
  EXPLAIN_CANCEL_POLICY_RESCUE_SCENARIOS,
} from './ai-explain-cancel-policy.fixtures.js';
import { EXPLAIN_CANCEL_POLICY_MULTILINGUAL_SCENARIOS } from './ai-explain-cancel-policy-multilingual.fixtures.js';
import {
  assembleCancelPolicySummary,
  buildCancelPolicyDepositContext,
  buildCancelPolicySettingsLines,
  buildDepositForfeitureLines,
  buildGeneralDepositForfeitureLine,
  isExplainCancelPolicyDepositForfeitureFocus,
  isExplainCancelPolicyIntent,
  isExplainCancelPolicyPrompt,
  parseExplainCancelPolicyFromPrompt,
  rescueExplainCancelPolicyIntent,
} from './ai-explain-cancel-policy.util.js';
import { DEFAULT_CUSTOMER_SELF_SERVICE_SETTINGS } from '../../common/utils/customer-self-service.util.js';

describe('ai-explain-cancel-policy.util (ai-cmd-customer-4.4.4)', () => {
  it.each(EXPLAIN_CANCEL_POLICY_PROMPTS)('detects prompt $id', ({ prompt }) => {
    expect(isExplainCancelPolicyPrompt(prompt)).toBe(true);
    expect(parseExplainCancelPolicyFromPrompt(prompt)).not.toBeNull();
  });

  it.each(EXPLAIN_CANCEL_POLICY_MULTILINGUAL_SCENARIOS)(
    'detects multilingual prompt $id',
    ({ prompt }) => {
      expect(isExplainCancelPolicyPrompt(prompt)).toBe(true);
    },
  );

  it.each(
    EXPLAIN_CANCEL_POLICY_RESCUE_SCENARIOS.filter(
      (s) => !('expectNoRescue' in s),
    ),
  )('rescues $id', ({ prompt, misclassifiedAction, expectedAction }) => {
    expect(
      rescueExplainCancelPolicyIntent(prompt, misclassifiedAction),
    ).toEqual({
      action: expectedAction,
      rescueReason: 'cancel_policy',
    });
  });

  it.each(
    EXPLAIN_CANCEL_POLICY_RESCUE_SCENARIOS.filter((s) => 'expectNoRescue' in s),
  )(
    'does not rescue deposit prompt to cancel policy for $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueExplainCancelPolicyIntent(prompt, misclassifiedAction),
      ).toBeNull();
    },
  );

  it('flags deposit forfeiture focus prompts', () => {
    expect(
      isExplainCancelPolicyDepositForfeitureFocus(
        'Do I lose my deposit if I cancel?',
      ),
    ).toBe(true);
    expect(
      isExplainCancelPolicyDepositForfeitureFocus(
        'Explain cancellation policy',
      ),
    ).toBe(false);
  });

  it('does not steal amount-due or deposit-forfeiture prompts', () => {
    expect(
      isExplainCancelPolicyPrompt('Is the 50% deposit $40 for facial?'),
    ).toBe(false);
    expect(isExplainCancelPolicyPrompt('Is the 50% refundable?')).toBe(false);
    expect(
      isExplainCancelPolicyPrompt('Do I lose my deposit if I cancel?'),
    ).toBe(false);
  });

  it('builds deposit forfeiture lines for paid deposit inside notice window', () => {
    const lines = buildDepositForfeitureLines({
      minimumNoticeHours: 24,
      prepaymentMode: 'deposit',
      prepaymentDueAmount: 40,
      servicePrice: 80,
      paymentStatus: PaymentStatus.PAID,
      cancelAllowedNow: false,
      cancelBlockedReason:
        'Changes must be made at least 24 hours before your appointment',
      focusDepositForfeiture: true,
    });
    expect(lines.join(' ')).toMatch(/forfeit/i);
    expect(lines.join(' ')).toMatch(/\$40\.00 deposit/);
  });

  it('builds refund guidance when cancel is allowed', () => {
    const lines = buildDepositForfeitureLines({
      minimumNoticeHours: 24,
      prepaymentMode: 'deposit',
      prepaymentDueAmount: 50,
      servicePrice: 100,
      paymentStatus: PaymentStatus.PAID,
      cancelAllowedNow: true,
      focusDepositForfeiture: true,
    });
    expect(lines.join(' ')).toMatch(/Refunds for deposits/i);
  });

  it('builds general deposit forfeiture line from business defaults', () => {
    const line = buildGeneralDepositForfeitureLine(
      DEFAULT_CUSTOMER_SELF_SERVICE_SETTINGS,
      { acceptCashPayments: false, defaultServicePrepaymentMode: 'deposit' },
    );
    expect(line).toMatch(/50% deposit prepayment/i);
  });

  it('builds booking deposit context from service prepayment mode', () => {
    const ctx = buildCancelPolicyDepositContext({
      businessSettings: {
        publicBooking: {
          customerSelfService: DEFAULT_CUSTOMER_SELF_SERVICE_SETTINGS,
          defaultServicePrepaymentMode: 'deposit',
        },
      },
      booking: {
        startTime: new Date('2030-01-15T14:00:00.000Z'),
        status: 'confirmed',
        paymentStatus: PaymentStatus.PAID,
        service: {
          name: 'Massage',
          price: 80,
          prepaymentMode: PrepaymentMode.DEPOSIT,
          depositAmount: null,
        },
      },
      focusDepositForfeiture: true,
      now: new Date('2030-01-01T00:00:00.000Z'),
    });
    expect(ctx.prepaymentDueAmount).toBe(40);
    expect(ctx.cancelAllowedNow).toBe(true);
  });

  it('builds no-deposit lines when service has no prepayment', () => {
    const lines = buildDepositForfeitureLines({
      minimumNoticeHours: 24,
      prepaymentMode: 'none',
      prepaymentDueAmount: 0,
      focusDepositForfeiture: true,
      cancelAllowedNow: true,
    });
    expect(lines.join(' ')).toMatch(/no deposit to forfeit/i);
  });

  it('builds unpaid deposit guidance', () => {
    const lines = buildDepositForfeitureLines({
      minimumNoticeHours: 24,
      prepaymentMode: 'deposit',
      prepaymentDueAmount: 25,
      servicePrice: 50,
      paymentStatus: PaymentStatus.PENDING,
      focusDepositForfeiture: true,
    });
    expect(lines.join(' ')).toMatch(
      /No online payment has been collected yet/i,
    );
  });

  it('builds full prepayment label', () => {
    const lines = buildDepositForfeitureLines({
      minimumNoticeHours: 24,
      prepaymentMode: 'full',
      prepaymentDueAmount: 80,
      servicePrice: 80,
      paymentStatus: PaymentStatus.PAID,
      cancelAllowedNow: false,
      focusDepositForfeiture: true,
    });
    expect(lines.join(' ')).toMatch(/full prepayment/i);
  });

  it('builds general full prepayment forfeiture line', () => {
    const line = buildGeneralDepositForfeitureLine(
      DEFAULT_CUSTOMER_SELF_SERVICE_SETTINGS,
      { acceptCashPayments: false, defaultServicePrepaymentMode: 'full' },
    );
    expect(line).toMatch(/full prepayment/i);
  });

  it('uses fallback focus hint when no deposit context exists', () => {
    const summary = assembleCancelPolicySummary(
      buildCancelPolicySettingsLines(DEFAULT_CUSTOMER_SELF_SERVICE_SETTINGS),
      [],
      null,
      true,
    );
    expect(summary).toMatch(/specific booking/i);
  });

  it('recognizes explain_cancel_policy intent', () => {
    expect(isExplainCancelPolicyIntent('explain_cancel_policy')).toBe(true);
    expect(isExplainCancelPolicyIntent('cancel_my_booking')).toBe(false);
  });
});
