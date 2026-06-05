import type { CheckoutPricingResult } from '../../modules/promo-codes/checkout-pricing.types.js';
import {
  buildStripeTaxMetadata,
  isCheckoutPricingResult,
  mergeStripeCheckoutMetadata,
  resolveFulfillmentCheckoutPricing,
  resolveStripeChargeAmount,
  resolveStripeChargeAmountCents,
  stripeTaxIsChargeable,
} from './booking-payment-stripe-tax.util.js';

const basePricing = (
  overrides: Partial<CheckoutPricingResult> = {},
): CheckoutPricingResult => ({
  servicePrice: 100,
  subtotal: 100,
  afterPromo: 100,
  afterGiftCard: 100,
  promoDiscount: 0,
  giftCardDiscount: 0,
  loyaltyDiscount: 0,
  totalDiscount: 0,
  amountDue: 100,
  currency: 'USD',
  loyaltyPointsToRedeem: 0,
  loyaltyPointsBalance: 0,
  pointsToEarn: 0,
  adjustments: [],
  ...overrides,
});

describe('booking-payment-stripe-tax.util', () => {
  describe('resolveStripeChargeAmount', () => {
    it.each([
      {
        id: 'exclusive-with-tax',
        pricing: basePricing({
          amountDue: 120,
          taxEnabled: true,
          taxAmount: 20,
        }),
        expected: 120,
      },
      {
        id: 'inclusive-gross',
        pricing: basePricing({
          amountDue: 120,
          taxEnabled: true,
          taxAmount: 20,
          taxModel: 'inclusive',
        }),
        expected: 120,
      },
      {
        id: 'no-tax',
        pricing: basePricing({ amountDue: 100, taxEnabled: false }),
        expected: 100,
      },
      {
        id: 'clamps-negative',
        pricing: basePricing({ amountDue: -5 }),
        expected: 0,
      },
      {
        id: 'clamps-nan',
        pricing: basePricing({ amountDue: Number.NaN }),
        expected: 0,
      },
    ])('charges $id as $expected', ({ pricing, expected }) => {
      expect(resolveStripeChargeAmount(pricing)).toBe(expected);
      expect(resolveStripeChargeAmountCents(pricing)).toBe(
        Math.round(expected * 100),
      );
    });
  });

  describe('isCheckoutPricingResult', () => {
    it('accepts valid checkout pricing snapshots', () => {
      expect(isCheckoutPricingResult(basePricing())).toBe(true);
    });

    it('rejects invalid snapshots', () => {
      expect(isCheckoutPricingResult(null)).toBe(false);
      expect(isCheckoutPricingResult({ amountDue: 10 })).toBe(false);
      expect(
        isCheckoutPricingResult({ ...basePricing(), amountDue: '120' }),
      ).toBe(false);
    });
  });

  describe('resolveFulfillmentCheckoutPricing', () => {
    it('prefers frozen Stripe draft pricing when valid', () => {
      const recalculated = basePricing({ amountDue: 100 });
      const frozen = basePricing({
        amountDue: 120,
        taxEnabled: true,
        taxAmount: 20,
        taxRate: 20,
        taxModel: 'exclusive',
      });

      expect(resolveFulfillmentCheckoutPricing(recalculated, frozen)).toBe(
        frozen,
      );
    });

    it('falls back to recalculated pricing when frozen snapshot is invalid', () => {
      const recalculated = basePricing({ amountDue: 113, taxAmount: 13 });
      expect(
        resolveFulfillmentCheckoutPricing(recalculated, { bad: true }),
      ).toBe(recalculated);
    });
  });

  describe('stripeTaxIsChargeable', () => {
    it.each([
      [basePricing(), false],
      [basePricing({ taxEnabled: false, taxAmount: 20 }), false],
      [basePricing({ taxEnabled: true, taxAmount: 0 }), false],
      [basePricing({ taxEnabled: true, taxAmount: null as never }), false],
      [basePricing({ taxEnabled: true, taxAmount: 20 }), true],
      [basePricing({ taxEnabled: 'yes' as never, taxAmount: 20 }), false],
    ])('detects chargeable tax', (pricing, expected) => {
      expect(stripeTaxIsChargeable(pricing)).toBe(expected);
    });
  });

  describe('buildStripeTaxMetadata', () => {
    it('marks tax disabled when no tax is due', () => {
      expect(buildStripeTaxMetadata(basePricing())).toEqual({
        chargeAmount: '100',
        chargeAmountCents: '10000',
        taxEnabled: 'false',
      });
    });

    it('serializes exclusive tax breakdown for Stripe metadata', () => {
      expect(
        buildStripeTaxMetadata(
          basePricing({
            amountDue: 120,
            taxEnabled: true,
            taxName: 'VAT',
            taxRate: 20,
            taxModel: 'exclusive',
            taxAmount: 20,
            netAmount: 100,
          }),
        ),
      ).toEqual({
        chargeAmount: '120',
        chargeAmountCents: '12000',
        taxEnabled: 'true',
        taxName: 'VAT',
        taxRate: '20',
        taxModel: 'exclusive',
        taxAmount: '20',
        netAmount: '100',
      });
    });

    it('omits invalid optional tax fields from Stripe metadata', () => {
      expect(
        buildStripeTaxMetadata(
          basePricing({
            amountDue: 120,
            taxEnabled: true,
            taxAmount: 20,
            taxName: { bad: true } as never,
            taxRate: null,
            taxModel: undefined,
            netAmount: undefined,
          }),
        ),
      ).toEqual({
        chargeAmount: '120',
        chargeAmountCents: '12000',
        taxEnabled: 'true',
        taxAmount: '20',
      });
    });

    it('treats disabled tax as tax disabled even when tax amount is present', () => {
      expect(
        buildStripeTaxMetadata(
          basePricing({
            taxEnabled: false,
            taxAmount: 20,
          }),
        ),
      ).toEqual({
        chargeAmount: '100',
        chargeAmountCents: '10000',
        taxEnabled: 'false',
      });
    });

    it('treats zero tax amount as tax disabled for Stripe metadata', () => {
      expect(
        buildStripeTaxMetadata(
          basePricing({
            taxEnabled: true,
            taxAmount: 0,
          }),
        ),
      ).toEqual({
        chargeAmount: '100',
        chargeAmountCents: '10000',
        taxEnabled: 'false',
      });
    });

    it('omits empty optional tax labels and empty tax rule arrays', () => {
      expect(
        buildStripeTaxMetadata(
          basePricing({
            amountDue: 110,
            taxEnabled: true,
            taxAmount: 10,
            taxName: '',
            taxModel: 'exclusive',
            taxRate: 10,
            taxRules: [],
          }),
        ),
      ).toEqual({
        chargeAmount: '110',
        chargeAmountCents: '11000',
        taxEnabled: 'true',
        taxModel: 'exclusive',
        taxRate: '10',
        taxAmount: '10',
      });
    });

    it('truncates oversized stacked tax rule JSON for Stripe metadata', () => {
      const longName = 'X'.repeat(400);
      const metadata = buildStripeTaxMetadata(
        basePricing({
          amountDue: 120,
          taxEnabled: true,
          taxAmount: 20,
          taxRules: [
            { id: 'a', name: longName, rate: 10, amount: 10 },
            { id: 'b', name: longName, rate: 10, amount: 10 },
          ],
        }),
      );

      expect(metadata.taxRules.length).toBeLessThanOrEqual(500);
      expect(metadata.taxRuleCount).toBe('2');
    });

    it('serializes inclusive stacked tax rules for Stripe metadata', () => {
      const metadata = buildStripeTaxMetadata(
        basePricing({
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
        }),
      );

      expect(metadata.taxEnabled).toBe('true');
      expect(metadata.taxModel).toBe('inclusive');
      expect(metadata.taxRuleCount).toBe('2');
      expect(JSON.parse(metadata.taxRules)).toEqual([
        { id: 'gst', name: 'GST', rate: 5, amount: 5 },
        { id: 'pst', name: 'PST', rate: 8, amount: 8 },
      ]);
    });
  });

  describe('mergeStripeCheckoutMetadata', () => {
    it('merges base session metadata with tax fields', () => {
      expect(
        mergeStripeCheckoutMetadata(
          { type: 'booking_payment', draftId: 'draft-1' },
          basePricing({
            amountDue: 120,
            taxEnabled: true,
            taxAmount: 20,
            taxRate: 20,
            taxModel: 'exclusive',
            netAmount: 100,
            taxName: 'VAT',
          }),
        ),
      ).toMatchObject({
        type: 'booking_payment',
        draftId: 'draft-1',
        taxEnabled: 'true',
        chargeAmountCents: '12000',
        taxAmount: '20',
      });
    });
  });
});
