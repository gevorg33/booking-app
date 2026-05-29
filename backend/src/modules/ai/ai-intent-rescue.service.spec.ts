import { AiIntentRescueService } from './ai-intent-rescue.service.js';

describe('AiIntentRescueService', () => {
  const rescue = new AiIntentRescueService();
  const employees = [
    { id: '1', name: 'Gevorg Gasparyan' },
    { id: '2', name: 'Mary Torgomyan' },
  ];

  it('rescues unknown clear schedule prompts', () => {
    const result = rescue.rescue({
      prompt: 'Clear Gevorg schedule for tomorrow',
      action: 'unknown',
      params: { employeeName: 'Gevorg' },
      employees,
    });
    expect(result?.action).toBe('clear_schedule');
    expect(result?.rescued).toBe(true);
  });

  it('rescues payment sweep to payment_sweep action', () => {
    const result = rescue.rescue({
      prompt: 'Run payment sweep for today',
      action: 'unknown',
      params: { date: '26_05_2026' },
      employees,
    });
    expect(result?.action).toBe('payment_sweep');
  });

  it('rescues day replan to day_replan action', () => {
    const result = rescue.rescue({
      prompt: 'Replan my day for tomorrow',
      action: 'unknown',
      params: {},
      employees,
    });
    expect(result?.action).toBe('day_replan');
  });

  it('rescues mark no-shows to mark_no_shows action', () => {
    const result = rescue.rescue({
      prompt: 'Mark no-shows for Gevorg today',
      action: 'unknown',
      params: { employeeName: 'Gevorg', date: '26_05_2026' },
      employees,
    });
    expect(result?.action).toBe('mark_no_shows');
  });

  it('rescues schedule template creation', () => {
    const result = rescue.rescue({
      prompt: 'Create template Weekday 9-17 Mon-Fri',
      action: 'unknown',
      params: {},
      employees,
    });
    expect(result?.action).toBe('create_schedule_template');
  });

  it('disambiguates create_booking misclassified as availability query', () => {
    const result = rescue.rescue({
      prompt: 'Who can do facemassage today at 9?',
      action: 'create_booking',
      params: { serviceName: 'facemassage', timeSlot: '09:00' },
      employees,
    });
    expect(result?.action).toBe('lookup_service_assignment');
    expect(result?.rescued).toBe(true);
  });

  it('rescues conditional booking from unknown', () => {
    const result = rescue.rescue({
      prompt:
        'Book facemassage on Gevorg tomorrow at 9; if not available then Mary; otherwise whoever is free',
      action: 'unknown',
      params: { serviceName: 'facemassage', date: '27_05_2026', timeSlot: '09:00' },
      employees,
    });
    expect(result?.action).toBe('create_booking');
    expect(result?.params.fallbackAnyProvider).toBe(true);
    expect(result?.params.providerFallbackNames?.length).toBeGreaterThan(0);
  });

  it('returns null when no rescue applies', () => {
    const result = rescue.rescue({
      prompt: 'Hello there',
      action: 'unknown',
      params: {},
      employees,
    });
    expect(result).toBeNull();
  });
});
