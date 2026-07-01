import { AVAILABILITY_WINDOW_PARSE_SCENARIOS } from './ai-flexible-availability.fixtures.js';
import {
  DASHBOARD_CREATE_BOOKING_SERVICE_SCENARIOS,
  DASHBOARD_FIRST_AVAILABLE_DAY_SCENARIOS,
} from './ai-dashboard-create-booking.fixtures.js';
import {
  enrichDashboardCreateBookingParams,
  findDashboardFirstAvailableAcrossWindows,
  findEarliestSlotOnDayForProviders,
  resolveDashboardCreateBookingService,
  shouldScanExplicitAvailabilityWindows,
  buildDashboardFirstAvailableWindowQueries,
} from './ai-dashboard-create-booking.logic.js';

describe('resolveDashboardCreateBookingService (ai-cmd-ext-1.4)', () => {
  it.each(DASHBOARD_CREATE_BOOKING_SERVICE_SCENARIOS)(
    '$id',
    ({ params, catalog, expectedServiceId, expectNoMatch }) => {
      const result = resolveDashboardCreateBookingService(catalog, params);
      if (expectNoMatch) {
        expect(result.service).toBeNull();
        expect(result.noMatchSummary).toBeTruthy();
        return;
      }
      expect(result.service?.id).toBe(expectedServiceId);
      expect(result.noMatchSummary).toBeNull();
    },
  );
});

describe('findEarliestSlotOnDayForProviders (ai-cmd-ext-1.4)', () => {
  it.each(DASHBOARD_FIRST_AVAILABLE_DAY_SCENARIOS)(
    '$id',
    ({ isoDay, timeZone, timeOfDay, notBeforeTime, providers, expected }) => {
      const pick = findEarliestSlotOnDayForProviders({
        isoDay,
        timeZone,
        timeOfDay,
        notBeforeTime,
        providers,
        isSlotBookable: () => true,
      });
      if (!expected) {
        expect(pick).toBeNull();
        return;
      }
      expect(pick?.employeeId).toBe(expected.employeeId);
      expect(pick?.timeSlot).toBe(expected.timeSlot);
    },
  );
});

describe('findDashboardFirstAvailableAcrossWindows (ai-cmd-ext-1.4)', () => {
  it('picks earliest slot across OR windows', async () => {
    const pick = await findDashboardFirstAvailableAcrossWindows(
      [
        {
          dateKeys: ['2026-06-12'],
          timeOfDay: 'evening',
          notBeforeTime: '17:00',
        },
        { dateKeys: ['2026-06-14'], timeOfDay: 'morning', notBeforeTime: null },
      ],
      async ({ isoDay, timeOfDay }) => {
        if (isoDay === '2026-06-12' && timeOfDay === 'evening') {
          return {
            employeeId: 'e1',
            employeeName: 'Anna',
            timeSlot: '18:00',
            isoDay,
            sortKey: Date.parse(`${isoDay}T18:00:00Z`),
          };
        }
        if (isoDay === '2026-06-14') {
          return {
            employeeId: 'e2',
            employeeName: 'Bob',
            timeSlot: '09:00',
            isoDay,
            sortKey: Date.parse(`${isoDay}T09:00:00Z`),
          };
        }
        return null;
      },
    );

    expect(pick?.employeeId).toBe('e1');
    expect(pick?.timeSlot).toBe('18:00');
    expect(pick?.windowIndex).toBe(0);
  });

  it.each(AVAILABILITY_WINDOW_PARSE_SCENARIOS)(
    'OR window queries from prompt $id',
    async ({ prompt, expectedWindows }) => {
      const enriched = enrichDashboardCreateBookingParams({}, prompt);
      expect(enriched.availabilityWindows).toEqual(expectedWindows);
      const queries = buildDashboardFirstAvailableWindowQueries(
        enriched,
        prompt,
        'UTC',
      );
      expect(shouldScanExplicitAvailabilityWindows(enriched, queries)).toBe(
        true,
      );
    },
  );
});
