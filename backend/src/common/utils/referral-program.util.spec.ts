import {
  REFERRAL_CODE_SCENARIOS,
  REFERRAL_RESOLVE_SCENARIOS,
  buildReferralAttributionMetadata,
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

  it('merges referral settings from business metadata', () => {
    const settings = mergeReferralProgramSettings({
      referralProgram: {
        referrerBonusPoints: 40,
        refereePromoCode: 'welcome10',
      },
    });
    expect(settings.referrerBonusPoints).toBe(40);
    expect(settings.refereePromoCode).toBe('WELCOME10');
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
