import { AiIntentRescueService } from './ai-intent-rescue.service.js';
import {
  applyRescheduleBookingPromptHints,
  resolveFirstAvailableNotBeforeTime,
} from './ai-booking-reschedule-hints.util.js';
import { validateCommand } from './command-completion.validator.js';

describe('ai booking & reschedule integration (ai-cmd-h3.1)', () => {
  const employees = [
    { id: 'e1', name: 'Gevorg Gasparyan' },
    { id: 'e2', name: 'Mary Torgomyan' },
  ];
  const customers = [{ id: 'c1', name: 'Jujo' }];

  let rescue: AiIntentRescueService;

  beforeEach(() => {
    rescue = new AiIntentRescueService();
  });

  it('validates first-available create_booking without timeSlot', () => {
    const params: Record<string, unknown> = {
      bookingFirstAvailable: true,
      allProviders: true,
      serviceName: 'facemassage',
      timeOfDay: 'evening',
    };
    const result = validateCommand({
      action: 'create_booking',
      params,
      enrichedParams: { serviceId: 's1' },
      entities: {
        employees: [],
        services: [],
        service: { id: 's1', name: 'facemassage' } as any,
      },
      reasoning: 'test',
    });
    expect(result.ok).toBe(true);
    expect(resolveFirstAvailableNotBeforeTime(params, '')).toBe('17:00');
  });

  it('validates provider fallback chain booking', () => {
    const result = validateCommand({
      action: 'create_booking',
      params: {
        providerFallbackNames: ['Gevorg Gasparyan', 'Mary Torgomyan'],
        fallbackAnyProvider: true,
        serviceName: 'facemassage',
        date: '27_05_2026',
        timeSlot: '09:00',
      },
      enrichedParams: { serviceId: 's1' },
      entities: {
        employees: [],
        services: [],
        service: { id: 's1', name: 'facemassage' } as any,
      },
      reasoning: 'test',
    });
    expect(result.ok).toBe(true);
  });

  it('rescues misclassified create_booking to reschedule with nearest free time', () => {
    const result = rescue.rescue({
      prompt: "Move Gevorg's appointment on June 1 to June 2 nearest free time",
      action: 'create_booking',
      params: {
        employeeName: 'Gevorg Gasparyan',
        customerName: 'Gevorg G',
        date: '02_06_2026',
      },
      employees,
    });
    expect(result?.action).toBe('reschedule_booking');
    expect(result?.params.bookingFirstAvailable).toBe(true);

    const merged = { ...result!.params };
    applyRescheduleBookingPromptHints(
      merged,
      "Move Gevorg's appointment on June 1 to June 2 nearest free time",
      employees,
      customers,
      'UTC',
    );
    expect(merged.employeeName).toBe('Gevorg Gasparyan');
    expect(merged.customerName).toBeNull();
  });

  it('parses Jujo customer vs provider possessive on reschedule', () => {
    const params: Record<string, unknown> = {};
    applyRescheduleBookingPromptHints(
      params,
      "Move Jujo's appointment on June 10 to June 11 nearest free time",
      employees,
      customers,
      'UTC',
    );
    expect(params.customerName).toBe('Jujo');
    expect(params.employeeName).toBeUndefined();
    expect(params.bookingFirstAvailable).toBe(true);
  });
});
