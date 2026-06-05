import { describe, expect, it } from '@jest/globals';
import {
  buildNewBookingAiPrompt,
  buildNewBookingForegroundHint,
  toNativePushDataFields,
} from './provider-push-payload.util.js';

describe('provider-push-payload.util', () => {
  it('builds AI prefill and foreground hint for new bookings', () => {
    expect(buildNewBookingAiPrompt('14:00', 'Sam')).toMatch(/15-minute buffer.*Sam.*14:00/);
    expect(buildNewBookingAiPrompt('10:00', '')).toMatch(/the client/);
    expect(buildNewBookingForegroundHint('14:00')).toBe('New booking 14:00 — Add buffer?');
    expect(toNativePushDataFields({})).toEqual({});
  });

  it('serializes native push data fields', () => {
    expect(
      toNativePushDataFields({
        url: '/provider/today?bookingId=b1',
        bookingId: 'b1',
        businessId: 'biz-1',
        aiPrompt: 'Add buffer',
        pushType: 'booking_created',
        foregroundHint: 'New booking',
      }),
    ).toEqual({
      url: '/provider/today?bookingId=b1',
      bookingId: 'b1',
      businessId: 'biz-1',
      aiPrompt: 'Add buffer',
      pushType: 'booking_created',
      foregroundHint: 'New booking',
    });
  });
});
