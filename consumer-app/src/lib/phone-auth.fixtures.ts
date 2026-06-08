export const PHONE_AUTH_SCENARIOS = [
  {
    id: 'local-armenian',
    input: '099123456',
    expected: '+37499123456',
    valid: true,
  },
  {
    id: 'e164',
    input: '+1 555 123 4567',
    expected: '+15551234567',
    valid: true,
  },
  {
    id: 'too-short',
    input: '+37412',
    expected: '+37412',
    valid: false,
  },
] as const;

export const OTP_SCENARIOS = [
  { id: 'valid', code: '123456', valid: true },
  { id: 'short', code: '12', valid: false },
] as const;
