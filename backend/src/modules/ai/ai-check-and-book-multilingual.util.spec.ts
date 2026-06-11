import {
  MULTILINGUAL_CHECK_AND_BOOK_CORE_PROMPTS,
  MULTILINGUAL_FLEXIBLE_BOOKING_PROMPTS,
} from './ai-check-and-book-multilingual.fixtures.js';
import {
  isMultilingualBookNearestPrompt,
  isMultilingualCheckProvidersPrompt,
  isMultilingualFirstAvailableBookingPrompt,
  parseMultilingualTimeOfDayWindow,
  promptMentionsMultilingualTomorrow,
} from './ai-check-and-book-multilingual.util.js';
import {
  decomposePaymentsCompoundPrompt,
  isBookNearestSlotPrompt,
  isCheckProvidersForServicePrompt,
} from './ai-payments.util.js';
import { isFirstAvailableBookingPrompt } from './ai-intent-heuristics.js';
import { needsMultilingualNormalization } from './ai-prompt-i18n.js';

describe('ai-check-and-book-multilingual.util', () => {
  describe('detection helpers', () => {
    it.each(MULTILINGUAL_CHECK_AND_BOOK_CORE_PROMPTS)(
      'detects check+book compound phrasing: $id',
      ({ prompt }) => {
        expect(needsMultilingualNormalization(prompt)).toBe(true);
        expect(isMultilingualCheckProvidersPrompt(prompt)).toBe(true);
        expect(isMultilingualBookNearestPrompt(prompt)).toBe(true);
        expect(isCheckProvidersForServicePrompt(prompt)).toBe(true);
        expect(isBookNearestSlotPrompt(prompt)).toBe(true);
      },
    );

    it('detects hy/ru check-only without book verb', () => {
      const hyOnly = MULTILINGUAL_FLEXIBLE_BOOKING_PROMPTS.find(
        (entry) => entry.id === 'hy-check-providers-only',
      )!.prompt;
      const ruOnly = MULTILINGUAL_FLEXIBLE_BOOKING_PROMPTS.find(
        (entry) => entry.id === 'ru-check-providers-only',
      )!.prompt;
      expect(isMultilingualCheckProvidersPrompt(hyOnly)).toBe(true);
      expect(isMultilingualCheckProvidersPrompt(ruOnly)).toBe(true);
      expect(isMultilingualBookNearestPrompt(hyOnly)).toBe(false);
      expect(isMultilingualBookNearestPrompt(ruOnly)).toBe(false);
    });

    it.each(
      MULTILINGUAL_FLEXIBLE_BOOKING_PROMPTS.filter((entry) =>
        entry.id.includes('book-nearest'),
      ),
    )('detects flexible book phrasing: $id', ({ prompt }) => {
      expect(isMultilingualBookNearestPrompt(prompt)).toBe(true);
      expect(isBookNearestSlotPrompt(prompt)).toBe(true);
      expect(isFirstAvailableBookingPrompt(prompt)).toBe(true);
    });

    it('detects ru OR + book verb as first-available (discover-ru-or-book-en)', () => {
      const prompt = 'Стрижка завтра вечером или в субботу — забронируй';
      expect(isMultilingualFirstAvailableBookingPrompt(prompt)).toBe(true);
      expect(isFirstAvailableBookingPrompt(prompt)).toBe(true);
    });
  });

  describe('time and date parsing', () => {
    it('parses hy/ru evening windows', () => {
      expect(
        parseMultilingualTimeOfDayWindow(
          'Ով է ազատ վաղը երեկոյան permanent lashes-ի համար',
          {},
        ),
      ).toBe('evening');
      expect(
        parseMultilingualTimeOfDayWindow(
          'Кто свободен завтра вечером для permanent lashes',
          {},
        ),
      ).toBe('evening');
    });

    it('detects tomorrow in hy/ru/translit', () => {
      expect(promptMentionsMultilingualTomorrow('վաղը երեկոյան')).toBe(true);
      expect(promptMentionsMultilingualTomorrow('завтра вечером')).toBe(true);
      expect(promptMentionsMultilingualTomorrow('vagh@ vecherom')).toBe(true);
    });
  });

  describe('compound decomposition', () => {
    it.each(MULTILINGUAL_CHECK_AND_BOOK_CORE_PROMPTS)(
      'decomposes hy/ru check+book: $id',
      ({ prompt, serviceName, timeOfDay }) => {
        const steps = decomposePaymentsCompoundPrompt(prompt);
        expect(steps.map((step) => step.action)).toEqual([
          'check_providers_for_service',
          'book_nearest_slot',
        ]);
        expect(steps[0]?.params.serviceName).toBe(serviceName);
        if (timeOfDay) {
          expect(steps[0]?.params.timeOfDay).toBe(timeOfDay);
        }
        expect(steps[1]?.params.bookingFirstAvailable).toBe(true);
      },
    );
  });
});
