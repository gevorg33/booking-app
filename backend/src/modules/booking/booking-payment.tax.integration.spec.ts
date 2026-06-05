import { BookingPaymentService } from './booking-payment.service.js';
import { PrepaymentMode } from '../service/entities/service.entity.js';

describe('Sprint 36 — booking payment tax integration', () => {
  const draftRepo = { save: jest.fn(), create: jest.fn(), findOne: jest.fn() };
  const serviceRepo = { findOne: jest.fn() };
  const businessRepo = { findOne: jest.fn() };
  const stripeService = {
    isConfigured: false,
    frontendUrl: 'https://app.test',
    client: {
      checkout: { sessions: { create: jest.fn(), retrieve: jest.fn() } },
    },
    connectRequestOptions: jest.fn(),
    usesDestinationCharges: jest.fn(),
    connectCheckoutSessionCreate: jest.fn(),
  };
  const stripeIntegrationService = {
    assertCanAcceptOnlinePayments: jest.fn(),
    resolveConnectAccountId: jest.fn(),
  };
  const eventStore = { publish: jest.fn() };
  const publicBookingService = {
    createBooking: jest.fn(),
    bookPackage: jest.fn(),
    bookMultiService: jest.fn(),
  };
  const checkoutPricingService = { calculate: jest.fn() };
  const subscriptionsService = { getPlanCheckoutDetails: jest.fn() };
  const packagesService = { previewPackagePricing: jest.fn() };
  const multiServiceBookingsService = { previewTotals: jest.fn() };
  const giftCardPurchaseService = {
    quotePurchase: jest.fn(),
    fulfillPurchase: jest.fn(),
  };

  const service = new BookingPaymentService(
    draftRepo as never,
    serviceRepo as never,
    businessRepo as never,
    stripeService as never,
    stripeIntegrationService as never,
    {} as never,
    {} as never,
    eventStore as never,
    publicBookingService as never,
    checkoutPricingService as never,
    subscriptionsService as never,
    packagesService as never,
    multiServiceBookingsService as never,
    giftCardPurchaseService as never,
    {} as never,
  );

  const baseService = {
    id: 'svc-1',
    name: 'Massage',
    price: 100,
    currency: 'USD',
    prepaymentMode: PrepaymentMode.FULL,
    metadata: {},
  };

  beforeEach(() => {
    jest.clearAllMocks();
    checkoutPricingService.calculate.mockResolvedValue({
      servicePrice: 100,
      subtotal: 100,
      amountDue: 120,
      taxEnabled: true,
      taxName: 'VAT',
      taxRate: 20,
      taxModel: 'exclusive',
      taxAmount: 20,
      netAmount: 100,
      promoDiscount: 0,
      giftCardDiscount: 0,
      loyaltyDiscount: 0,
      totalDiscount: 0,
      loyaltyPointsToRedeem: 0,
      pointsToEarn: 0,
      adjustments: [],
    });
  });

  describe('pricingMetadata', () => {
    it('includes tax breakdown when tax is enabled on pricing result', () => {
      expect(
        service.pricingMetadata({
          servicePrice: 100,
          subtotal: 100,
          amountDue: 120,
          taxEnabled: true,
          taxName: 'VAT',
          taxRate: 20,
          taxModel: 'exclusive',
          taxAmount: 20,
          netAmount: 100,
          promoDiscount: 0,
          giftCardDiscount: 0,
          loyaltyDiscount: 0,
          totalDiscount: 0,
          loyaltyPointsToRedeem: 0,
          pointsToEarn: 0,
          adjustments: [],
        } as never),
      ).toEqual({
        pricing: expect.objectContaining({
          amountDue: 120,
          taxEnabled: true,
          taxName: 'VAT',
          taxRate: 20,
          taxModel: 'exclusive',
          taxAmount: 20,
          netAmount: 100,
        }),
        amountPaid: 120,
        cashPaidEligible: 120,
      });
    });

    it('omits tax fields when tax is not enabled on pricing result', () => {
      const metadata = service.pricingMetadata({
        servicePrice: 100,
        subtotal: 100,
        amountDue: 100,
        taxEnabled: false,
        promoDiscount: 0,
        giftCardDiscount: 0,
        loyaltyDiscount: 0,
        totalDiscount: 0,
        loyaltyPointsToRedeem: 0,
        pointsToEarn: 0,
        adjustments: [],
      } as never);

      expect(metadata.pricing).not.toHaveProperty('taxEnabled');
      expect(metadata.pricing).not.toHaveProperty('taxAmount');
      expect(metadata.amountPaid).toBe(100);
    });

    it('includes stacked tax rule breakdown in pricing metadata', () => {
      const metadata = service.pricingMetadata({
        servicePrice: 100,
        subtotal: 100,
        amountDue: 113,
        taxEnabled: true,
        taxName: 'GST + PST',
        taxRate: 13,
        taxModel: 'exclusive',
        taxAmount: 13,
        netAmount: 100,
        taxRules: [
          { id: 'gst', name: 'GST', rate: 5, amount: 5 },
          { id: 'pst', name: 'PST', rate: 8, amount: 8 },
        ],
        promoDiscount: 0,
        giftCardDiscount: 0,
        loyaltyDiscount: 0,
        totalDiscount: 0,
        loyaltyPointsToRedeem: 0,
        pointsToEarn: 0,
        adjustments: [],
      } as never);

      expect(metadata.pricing).toMatchObject({
        taxRules: [
          { id: 'gst', name: 'GST', rate: 5, amount: 5 },
          { id: 'pst', name: 'PST', rate: 8, amount: 8 },
        ],
      });
    });

    it('stores stacked inclusive tax metadata with per-rule breakdown', () => {
      const metadata = service.pricingMetadata({
        servicePrice: 113,
        subtotal: 113,
        amountDue: 113,
        taxEnabled: true,
        taxName: 'GST + PST',
        taxRate: 13,
        taxModel: 'inclusive',
        taxAmount: 13,
        netAmount: 100,
        taxRules: [
          { id: 'gst', name: 'GST', rate: 5, amount: 5 },
          { id: 'pst', name: 'PST', rate: 8, amount: 8 },
        ],
        promoDiscount: 0,
        giftCardDiscount: 0,
        loyaltyDiscount: 0,
        totalDiscount: 0,
        loyaltyPointsToRedeem: 0,
        pointsToEarn: 0,
        adjustments: [],
      } as never);

      expect(metadata.pricing).toMatchObject({
        taxModel: 'inclusive',
        taxAmount: 13,
        amountDue: 113,
        taxRules: [
          { id: 'gst', name: 'GST', rate: 5, amount: 5 },
          { id: 'pst', name: 'PST', rate: 8, amount: 8 },
        ],
      });
      expect(metadata.amountPaid).toBe(113);
    });

    it('stores inclusive tax metadata without changing amountPaid', () => {
      const metadata = service.pricingMetadata({
        servicePrice: 120,
        subtotal: 120,
        amountDue: 120,
        taxEnabled: true,
        taxName: 'GST',
        taxRate: 5,
        taxModel: 'inclusive',
        taxAmount: 5.71,
        netAmount: 114.29,
        promoDiscount: 0,
        giftCardDiscount: 0,
        loyaltyDiscount: 0,
        totalDiscount: 0,
        loyaltyPointsToRedeem: 0,
        pointsToEarn: 0,
        adjustments: [],
      } as never);

      expect(metadata.pricing).toMatchObject({
        taxModel: 'inclusive',
        taxAmount: 5.71,
        amountDue: 120,
      });
      expect(metadata.amountPaid).toBe(120);
    });
  });

  describe('resolveCheckoutPricing tax input', () => {
    it('passes business exclusive tax to checkout pricing', async () => {
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        settings: {
          tax: {
            enabled: true,
            name: 'VAT',
            rate: 20,
            model: 'exclusive',
          },
        },
      });

      await service.resolveCheckoutPricing('biz-1', baseService as never, {
        serviceId: 'svc-1',
        startTime: new Date().toISOString(),
        customer: { name: 'Jane' },
      });

      expect(checkoutPricingService.calculate).toHaveBeenCalledWith(
        expect.objectContaining({
          tax: {
            enabled: true,
            name: 'VAT',
            rate: 20,
            model: 'exclusive',
            serviceRatePercent: null,
          },
        }),
      );
    });

    it('passes stacked business tax rules to checkout pricing', async () => {
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
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

      await service.resolveCheckoutPricing('biz-1', baseService as never, {
        serviceId: 'svc-1',
        startTime: new Date().toISOString(),
        customer: { name: 'Jane' },
      });

      expect(checkoutPricingService.calculate).toHaveBeenCalledWith(
        expect.objectContaining({
          tax: {
            enabled: true,
            name: 'Tax',
            rate: 13,
            model: 'exclusive',
            serviceRatePercent: null,
            rules: [
              { id: 'gst', name: 'GST', rate: 5 },
              { id: 'pst', name: 'PST', rate: 8 },
            ],
          },
        }),
      );
    });

    it('passes per-service tax override over stacked business rules', async () => {
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
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

      await service.resolveCheckoutPricing(
        'biz-1',
        { ...baseService, metadata: { taxRatePercent: 7 } } as never,
        {
          serviceId: 'svc-1',
          startTime: new Date().toISOString(),
          customer: { name: 'Jane' },
        },
      );

      expect(checkoutPricingService.calculate).toHaveBeenCalledWith(
        expect.objectContaining({
          tax: expect.objectContaining({
            rules: [
              { id: 'gst', name: 'GST', rate: 5 },
              { id: 'pst', name: 'PST', rate: 8 },
            ],
            serviceRatePercent: 7,
          }),
        }),
      );
    });

    it('passes per-service tax override from service metadata', async () => {
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        settings: {
          tax: {
            enabled: true,
            name: 'VAT',
            rate: 20,
            model: 'exclusive',
          },
        },
      });

      await service.resolveCheckoutPricing(
        'biz-1',
        { ...baseService, metadata: { taxRatePercent: 0 } } as never,
        {
          serviceId: 'svc-1',
          startTime: new Date().toISOString(),
          customer: { name: 'Jane' },
        },
      );

      expect(checkoutPricingService.calculate).toHaveBeenCalledWith(
        expect.objectContaining({
          tax: expect.objectContaining({ serviceRatePercent: 0 }),
        }),
      );
    });

    it('omits tax input when business tax is disabled', async () => {
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        settings: { tax: { enabled: false, rate: 20, model: 'exclusive' } },
      });

      await service.resolveCheckoutPricing('biz-1', baseService as never, {
        serviceId: 'svc-1',
        startTime: new Date().toISOString(),
        customer: { name: 'Jane' },
      });

      expect(checkoutPricingService.calculate).toHaveBeenCalledWith(
        expect.objectContaining({ tax: undefined }),
      );
    });

    it('omits tax input when business has no tax settings', async () => {
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        settings: {},
      });

      await service.resolveCheckoutPricing('biz-1', baseService as never, {
        serviceId: 'svc-1',
        startTime: new Date().toISOString(),
        customer: { name: 'Jane' },
      });

      expect(checkoutPricingService.calculate).toHaveBeenCalledWith(
        expect.objectContaining({ tax: undefined }),
      );
    });
  });

  describe('resolvePackageCheckoutPricing tax input', () => {
    it('passes stacked business tax rules for package checkout', async () => {
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
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
      packagesService.previewPackagePricing.mockResolvedValue({
        pricing: { packagePrice: 200 },
        currency: 'USD',
      });

      await service.resolvePackageCheckoutPricing('biz-1', 'pkg-1', {});

      expect(checkoutPricingService.calculate).toHaveBeenCalledWith(
        expect.objectContaining({
          servicePrice: 200,
          tax: {
            enabled: true,
            name: 'Tax',
            rate: 13,
            model: 'exclusive',
            serviceRatePercent: null,
            rules: [
              { id: 'gst', name: 'GST', rate: 5 },
              { id: 'pst', name: 'PST', rate: 8 },
            ],
          },
        }),
      );
    });

    it('passes business inclusive tax for package checkout', async () => {
      businessRepo.findOne.mockResolvedValue({
        id: 'biz-1',
        settings: {
          tax: {
            enabled: true,
            name: 'GST',
            rate: 10,
            model: 'inclusive',
          },
        },
      });
      packagesService.previewPackagePricing.mockResolvedValue({
        pricing: { packagePrice: 200 },
        currency: 'USD',
      });

      await service.resolvePackageCheckoutPricing('biz-1', 'pkg-1', {});

      expect(checkoutPricingService.calculate).toHaveBeenCalledWith(
        expect.objectContaining({
          servicePrice: 200,
          tax: {
            enabled: true,
            name: 'GST',
            rate: 10,
            model: 'inclusive',
            serviceRatePercent: null,
          },
        }),
      );
    });
  });
});
