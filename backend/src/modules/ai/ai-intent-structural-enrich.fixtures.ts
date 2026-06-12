/** pipe-1.7.1 — structural enrichment scenarios (after self-verify). */
export const STRUCTURAL_ENRICH_PIPE_MARKER = 'pipe-1.7.1';

export type StructuralEnrichFixtureScenario = {
  id: string;
  prompt: string;
  action: string;
  params?: Record<string, unknown>;
  sessionContext?: Record<string, unknown>;
  employees: Array<{ id: string; name: string }>;
  timeZone?: string;
  expectDateRange?: boolean;
  expectPeriods?: boolean;
  expectWorkTimeDefault?: boolean;
  expectPeriodStart?: string;
  expectPeriodEnd?: string;
  expectEmployeeName?: string;
  expectEmployeeNames?: string[];
  expectTimeOfDay?: string;
  expectUnchanged?: boolean;
};

export const STRUCTURAL_ENRICH_SCENARIOS: StructuralEnrichFixtureScenario[] = [
  {
    id: 'date-range-clear-schedule',
    prompt: 'Clear Gevorg schedule for the next 5 days',
    action: 'clear_schedule',
    params: {},
    employees: [{ id: 'e1', name: 'Gevorg Gasparyan' }],
    timeZone: 'UTC',
    expectDateRange: true,
    expectEmployeeName: 'Gevorg Gasparyan',
  },
  {
    id: 'direct-schedule-periods',
    prompt: 'Create work time for Gevorg tomorrow 9-19',
    action: 'create_direct_schedule',
    params: { date: '2026-06-13' },
    employees: [{ id: 'e1', name: 'Gevorg Gasparyan' }],
    expectPeriods: true,
    expectWorkTimeDefault: false,
    expectEmployeeName: 'Gevorg Gasparyan',
  },
  {
    id: 'work-time-default-no-hours',
    prompt: 'Create work time for Gevorg next week',
    action: 'create_direct_schedule',
    params: { date: '2026-06-16' },
    employees: [{ id: 'e1', name: 'Gevorg Gasparyan' }],
    expectPeriods: true,
    expectWorkTimeDefault: true,
    expectPeriodStart: '09:00',
    expectPeriodEnd: '19:00',
    expectEmployeeName: 'Gevorg Gasparyan',
  },
  {
    id: 'multi-emp-match',
    prompt: 'clear all schedules for Mary and Jujo on july',
    action: 'clear_schedule',
    params: {},
    employees: [
      { id: 'e1', name: 'Mary Torgomyan' },
      { id: 'e2', name: 'Jujo Karapetyan' },
    ],
    expectEmployeeNames: ['Mary Torgomyan', 'Jujo Karapetyan'],
  },
  {
    id: 'availability-follow-up-evening',
    prompt: 'what about evening',
    action: 'check_availability',
    params: {},
    sessionContext: {
      lastAction: 'check_providers_for_service',
      availableProviders: ['Anna Smith'],
    },
    employees: [{ id: 'e1', name: 'Anna Smith' }],
    expectEmployeeName: 'Anna Smith',
    expectTimeOfDay: 'evening',
  },
  {
    id: 'unknown-skips-enrich',
    prompt: 'something vague',
    action: 'unknown',
    params: {},
    employees: [],
    expectUnchanged: true,
  },
];
