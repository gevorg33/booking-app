import {
  extractProviderFallbackFromPrompt,
  extractServiceFromPrompt,
  extractRescheduleTargetDate,
  extractRescheduleSourceDate,
  extractRescheduleSourceTime,
  extractRescheduleTargetTime,
  parseAmPmClockTime,
  extractProviderPossessiveFromReschedulePrompt,
  extractCustomerFromReschedulePrompt,
  resolveRescheduleParams,
  isAvailabilityTimeOfDayFollowUp,
  applyAvailabilityFollowUpFromSession,
} from './ai-structural-extractors.js';
import {
  applyPromptMentionedServiceOverrideToParams,
  enrichPublicAssistantParamsFromPrompt,
  enrichBookingTimeHintsFromPrompt,
  isBulkAllAppointmentsPrompt,
  isRecommendSpecialistsPrompt,
} from './ai-booking-param-hints.util.js';
import {
  resolveCustomerMetric,
  resolveBookingMetric,
  resolveStaffMetric,
} from './ai-metric-resolvers.util.js';
import { isFirstAvailableBookingPrompt } from './booking-first-available.semantic.util.js';
import { SIMILAR_CHECK_AND_BOOK_PROMPTS } from './ai-check-and-book.fixtures.js';
import {
  isTotalEarningsPrompt,
  isTopStaffRevenuePrompt,
} from './dashboard-revenue-analytics.util.js';

describe('ai-structural-extractors (pipe-1.13.3)', () => {
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

    it('matches basic cut clarify follow-up to Haircut basic', () => {
      const haircutCatalog = [
        { id: 'hair-35', name: 'Haircut basic' },
        { id: 'hair-45', name: 'Haircut standard' },
        { id: 'hair-75', name: 'Haircut premium' },
      ];
      expect(extractServiceFromPrompt('basic cut', haircutCatalog)?.id).toBe(
        'hair-35',
      );
    });
  });

  describe('applyPromptMentionedServiceOverrideToParams', () => {
    const catalog = [
      { id: 'deep-tissue', name: 'Deep tissue massage' },
      { id: 'face-massage', name: 'Face massage' },
    ];

    it('replaces stale session service when prompt names a different service', () => {
      expect(
        applyPromptMentionedServiceOverrideToParams(
          'please book a facemassage nearest slot',
          {
            serviceId: 'deep-tissue',
            serviceName: 'Deep tissue massage',
            serviceRank: 'highest_price',
          },
          catalog,
        ),
      ).toMatchObject({
        serviceName: 'Face massage',
        serviceId: 'face-massage',
        serviceCategory: null,
      });
      expect(
        applyPromptMentionedServiceOverrideToParams(
          'please book a facemassage nearest slot',
          {
            serviceId: 'deep-tissue',
            serviceName: 'Deep tissue massage',
            serviceRank: 'highest_price',
          },
          catalog,
        ).serviceRank,
      ).toBeUndefined();
    });
  });

  describe('enrichPublicAssistantParamsFromPrompt', () => {
    const salonServices = [
      { id: 'h1', name: 'hairstyle' },
      { id: 'm1', name: 'Swedish massage' },
    ];

    it('overrides stale session serviceName with prompt-mentioned catalog service', () => {
      expect(
        enrichPublicAssistantParamsFromPrompt(
          'give me available slots tomorrow afternoon for hairstyle',
          { serviceName: 'haircut', date: '10/06/2026', timeOfDay: 'afternoon' },
          salonServices,
          'check_availability',
        ),
      ).toEqual({
        serviceName: 'hairstyle',
        serviceCategory: null,
        serviceNames: null,
        date: '10/06/2026',
        timeOfDay: 'afternoon',
      });
    });

    it('extracts unknown service names from prompt when not in catalog', () => {
      expect(
        enrichPublicAssistantParamsFromPrompt(
          'give me available slots tomorrow afternoon for haircut',
          { serviceName: 'hairstyle' },
          salonServices,
          'check_availability',
        ),
      ).toMatchObject({
        serviceName: 'haircut',
        serviceCategory: null,
        date: 'tomorrow',
        timeOfDay: 'afternoon',
      });
    });

    it('resolves basic cut clarify follow-up against haircut catalog', () => {
      const haircutCatalog = [
        { id: 'hair-35', name: 'Haircut basic' },
        { id: 'hair-45', name: 'Haircut standard' },
      ];
      expect(
        enrichPublicAssistantParamsFromPrompt(
          'basic cut',
          {
            maxPrice: 50,
            serviceCategory: 'haircut',
            availabilityWindows: [
              { date: 'tomorrow' },
              { weekdays: ['friday'], timeOfDay: 'afternoon' },
            ],
          },
          haircutCatalog,
          'check_availability',
        ),
      ).toMatchObject({
        serviceName: 'Haircut basic',
        maxPrice: 50,
      });
      expect(
        enrichPublicAssistantParamsFromPrompt(
          'basic cut',
          {
            maxPrice: 50,
            serviceCategory: 'haircut',
            availabilityWindows: [
              { date: 'tomorrow' },
              { weekdays: ['friday'], timeOfDay: 'afternoon' },
            ],
          },
          haircutCatalog,
          'check_availability',
        ).serviceCategory,
      ).toBeNull();
    });

    it('leaves params unchanged for non-service actions', () => {
      const params = { serviceName: 'haircut' };
      expect(
        enrichPublicAssistantParamsFromPrompt(
          'what are your opening hours?',
          params,
          salonServices,
          'business_info',
        ),
      ).toBe(params);
    });

    it('enriches maxPrice when classifier missed budget on list_services (budget-1.3)', () => {
      expect(
        enrichPublicAssistantParamsFromPrompt(
          'I need a haircut, I have $50',
          { serviceCategory: 'haircut' },
          salonServices,
          'list_services',
        ).maxPrice,
      ).toBe(50);
    });

    it('strips maxPrice for gift card prompts on list_services (budget-1.3)', () => {
      expect(
        enrichPublicAssistantParamsFromPrompt(
          'I have a $50 gift card for a haircut',
          { maxPrice: 50, serviceCategory: 'haircut' },
          salonServices,
          'list_services',
        ).maxPrice,
      ).toBeUndefined();
    });

    it('enriches serviceRank when classifier missed premium rank on list_services (rank-1.3)', () => {
      expect(
        enrichPublicAssistantParamsFromPrompt(
          "What's the cheapest haircut you offer?",
          { serviceCategory: 'haircut' },
          salonServices,
          'list_services',
        ).serviceRank,
      ).toBe('lowest_price');
    });

    it('strips serviceRank for specialist rank prompts on list_services (rank-1.3)', () => {
      expect(
        enrichPublicAssistantParamsFromPrompt(
          'Who is the best rated lash specialist this week?',
          { serviceRank: 'highest_price', serviceCategory: 'lashes' },
          salonServices,
          'list_services',
        ).serviceRank,
      ).toBeUndefined();
    });

    it('enriches availabilityWindows when classifier kept only one OR clause (avail-1.3)', () => {
      const enriched = enrichPublicAssistantParamsFromPrompt(
        'I want a haircut tomorrow evening or Friday afternoon',
        {
          serviceCategory: 'haircut',
          date: 'tomorrow',
          timeOfDay: 'evening',
        },
        salonServices,
        'check_availability',
      );
      expect(enriched.availabilityWindows).toEqual([
        { date: 'tomorrow', timeOfDay: 'evening' },
        { weekdays: ['friday'], timeOfDay: 'afternoon' },
      ]);
      expect(enriched.timeOfDay).toBeUndefined();
      expect(enriched.date).toBeUndefined();
    });

    it('does not split AND weekday prompts into availabilityWindows (avail-1.3)', () => {
      const enriched = enrichPublicAssistantParamsFromPrompt(
        'Monday and Friday afternoon for color',
        {
          serviceCategory: 'color',
          weekdays: ['monday', 'friday'],
          timeOfDay: 'afternoon',
        },
        salonServices,
        'check_availability',
      );
      expect(enriched.availabilityWindows).toBeUndefined();
      expect(enriched.weekdays).toEqual(['monday', 'friday']);
      expect(enriched.timeOfDay).toBe('afternoon');
    });
  });

  describe('AM/PM reschedule parsing', () => {
    it('parses 9 AM destination', () => {
      expect(
        extractRescheduleTargetTime(
          "Move Maria's appointment to tomorrow at 9 AM",
          'UTC',
        ),
      ).toBe('09:00');
    });

    it('parses 2:30 pm destination', () => {
      expect(
        extractRescheduleTargetTime(
          'Reschedule Jujo to Friday at 2:30 pm',
          'UTC',
        ),
      ).toBe('14:30');
    });

    it('parses move to tomorrow at 3pm', () => {
      expect(
        extractRescheduleTargetTime(
          'Move the 16:00 appointment to tomorrow at 3pm',
          'UTC',
        ),
      ).toBe('15:00');
    });

    it('normalizes noon and midnight via parseAmPmClockTime', () => {
      expect(parseAmPmClockTime(12, 0, 'pm')).toBe('12:00');
      expect(parseAmPmClockTime(12, 0, 'am')).toBe('00:00');
    });
  });

  describe('reschedule nearest free time parsing', () => {
    const prompt =
      'Move Jujos appointment on June 10 from 16-17 to june 11th nearest free time';
    const futurePrompt =
      'Move Jujos appointment on June 10 2027 from 16-17 to june 11 2027 nearest free time';

    it('parses destination date without nearest-free suffix', () => {
      expect(extractRescheduleTargetDate(futurePrompt, 'UTC')).toBe('11/06/2027');
    });

    it('parses source date and time window', () => {
      expect(extractRescheduleSourceDate(futurePrompt, 'UTC')).toBe('10/06/2027');
      expect(extractRescheduleSourceTime(futurePrompt)).toBe('16:00');
    });

    it('detects nearest free time intent', () => {
      expect(isFirstAvailableBookingPrompt(futurePrompt)).toBe(true);
    });

    it('fills reschedule params for explicit year prompt', () => {
      const params: Record<string, unknown> = {};
      resolveRescheduleParams(params, futurePrompt, 'UTC');
      expect(params.date).toBe('11/06/2027');
      expect(params.fromDate).toBe('10/06/2027');
      expect(params.fromTimeSlot).toBe('16:00');
      expect(params.bookingFirstAvailable).toBe(true);
      expect(params.timeSlot).toBeUndefined();
    });

    it('still parses legacy ordinal prompt without explicit year', () => {
      expect(extractRescheduleSourceTime(prompt)).toBe('16:00');
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
      "Move Gevorg's appointment on June 15 to June 16th nearest free time";

    it('treats Gevorg as provider, not customer', () => {
      expect(
        extractProviderPossessiveFromReschedulePrompt(prompt, employees)?.name,
      ).toBe('Gevorg Gasparyan');
      expect(
        extractCustomerFromReschedulePrompt(prompt, customers, employees),
      ).toBeUndefined();
    });

    it('parses source and destination month-day dates', () => {
      expect(extractRescheduleSourceDate(prompt, 'UTC')).toBe('15/06/2026');
      expect(extractRescheduleTargetDate(prompt, 'UTC')).toBe('16/06/2026');
    });
  });

  describe('extractProviderFallbackFromPrompt', () => {
    it('extracts ordered providers from conditional booking prompt', () => {
      const result = extractProviderFallbackFromPrompt(
        'Book facemassage on Gevorg tomorrow at 9; if not available then Mary; if not whoever is free',
        employees,
      );
      expect(result.providerFallbackNames).toEqual([
        'Gevorg Gasparyan',
        'Mary Torgomyan',
      ]);
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
        isBulkAllAppointmentsPrompt(
          'cancel any/all appointments for gevorg on 01_06_2026',
        ),
      ).toBe(true);
    });

    it('does not treat service-specific cancel as bulk all', () => {
      expect(
        isBulkAllAppointmentsPrompt(
          'cancel hot stone massage for gevorg on 01_06_2026',
        ),
      ).toBe(false);
    });
  });

  describe('resolveCustomerMetric', () => {
    it('maps retention prompts to CRM metrics', () => {
      expect(
        resolveCustomerMetric({}, 'Find customers with the most no-shows'),
      ).toBe('most_no_shows');
      expect(resolveCustomerMetric({}, 'Re-engage inactive customers')).toBe(
        'at_risk',
      );
      expect(resolveCustomerMetric({}, 'Show at-risk customers')).toBe(
        'at_risk',
      );
    });
  });

  describe('earnings and specialist revenue heuristics', () => {
    it('detects total earnings prompts', () => {
      expect(isTotalEarningsPrompt('Calculate total earnings for today')).toBe(
        true,
      );
      expect(isTotalEarningsPrompt('How much did we earn last month?')).toBe(
        true,
      );
      expect(isTotalEarningsPrompt('What is total revenue this week')).toBe(
        true,
      );
      expect(
        resolveBookingMetric({}, 'Calculate total earnings for last week'),
      ).toBe('revenue');
    });

    it('detects top specialist revenue prompts', () => {
      expect(
        isTopStaffRevenuePrompt('Which specialist earned the most today?'),
      ).toBe(true);
      expect(
        isTopStaffRevenuePrompt('Top 3 specialists by revenue last week'),
      ).toBe(true);
      expect(
        isTopStaffRevenuePrompt('Who brought in the most revenue all time?'),
      ).toBe(true);
      expect(
        resolveStaffMetric({}, 'Top 5 specialists by revenue last month'),
      ).toBe('most_revenue');
    });

    it('does not treat customer recommend-specialists as staff revenue analytics', () => {
      expect(
        isTopStaffRevenuePrompt(
          'Suggest top specialists for haircut on Monday',
        ),
      ).toBe(false);
      expect(
        isTotalEarningsPrompt('Top 3 specialists by revenue last week'),
      ).toBe(false);
    });
  });

  describe('isFirstAvailableBookingPrompt', () => {
    it.each([
      'book the soonest slot for massage',
      'schedule the next available appointment',
      'reserve the nearest slot',
      'get the earliest slot',
      'grab the nearest opening',
    ])('detects flexible booking phrasing: %s', (prompt) => {
      expect(isFirstAvailableBookingPrompt(prompt)).toBe(true);
    });

    it.each(SIMILAR_CHECK_AND_BOOK_PROMPTS)(
      'detects flexible booking in compound prompt: $id',
      ({ prompt }) => {
        expect(isFirstAvailableBookingPrompt(prompt)).toBe(true);
      },
    );
  });

  describe('enrichBookingTimeHintsFromPrompt', () => {
    it('sets bookingFirstAvailable, timeOfDay, and allProviders for check-and-book wording', () => {
      const params: Record<string, unknown> = {
        serviceName: 'permanent lashes',
        timeSlot: '10:00',
      };
      enrichBookingTimeHintsFromPrompt(
        'create_booking',
        params,
        "who's free tomorrow evening for permanent lashes, book the nearest slot",
      );
      expect(params.bookingFirstAvailable).toBe(true);
      expect(params.timeOfDay).toBe('evening');
      expect(params.allProviders).toBe(true);
      expect(params.timeSlot).toBeUndefined();
    });

    it('enriches check_providers_for_service without flexible booking flag', () => {
      const params: Record<string, unknown> = { serviceName: 'massage' };
      enrichBookingTimeHintsFromPrompt(
        'check_providers_for_service',
        params,
        'who is free tomorrow evening for massage',
      );
      expect(params.timeOfDay).toBe('evening');
      expect(params.allProviders).toBe(true);
      expect(params.bookingFirstAvailable).toBeUndefined();
    });

    it('enriches check_availability with timeOfDay and allProviders (avail-single-tomorrow-evening-en)', () => {
      const params: Record<string, unknown> = {};
      enrichBookingTimeHintsFromPrompt(
        'check_availability',
        params,
        "Who's free tomorrow evening for massage?",
      );
      expect(params.timeOfDay).toBe('evening');
      expect(params.allProviders).toBe(true);
      expect(params.bookingFirstAvailable).toBeUndefined();
    });

    it('sets allProviders for any-slots phrasing on check_availability', () => {
      const params: Record<string, unknown> = {};
      enrichBookingTimeHintsFromPrompt(
        'check_availability',
        params,
        'Any slots Friday afternoon for a facial?',
      );
      expect(params.timeOfDay).toBe('afternoon');
      expect(params.allProviders).toBe(true);
    });

    it('always marks book_nearest_slot as first-available', () => {
      const params: Record<string, unknown> = {
        serviceName: 'massage',
        timeSlot: '10:00',
      };
      enrichBookingTimeHintsFromPrompt(
        'book_nearest_slot',
        params,
        'book nearest massage tomorrow evening',
      );
      expect(params.bookingFirstAvailable).toBe(true);
      expect(params.timeSlot).toBeUndefined();
      expect(params.timeOfDay).toBe('evening');
    });

    it('clears stale timeSlot when prompt names an explicit time range', () => {
      const params: Record<string, unknown> = {
        serviceName: 'hairstyle',
        employeeName: 'Jujo Karapetyan',
        timeSlot: '11:00',
        date: '2026-06-15',
      };
      enrichBookingTimeHintsFromPrompt(
        'check_availability',
        params,
        'is Jujo available for hairstyle from 17:00-19:00?',
      );
      expect(params.timeFrom).toBe('17:00');
      expect(params.timeTo).toBe('19:00');
      expect(params.timeSlot).toBeUndefined();
      expect(params.timeOfDay).toBeUndefined();
    });
  });

  describe('availability follow-up context', () => {
    it('detects short time-of-day refinements', () => {
      expect(isAvailabilityTimeOfDayFollowUp('evening?')).toBe(true);
      expect(isAvailabilityTimeOfDayFollowUp('what about morning')).toBe(true);
      expect(
        isAvailabilityTimeOfDayFollowUp(
          'who is available tomorrow evening for massage',
        ),
      ).toBe(false);
    });

    it('binds evening follow-up to the provider from the last availability result', () => {
      const params: Record<string, unknown> = {
        employeeName: 'Gevorg Gasparyan',
      };
      applyAvailabilityFollowUpFromSession(
        'evening?',
        params,
        {
          lastAction: 'check_providers_for_service',
          availableProviders: ['Jujo Karapetyan'],
          serviceName: 'hairstyle',
          date: '12/06/2026',
        },
        employees,
      );
      expect(params.employeeName).toBe('Jujo Karapetyan');
      expect(params.allProviders).toBe(false);
      expect(params.timeOfDay).toBe('evening');
    });
  });

  describe('isRecommendSpecialistsPrompt', () => {
    it('detects best rated specialists queries', () => {
      expect(
        isRecommendSpecialistsPrompt(
          'best rated specialists for massage this week',
        ),
      ).toBe(true);
      expect(
        isRecommendSpecialistsPrompt(
          'suggest top specialists for haircut on Monday',
        ),
      ).toBe(true);
    });

    it('does not match plain availability', () => {
      expect(
        isRecommendSpecialistsPrompt('free slots on Monday for Gevorg'),
      ).toBe(false);
    });
  });
});
