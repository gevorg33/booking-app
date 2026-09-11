import {
  buildBlockScheduleBlockPayloads,
  buildExtendHoursPeriods,
  buildHolidayClosureBlockPayloads,
  buildOnboardProviderSummary,
  buildPropagatedSingleBlocks,
  enhanceSmartBlockParams,
  expandPropagatedBlockDates,
  isCapacityRebalancePrompt,
  isHolidayModePrompt,
  isOnboardProviderPrompt,
  isScheduleSwapPrompt,
  isSmartBlockPropagationPrompt,
  parseHolidayModeDates,
  parseIsoDatesList,
  parseRebalanceSlotCount,
  parseSwapEmployeeNames,
  rescueSchedulingIntent,
  resolveHolidayDatesFromBusinessSettings,
  mapSchedulingOrchestrationResult,
  resolveRebalanceTargetDate,
  selectBookingsToRebalance,
  serializePeriodsForSwap,
  shouldUsePropagatedSingleBlocks,
} from './ai-scheduling.util.js';

describe('ai-scheduling.util', () => {
  it('detects scheduling prompt patterns', () => {
    expect(
      isSmartBlockPropagationPrompt(
        'Block lunch 12-13 for everyone, repeat 4 weeks',
      ),
    ).toBe(true);
    expect(isSmartBlockPropagationPrompt('skip holidays')).toBe(true);
    expect(isSmartBlockPropagationPrompt('random prompt')).toBe(false);
    expect(
      isScheduleSwapPrompt('Swap Friday schedules between Gevorg and Maria'),
    ).toBe(true);
    expect(isScheduleSwapPrompt('switch schedule on Friday')).toBe(true);
    expect(
      isCapacityRebalancePrompt(
        'Move 2 facemassage slots from Gevorg to Maria',
      ),
    ).toBe(true);
    expect(isCapacityRebalancePrompt('rebalance Friday')).toBe(true);
    expect(isCapacityRebalancePrompt('transfer 1 slot')).toBe(true);
    expect(
      isHolidayModePrompt('Close Dec 24-26 for all, extend Dec 23 hours'),
    ).toBe(true);
    expect(isHolidayModePrompt('holiday mode')).toBe(true);
    expect(
      isOnboardProviderPrompt("Set up Anna's first week from weekday template"),
    ).toBe(true);
    expect(isOnboardProviderPrompt('new hire onboarding')).toBe(true);
    expect(isOnboardProviderPrompt('assign massage for first week')).toBe(true);
    expect(
      isSmartBlockPropagationPrompt('Block lunch 12-13 for everyone'),
    ).toBe(true);
    expect(isHolidayModePrompt('Close 24/12 for all providers')).toBe(true);
  });

  it('enhances smart block params from prompt', () => {
    const params = enhanceSmartBlockParams(
      'Block lunch 12-13 for everyone, repeat 4 weeks, skip holidays',
      {},
    );
    expect(params.allProviders).toBe(true);
    expect(params.weeksCount).toBe(4);
    expect(params.skipHolidays).toBe(true);
    expect(params.timeFrom).toBe('12:00');
    expect(params.timeTo).toBe('13:00');

    const repeatOnly = enhanceSmartBlockParams(
      'Block lunch repeat for all staff',
      {},
    );
    expect(repeatOnly.weeksCount).toBe(4);
    expect(repeatOnly.repeatWeeksCount).toBe(4);
  });

  it('rescues scheduling intents from unknown and block_schedule', () => {
    expect(
      rescueSchedulingIntent(
        'Swap Friday schedules between Gevorg and Maria',
        'unknown',
        {},
      )?.action,
    ).toBe('swap_schedules');
    expect(
      rescueSchedulingIntent(
        'Move 2 facemassage slots from Gevorg to Maria on Friday',
        'unknown',
        {},
      )?.action,
    ).toBe('rebalance_capacity');
    expect(
      rescueSchedulingIntent('Close Dec 24-26 for all', 'unknown', {})?.action,
    ).toBe('holiday_mode');
    expect(
      rescueSchedulingIntent(
        "Set up Anna's first week from weekday template",
        'unknown',
        {},
      )?.action,
    ).toBe('onboard_provider_schedule');
    expect(
      rescueSchedulingIntent('list bookings today', 'list_bookings', {}),
    ).toBeNull();
    expect(
      rescueSchedulingIntent('Swap schedules', 'swap_schedules', {
        employeeName: 'A',
      }),
    ).toBeNull();
    expect(
      rescueSchedulingIntent(
        'Swap Friday schedules between Gevorg and Maria',
        'apply_schedule',
        {},
      )?.action,
    ).toBe('swap_schedules');
    expect(
      rescueSchedulingIntent(
        'Move 2 facemassage slots from Gevorg to Maria',
        'apply_schedule',
        { slotCount: 1 },
      )?.action,
    ).toBe('rebalance_capacity');
    expect(
      rescueSchedulingIntent('Close Dec 24-26 for all', 'apply_schedule', {})
        ?.action,
    ).toBe('holiday_mode');
    expect(
      rescueSchedulingIntent(
        "Set up Anna's first week from weekday template",
        'setup_week_schedule',
        {},
      )?.action,
    ).toBe('onboard_provider_schedule');
    const block = rescueSchedulingIntent(
      'Block lunch 12-13 for everyone, repeat 4 weeks, skip holidays',
      'block_schedule',
      {},
    );
    expect(block?.action).toBe('block_schedule');
    expect(block?.params.skipHolidays).toBe(true);
  });

  it('expands propagated block dates and skips holidays', () => {
    const dates = expandPropagatedBlockDates({
      startDate: '2026-06-01',
      weeksCount: 1,
      weekdays: [1, 2, 3, 4, 5],
      holidayDates: ['2026-06-03'],
      skipHolidays: true,
    });
    expect(dates).toContain('2026-06-01');
    expect(dates).not.toContain('2026-06-03');
    expect(dates.length).toBe(4);
  });

  it('builds propagated single blocks per employee/date', () => {
    const blocks = buildPropagatedSingleBlocks({
      employeeId: 'e1',
      employeeName: 'Alex',
      dates: ['2026-06-02'],
      timeFrom: '12:00',
      timeTo: '13:00',
      placeholder: 'Lunch',
    });
    expect(blocks).toHaveLength(1);
    expect(blocks[0].singleBlock?.startTime).toContain('2026-06-02');
    expect(blocks[0].placeholder).toBe('Lunch');
  });

  it('builds block payloads with holiday skip propagation', () => {
    const payloads = buildBlockScheduleBlockPayloads({
      targets: [{ id: 'e1', name: 'Alex' }],
      params: { skipHolidays: true, weeksCount: 1, repeatWeeksCount: 1 },
      range: { start: '2026-06-01', end: '2026-06-07' },
      fullDay: false,
      window: { timeFrom: '12:00', timeTo: '13:00' },
      applyDays: [1, 2, 3, 4, 5],
      placeholder: 'Lunch',
      singleDate: null,
      holidayDates: ['2026-06-03'],
    });
    expect(payloads.length).toBeGreaterThan(0);
    expect(payloads.every((p) => !p.isRepetitive)).toBe(true);
  });

  it('builds standard repetitive and single-day block payloads', () => {
    const repetitive = buildBlockScheduleBlockPayloads({
      targets: [{ id: 'e1', name: 'Alex' }],
      params: { weeksCount: 2 },
      range: { start: '2026-06-01', end: '2026-06-07' },
      fullDay: false,
      window: { timeFrom: '12:00', timeTo: '13:00' },
      applyDays: [5],
      placeholder: 'Lunch',
      singleDate: null,
    });
    expect(repetitive[0].isRepetitive).toBe(true);

    const fullDay = buildBlockScheduleBlockPayloads({
      targets: [{ id: 'e1', name: 'Alex' }],
      params: {},
      range: null,
      fullDay: true,
      window: { timeFrom: '00:00', timeTo: '23:59' },
      applyDays: [],
      placeholder: 'Closed',
      singleDate: '2026-12-25',
    });
    expect(fullDay[0].singleBlock?.endTime).toContain('2026-12-25');
  });

  it('parses swap names, rebalance count, and holiday mode dates', () => {
    expect(
      parseSwapEmployeeNames({ employeeNames: ['Gevorg', 'Maria'] })
        .swapWithEmployeeName,
    ).toBe('Maria');
    expect(
      parseSwapEmployeeNames({
        employeeName: 'Gevorg',
        swapWithEmployeeName: 'Maria',
      }),
    ).toEqual({
      employeeName: 'Gevorg',
      swapWithEmployeeName: 'Maria',
    });
    expect(parseRebalanceSlotCount({}, 'Move 3 slots')).toBe(3);
    expect(parseRebalanceSlotCount({ slotCount: 2 }, 'move slots')).toBe(2);
    expect(parseRebalanceSlotCount({}, 'move slots')).toBe(1);
    expect(parseRebalanceSlotCount({}, 'transfer 4 slots')).toBe(4);
    expect(
      parseHolidayModeDates({
        closeDates: ['2026-12-24', '2026-12-25'],
        extendDate: '2026-12-23',
        extendTimeFrom: '9:00',
        extendTimeTo: '21:00',
      }),
    ).toEqual({
      closeDates: ['2026-12-24', '2026-12-25'],
      extendDate: '2026-12-23',
      extendTimeFrom: '09:00',
      extendTimeTo: '21:00',
    });
  });

  it('builds holiday closure blocks and extend-hour periods', () => {
    const blocks = buildHolidayClosureBlockPayloads({
      employees: [{ id: 'e1', name: 'Alex' }],
      closeDates: ['2026-12-24'],
    });
    expect(blocks).toHaveLength(1);
    expect(buildExtendHoursPeriods('09:00', '21:00')[0].endTime).toBe('21:00');
  });

  it('serializes periods and selects bookings to rebalance', () => {
    const serialized = serializePeriodsForSwap([
      {
        startTime: new Date('2026-06-06T09:00:00.000Z'),
        endTime: new Date('2026-06-06T17:00:00.000Z'),
        type: 'service_block',
        serviceIds: ['s1'],
      },
    ]);
    expect(serialized[0].startTime).toBe('09:00');

    const bookings = selectBookingsToRebalance(
      [
        {
          id: 'b1',
          employeeId: 'e1',
          serviceId: 's1',
          startTime: new Date('2026-06-06T10:00:00.000Z'),
        },
        {
          id: 'b2',
          employeeId: 'e1',
          serviceId: 's1',
          startTime: new Date('2026-06-06T11:00:00.000Z'),
        },
        {
          id: 'b3',
          employeeId: 'e2',
          serviceId: 's1',
          startTime: new Date('2026-06-06T12:00:00.000Z'),
        },
      ],
      1,
      'e1',
      's1',
    );
    expect(bookings).toHaveLength(1);
    expect(bookings[0].id).toBe('b1');
  });

  it('resolves holiday dates from business settings and builds onboard summary', () => {
    expect(
      resolveHolidayDatesFromBusinessSettings({
        schedule: { holidayDates: ['2026-12-25'] },
      }),
    ).toEqual(['2026-12-25']);
    expect(
      resolveHolidayDatesFromBusinessSettings({ holidays: ['2026-01-01'] }),
    ).toEqual(['2026-01-01']);
    expect(resolveHolidayDatesFromBusinessSettings(null)).toEqual([]);
    expect(
      buildOnboardProviderSummary({
        employeeName: 'Anna',
        templateName: 'Weekday',
        serviceNames: ['massage'],
      }),
    ).toContain('Anna');
    expect(
      buildOnboardProviderSummary({
        employeeName: 'Anna',
      }),
    ).toContain('Anna');
    expect(shouldUsePropagatedSingleBlocks({ skipHolidays: true })).toBe(true);
    expect(
      shouldUsePropagatedSingleBlocks({ usePropagatedSingleBlocks: true }),
    ).toBe(true);
    expect(shouldUsePropagatedSingleBlocks({})).toBe(false);
  });

  it('covers additional util branches', () => {
    expect(
      expandPropagatedBlockDates({
        startDate: '2026-06-01',
        weeksCount: 1,
        weekdays: [1],
        skipHolidays: false,
      }),
    ).toHaveLength(1);

    expect(
      selectBookingsToRebalance(
        [
          {
            id: 'b1',
            employeeId: 'e1',
            serviceId: 's1',
            startTime: new Date(),
          },
        ],
        2,
        'e1',
      ),
    ).toHaveLength(1);

    expect(
      resolveHolidayDatesFromBusinessSettings({ holidayDates: ['2026-07-04'] }),
    ).toEqual(['2026-07-04']);
    expect(parseSwapEmployeeNames({})).toEqual({
      employeeName: null,
      swapWithEmployeeName: null,
    });
    expect(
      parseHolidayModeDates({ closeDates: ['2026-12-24'] }).extendDate,
    ).toBeUndefined();
    expect(enhanceSmartBlockParams('Block time', { weeksCount: 2 })).toEqual({
      weeksCount: 2,
    });
    expect(
      enhanceSmartBlockParams('Block lunch 0 weeks', {}),
    ).not.toHaveProperty('weeksCount', 0);
    expect(
      enhanceSmartBlockParams('Block lunch 12-13', { placeholder: 'Break' })
        .placeholder,
    ).toBe('Break');
    expect(isHolidayModePrompt('close and extend hours')).toBe(true);
    expect(parseIsoDatesList('not-array')).toEqual([]);
    expect(parseIsoDatesList(['2026-12-24', 42])).toEqual(['2026-12-24']);
    expect(parseRebalanceSlotCount({ slotCount: 0 }, 'move 0 slots')).toBe(1);
    expect(parseRebalanceSlotCount({}, 'move abc slots')).toBe(1);
    expect(parseRebalanceSlotCount({}, 'transfer 0 slots')).toBe(1);
    expect(
      parseHolidayModeDates({
        extendTimeFrom: 1 as any,
        extendTimeTo: 2 as any,
      }),
    ).toEqual({
      closeDates: [],
      extendDate: undefined,
      extendTimeFrom: undefined,
      extendTimeTo: undefined,
    });
    expect(
      parseHolidayModeDates({
        holidayDates: ['2026-12-24'],
        extendDate: '2026-12-23',
        extendTimeFrom: '08:00',
        extendTimeTo: '22:00',
      }).extendTimeTo,
    ).toBe('22:00');
    expect(
      serializePeriodsForSwap([
        {
          startTime: new Date('2026-06-06T09:05:00.000Z'),
          endTime: new Date('2026-06-06T17:00:00.000Z'),
          type: 'unavailable_block',
          serviceIds: null,
          placeholderLabel: 'Lunch',
        },
        {
          startTime: new Date('2026-06-06T18:00:00.000Z'),
          endTime: new Date('2026-06-06T19:00:00.000Z'),
          type: 'service_block',
          serviceIds: ['s1'],
        },
      ]),
    ).toHaveLength(2);
    expect(
      buildBlockScheduleBlockPayloads({
        targets: [{ id: 'e1', name: 'Alex' }],
        params: { skipHolidays: true, weeksCount: 2 },
        range: { start: '2026-06-01', end: '2026-06-14' },
        fullDay: false,
        window: { timeFrom: '12:00', timeTo: '13:00' },
        applyDays: [1],
        placeholder: 'Lunch',
        singleDate: null,
      }).length,
    ).toBeGreaterThan(0);
    expect(
      resolveHolidayDatesFromBusinessSettings({ schedule: 'bad' }),
    ).toEqual([]);
    expect(
      buildBlockScheduleBlockPayloads({
        targets: [{ id: 'e1', name: 'Alex' }],
        params: { usePropagatedSingleBlocks: true, weeksCount: 4 },
        range: null,
        fullDay: false,
        window: { timeFrom: '12:00', timeTo: '13:00' },
        applyDays: [1, 2, 3, 4, 5],
        placeholder: 'Lunch',
        singleDate: '2026-06-01',
      }).length,
    ).toBeGreaterThan(0);
  });

  it('resolves rebalance target date from schedule dates or params.date', () => {
    expect(resolveRebalanceTargetDate({ date: '2026-06-06' }, [])).toBe(
      '2026-06-06',
    );
    expect(resolveRebalanceTargetDate({}, ['2026-06-07'])).toBe('2026-06-07');
    expect(resolveRebalanceTargetDate({}, [])).toBeNull();
  });

  it('maps orchestration results with and without details', () => {
    expect(
      mapSchedulingOrchestrationResult({
        success: true,
        action: 'swap_schedules',
        summary: 'ok',
        details: { planId: 'p1' },
        taskId: 't1',
        requiresApproval: false,
      }),
    ).toEqual({
      success: true,
      action: 'swap_schedules',
      summary: 'ok',
      details: { planId: 'p1', taskId: 't1', requiresApproval: false },
    });
    expect(
      mapSchedulingOrchestrationResult({
        success: false,
        action: 'holiday_mode',
        summary: 'failed',
      }).details,
    ).toEqual({ taskId: undefined, requiresApproval: undefined });
  });

  it('builds single-day non-propagated block when skipHolidays is false', () => {
    const payloads = buildBlockScheduleBlockPayloads({
      targets: [{ id: 'e1', name: 'Alex' }],
      params: { weeksCount: 1 },
      range: null,
      fullDay: false,
      window: { timeFrom: '12:00', timeTo: '13:00' },
      applyDays: [5],
      placeholder: 'Lunch',
      singleDate: '2026-06-06',
    });
    expect(payloads[0].isRepetitive).toBe(false);
    expect(payloads[0].singleBlock?.startTime).toContain('2026-06-06');
  });
});

/**
 * e2e-bug.528 — a closure range is closure dates.
 *
 * The command describes itself as "Close the business for a **period**" and its
 * failure message tells the user "Specify closure dates (e.g. Dec 24-26)" — a
 * range. The parser read only enumerated lists, so a user who said exactly what
 * they were asked for was asked to restate it. Both the documentation and the
 * error message already promised this; only the parser did not.
 */
describe('e2e-bug.528 — holiday_mode accepts a closure range', () => {
  const { parseHolidayModeDates, expandClosureDateRange } =
    require('./ai-scheduling.util.js') as typeof import('./ai-scheduling.util.js');

  it('expands an inclusive range into closure days', () => {
    expect(
      parseHolidayModeDates({ dateFrom: '2026-12-24', dateTo: '2026-12-26' })
        .closeDates,
    ).toEqual(['2026-12-24', '2026-12-25', '2026-12-26']);
  });

  it('keeps an enumerated list winning over a range', () => {
    // Additive, never narrowing: a caller that already lists days is unaffected,
    // which is what makes widening safe here rather than the way e2e-bug.362
    // happened.
    expect(
      parseHolidayModeDates({
        closeDates: ['2026-12-25'],
        dateFrom: '2026-01-01',
        dateTo: '2026-12-31',
      }).closeDates,
    ).toEqual(['2026-12-25']);
  });

  it('requires both ends', () => {
    // A lone `dateFrom` names no end, which is exactly what the completion
    // validator refuses (§306). Widening must not smuggle it back in.
    expect(expandClosureDateRange({ dateFrom: '2026-12-24' })).toEqual([]);
    expect(expandClosureDateRange({ dateTo: '2026-12-26' })).toEqual([]);
  });

  it('refuses a reversed range rather than guessing the order', () => {
    expect(
      expandClosureDateRange({ dateFrom: '2026-12-26', dateTo: '2026-12-24' }),
    ).toEqual([]);
  });

  it('refuses an absurd range outright rather than truncating it', () => {
    // holiday_mode is T3 and blocks all booking. A mis-parsed year must not
    // close a decade — and it must not close a *truncated* span either, because
    // a business open on a day it believes it is closed is the worse failure.
    expect(
      expandClosureDateRange({ dateFrom: '2026-01-01', dateTo: '2030-01-01' }),
    ).toEqual([]);
  });

  it('accepts a single-day range', () => {
    expect(
      expandClosureDateRange({ dateFrom: '2026-12-25', dateTo: '2026-12-25' }),
    ).toEqual(['2026-12-25']);
  });

  it('spans a month and a year boundary', () => {
    expect(
      expandClosureDateRange({ dateFrom: '2026-12-31', dateTo: '2027-01-02' }),
    ).toEqual(['2026-12-31', '2027-01-01', '2027-01-02']);
  });
});
