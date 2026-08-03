import {
  BOOK_TOUR_NEAREST_DEPARTURE_PROMPTS,
  BOOK_TOUR_NEAREST_DEPARTURE_RESCUE_SCENARIOS,
} from './ai-book-tour-nearest-departure.fixtures.js';
import { BOOK_TOUR_NEAREST_DEPARTURE_MULTILINGUAL_SCENARIOS } from './ai-book-tour-nearest-departure-multilingual.fixtures.js';
import {
  decomposeCustomerBookTourNearestDepartureCompoundPrompt,
  decomposePublicBookTourNearestDepartureCompoundPrompt,
  extractLeadingTourNamePrompt,
  extractTourServiceNameFromBookingPrompt,
  hasTourBookingMutateTopic,
  hasTourNearestDepartureCue,
  isBookTourNearestDepartureCompoundPrompt,
  rescueBookTourNearestDepartureCompoundIntent,
} from './ai-book-tour-nearest-departure.util.js';
import {
  decomposeDeterministicForSurface,
  matchGoldenCompoundPattern,
} from './intent-decomposition.util.js';

describe('ai-book-tour-nearest-departure.util (ai-cmd-customer-4.10.5)', () => {
  it.each(
    BOOK_TOUR_NEAREST_DEPARTURE_PROMPTS.map((row) => [row.id, row] as const),
  )('detects compound prompt for $id', (_id, row) => {
    expect(isBookTourNearestDepartureCompoundPrompt(row.prompt)).toBe(true);
  });

  it.each(
    BOOK_TOUR_NEAREST_DEPARTURE_MULTILINGUAL_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('detects multilingual compound prompt for $id', (_id, row) => {
    expect(isBookTourNearestDepartureCompoundPrompt(row.prompt)).toBe(true);
  });

  it.each(
    BOOK_TOUR_NEAREST_DEPARTURE_RESCUE_SCENARIOS.map(
      (row) => [row.id, row] as const,
    ),
  )('rescues misclassified action to compound_intent for $id', (_id, row) => {
    expect(
      rescueBookTourNearestDepartureCompoundIntent(
        row.prompt,
        row.misclassifiedAction,
      ),
    ).toEqual({
      action: 'compound_intent',
      rescueReason: 'book_tour_nearest_departure_compound',
    });
  });

  it.each(
    BOOK_TOUR_NEAREST_DEPARTURE_PROMPTS.filter(
      (row) => row.surface === 'customer',
    ).map((row) => [row.id, row] as const),
  )('decomposes customer compound for $id', (_id, row) => {
    const steps = decomposeCustomerBookTourNearestDepartureCompoundPrompt(
      row.prompt,
    );
    expect(steps.map((step) => step.action)).toEqual([...row.orderedActions]);
    expect(steps[2]?.params.bookingFirstAvailable).toBe(true);
    if (row.paxCount != null) {
      expect(steps[2]?.params.paxCount).toBe(row.paxCount);
    }
    if (row.serviceName) {
      expect(steps[0]?.params.serviceName).toBe(row.serviceName);
    }
  });

  it.each(
    BOOK_TOUR_NEAREST_DEPARTURE_PROMPTS.filter(
      (row) => row.surface === 'public',
    ).map((row) => [row.id, row] as const),
  )('decomposes public compound for $id', (_id, row) => {
    const steps = decomposePublicBookTourNearestDepartureCompoundPrompt(
      row.prompt,
    );
    expect(steps.map((step) => step.action)).toEqual([...row.orderedActions]);
    expect(steps[2]?.params.bookingFirstAvailable).toBe(true);
  });

  it('golden-decomposes customer wine tour prompt', () => {
    const prompt = 'Book the wine tour earliest date for 2 people';
    const golden = matchGoldenCompoundPattern('customer', prompt);
    expect(golden?.recipeId).toBe('book_tour_nearest_departure');
    expect(golden?.steps.map((step) => step.action)).toEqual([
      'explain_tour_booking',
      'explain_tour_day_slots',
      'book_nearest_slot',
    ]);
    expect(golden?.steps[2]?.params.paxCount).toBe(2);
  });

  it('deterministic registry resolves customer recipe', () => {
    const prompt = 'Book the wine tour earliest date for 2 people';
    const result = decomposeDeterministicForSurface('customer', prompt);
    expect(result?.recipeId).toBe('book_tour_nearest_departure');
    expect(result?.steps.length).toBe(3);
  });

  it('deterministic registry resolves public recipe', () => {
    const prompt = 'Reserve mountain trek soonest departure for 4 people';
    const result = decomposeDeterministicForSurface('public', prompt);
    expect(result?.recipeId).toBe('public_book_tour_nearest_departure');
    expect(result?.steps[2]?.action).toBe('book_appointment');
  });

  it('extracts tour service name from booking phrasing', () => {
    expect(
      extractTourServiceNameFromBookingPrompt(
        'Book the wine tour earliest date for 2 people',
      ),
    ).toBe('wine tour');
  });

  it('rejects plain explain tour booking read prompts', () => {
    expect(
      isBookTourNearestDepartureCompoundPrompt(
        'What is the max group size for City Tour on this booking page?',
      ),
    ).toBe(false);
  });

  it('rejects spa package nearest slot compound', () => {
    expect(
      isBookTourNearestDepartureCompoundPrompt(
        'Book the spa package earliest available',
      ),
    ).toBe(false);
  });

  it('returns empty decomposition for non-compound prompt', () => {
    expect(
      decomposeCustomerBookTourNearestDepartureCompoundPrompt(
        'What is the max group size for City Tour?',
      ),
    ).toEqual([]);
  });

  it('does not rescue when already compound_intent', () => {
    expect(
      rescueBookTourNearestDepartureCompoundIntent(
        'Book the wine tour earliest date for 2 people',
        'compound_intent',
      ),
    ).toBeNull();
  });

  it('hasTourNearestDepartureCue matches departure phrasing', () => {
    expect(hasTourNearestDepartureCue('Book wine tour earliest date')).toBe(
      true,
    );
    expect(hasTourNearestDepartureCue('Book wine tour tomorrow')).toBe(false);
  });

  it('hasTourBookingMutateTopic requires tour and book cues', () => {
    expect(hasTourBookingMutateTopic('Book the wine tour earliest date')).toBe(
      true,
    );
    expect(
      hasTourBookingMutateTopic('What tours do you offer on the booking page?'),
    ).toBe(false);
  });

  it('extracts service names from varied booking patterns', () => {
    expect(
      extractTourServiceNameFromBookingPrompt(
        'Schedule 3-Day Mountain Trek first available date',
      ),
    ).toBe('3-Day Mountain Trek');
    expect(
      extractTourServiceNameFromBookingPrompt(
        'Book the "Mountain Trek" tour nearest departure for 2 pax',
      ),
    ).toBe('Mountain Trek');
  });

  it('propagates paxCount across all compound steps', () => {
    const steps = decomposeCustomerBookTourNearestDepartureCompoundPrompt(
      'Book City Tour nearest available departure for 4 guests',
    );
    expect(steps[0]?.params.paxCount).toBe(4);
    expect(steps[1]?.params.paxCount).toBe(4);
    expect(steps[2]?.params.paxCount).toBe(4);
  });

  it('extracts extended tour catalog names from prompt context', () => {
    expect(
      extractTourServiceNameFromBookingPrompt(
        'Book the Wine Country tour earliest date for 2 people',
      ),
    ).toBe('Wine Country tour');
    expect(
      extractTourServiceNameFromBookingPrompt(
        'Reserve the city excursion soonest slot for 2 travelers',
      ),
    ).toBe('city excursion');
  });

  it('rejects generic nearest slot without tour topic', () => {
    expect(
      isBookTourNearestDepartureCompoundPrompt(
        'Book nearest slot for haircut tomorrow',
      ),
    ).toBe(false);
  });

  it('rejects short prompts and diagnose capacity prompts', () => {
    expect(isBookTourNearestDepartureCompoundPrompt('Book tour')).toBe(false);
    expect(
      isBookTourNearestDepartureCompoundPrompt(
        'Why does checkout reject 8 people on Wine Country tour?',
      ),
    ).toBe(false);
  });

  it('matches HY/RU nearest tour departure cues', () => {
    expect(
      isBookTourNearestDepartureCompoundPrompt(
        'Ամրագրիր Wine Country տուրը ամենաառաջին ամսաթվով 2 հոգու համար',
      ),
    ).toBe(true);
    expect(
      isBookTourNearestDepartureCompoundPrompt(
        'Забронируй Wine Country тур на ближайшую дату для 2 человек',
      ),
    ).toBe(true);
  });

  it('buildBookTourNearestDepartureCompoundParams sets aspect hints on steps', () => {
    const steps = decomposePublicBookTourNearestDepartureCompoundPrompt(
      'Book Garni Temple tour earliest opening',
    );
    expect(steps[0]?.params.aspect).toBe('all');
    expect(steps[1]?.params.aspect).toBe('remainingSpots');
  });

  describe('extractLeadingTourNamePrompt (e2e-bug.206)', () => {
    it('extracts the leading name before "for N" with no booking verb', () => {
      expect(
        extractLeadingTourNamePrompt('Wine tour for 6 next Saturday'),
      ).toBe('Wine tour');
      expect(
        extractLeadingTourNamePrompt('City tour for 8 on 15/08/2026'),
      ).toBe('City tour');
      expect(extractLeadingTourNamePrompt('Mountain trek for 5')).toBe(
        'Mountain trek',
      );
    });

    it('returns undefined when the prompt has no leading "<Name> for N" shape', () => {
      expect(
        extractLeadingTourNamePrompt('for 6 people book the wine tour'),
      ).toBeUndefined();
      expect(extractLeadingTourNamePrompt('book my thing please')).toBeUndefined();
      expect(extractLeadingTourNamePrompt('')).toBeUndefined();
    });

    it('returns undefined for a lowercase-leading sentence (no proper-noun-like start)', () => {
      expect(
        extractLeadingTourNamePrompt('wine tour for 6 next Saturday'),
      ).toBeUndefined();
    });
  });
});
