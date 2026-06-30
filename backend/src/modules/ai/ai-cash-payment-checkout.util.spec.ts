import { PrepaymentMode } from '../service/entities/service.entity.js';
import {
  buildPayCashAtVisitCopy,
  buildPaymentMethodOptionsCopy,
  CASH_PAYMENT_CHECKOUT_PROMPTS,
  isAskPaymentOptionsPrompt,
  isExplicitPayCashAtVisitPrompt,
  rescueCashPaymentCheckoutIntent,
  resolveServiceCashAvailability,
} from './ai-cash-payment-checkout.util.js';
import {
  isChoosePaymentMethodPrompt,
  isPayCashAtVisitPrompt,
  rescuePaymentsIntent,
} from './ai-payments.util.js';

describe('ai-cash-payment-checkout.util (ai-cmd-ext-7.3)', () => {
  it('resolves cash availability from business and service prepayment policy', () => {
    expect(
      resolveServiceCashAvailability(null, {
        acceptCashPayments: false,
        onlineEnabled: true,
      }).cashAtVenueAllowed,
    ).toBe(false);
    expect(
      resolveServiceCashAvailability(
        {
          name: 'Massage',
          prepaymentMode: PrepaymentMode.NONE,
        },
        { acceptCashPayments: true, onlineEnabled: true },
      ).cashForFullVisit,
    ).toBe(true);
    expect(
      resolveServiceCashAvailability(
        {
          name: 'Color',
          prepaymentMode: PrepaymentMode.FULL,
        },
        { acceptCashPayments: true, onlineEnabled: true },
      ).prepaymentBlocksCashOnly,
    ).toBe(true);
    expect(
      resolveServiceCashAvailability(
        {
          name: 'Facial',
          prepaymentMode: PrepaymentMode.DEPOSIT,
        },
        { acceptCashPayments: true, onlineEnabled: true },
      ).cashAtVenueAllowed,
    ).toBe(true);
  });

  it('builds payment option copy when cash is disabled', () => {
    const copy = buildPaymentMethodOptionsCopy({
      onlineEnabled: true,
      acceptCashPayments: false,
      service: null,
    });
    expect(copy.summary).toContain('cash at venue is not enabled');
    expect(copy.options.find((option) => option.method === 'cash')).toBeUndefined();
  });

  it('builds deposit-aware pay-cash copy', () => {
    const blocked = buildPayCashAtVisitCopy({
      acceptCashPayments: true,
      onlineEnabled: true,
      service: {
        name: 'Color',
        prepaymentMode: PrepaymentMode.FULL,
      },
    });
    expect(blocked.available).toBe(false);
    expect(blocked.summary).toContain('full payment online');

    const allowed = buildPayCashAtVisitCopy({
      acceptCashPayments: true,
      onlineEnabled: true,
      service: {
        name: 'Massage',
        prepaymentMode: PrepaymentMode.NONE,
      },
    });
    expect(allowed.available).toBe(true);
    expect(allowed.summary).toContain('Massage');
  });

  it.each(CASH_PAYMENT_CHECKOUT_PROMPTS.map((row) => [row.id, row] as const))(
    'detects cash checkout prompt $id',
    (_id, row) => {
      if (row.expectedAction === 'choose_payment_method') {
        expect(
          isAskPaymentOptionsPrompt(row.prompt) ||
            isChoosePaymentMethodPrompt(row.prompt),
        ).toBe(true);
        expect(isPayCashAtVisitPrompt(row.prompt)).toBe(false);
      } else {
        expect(isExplicitPayCashAtVisitPrompt(row.prompt)).toBe(true);
        expect(isPayCashAtVisitPrompt(row.prompt)).toBe(true);
      }
    },
  );

  it.each(CASH_PAYMENT_CHECKOUT_PROMPTS.map((row) => [row.id, row] as const))(
    'rescues cash checkout prompt $id from unknown',
    (_id, row) => {
      const rescued = rescuePaymentsIntent(row.prompt, 'unknown');
      expect(rescued?.action).toBe(row.expectedAction);
    },
  );

  it('routes cash checkout prompts through dedicated rescue', () => {
    expect(
      rescueCashPaymentCheckoutIntent('Can I pay cash for massage?', 'unknown'),
    ).toBeNull();
    expect(
      rescuePaymentsIntent('Can I pay cash for massage?', 'unknown')?.action,
    ).toBe('explain_payment_options_for_service');
    expect(
      rescueCashPaymentCheckoutIntent('Pay cash at visit', 'unknown')?.action,
    ).toBe('pay_cash_at_visit');
  });
});
