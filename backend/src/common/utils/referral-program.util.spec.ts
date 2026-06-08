import {
  REFERRAL_CODE_SCENARIOS,
  REFERRAL_RESOLVE_SCENARIOS,
  REFERRAL_SETTINGS_MERGE_SCENARIOS,
  buildReferralAttributionMetadata,
  buildReferrerRewardSummary,
  deriveReferralCodeFromCustomerId,
  mergeReferralProgramSettings,
  normalizeReferralCode,
  resolveReferrerFromCandidates,
} from './referral-program.util.js';

describe('referral-program.util', () => {
  it.each(REFERRAL_CODE_SCENARIOS)('$id derives referral code', ({ customerId, expected }) => {
    expect(deriveReferralCodeFromCustomerId(customerId)).toBe(expected);
  });

  it.each(REFERRAL_RESOLVE_SCENARIOS)(
    '$id resolves referrer from candidates',
    ({ code, customerIds, expected }) => {
      expect(resolveReferrerFromCandidates(code, customerIds)).toBe(expected);
    },
  );

  it.each(REFERRAL_SETTINGS_MERGE_SCENARIOS)(
    '$id merges referral settings',
    ({ input, expected }) => {
      const settings = mergeReferralProgramSettings({ referralProgram: input });
      for (const [key, value] of Object.entries(expected)) {
        expect(settings[key as keyof typeof settings]).toBe(value);
      }
    },
  );

  it('builds referrer reward summary', () => {
    expect(
      buildReferrerRewardSummary(
        {
          referrerRewardType: 'loyalty_points',
          referrerBonusPoints: 40,
          referrerGiftCardAmount: 25,
        },
        { currency: 'USD' },
      ),
    ).toBe('40 loyalty points');
    expect(
      buildReferrerRewardSummary(
        {
          referrerRewardType: 'gift_card',
          referrerBonusPoints: 40,
          referrerGiftCardAmount: 50,
        },
        { currency: 'USD' },
      ),
    ).toBe('50 USD gift card');
  });

  it('builds referral attribution metadata', () => {
    const metadata = buildReferralAttributionMetadata({
      referrerCustomerId: 'cust-1',
      referralCode: 'ABC12345',
    });
    expect(metadata.referredByCustomerId).toBe('cust-1');
    expect(metadata.referralCodeUsed).toBe('ABC12345');
  });

  it('normalizes referral codes', () => {
    expect(normalizeReferralCode('  ab12  ')).toBe('AB12');
    expect(normalizeReferralCode('bad!')).toBeNull();
  });
});
