import { EXPLAIN_TOUR_BOOKING_PROMPTS } from './ai-tour-booking.fixtures.js';
import {
  isExplainTourBookingPrompt,
  isTourBookingIntent,
  parseExplainTourBookingFromPrompt,
  rescueTourBookingIntent,
} from './ai-tour-booking.util.js';

describe('ai-tour-booking.util', () => {
  it.each(EXPLAIN_TOUR_BOOKING_PROMPTS)(
    'detects explain tour booking prompt $id',
    ({ prompt }) => {
      expect(isExplainTourBookingPrompt(prompt)).toBe(true);
      expect(parseExplainTourBookingFromPrompt(prompt)).not.toBeNull();
    },
  );

  it('rescues unknown action to explain_tour_booking', () => {
    expect(
      rescueTourBookingIntent(
        'What is the max group size for City Tour on this booking page?',
        'unknown',
      ),
    ).toEqual({
      action: 'explain_tour_booking',
      rescueReason: 'explain_tour_booking',
    });
  });

  it('does not rescue when action is already explain_tour_booking', () => {
    expect(
      rescueTourBookingIntent(
        'How long is the Sunset Hike here?',
        'explain_tour_booking',
      ),
    ).toBeNull();
  });

  it('does not steal dashboard tour catalog prompts', () => {
    const prompt = 'List tour services with group sizes and cover images';
    expect(isExplainTourBookingPrompt(prompt)).toBe(false);
    expect(rescueTourBookingIntent(prompt, 'unknown')).toBeNull();
  });

  it('does not steal generic checkout currency prompts', () => {
    const prompt = 'Why do prices show euros on the booking page?';
    expect(isExplainTourBookingPrompt(prompt)).toBe(false);
  });

  it('parses service name and aspect from params', () => {
    const parsed = parseExplainTourBookingFromPrompt(
      'What is the max group size for City Tour on this booking page?',
      { serviceName: 'City Tour', aspect: 'groupSize' },
    );
    expect(parsed).toEqual({
      serviceId: undefined,
      serviceName: 'City Tour',
      aspect: 'groupSize',
    });
  });

  it('recognizes tour booking intent id', () => {
    expect(isTourBookingIntent('explain_tour_booking')).toBe(true);
    expect(isTourBookingIntent('explain_checkout_currency')).toBe(false);
  });
});
