import { EXPLAIN_TOUR_DAY_SLOTS_PROMPTS } from './ai-tour-day-slots.fixtures.js';
import {
  isExplainTourDaySlotsPrompt,
  isTourDaySlotsIntent,
  parseExplainTourDaySlotsFromPrompt,
  rescueTourDaySlotsIntent,
} from './ai-tour-day-slots.util.js';

describe('ai-tour-day-slots.util', () => {
  it.each(EXPLAIN_TOUR_DAY_SLOTS_PROMPTS)(
    'detects explain tour day slots prompt $id',
    ({ prompt }) => {
      expect(isExplainTourDaySlotsPrompt(prompt)).toBe(true);
      expect(parseExplainTourDaySlotsFromPrompt(prompt)).not.toBeNull();
    },
  );

  it('rescues unknown action to explain_tour_day_slots', () => {
    expect(
      rescueTourDaySlotsIntent(
        'Why does the 3-Day Mountain Trek only show one departure per day?',
        'unknown',
      ),
    ).toEqual({
      action: 'explain_tour_day_slots',
      rescueReason: 'explain_tour_day_slots',
    });
  });

  it('does not rescue when action is already explain_tour_day_slots', () => {
    expect(
      rescueTourDaySlotsIntent(
        'How many spots are left on 15/08/2026 for Mountain Trek?',
        'explain_tour_day_slots',
      ),
    ).toBeNull();
  });

  it('does not steal tour booking catalog prompts', () => {
    const prompt =
      'What is the max group size for City Tour on this booking page?';
    expect(isExplainTourDaySlotsPrompt(prompt)).toBe(false);
    expect(rescueTourDaySlotsIntent(prompt, 'unknown')).toBeNull();
  });

  it('does not steal availability listing prompts', () => {
    const prompt = 'Who is free tomorrow for a city tour?';
    expect(isExplainTourDaySlotsPrompt(prompt)).toBe(false);
  });

  it('parses service name, date, and aspect from params', () => {
    const parsed = parseExplainTourDaySlotsFromPrompt(
      'How many spots are left on 15/08/2026 for the 3-Day Mountain Trek?',
      {
        serviceName: '3-Day Mountain Trek',
        date: '15/08/2026',
        aspect: 'remainingSpots',
      },
    );
    expect(parsed).toEqual({
      serviceId: undefined,
      serviceName: '3-Day Mountain Trek',
      dateKey: '2026-08-15',
      aspect: 'remainingSpots',
    });
  });

  it('parses general remainingSpots meaning without service name', () => {
    const prompt = 'What does remaining spots mean on this tour booking page?';
    expect(isExplainTourDaySlotsPrompt(prompt)).toBe(true);
    expect(
      parseExplainTourDaySlotsFromPrompt(prompt, { aspect: 'remainingSpots' }),
    ).toEqual({
      serviceId: undefined,
      serviceName: undefined,
      dateKey: undefined,
      aspect: 'remainingSpots',
    });
  });

  it('recognizes tour day slots intent id', () => {
    expect(isTourDaySlotsIntent('explain_tour_day_slots')).toBe(true);
    expect(isTourDaySlotsIntent('explain_tour_booking')).toBe(false);
  });
});
