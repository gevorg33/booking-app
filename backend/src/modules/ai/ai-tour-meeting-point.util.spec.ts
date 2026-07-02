import { EXPLAIN_TOUR_BOOKING_PROMPTS } from './ai-tour-booking.fixtures.js';
import {
  EXPLAIN_TOUR_MEETING_POINT_PROMPTS,
  EXPLAIN_TOUR_MEETING_POINT_RESCUE_SCENARIOS,
} from './ai-tour-meeting-point.fixtures.js';
import { EXPLAIN_TOUR_MEETING_POINT_MULTILINGUAL_SCENARIOS } from './ai-tour-meeting-point-multilingual.fixtures.js';
import { isExplainPreparationNotesPrompt } from './ai-explain-preparation-notes.util.js';
import { isExplainTourBookingPrompt } from './ai-tour-booking.util.js';
import {
  detectExplainTourMeetingPointAction,
  extractTourServiceNameFromMeetingPrompt,
  inferTourMeetingPointAspect,
  isExplainTourMeetingPointPrompt,
  parseExplainTourMeetingPointFromPrompt,
  rescueExplainTourMeetingPointIntent,
} from './ai-tour-meeting-point.util.js';

describe('ai-tour-meeting-point.util (ai-cmd-customer-4.10.6)', () => {
  it.each(EXPLAIN_TOUR_MEETING_POINT_PROMPTS)(
    'detects explain tour meeting point prompt $id',
    ({ prompt }) => {
      expect(isExplainTourMeetingPointPrompt(prompt)).toBe(true);
      expect(parseExplainTourMeetingPointFromPrompt(prompt)).not.toBeNull();
    },
  );

  it.each(EXPLAIN_TOUR_MEETING_POINT_MULTILINGUAL_SCENARIOS)(
    'detects multilingual tour meeting point prompt $id',
    ({ prompt }) => {
      expect(isExplainTourMeetingPointPrompt(prompt)).toBe(true);
      expect(parseExplainTourMeetingPointFromPrompt(prompt)).not.toBeNull();
    },
  );

  it.each(EXPLAIN_TOUR_MEETING_POINT_PROMPTS)(
    'parses aspect for $id',
    ({ prompt, aspect }) => {
      expect(parseExplainTourMeetingPointFromPrompt(prompt)?.aspect).toBe(
        aspect,
      );
    },
  );

  it.each(EXPLAIN_TOUR_MEETING_POINT_PROMPTS)(
    'rescues unknown action to explain_tour_meeting_point for $id',
    ({ prompt }) => {
      expect(rescueExplainTourMeetingPointIntent(prompt, 'unknown')).toEqual({
        action: 'explain_tour_meeting_point',
        rescueReason: 'explain_tour_meeting_point',
      });
    },
  );

  it.each(EXPLAIN_TOUR_MEETING_POINT_RESCUE_SCENARIOS)(
    'rescues misclassified $misclassifiedAction for $id',
    ({ prompt, misclassifiedAction }) => {
      expect(
        rescueExplainTourMeetingPointIntent(prompt, misclassifiedAction),
      ).toEqual({
        action: 'explain_tour_meeting_point',
        rescueReason: 'explain_tour_meeting_point',
      });
    },
  );

  it('detects action from prompt', () => {
    expect(
      detectExplainTourMeetingPointAction('Where do we meet for my tour?'),
    ).toBe('explain_tour_meeting_point');
  });

  it('extracts service name from catalog prompts', () => {
    expect(
      extractTourServiceNameFromMeetingPrompt(
        'What time should I arrive for my Mountain Trek?',
      ),
    ).toBe('Mountain Trek');
  });

  it('infers combined aspect when meeting and arrival are both mentioned', () => {
    expect(
      inferTourMeetingPointAspect(
        'Where do we meet and what time should I arrive for Wine Country tour?',
      ),
    ).toBe('all');
  });

  it('does not steal explain tour booking catalog prompts', () => {
    for (const { prompt } of EXPLAIN_TOUR_BOOKING_PROMPTS) {
      expect(isExplainTourMeetingPointPrompt(prompt)).toBe(false);
    }
  });

  it('does not steal clinic preparation notes prompts', () => {
    expect(
      isExplainPreparationNotesPrompt('Do I need to fast before my visit?'),
    ).toBe(true);
    expect(
      isExplainTourMeetingPointPrompt('Do I need to fast before my visit?'),
    ).toBe(false);
  });

  it('does not steal salon directions prompts', () => {
    expect(
      isExplainTourMeetingPointPrompt('Directions to the salon on Google Maps'),
    ).toBe(false);
  });

  it('parses bookingId and aspect from params', () => {
    expect(
      parseExplainTourMeetingPointFromPrompt('Where do we meet for my tour?', {
        bookingId: 'bk-tour-9',
        aspect: 'arrival_time',
      }),
    ).toEqual(
      expect.objectContaining({
        bookingId: 'bk-tour-9',
        aspect: 'arrival_time',
      }),
    );
  });
});
