import { validateCommand, shouldValidateAction } from './command-completion.validator.js';
import type { ResolvedCommand } from './command-completion.types.js';
import { CONFIGURE_TEST_REFERENCE_RANGE_PROMPTS } from './ai-clinic-test-result-ext.fixtures.js';

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

  describe('clinic test-result ext intents (ai-cmd-clinic-6-gap-4.2)', () => {
    it('registers ext intents for completion validation', () => {
      expect(shouldValidateAction('upload_patient_result')).toBe(true);
      expect(shouldValidateAction('configure_test_reference_range')).toBe(true);
    });

    it('requires orderId for upload_patient_result', () => {
      const result = validateCommand(
        baseCmd({
          action: 'upload_patient_result',
          prompt: 'Upload lab result',
        }),
      );
      expect(result.ok).toBe(false);
      expect(result.issues.some((issue) => issue.field === 'orderId')).toBe(true);
    });

    it('accepts configure_test_reference_range when range params are present', () => {
      const sample = CONFIGURE_TEST_REFERENCE_RANGE_PROMPTS[0];
      const result = validateCommand(
        baseCmd({
          action: 'configure_test_reference_range',
          prompt: sample.prompt,
          params: {
            measurementCode: sample.measurementCode,
            normalLow: sample.normalLow,
            normalHigh: sample.normalHigh,
          },
        }),
      );
      expect(result.ok).toBe(true);
    });
  });
});
