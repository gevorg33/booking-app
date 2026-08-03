import {
  E2E306_NO_NEAREST_CASES,
  E2E306_NO_PROVIDERS_CASES,
  E2E306_SLASH_DATE_RE,
} from './ai-e2e306-noslot-slash-date.fixtures.js';
import {
  buildNoNearestSlotMessage,
  buildNoProvidersAvailableMessage,
} from './ai-booking-slot-messages.util.js';
import { buildCheckProvidersSummary } from './ai-provider-availability.util.js';
import { buildRescheduleFirstAvailableNoSlotMessage } from './ai-booking-reschedule-hints.util.js';

describe('e2e-bug.306: no-slot failure messages avoid DD/MM slash', () => {
  it.each(E2E306_NO_NEAREST_CASES)(
    'no nearest slot $id',
    ({ dateKey, serviceName, timeOfDay, expectContains, forbidSlash }) => {
      const message = buildNoNearestSlotMessage({
        serviceName,
        dateKey,
        timeOfDay,
      });
      expect(message).toContain(expectContains);
      expect(message).not.toContain(forbidSlash);
      expect(message).not.toMatch(E2E306_SLASH_DATE_RE);
    },
  );

  it.each(E2E306_NO_PROVIDERS_CASES)(
    'no providers $id',
    ({ dateKey, serviceName, timeOfDay, expectContains, forbidSlash }) => {
      const message = buildNoProvidersAvailableMessage({
        serviceName,
        dateKey,
        timeOfDay,
      });
      expect(message).toContain(expectContains);
      expect(message).not.toContain(forbidSlash);
      expect(message).not.toMatch(E2E306_SLASH_DATE_RE);

      const check = buildCheckProvidersSummary({
        serviceName,
        dateKey,
        providers: [],
        timeOfDay,
      });
      expect(check.summary).toContain(expectContains);
      expect(check.summary).not.toMatch(E2E306_SLASH_DATE_RE);
    },
  );

  it('reschedule first-available no-slot rewrites without slash dates', () => {
    const message = buildRescheduleFirstAvailableNoSlotMessage(
      'Swedish massage',
      'Gevorg',
      { date: '2026-08-02', timeOfDay: 'morning' },
      '',
    );
    expect(message).toMatch(/^No open slot for Gevorg/);
    expect(message).toContain('2 August 2026');
    expect(message).not.toContain('02/08/2026');
    expect(message).not.toMatch(E2E306_SLASH_DATE_RE);
  });

  it('check_providers success summary also avoids slash dates', () => {
    const result = buildCheckProvidersSummary({
      serviceName: 'massage',
      dateKey: '2026-08-02',
      providers: [
        {
          id: 'e1',
          name: 'Karo',
          averageRating: null,
          reviewCount: 0,
          earliestDateKey: '2026-08-02',
          earliestStartTime: '09:00',
          previewTimes: ['09:00'],
          matchedServiceId: 's1',
          matchedServiceName: 'massage',
        },
      ],
    });
    expect(result.summary).toContain('2 August 2026');
    expect(result.summary).not.toMatch(E2E306_SLASH_DATE_RE);
  });
});
