import {
  AVAILABILITY_WINDOW_PARSE_SCENARIOS,
  AVAIL_SECTION_H_DASHBOARD_PARITY_SCENARIOS,
} from './ai-flexible-availability.fixtures.js';
import {
  buildDashboardAvailabilityWindowLabel,
  enrichDashboardCheckAvailabilityParams,
  resolveDashboardCheckAvailabilityWindows,
  shouldGroupDashboardAvailabilityByWindow,
} from './ai-dashboard-availability-windows.logic.js';

describe('ai-dashboard-availability-windows.logic (ai-cmd-ext-1.3)', () => {
  it.each(AVAILABILITY_WINDOW_PARSE_SCENARIOS)(
    'enrich + resolve OR windows for dashboard $id',
    ({ prompt, expectedWindows }) => {
      const enriched = enrichDashboardCheckAvailabilityParams({}, prompt);
      expect(enriched.availabilityWindows).toEqual(expectedWindows);
      const windows = resolveDashboardCheckAvailabilityWindows(
        enriched,
        prompt,
        'UTC',
      );
      expect(windows.length).toBeGreaterThanOrEqual(2);
      expect(shouldGroupDashboardAvailabilityByWindow(windows, enriched)).toBe(
        true,
      );
    },
  );

  it.each(AVAIL_SECTION_H_DASHBOARD_PARITY_SCENARIOS)(
    'dashboard parity $id enriches OR windows + allProviders',
    (scenario) => {
      const enriched = enrichDashboardCheckAvailabilityParams(
        {},
        scenario.prompt,
      );
      expect(enriched).toMatchObject(scenario.expectedParams ?? {});
      const windows = resolveDashboardCheckAvailabilityWindows(
        enriched,
        scenario.prompt,
        'UTC',
      );
      expect(windows.length).toBeGreaterThanOrEqual(2);
      expect(shouldGroupDashboardAvailabilityByWindow(windows, enriched)).toBe(
        true,
      );
    },
  );

  it('buildDashboardAvailabilityWindowLabel includes timeOfDay', () => {
    const windows = resolveDashboardCheckAvailabilityWindows(
      enrichDashboardCheckAvailabilityParams(
        {},
        'haircut tomorrow evening or Friday afternoon',
      ),
      'haircut tomorrow evening or Friday afternoon',
      'UTC',
    );
    const label = buildDashboardAvailabilityWindowLabel(
      windows[0],
      'UTC',
      windows[0].dateKeys[0] ?? '2026-06-11',
    );
    expect(label.toLowerCase()).toMatch(/evening|tomorrow/);
  });
});
