import { describe, expect, it } from 'vitest';
import { OTP_SCENARIOS, PHONE_AUTH_SCENARIOS } from './phone-auth.fixtures.js';
import {
  buildPhoneAuthJwtEmail,
  isValidConsumerPhone,
  isValidSmsOtpCode,
  normalizeConsumerPhone,
  phoneOtpAutocompleteToken,
  sanitizeSmsOtpCode,
} from './phone-auth.util.js';

describe('phone-auth.util', () => {
  it.each(PHONE_AUTH_SCENARIOS)(
    'normalizeConsumerPhone $id',
    ({ input, expected, valid }) => {
      expect(normalizeConsumerPhone(input)).toBe(expected);
      expect(isValidConsumerPhone(input)).toBe(valid);
    },
  );

  it.each(OTP_SCENARIOS)('isValidSmsOtpCode $id', ({ code, valid }) => {
    expect(isValidSmsOtpCode(code)).toBe(valid);
    if (valid) {
      expect(sanitizeSmsOtpCode(` ${code} `)).toBe(code);
    }
  });

  it('builds jwt email fallback and otp autocomplete token', () => {
    expect(buildPhoneAuthJwtEmail('+37499123456')).toBe('37499123456@phone.local');
    expect(buildPhoneAuthJwtEmail('+37499123456', 'guest@test.com')).toBe('guest@test.com');
    expect(phoneOtpAutocompleteToken()).toBe('one-time-code');
  });
});
