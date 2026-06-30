import { PrepaymentMode } from '../service/entities/service.entity.js';
import {
  buildPublicBookingCheckoutSummary,
  handleExplainPublicBookingCheckoutLogic,
} from './ai-explain-public-booking-checkout.logic.js';

describe('ai-explain-public-booking-checkout.logic', () => {
  describe('buildPublicBookingCheckoutSummary', () => {
    it('describes stripe, cash, and gift cards together', () => {
      const summary = buildPublicBookingCheckoutSummary({
        stripeConnected: true,
        acceptCashPayments: true,
        giftCardPurchaseEnabled: true,
        fullPrepaymentCount: 1,
        depositPrepaymentCount: 1,
        totalActiveServices: 3,
        defaultServicePrepaymentMode: PrepaymentMode.DEPOSIT,
        defaultServiceDepositPercent: 50,
      });
      expect(summary).toContain('Stripe Connect is connected');
      expect(summary).toContain('Cash at venue is enabled');
      expect(summary).toContain('Gift cards at checkout');
      expect(summary).toContain('Gift card sales are enabled');
      expect(summary).toContain('2 of 3 active service(s)');
      expect(summary).toContain('50% deposit');
    });

    it('describes disabled paths', () => {
      const summary = buildPublicBookingCheckoutSummary({
        stripeConnected: false,
        acceptCashPayments: false,
        giftCardPurchaseEnabled: false,
        fullPrepaymentCount: 0,
        depositPrepaymentCount: 0,
        totalActiveServices: 2,
      });
      expect(summary).toContain('Stripe Connect is not connected');
      expect(summary).toContain('Cash at venue is disabled');
      expect(summary).toContain('Gift card purchase on public booking is off');
      expect(summary).toContain('No active services require online prepayment');
    });
  });

  describe('handleExplainPublicBookingCheckoutLogic', () => {
    const businessRepo = {
      findOne: jest.fn(),
    };
    const serviceRepo = {
      find: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        settings: {
          publicBooking: { acceptCashPayments: true },
          giftCards: { purchaseEnabled: true },
        },
      });
      serviceRepo.find.mockResolvedValue([
        {
          id: 'svc-1',
          name: 'Massage',
          prepaymentMode: PrepaymentMode.FULL,
          isActive: true,
        },
        {
          id: 'svc-2',
          name: 'Facial',
          prepaymentMode: PrepaymentMode.NONE,
          isActive: true,
        },
      ]);
    });

    it('returns checkout summary for valid explain prompt', async () => {
      const result = await handleExplainPublicBookingCheckoutLogic(
        { businessRepo: businessRepo as any, serviceRepo: serviceRepo as any },
        'biz-1',
        {},
        'Explain public booking checkout payment options',
      );
      expect(result.success).toBe(true);
      expect(result.action).toBe('explain_public_booking_checkout');
      expect(result.summary).toContain('Public booking checkout');
      expect(result.details?.navigate).toEqual({
        path: '/dashboard/billing',
        label: 'Open Billing & checkout settings',
      });
    });

    it('fails for unrelated prompt', async () => {
      const result = await handleExplainPublicBookingCheckoutLogic(
        { businessRepo: businessRepo as any, serviceRepo: serviceRepo as any },
        'biz-1',
        {},
        'Enable cash payments',
      );
      expect(result.success).toBe(false);
    });
  });
});
