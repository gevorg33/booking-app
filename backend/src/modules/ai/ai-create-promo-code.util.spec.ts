import {
  CREATE_PROMO_CODE_INTENT,
  CREATE_PROMO_CODE_PROMPTS,
  extractPromoCodeNameFromPrompt,
  extractPromoDiscountFromPrompt,
  isCreatePromoCodePrompt,
  parseCreatePromoCodeFromPrompt,
  rescueCreatePromoCodeIntent,
} from './ai-create-promo-code.util.js';
import { PromoDiscountType } from '../promo-codes/entities/promo-code.entity.js';

describe('ai-create-promo-code.util', () => {
  it.each(CREATE_PROMO_CODE_PROMPTS)(
    'detects create promo code for $id',
    ({ prompt }) => {
      expect(isCreatePromoCodePrompt(prompt)).toBe(true);
    },
  );

  it.each(
    CREATE_PROMO_CODE_PROMPTS.filter(({ paramsPartial }) => paramsPartial),
  )('parses expected params for $id', ({ prompt, paramsPartial }) => {
    const parsed = parseCreatePromoCodeFromPrompt(prompt, {});
    expect(parsed?.code).toBe(paramsPartial?.code);
    expect(parsed?.discountType).toBe(paramsPartial?.discountType);
    expect(parsed?.discountValue).toBe(paramsPartial?.discountValue);
    if (paramsPartial?.minOrderAmount != null) {
      expect(parsed?.minOrderAmount).toBe(paramsPartial.minOrderAmount);
    }
    if (paramsPartial?.maxUses != null) {
      expect(parsed?.maxUses).toBe(paramsPartial.maxUses);
    }
  });

  it('does not classify promo help prompts as create', () => {
    expect(isCreatePromoCodePrompt('How do promo codes work')).toBe(false);
    expect(isCreatePromoCodePrompt('Validate promo code SAVE10')).toBe(false);
    expect(
      extractPromoCodeNameFromPrompt('Create a new promo code for 10% off'),
    ).toBeNull();
  });

  it('e2e-bug.151 — service category "called X" is not a promo create', () => {
    expect(
      isCreatePromoCodePrompt('Add a new service category called Wellness'),
    ).toBe(false);
    expect(
      rescueCreatePromoCodeIntent(
        'Add a new service category called Wellness',
        'unknown',
      ),
    ).toBeNull();
  });

  it.each(CREATE_PROMO_CODE_PROMPTS)(
    'rescues unknown action to create_promo_code for $id',
    ({ prompt }) => {
      expect(rescueCreatePromoCodeIntent(prompt, 'unknown')).toEqual({
        action: CREATE_PROMO_CODE_INTENT,
        rescueReason: 'create_promo_code',
      });
    },
  );

  it('extracts promo code names and discounts', () => {
    expect(
      extractPromoCodeNameFromPrompt('Create promo code SAVE10 for 20% off'),
    ).toBe('SAVE10');
    expect(
      extractPromoDiscountFromPrompt('Create promo code SAVE10 for 20% off'),
    ).toEqual({
      discountType: PromoDiscountType.PERCENT,
      discountValue: 20,
    });
    expect(
      extractPromoDiscountFromPrompt('Make coupon SUMMER25 with $10 off'),
    ).toEqual({
      discountType: PromoDiscountType.FIXED,
      discountValue: 10,
    });
    expect(
      parseCreatePromoCodeFromPrompt('not a promo admin request', {}),
    ).toBeNull();
  });
});
