import type { PublicCheckoutQuote } from './types.js';
import type { PublicLoyaltySummary } from './consumer-rewards-display.util.js';

const baseQuote: PublicCheckoutQuote = {
  servicePrice: 80,
  subtotal: 80,
  afterPromo: 70,
  afterGiftCard: 70,
  promoDiscount: 10,
  giftCardDiscount: 0,
  loyaltyDiscount: 0,
  totalDiscount: 10,
  amountDue: 70,
  currency: 'USD',
  promoCode: 'SAVE10',
  loyaltyPointsBalance: 25,
  loyaltyPointsToRedeem: 0,
  pointsToEarn: 7,
  adjustments: [],
};

export const CHECKOUT_PROMO_APPLIED_SCENARIOS = [
  {
    id: 'promo-code-match',
    appliedPromo: 'SAVE10',
    quote: baseQuote,
    expect: true,
  },
  {
    id: 'gift-card-match',
    appliedPromo: 'GIFT50',
    quote: {
      ...baseQuote,
      promoCode: undefined,
      promoDiscount: 0,
      giftCardCode: 'GIFT50',
      giftCardDiscount: 50,
      totalDiscount: 50,
    },
    expect: true,
  },
  {
    id: 'promo-discount-without-code',
    appliedPromo: 'AUTO',
    quote: { ...baseQuote, promoCode: undefined, promoDiscount: 5 },
    expect: true,
  },
  {
    id: 'not-applied',
    appliedPromo: 'MISSING',
    quote: { ...baseQuote, promoDiscount: 0, giftCardDiscount: 0, promoCode: undefined },
    expect: false,
  },
  {
    id: 'empty-promo',
    appliedPromo: '',
    quote: baseQuote,
    expect: false,
  },
] as const;

const loyalty: PublicLoyaltySummary = {
  pointsBalance: 30,
  lifetimeEarned: 100,
  pointsValue: 30,
  earnPercentCashback: 5,
  bonusDollarValue: 0,
};

export const CHECKOUT_LOYALTY_MAX_SCENARIOS = [
  {
    id: 'after-gift-card-cap',
    loyalty,
    quote: { ...baseQuote, afterGiftCard: 20, loyaltyPointsBalance: 30 },
    fallbackSubtotal: 80,
    expect: 20,
  },
  {
    id: 'balance-cap',
    loyalty: { ...loyalty, pointsBalance: 15 },
    quote: { ...baseQuote, afterPromo: 100 },
    fallbackSubtotal: 80,
    expect: 15,
  },
  {
    id: 'fallback-subtotal',
    loyalty: null,
    quote: null,
    fallbackSubtotal: 45,
    expect: 0,
  },
] as const;

export const CHECKOUT_CLEAR_PROMO_SCENARIOS = [
  { id: 'promo-error', message: 'Invalid promo code', appliedPromo: 'BAD', expect: true },
  { id: 'gift-card-error', message: 'Gift card expired', appliedPromo: 'GC1', expect: true },
  { id: 'network-error', message: 'Network error', appliedPromo: 'SAVE10', expect: false },
  { id: 'no-applied-promo', message: 'Invalid promo code', appliedPromo: '', expect: false },
] as const;
