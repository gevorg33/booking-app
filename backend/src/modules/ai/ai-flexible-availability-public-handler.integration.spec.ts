import {
  AVAIL_HANDLER_OUTCOME_SCENARIOS,
  PUBLIC_AVAIL_HANDLER_INTEGRATION_SCENARIOS,
} from './ai-flexible-availability.fixtures.js';
import { assertPublicCheckAvailabilityAvail15Wiring } from './ai-discover-exit.wiring.js';
import {
  buildPublicAvailabilityWindowLabel,
  composePublicAvailabilityCheckSummary,
  filterPublicProviderSlotsByTimeOfDay,
  mergePublicProviderSlotTimes,
  shouldGroupPublicAvailabilityByWindow,
  type PublicAvailabilityDayReport,
  type PublicAvailabilityWindowReport,
} from './ai-flexible-availability-check.logic.js';
import { resolvePublicAvailabilityWindows } from './ai-orchestration.helpers.js';
import { enrichPublicAssistantParamsFromPrompt } from './ai-intent-heuristics.js';

function runPublicAvailabilityHandlerPipeline(input: {
  params: Record<string, unknown>;
  todayDateKey: string;
  employees: Array<{ id: string; name: string }>;
  slotsByKey: Record<string, Array<{ startTime: string; endTime: string }>>;
  serviceLabel?: string;
}): {
  summary: string;
  groupByWindow: boolean;
  windowReports: PublicAvailabilityWindowReport[];
  bestNavigate?: { employeeId: string; startTime: string };
} {
  const windows = resolvePublicAvailabilityWindows(
    input.params,
    undefined,
    'UTC',
    { defaultScanDays: 14, referenceTodayDateKey: input.todayDateKey },
  );
  const groupByWindow = shouldGroupPublicAvailabilityByWindow(
    windows,
    input.params,
  );
  const windowReports: PublicAvailabilityWindowReport[] = [];
  const flatDayReports: PublicAvailabilityDayReport[] = [];
  let bestNavigate: { employeeId: string; startTime: string } | undefined;

  for (const window of windows) {
    const dayReports: PublicAvailabilityDayReport[] = [];

    for (const dateKey of window.dateKeys) {
      const providersForDay: PublicAvailabilityDayReport['providers'] = [];

      for (const employee of input.employees) {
        const rawSlots =
          input.slotsByKey[`${employee.id}:${dateKey}`] ?? [];
        const slots = filterPublicProviderSlotsByTimeOfDay(
          rawSlots,
          window.timeOfDay,
        );
        if (slots.length === 0) continue;

        mergePublicProviderSlotTimes({
          providers: providersForDay,
          employeeId: employee.id,
          employeeName: employee.name,
          slots,
        });

        if (!bestNavigate || slots[0]!.startTime < bestNavigate.startTime) {
          bestNavigate = {
            employeeId: employee.id,
            startTime: slots[0]!.startTime,
          };
        }
      }

      if (providersForDay.length > 0) {
        const dayReport = { dateKey, providers: providersForDay };
        dayReports.push(dayReport);
        flatDayReports.push(dayReport);
      }
    }

    if (groupByWindow) {
      windowReports.push({
        label: buildPublicAvailabilityWindowLabel(
          window,
          'en',
          'UTC',
          input.todayDateKey,
        ),
        dayReports,
      });
    }
  }

  const summary = composePublicAvailabilityCheckSummary({
    serviceLabel: input.serviceLabel ?? 'haircut',
    locale: 'en',
    timeZone: 'UTC',
    singleProvider: input.employees.length === 1,
    groupByWindow,
    windowReports,
    flatDayReports,
    totalDayCount: flatDayReports.length,
  });

  return { summary, groupByWindow, windowReports, bestNavigate };
}

describe('public handleCheckAvailability avail-1.5 wiring (discover-exit-2)', () => {
  it('ships filterPublicProviderSlotsByTimeOfDay and OR window loop in handleCheckAvailability', () => {
    assertPublicCheckAvailabilityAvail15Wiring();
  });
});

describe('public handleCheckAvailability pipeline (avail-1.5 / discover-exit-2)', () => {
  it.each(PUBLIC_AVAIL_HANDLER_INTEGRATION_SCENARIOS)(
    'applies per-window timeOfDay filter for $id',
    ({
      params,
      todayDateKey,
      employees,
      slotsByKey,
      expectedSummaryContains,
      expectedSummaryNotContains = [],
      expectedEmptyWindowLabels = [],
      expectedBestNavigateStartTime,
    }) => {
      const serviceLabel =
        typeof params.serviceCategory === 'string'
          ? String(params.serviceCategory)
          : 'service';
      const result = runPublicAvailabilityHandlerPipeline({
        params,
        todayDateKey,
        employees,
        slotsByKey,
        serviceLabel,
      });

      for (const fragment of expectedSummaryContains) {
        expect(result.summary).toContain(fragment);
      }
      for (const fragment of expectedSummaryNotContains) {
        expect(result.summary).not.toContain(fragment);
      }

      for (const label of expectedEmptyWindowLabels) {
        expect(result.summary).toContain(`No open slots for ${label}.`);
        const report = result.windowReports.find((entry) => entry.label === label);
        expect(report?.dayReports).toEqual([]);
      }

      if (expectedBestNavigateStartTime) {
        expect(result.bestNavigate?.startTime).toBe(expectedBestNavigateStartTime);
      }
    },
  );

  it('groups OR windows with section labels (Tomorrow evening / Friday afternoon)', () => {
    const scenario = PUBLIC_AVAIL_HANDLER_INTEGRATION_SCENARIOS.find(
      (row) => row.id === 'avail-or-tomorrow-friday-en',
    );
    expect(scenario).toBeDefined();

    const result = runPublicAvailabilityHandlerPipeline({
      params: scenario!.params,
      todayDateKey: scenario!.todayDateKey,
      employees: scenario!.employees,
      slotsByKey: scenario!.slotsByKey,
      serviceLabel: 'haircut',
    });

    expect(result.groupByWindow).toBe(true);
    expect(result.windowReports).toHaveLength(2);
    expect(result.windowReports.map((report) => report.label)).toEqual([
      'Tomorrow evening',
      'Friday afternoon',
    ]);
  });

  it.each(
    AVAIL_HANDLER_OUTCOME_SCENARIOS.filter(
      (scenario) =>
        scenario.expectedAction === 'check_availability' &&
        scenario.expectedParams?.availabilityWindows,
    ),
  )(
    'handler outcome $id resolves OR windows with per-window timeOfDay',
    ({ prompt, expectedParams }) => {
      const enriched = enrichPublicAssistantParamsFromPrompt(
        prompt,
        expectedParams ?? {},
        [{ id: 's1', name: 'Haircut' }],
        'check_availability',
      );
      const windows = resolvePublicAvailabilityWindows(
        enriched,
        prompt,
        'UTC',
        { defaultScanDays: 14 },
      );

      expect(windows.length).toBeGreaterThanOrEqual(2);
      expect(
        windows.some((window) => window.timeOfDay === 'evening'),
      ).toBe(true);
      expect(
        windows.some((window) => window.timeOfDay === 'afternoon'),
      ).toBe(true);
      expect(shouldGroupPublicAvailabilityByWindow(windows, enriched)).toBe(true);
    },
  );
});
