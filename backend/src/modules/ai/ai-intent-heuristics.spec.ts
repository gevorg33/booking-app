import {
  extractProviderFallbackFromPrompt,
  extractServiceFromPrompt,
  extractRescheduleTargetDate,
  extractRescheduleSourceDate,
  extractRescheduleSourceTime,
  extractProviderPossessiveFromReschedulePrompt,
  extractCustomerFromReschedulePrompt,
  isFirstAvailableBookingPrompt,
  isBulkAllAppointmentsPrompt,
  isRecommendSpecialistsPrompt,
} from './ai-intent-heuristics.js';

describe('ai-intent-heuristics', () => {
  const employees = [
    { id: '1', name: 'Gevorg Gasparyan' },
    { id: '2', name: 'Mary Torgomyan' },
  ];

  const services = [
    { id: 's1', name: 'facemassage' },
    { id: 's2', name: 'full body massage' },
  ];

  describe('extractServiceFromPrompt', () => {
    it('extracts body massage after time when catalog has full body massage', () => {
      const result = extractServiceFromPrompt(
        'book appintment on Gevorg on june 8th from 14:00 body massage',
        services,
      );
      expect(result?.name).toBe('full body massage');
    });

    it('extracts facemassage at end of booking prompt', () => {
      const result = extractServiceFromPrompt(
        'book appintment on Gevorg on june 8th from 13:00 facemassage',
        services,
      );
      expect(result?.name).toBe('facemassage');
    });

    it('does not treat appointment typo as a service name', () => {
      const result = extractServiceFromPrompt(
        'book appintment on Gevorg tomorrow at 10:00',
        services,
      );
      expect(result).toBeUndefined();
    });
  });

  describe('reschedule nearest free time parsing', () => {
    const prompt =
      'Move Jujos appointment on June 10 from 16-17 to june 11th nearest free time';

    it('parses destination date without nearest-free suffix', () => {
      expect(extractRescheduleTargetDate(prompt, 'UTC')).toBe('11_06_2026');
    });

    it('parses source date and time window', () => {
      expect(extractRescheduleSourceDate(prompt, 'UTC')).toBe('10_06_2026');
      expect(extractRescheduleSourceTime(prompt)).toBe('16:00');
    });

    it('detects nearest free time intent', () => {
      expect(isFirstAvailableBookingPrompt(prompt)).toBe(true);
    });
  });

  describe('provider possessive reschedule', () => {
    const employees = [
      { id: 'e1', name: 'Gevorg Gasparyan' },
      { id: 'e2', name: 'Mary Torgomyan' },
    ];
    const customers = [
      { id: 'c1', name: 'Gevorg G' },
      { id: 'c2', name: 'Jujo' },
    ];
    const prompt =
      "Move Gevorg's appointment on June 1 to June 2nd nearest free time";

    it('treats Gevorg as provider, not customer', () => {
      expect(extractProviderPossessiveFromReschedulePrompt(prompt, employees)?.name).toBe(
        'Gevorg Gasparyan',
      );
      expect(extractCustomerFromReschedulePrompt(prompt, customers, employees)).toBeUndefined();
    });

    it('parses June 1 as source and June 2 as destination', () => {
      expect(extractRescheduleSourceDate(prompt, 'UTC')).toBe('01_06_2026');
      expect(extractRescheduleTargetDate(prompt, 'UTC')).toBe('02_06_2026');
    });
  });

  describe('extractProviderFallbackFromPrompt', () => {
    it('extracts ordered providers from conditional booking prompt', () => {
      const result = extractProviderFallbackFromPrompt(
        'Book facemassage on Gevorg tomorrow at 9; if not available then Mary; if not whoever is free',
        employees,
      );
      expect(result.providerFallbackNames).toEqual(['Gevorg Gasparyan', 'Mary Torgomyan']);
      expect(result.fallbackAnyProvider).toBe(true);
    });

    it('returns empty for simple booking without fallback language', () => {
      const result = extractProviderFallbackFromPrompt(
        'Book facemassage with Gevorg tomorrow at 10:00',
        employees,
      );
      expect(result.providerFallbackNames).toEqual([]);
      expect(result.fallbackAnyProvider).toBe(false);
    });
  });

  describe('isBulkAllAppointmentsPrompt', () => {
    it('detects cancel all appointments for provider', () => {
      expect(
        isBulkAllAppointmentsPrompt('cancel any/all appointments for gevorg on 01_06_2026'),
      ).toBe(true);
    });

    it('does not treat service-specific cancel as bulk all', () => {
      expect(
        isBulkAllAppointmentsPrompt('cancel hot stone massage for gevorg on 01_06_2026'),
      ).toBe(false);
    });
  });

  describe('isRecommendSpecialistsPrompt', () => {
    it('detects best rated specialists queries', () => {
      expect(
        isRecommendSpecialistsPrompt('best rated specialists for massage this week'),
      ).toBe(true);
      expect(
        isRecommendSpecialistsPrompt('suggest top specialists for haircut on Monday'),
      ).toBe(true);
    });

    it('does not match plain availability', () => {
      expect(isRecommendSpecialistsPrompt('free slots on Monday for Gevorg')).toBe(false);
    });
  });
});
