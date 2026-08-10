/**
 * e2e-bug.250 — unscoped tour calendar week prompts must not set serviceName
 * from trailing prompt fragments like "I have this week".
 */
export type E2e250TourCalendarServiceNameScenario = {
  id: string;
  prompt: string;
  /** Classifier-injected garbage (or empty). */
  paramsServiceName?: string;
  expectServiceName: string | undefined;
};

export const E2E250_NO_SERVICE_NAME_SCENARIOS: readonly E2e250TourCalendarServiceNameScenario[] =
  [
    {
      id: 'what-tour-bookings-this-week',
      prompt: 'What tour bookings do I have this week?',
      paramsServiceName: 'I have this week',
      expectServiceName: undefined,
    },
    {
      id: 'any-tours-this-week',
      prompt: 'Any tours this week?',
      paramsServiceName: 'Any tours this week',
      expectServiceName: undefined,
    },
    {
      id: 'show-weeks-tour-calendar',
      prompt: "Show me this week's tour calendar",
      paramsServiceName: "this week's tour calendar",
      expectServiceName: undefined,
    },
    {
      id: 'list-tour-departures-provider-week',
      prompt: 'List tour departures on the provider calendar this week',
      paramsServiceName: 'I have this week',
      expectServiceName: undefined,
    },
    {
      id: 'tour-bookings-do-i-have',
      prompt: 'Which tour bookings do I have this week on the calendar?',
      paramsServiceName: 'do I have this week',
      expectServiceName: undefined,
    },
    {
      id: 'unscoped-no-params',
      prompt: 'What tour bookings do I have this week?',
      expectServiceName: undefined,
    },
    {
      id: 'summarize-week-no-service',
      prompt: "Summarize this week's tour departures on the provider calendar",
      paramsServiceName: 'this week',
      expectServiceName: undefined,
    },
    {
      id: 'voice-tour-bookings-week',
      prompt: 'tour bookings I have this week please',
      paramsServiceName: 'I have this week please',
      expectServiceName: undefined,
    },
    {
      id: 'question-mark-unscoped',
      prompt: 'Tour bookings this week?',
      paramsServiceName: 'Tour bookings this week',
      expectServiceName: undefined,
    },
    {
      id: 'show-tours-current-week',
      prompt:
        'Show tour bookings with service and pax on the current calendar week',
      paramsServiceName: 'current calendar week',
      expectServiceName: undefined,
    },
  ];

/** Real tour filters must still parse. */
export const E2E250_KEEP_SERVICE_NAME_SCENARIOS: readonly E2e250TourCalendarServiceNameScenario[] =
  [
    {
      id: 'mountain-trek-keep',
      prompt: 'Mountain trek tours on this calendar week with pax',
      expectServiceName: 'Mountain trek',
    },
    {
      id: 'mountain-trek-params-keep',
      prompt: 'List tour departures on the provider calendar this week',
      paramsServiceName: 'Mountain trek',
      expectServiceName: 'Mountain trek',
    },
    {
      id: 'city-tour-keep',
      prompt: 'City tour tours on this calendar week with pax',
      expectServiceName: 'City tour',
    },
  ];
