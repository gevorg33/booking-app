import {
  FLEXIBLE_AVAILABILITY_BUDGET_CLARIFY_SCENARIOS,
  FLEXIBLE_AVAILABILITY_OVERLAP_SCENARIOS,
} from './ai-flexible-availability.fixtures.js';
import { resolvePublicAvailabilityWindows } from './ai-orchestration.helpers.js';
import {
  applyBudgetFilterForAvailabilityCheck,
  composePublicAvailabilityCheckSummary,
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
      { defaultScanDays: 14 },
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
    expect(detectAvailabilityWindowOverlap(merged, 'UTC', '2026-06-11').hasOverlap)
      .toBe(false);
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
});
