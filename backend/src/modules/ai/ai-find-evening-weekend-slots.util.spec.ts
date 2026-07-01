import {
  FIND_EVENING_WEEKEND_SLOTS_PROMPTS,
  FIND_EVENING_WEEKEND_SLOTS_RESCUE_SCENARIOS,
} from './ai-find-evening-weekend-slots.fixtures.js';
import { FIND_EVENING_WEEKEND_SLOTS_MULTILINGUAL_SCENARIOS } from './ai-find-evening-weekend-slots-multilingual.fixtures.js';
import { CONSUMER_DISCOVERY_CHIP_FIXTURES } from './ai-consumer-discovery-chips.fixtures.js';
import {
  isFindEveningWeekendSlotsIntent,
  isFindEveningWeekendSlotsPrompt,
  parseFindEveningWeekendSlotsFromPrompt,
  rescueFindEveningWeekendSlotsIntent,
} from './ai-find-evening-weekend-slots.util.js';
import { isFindServicesUnderBudgetPrompt } from './ai-find-services-under-budget.util.js';

describe('ai-find-evening-weekend-slots.util (ai-cmd-customer-4.20.4)', () => {
  it.each(FIND_EVENING_WEEKEND_SLOTS_PROMPTS)(
    'detects prompt $id',
    ({ prompt, expectedParams }) => {
      expect(isFindEveningWeekendSlotsPrompt(prompt)).toBe(true);
      expect(parseFindEveningWeekendSlotsFromPrompt(prompt)).toMatchObject(
        expectedParams ?? {},
      );
    },
  );

  it.each(FIND_EVENING_WEEKEND_SLOTS_MULTILINGUAL_SCENARIOS)(
    'detects multilingual prompt $id',
    ({ prompt }) => {
      expect(isFindEveningWeekendSlotsPrompt(prompt)).toBe(true);
    },
  );

  it.each(FIND_EVENING_WEEKEND_SLOTS_RESCUE_SCENARIOS)(
    'rescues $id',
    ({ prompt, misclassifiedAction, expectedAction }) => {
      expect(
        rescueFindEveningWeekendSlotsIntent(prompt, misclassifiedAction),
      ).toEqual({
        action: expectedAction,
        rescueReason: 'evening_weekend_discover_chip',
      });
    },
  );

  it('wires evening/weekend discover chip prompt from consumer fixtures', () => {
    const chip = CONSUMER_DISCOVERY_CHIP_FIXTURES.find(
      (row) => row.id === 'discover-chip-evening-weekend-en',
    )!;
    expect(isFindEveningWeekendSlotsPrompt(chip.prompt)).toBe(true);
    expect(parseFindEveningWeekendSlotsFromPrompt(chip.prompt)).toMatchObject({
      serviceCategory: 'facial',
      availabilityWindows: [
        { timeOfDay: 'evening' },
        { weekdays: ['saturday', 'sunday'] },
      ],
    });
  });

  it('does not steal general availability or budget prompts', () => {
    expect(isFindEveningWeekendSlotsPrompt('Who is free tomorrow?')).toBe(
      false,
    );
    expect(isFindEveningWeekendSlotsPrompt('Services under $50')).toBe(false);
    expect(isFindServicesUnderBudgetPrompt('Services under $50')).toBe(true);
  });

  it('does not steal book compounds', () => {
    expect(
      isFindEveningWeekendSlotsPrompt(
        'Book nearest evening slot Saturday for massage',
      ),
    ).toBe(false);
  });

  it('returns null rescue when already classified correctly', () => {
    expect(
      rescueFindEveningWeekendSlotsIntent(
        'Evening or weekend slots for a facial',
        'find_evening_weekend_slots',
      ),
    ).toBeNull();
  });

  it('recognizes find_evening_weekend_slots intent', () => {
    expect(isFindEveningWeekendSlotsIntent('find_evening_weekend_slots')).toBe(
      true,
    );
    expect(isFindEveningWeekendSlotsIntent('check_availability')).toBe(false);
  });

  it('detects heuristic evening/weekend phrasing without exact fixture match', () => {
    expect(
      isFindEveningWeekendSlotsPrompt('Any weekend or evening openings?'),
    ).toBe(true);
  });

  it('rejects specialist-rank prompts without evening/weekend focus', () => {
    expect(
      isFindEveningWeekendSlotsPrompt('Best rated stylist this week'),
    ).toBe(false);
  });
});
