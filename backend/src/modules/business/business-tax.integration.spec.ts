import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BusinessService } from './business.service.js';
import { PublicBookingService } from '../public-booking/public-booking.service.js';
import { StripeIntegrationService } from '../billing/stripe-integration.service.js';
import { MultiServiceBookingsService } from '../multi-service-bookings/multi-service-bookings.service.js';
import { CheckoutPricingService } from '../promo-codes/checkout-pricing.service.js';
import { LoyaltyService } from '../loyalty/loyalty.service.js';
import { PromoCodesService } from '../promo-codes/promo-codes.service.js';
import { GiftCardsService } from '../gift-cards/gift-cards.service.js';
import type { Business } from './entities/business.entity.js';
import { makeBusiness } from './entities/business.test-fixture.js';

function buildPublicBookingService(): PublicBookingService {
  const stripeIntegrationService = {
    isConnectReady: jest.fn().mockReturnValue(false),
  };
  const config = {
    get: jest.fn((key: string) =>
      key === 'FRONTEND_URL' ? 'https://app.test' : undefined,
    ),
  };
  const multiServiceBookingsService = new MultiServiceBookingsService(
    { create: jest.fn(), save: jest.fn() } as never,
    { findOne: jest.fn(), save: jest.fn() } as never,
    { find: jest.fn() } as never,
  );
  return new PublicBookingService(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    stripeIntegrationService as unknown as StripeIntegrationService,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    multiServiceBookingsService,
    {} as never,
    {} as never,
    config as unknown as ConfigService,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  
    // e2e-bug: PublicBookingService gained four repositories;
    // `undefined as never` keeps the runtime identical to omitting them.
    undefined as never,
    undefined as never,
    undefined as never,
    undefined as never);
}

const baseBusiness = (settings: Record<string, unknown>): Business =>
  makeBusiness({
    id: 'biz-1',
    name: 'Salon',
    slug: 'salon',
    timezone: 'UTC',
    isActive: true,
    settings: {
      locale: 'en',
      branding: { primaryColor: '#000' },
      publicBooking: { enabled: true },
      ...settings,
    },
  });

describe('Sprint 36 — business tax integration', () => {
  const businessRepo = {
    findOne: jest.fn(),
    save: jest.fn(async (b: unknown) => b),
  };
  const memberRepo = { find: jest.fn() };
  const businessService = new BusinessService(
    businessRepo as never,
    memberRepo as never,
  );
  const publicBookingService = buildPublicBookingService();

  const loyaltyService = {
    getOrCreate: jest.fn(),
    pointsToCurrency: jest.fn(),
    calculateEarnPoints: jest.fn(),
    redeem: jest.fn(),
  };
  const promoCodesService = {
    findValidForCheckout: jest.fn(),
    calculateDiscount: jest.fn(),
    recordUse: jest.fn(),
  };
  const giftCardsService = {
    validate: jest.fn(),
    redeem: jest.fn(),
    redeemServiceCredit: jest.fn(),
  };
  const checkoutPricingService = new CheckoutPricingService(
    promoCodesService as unknown as PromoCodesService,
    loyaltyService as unknown as LoyaltyService,
    giftCardsService as unknown as GiftCardsService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    loyaltyService.getOrCreate.mockResolvedValue({ pointsBalance: 0 });
    loyaltyService.calculateEarnPoints.mockImplementation(
      (cash: number) => cash,
    );
    promoCodesService.findValidForCheckout.mockResolvedValue(null);
  });

  describe('settings persistence', () => {
    it('persists enabled exclusive tax settings on business update', async () => {
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        settings: { locale: 'en' },
      });

      await businessService.update('biz-1', {
        settings: {
          tax: {
            enabled: true,
            name: 'VAT',
            rate: 20,
            model: 'exclusive',
            taxNumber: 'AM-123',
          },
        },
      });

      expect(businessRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({
            tax: {
              enabled: true,
              name: 'VAT',
              rate: 20,
              model: 'exclusive',
              taxNumber: 'AM-123',
            },
          }),
        }),
      );
    });

    it('merges partial tax updates with existing settings', async () => {
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        settings: {
          tax: {
            enabled: true,
            name: 'VAT',
            rate: 20,
            model: 'exclusive',
            taxNumber: 'OLD',
          },
        },
      });

      await businessService.update('biz-1', {
        settings: { tax: { model: 'inclusive', taxNumber: 'NEW-1' } },
      });

      expect(businessRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({
            tax: expect.objectContaining({
              enabled: true,
              name: 'VAT',
              rate: 20,
              model: 'inclusive',
              taxNumber: 'NEW-1',
            }),
          }),
        }),
      );
    });

    it('rejects enabled tax without a positive rate', async () => {
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        settings: {},
      });

      await expect(
        businessService.update('biz-1', {
          settings: { tax: { enabled: true, rate: 0 } },
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects enabled stacked tax when all rules have zero rate', async () => {
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        settings: {},
      });

      await expect(
        businessService.update('biz-1', {
          settings: {
            tax: {
              enabled: true,
              rules: [
                { id: 'gst', name: 'GST', rate: 0 },
                { id: 'pst', name: 'PST', rate: 0 },
              ],
            },
          },
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('public profile tax', () => {
    it.each([
      {
        id: 'exclusive-vat',
        settings: {
          tax: {
            enabled: true,
            name: 'VAT',
            rate: 20,
            model: 'exclusive',
          },
        },
        tax: { enabled: true, name: 'VAT', rate: 20, model: 'exclusive' },
      },
      {
        id: 'inclusive-gst',
        settings: {
          tax: {
            enabled: true,
            name: 'GST',
            rate: 5,
            model: 'inclusive',
          },
        },
        tax: { enabled: true, name: 'GST', rate: 5, model: 'inclusive' },
      },
      {
        id: 'disabled',
        settings: { tax: { enabled: false, rate: 20 } },
        tax: undefined,
      },
      {
        id: 'zero-rate',
        settings: { tax: { enabled: true, rate: 0 } },
        tax: undefined,
      },
      {
        id: 'stacked-exclusive',
        settings: {
          tax: {
            enabled: true,
            name: 'Tax',
            rate: 13,
            model: 'exclusive',
            rules: [
              { id: 'gst', name: 'GST', rate: 5 },
              { id: 'pst', name: 'PST', rate: 8 },
            ],
          },
        },
        tax: {
          enabled: true,
          name: 'GST + PST',
          rate: 13,
          model: 'exclusive',
          rules: [
            { name: 'GST', rate: 5 },
            { name: 'PST', rate: 8 },
          ],
        },
      },
    ])('toPublicProfile resolves $id', ({ settings, tax }) => {
      const profile = publicBookingService.toPublicProfile(
        baseBusiness(settings),
      );
      if (tax) {
        expect(profile.tax).toEqual(tax);
      } else {
        expect(profile.tax).toBeUndefined();
      }
    });
  });

  describe('checkout pricing tax', () => {
    it('adds exclusive tax on top of discounted amount due', async () => {
      const result = await checkoutPricingService.calculate({
        businessId: 'biz-1',
        servicePrice: 100,
        prepaymentAmount: 100,
        currency: 'USD',
        earnPercentCashback: 0,
        tax: {
          enabled: true,
          name: 'VAT',
          rate: 20,
          model: 'exclusive',
        },
      });

      expect(result.taxEnabled).toBe(true);
      expect(result.taxAmount).toBe(20);
      expect(result.netAmount).toBe(100);
      expect(result.amountDue).toBe(120);
    });

    it('keeps inclusive gross amount while exposing tax breakdown', async () => {
      const result = await checkoutPricingService.calculate({
        businessId: 'biz-1',
        servicePrice: 120,
        prepaymentAmount: 120,
        currency: 'USD',
        earnPercentCashback: 0,
        tax: {
          enabled: true,
          name: 'VAT',
          rate: 20,
          model: 'inclusive',
        },
      });

      expect(result.taxEnabled).toBe(true);
      expect(result.taxAmount).toBe(20);
      expect(result.netAmount).toBe(100);
      expect(result.amountDue).toBe(120);
    });

    it('applies per-service tax override on checkout', async () => {
      const result = await checkoutPricingService.calculate({
        businessId: 'biz-1',
        servicePrice: 100,
        prepaymentAmount: 100,
        currency: 'USD',
        earnPercentCashback: 0,
        tax: {
          enabled: true,
          name: 'VAT',
          rate: 20,
          model: 'exclusive',
          serviceRatePercent: 5,
        },
      });

      expect(result.taxRate).toBe(5);
      expect(result.taxAmount).toBe(5);
      expect(result.amountDue).toBe(105);
    });

    it.each([
      {
        id: 'stacked-exclusive',
        input: {
          servicePrice: 100,
          prepaymentAmount: 100,
          tax: {
            enabled: true,
            name: 'Tax',
            rate: 13,
            model: 'exclusive' as const,
            rules: [
              { id: 'gst', name: 'GST', rate: 5 },
              { id: 'pst', name: 'PST', rate: 8 },
            ],
          },
        },
        expected: {
          taxName: 'GST + PST',
          taxAmount: 13,
          amountDue: 113,
          taxRules: [
            { id: 'gst', name: 'GST', rate: 5, amount: 5 },
            { id: 'pst', name: 'PST', rate: 8, amount: 8 },
          ],
        },
      },
      {
        id: 'stacked-inclusive',
        input: {
          servicePrice: 113,
          prepaymentAmount: 113,
          tax: {
            enabled: true,
            name: 'Tax',
            rate: 13,
            model: 'inclusive' as const,
            rules: [
              { id: 'gst', name: 'GST', rate: 5 },
              { id: 'pst', name: 'PST', rate: 8 },
            ],
          },
        },
        expected: {
          taxName: 'GST + PST',
          taxAmount: 13,
          netAmount: 100,
          amountDue: 113,
          taxRules: [
            { id: 'gst', name: 'GST', rate: 5, amount: 5 },
            { id: 'pst', name: 'PST', rate: 8, amount: 8 },
          ],
        },
      },
    ])('checkout pricing for $id stacked tax', async ({ input, expected }) => {
      const result = await checkoutPricingService.calculate({
        businessId: 'biz-1',
        currency: 'USD',
        earnPercentCashback: 0,
        ...input,
      });

      expect(result.taxEnabled).toBe(true);
      expect(result.taxName).toBe(expected.taxName);
      expect(result.taxAmount).toBe(expected.taxAmount);
      expect(result.amountDue).toBe(expected.amountDue);
      if (expected.netAmount != null) {
        expect(result.netAmount).toBe(expected.netAmount);
      }
      expect(result.taxRules).toEqual(expected.taxRules);
    });
  });

  describe('stacked tax persistence', () => {
    it('persists stacked tax rules on business update', async () => {
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        settings: { locale: 'en' },
      });

      await businessService.update('biz-1', {
        settings: {
          tax: {
            enabled: true,
            name: 'Tax',
            rate: 13,
            model: 'exclusive',
            rules: [
              { id: 'gst', name: 'GST', rate: 5 },
              { id: 'pst', name: 'PST', rate: 8 },
            ],
          },
        },
      });

      expect(businessRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({
            tax: {
              enabled: true,
              name: 'Tax',
              rate: 13,
              model: 'exclusive',
              taxNumber: '',
              rules: [
                { id: 'gst', name: 'GST', rate: 5 },
                { id: 'pst', name: 'PST', rate: 8 },
              ],
            },
          }),
        }),
      );
    });
  });
});
