/** adopt-6.1 — referral program defaults and test scenarios. */

export const REFERRAL_METADATA_REFERRED_BY = 'referredByCustomerId';
export const REFERRAL_METADATA_CODE_USED = 'referralCodeUsed';
export const REFERRAL_METADATA_CONVERTED_AT = 'referralConvertedAt';
export const REFERRAL_METADATA_CONVERTED_BOOKING_ID =
  'referralConvertedBookingId';

export const REFERRER_REWARD_TYPES = ['loyalty_points', 'gift_card'] as const;
export type ReferrerRewardType = (typeof REFERRER_REWARD_TYPES)[number];

export const DEFAULT_REFERRAL_PROGRAM_SETTINGS = {
  enabled: true,
  referrerRewardType: 'loyalty_points' as ReferrerRewardType,
  referrerBonusPoints: 25,
  referrerGiftCardAmount: 25,
  refereeBonusPoints: 25,
  refereePromoCode: null as string | null,
} as const;

export const REFERRAL_SETTINGS_MERGE_SCENARIOS = [
  {
    id: 'gift-card-referrer',
    input: {
      referrerRewardType: 'gift_card',
      referrerGiftCardAmount: 50,
      referrerBonusPoints: 99,
    },
    expected: {
      referrerRewardType: 'gift_card',
      referrerGiftCardAmount: 50,
      referrerBonusPoints: 99,
    },
  },
  {
    id: 'invalid-reward-type-falls-back',
    input: { referrerRewardType: 'cash' },
    expected: { referrerRewardType: 'loyalty_points' },
  },
] as const;

export const REFERRAL_CODE_SCENARIOS = [
  {
    id: 'full-uuid',
    customerId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    expected: 'A1B2C3D4',
  },
  { id: 'short', customerId: 'cust-99', expected: 'CUST99' },
] as const;

export const REFERRAL_RESOLVE_SCENARIOS = [
  {
    id: 'unique-prefix',
    code: 'A1B2C3D4',
    customerIds: [
      'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    ],
    expected: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  },
  {
    id: 'ambiguous-prefix',
    code: 'AB',
    customerIds: [
      'ab111111-1111-1111-1111-111111111111',
      'ab222222-2222-2222-2222-222222222222',
    ],
    expected: null,
  },
] as const;
