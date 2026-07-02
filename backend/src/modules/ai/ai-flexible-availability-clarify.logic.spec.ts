import {
  FLEXIBLE_AVAILABILITY_BUDGET_CLARIFY_SCENARIOS,
  FLEXIBLE_AVAILABILITY_BUDGET_NO_SLOTS_SCENARIOS,
  FLEXIBLE_AVAILABILITY_NEITHER_WINDOW_SCENARIOS,
  FLEXIBLE_AVAILABILITY_PARTIAL_WINDOW_SCENARIOS,
  FLEXIBLE_AVAILABILITY_OVERLAP_SCENARIOS,
  PUBLIC_AVAIL_HANDLER_INTEGRATION_SCENARIOS,
} from './ai-flexible-availability.fixtures.js';
import { resolvePublicAvailabilityWindows } from './ai-orchestration.helpers.js';
import {
  appendAvailabilityNearestAlternativeNote,
  applyBudgetFilterForAvailabilityCheck,
  composePublicAvailabilityCheckSummary,
  composePublicAvailabilityGroupedEmptyWindowsSummary,
  formatAvailabilityNearestAlternativeNote,
} from './ai-flexible-availability-check.logic.js';
import {
  buildAvailabilityBudgetClarifyDetails,
  buildPublicAvailabilityWindowLabelForCheck,
  detectAvailabilityWindowOverlap,
  mergeIdenticalAvailabilityWindows,
  prepareAvailabilityWindowsForCheck,
} from './ai-flexible-availability-clarify.logic.js';

describe('ai-flexible-availability-clarify.logic (avail-1.9)', () => {
  it.each(FLEXIBLE_AVAILABILITY_OVERLAP_SCENARIOS)(
    'prepareAvailabilityWindowsForCheck $id',
    ({
      id,
      todayDateKey,
      windows,
      expectOverlap,
      expectClarifyNote,
      expectMergedWindowCount,
      expectedLabels,
    }) => {
      const prepared = prepareAvailabilityWindowsForCheck({
        windows,
        locale: 'en',
        timeZone: 'UTC',
        todayDateKey,
      });

      expect(prepared.overlap.hasOverlap).toBe(expectOverlap);
      expect(Boolean(prepared.overlapClarifyNote)).toBe(expectClarifyNote);

      if (expectMergedWindowCount != null) {
        expect(prepared.windows).toHaveLength(expectMergedWindowCount);
      }

      if (expectedLabels) {
        const labels = prepared.windows.map((window) =>
          buildPublicAvailabilityWindowLabelForCheck({
            window,
            overlap: prepared.overlap,
            locale: 'en',
            timeZone: 'UTC',
            todayDateKey,
          }),
        );
        expect(labels).toEqual(expectedLabels);
      }

      if (expectClarifyNote) {
        expect(prepared.overlapClarifyNote).toContain('Tomorrow is Friday');
      }

      if (id === 'avail-no-overlap-tomorrow-friday') {
        expect(prepared.overlapClarifyNote).toBeNull();
      }
    },
  );

  it('prepareAvailabilityWindowsForCheck detects overlap on resolved OR windows', () => {
    const resolved = resolvePublicAvailabilityWindows(
      {
        availabilityWindows: [
          { date: '2026-06-12', timeOfDay: 'evening' },
          { weekdays: ['friday'], timeOfDay: 'afternoon' },
        ],
      },
      undefined,
      'UTC',
      { defaultScanDays: 14, referenceTodayDateKey: '2026-06-11' },
    );

    const prepared = prepareAvailabilityWindowsForCheck({
      windows: resolved,
      locale: 'en',
      timeZone: 'UTC',
      todayDateKey: '2026-06-11',
    });

    expect(prepared.overlap.hasOverlap).toBe(true);
    expect(prepared.overlapClarifyNote).toContain('Tomorrow is Friday');
    expect(prepared.windows).toHaveLength(2);
  });

  it('mergeIdenticalAvailabilityWindows collapses duplicate evening scans', () => {
    const merged = mergeIdenticalAvailabilityWindows([
      { dateKeys: ['2026-06-12'], timeOfDay: 'evening' },
      { dateKeys: ['2026-06-12'], timeOfDay: 'evening' },
    ]);
    expect(merged).toHaveLength(1);
    expect(
      detectAvailabilityWindowOverlap(merged, 'UTC', '2026-06-11').hasOverlap,
    ).toBe(false);
  });

  it.each(FLEXIBLE_AVAILABILITY_BUDGET_CLARIFY_SCENARIOS)(
    'applyBudgetFilterForAvailabilityCheck clarify $id',
    ({ catalog, maxPrice, expectClarify }) => {
      const result = applyBudgetFilterForAvailabilityCheck(catalog, maxPrice);
      expect(Boolean(result.noMatchSummary)).toBe(expectClarify);
      if (expectClarify) {
        expect(result.services).toHaveLength(0);
        expect(result.noMatchSummary).toContain('Nothing under $50');
        expect(buildAvailabilityBudgetClarifyDetails(maxPrice)).toEqual({
          clarify: true,
          reason: 'budget_no_match',
          maxPrice: 50,
        });
      }
    },
  );

  it.each(FLEXIBLE_AVAILABILITY_NEITHER_WINDOW_SCENARIOS)(
    '$id grouped empty OR windows label each section and accept nearest note',
    ({ windowLabels, nearestAlternative }) => {
      const summary = composePublicAvailabilityGroupedEmptyWindowsSummary({
        serviceLabel: 'haircut',
        locale: 'en',
        timeZone: 'UTC',
        singleProvider: true,
        windowReports: windowLabels.map((label) => ({
          label,
          dayReports: [],
        })),
      });

      for (const label of windowLabels) {
        expect(summary).toContain(`${label}:`);
        expect(summary).toContain(`No open slots for ${label}.`);
      }
      expect(summary).not.toContain('Try another day or specialist');

      if (nearestAlternative) {
        const withNearest = appendAvailabilityNearestAlternativeNote(
          summary,
          formatAvailabilityNearestAlternativeNote({
            locale: 'en',
            timeZone: 'UTC',
            employeeName: nearestAlternative.employeeName,
            dateKey: nearestAlternative.dateKey,
            startTime: nearestAlternative.startTime,
          }),
        );
        expect(withNearest).toContain('Nearest opening:');
        expect(withNearest).toContain(nearestAlternative.employeeName);
      }
    },
  );

  it.each(FLEXIBLE_AVAILABILITY_PARTIAL_WINDOW_SCENARIOS)(
    '$id labels filled and empty OR windows distinctly',
    ({ filledWindowLabel, emptyWindowLabel, expectedSlotTime }) => {
      const summary = composePublicAvailabilityCheckSummary({
        serviceLabel: 'facial',
        locale: 'en',
        timeZone: 'UTC',
        singleProvider: true,
        groupByWindow: true,
        windowReports: [
          {
            label: emptyWindowLabel,
            dayReports: [],
          },
          {
            label: filledWindowLabel,
            dayReports: [
              {
                dateKey: '2026-06-13',
                providers: [
                  {
                    employeeId: 'e1',
                    employeeName: 'Alice',
                    times: [expectedSlotTime],
                    firstSlot: '2026-06-13T14:00:00.000Z',
                  },
                ],
              },
            ],
          },
        ],
        flatDayReports: [
          {
            dateKey: '2026-06-13',
            providers: [
              {
                employeeId: 'e1',
                employeeName: 'Alice',
                times: [expectedSlotTime],
                firstSlot: '2026-06-13T14:00:00.000Z',
              },
            ],
          },
        ],
        totalDayCount: 1,
      });

      expect(summary).toContain(`${filledWindowLabel}:`);
      expect(summary).toContain(expectedSlotTime);
      expect(summary).toContain(`No open slots for ${emptyWindowLabel}.`);
    },
  );

  it.each(FLEXIBLE_AVAILABILITY_BUDGET_NO_SLOTS_SCENARIOS)(
    '$id budget filter passes but empty OR windows use availability messaging',
    ({ catalog, maxPrice, windowLabels }) => {
      const budget = applyBudgetFilterForAvailabilityCheck(catalog, maxPrice);
      expect(budget.noMatchSummary).toBeNull();
      expect(budget.services.map((service) => service.id)).toEqual(['h1']);

      const summary = composePublicAvailabilityCheckSummary({
        serviceLabel: 'haircut',
        locale: 'en',
        timeZone: 'UTC',
        singleProvider: true,
        groupByWindow: true,
        maxPrice,
        windowReports: windowLabels.map((label) => ({
          label,
          dayReports: [],
        })),
        flatDayReports: [],
        totalDayCount: 0,
      });

      expect(summary).toContain('options under $50');
      for (const label of windowLabels) {
        expect(summary).toContain(`${label}:`);
        expect(summary).toContain(`No open slots for ${label}.`);
      }
      expect(summary).not.toContain('Nothing under $50');
    },
  );

  it('composePublicAvailabilityCheckSummary prefixes overlap clarify note', () => {
    const summary = composePublicAvailabilityCheckSummary({
      serviceLabel: 'Haircut',
      locale: 'en',
      timeZone: 'UTC',
      singleProvider: true,
      groupByWindow: true,
      overlapClarifyNote:
        'Tomorrow is Friday — these are two time windows on the same day.',
      windowReports: [
        {
          label: 'Friday evening',
          dayReports: [
            {
              dateKey: '2026-06-12',
              providers: [
                {
                  employeeId: 'e1',
                  employeeName: 'Alice',
                  times: ['17:00'],
                  firstSlot: '2026-06-12T17:00:00.000Z',
                },
              ],
            },
          ],
        },
        {
          label: 'Friday afternoon',
          dayReports: [
            {
              dateKey: '2026-06-12',
              providers: [
                {
                  employeeId: 'e1',
                  employeeName: 'Alice',
                  times: ['13:00'],
                  firstSlot: '2026-06-12T13:00:00.000Z',
                },
              ],
            },
          ],
        },
      ],
      flatDayReports: [],
      totalDayCount: 1,
    });

    expect(summary).toContain('Tomorrow is Friday');
    expect(summary).toContain('Friday evening:');
    expect(summary).toContain('Friday afternoon:');
  });

  it.each(
    PUBLIC_AVAIL_HANDLER_INTEGRATION_SCENARIOS.filter((row) =>
      ['avail-slots-window-a-only', 'avail-slots-window-b-only'].includes(
        row.id,
      ),
    ),
  )(
    '$id composePublicAvailabilityCheckSummary lists empty OR window',
    (scenario) => {
      const filledLabel =
        scenario.id === 'avail-slots-window-a-only'
          ? 'Tomorrow evening'
          : 'Friday afternoon';
      const emptyLabel = scenario.expectedEmptyWindowLabels?.[0] ?? '';
      const summary = composePublicAvailabilityCheckSummary({
        serviceLabel: 'Lash extensions',
        locale: 'en',
        timeZone: 'UTC',
        singleProvider: true,
        groupByWindow: true,
        windowReports: [
          {
            label: filledLabel,
            dayReports: [
              {
                dateKey: '2026-06-11',
                providers: [
                  {
                    employeeId: 'e1',
                    employeeName: 'Alice',
                    times: ['18:00'],
                    firstSlot: '2026-06-11T18:00:00.000Z',
                  },
                ],
              },
            ],
          },
          {
            label: emptyLabel,
            dayReports: [],
          },
        ],
        flatDayReports: [],
        totalDayCount: 1,
      });

      expect(summary).toContain(`${filledLabel}:`);
      expect(summary).toContain(`No open slots for ${emptyLabel}.`);
    },
  );
});
