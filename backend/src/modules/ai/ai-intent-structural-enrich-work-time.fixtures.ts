/** pipe-1.7.2 — default work-time periods for create_direct_schedule. */
export const WORK_TIME_DEFAULT_PIPE_MARKER = 'pipe-1.7.2';

export type WorkTimeDefaultFixtureScenario = {
  id: string;
  prompt: string;
  params?: Record<string, unknown>;
  expectAppliedDefault: boolean;
  expectTimeFrom?: string;
  expectTimeTo?: string;
  expectPeriodStart?: string;
  expectPeriodEnd?: string;
};

export const WORK_TIME_DEFAULT_SCENARIOS: WorkTimeDefaultFixtureScenario[] = [
  {
    id: 'work-time-no-hours',
    prompt: 'Create work time for Gevorg next week',
    params: { date: '2026-06-16' },
    expectAppliedDefault: true,
    expectTimeFrom: '09:00',
    expectTimeTo: '19:00',
    expectPeriodStart: '09:00',
    expectPeriodEnd: '19:00',
  },
  {
    id: 'direct-schedule-no-hours',
    prompt: 'Set direct schedule for Maria tomorrow',
    params: {},
    expectAppliedDefault: true,
    expectTimeFrom: '09:00',
    expectTimeTo: '19:00',
    expectPeriodStart: '09:00',
    expectPeriodEnd: '19:00',
  },
  {
    id: 'explicit-hours-in-prompt',
    prompt: 'Create work time for Gevorg tomorrow 10-18',
    params: {},
    expectAppliedDefault: false,
    expectTimeFrom: '10:00',
    expectTimeTo: '18:00',
    expectPeriodStart: '10:00',
    expectPeriodEnd: '18:00',
  },
  {
    id: 'explicit-hours-in-params',
    prompt: 'Create work time for Gevorg tomorrow',
    params: { timeFrom: '08:00', timeTo: '17:00' },
    expectAppliedDefault: false,
    expectTimeFrom: '08:00',
    expectTimeTo: '17:00',
    expectPeriodStart: '08:00',
    expectPeriodEnd: '17:00',
  },
  {
    id: 'lunch-break-no-default-flag',
    prompt: 'Set work time 9-19 with lunch 12-13 unavailable',
    params: {},
    expectAppliedDefault: false,
    expectTimeFrom: '09:00',
    expectTimeTo: '19:00',
    expectPeriodStart: '09:00',
    expectPeriodEnd: '12:00',
  },
];
