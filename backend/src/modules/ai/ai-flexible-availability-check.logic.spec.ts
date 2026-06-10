import { formatTimeDisplay } from '../../common/utils/date-format.util.js';
import {
  FLEXIBLE_AVAILABILITY_BUDGET_SCENARIOS,
  FLEXIBLE_AVAILABILITY_CHECK_FILTER_SCENARIOS,
  FLEXIBLE_AVAILABILITY_WINDOW_LABEL_SCENARIOS,
} from './ai-flexible-availability.fixtures.js';
import {
  applyBudgetFilterForAvailabilityCheck,
  buildPublicAvailabilityWindowLabel,
  composeAvailabilityNoSlotsSummary,
  composePublicAvailabilityCheckSummary,
  filterPublicProviderSlotsByTimeOfDay,
  shouldGroupPublicAvailabilityByWindow,
} from './ai-flexible-availability-check.logic.js';

describe('ai-flexible-availability-check.logic (avail-1.5)', () => {
  it.each(FLEXIBLE_AVAILABILITY_CHECK_FILTER_SCENARIOS)(
    'filterPublicProviderSlotsByTimeOfDay $id',
    ({ slots, timeOfDay, expectedTimes }) => {
      const filtered = filterPublicProviderSlotsByTimeOfDay(slots, timeOfDay);
      expect(filtered.map((slot) => formatTimeDisplay(slot.startTime))).toEqual(
        expectedTimes,
      );
    },
  );

  it.each(FLEXIBLE_AVAILABILITY_WINDOW_LABEL_SCENARIOS)(
    'buildPublicAvailabilityWindowLabel $id',
    ({ window, todayDateKey, expectedLabel }) => {
      expect(
        buildPublicAvailabilityWindowLabel(
          window,
          'en',
          'UTC',
          todayDateKey,
        ),
      ).toBe(expectedLabel);
    },
  );

  it('shouldGroupPublicAvailabilityByWindow is true for explicit OR windows', () => {
    expect(
      shouldGroupPublicAvailabilityByWindow(
        [
          { dateKeys: ['2026-06-11'], timeOfDay: 'evening' },
          { dateKeys: ['2026-06-13'], timeOfDay: 'afternoon' },
        ],
        {
          availabilityWindows: [
            { date: 'tomorrow', timeOfDay: 'evening' },
            { weekdays: ['friday'], timeOfDay: 'afternoon' },
          ],
        },
      ),
    ).toBe(true);
  });

  it('shouldGroupPublicAvailabilityByWindow is false for single legacy window', () => {
    expect(
      shouldGroupPublicAvailabilityByWindow(
        [{ dateKeys: ['2026-06-11'], timeOfDay: 'evening' }],
        { date: 'tomorrow', timeOfDay: 'evening' },
      ),
    ).toBe(false);
  });

  it('composePublicAvailabilityCheckSummary merges OR windows with section labels', () => {
    const summary = composePublicAvailabilityCheckSummary({
      serviceLabel: 'Massage',
      locale: 'en',
      timeZone: 'UTC',
      singleProvider: true,
      groupByWindow: true,
      windowReports: [
        {
          label: 'Tomorrow evening',
          dayReports: [
            {
              dateKey: '2026-06-11',
              providers: [
                {
                  employeeId: 'e1',
                  employeeName: 'Alice',
                  times: ['17:00', '17:30'],
                  firstSlot: '2026-06-11T17:00:00.000Z',
                },
              ],
            },
          ],
        },
        {
          label: 'Friday afternoon',
          dayReports: [
            {
              dateKey: '2026-06-13',
              providers: [
                {
                  employeeId: 'e1',
                  employeeName: 'Alice',
                  times: ['13:00', '14:00'],
                  firstSlot: '2026-06-13T13:00:00.000Z',
                },
              ],
            },
          ],
        },
      ],
      flatDayReports: [],
      totalDayCount: 2,
    });

    expect(summary).toContain('Open slots for Massage (2 options):');
    expect(summary).toContain('Tomorrow evening:');
    expect(summary).toContain('17:00, 17:30');
    expect(summary).toContain('Friday afternoon:');
    expect(summary).toContain('13:00, 14:00');
  });

  it('composePublicAvailabilityCheckSummary keeps flat layout for single window', () => {
    const summary = composePublicAvailabilityCheckSummary({
      serviceLabel: 'Massage',
      locale: 'en',
      timeZone: 'UTC',
      singleProvider: true,
      groupByWindow: false,
      windowReports: [],
      flatDayReports: [
        {
          dateKey: '2026-06-11',
          providers: [
            {
              employeeId: 'e1',
              employeeName: 'Alice',
              times: ['17:00'],
              firstSlot: '2026-06-11T17:00:00.000Z',
            },
          ],
        },
      ],
      totalDayCount: 1,
    });

    expect(summary).toContain('Open slots for Massage');
    expect(summary).not.toContain('Tomorrow evening:');
    expect(summary).toContain('17:00');
  });
});

describe('ai-flexible-availability-check.logic budget intersection (avail-1.7)', () => {
  it.each(FLEXIBLE_AVAILABILITY_BUDGET_SCENARIOS)(
    'applyBudgetFilterForAvailabilityCheck $id',
    ({ catalog, maxPrice, expectedServiceIds, expectNoMatch }) => {
      const result = applyBudgetFilterForAvailabilityCheck(catalog, maxPrice);
      expect(result.services.map((service) => service.id)).toEqual(
        expectedServiceIds,
      );
      if (expectNoMatch) {
        expect(result.noMatchSummary).toContain('Nothing under $50');
        expect(result.budgetMax).toBe(50);
        return;
      }
      expect(result.noMatchSummary).toBeNull();
      expect(result.budgetMax).toBe(50);
    },
  );

  it('composePublicAvailabilityCheckSummary mentions options under budget cap', () => {
    const summary = composePublicAvailabilityCheckSummary({
      serviceLabel: 'haircut',
      locale: 'en',
      timeZone: 'UTC',
      singleProvider: true,
      groupByWindow: true,
      windowReports: [
        {
          label: 'Tomorrow evening',
          dayReports: [
            {
              dateKey: '2026-06-11',
              providers: [
                {
                  employeeId: 'e1',
                  employeeName: 'Alice',
                  times: ['17:00'],
                  firstSlot: '2026-06-11T17:00:00.000Z',
                },
              ],
            },
          ],
        },
      ],
      flatDayReports: [],
      totalDayCount: 1,
      maxPrice: 50,
    });

    expect(summary).toContain('options under $50');
    expect(summary).toContain('Tomorrow evening:');
  });

  it('composeAvailabilityNoSlotsSummary mentions budget cap when maxPrice set', () => {
    const summary = composeAvailabilityNoSlotsSummary({
      locale: 'en',
      serviceLabel: 'haircut',
      providerLabel: 'any specialist',
      daysLabel: '2',
      maxPrice: 50,
    });

    expect(summary).toContain('options under $50');
    expect(summary).toContain('haircut');
  });
});
