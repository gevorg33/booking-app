import { Injectable, BadRequestException } from '@nestjs/common';
import { LoyaltyService } from '../loyalty/loyalty.service.js';
import { PromoCodesService } from './promo-codes.service.js';
import {
  CheckoutPricingInput,
  CheckoutPricingResult,
} from './checkout-pricing.types.js';
import {
  computeCheckoutTotals,
  computeAfterPromo,
  resolveLoyaltyRedemption,
} from './checkout-pricing.util.js';

@Injectable()
export class CheckoutPricingService {
  constructor(
    private promoCodesService: PromoCodesService,
    private loyaltyService: LoyaltyService,
  ) {}

  async calculate(input: CheckoutPricingInput): Promise<CheckoutPricingResult> {
    const subtotal = Math.max(0, Number(input.prepaymentAmount));
    const servicePrice = Math.max(0, Number(input.servicePrice));
    const adjustments: CheckoutPricingResult['adjustments'] = [];

    let promoDiscount = 0;
    let promoCodeId: string | undefined;
    let promoCode: string | undefined;

    if (input.promoCode?.trim()) {
      const promo = await this.promoCodesService.findValidForCheckout(
        input.businessId,
        input.promoCode,
        servicePrice,
      );
      promoDiscount = this.promoCodesService.calculateDiscount(promo, subtotal);
      promoCodeId = promo.id;
      promoCode = promo.code;
      if (promoDiscount > 0) {
        adjustments.push({
          type: 'promo',
          code: promo.code,
          label: `Promo ${promo.code}`,
          amount: promoDiscount,
          promoCodeId: promo.id,
        });
      }
    }

    const afterPromo = computeAfterPromo(subtotal, promoDiscount);

    let loyaltyPointsBalance: number | null = null;
    let loyaltyPointsToRedeem = 0;
    let loyaltyDiscount = 0;

    if (input.customerId) {
      const account = await this.loyaltyService.getOrCreate(
        input.businessId,
        input.customerId,
      );
      loyaltyPointsBalance = account.pointsBalance;

      if (input.loyaltyPointsToRedeem != null && input.loyaltyPointsToRedeem > 0) {
        loyaltyPointsToRedeem = resolveLoyaltyRedemption(
          input.loyaltyPointsToRedeem,
          account.pointsBalance,
          afterPromo,
        );
        loyaltyDiscount = this.loyaltyService.pointsToCurrency(loyaltyPointsToRedeem);
        if (loyaltyDiscount > 0) {
          adjustments.push({
            type: 'loyalty',
            label: 'Loyalty points',
            amount: loyaltyDiscount,
            points: loyaltyPointsToRedeem,
          });
        }
      }
    } else if (input.loyaltyPointsToRedeem != null && input.loyaltyPointsToRedeem > 0) {
      throw new BadRequestException('Sign in to use loyalty points');
    }

    const totals = computeCheckoutTotals({
      subtotal,
      promoDiscount,
      loyaltyPointsToRedeem,
    });
    loyaltyDiscount = totals.loyaltyDiscount;
    const amountDue = totals.amountDue;
    const totalDiscount = totals.totalDiscount;
    // Earn only on cash/card due — loyalty redemption never earns more loyalty.
    const pointsToEarn = this.loyaltyService.calculateEarnPoints(
      amountDue,
      input.earnPercentCashback,
    );

    return {
      servicePrice,
      subtotal,
      afterPromo,
      promoDiscount,
      loyaltyDiscount,
      totalDiscount,
      amountDue,
      currency: input.currency,
      loyaltyPointsToRedeem,
      loyaltyPointsBalance,
      pointsToEarn,
      promoCodeId,
      promoCode,
      adjustments,
    };
  }

  async applyRedemptions(
    businessId: string,
    customerId: string,
    pricing: CheckoutPricingResult,
    bookingId: string,
  ) {
    if (pricing.loyaltyPointsToRedeem > 0) {
      await this.loyaltyService.redeem(
        businessId,
        customerId,
        pricing.loyaltyPointsToRedeem,
        bookingId,
      );
    }
    if (pricing.promoCodeId) {
      await this.promoCodesService.recordUse(pricing.promoCodeId);
    }
  }
}
