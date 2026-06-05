import { ConfigService } from '@nestjs/config';
import { StripeService } from './stripe.service.js';

describe('Sprint 36 — Stripe checkout tax metadata merge', () => {
  let stripeService: StripeService;

  beforeEach(() => {
    const config = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          STRIPE_SECRET_KEY: 'sk_test_123',
          FRONTEND_URL: 'https://app.test',
          STRIPE_CONNECT_CHARGE_MODEL: 'direct',
        };
        return values[key];
      }),
    };
    stripeService = new StripeService(config as unknown as ConfigService);
    stripeService.onModuleInit();
  });

  it('merges session, connect, and tax PaymentIntent metadata on direct charges', () => {
    const [params, opts] = stripeService.connectCheckoutSessionCreate(
      'acct_direct',
      {
        mode: 'payment',
        payment_intent_data: {
          metadata: { draftId: 'draft-1', type: 'booking_payment' },
        },
      },
      { integrations: { stripe: { connectChargeModel: 'direct' } } },
      12000,
      {
        taxEnabled: 'true',
        chargeAmountCents: '12000',
        taxAmount: '20',
      },
    );

    expect(opts).toEqual({ stripeAccount: 'acct_direct' });
    expect(params.payment_intent_data).toEqual({
      metadata: {
        draftId: 'draft-1',
        type: 'booking_payment',
        taxEnabled: 'true',
        chargeAmountCents: '12000',
        taxAmount: '20',
      },
    });
  });

  it('preserves destination transfer_data while merging tax metadata', () => {
    const config = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          STRIPE_SECRET_KEY: 'sk_test_123',
          STRIPE_CONNECT_CHARGE_MODEL: 'destination',
        };
        return values[key];
      }),
    };
    const destinationStripe = new StripeService(
      config as unknown as ConfigService,
    );
    destinationStripe.onModuleInit();

    const [params, opts] = destinationStripe.connectCheckoutSessionCreate(
      'acct_dest',
      {
        mode: 'payment',
        payment_intent_data: {
          metadata: { checkoutKind: 'package_purchase' },
        },
      },
      {},
      22600,
      {
        taxEnabled: 'true',
        chargeAmountCents: '22600',
        taxRuleCount: '2',
      },
    );

    expect(opts).toEqual({});
    expect(params.payment_intent_data).toEqual({
      transfer_data: { destination: 'acct_dest' },
      metadata: {
        checkoutKind: 'package_purchase',
        taxEnabled: 'true',
        chargeAmountCents: '22600',
        taxRuleCount: '2',
      },
    });
  });

  it('tax PaymentIntent metadata overrides duplicate session metadata keys', () => {
    const [params] = stripeService.connectCheckoutSessionCreate(
      'acct_1',
      {
        payment_intent_data: {
          metadata: { taxEnabled: 'false', chargeAmountCents: '10000' },
        },
      },
      { integrations: { stripe: { connectChargeModel: 'direct' } } },
      12000,
      { taxEnabled: 'true', chargeAmountCents: '12000', taxAmount: '20' },
    );

    expect(params.payment_intent_data).toEqual({
      metadata: {
        taxEnabled: 'true',
        chargeAmountCents: '12000',
        taxAmount: '20',
      },
    });
  });

  it('includes tax metadata when no session payment_intent_data is provided', () => {
    const [params] = stripeService.connectCheckoutSessionCreate(
      'acct_1',
      { mode: 'payment' },
      { integrations: { stripe: { connectChargeModel: 'direct' } } },
      10000,
      { taxEnabled: 'false', chargeAmountCents: '10000' },
    );

    expect(params.payment_intent_data).toEqual({
      metadata: {
        taxEnabled: 'false',
        chargeAmountCents: '10000',
      },
    });
  });

  it('adds application_fee_amount on direct charges when platform fee is configured', () => {
    const config = {
      get: jest.fn((key: string) => {
        const values: Record<string, string> = {
          STRIPE_SECRET_KEY: 'sk_test_123',
          STRIPE_CONNECT_PLATFORM_FEE_PERCENT: '10',
          STRIPE_CONNECT_CHARGE_MODEL: 'direct',
        };
        return values[key];
      }),
    };
    const feeStripe = new StripeService(config as unknown as ConfigService);
    feeStripe.onModuleInit();

    const [params] = feeStripe.connectCheckoutSessionCreate(
      'acct_fee',
      { mode: 'payment' },
      { integrations: { stripe: { connectChargeModel: 'direct' } } },
      12000,
      { taxEnabled: 'true', chargeAmountCents: '12000' },
    );

    expect(params.payment_intent_data).toEqual({
      application_fee_amount: 1200,
      metadata: {
        taxEnabled: 'true',
        chargeAmountCents: '12000',
      },
    });
  });
});
