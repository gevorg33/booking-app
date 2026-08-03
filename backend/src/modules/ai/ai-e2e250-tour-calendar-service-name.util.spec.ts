import {
  E2E250_KEEP_SERVICE_NAME_SCENARIOS,
  E2E250_NO_SERVICE_NAME_SCENARIOS,
} from './ai-e2e250-tour-calendar-service-name.fixtures.js';
import {
  isPlausibleTourServiceNameFilter,
  parseListTourCalendarWeekFromPrompt,
} from './ai-tour-calendar-week.util.js';

describe('e2e-bug.250 list_tour_calendar_week serviceName fragment guard', () => {
  it.each([
    ['I have this week', false],
    ['do I have this week', false],
    ['this week', false],
    ['Any tours this week', false],
    ['Tour bookings this week', false],
    ['current calendar week', false],
    ['Mountain trek', true],
    ['City tour', true],
    ['Heritage tour', true],
  ] as const)('isPlausibleTourServiceNameFilter(%s) → %s', (name, ok) => {
    expect(isPlausibleTourServiceNameFilter(name)).toBe(ok);
  });

  it.each(
    E2E250_NO_SERVICE_NAME_SCENARIOS.map((row) => [row.id, row] as const),
  )('drops garbage serviceName for %s', (_id, row) => {
    const parsed = parseListTourCalendarWeekFromPrompt(row.prompt, {
      ...(row.paramsServiceName
        ? { serviceName: row.paramsServiceName }
        : {}),
    });
    expect(parsed).not.toBeNull();
    expect(parsed?.serviceName).toBeUndefined();
  });

  it.each(
    E2E250_KEEP_SERVICE_NAME_SCENARIOS.map((row) => [row.id, row] as const),
  )('keeps real serviceName for %s', (_id, row) => {
    const parsed = parseListTourCalendarWeekFromPrompt(row.prompt, {
      ...(row.paramsServiceName
        ? { serviceName: row.paramsServiceName }
        : {}),
    });
    expect(parsed?.serviceName).toBe(row.expectServiceName);
  });
});
