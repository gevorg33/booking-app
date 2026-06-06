import { EXPLAIN_TOUR_BOOKING_RECORD_PROMPTS } from './ai-tour-booking-record.fixtures.js';
import { EXPLAIN_TOUR_SERVICES_PROMPTS } from './ai-tour-service.fixtures.js';
import {
  isExplainTourBookingRecordPrompt,
  parseExplainTourBookingRecordFromPrompt,
  rescueExplainTourBookingRecordIntent,
} from './ai-tour-booking-record.util.js';
import { isExplainTourServicesPrompt } from './ai-tour-service.util.js';

describe('ai-tour-booking-record.util (ai-cmd-tour-7)', () => {
  it.each(EXPLAIN_TOUR_BOOKING_RECORD_PROMPTS)(
    'detects explain tour booking record prompt $id',
    ({ prompt }) => {
      expect(isExplainTourBookingRecordPrompt(prompt)).toBe(true);
      expect(parseExplainTourBookingRecordFromPrompt(prompt)).not.toBeNull();
    },
  );

  it.each(EXPLAIN_TOUR_BOOKING_RECORD_PROMPTS)(
    'rescues unknown action to explain_tour_booking_record for $id',
    ({ prompt }) => {
      expect(rescueExplainTourBookingRecordIntent(prompt, 'unknown')).toEqual({
        action: 'explain_tour_booking_record',
        rescueReason: 'explain_tour_booking_record',
      });
    },
  );

  it('does not steal upcoming tour services list prompts', () => {
    for (const { prompt } of EXPLAIN_TOUR_SERVICES_PROMPTS) {
      expect(isExplainTourBookingRecordPrompt(prompt)).toBe(false);
      expect(isExplainTourServicesPrompt(prompt)).toBe(true);
    }
  });

  it('parses bookingId and aspect from params', () => {
    const parsed = parseExplainTourBookingRecordFromPrompt(
      'Explain tour booking record',
      { bookingId: 'bk-tour-9', aspect: 'dates' },
    );
    expect(parsed).toEqual({
      bookingId: 'bk-tour-9',
      customerName: undefined,
      serviceName: undefined,
      aspect: 'dates',
    });
  });
});
