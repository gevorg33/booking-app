import {
  isOpenBookingDetailPrompt,
  rescueOpenBookingDetailIntent,
} from './ai-provider-open-booking-detail.util.js';

describe('isOpenBookingDetailPrompt', () => {
  it.each([
    "Open Jane's appointment",
    'Pull up the booking details for Maria',
    'Open this booking',
  ])('matches %s', (prompt) => {
    expect(isOpenBookingDetailPrompt(prompt)).toBe(true);
  });

  it('does not match unrelated prompts', () => {
    expect(isOpenBookingDetailPrompt('Show me my appointments today')).toBe(
      false,
    );
  });

  it('does not match open-shifts phrasing', () => {
    expect(isOpenBookingDetailPrompt('Open shifts this week')).toBe(false);
  });

  it('does not match push-notification-specific phrasing', () => {
    expect(
      isOpenBookingDetailPrompt('Open the booking from push notification'),
    ).toBe(false);
  });

  it('does not match mutate verbs', () => {
    expect(isOpenBookingDetailPrompt('Cancel this appointment')).toBe(false);
  });
});

describe('rescueOpenBookingDetailIntent', () => {
  it('rescues to open_booking_detail', () => {
    expect(
      rescueOpenBookingDetailIntent("Open Jane's appointment", 'unknown'),
    ).toEqual({
      action: 'open_booking_detail',
      rescueReason: 'open_booking_detail',
    });
  });

  it('returns null when action already matches', () => {
    expect(
      rescueOpenBookingDetailIntent(
        "Open Jane's appointment",
        'open_booking_detail',
      ),
    ).toBeNull();
  });

  it('returns null for unrelated prompts', () => {
    expect(
      rescueOpenBookingDetailIntent('Mark this booking paid', 'unknown'),
    ).toBeNull();
  });
});
