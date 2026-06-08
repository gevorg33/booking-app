import { describe, expect, it, beforeEach } from 'vitest';
import {
  captureReferralFromSearch,
  consumeReferralConversionFlag,
  markReferralAttachedForConversion,
  readPendingReferralCode,
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

  it('tracks conversion flag across booking success', () => {
    markReferralAttachedForConversion('demo-salon');
    expect(consumeReferralConversionFlag('demo-salon')).toBe(true);
    expect(consumeReferralConversionFlag('demo-salon')).toBe(false);
  });
});
