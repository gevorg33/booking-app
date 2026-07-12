import { describe, expect, it } from 'vitest';
import { useProviderActiveBookingStore } from './provider-active-booking-store';

describe('provider-active-booking-store (ai-cmd-provider-5.15.2)', () => {
  it('defaults to no active booking', () => {
    expect(useProviderActiveBookingStore.getState().activeBookingId).toBeNull();
  });

  it('sets and clears the active booking id', () => {
    useProviderActiveBookingStore.getState().setActiveBookingId('bk-1');
    expect(useProviderActiveBookingStore.getState().activeBookingId).toBe('bk-1');

    useProviderActiveBookingStore.getState().setActiveBookingId(null);
    expect(useProviderActiveBookingStore.getState().activeBookingId).toBeNull();
  });
});
