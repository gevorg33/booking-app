import {
  buildPayOnlineCheckoutNavigate,
  buildPayOnlineCopy,
  enrichPayOnlineParamsFromPrompt,
  hasPayOnlineSlotContext,
  isExplicitPayOnlinePrompt,
  PAY_ONLINE_CHECKOUT_PROMPTS,
  rescuePayOnlineCheckoutIntent,
} from './ai-pay-online-checkout.util.js';
import {
  isPayOnlinePrompt,
  rescuePaymentsIntent,
} from './ai-payments.util.js';
import { PrepaymentMode } from '../service/entities/service.entity.js';

describe('ai-pay-online-checkout.util (ai-cmd-customer-4.2.4 pay_online)', () => {
  it('builds checkout navigate from slot session context', () => {
    expect(
      buildPayOnlineCheckoutNavigate({
        serviceId: 'svc-1',
        employeeId: 'emp-1',
        startTime: '2026-06-12T15:00:00Z',
      }),
    ).toEqual({
      path: 'checkout',
      query: {
        serviceId: 'svc-1',
        startTime: '2026-06-12T15:00:00Z',
        employeeId: 'emp-1',
        payment: 'online',
      },
    });
  });

  it('detects slot context for multi-service checkout', () => {
    expect(
      hasPayOnlineSlotContext({
        cartServiceIds: ['svc-1', 'svc-2'],
        employeeId: 'emp-1',
        startTime: '2026-06-12T15:00:00Z',
      }),
    ).toBe(true);
    expect(
      buildPayOnlineCheckoutNavigate({
        cartServiceIds: ['svc-1', 'svc-2'],
        employeeId: 'emp-1',
        startTime: '2026-06-12T15:00:00Z',
      })?.path,
    ).toBe('multi/checkout');
  });

  it('builds pay-online copy when Stripe is configured', () => {
    const copy = buildPayOnlineCopy({
      onlineEnabled: true,
      stripeConfigured: true,
      service: {
        name: 'Massage',
        prepaymentMode: PrepaymentMode.DEPOSIT,
      },
      hasSlotContext: true,
    });
    expect(copy.available).toBe(true);
    expect(copy.summary).toContain('Stripe');
    expect(copy.summary).toContain('Massage');
  });

  it('fails copy when Stripe is not configured', () => {
    const copy = buildPayOnlineCopy({
      onlineEnabled: false,
      stripeConfigured: false,
      service: null,
      hasSlotContext: false,
    });
    expect(copy.available).toBe(false);
    expect(copy.summary).toContain('not set up');
  });

  it.each(PAY_ONLINE_CHECKOUT_PROMPTS.map((row) => [row.id, row] as const))(
    'detects pay-online prompt $id',
    (_id, row) => {
      expect(isExplicitPayOnlinePrompt(row.prompt)).toBe(true);
      expect(isPayOnlinePrompt(row.prompt)).toBe(true);
    },
  );

  it.each(PAY_ONLINE_CHECKOUT_PROMPTS.map((row) => [row.id, row] as const))(
    'rescues pay-online prompt $id from unknown',
    (_id, row) => {
      const rescued = rescuePayOnlineCheckoutIntent(row.prompt, 'unknown');
      expect(rescued?.action).toBe(row.expectedAction);
    },
  );

  it('does not steal payment-options or explain prompts', () => {
    expect(
      isExplicitPayOnlinePrompt('Which payment method can I use at checkout?'),
    ).toBe(false);
    expect(
      rescuePayOnlineCheckoutIntent(
        'Which payment method can I use at checkout?',
        'unknown',
      ),
    ).toBeNull();
    expect(
      isExplicitPayOnlinePrompt('Why is Stripe required at checkout?'),
    ).toBe(false);
    expect(
      rescuePaymentsIntent('Why is Stripe required at checkout?', 'unknown')
        ?.action,
    ).toBe('explain_why_stripe_required');
  });

  it('enriches serviceName from pay-online prompt', () => {
    expect(
      enrichPayOnlineParamsFromPrompt(
        {},
        'Pay online for massage',
        (prompt) => (/\bmassage\b/i.test(prompt) ? 'massage' : null),
      ).serviceName,
    ).toBe('massage');
  });
});
