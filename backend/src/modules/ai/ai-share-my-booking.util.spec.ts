import {
  isShareMyBookingIntent,
  isShareMyBookingPrompt,
  parseShareMyBookingFromPrompt,
  rescueShareMyBookingIntent,
} from './ai-share-my-booking.util.js';
import {
  SHARE_MY_BOOKING_PROMPTS,
  SHARE_MY_BOOKING_RESCUE_SCENARIOS,
} from './ai-share-my-booking.fixtures.js';
import { SHARE_MY_BOOKING_MULTILINGUAL_SCENARIOS } from './ai-share-my-booking-multilingual.fixtures.js';

describe('ai-share-my-booking.util (ai-cmd-customer-4.3.7)', () => {
  it.each(SHARE_MY_BOOKING_PROMPTS)('detects prompt $id', ({ prompt }) => {
    expect(isShareMyBookingPrompt(prompt)).toBe(true);
    expect(parseShareMyBookingFromPrompt(prompt)).not.toBeNull();
  });

  it.each(SHARE_MY_BOOKING_MULTILINGUAL_SCENARIOS)(
    'detects multilingual prompt $id',
    ({ prompt }) => {
      expect(isShareMyBookingPrompt(prompt)).toBe(true);
    },
  );

  it.each(SHARE_MY_BOOKING_RESCUE_SCENARIOS)(
    'rescues $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(rescueShareMyBookingIntent(prompt, misclassifiedAction)).toEqual({
        action: expectedAction,
        rescueReason: 'share_my_booking',
      });
    },
  );

  it('does not steal get_manage_link for manage URL requests', () => {
    expect(isShareMyBookingPrompt('Get manage link for my booking')).toBe(
      false,
    );
    expect(isShareMyBookingPrompt('Send me the cancel link')).toBe(false);
  });

  it('does not steal share_salon_link', () => {
    expect(isShareMyBookingPrompt('Share salon link with a friend')).toBe(
      false,
    );
  });

  it('does not steal refer_a_friend', () => {
    expect(isShareMyBookingPrompt('Refer a friend and get bonus points')).toBe(
      false,
    );
  });

  it('prefers share over manage link when partner is mentioned', () => {
    expect(isShareMyBookingPrompt('Send my booking link to my partner')).toBe(
      true,
    );
  });

  it('blocks generic send booking link requests without share intent', () => {
    expect(isShareMyBookingPrompt('Send link for my booking')).toBe(false);
  });

  it('blocks share reward policy explain prompts', () => {
    expect(
      isShareMyBookingPrompt('What does the share reward program mean?'),
    ).toBe(false);
  });

  it('returns null rescue when action is already share_my_booking', () => {
    expect(
      rescueShareMyBookingIntent('Share my booking', 'share_my_booking'),
    ).toBeNull();
  });

  it('recognizes share_my_booking intent constant', () => {
    expect(isShareMyBookingIntent('share_my_booking')).toBe(true);
    expect(isShareMyBookingIntent('get_manage_link')).toBe(false);
  });
});
