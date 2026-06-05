import { validateCommand } from './command-completion.validator.js';
import type { ResolvedCommand } from './command-completion.types.js';

function cmd(
  action: string,
  params: Record<string, unknown>,
  prompt?: string,
): ResolvedCommand {
  return {
    action,
    prompt: prompt ?? '',
    params,
    entities: {
      employees: [],
      employee: null,
      services: [],
      service: null,
      template: null,
      dateRange: null,
    },
    enrichedParams: {},
  } as ResolvedCommand;
}

describe('Sprint 23 command completion validators', () => {
  it('validates swap_schedules', () => {
    expect(validateCommand(cmd('swap_schedules', {})).ok).toBe(false);
    const validSwap = {
      action: 'swap_schedules',
      prompt: '',
      params: { date: '06/06/2026' },
      entities: {
        employees: [
          { id: 'e1', name: 'Gevorg Gasparyan' },
          { id: 'e2', name: 'Maria Lopez' },
        ],
        employee: null,
        services: [],
        service: null,
        template: null,
        dateRange: null,
      },
      enrichedParams: {},
    } as ResolvedCommand;
    expect(validateCommand(validSwap).ok).toBe(true);
  });

  it('validates rebalance_capacity', () => {
    expect(validateCommand(cmd('rebalance_capacity', {})).ok).toBe(false);
    expect(
      validateCommand(
        cmd('rebalance_capacity', {
          fromEmployeeName: 'Gevorg',
          toEmployeeName: 'Maria',
          serviceName: 'facemassage',
          date: '06/06/2026',
        }),
      ).ok,
    ).toBe(true);
  });

  it('validates holiday_mode', () => {
    expect(validateCommand(cmd('holiday_mode', {})).ok).toBe(false);
    expect(
      validateCommand(
        cmd('holiday_mode', {
          allProviders: true,
          closeDates: ['2026-12-24'],
        }),
      ).ok,
    ).toBe(true);
  });

  it('validates onboard_provider_schedule', () => {
    expect(validateCommand(cmd('onboard_provider_schedule', {})).ok).toBe(
      false,
    );
    const valid = {
      action: 'onboard_provider_schedule',
      prompt: '',
      params: {
        dateFrom: '2026-06-09',
        dateTo: '2026-06-13',
      },
      entities: {
        employees: [{ id: 'e1', name: 'Anna Kim' }],
        employee: { id: 'e1', name: 'Anna Kim' },
        services: [],
        service: null,
        template: { id: 't1', name: 'Weekday' },
        dateRange: null,
      },
      enrichedParams: {},
    } as ResolvedCommand;
    expect(validateCommand(valid).ok).toBe(true);
  });
});
