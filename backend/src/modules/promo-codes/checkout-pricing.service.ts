import { Injectable, BadRequestException } from '@nestjs/common';
import { LoyaltyService } from '../loyalty/loyalty.service.js';
import { PromoCodesService } from './promo-codes.service.js';
import { GiftCardsService } from '../gift-cards/gift-cards.service.js';
import {
  CheckoutPricingInput,
  CheckoutPricingResult,
} from './checkout-pricing.types.js';
import {
  computeCheckoutTotals,
  isGiftCardCode,
  resolveGiftCardRedemption,
  resolveLoyaltyRedemption,
} from './checkout-pricing.util.js';

@Injectable()
export class CheckoutPricingService {
  constructor(
    private promoCodesService: PromoCodesService,
    private loyaltyService: LoyaltyService,
    private giftCardsService: GiftCardsService,
  ) {}

  async calculate(input: CheckoutPricingInput): Promise<CheckoutPricingResult> {
    const subtotal = Math.max(0, Number(input.prepaymentAmount));
    const servicePrice = Math.max(0, Number(input.servicePrice));
    const adjustments: CheckoutPricingResult['adjustments'] = [];
    const code = input.promoCode?.trim().toUpperCase();

    let promoDiscount = 0;
    let promoCodeId: string | undefined;
    let promoCode: string | undefined;
    let giftCardDiscount = 0;
    let giftCardId: string | undefined;
    let giftCardCode: string | undefined;

    if (code) {
      if (isGiftCardCode(code)) {
        const card = await this.giftCardsService.validate(input.businessId, code);
        if (
          card.currency &&
          input.currency &&
          card.currency.toUpperCase() !== input.currency.toUpperCase()
        ) {
          throw new BadRequestException('Gift card currency does not match this booking');
        }
        giftCardDiscount = resolveGiftCardRedemption(Number(card.balance), subtotal);
        giftCardId = card.id;
        giftCardCode = card.code;
        if (giftCardDiscount > 0) {
          adjustments.push({
            type: 'gift_card',
            code: card.code,
            label: `Gift card ${card.code}`,
            amount: giftCardDiscount,
            giftCardId: card.id,
          });
        }
      } else {
        const promo = await this.promoCodesService.findValidForCheckout(
          input.businessId,
          code,
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
    }

    let loyaltyPointsBalance: number | null = null;
    let loyaltyPointsToRedeem = 0;
    let loyaltyDiscount = 0;

    const totalsAfterGift = computeCheckoutTotals({
      subtotal,
      promoDiscount,
      giftCardDiscount,
      loyaltyPointsToRedeem: 0,
    });

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
          totalsAfterGift.afterGiftCard,
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
      giftCardDiscount,
      loyaltyPointsToRedeem,
    });
    loyaltyDiscount = totals.loyaltyDiscount;
    giftCardDiscount = totals.giftCardDiscount;
    const amountDue = totals.amountDue;
    const totalDiscount = totals.totalDiscount;
    const pointsToEarn = this.loyaltyService.calculateEarnPoints(
      amountDue,
      input.earnPercentCashback,
    );

    return {
      servicePrice,
      subtotal,
      afterPromo: totals.afterPromo,
      afterGiftCard: totals.afterGiftCard,
      promoDiscount,
      giftCardDiscount,
      loyaltyDiscount,
      totalDiscount,
      amountDue,
      currency: input.currency,
      loyaltyPointsToRedeem,
      loyaltyPointsBalance,
      pointsToEarn,
      promoCodeId,
      promoCode,
      giftCardId,
      giftCardCode,
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
    if (pricing.giftCardCode && pricing.giftCardDiscount > 0) {
      await this.giftCardsService.redeem(
        businessId,
        pricing.giftCardCode,
        pricing.giftCardDiscount,
      );
    }
  }
}
