import { describe, expect, it, beforeEach } from 'vitest';
import {
  captureReferralFromSearch,
  claimPendingReferralAfterSignIn,
  consumeReferralConversionFlag,
  markReferralAttachedForConversion,
  readPendingReferralCode,
  readRefereePromoCode,
  savePendingReferralCode,
} from './consumer-referral.util.js';

describe('consumer-referral.util', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('captures referral code from search params', () => {
    const code = captureReferralFromSearch('?ref=friend10&src=referral', 'demo-salon');
    expect(code).toBe('FRIEND10');
    expect(readPendingReferralCode('demo-salon')).toBe('FRIEND10');
  });

  it('claims pending referral after sign-in', async () => {
    savePendingReferralCode('demo-salon', 'FRIEND10');
    const result = await claimPendingReferralAfterSignIn('demo-salon', async (code) => ({
      attached: true,
      referralCode: code,
      refereePromoCode: 'WELCOME10',
    }));
    expect(result?.attached).toBe(true);
    expect(readPendingReferralCode('demo-salon')).toBeNull();
    expect(readRefereePromoCode('demo-salon')).toBe('WELCOME10');
  });

  it('tracks conversion flag across booking success', () => {
    markReferralAttachedForConversion('demo-salon');
    expect(consumeReferralConversionFlag('demo-salon')).toBe(true);
    expect(consumeReferralConversionFlag('demo-salon')).toBe(false);
  });
});
