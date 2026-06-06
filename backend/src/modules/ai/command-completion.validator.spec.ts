import { validateCommand } from './command-completion.validator.js';
import type { ResolvedCommand } from './command-completion.types.js';

function baseCmd(overrides: Partial<ResolvedCommand>): ResolvedCommand {
  return {
    action: 'create_booking',
    params: {},
    enrichedParams: {},
    entities: {},
    reasoning: 'test',
    confidence: 0.9,
    ...overrides,
  };
}

describe('command-completion.validator', () => {
  it('requires service for create_booking', () => {
    const result = validateCommand(
      baseCmd({
        params: {
          employeeName: 'Gevorg',
          date: '26_05_2026',
          timeSlot: '09:00',
        },
        enrichedParams: { employeeId: 'e1' },
        entities: {
          employee: { id: 'e1', name: 'Gevorg' } as any,
          employees: [],
        },
      }),
    );
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.field === 'serviceName')).toBe(true);
  });

  it('accepts provider fallback chain without single employeeName', () => {
    const result = validateCommand(
      baseCmd({
        params: {
          providerFallbackNames: ['Gevorg Gasparyan', 'Mary Torgomyan'],
          fallbackAnyProvider: true,
          serviceName: 'facemassage',
          date: '27_05_2026',
          timeSlot: '09:00',
        },
        enrichedParams: { serviceId: 's1' },
        entities: { service: { id: 's1', name: 'facemassage' } as any },
      }),
    );
    expect(result.ok).toBe(true);
  });

  it('accepts first-available booking with service only', () => {
    const result = validateCommand(
      baseCmd({
        params: {
          bookingFirstAvailable: true,
          allProviders: true,
          serviceName: 'facemassage',
        },
        enrichedParams: { serviceId: 's1' },
        entities: { service: { id: 's1', name: 'facemassage' } as any },
      }),
    );
    expect(result.ok).toBe(true);
  });

  it('accepts first-available booking with timeOfDay and notBeforeTime', () => {
    const result = validateCommand(
      baseCmd({
        params: {
          bookingFirstAvailable: true,
          allProviders: true,
          serviceName: 'facemassage',
          timeOfDay: 'evening',
          notBeforeTime: '17:00',
        },
        enrichedParams: { serviceId: 's1' },
        entities: { service: { id: 's1', name: 'facemassage' } as any },
      }),
    );
    expect(result.ok).toBe(true);
    expect(result.issues.some((i) => i.field === 'timeSlot')).toBe(false);
  });

  it('still requires timeSlot when only timeOfDay is set without first-available', () => {
    const result = validateCommand(
      baseCmd({
        params: {
          allProviders: true,
          serviceName: 'facemassage',
          date: '2026-06-06',
          timeOfDay: 'evening',
        },
        enrichedParams: { serviceId: 's1' },
        entities: { service: { id: 's1', name: 'facemassage' } as any },
      }),
    );
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.field === 'timeSlot')).toBe(true);
  });

  it('accepts reschedule_booking with first-available and evening window', () => {
    const result = validateCommand(
      baseCmd({
        action: 'reschedule_booking',
        params: {
          customerName: 'Maria',
          bookingFirstAvailable: true,
          timeOfDay: 'evening',
          notBeforeTime: '17:00',
        },
        enrichedParams: {},
        entities: {},
      }),
    );
    expect(result.ok).toBe(true);
    expect(result.issues.some((i) => i.field === 'timeSlot')).toBe(false);
  });

  it('accepts check_availability with timeOfDay only', () => {
    const result = validateCommand(
      baseCmd({
        action: 'check_availability',
        params: { timeOfDay: 'afternoon', notBeforeTime: '12:00' },
        enrichedParams: {},
        entities: {},
      }),
    );
    expect(result.ok).toBe(true);
  });

  it('validates cancel_bookings requires a scope', () => {
    const result = validateCommand(
      baseCmd({
        action: 'cancel_bookings',
        params: {},
        enrichedParams: {},
        entities: {},
      }),
    );
    expect(result.ok).toBe(false);
  });
});
