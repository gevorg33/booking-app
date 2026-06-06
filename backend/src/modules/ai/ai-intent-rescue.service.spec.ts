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

  it('rescues no-show recovery and sick-day replan operations intents', () => {
    expect(
      rescue.rescue({
        prompt:
          'Mark no-shows today, release slots, suggest rebooking messages',
        action: 'unknown',
        params: { date: '26_05_2026' },
        employees,
      })?.action,
    ).toBe('no_show_recovery');

    expect(
      rescue.rescue({
        prompt:
          'Maria is sick — cancel her day and redistribute urgent bookings',
        action: 'unknown',
        params: { date: '26_05_2026' },
        employees,
      })?.action,
    ).toBe('sick_day_replan');

    expect(
      rescue.rescue({
        prompt: 'Raise all massage prices 10% from June 1',
        action: 'unknown',
        params: {},
        employees,
      })?.action,
    ).toBe('update_service_prices');
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

  it('disambiguates create_booking with nearest slot to first-available booking', () => {
    const result = rescue.rescue({
      prompt:
        'check who is free tomorrow evening for permanent lashes, book the nearest slot',
      action: 'create_booking',
      params: { serviceName: 'permanent lashes', date: '2026-06-06' },
      employees,
    });
    expect(result?.rescued).toBe(true);
    expect(result?.action).toBe('create_booking');
    expect(result?.params.bookingFirstAvailable).toBe(true);
    expect(result?.params.timeSlot).toBeUndefined();
  });

  it('disambiguates create_booking misclassified as team availability query', () => {
    const result = rescue.rescue({
      prompt: 'Who can do facemassage today at 9?',
      action: 'create_booking',
      params: { serviceName: 'facemassage', timeSlot: '09:00' },
      employees,
    });
    expect(result?.action).toBe('check_providers_for_service');
    expect(result?.rescued).toBe(true);
  });

  it('disambiguates create_booking misclassified as staff assignment lookup', () => {
    const result = rescue.rescue({
      prompt: 'who is doing facemassage today',
      action: 'create_booking',
      params: { serviceName: 'facemassage' },
      employees,
    });
    expect(result?.action).toBe('lookup_service_assignment');
    expect(result?.rescued).toBe(true);
  });

  it('disambiguates create_booking to reschedule for move provider appointment', () => {
    const result = rescue.rescue({
      prompt: "Move Gevorg's appointment on June 1 to June 2 nearest free time",
      action: 'create_booking',
      params: {
        employeeName: 'Gevorg Gasparyan',
        customerName: 'Gevorg G',
        date: '02_06_2026',
        bookingFirstAvailable: true,
      },
      employees,
    });
    expect(result?.action).toBe('reschedule_booking');
    expect(result?.params.customerName).toBeNull();
    expect(result?.params.bookingFirstAvailable).toBe(true);
  });

  it('rescues move appointment as reschedule before create_booking', () => {
    const result = rescue.rescue({
      prompt: "Move Gevorg's appointment on June 1 to June 2 nearest free time",
      action: 'unknown',
      params: {},
      employees,
    });
    expect(result?.action).toBe('reschedule_booking');
    expect(result?.params.bookingFirstAvailable).toBe(true);
  });

  it('rescues conditional booking from unknown', () => {
    const result = rescue.rescue({
      prompt:
        'Book facemassage on Gevorg tomorrow at 9; if not available then Mary; otherwise whoever is free',
      action: 'unknown',
      params: {
        serviceName: 'facemassage',
        date: '27_05_2026',
        timeSlot: '09:00',
      },
      employees,
    });
    expect(result?.action).toBe('create_booking');
    expect(result?.params.fallbackAnyProvider).toBe(true);
    expect(result?.params.providerFallbackNames?.length).toBeGreaterThan(0);
  });

  it('rescues scheduling scenarios from unknown', () => {
    expect(
      rescue.rescue({
        prompt: 'Swap Friday schedules between Gevorg and Maria',
        action: 'unknown',
        params: {},
        employees,
      })?.action,
    ).toBe('swap_schedules');

    expect(
      rescue.rescue({
        prompt: 'Move 2 facemassage slots from Gevorg to Maria on Friday',
        action: 'unknown',
        params: {},
        employees,
      })?.action,
    ).toBe('rebalance_capacity');
  });

  it('disambiguates misclassified actions to scheduling intents', () => {
    const swap = rescue.rescue({
      prompt: 'Swap Friday schedules between Gevorg and Maria',
      action: 'apply_schedule',
      params: {
        employeeNames: ['Gevorg Gasparyan', 'Mary Torgomyan'],
        date: '06/06/2026',
      },
      employees,
    });
    expect(swap?.action).toBe('swap_schedules');
    expect(swap?.rescueReason).toBe('scheduling_intent');
  });

  it('rescues total earnings prompts to summarize_bookings revenue metric', () => {
    const result = rescue.rescue({
      prompt: 'Calculate total earnings for today',
      action: 'unknown',
      params: {},
      employees,
    });
    expect(result?.action).toBe('summarize_bookings');
    expect(result?.params.bookingMetric).toBe('revenue');
    expect(result?.rescueReason).toBe('total_earnings');
  });

  it('rescues top specialist revenue prompts to summarize_staff', () => {
    const result = rescue.rescue({
      prompt: 'Top 3 specialists by revenue last week',
      action: 'unknown',
      params: {},
      employees,
    });
    expect(result?.action).toBe('summarize_staff');
    expect(result?.params.staffMetric).toBe('most_revenue');
    expect(result?.params.limit).toBe(3);
    expect(result?.rescueReason).toBe('top_staff_revenue');
  });

  it('disambiguates list_bookings to total earnings analytics', () => {
    const result = rescue.rescue({
      prompt: 'How much did we earn last month?',
      action: 'list_bookings',
      params: { dateFrom: '01/05/2026', dateTo: '31/05/2026' },
      employees,
    });
    expect(result?.action).toBe('summarize_bookings');
    expect(result?.params.bookingMetric).toBe('revenue');
    expect(result?.rescueReason).toBe('list_to_total_earnings');
  });

  it('disambiguates list_employees to specialist revenue ranking', () => {
    const result = rescue.rescue({
      prompt: 'Which specialist had the most revenue today?',
      action: 'list_employees',
      params: {},
      employees,
    });
    expect(result?.action).toBe('summarize_staff');
    expect(result?.params.staffMetric).toBe('most_revenue');
    expect(result?.rescueReason).toBe('list_to_top_staff_revenue');
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
