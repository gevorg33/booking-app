import { resolveAssignedProviderHourRollForwardAllowed } from './assigned-provider-hour-rollforward.util.js';

describe('e2e-bug.315 resolveAssignedProviderHourRollForwardAllowed', () => {
  it('defaults to true (unchanged behavior) when settings are missing entirely', () => {
    expect(resolveAssignedProviderHourRollForwardAllowed(undefined)).toBe(true);
    expect(resolveAssignedProviderHourRollForwardAllowed(null)).toBe(true);
    expect(resolveAssignedProviderHourRollForwardAllowed({})).toBe(true);
  });

  it('defaults to true when publicBooking exists but the flag is unset', () => {
    expect(
      resolveAssignedProviderHourRollForwardAllowed({ publicBooking: {} }),
    ).toBe(true);
  });

  it('returns false only when the flag is explicitly set to false', () => {
    expect(
      resolveAssignedProviderHourRollForwardAllowed({
        publicBooking: { allowAssignedProviderHourRollForward: false },
      }),
    ).toBe(false);
  });

  it('treats any other truthy/non-false value as allowed', () => {
    expect(
      resolveAssignedProviderHourRollForwardAllowed({
        publicBooking: { allowAssignedProviderHourRollForward: true },
      }),
    ).toBe(true);
    expect(
      resolveAssignedProviderHourRollForwardAllowed({
        publicBooking: { allowAssignedProviderHourRollForward: 0 },
      }),
    ).toBe(true);
  });
});
