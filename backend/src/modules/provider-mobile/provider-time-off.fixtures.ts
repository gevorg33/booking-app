/** prov-exp-7.2 — provider time-off request scenarios. */

export const PROVIDER_TIME_OFF_SETTINGS_SCENARIOS = [
  {
    id: 'disabled-by-default',
    raw: {},
    expectedEnabled: false,
  },
  {
    id: 'enabled-flag',
    raw: { providerTimeOff: { enabled: true } },
    expectedEnabled: true,
  },
] as const;

export const PROVIDER_TIME_OFF_RANGE_SCENARIOS = [
  {
    id: 'single-day-valid',
    input: {
      startDate: '2026-06-10',
      endDate: '2026-06-10',
      dailyStartTime: '09:00',
      dailyEndTime: '17:00',
    },
    expectedError: null,
  },
  {
    id: 'multi-day-valid',
    input: {
      startDate: '2026-06-10',
      endDate: '2026-06-12',
      dailyStartTime: '00:00',
      dailyEndTime: '23:59',
    },
    expectedError: null,
  },
  {
    id: 'end-before-start',
    input: {
      startDate: '2026-06-12',
      endDate: '2026-06-10',
      dailyStartTime: '09:00',
      dailyEndTime: '17:00',
    },
    expectedError: 'End date must be on or after start date',
  },
  {
    id: 'daily-window-invalid',
    input: {
      startDate: '2026-06-10',
      endDate: '2026-06-10',
      dailyStartTime: '17:00',
      dailyEndTime: '09:00',
    },
    expectedError: 'Daily end time must be after start time',
  },
] as const;

export const PROVIDER_TIME_OFF_BLOCK_BUILD_SCENARIOS = [
  {
    id: 'single-day',
    employeeId: 'emp-1',
    request: {
      startDate: '2026-06-10',
      endDate: '2026-06-10',
      dailyStartTime: '09:00',
      dailyEndTime: '17:00',
      reason: 'Doctor',
    },
    expectedRepetitive: false,
    expectedStart: '2026-06-10T09:00:00.000Z',
    expectedEnd: '2026-06-10T17:00:00.000Z',
  },
  {
    id: 'multi-day',
    employeeId: 'emp-1',
    request: {
      startDate: '2026-06-10',
      endDate: '2026-06-12',
      dailyStartTime: '00:00',
      dailyEndTime: '23:59',
      reason: 'Vacation',
    },
    expectedRepetitive: true,
    expectedStartDay: '2026-06-10',
    expectedEndDay: '2026-06-12',
  },
] as const;

export const DASHBOARD_TIME_OFF_CLASSIFIER_RULES = `- list_time_off_requests: READ — pending/approved provider time-off requests (manager). Triggers: time off requests|who requested off|pending PTO|vacation requests. NOT block_schedule (direct block).
- approve_time_off_request: MUTATE — approve a pending provider time-off request; blocks calendar on approval. Triggers: approve Sam's time off|approve vacation request|grant time off. Requires requestId or employeeName + date.
- deny_time_off_request: MUTATE — deny a pending time-off request. Triggers: deny time off|reject vacation request.`;

export const PROVIDER_TIME_OFF_CLASSIFIER_RULES = `- request_time_off: MUTATE — submit unavailable date range for manager approval (own calendar). Triggers: request time off|I need Friday off|vacation request|PTO. NOT block_schedule (instant block when enabled).
- list_my_time_off_requests: READ — own pending/approved/denied time-off requests. Triggers: my time off status|did my vacation get approved|pending PTO.`;

export const SIMILAR_DASHBOARD_TIME_OFF_PROMPTS = [
  {
    id: 'list-pending',
    prompt: 'Show pending time off requests',
    surface: 'dashboard' as const,
    expectedAction: 'list_time_off_requests',
  },
  {
    id: 'approve-named',
    prompt: "Approve Sam's vacation next week",
    surface: 'dashboard' as const,
    expectedAction: 'approve_time_off_request',
  },
  {
    id: 'deny-generic',
    prompt: 'Deny the latest time off request',
    surface: 'dashboard' as const,
    expectedAction: 'deny_time_off_request',
  },
] as const;

export const SIMILAR_PROVIDER_TIME_OFF_PROMPTS = [
  {
    id: 'request-friday',
    prompt: 'Request next Friday off',
    surface: 'provider' as const,
    expectedAction: 'request_time_off',
  },
  {
    id: 'list-status',
    prompt: 'Did my vacation request get approved?',
    surface: 'provider' as const,
    expectedAction: 'list_my_time_off_requests',
  },
] as const;
