import { PrepaymentMode } from '../service/entities/service.entity.js';
import { handlePayAtVenueFallbackLogic } from './ai-pay-at-venue-fallback.logic.js';
import {
  PAY_AT_VENUE_FALLBACK_HANDLER_FIXTURES,
  PAY_AT_VENUE_FALLBACK_PROMPTS,
} from './ai-pay-at-venue-fallback.fixtures.js';

describe('ai-pay-at-venue-fallback.logic (ai-cmd-customer-4.18.2)', () => {
  const businessRepo = { findOne: jest.fn() };
  const serviceRepo = { findOne: jest.fn() };
  const deps = { businessRepo, serviceRepo };

  beforeEach(() => {
    jest.clearAllMocks();
    serviceRepo.findOne.mockResolvedValue({
      id: 'svc-haircut',
      name: 'Haircut',
      prepaymentMode: PrepaymentMode.NONE,
    });
  });

  it.each(PAY_AT_VENUE_FALLBACK_HANDLER_FIXTURES)(
    'handles $id',
    async ({ acceptCashPayments, onlineEnabled, prepaymentMode }) => {
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        settings: {
          publicBooking: { acceptCashPayments },
          integrations: onlineEnabled
            ? { stripe: { connectAccountId: 'acct_test' } }
            : {},
        },
      });
      serviceRepo.findOne.mockResolvedValue({
        id: 'svc-haircut',
        name: 'Haircut',
        prepaymentMode,
      });

      const result = await handlePayAtVenueFallbackLogic(
        deps,
        'biz-1',
        {
          serviceId: 'svc-haircut',
          startTime: '2026-06-25T14:00:00.000Z',
          isActivationPath: prepaymentMode === 'none',
        },
        'Skip online payment',
      );

      if (!acceptCashPayments || prepaymentMode === 'full') {
        expect(result.success).toBe(false);
        return;
      }

      expect(result.success).toBe(true);
      expect(result.action).toBe('pay_at_venue_fallback');
      expect(result.details?.payAtVenue).toBe(true);
      expect(result.details?.skipOnlinePayment).toBe(true);
      expect(result.details?.navigate).toEqual(
        expect.objectContaining({ path: 'checkout' }),
      );
    },
  );

  it.each(PAY_AT_VENUE_FALLBACK_PROMPTS.slice(0, 4))(
    'returns success for fixture $id',
    async ({ prompt }) => {
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        settings: {
          publicBooking: { acceptCashPayments: true },
          integrations: { stripe: { connectAccountId: 'acct_test' } },
        },
      });

      const result = await handlePayAtVenueFallbackLogic(
        deps,
        'biz-1',
        {},
        prompt,
      );

      expect(result.success).toBe(true);
      expect(result.action).toBe('pay_at_venue_fallback');
    },
  );

  it('uses activation copy when activationPath is set', async () => {
    businessRepo.findOne.mockResolvedValue({
      id: 'biz-1',
      settings: {
        publicBooking: { acceptCashPayments: true },
        integrations: { stripe: { connectAccountId: 'acct_test' } },
      },
    });

    const result = await handlePayAtVenueFallbackLogic(
      deps,
      'biz-1',
      { isActivationPath: true },
      'Pay at salon instead',
    );

    expect(result.summary).toContain('Pay at visit selected');
  });

  it('clarifies when prompt does not match', async () => {
    const result = await handlePayAtVenueFallbackLogic(
      deps,
      'biz-1',
      {},
      'Book a haircut tomorrow',
    );
    expect(result.success).toBe(false);
    expect(result.details?.clarify).toBe(true);
  });
});
