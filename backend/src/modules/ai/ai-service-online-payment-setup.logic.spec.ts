import { PrepaymentMode } from '../service/entities/service.entity.js';
import { handleExplainServiceOnlinePaymentSetupLogic } from './ai-service-online-payment-setup.logic.js';
import { EXPLAIN_SERVICE_ONLINE_PAYMENT_SETUP_PROMPTS } from './ai-service-online-payment-setup.fixtures.js';

const services = [
  {
    id: 's1',
    name: 'Massage',
    businessId: 'biz-1',
    price: 80,
    isActive: true,
    prepaymentMode: PrepaymentMode.FULL,
    depositAmount: null,
    category: { name: 'Massage' },
  },
  {
    id: 's2',
    name: 'Haircut',
    businessId: 'biz-1',
    price: 40,
    isActive: true,
    prepaymentMode: PrepaymentMode.DEPOSIT,
    depositAmount: 20,
    category: { name: 'Hair' },
  },
  {
    id: 's3',
    name: 'Color',
    businessId: 'biz-1',
    price: 90,
    isActive: true,
    prepaymentMode: PrepaymentMode.NONE,
    depositAmount: null,
    category: { name: 'Hair' },
  },
] as const;

function buildDeps(overrides: Record<string, unknown> = {}) {
  return {
    businessRepo: {
      findOne: jest.fn(async () => ({
        id: 'biz-1',
        settings: {
          publicBooking: { acceptCashPayments: true },
          integrations: { stripe: { connectAccountId: 'acct_test' } },
        },
      })),
    },
    serviceRepo: {
      find: jest.fn(async () => services),
    },
    ...overrides,
  } as any;
}

describe('ai-service-online-payment-setup.logic', () => {
  it.each(EXPLAIN_SERVICE_ONLINE_PAYMENT_SETUP_PROMPTS.slice(0, 3))(
    'summarizes setup for fixture $id',
    async ({ prompt }) => {
      const result = await handleExplainServiceOnlinePaymentSetupLogic(
        buildDeps(),
        'biz-1',
        {},
        prompt,
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('explain_service_online_payment_setup');
      expect(result.summary).toContain('Stripe Connect');
      expect(result.summary).toContain('Cash at venue');
    },
  );

  it('groups services by prepayment mode', async () => {
    const result = await handleExplainServiceOnlinePaymentSetupLogic(
      buildDeps(),
      'biz-1',
      {},
      'Explain service online payment setup',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('Full prepayment: Massage');
    expect(result.summary).toContain('Haircut');
    expect(result.summary).toContain('Online payment off: Color');
    expect(result.details?.onlinePaymentEnabledCount).toBe(2);
    expect(result.details?.stripeConnectConnected).toBe(true);
  });

  it('filters by service name', async () => {
    const result = await handleExplainServiceOnlinePaymentSetupLogic(
      buildDeps(),
      'biz-1',
      {},
      'Explain online payment setup for Haircut service',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('Haircut');
    expect(result.summary).not.toContain('Online payment off: Color');
  });

  it('reports Stripe not connected', async () => {
    const result = await handleExplainServiceOnlinePaymentSetupLogic(
      buildDeps({
        businessRepo: {
          findOne: jest.fn(async () => ({
            id: 'biz-1',
            settings: { publicBooking: { acceptCashPayments: false } },
          })),
        },
      }),
      'biz-1',
      {},
      'Is Stripe Connect ready?',
    );
    expect(result.success).toBe(true);
    expect(result.summary).toContain('not connected');
    expect(result.details?.stripeConnectConnected).toBe(false);
  });

  it('fails when filtered service is missing', async () => {
    const result = await handleExplainServiceOnlinePaymentSetupLogic(
      buildDeps(),
      'biz-1',
      {},
      'Explain online payment setup for Pedicure service',
    );
    expect(result.success).toBe(false);
  });
});
