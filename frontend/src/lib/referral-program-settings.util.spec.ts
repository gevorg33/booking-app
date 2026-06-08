import { describe, expect, it } from 'vitest';
import {
  DEFAULT_REFERRAL_PROGRAM_FORM,
  buildReferralProgramSavePayload,
  describeReferrerReward,
  readReferralProgramForm,
} from './referral-program-settings.util';

describe('referral-program-settings.util', () => {
  it('reads defaults when referralProgram is missing', () => {
    expect(readReferralProgramForm({})).toEqual(DEFAULT_REFERRAL_PROGRAM_FORM);
  });

  it('reads gift card referrer reward from business settings', () => {
    const form = readReferralProgramForm({
      referralProgram: {
        enabled: true,
        referrerRewardType: 'gift_card',
        referrerGiftCardAmount: 40,
        refereePromoCode: 'welcome10',
      },
    });
    expect(form.referrerRewardType).toBe('gift_card');
    expect(form.referrerGiftCardAmount).toBe(40);
    expect(form.refereePromoCode).toBe('WELCOME10');
  });

  it('builds save payload with normalized promo code', () => {
    expect(
      buildReferralProgramSavePayload({
        ...DEFAULT_REFERRAL_PROGRAM_FORM,
        refereePromoCode: ' save10 ',
      }).refereePromoCode,
    ).toBe('SAVE10');
  });

  it('describes referrer reward for preview', () => {
    expect(
      describeReferrerReward(
        { referrerRewardType: 'loyalty_points', referrerBonusPoints: 30, referrerGiftCardAmount: 25 },
        (n) => `$${n}`,
      ),
    ).toBe('30 pts');
    expect(
      describeReferrerReward(
        { referrerRewardType: 'gift_card', referrerBonusPoints: 30, referrerGiftCardAmount: 25 },
        (n) => `$${n}`,
      ),
    ).toBe('$25');
  });
});
