import { validateCommand } from './command-completion.validator.js';
import type { ResolvedCommand } from './command-completion.types.js';

function cmd(action: string, params: Record<string, unknown>): ResolvedCommand {
  return {
    action,
    prompt: '',
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

describe('Sprint 24 command completion validators', () => {
  it('validates no_show_recovery', () => {
    expect(validateCommand(cmd('no_show_recovery', {})).ok).toBe(false);
    expect(validateCommand(cmd('no_show_recovery', { date: '2026-06-02' })).ok).toBe(true);
  });

  it('validates sick_day_replan', () => {
    expect(validateCommand(cmd('sick_day_replan', {})).ok).toBe(false);
    const valid = {
      action: 'sick_day_replan',
      prompt: '',
      params: { employeeName: 'Maria Lopez', date: '2026-06-02' },
      entities: {
        employees: [{ id: 'e1', name: 'Maria Lopez' }],
        employee: { id: 'e1', name: 'Maria Lopez' },
        services: [],
        service: null,
        template: null,
        dateRange: null,
      },
      enrichedParams: {},
    } as ResolvedCommand;
    expect(validateCommand(valid).ok).toBe(true);
  });

  it('validates import_services_from_menu', () => {
    expect(validateCommand(cmd('import_services_from_menu', {})).ok).toBe(false);
    expect(
      validateCommand(cmd('import_services_from_menu', { menuText: 'Facial 60min $50' })).ok,
    ).toBe(true);
    expect(
      validateCommand(
        cmd('import_services_from_menu', {
          services: [{ serviceName: 'Facial', durationMinutes: 60, price: 50 }],
        }),
      ).ok,
    ).toBe(true);
  });

  it('validates update_service_prices', () => {
    expect(validateCommand(cmd('update_service_prices', {})).ok).toBe(false);
    expect(validateCommand(cmd('update_service_prices', { percentChange: 10 })).ok).toBe(true);
  });

  it('validates staff_service_matrix', () => {
    expect(validateCommand(cmd('staff_service_matrix', {})).ok).toBe(true);
  });

  it('validates check_schedule_compliance', () => {
    expect(validateCommand(cmd('check_schedule_compliance', {})).ok).toBe(false);
    expect(
      validateCommand(
        cmd('check_schedule_compliance', { dateFrom: '2026-06-01', dateTo: '2026-06-30' }),
      ).ok,
    ).toBe(true);
  });

  it('validates revenue_forecast', () => {
    expect(validateCommand(cmd('revenue_forecast', {})).ok).toBe(false);
    expect(
      validateCommand(
        cmd('revenue_forecast', { dateFrom: '2026-06-09', dateTo: '2026-06-15' }),
      ).ok,
    ).toBe(true);
  });
});
